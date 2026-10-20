"""Re-export shim for AuthService (Vertical Module: app.modules.auth)."""

from app.modules.auth.service import AuthService

__all__ = ["AuthService"]
