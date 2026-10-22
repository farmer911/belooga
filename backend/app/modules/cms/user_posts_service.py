"""User Post & Article CRUD Service (BEL-187 — Vertical Module: cms)."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import AuthenticatedUser
from app.modules.cms.repository import CmsRepository
from app.modules.notifications import NotificationService
from app.schemas.cms import (
    BlogCommentCreateRequest,
    UserPostCreateRequest,
    UserPostItemDTO,
    UserPostUpdateRequest,
)

DEFAULT_USER_POSTS: List[Dict[str, Any]] = [
    {
        "id": "upost-1",
        "username": "phucnguyen",
        "author_name": "Nguyễn Minh Phúc",
        "title": "Kiến trúc tối ưu FastAPI Async & Singleflight Cache chịu tải 25,000 CCU",
        "category": "Chia sẻ kiến thức",
        "body": "Khi thiết kế hệ thống tìm kiếm ứng viên thời gian thực với TSVECTOR trên PostgreSQL 16, việc kết hợp Singleflight Cache và Keyset Pagination giúp giảm 84% độ trễ P99.",
        "tags": ["Python", "FastAPI", "PostgreSQL", "System Design"],
        "attachment_link": "https://github.com/farmer911/belooga",
        "likes_count": 34,
        "comments": [
            {
                "id": "uc-1",
                "author_name": "Tech Recruiter @ VNG",
                "content": "Bài viết rất thực chiến, bên mình đang tuyển Principal Backend!",
                "created_at": "2 giờ trước",
            }
        ],
        "created_at": "2026-10-22",
    }
]


class UserPostsService:
    """Service managing user posts, profile author feeds, likes, comments, and IDOR guards."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = CmsRepository(db)

    async def _all_posts(self) -> List[Dict[str, Any]]:
        persisted = await self.repo.list_persisted_user_posts()
        seen = {p.get("id") for p in persisted}
        return persisted + [dict(d) for d in DEFAULT_USER_POSTS if d["id"] not in seen]

    async def list_posts(self, username: Optional[str] = None) -> List[UserPostItemDTO]:
        posts = await self._all_posts()
        if username and username.strip():
            u_low = username.strip().lower()
            filtered = [p for p in posts if str(p.get("username", "")).lower() == u_low]
            posts = filtered if filtered else posts
        return [UserPostItemDTO(**p) for p in posts]

    async def create_post(
        self, payload: UserPostCreateRequest, current_user: Optional[AuthenticatedUser]
    ) -> UserPostItemDTO:
        uname = current_user.username if current_user else "phucnguyen"
        post_id = f"upost-{uuid.uuid4().hex[:8]}"
        item: Dict[str, Any] = {
            "id": post_id,
            "username": uname,
            "author_name": uname,
            "title": (payload.title or "Chia sẻ chuyên môn từ Belooga Workspace").strip(),
            "category": (payload.category or "Chia sẻ kiến thức").strip(),
            "body": (payload.body or payload.title).strip(),
            "tags": payload.tags or ["Belooga", "Tech"],
            "attachment_link": payload.attachment_link,
            "likes_count": 1,
            "comments": [],
            "created_at": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        }
        await self.repo.upsert_user_post(post_id, item)
        return UserPostItemDTO(**item)

    async def update_post(
        self, post_id: str, payload: UserPostUpdateRequest, current_user: Optional[AuthenticatedUser]
    ) -> UserPostItemDTO:
        posts = await self._all_posts()
        target = next((p for p in posts if p.get("id") == post_id), None)
        if not target:
            raise HTTPException(status_code=404, detail="User post not found.")
        if current_user and str(target.get("username", "")).lower() != current_user.username.lower():
            raise HTTPException(status_code=403, detail="Forbidden: Only the post author can edit this post.")
        updated = dict(target)
        for k, v in payload.model_dump(exclude_unset=True).items():
            if v is not None:
                updated[k] = v
        await self.repo.upsert_user_post(post_id, updated)
        return UserPostItemDTO(**updated)

    async def delete_post(self, post_id: str, current_user: Optional[AuthenticatedUser]) -> Dict[str, str]:
        posts = await self._all_posts()
        target = next((p for p in posts if p.get("id") == post_id), None)
        if not target:
            raise HTTPException(status_code=404, detail="User post not found.")
        if current_user and str(target.get("username", "")).lower() != current_user.username.lower():
            raise HTTPException(status_code=403, detail="Forbidden: Only the post author can delete this post.")
        await self.repo.delete_user_post(post_id)
        return {"status": "deleted", "id": post_id}

    async def like_post(self, post_id: str, current_user: Optional[AuthenticatedUser]) -> UserPostItemDTO:
        posts = await self._all_posts()
        target = next((p for p in posts if p.get("id") == post_id), None)
        if not target:
            raise HTTPException(status_code=404, detail="User post not found.")
        updated = dict(target)
        updated["likes_count"] = int(updated.get("likes_count", 1)) + 1
        await self.repo.upsert_user_post(post_id, updated)
        return UserPostItemDTO(**updated)

    async def comment_post(
        self, post_id: str, payload: BlogCommentCreateRequest, current_user: Optional[AuthenticatedUser]
    ) -> UserPostItemDTO:
        posts = await self._all_posts()
        target = next((p for p in posts if p.get("id") == post_id), None)
        if not target:
            raise HTTPException(status_code=404, detail="User post not found.")
        updated = dict(target)
        viewer = current_user.username if current_user else "alexnguyen"
        comments = list(updated.get("comments") or [])
        comments.append(
            {
                "id": f"uc-{uuid.uuid4().hex[:8]}",
                "author_name": viewer,
                "content": payload.content.strip(),
                "created_at": "Vừa xong",
            }
        )
        updated["comments"] = comments
        await self.repo.upsert_user_post(post_id, updated)
        author_uname = updated.get("username")
        if author_uname:
            author_uid = await self.repo.get_candidate_identity_by_username(author_uname)
            if author_uid:
                await NotificationService(self.db).dispatch_event(
                    identity_id=author_uid,
                    event_type="USER_POST_COMMENT",
                    title=f"@{viewer} đã bình luận bài viết của bạn",
                    message=payload.content.strip()[:160],
                    deep_link=f"/public/{author_uname}",
                    send_email=False,
                    category="general",
                )
        return UserPostItemDTO(**updated)
