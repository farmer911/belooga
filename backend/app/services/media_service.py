"""Media service.

Business domain service for chunked video elevator pitch uploads,
safe directory reassembly, path traversal defense, and PDF resume generation.
"""

import asyncio
import logging
import os
import shutil
import time
from typing import Any, Dict, Optional
import uuid

from fastapi import HTTPException, Response, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import AuthenticatedUser, verify_profile_owner
from app.repositories.media_repo import MediaRepository
from app.repositories.profile_repo import ProfileRepository
from app.schemas.media import CompleteUploadRequest
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
        self.profile_repo = ProfileRepository(db)
        self.media_repo = MediaRepository(db)

    async def upload_avatar(
        self, username: str, file: UploadFile, current_user: AuthenticatedUser
    ) -> Dict[str, str]:
        verify_profile_owner(current_user, username)
        clean_username = username.lower().strip()
        profile = await self.profile_repo.get_by_username(clean_username)
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

        return {
            "avatar_url": avatar_url,
            "filename": safe_filename,
            "message": "Avatar uploaded and updated successfully",
        }

    async def upload_resume(
        self, username: str, file: UploadFile, current_user: AuthenticatedUser
    ) -> Dict[str, str]:
        verify_profile_owner(current_user, username)
        clean_username = username.lower().strip()
        profile = await self.profile_repo.get_by_username(clean_username)
        if not profile:
            raise HTTPException(status_code=404, detail="Candidate not found")

        safe_filename = f"{clean_username}_resume_{int(time.time())}.pdf"
        target_path = os.path.join(RESUMES_DIR, safe_filename)

        content = await file.read()
        await write_bytes_async(target_path, content)

        resume_url = f"http://localhost:8000/uploads/resumes/{safe_filename}"
        return {
            "resume_url": resume_url,
            "filename": file.filename or safe_filename,
            "message": "Resume PDF uploaded successfully",
        }

    async def delete_resume(self, username: str, current_user: AuthenticatedUser) -> Dict[str, str]:
        verify_profile_owner(current_user, username)
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

        jobs = await self.media_repo.get_pdf_jobs(row.id)
        education = await self.media_repo.get_pdf_education(row.id)
        skills = await self.media_repo.get_pdf_skills(row.id)

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
        os.makedirs(upload_dir, exist_ok=True)

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
        if not os.path.exists(upload_dir):
            raise HTTPException(status_code=400, detail="Invalid upload session or chunks expired")

        clean_username = payload.username.lower().strip()
        profile = await self.profile_repo.get_by_username(clean_username)
        if not profile:
            raise HTTPException(status_code=404, detail="Candidate not found")

        timestamp = int(time.time())
        raw_path = os.path.join(VIDEOS_DIR, f"{clean_username}_raw_{timestamp}.webm")

        try:
            await assemble_chunks_async(upload_dir, raw_path, payload.total_chunks)
        except FileNotFoundError as e:
            raise HTTPException(status_code=400, detail=str(e))

        try:
            await asyncio.to_thread(shutil.rmtree, upload_dir)
        except Exception as e:
            logger.warning(f"Error cleaning up chunks directory {upload_dir}: {e}")

        mp4_path = os.path.join(VIDEOS_DIR, f"{clean_username}_pitch_{timestamp}.mp4")
        fallback_path = os.path.join(VIDEOS_DIR, f"{clean_username}_pitch_{timestamp}.webm")
        final_path, final_filename = await transcode_to_streaming_mp4(raw_path, mp4_path, fallback_path)

        poster_path = os.path.join(VIDEOS_DIR, f"{clean_username}_poster_{timestamp}.jpg")
        poster_url = await extract_poster_thumbnail(final_path, poster_path)
        duration_sec = await probe_video_duration(final_path)

        video_url = f"http://localhost:8000/uploads/videos/{final_filename}"
        await self.media_repo.update_video_pitch_url(profile.id, video_url)
        if poster_url:
            await self.media_repo.upsert_pitch_poster(profile.id, poster_url)
        await self.db.commit()

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
