"""Community user posts, likes and comments for CmsRepository."""

from typing import Any, Dict, List, Optional
import uuid
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class UserPostsMixin:
    db: AsyncSession

    async def list_user_posts(self, username: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        if username:
            res = await self.db.execute(
                text(f"{self._USER_POST_SQL} WHERE LOWER(p.username) = LOWER(:u) ORDER BY p.created_at DESC LIMIT :lim"),
                {"u": username.strip(), "lim": limit},
            )
        else:
            res = await self.db.execute(text(f"{self._USER_POST_SQL} ORDER BY p.created_at DESC LIMIT :lim"), {"lim": limit})
        return [dict(r) for r in res.mappings().all()]

    async def get_user_post(self, post_id: str) -> Optional[Dict[str, Any]]:
        res = await self.db.execute(text(f"{self._USER_POST_SQL} WHERE p.id = :id"), {"id": post_id})
        row = res.mappings().first()
        return dict(row) if row else None

    async def insert_user_post(self, data: Dict[str, Any]) -> None:
        await self.db.execute(
            text("""
                INSERT INTO user_posts (id, author_identity_id, username, author_name, title, category, body, tags, attachment_link, likes_count)
                VALUES (:id, :author_identity_id, :username, :author_name, :title, :category, :body, :tags, :attachment_link, 0)
            """),
            data,
        )

    async def update_user_post(self, post_id: str, fields: Dict[str, Any]) -> None:
        allowed = {k: v for k, v in fields.items() if k in ("title", "category", "body", "tags", "attachment_link")}
        if not allowed:
            return
        set_sql = ", ".join(f"{k} = :{k}" for k in allowed)
        await self.db.execute(text(f"UPDATE user_posts SET {set_sql} WHERE id = :id"), {**allowed, "id": post_id})

    async def delete_user_post(self, post_id: str) -> bool:
        res = await self.db.execute(text("DELETE FROM user_posts WHERE id = :id RETURNING id"), {"id": post_id})
        return res.scalar_one_or_none() is not None

    async def like_user_post(self, post_id: str, identity_id: uuid.UUID) -> None:
        """Idempotent like: the counter only moves when the like row is new."""
        await self.db.execute(
            text("""
                WITH ins AS (
                    INSERT INTO user_post_likes (post_id, identity_id) VALUES (:pid, :iid)
                    ON CONFLICT DO NOTHING RETURNING post_id
                )
                UPDATE user_posts SET likes_count = likes_count + 1 WHERE id IN (SELECT post_id FROM ins)
            """),
            {"pid": post_id, "iid": identity_id},
        )

    async def add_user_post_comment(self, post_id: str, author_identity_id: uuid.UUID, author_name: str, content: str) -> None:
        await self.db.execute(
            text("""
                INSERT INTO user_post_comments (id, post_id, author_identity_id, author_name, content)
                VALUES (:id, :pid, :aid, :name, :content)
            """),
            {"id": f"uc-{uuid.uuid4().hex[:10]}", "pid": post_id, "aid": author_identity_id, "name": author_name, "content": content},
        )
