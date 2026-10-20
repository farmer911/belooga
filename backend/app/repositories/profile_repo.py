"""Re-export shim for ProfileRepository (Vertical Module: app.modules.profile)."""

from app.modules.profile.repository import ProfileRepository

__all__ = ["ProfileRepository"]
