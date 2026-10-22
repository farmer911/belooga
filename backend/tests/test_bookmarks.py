"""TDD Unit, Integration, Privacy & IDOR Tests for Candidate Shortlist Bookmarks (BEL-145)."""

import time
import pytest
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
async def test_bookmarks_unauthenticated_guards(
    client: AsyncClient,
    test_candidate_b: dict,
):
    """Verify unauthenticated requests to /v1/bookmarks/* are rejected with 401."""
    get_res = await client.get("/v1/bookmarks/")
    assert get_res.status_code == 401

    post_res = await client.post(f"/v1/bookmarks/{test_candidate_b['username']}/")
    assert post_res.status_code == 401

    del_res = await client.delete(f"/v1/bookmarks/{test_candidate_b['username']}/")
    assert del_res.status_code == 401


@pytest.mark.asyncio
async def test_bookmarks_crud_idempotency_privacy_and_idor_isolation(
    client: AsyncClient,
    test_candidate_a: dict,
    test_candidate_b: dict,
    db_session: AsyncSession,
):
    """
    BEL-145: Verify full CRUD lifecycle for /v1/bookmarks/, Design #64 metadata contract,
    UNIQUE(recruiter_identity_id, candidate_profile_id) idempotency, is_hidden=TRUE 404 guard,
    and strict IDOR isolation between recruiters.
    """
    headers_a = {"Authorization": f"Bearer {test_candidate_a['token']}"}
    headers_b = {"Authorization": f"Bearer {test_candidate_b['token']}"}
    target_username = test_candidate_b["username"]

    # Enrich candidate B profile metadata to verify Design #64 fields
    await db_session.execute(
        text(
            """
            UPDATE candidate_profiles
            SET headline = 'Principal Distributed Systems Engineer',
                location = 'Seattle, WA',
                seeking_status = 'Actively Looking',
                avatar_url = '/images/avatar.jpg',
                is_hidden = FALSE
            WHERE id = :pid
            """
        ),
        {"pid": test_candidate_b["profile_id"]},
    )
    await db_session.commit()

    # 1. Initial bookmark list for User A is empty
    init_res = await client.get("/v1/bookmarks/", headers=headers_a)
    assert init_res.status_code == 200
    assert init_res.json() == []

    # 2. Bookmarking a hidden profile ('hidden_jane') or unknown profile returns 404
    hidden_res = await client.post("/v1/bookmarks/hidden_jane/", headers=headers_a)
    assert hidden_res.status_code == 404

    missing_res = await client.post("/v1/bookmarks/non_existent_candidate_999/", headers=headers_a)
    assert missing_res.status_code == 404

    # 3. User A bookmarks Candidate B with a note
    create_res = await client.post(
        f"/v1/bookmarks/{target_username}/",
        json={"note": "Strong Rust + PostgreSQL background"},
        headers=headers_a,
    )
    assert create_res.status_code in (200, 201)
    created = create_res.json()
    assert created["username"] == target_username
    assert created["full_name"] == "Bob Tester"
    assert created["headline"] == "Principal Distributed Systems Engineer"
    assert created["location"] == "Seattle, WA"
    assert created["seeking_status"] == "Actively Looking"
    assert created["avatar_url"] == "/images/avatar.jpg"
    assert created["note"] == "Strong Rust + PostgreSQL background"
    assert created["recruiter_identity_id"] == str(test_candidate_a["id"])
    assert created["candidate_profile_id"] == str(test_candidate_b["profile_id"])
    assert created["id"]
    assert created["created_at"]

    # 4. Idempotent upsert: bookmarking same candidate again updates note cleanly without 500 error
    upsert_res = await client.post(
        f"/v1/bookmarks/{target_username}/",
        json={"note": "Top shortlist finalist for Q4"},
        headers=headers_a,
    )
    assert upsert_res.status_code in (200, 201)
    assert upsert_res.json()["id"] == created["id"]
    assert upsert_res.json()["note"] == "Top shortlist finalist for Q4"

    # 5. GET /v1/bookmarks/ returns enriched list for User A
    list_a = await client.get("/v1/bookmarks/", headers=headers_a)
    assert list_a.status_code == 200
    items_a = list_a.json()
    assert len(items_a) == 1
    assert items_a[0]["username"] == target_username
    assert items_a[0]["note"] == "Top shortlist finalist for Q4"

    # 6. IDOR Isolation: User B cannot see User A's bookmarks or delete User A's bookmark
    list_b = await client.get("/v1/bookmarks/", headers=headers_b)
    assert list_b.status_code == 200
    assert list_b.json() == []

    idor_del = await client.delete(f"/v1/bookmarks/{target_username}/", headers=headers_b)
    assert idor_del.status_code == 404

    # Verify User A's bookmark still intact after User B's failed delete attempt
    verify_a = await client.get("/v1/bookmarks/", headers=headers_a)
    assert len(verify_a.json()) == 1

    # 7. Dynamic Privacy Enforcement: If Candidate B sets is_hidden=TRUE, they disappear from shortlist
    patch_hide = await client.patch(
        f"/v1/profile/{target_username}",
        json={"is_hidden": True},
        headers=headers_b,
    )
    assert patch_hide.status_code == 200

    list_after_hide = await client.get("/v1/bookmarks/", headers=headers_a)
    assert list_after_hide.status_code == 200
    assert list_after_hide.json() == []

    # Unhide Candidate B -> reappears in User A's shortlist
    patch_unhide = await client.patch(
        f"/v1/profile/{target_username}",
        json={"is_hidden": False},
        headers=headers_b,
    )
    assert patch_unhide.status_code == 200

    list_after_unhide = await client.get("/v1/bookmarks/", headers=headers_a)
    assert list_after_unhide.status_code == 200
    assert len(list_after_unhide.json()) == 1

    # 8. User A deletes the bookmark -> 200/204, subsequent GET returns [] and duplicate DELETE returns 404
    del_res = await client.delete(f"/v1/bookmarks/{target_username}/", headers=headers_a)
    assert del_res.status_code in (200, 204)

    final_list = await client.get("/v1/bookmarks/", headers=headers_a)
    assert final_list.status_code == 200
    assert final_list.json() == []

    del_again = await client.delete(f"/v1/bookmarks/{target_username}/", headers=headers_a)
    assert del_again.status_code == 404


@pytest.mark.asyncio
async def test_bookmarks_p95_latency_and_singleflight_cache_benchmark(
    client: AsyncClient,
    test_candidate_a: dict,
    test_candidate_b: dict,
):
    """BEL-149: Verify single-roundtrip SQL + Singleflight SWR cache achieves p95 < 30ms."""
    headers_a = {"Authorization": f"Bearer {test_candidate_a['token']}"}
    target_username = test_candidate_b["username"]

    post_res = await client.post(
        f"/v1/bookmarks/{target_username}/",
        json={"note": "BEL-149 latency benchmark"},
        headers=headers_a,
    )
    assert post_res.status_code in (200, 201)

    latencies_ms: list[float] = []
    for _ in range(20):
        t0 = time.perf_counter()
        res = await client.get("/v1/bookmarks/", headers=headers_a)
        latencies_ms.append((time.perf_counter() - t0) * 1000.0)
        assert res.status_code == 200
        assert len(res.json()) == 1

    latencies_ms.sort()
    p95_ms = latencies_ms[int(len(latencies_ms) * 0.95) - 1]
    assert p95_ms < 30.0, f"Expected p95 < 30ms, got {p95_ms:.2f}ms"

    del_res = await client.delete(f"/v1/bookmarks/{target_username}/", headers=headers_a)
    assert del_res.status_code in (200, 204)

