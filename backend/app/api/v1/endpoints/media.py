"""Media and file upload endpoints (Thin Controller).

Security Invariants:
- Path Traversal Defense: upload_id format validated against UPLOAD_ID_REGEX;
  scoped via os.path.realpath checking directory boundaries.
- Non-blocking I/O: Heavy file operations, ReportLab doc.build, and chunk assembly
  delegated to threadpool via asyncio.to_thread in MediaService and MediaTranscoder.
"""

import re
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, Response, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

UPLOAD_ID_REGEX = re.compile(r"^upload_\d+_[a-zA-Z0-9]+$")

from app.core.database import get_db
from app.core.security import AuthenticatedUser, get_current_user, get_current_user_optional
from app.schemas.media import CompleteUploadRequest
from app.services.media_service import MediaService
from app.services.media_transcoder import UPLOAD_BASE

router = APIRouter()


@router.patch("/profile/{username}/avatar/", tags=["Domain 4: Media & Uploads"])
async def upload_avatar(
    username: str,
    file: UploadFile = File(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MediaService(db)
    return await service.upload_avatar(username, file, current_user)


@router.patch("/profile/{username}/resume/", tags=["Domain 4: Media & Uploads"])
async def upload_resume(
    username: str,
    file: UploadFile = File(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MediaService(db)
    return await service.upload_resume(username, file, current_user)


@router.delete("/profile/{username}/resume/", tags=["Domain 4: Media & Uploads"])
async def delete_resume(
    username: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MediaService(db)
    return await service.delete_resume(username, current_user)


@router.get("/profile/{username}/pdf/", tags=["Domain 4: Media & Uploads"])
async def generate_candidate_pdf(
    username: str,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    service = MediaService(db)
    return await service.generate_candidate_pdf(username, current_user)


@router.post("/media/upload/chunk", tags=["Domain 4: Media & Uploads"])
async def upload_video_chunk(
    upload_id: str = Form(...),
    chunk_index: int = Form(...),
    total_chunks: int = Form(...),
    username: str = Form(...),
    file: UploadFile = File(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MediaService(db)
    return await service.upload_video_chunk(
        upload_id=upload_id,
        chunk_index=chunk_index,
        total_chunks=total_chunks,
        username=username,
        file=file,
        current_user=current_user,
    )


@router.post("/media/upload/complete", tags=["Domain 4: Media & Uploads"])
async def complete_chunked_video_upload(
    payload: CompleteUploadRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MediaService(db)
    return await service.complete_chunked_video_upload(payload, current_user)


@router.get("/profile/{username}/video-status/", tags=["Domain 4: Media & Uploads"])
async def get_video_transcoding_status(
    username: str,
    db: AsyncSession = Depends(get_db),
):
    service = MediaService(db)
    return await service.get_video_transcoding_status(username)
