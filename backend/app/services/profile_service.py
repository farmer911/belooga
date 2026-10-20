"""Re-export shim for ProfileService (Vertical Module: app.modules.profile)."""

from app.modules.profile.service import ProfileService, profile_cache

__all__ = ["ProfileService", "profile_cache"]
