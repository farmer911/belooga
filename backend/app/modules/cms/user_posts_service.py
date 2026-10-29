"""User Post & Article CRUD Service (BEL-187 — Vertical Module: cms)."""

from typing import Any, Dict, List, Optional
import uuid

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import AuthenticatedUser, is_owner_or_admin
from app.modules.cms.repository import CmsRepository
from app.modules.notifications import NotificationService
from app.schemas.cms import (
    BlogCommentCreateRequest,
    UserPostCreateRequest,
    UserPostItemDTO,
    UserPostUpdateRequest,
)


class UserPostsService:
    """User posts on `user_posts`: public reads, authenticated writes, author-or-admin edits/deletes."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = CmsRepository(db)

    @staticmethod
    def _dto(row: Dict[str, Any]) -> UserPostItemDTO:
        return UserPostItemDTO(**{k: v for k, v in row.items() if k != "author_identity_id"})

    @staticmethod
    def _handle(user: AuthenticatedUser) -> str:
        return user.username or user.email.split("@")[0]

    async def _require_post(self, post_id: str) -> Dict[str, Any]:
        row = await self.repo.get_user_post(post_id)
        if not row:
            raise HTTPException(status_code=404, detail="User post not found.")
        return row

    @staticmethod
    def _require_author(row: Dict[str, Any], user: AuthenticatedUser, action: str) -> None:
        if not is_owner_or_admin(user, row.get("author_identity_id")):
            raise HTTPException(status_code=403, detail=f"Forbidden: Only the post author can {action} this post.")

    async def list_posts(self, username: Optional[str] = None) -> List[UserPostItemDTO]:
        return [self._dto(p) for p in await self.repo.list_user_posts(username=(username or "").strip() or None)]

    async def create_post(self, payload: UserPostCreateRequest, current_user: AuthenticatedUser) -> UserPostItemDTO:
        post_id = f"upost-{uuid.uuid4().hex[:10]}"
        handle = self._handle(current_user)
        await self.repo.insert_user_post({
            "id": post_id,
            "author_identity_id": current_user.id,
            "username": handle,
            "author_name": handle,
            "title": (payload.title or "Chia sẻ chuyên môn từ Belooga Workspace").strip(),
            "category": (payload.category or "Chia sẻ kiến thức").strip(),
            "body": (payload.body or payload.title).strip(),
            "tags": payload.tags or ["Belooga", "Tech"],
            "attachment_link": payload.attachment_link,
        })
        await self.db.commit()
        return self._dto(await self._require_post(post_id))

    async def update_post(
        self, post_id: str, payload: UserPostUpdateRequest, current_user: AuthenticatedUser
    ) -> UserPostItemDTO:
        self._require_author(await self._require_post(post_id), current_user, "edit")
        await self.repo.update_user_post(post_id, {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None})
        await self.db.commit()
        return self._dto(await self._require_post(post_id))

    async def delete_post(self, post_id: str, current_user: AuthenticatedUser) -> Dict[str, str]:
        self._require_author(await self._require_post(post_id), current_user, "delete")
        await self.repo.delete_user_post(post_id)
        await self.db.commit()
        return {"status": "deleted", "id": post_id}

    async def like_post(self, post_id: str, current_user: AuthenticatedUser) -> UserPostItemDTO:
        await self._require_post(post_id)
        await self.repo.like_user_post(post_id, current_user.id)
        await self.db.commit()
        return self._dto(await self._require_post(post_id))

    async def comment_post(
        self, post_id: str, payload: BlogCommentCreateRequest, current_user: AuthenticatedUser
    ) -> UserPostItemDTO:
        post = await self._require_post(post_id)
        content = payload.content.strip()
        if not content:
            raise HTTPException(status_code=422, detail="Comment cannot be empty")
        viewer = self._handle(current_user)
        await self.repo.add_user_post_comment(post_id, current_user.id, viewer, content)
        author_uid = post.get("author_identity_id")
        if author_uid and author_uid != current_user.id:
            await NotificationService(self.db).dispatch_event(
                identity_id=author_uid,
                event_type="USER_POST_COMMENT",
                title=f"@{viewer} đã bình luận bài viết của bạn",
                message=content[:160],
                deep_link=f"/public/{post['username']}",
                send_email=False,
                category="general",
                auto_commit=False,
            )
        await self.db.commit()  # comment + notification land together
        return self._dto(await self._require_post(post_id))
