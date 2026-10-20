"""Public facade for the `notifications` vertical slice module."""

from app.modules.notifications.service import NotificationService

__all__ = ["NotificationService"]
