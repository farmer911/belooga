"""Backward-compatible re-export shim for CmsRepository (moved to app.modules.cms)."""

from app.modules.cms.repository import CmsRepository

__all__ = ["CmsRepository"]
