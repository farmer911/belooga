from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class NotificationItemDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    identity_id: UUID
    event_type: str
    title: str
    message: str
    deep_link: str
    is_read: bool
    send_email: bool
    email_sent: bool
    email_subject: Optional[str] = None
    email_deeplink_url: Optional[str] = None
    created_at: datetime


class NotificationListResponse(BaseModel):
    unread_count: int
    items: List[NotificationItemDTO]


class NotificationPreferenceDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    identity_id: UUID
    email_security_alerts: bool = True
    email_order_updates: bool = True
    email_career_matches: bool = True
    in_app_enabled: bool = True


class NotificationPreferenceUpdate(BaseModel):
    email_security_alerts: Optional[bool] = None
    email_order_updates: Optional[bool] = None
    email_career_matches: Optional[bool] = None
    in_app_enabled: Optional[bool] = None
