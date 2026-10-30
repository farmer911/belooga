"""Tests for Domain 12: Enterprise Notifications, Preferences & Email Deep-Link Engine."""

import pytest
from httpx import AsyncClient
from tests.payments_support import pay_review_order
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.notifications import NotificationService


@pytest.mark.asyncio
async def test_notification_preferences_and_email_deeplink_engine(
    client: AsyncClient,
    test_candidate_a: dict,
    test_candidate_b: dict,
    db_session: AsyncSession,
):
    """
    BEL-506: Verify notification_preferences CRUD, email deep-link outbox generation,
    open-redirect sanitization, and IDOR guard on marking notifications read.
    """
    headers_a = {"Authorization": f"Bearer {test_candidate_a['token']}"}
    headers_b = {"Authorization": f"Bearer {test_candidate_b['token']}"}
    uid_a = test_candidate_a["id"]

    # 1. Get default notification preferences
    pref_res = await client.get("/v1/notifications/preferences/", headers=headers_a)
    assert pref_res.status_code == 200
    prefs = pref_res.json()
    assert prefs["email_security_alerts"] is True
    assert prefs["email_order_updates"] is True
    assert prefs["email_career_matches"] is True
    assert prefs["in_app_enabled"] is True

    # 2. Disable career match emails via PATCH /v1/notifications/preferences/
    patch_pref = await client.patch(
        "/v1/notifications/preferences/",
        json={"email_career_matches": False},
        headers=headers_a,
    )
    assert patch_pref.status_code == 200
    assert patch_pref.json()["email_career_matches"] is False

    # 3. Dispatch an order notification (email_order_updates=True -> email_sent=True + deep-link URL)
    svc = NotificationService(db_session)
    n1 = await svc.dispatch_event(
        identity_id=uid_a,
        recipient_email=test_candidate_a["email"],
        event_type="EXPERT_REVIEW_ORDERED",
        title="Expert CV Review Confirmed",
        message="Your CV review order is confirmed.",
        deep_link="/expert-review?order_id=ord_123",
        send_email=True,
        category="order",
    )
    assert n1["email_sent"] is True
    assert n1["email_deeplink_url"] == "http://localhost:3000/expert-review?order_id=ord_123"

    # 4. Dispatch a career notification (email_career_matches=False -> suppressed email, kept in-app)
    n2 = await svc.dispatch_event(
        identity_id=uid_a,
        recipient_email=test_candidate_a["email"],
        event_type="JOB_INTERVIEW_STAGE",
        title="Interview Stage Reached",
        message="Prepare your pitch with AI Interview Kit.",
        deep_link="https://evil-phishing.com/steal",  # Open-redirect attack attempt!
        send_email=True,
        category="career",
    )
    assert n2["email_sent"] is False
    assert n2["deep_link"] == "/"  # Sanitized by Open-Redirect guard

    # 5. List notifications via GET /v1/notifications/
    list_res = await client.get("/v1/notifications/", headers=headers_a)
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["unread_count"] >= 2
    assert len(list_data["items"]) >= 2

    # 6. IDOR check: User B cannot mark User A's notification as read
    idor_res = await client.patch(
        f"/v1/notifications/{n1['id']}/read/",
        headers=headers_b,
    )
    assert idor_res.status_code == 404

    # 7. User A marks single notification read, then marks all read
    read_one = await client.patch(
        f"/v1/notifications/{n1['id']}/read/",
        headers=headers_a,
    )
    assert read_one.status_code == 200
    assert read_one.json()["is_read"] is True

    read_all = await client.post("/v1/notifications/read-all/", headers=headers_a)
    assert read_all.status_code == 200
    assert read_all.json()["unread_count"] == 0


@pytest.mark.asyncio
async def test_domain_event_triggers_create_notifications_and_email_deeplinks(
    client: AsyncClient,
    test_candidate_a: dict,
    monkeypatch: pytest.MonkeyPatch,
):
    """
    BEL-507: Verify that domain mutations (Auth password recovery, Expert CV Review order & checkout,
    and Job Tracker INTERVIEW stage) automatically emit notifications with email deep-links.
    """
    headers_a = {"Authorization": f"Bearer {test_candidate_a['token']}"}

    # 1. Trigger Forgot Password -> should emit AUTH_PASSWORD_RESET with deep_link="/forgot-password?token=..."
    fp_res = await client.post(
        "/v1/auth/forgot-password/",
        json={"email": test_candidate_a["email"]},
    )
    assert fp_res.status_code == 200

    # 2. Trigger Expert Review Order & Checkout -> should emit EXPERT_REVIEW_ORDERED and EXPERT_ORDER_PAID
    ord_res = await client.post(
        "/v1/expert-review/orders/",
        json={
            "package_slug": "pro",
            "resume_url": "https://belooga.com/cv/test.pdf",
            "target_role": "Staff Backend Engineer",
            "target_companies": "Stripe",
        },
        headers=headers_a,
    )
    assert ord_res.status_code == 201
    order_id = ord_res.json()["id"]

    await pay_review_order(client, test_candidate_a["token"], order_id, monkeypatch)

    # 3. Trigger Job Tracker move to INTERVIEW -> should emit JOB_INTERVIEW_STAGE
    job_res = await client.post(
        "/v1/tracker/jobs/",
        json={
            "company_name": "Anthropic",
            "position_title": "AI Systems Engineer",
            "status": "APPLIED",
            "match_score": 92,
        },
        headers=headers_a,
    )
    assert job_res.status_code == 201
    job_id = job_res.json()["id"]

    move_res = await client.patch(
        f"/v1/tracker/jobs/{job_id}/status",
        json={"status": "INTERVIEW"},
        headers=headers_a,
    )
    assert move_res.status_code == 200

    # 4. Verify all emitted notifications and their deep-links via GET /v1/notifications/
    notif_res = await client.get("/v1/notifications/", headers=headers_a)
    assert notif_res.status_code == 200
    items = notif_res.json()["items"]
    event_types = {item["event_type"]: item for item in items}

    assert "AUTH_PASSWORD_RESET" in event_types
    assert event_types["AUTH_PASSWORD_RESET"]["deep_link"].startswith("/forgot-password?token=")
    assert event_types["AUTH_PASSWORD_RESET"]["email_sent"] is True

    assert "EXPERT_REVIEW_ORDERED" in event_types
    assert f"order_id={order_id}" in event_types["EXPERT_REVIEW_ORDERED"]["deep_link"]

    assert "EXPERT_ORDER_PAID" in event_types
    assert event_types["EXPERT_ORDER_PAID"]["email_sent"] is True

    assert "JOB_INTERVIEW_STAGE" in event_types
    assert f"highlight={job_id}" in event_types["JOB_INTERVIEW_STAGE"]["deep_link"]


@pytest.mark.asyncio
async def test_password_change_notification_and_bell_contract(
    client: AsyncClient,
):
    """
    BEL-508: Verify runtime password rotation notification (/user/{username}/settings deep-link)
    and Header NotificationBell / NotificationPreferencesCard contract.
    """
    from pathlib import Path
    import uuid

    suffix = uuid.uuid4().hex[:6]
    username_a = f"notif_usr_{suffix}"
    reg_res = await client.post(
        "/v1/users/register/",
        json={
            "email": f"{username_a}@belooga.com",
            "username": username_a,
            "password": "TestPassword123!",
            "first_name": "Notif",
            "last_name": "Tester",
        },
    )
    assert reg_res.status_code == 201
    headers_a = {"Authorization": f"Bearer {reg_res.json()['access_token']}"}

    pw_res = await client.post(
        f"/v1/users/{username_a}/password/",
        json={
            "current_password": "TestPassword123!",
            "new_password": "NewSecurePassword456!",
        },
        headers=headers_a,
    )
    assert pw_res.status_code == 200

    notif_res = await client.get("/v1/notifications/", headers=headers_a)
    assert notif_res.status_code == 200
    items = notif_res.json()["items"]
    pw_notif = next((i for i in items if i["event_type"] == "AUTH_PASSWORD_CHANGED"), None)
    assert pw_notif is not None
    assert pw_notif["deep_link"] == f"/user/{username_a}/settings"
    assert pw_notif["email_sent"] is True

    root = Path(__file__).resolve().parents[2]
    assert (root / "frontend/src/components/layout/notification-bell.tsx").exists()
    assert (root / "frontend/src/components/features/profile/notification-preferences-card.tsx").exists()



