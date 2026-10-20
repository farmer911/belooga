"""Backward-compatible re-export shim for MediaService (moved to app.modules.media)."""

from app.modules.media.service import MediaService

__all__ = ["MediaService"]
