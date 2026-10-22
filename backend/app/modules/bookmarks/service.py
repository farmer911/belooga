"""Candidate Shortlist Bookmarks service (Vertical Module: bookmarks — BEL-145 / BEL-149).

Coordinates recruiter shortlist business rules, privacy guards, and SWR cache invalidation.
"""

from typing import Any, Optional
import uuid

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import platform_cache
from app.modules.bookmarks.repository import BookmarkRepository


class BookmarkService:
    """Domain service for candidate shortlist bookmarks with Singleflight SWR cache."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = BookmarkRepository(db)

    @staticmethod
    def _cache_key(recruiter_identity_id: uuid.UUID) -> str:
        return f"bookmarks:recruiter:{recruiter_identity_id}"

    async def _invalidate_caches(self, recruiter_identity_id: uuid.UUID) -> None:
        await platform_cache.invalidate_prefix(self._cache_key(recruiter_identity_id))
        await platform_cache.invalidate_prefix("analytics:")

    async def list_bookmarks(self, recruiter_identity_id: uuid.UUID) -> list[dict[str, Any]]:
        return await platform_cache.get_or_set(
            self._cache_key(recruiter_identity_id),
            ttl_seconds=60,
            stale_ttl_seconds=120,
            loader=lambda: self.repo.list_by_recruiter(recruiter_identity_id),
        )

    async def add_bookmark(
        self, recruiter_identity_id: uuid.UUID, username: str, note: Optional[str] = None
    ) -> dict[str, Any]:
        item = await self.repo.upsert_bookmark(
            recruiter_identity_id=recruiter_identity_id, username=username, note=note
        )
        if not item:
            raise HTTPException(status_code=404, detail="Candidate profile not found or hidden")
        await self.db.commit()
        await self._invalidate_caches(recruiter_identity_id)
        return item

    async def remove_bookmark(self, recruiter_identity_id: uuid.UUID, username: str) -> dict[str, str]:
        deleted = await self.repo.delete_bookmark(
            recruiter_identity_id=recruiter_identity_id, username=username
        )
        if not deleted:
            raise HTTPException(status_code=404, detail="Bookmark not found")
        await self.db.commit()
        await self._invalidate_caches(recruiter_identity_id)
        return {"status": "deleted", "username": username.strip()}
