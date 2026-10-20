"""Backward-compatible re-export shim for CmsService (moved to app.modules.cms)."""

from app.modules.cms.service import CmsService

__all__ = ["CmsService"]
