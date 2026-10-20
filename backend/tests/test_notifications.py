"""Tests for Domain 12: Enterprise Notifications, Preferences & Email Deep-Link Engine."""

import pytest
from httpx import AsyncClient
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
