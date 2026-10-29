"""Integration & Security Tests for BEL-520: Production Readiness Full Suite."""

import pytest
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from tests.payments_support import configure_momo, pay_review_order, signed_ipn


@pytest.mark.asyncio
async def test_momo_hmac_signature_rejection_and_valid_verification(
    client: AsyncClient, test_candidate_a: dict, monkeypatch: pytest.MonkeyPatch
):
    """MoMo IPN rejects tampered HMAC signatures with 400 and accepts a valid HMAC-SHA256 signature."""
    configure_momo(monkeypatch)
    res_create = await client.post(
        "/v1/payments/momo/create-qr",
        json={"package_type": "MICRO_PASS_59K", "order_info": "ATS Full Pass"},
        headers={"Authorization": f"Bearer {test_candidate_a['token']}"},
    )
    assert res_create.status_code == 201
    order_id = res_create.json()["order_id"]

    res_bad = await client.post("/v1/payments/momo/ipn", json={**signed_ipn(order_id, 59000), "signature": "f" * 64})
    assert res_bad.status_code == 400
    res_good = await client.post("/v1/payments/momo/ipn", json=signed_ipn(order_id, 59000))
    assert res_good.status_code == 204


@pytest.mark.asyncio
async def test_email_verification_token_issuance_and_verification(
    client: AsyncClient, test_candidate_a: dict, db_session: AsyncSession
):
    """Verify email verification token issuance in email_verification_tokens and single-use verification."""
    headers = {"Authorization": f"Bearer {test_candidate_a['token']}"}

    # 1. Request email verification token
    req_res = await client.post("/v1/auth/verify-email/request/", headers=headers)
    assert req_res.status_code == 200
    token = req_res.json().get("verification_token")
    assert token

    # Verify token exists in email_verification_tokens table
    cnt_res = await db_session.execute(
        text("SELECT COUNT(*) FROM email_verification_tokens WHERE identity_id = :uid"),
        {"uid": test_candidate_a["id"]},
    )
    assert (cnt_res.scalar() or 0) >= 1

    # 2. Verify email using the issued token
    ver_res = await client.post("/v1/auth/verify-email/", json={"token": token})
    assert ver_res.status_code == 200
    assert ver_res.json()["verified"] is True

    # 3. Replay of used verification token must fail with 400
    replay_res = await client.post("/v1/auth/verify-email/", json={"token": token})
    assert replay_res.status_code == 400


@pytest.mark.asyncio
async def test_timeline_patch_and_awards_languages_interests_crud(
    client: AsyncClient, test_candidate_a: dict
):
    """Verify PATCH on Job/Education, Awards CRUD, and Languages/Interests CRUD."""
    username = test_candidate_a["username"]
    headers = {"Authorization": f"Bearer {test_candidate_a['token']}"}

    # 1. Create & PATCH Job Experience
    c_job = await client.post(
        f"/v1/profile/{username}/job-experiences/",
        json={"title": "Backend Dev", "company_name": "Acme", "from_date_year": 2021},
        headers=headers,
    )
    assert c_job.status_code == 201
    job_id = c_job.json()["id"]

    u_job = await client.patch(
        f"/v1/profile/{username}/job-experiences/{job_id}/",
        json={"title": "Principal Distributed Systems Engineer", "company_name": "Acme Cloud"},
        headers=headers,
    )
    assert u_job.status_code == 200
    jobs_list = (await client.get(f"/v1/profile/{username}/job-experiences/")).json()
    assert any(j["id"] == job_id and j["title"] == "Principal Distributed Systems Engineer" for j in jobs_list)

    # 2. Create & PATCH Education Experience
    c_edu = await client.post(
        f"/v1/profile/{username}/education/",
        json={"school_name": "MIT", "degree_name": "B.S. CS", "gpa": "3.7"},
        headers=headers,
    )
    assert c_edu.status_code == 201
    edu_id = c_edu.json()["id"]

    u_edu = await client.patch(
        f"/v1/profile/{username}/education/{edu_id}/",
        json={"degree_name": "M.Eng. Computer Science", "gpa": "4.0"},
        headers=headers,
    )
    assert u_edu.status_code == 200
    edu_list = (await client.get(f"/v1/profile/{username}/education/")).json()
    assert any(e["id"] == edu_id and e["gpa"] == "4.0" for e in edu_list)

    # 3. Awards & Certifications CRUD
    c_awd = await client.post(
        f"/v1/profile/{username}/awards/",
        json={"title": "ACM ICPC Regional Winner", "location_name": "Hanoi", "from_date_year": 2023},
        headers=headers,
    )
    assert c_awd.status_code == 201
    award_id = c_awd.json()["id"]

    awd_list = (await client.get(f"/v1/profile/{username}/awards/")).json()
    assert any(a["id"] == award_id and a["title"] == "ACM ICPC Regional Winner" for a in awd_list)

    d_awd = await client.delete(f"/v1/profile/{username}/awards/{award_id}/", headers=headers)
    assert d_awd.status_code == 200

    # 4. Languages & Interests CRUD
    add_lang = await client.post(
        f"/v1/profile/{username}/languages/",
        json={"name": "Japanese", "proficiency": "JLPT N2"},
        headers=headers,
    )
    assert add_lang.status_code == 200

    add_int = await client.post(
        f"/v1/profile/{username}/interests/",
        json={"name": "Open Source Kernel"},
        headers=headers,
    )
    assert add_int.status_code == 200

    prof = (await client.get(f"/v1/profile/{username}", headers=headers)).json()
    assert any(l["name"] == "Japanese" and l["proficiency"] == "JLPT N2" for l in prof["languages"])
    assert "Open Source Kernel" in prof["interests"]

    del_lang = await client.delete(f"/v1/profile/{username}/languages/Japanese/", headers=headers)
    assert del_lang.status_code == 200
    del_int = await client.delete(f"/v1/profile/{username}/interests/Open%20Source%20Kernel/", headers=headers)
    assert del_int.status_code == 200


@pytest.mark.asyncio
async def test_expert_feedback_submission_and_analytics_db_revenue(
    client: AsyncClient, test_candidate_a: dict,
    test_admin: dict,
    test_expert: dict,
    monkeypatch: pytest.MonkeyPatch,
):
    """Verify Expert Feedback submission transitions order to completed and updates Analytics DB ledger."""
    client.headers.update(test_admin["headers"])
    headers = {"Authorization": f"Bearer {test_candidate_a['token']}"}

    # 1. Create and checkout an order
    c_ord = await client.post(
        "/v1/expert-review/orders/",
        json={
            "package_slug": "elite",
            "resume_url": "/uploads/resumes/elite_cv.pdf",
            "target_role": "Staff AI Infrastructure Engineer",
        },
        headers=headers,
    )
    assert c_ord.status_code == 201
    order_id = c_ord.json()["id"]

    await pay_review_order(client, test_candidate_a["token"], order_id, monkeypatch)
    await test_expert["assign"](order_id)

    # 2. Submit structured Expert Review Feedback
    fb_payload = {
        "score_overall": 96,
        "score_ats_compatibility": 98,
        "score_impact_action_verbs": 94,
        "score_structure_formatting": 95,
        "summary_verdict": "Exceptional distributed training & vLLM throughput metrics.",
        "strengths": ["Quantified GPU cluster utilization gains", "Clean system architecture narrative"],
        "improvements": ["Highlight multi-region failover SLA in summary"],
    }
    own = await client.post(f"/v1/expert-review/orders/{order_id}/feedback/", json=fb_payload, headers=headers)
    assert own.status_code == 403  # buyers cannot review their own order
    sub_res = await client.post(
        f"/v1/expert-review/orders/{order_id}/feedback/",
        json=fb_payload,
        headers=test_expert["headers"],
    )
    assert sub_res.status_code == 200
    fb_data = sub_res.json()
    assert fb_data["score_overall"] == 96
    assert "vLLM throughput" in fb_data["summary_verdict"]

    # 3. Buyer accepts the delivered review -> completed
    accept = await client.post(f"/v1/expert-review/orders/{order_id}/complete", json={}, headers=headers)
    assert accept.status_code == 200
    orders = (await client.get("/v1/expert-review/orders/my-orders/", headers=headers)).json()
    target_ord = next(o for o in orders if o["id"] == order_id)
    assert target_ord["order_status"] == "completed"

    # 4. Verify Executive Analytics Dashboard includes real DB revenue / order telemetry
    dash = (await client.get("/v1/analytics/dashboard")).json()
    assert dash["overview"]["total_gmv"] > 0
    assert len(dash["recent_transactions"]) >= 1
