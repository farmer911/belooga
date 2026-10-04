import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


@pytest.mark.asyncio
async def test_reorder_job_experiences_success_without_transaction_error(
    client: AsyncClient,
    test_candidate_a: dict,
    db_session: AsyncSession
):
    """
    CRITICAL REGRESSION TEST (§2.3):
    Proves that POST /profile/{username}/job-experiences/order/
    with an authenticated session does NOT throw:
    'sqlalchemy.exc.InvalidRequestError: A transaction is already begun on this Session'
    and successfully reorders the records.
    """
    username = test_candidate_a["username"]
    token = test_candidate_a["token"]
    pid = test_candidate_a["profile_id"]

    # Seed 3 job experiences
    job_ids = [uuid.uuid4(), uuid.uuid4(), uuid.uuid4()]
    for i, jid in enumerate(job_ids):
        await db_session.execute(
            text("""
                INSERT INTO job_experiences (
                    id, profile_id, title, company_name, from_date_month, from_date_year,
                    currently_work_here, display_order
                ) VALUES (
                    :id, :pid, :title, 'Test Corp', 1, 2022, TRUE, :ord
                )
            """),
            {"id": jid, "pid": pid, "title": f"Job {i}", "ord": i}
        )
    await db_session.commit()

    # Reorder payload reversing the order
    reorder_payload = {
        "orders": [
            {"id": str(job_ids[0]), "order": 2},
            {"id": str(job_ids[1]), "order": 1},
            {"id": str(job_ids[2]), "order": 0},
        ]
    }

    headers = {"Authorization": f"Bearer {token}"}
    response = await client.post(
        f"/v1/profile/{username}/job-experiences/order/",
        json=reorder_payload,
        headers=headers
    )

    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}: {response.text}"
    data = response.json()
    assert "reordered successfully" in data.get("message", "")

    # Verify order in database
    res = await db_session.execute(
        text("SELECT id, display_order FROM job_experiences WHERE profile_id = :pid ORDER BY display_order ASC"),
        {"pid": pid}
    )
    rows = res.fetchall()
    assert len(rows) == 3
    assert rows[0].id == job_ids[2]
    assert rows[0].display_order == 0
    assert rows[1].id == job_ids[1]
    assert rows[1].display_order == 1
    assert rows[2].id == job_ids[0]
    assert rows[2].display_order == 2


@pytest.mark.asyncio
async def test_reorder_education_experiences_success(
    client: AsyncClient,
    test_candidate_a: dict,
    db_session: AsyncSession
):
    """
    Test education reordering works without transaction conflict.
    """
    username = test_candidate_a["username"]
    token = test_candidate_a["token"]
    pid = test_candidate_a["profile_id"]

    edu_ids = [uuid.uuid4(), uuid.uuid4()]
    for i, eid in enumerate(edu_ids):
        await db_session.execute(
            text("""
                INSERT INTO education_experiences (
                    id, profile_id, school_name, degree_name, from_date_month, from_date_year,
                    currently_work_here, display_order
                ) VALUES (
                    :id, :pid, 'Stanford', 'BSc CS', 9, 2018, FALSE, :ord
                )
            """),
            {"id": eid, "pid": pid, "ord": i}
        )
    await db_session.commit()

    reorder_payload = {
        "orders": [
            {"id": str(edu_ids[0]), "order": 1},
            {"id": str(edu_ids[1]), "order": 0},
        ]
    }

    headers = {"Authorization": f"Bearer {token}"}
    response = await client.post(
        f"/v1/profile/{username}/education/order/",
        json=reorder_payload,
        headers=headers
    )

    assert response.status_code == 200
    assert "reordered successfully" in response.json().get("message", "")
