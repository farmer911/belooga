"""Backward-compatible re-export shim for MediaRepository (moved to app.modules.media)."""

from app.modules.media.repository import MediaRepository

__all__ = ["MediaRepository"]
