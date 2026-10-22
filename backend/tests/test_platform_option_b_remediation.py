import uuid
import pytest
from httpx import AsyncClient


async def _register_and_token(client: AsyncClient, prefix: str = "optb") -> tuple[str, str, dict[str, str]]:
    uid = uuid.uuid4().hex[:8]
    username = f"{prefix}_{uid}"
    email = f"{username}@belooga.com"
    res = await client.post(
        "/v1/users/register/",
        json={
            "email": email,
            "username": username,
            "password": "Password123!",
            "first_name": "OptB",
            "last_name": "Tester",
        },
    )
    assert res.status_code in (200, 201)
    user_id = res.json()["user"]["id"]
    login_res = await client.post("/v1/auth/login/", json={"email": email, "password": "Password123!"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    return username, user_id, {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_awards_update_reorder_and_hidden_profile_guards(client: AsyncClient):
    username, _, headers = await _register_and_token(client, "award_user")

    c1 = await client.post(
        f"/v1/profile/{username}/awards/",
        json={"title": "First Prize", "issuer": "ACM", "issue_year": 2024, "description": "Initial"},
        headers=headers,
    )
    c2 = await client.post(
        f"/v1/profile/{username}/awards/",
        json={"title": "Second Prize", "issuer": "IEEE", "issue_year": 2025, "description": "Second"},
        headers=headers,
    )
    assert c1.status_code in (200, 201)
    assert c2.status_code in (200, 201)
    id1, id2 = c1.json()["id"], c2.json()["id"]

    upd = await client.patch(
        f"/v1/profile/{username}/awards/{id1}/",
        json={"title": "Grand Champion", "issuer": "ACM ICPC"},
        headers=headers,
    )
    assert upd.status_code == 200
    assert upd.json()["title"] == "Grand Champion"

    reord = await client.post(
        f"/v1/profile/{username}/awards/order/",
        json={"orders": [{"id": id2, "order": 0}, {"id": id1, "order": 1}]},
        headers=headers,
    )
    assert reord.status_code == 200

    # Hide profile and verify timeline & cv-draft privacy guards
    hide_res = await client.patch(f"/v1/profile/{username}", json={"is_hidden": True}, headers=headers)
    assert hide_res.status_code == 200

    for sub in ("job-experiences/", "education/", "awards/", "cv-draft/"):
        anon_res = await client.get(f"/v1/profile/{username}/{sub}")
        assert anon_res.status_code == 404
        owner_res = await client.get(f"/v1/profile/{username}/{sub}", headers=headers)
        assert owner_res.status_code == 200


@pytest.mark.asyncio
async def test_job_tracker_patch_and_idor_isolation(client: AsyncClient):
    _, _, headers_a = await _register_and_token(client, "tracker_a")
    _, _, headers_b = await _register_and_token(client, "tracker_b")

    created = await client.post(
        "/v1/tracker/jobs/",
        json={
            "company_name": "VNG Corp",
            "position_title": "Backend Engineer",
            "expected_salary": "45M VND",
            "match_score": 82,
            "status": "TARGETING",
            "notes": "Initial note",
        },
        headers=headers_a,
    )
    assert created.status_code in (200, 201)
    job_id = created.json()["id"]

    patched = await client.patch(
        f"/v1/tracker/jobs/{job_id}",
        json={"company_name": "ZaloPay", "expected_salary": "55M VND", "notes": "Updated after interview"},
        headers=headers_a,
    )
    assert patched.status_code == 200
    assert patched.json()["company_name"] == "ZaloPay"
    assert patched.json()["expected_salary"] == "55M VND"

    # User B cannot patch User A's job
    forbidden = await client.patch(
        f"/v1/tracker/jobs/{job_id}",
        json={"company_name": "Hacked"},
        headers=headers_b,
    )
    assert forbidden.status_code == 403


@pytest.mark.asyncio
async def test_ats_history_and_catalogs_normalization(client: AsyncClient):
    _, _, headers = await _register_and_token(client, "ats_hist")

    scan_res = await client.post(
        "/v1/match/ats-scan",
        json={
            "cv_text": "Senior Python FastAPI PostgreSQL Kubernetes Engineer with 5 years experience reducing p95 latency by 45%.",
            "jd_text": "Looking for Senior Backend Engineer skilled in Python, FastAPI, PostgreSQL, Docker, Kubernetes.",
            "job_title": "Senior Backend Engineer",
        },
        headers=headers,
    )
    assert scan_res.status_code == 200

    hist_res = await client.get("/v1/match/history", headers=headers)
    assert hist_res.status_code == 200
    assert isinstance(hist_res.json(), list)
    assert len(hist_res.json()) >= 1

    sal_res = await client.get(
        "/v1/catalogs/salary-benchmark",
        params={"role": "React / Frontend", "level": "Mid-Level", "city": "Ho Chi Minh"},
    )
    assert sal_res.status_code == 200
    assert sal_res.json()["level"] == "Mid"

    loc_res = await client.get("/v1/profile/location/", params={"name": "Ho"})
    assert loc_res.status_code == 200
    assert len(loc_res.json()) >= 1


@pytest.mark.asyncio
async def test_ats_tailor_cv_and_enriched_history(client: AsyncClient):
    _, _, headers = await _register_and_token(client, "ats_tailor")

    req_payload = {
        "job_title": "Senior Backend Architect",
        "company_name": "Belooga Cloud",
        "jd_text": "Required skills: Golang, Kubernetes, PostgreSQL, Kafka, Redis, Docker.",
        "cv_text": "Worked on Python backend systems and helped maintain servers for clients.",
    }
    base_scan = await client.post("/v1/match/ats-scan", json=req_payload, headers=headers)
    assert base_scan.status_code == 200
    base_score = base_scan.json()["ats_score"]

    tailor_res = await client.post("/v1/match/tailor-cv", json=req_payload, headers=headers)
    assert tailor_res.status_code == 200
    t_data = tailor_res.json()
    assert "tailored_cv_text" in t_data
    assert "Kubernetes" in t_data["tailored_cv_text"]
    assert "Kafka" in t_data["tailored_cv_text"]
    assert t_data["scan_result"]["ats_score"] > base_score
    assert "Kubernetes" in t_data["scan_result"]["matched_skills"]

    hist_res = await client.get("/v1/match/history", headers=headers)
    assert hist_res.status_code == 200
    latest = hist_res.json()[0]
    assert "matched_skills" in latest
    assert "missing_skills" in latest
    assert "Kubernetes" in latest["matched_skills"]


@pytest.mark.asyncio
async def test_location_aware_salary_benchmark_and_recruiter_inquiry_notification(client: AsyncClient):
    username, _, headers = await _register_and_token(client, "recruiter_notif")

    hcm_res = await client.get(
        "/v1/catalogs/salary-benchmark",
        params={"role": "Golang Backend", "level": "Senior", "location": "Ho Chi Minh"},
    )
    dn_res = await client.get(
        "/v1/catalogs/salary-benchmark",
        params={"role": "Golang Backend", "level": "Senior", "location": "Da Nang"},
    )
    rem_res = await client.get(
        "/v1/catalogs/salary-benchmark",
        params={"role": "Golang Backend", "level": "Senior", "location": "Remote"},
    )
    assert hcm_res.status_code == 200
    assert dn_res.status_code == 200
    assert rem_res.status_code == 200

    p50_hcm = hcm_res.json()["p50_salary_vnd"]
    p50_dn = dn_res.json()["p50_salary_vnd"]
    p50_rem = rem_res.json()["p50_salary_vnd"]
    assert p50_dn < p50_hcm < p50_rem

    contact_res = await client.post(
        "/v1/contact/",
        json={
            "name": "Sarah Jenkins (VP Engineering)",
            "email": "sarah@stripe.com",
            "message": f"[Inquiry for @{username}] Hi @{username}, we loved your 30s pitch and want to schedule a Staff Engineer interview.",
        },
    )
    assert contact_res.status_code in (200, 201)

    notif_res = await client.get("/v1/notifications/", headers=headers)
    assert notif_res.status_code == 200
    items = notif_res.json()["items"]
    assert any(n["event_type"] == "RECRUITER_INQUIRY" and "Sarah Jenkins" in n["title"] for n in items)

