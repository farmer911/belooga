"""Media service (Vertical Module: media).

Business domain service for chunked video elevator pitch uploads,
safe directory reassembly, path traversal defense, and PDF resume generation.
"""

import asyncio
import json
import logging
import os
import secrets
import shutil
from typing import Any, Dict, Optional
from urllib.parse import urlparse

from fastapi import HTTPException, Response, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import invalidate_candidate_cache
from app.core.config import get_settings
from app.core.security import AuthenticatedUser, verify_profile_owner
from app.modules.media.repository import MediaRepository
from app.modules.notifications import NotificationService
from app.modules.profile import ProfileService
from app.schemas.media import CVStudioDraftPayload, CompleteUploadRequest
from app.services.media_transcoder import (
    AVATARS_DIR, RESUMES_DIR, SAFE_FILENAME_REGEX, VIDEOS_DIR, assemble_chunks_async,
    dir_size_async, extract_poster_thumbnail, get_validated_upload_dir, nonempty_file_async,
    probe_video_duration, read_head_async, save_upload_capped, transcode_to_streaming_mp4,
)
from app.services.pdf_generator import generate_pdf_resume_async

logger = logging.getLogger(__name__)

IMAGE_TYPES = {"png": ".png", "jpeg": ".jpg", "webp": ".webp"}
PDF_TYPES = {"pdf": ".pdf"}
VIDEO_TYPES = {"webm": ".webm", "mp4": ".mp4"}


def sniff_type(head: bytes) -> Optional[str]:
    """Identify a file by its magic bytes (never trust the client filename or Content-Type)."""
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if head.startswith(b"\xff\xd8\xff"):
        return "jpeg"
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "webp"
    if head.startswith(b"%PDF-"):
        return "pdf"
    if head.startswith(b"\x1a\x45\xdf\xa3"):  # EBML header (WebM/Matroska)
        return "webm"
    if head[4:8] == b"ftyp":  # ISO BMFF (MP4/MOV)
        return "mp4"
    return None


def _require_type(head: bytes, allowed: Dict[str, str]) -> str:
    """Return the server-side extension for an allowed type, else 415."""
    kind = sniff_type(head)
    if kind not in allowed:
        raise HTTPException(status_code=415, detail=f"Unsupported file type; allowed: {', '.join(allowed)}")
    return allowed[kind]


async def _save_validated(file: UploadFile, dest_dir: str, allowed: Dict[str, str], max_bytes: int) -> str:
    """Magic-byte check (415), size-capped streaming write (413), random filename. Returns the filename."""
    head = await file.read(16)
    await file.seek(0)
    filename = f"{secrets.token_hex(16)}{_require_type(head, allowed)}"
    await save_upload_capped(file, os.path.join(dest_dir, filename), max_bytes)
    return filename


class MediaService:
    """Service layer managing video uploads, chunk reassembly, and asset persistence."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.profile_facade = ProfileService(db)
        self.media_repo = MediaRepository(db)

    async def _require_owned_profile(self, username: str, current_user: AuthenticatedUser):
        verify_profile_owner(current_user, username)
        clean_username = username.lower().strip()
        profile = await self.profile_facade.get_by_username(clean_username)
        if not profile:
            raise HTTPException(status_code=404, detail="Candidate not found")
        return profile, clean_username

    async def upload_avatar(
        self, username: str, file: UploadFile, current_user: AuthenticatedUser
    ) -> Dict[str, str]:
        profile, clean_username = await self._require_owned_profile(username, current_user)
        safe_filename = await _save_validated(file, AVATARS_DIR, IMAGE_TYPES, get_settings().UPLOAD_MAX_AVATAR_BYTES)
        avatar_url = f"{get_settings().public_api_url}/uploads/avatars/{safe_filename}"
        await self.media_repo.update_avatar_url(profile.id, avatar_url)
        await self.db.commit()
        await invalidate_candidate_cache(clean_username)
        return {"avatar_url": avatar_url, "filename": safe_filename, "message": "Avatar uploaded and updated successfully"}

    async def upload_resume(
        self, username: str, file: UploadFile, current_user: AuthenticatedUser
    ) -> Dict[str, str]:
        profile, clean_username = await self._require_owned_profile(username, current_user)
        safe_filename = await _save_validated(file, RESUMES_DIR, PDF_TYPES, get_settings().UPLOAD_MAX_RESUME_BYTES)
        # Private: served only by GET /v1/profile/{username}/resume/{filename} (owner/admin).
        resume_url = f"{get_settings().public_api_url}/v1/profile/{clean_username}/resume/{safe_filename}"
        await self.media_repo.update_resume_url(profile.id, resume_url)
        await self.db.commit()
        await invalidate_candidate_cache(clean_username)
        return {"resume_url": resume_url, "filename": file.filename or safe_filename, "message": "Resume PDF uploaded successfully"}

    async def download_resume(
        self, username: str, filename: str, current_user: AuthenticatedUser
    ) -> FileResponse:
        """Owner/admin-only download of the uploaded resume (it may contain contact PII)."""
        profile, clean_username = await self._require_owned_profile(username, current_user)
        stored_name = os.path.basename(urlparse(profile.resume_url or "").path)
        if not stored_name or stored_name != filename or not SAFE_FILENAME_REGEX.match(filename):
            raise HTTPException(status_code=404, detail="Resume not found")
        root = os.path.realpath(RESUMES_DIR)
        path = os.path.realpath(os.path.join(root, filename))
        if not path.startswith(root + os.sep) or not await nonempty_file_async(path):
            raise HTTPException(status_code=404, detail="Resume not found")
        return FileResponse(
            path, media_type="application/pdf", filename=f"{clean_username}_resume.pdf",
            headers={"Cache-Control": "private, no-store"},
        )

    async def delete_resume(self, username: str, current_user: AuthenticatedUser) -> Dict[str, str]:
        profile, clean_username = await self._require_owned_profile(username, current_user)
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
            current_user.username.lower().strip() == clean_username or current_user.role == "admin"
        )
        if row.is_hidden and not is_owner:
            raise HTTPException(status_code=404, detail="Candidate not found")
        jobs = await self.profile_facade.get_jobs(row.id)
        education = await self.profile_facade.get_education(row.id)
        skills = await self.profile_facade.get_skills(row.id)
        pdf_bytes = await generate_pdf_resume_async(row, jobs, education, skills, clean_username, is_owner=is_owner)
        return Response(
            content=pdf_bytes, media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{clean_username}_CV_2026.pdf"', "Content-Type": "application/pdf"},
        )

    generate_resume_pdf = generate_candidate_pdf

    async def upload_video_chunk(
        self, upload_id: str, chunk_index: int, total_chunks: int,
        username: str, file: UploadFile, current_user: AuthenticatedUser,
    ) -> Dict[str, Any]:
        verify_profile_owner(current_user, username)
        upload_dir = get_validated_upload_dir(upload_id, current_user.id)
        if not 0 <= chunk_index < total_chunks:
            raise HTTPException(status_code=400, detail="chunk_index must be within [0, total_chunks)")
        settings = get_settings()
        await asyncio.to_thread(os.makedirs, upload_dir, exist_ok=True)
        remaining = settings.UPLOAD_MAX_VIDEO_BYTES - await dir_size_async(upload_dir)
        await save_upload_capped(
            file, os.path.join(upload_dir, f"chunk_{chunk_index:05d}"), min(settings.UPLOAD_MAX_CHUNK_BYTES, max(remaining, 0))
        )
        return {
            "upload_id": upload_id, "chunk_index": chunk_index, "total_chunks": total_chunks,
            "status": "chunk_received", "message": f"Chunk {chunk_index + 1}/{total_chunks} received successfully",
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

        head = await read_head_async(os.path.join(upload_dir, "chunk_00000"))
        if not head:
            raise HTTPException(status_code=400, detail="Missing chunk index 0")
        ext = _require_type(head, VIDEO_TYPES)
        stem = secrets.token_hex(16)
        raw_path = os.path.join(VIDEOS_DIR, f"{stem}_raw{ext}")
        try:
            await assemble_chunks_async(upload_dir, raw_path, payload.total_chunks)
        except FileNotFoundError as e:
            raise HTTPException(status_code=400, detail=str(e))
        try:
            await asyncio.to_thread(shutil.rmtree, upload_dir)
        except Exception as e:
            logger.warning("Error cleaning up temporary chunks directory: %s", type(e).__name__)

        mp4_path = os.path.join(VIDEOS_DIR, f"{stem}_pitch.mp4")
        fallback_path = os.path.join(VIDEOS_DIR, f"{stem}_pitch_src{ext}")
        final_path, final_filename = await transcode_to_streaming_mp4(raw_path, mp4_path, fallback_path)
        poster_url = await extract_poster_thumbnail(final_path, os.path.join(VIDEOS_DIR, f"{stem}_poster.jpg"))
        duration_sec = await probe_video_duration(final_path)

        video_url = f"{get_settings().public_api_url}/uploads/videos/{final_filename}"
        await self.media_repo.update_video_pitch_url(profile.id, video_url)
        if poster_url:
            await self.media_repo.upsert_pitch_poster(profile.id, poster_url)
        await NotificationService(self.db).dispatch_event(
            identity_id=current_user.id, event_type="VIDEO_PITCH_READY",
            title="Your Video Pitch Is Live",
            message="Your streaming MP4 video pitch and poster thumbnail have been published to your profile.",
            deep_link=f"/user/{clean_username}?pitch=ready", send_email=False, category="general", auto_commit=False,
        )
        await self.db.commit()
        await invalidate_candidate_cache(clean_username)
        return {
            "status": "completed", "video_url": video_url, "poster_url": poster_url,
            "duration": duration_sec, "filename": final_filename,
            "message": "All chunks assembled into optimized streaming video pitch, and thumbnail generated successfully!",
        }

    async def get_video_transcoding_status(self, username: str) -> Dict[str, Any]:
        p_row = await self.media_repo.get_video_status(username)
        if not p_row:
            raise HTTPException(status_code=404, detail="Candidate not found")
        if p_row.video_pitch_url:
            return {"status": "ready", "video_url": p_row.video_pitch_url, "poster_url": p_row.video_pitch_poster, "duration_seconds": 30}
        return {"status": "empty", "video_url": None, "poster_url": None, "duration_seconds": 0}

    async def get_cv_studio_draft(
        self, username: str, current_user: Optional[AuthenticatedUser] = None
    ) -> Dict[str, Any]:
        clean_username = username.lower().strip()
        row = await self.media_repo.get_candidate_for_pdf(clean_username)
        if not row:
            raise HTTPException(status_code=404, detail="Profile is private or not found")
        is_owner = current_user is not None and (
            current_user.username.lower().strip() == clean_username or current_user.role == "admin"
        )
        if row.is_hidden and not is_owner:
            raise HTTPException(status_code=404, detail="Profile is private or not found")

        jobs = await self.profile_facade.get_jobs(row.id)
        education_rows = await self.profile_facade.get_education(row.id)
        skills = await self.profile_facade.get_skills(row.id)
        skills_str = ", ".join(skills) if skills else "Python, FastAPI, PostgreSQL, TypeScript, Docker"
        full_name = f"{row.first_name or ''} {row.last_name or ''}".strip() or clean_username
        headline = row.headline or "Senior Software Engineer"
        summary = row.bio or f"{headline} experienced in building scalable production systems with {skills_str}."

        exp_items = [
            {
                "company": j.get("company_name") or "Belooga Tech Partner",
                "role": j.get("title") or headline,
                "period": f"{j.get('from_date_year', 2022)} - {'Present' if j.get('currently_work_here') else j.get('to_date_year', 2025)}",
                "bullets": [b.strip() for b in (j.get("description") or "").split("\n") if b.strip()]
                or [f"Engineered and scaled production services using {skills_str}, maintaining 99.95% SLA."],
            }
            for j in jobs
        ] or [{
            "company": "Enterprise Cloud Platform", "role": headline, "period": "2022 - Present",
            "bullets": [
                f"Architected high-throughput backend and full-stack workflows using {skills_str}, handling 25,000+ RPS.",
                "Reduced p95 API latency by 40% through indexed PostgreSQL queries and async task pipelines.",
            ],
        }]
        edu_items = [
            {
                "institution": ed.get("school_name") or "University of Technology",
                "degree": ed.get("degree") or "B.Sc.",
                "field_of_study": ed.get("field_of_study") or "Computer Science",
                "period": f"{ed.get('from_date_year', 2018)} - {ed.get('to_date_year') or '2022'}",
            }
            for ed in education_rows
        ]

        def _build_cv_text(d: Dict[str, Any]) -> str:
            exp_lines = [f"{e.get('role', '')} @ {e.get('company', '')}: {' '.join(e.get('bullets') or [])}" for e in (d.get("experience") or [])]
            edu_lines = [f"{ed.get('degree', '')} {ed.get('field_of_study', '')} — {ed.get('institution', '')}".strip() for ed in (d.get("education") or [])]
            return "\n".join(filter(None, [d.get("full_name"), d.get("headline"), d.get("summary"), f"Skills: {d.get('skills')}" if d.get("skills") else "", *exp_lines, *edu_lines]))

        saved_json = await self.media_repo.get_cv_studio_draft(row.id)
        draft = json.loads(saved_json) if saved_json else {
            "full_name": full_name, "email": (row.email or "") if is_owner else "",
            "phone": (row.phone or "") if is_owner else "", "headline": headline,
            "summary": summary, "skills": skills_str, "font_size": 10.0,
            "line_height": 1.3, "margin_size": 0.6, "snap_one_page": True,
            "experience": exp_items, "education": edu_items,
        }
        if not is_owner:
            draft["email"] = ""
            draft["phone"] = ""
        draft["experience"] = draft.get("experience") or exp_items
        draft["education"] = draft.get("education") or edu_items
        draft["skills"] = draft.get("skills") or skills_str
        draft["cv_text"] = _build_cv_text(draft)
        return draft

    async def save_cv_studio_draft(
        self, username: str, payload: CVStudioDraftPayload, current_user: AuthenticatedUser
    ) -> Dict[str, Any]:
        profile, clean_username = await self._require_owned_profile(username, current_user)
        data = payload.model_dump()
        await self.media_repo.upsert_cv_studio_draft(
            profile_id=profile.id, draft_json=json.dumps(data, ensure_ascii=False),
            headline=payload.headline, summary=payload.summary,
        )
        await self.db.commit()
        await invalidate_candidate_cache(clean_username)
        return data
