"""Notification repository (Vertical Module: notifications).

Data access layer for `notifications` and `notification_preferences` tables.
"""

from datetime import datetime, timezone
from typing import List, Optional
import uuid

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notifications import Notification, NotificationPreference


class NotificationRepository:
    """Repository managing in-app notifications, email outbox records, and channel preferences."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_preferences(self, identity_id: uuid.UUID) -> NotificationPreference:
        stmt = select(NotificationPreference).where(NotificationPreference.identity_id == identity_id)
        res = await self.db.execute(stmt)
        pref = res.scalar_one_or_none()
        if not pref:
            pref = NotificationPreference(
                identity_id=identity_id,
                email_security_alerts=True,
                email_order_updates=True,
                email_career_matches=True,
                in_app_enabled=True,
            )
            self.db.add(pref)
            await self.db.flush()
        return pref

    async def update_preferences(
        self,
        identity_id: uuid.UUID,
        email_security_alerts: Optional[bool] = None,
        email_order_updates: Optional[bool] = None,
        email_career_matches: Optional[bool] = None,
        in_app_enabled: Optional[bool] = None,
    ) -> NotificationPreference:
        pref = await self.get_or_create_preferences(identity_id)
        if email_security_alerts is not None:
            pref.email_security_alerts = email_security_alerts
        if email_order_updates is not None:
            pref.email_order_updates = email_order_updates
        if email_career_matches is not None:
            pref.email_career_matches = email_career_matches
        if in_app_enabled is not None:
            pref.in_app_enabled = in_app_enabled
        pref.updated_at = datetime.now(timezone.utc)
        await self.db.flush()
        return pref

    async def create_notification(
        self,
        identity_id: uuid.UUID,
        event_type: str,
        title: str,
        message: str,
        deep_link: str,
        send_email: bool,
        email_sent: bool,
        email_subject: Optional[str],
        email_deeplink_url: Optional[str],
    ) -> Notification:
        notif = Notification(
            id=uuid.uuid4(),
            identity_id=identity_id,
            event_type=event_type,
            title=title,
            message=message,
            deep_link=deep_link,
            is_read=False,
            send_email=send_email,
            email_sent=email_sent,
            email_subject=email_subject,
            email_deeplink_url=email_deeplink_url,
        )
        self.db.add(notif)
        await self.db.flush()
        return notif

    async def list_by_identity(self, identity_id: uuid.UUID, limit: int = 30) -> List[Notification]:
        stmt = (
            select(Notification)
            .where(Notification.identity_id == identity_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
        )
        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def count_unread(self, identity_id: uuid.UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(Notification)
            .where(Notification.identity_id == identity_id, Notification.is_read.is_(False))
        )
        res = await self.db.execute(stmt)
        return int(res.scalar() or 0)

    async def mark_read(self, notification_id: uuid.UUID, identity_id: uuid.UUID) -> Optional[Notification]:
        stmt = (
            update(Notification)
            .where(
                Notification.id == notification_id,
                Notification.identity_id == identity_id,
            )
            .values(is_read=True)
            .returning(Notification)
        )
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def mark_all_read(self, identity_id: uuid.UUID) -> None:
        stmt = (
            update(Notification)
            .where(Notification.identity_id == identity_id, Notification.is_read.is_(False))
            .values(is_read=True)
        )
        await self.db.execute(stmt)
