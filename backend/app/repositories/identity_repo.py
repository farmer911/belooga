"""Re-export shim for IdentityRepository (Vertical Module: app.modules.auth)."""

from app.modules.auth.repository import IdentityRepository

__all__ = ["IdentityRepository"]
