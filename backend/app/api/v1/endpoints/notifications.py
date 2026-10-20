"""Enterprise Notification & Email Deep-Link Preferences endpoints (Thin Controller)."""

import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import AuthenticatedUser, get_current_user
from app.modules.notifications import NotificationService
from app.schemas.notifications import (
    NotificationItemDTO,
    NotificationListResponse,
    NotificationPreferenceDTO,
    NotificationPreferenceUpdate,
)

router = APIRouter()


@router.get("/notifications/", response_model=NotificationListResponse, tags=["Domain 12: Notifications & Email Outbox"])
async def list_my_notifications(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await NotificationService(db).list_notifications(current_user.id)


@router.patch("/notifications/{notification_id}/read/", response_model=NotificationItemDTO, tags=["Domain 12: Notifications & Email Outbox"])
async def mark_notification_read(
    notification_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await NotificationService(db).mark_read(notification_id, current_user.id)


@router.post("/notifications/read-all/", response_model=dict[str, int], tags=["Domain 12: Notifications & Email Outbox"])
async def mark_all_notifications_read(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await NotificationService(db).mark_all_read(current_user.id)


@router.get("/notifications/preferences/", response_model=NotificationPreferenceDTO, tags=["Domain 12: Notifications & Email Outbox"])
async def get_notification_preferences(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await NotificationService(db).get_preferences(current_user.id)


@router.patch("/notifications/preferences/", response_model=NotificationPreferenceDTO, tags=["Domain 12: Notifications & Email Outbox"])
async def update_notification_preferences(
    payload: NotificationPreferenceUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await NotificationService(db).update_preferences(current_user.id, payload)
