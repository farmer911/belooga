"""Backward-compatible re-export shim for CatalogsRepository (moved to app.modules.catalogs)."""

from app.modules.catalogs.repository import CatalogsRepository

__all__ = ["CatalogsRepository"]
