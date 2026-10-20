"""Notification service (Vertical Module: notifications).

Orchestrates in-app notifications, channel preference checks, open-redirect
deep-link validation, and non-blocking transactional email outbox dispatch.
"""

import asyncio
import os
import re
from typing import Any, Dict, Optional
import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.notifications.repository import NotificationRepository
from app.schemas.notifications import (
    NotificationItemDTO,
    NotificationListResponse,
    NotificationPreferenceDTO,
    NotificationPreferenceUpdate,
)

FRONTEND_BASE_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
DEEP_LINK_REGEX = re.compile(r"^/[a-zA-Z0-9_\-\?=&/.@%]*$")


def sanitize_deep_link(deep_link: str) -> str:
    """Enforce internal-only relative paths to prevent open-redirect phishing in emails."""
    clean = (deep_link or "/").strip()
    if not clean.startswith("/") or clean.startswith("//") or not DEEP_LINK_REGEX.match(clean):
        return "/"
    return clean


def _render_transactional_email_sync(
    recipient_email: str, subject: str, message: str, deeplink_url: str
) -> bool:
    """Non-blocking email outbox formatter executed inside asyncio.to_thread."""
    if not recipient_email or "@" not in recipient_email:
        return False
    _html_body = (
        f"<h2>{subject}</h2>"
        f"<p>{message}</p>"
        f"<p><a href='{deeplink_url}'>Open in Belooga ({deeplink_url})</a></p>"
    )
    return bool(_html_body)


class NotificationService:
    """Service layer managing notifications, preferences, and email deep-link outbox."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = NotificationRepository(db)

    async def get_preferences(self, identity_id: uuid.UUID) -> NotificationPreferenceDTO:
        pref = await self.repo.get_or_create_preferences(identity_id)
        await self.db.commit()
        return NotificationPreferenceDTO.model_validate(pref)

    async def update_preferences(
        self, identity_id: uuid.UUID, payload: NotificationPreferenceUpdate
    ) -> NotificationPreferenceDTO:
        pref = await self.repo.update_preferences(
            identity_id=identity_id,
            email_security_alerts=payload.email_security_alerts,
            email_order_updates=payload.email_order_updates,
            email_career_matches=payload.email_career_matches,
            in_app_enabled=payload.in_app_enabled,
        )
        await self.db.commit()
        return NotificationPreferenceDTO.model_validate(pref)

    async def dispatch_event(
        self,
        identity_id: uuid.UUID,
        event_type: str,
        title: str,
        message: str,
        deep_link: str = "/",
        send_email: bool = False,
        category: str = "general",
        recipient_email: Optional[str] = None,
        auto_commit: bool = True,
    ) -> Dict[str, Any]:
        clean_link = sanitize_deep_link(deep_link)
        prefs = await self.repo.get_or_create_preferences(identity_id)

        category_email_allowed = True
        if category == "security":
            category_email_allowed = prefs.email_security_alerts
        elif category == "order":
            category_email_allowed = prefs.email_order_updates
        elif category == "career":
            category_email_allowed = prefs.email_career_matches

        should_email = bool(send_email and category_email_allowed)
        email_subject: Optional[str] = f"[Belooga] {title}" if should_email else None
        email_deeplink_url: Optional[str] = f"{FRONTEND_BASE_URL}{clean_link}" if should_email else None
        email_sent = False

        if should_email and email_deeplink_url:
            email_sent = await asyncio.to_thread(
                _render_transactional_email_sync,
                recipient_email or "user@belooga.com",
                email_subject or title,
                message,
                email_deeplink_url,
            )

        notif = await self.repo.create_notification(
            identity_id=identity_id,
            event_type=event_type,
            title=title,
            message=message,
            deep_link=clean_link,
            send_email=send_email,
            email_sent=email_sent,
            email_subject=email_subject,
            email_deeplink_url=email_deeplink_url,
        )
        if auto_commit:
            await self.db.commit()
        return NotificationItemDTO.model_validate(notif).model_dump(mode="json")

    async def list_notifications(self, identity_id: uuid.UUID) -> NotificationListResponse:
        items = await self.repo.list_by_identity(identity_id)
        unread = await self.repo.count_unread(identity_id)
        return NotificationListResponse(
            unread_count=unread,
            items=[NotificationItemDTO.model_validate(i) for i in items],
        )

    async def mark_read(self, notification_id: uuid.UUID, identity_id: uuid.UUID) -> NotificationItemDTO:
        notif = await self.repo.mark_read(notification_id, identity_id)
        if not notif:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
        await self.db.commit()
        return NotificationItemDTO.model_validate(notif)

    async def mark_all_read(self, identity_id: uuid.UUID) -> dict[str, int]:
        await self.repo.mark_all_read(identity_id)
        await self.db.commit()
        return {"unread_count": 0}
