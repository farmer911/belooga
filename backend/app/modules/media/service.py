"""Media service (Vertical Module: media).

Business domain service for chunked video elevator pitch uploads,
safe directory reassembly, path traversal defense, and PDF resume generation.
"""

import asyncio
import json
import logging
import os
import shutil
import time
from typing import Any, Dict, Optional

from fastapi import HTTPException, Response, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import invalidate_candidate_cache
from app.core.security import AuthenticatedUser, verify_profile_owner
from app.modules.media.repository import MediaRepository
from app.modules.notifications import NotificationService
from app.modules.profile import ProfileService
from app.schemas.media import CVStudioDraftPayload, CompleteUploadRequest
from app.services.media_transcoder import (
    AVATARS_DIR,
    RESUMES_DIR,
    VIDEOS_DIR,
    assemble_chunks_async,
    extract_poster_thumbnail,
    get_validated_upload_dir,
    probe_video_duration,
    transcode_to_streaming_mp4,
    write_bytes_async,
)
from app.services.pdf_generator import generate_pdf_resume_async

logger = logging.getLogger(__name__)


class MediaService:
    """Service layer managing video uploads, chunk reassembly, and asset persistence."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.profile_facade = ProfileService(db)
        self.media_repo = MediaRepository(db)

    async def upload_avatar(
        self, username: str, file: UploadFile, current_user: AuthenticatedUser
    ) -> Dict[str, str]:
        verify_profile_owner(current_user, username)
        clean_username = username.lower().strip()
        profile = await self.profile_facade.get_by_username(clean_username)
        if not profile:
            raise HTTPException(status_code=404, detail="Candidate not found")

        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
            ext = ".jpg"

        safe_filename = f"{clean_username}_{int(time.time())}{ext}"
        target_path = os.path.join(AVATARS_DIR, safe_filename)

        content = await file.read()
        await write_bytes_async(target_path, content)

        avatar_url = f"http://localhost:8000/uploads/avatars/{safe_filename}"
        await self.media_repo.update_avatar_url(profile.id, avatar_url)
        await self.db.commit()
        await invalidate_candidate_cache(clean_username)
        return {"avatar_url": avatar_url, "filename": safe_filename, "message": "Avatar uploaded and updated successfully"}

    async def upload_resume(
        self, username: str, file: UploadFile, current_user: AuthenticatedUser
    ) -> Dict[str, str]:
        verify_profile_owner(current_user, username)
        clean_username = username.lower().strip()
        profile = await self.profile_facade.get_by_username(clean_username)
        if not profile:
            raise HTTPException(status_code=404, detail="Candidate not found")

        safe_filename = f"{clean_username}_resume_{int(time.time())}.pdf"
        target_path = os.path.join(RESUMES_DIR, safe_filename)

        content = await file.read()
        await write_bytes_async(target_path, content)

        resume_url = f"http://localhost:8000/uploads/resumes/{safe_filename}"
        await self.media_repo.update_resume_url(profile.id, resume_url)
        await self.db.commit()
        await invalidate_candidate_cache(clean_username)
        return {"resume_url": resume_url, "filename": file.filename or safe_filename, "message": "Resume PDF uploaded successfully"}

    async def delete_resume(self, username: str, current_user: AuthenticatedUser) -> Dict[str, str]:
        verify_profile_owner(current_user, username)
        clean_username = username.lower().strip()
        profile = await self.profile_facade.get_by_username(clean_username)
        if not profile:
            raise HTTPException(status_code=404, detail="Candidate not found")

        await self.media_repo.update_resume_url(profile.id, None)
        await self.db.commit()
        await invalidate_candidate_cache(clean_username)
        return {"message": "Resume PDF removed successfully"}

    async def generate_candidate_pdf(
        self, username: str, current_user: Optional[AuthenticatedUser]
    ) -> Response:
        clean_username = username.lower().strip()
        row = await self.media_repo.get_candidate_for_pdf(clean_username)
        if not row:
            raise HTTPException(status_code=404, detail="Candidate not found")

        is_owner = current_user is not None and (
            current_user.username.lower() == clean_username or current_user.role == "admin"
        )
        if row.is_hidden and not is_owner:
            raise HTTPException(status_code=404, detail="Candidate not found")

        jobs = await self.profile_facade.get_jobs(row.id)
        education = await self.profile_facade.get_education(row.id)
        skills = await self.profile_facade.get_skills(row.id)

        pdf_bytes = await generate_pdf_resume_async(row, jobs, education, skills, clean_username)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{clean_username}_CV_2026.pdf"',
                "Content-Type": "application/pdf",
            },
        )

    async def upload_video_chunk(
        self,
        upload_id: str,
        chunk_index: int,
        total_chunks: int,
        username: str,
        file: UploadFile,
        current_user: AuthenticatedUser,
    ) -> Dict[str, Any]:
        verify_profile_owner(current_user, username)
        upload_dir = get_validated_upload_dir(upload_id, current_user.id)
        await asyncio.to_thread(os.makedirs, upload_dir, exist_ok=True)

        chunk_filename = f"chunk_{chunk_index:05d}"
        chunk_path = os.path.join(upload_dir, chunk_filename)

        content = await file.read()
        await write_bytes_async(chunk_path, content)

        return {
            "upload_id": upload_id,
            "chunk_index": chunk_index,
            "total_chunks": total_chunks,
            "status": "chunk_received",
            "message": f"Chunk {chunk_index + 1}/{total_chunks} received successfully",
        }

    async def complete_chunked_video_upload(
        self, payload: CompleteUploadRequest, current_user: AuthenticatedUser
    ) -> Dict[str, Any]:
        verify_profile_owner(current_user, payload.username)
        upload_dir = get_validated_upload_dir(payload.upload_id, current_user.id)
        if not await asyncio.to_thread(os.path.exists, upload_dir):
            raise HTTPException(status_code=400, detail="Invalid upload session or chunks expired")

        clean_username = payload.username.lower().strip()
        profile = await self.profile_facade.get_by_username(clean_username)
        if not profile:
            raise HTTPException(status_code=404, detail="Candidate not found")

        owner_slug = profile.username.lower().strip()
        timestamp = int(time.time())
        raw_path = os.path.join(VIDEOS_DIR, f"{owner_slug}_raw_{timestamp}.webm")

        try:
            await assemble_chunks_async(upload_dir, raw_path, payload.total_chunks)
        except FileNotFoundError as e:
            raise HTTPException(status_code=400, detail=str(e))

        try:
            await asyncio.to_thread(shutil.rmtree, upload_dir)
        except Exception as e:
            logger.warning("Error cleaning up temporary chunks directory: %s", type(e).__name__)

        mp4_path = os.path.join(VIDEOS_DIR, f"{owner_slug}_pitch_{timestamp}.mp4")
        fallback_path = os.path.join(VIDEOS_DIR, f"{owner_slug}_pitch_{timestamp}.webm")
        final_path, final_filename = await transcode_to_streaming_mp4(raw_path, mp4_path, fallback_path)

        poster_path = os.path.join(VIDEOS_DIR, f"{owner_slug}_poster_{timestamp}.jpg")
        poster_url = await extract_poster_thumbnail(final_path, poster_path)
        duration_sec = await probe_video_duration(final_path)

        video_url = f"http://localhost:8000/uploads/videos/{final_filename}"
        await self.media_repo.update_video_pitch_url(profile.id, video_url)
        if poster_url:
            await self.media_repo.upsert_pitch_poster(profile.id, poster_url)
        await NotificationService(self.db).dispatch_event(
            identity_id=current_user.id,
            event_type="VIDEO_PITCH_READY",
            title="Your Video Pitch Is Live",
            message="Your streaming MP4 video pitch and poster thumbnail have been published to your profile.",
            deep_link=f"/user/{clean_username}?pitch=ready",
            send_email=False,
            category="general",
            auto_commit=False,
        )
        await self.db.commit()
        await invalidate_candidate_cache(clean_username)

        return {
            "status": "completed",
            "video_url": video_url,
            "poster_url": poster_url,
            "duration": duration_sec,
            "filename": final_filename,
            "message": "All chunks assembled into optimized streaming video pitch, and thumbnail generated successfully!",
        }

    async def get_video_transcoding_status(self, username: str) -> Dict[str, Any]:
        p_row = await self.media_repo.get_video_status(username)
        current_url = p_row.video_pitch_url if p_row and p_row.video_pitch_url else "/images/home/Ava_s_Video.mp4"
        current_poster = p_row.video_pitch_poster if p_row and p_row.video_pitch_poster else "/images/home/matt-poster.png"

        return {
            "status": "ready",
            "video_url": current_url,
            "poster_url": current_poster,
            "duration_seconds": 30,
        }

    async def get_cv_studio_draft(
        self, username: str, current_user: Optional[AuthenticatedUser] = None
    ) -> Dict[str, Any]:
        clean_username = username.lower().strip()
        row = await self.media_repo.get_candidate_for_pdf(clean_username)
        if not row:
            raise HTTPException(status_code=404, detail="Candidate not found")

        saved_json = await self.media_repo.get_cv_studio_draft(row.id)
        if saved_json:
            return json.loads(saved_json)

        jobs = await self.profile_facade.get_jobs(row.id)
        skills = await self.profile_facade.get_skills(row.id)
        exp_items = [
            {
                "company": j.get("company_name") or "Technology Corp",
                "role": j.get("title") or "Software Engineer",
                "period": f"{j.get('from_date_year', 2022)} - {'Present' if j.get('currently_work_here') else j.get('to_date_year', 2025)}",
                "bullets": [b.strip() for b in (j.get("description") or "").split("\n") if b.strip()]
                or ["Delivered production systems with measurable latency and throughput gains."],
            }
            for j in jobs
        ]
        return {
            "full_name": f"{row.first_name or ''} {row.last_name or ''}".strip() or clean_username,
            "email": row.email or "",
            "phone": row.phone or "",
            "headline": row.headline or "Senior Software Engineer",
            "summary": row.bio or "",
            "skills": ", ".join(skills) if skills else "Python, FastAPI, PostgreSQL, Next.js",
            "font_size": 10.0,
            "line_height": 1.3,
            "margin_size": 0.6,
            "snap_one_page": True,
            "experience": exp_items,
        }

    async def save_cv_studio_draft(
        self, username: str, payload: CVStudioDraftPayload, current_user: AuthenticatedUser
    ) -> Dict[str, Any]:
        verify_profile_owner(current_user, username)
        clean_username = username.lower().strip()
        profile = await self.profile_facade.get_by_username(clean_username)
        if not profile:
            raise HTTPException(status_code=404, detail="Candidate not found")

        data = payload.model_dump()
        await self.media_repo.upsert_cv_studio_draft(
            profile_id=profile.id,
            draft_json=json.dumps(data, ensure_ascii=False),
            headline=payload.headline,
            summary=payload.summary,
        )
        await self.db.commit()
        await invalidate_candidate_cache(clean_username)
        return data

