"""Backward-compatible re-export shim for CatalogsService (moved to app.modules.catalogs)."""

from app.modules.catalogs.service import CatalogsService

__all__ = ["CatalogsService"]
