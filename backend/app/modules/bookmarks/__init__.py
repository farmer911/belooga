"""Public facade for the `bookmarks` vertical slice module."""

from app.modules.bookmarks.growth_service import GrowthService
from app.modules.bookmarks.service import BookmarkService

__all__ = ["BookmarkService", "GrowthService"]
