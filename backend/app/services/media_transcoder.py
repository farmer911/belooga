"""Media transcoding and video pipeline utilities.

Non-blocking chunk reassembly, ffmpeg streaming MP4 conversion,
thumbnail poster extraction, and ffprobe duration detection.
"""

import asyncio
import logging
import os
import re
import shutil
import subprocess
from typing import Optional, Tuple
import uuid

from fastapi import HTTPException, UploadFile, status

from app.core.config import get_settings

logger = logging.getLogger(__name__)

DEFAULT_UPLOAD_BASE = (
    "/app/uploads"
    if os.path.exists("/app") and os.access("/app", os.W_OK)
    else os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads"))
)
UPLOAD_BASE = get_settings().UPLOAD_DIR or DEFAULT_UPLOAD_BASE
AVATARS_DIR = os.path.join(UPLOAD_BASE, "avatars")
RESUMES_DIR = os.path.join(UPLOAD_BASE, "resumes")
VIDEOS_DIR = os.path.join(UPLOAD_BASE, "videos")
CHUNKS_DIR = os.path.join(UPLOAD_BASE, "chunks")

for d in [AVATARS_DIR, RESUMES_DIR, VIDEOS_DIR, CHUNKS_DIR]:
    os.makedirs(d, exist_ok=True)

UPLOAD_ID_REGEX = re.compile(r"^upload_\d+_[a-zA-Z0-9]+$")
SAFE_FILENAME_REGEX = re.compile(r"^[a-zA-Z0-9_.-]+$")


def get_validated_upload_dir(upload_id: str, user_id: Optional[uuid.UUID] = None) -> str:
    """Strictly validates upload_id against path traversal attacks and scopes by user."""
    if not UPLOAD_ID_REGEX.match(upload_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid upload session identifier format",
        )
    chunks_root_real = os.path.realpath(CHUNKS_DIR)
    user_segment = str(uuid.UUID(str(user_id))) if user_id else ""
    candidate_rel = os.path.join(user_segment, upload_id) if user_segment else upload_id
    resolved_path = os.path.realpath(os.path.join(chunks_root_real, candidate_rel))
    if not resolved_path.startswith(chunks_root_real + os.sep):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Path traversal attempt detected",
        )
    return resolved_path


def get_validated_video_path(path_or_name: str) -> str:
    """Strictly confines video and poster file paths within VIDEOS_DIR."""
    videos_root_real = os.path.realpath(VIDEOS_DIR)
    filename = os.path.basename(path_or_name)
    if not SAFE_FILENAME_REGEX.match(filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid media filename",
        )
    resolved_path = os.path.realpath(os.path.join(videos_root_real, filename))
    if not resolved_path.startswith(videos_root_real + os.sep):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Media path traversal attempt detected",
        )
    return resolved_path


def _write_bytes_sync(path: str, data: bytes) -> None:
    with open(path, "wb") as f:
        f.write(data)


async def write_bytes_async(path: str, data: bytes) -> None:
    await asyncio.to_thread(_write_bytes_sync, path, data)


class UploadTooLarge(Exception):
    pass


def _copy_capped_sync(src, dest_path: str, max_bytes: int) -> int:
    src.seek(0)
    total = 0
    try:
        with open(dest_path, "wb") as out:
            while chunk := src.read(256 * 1024):
                total += len(chunk)
                if total > max_bytes:
                    raise UploadTooLarge()
                out.write(chunk)
    except BaseException:
        if os.path.exists(dest_path):
            os.remove(dest_path)
        raise
    return total


async def save_upload_capped(file: UploadFile, dest_path: str, max_bytes: int) -> int:
    """Stream an UploadFile to disk in 256 KB blocks; 413 (and no file left) once max_bytes is exceeded."""
    if file.size is not None and file.size > max_bytes:
        raise HTTPException(status_code=413, detail=f"File too large (max {max_bytes // (1024 * 1024)} MB)")
    try:
        return await asyncio.to_thread(_copy_capped_sync, file.file, dest_path, max_bytes)
    except UploadTooLarge:
        raise HTTPException(status_code=413, detail=f"File too large (max {max_bytes // (1024 * 1024)} MB)")


def _dir_size_sync(path: str) -> int:
    return sum(e.stat().st_size for e in os.scandir(path) if e.is_file()) if os.path.isdir(path) else 0


async def dir_size_async(path: str) -> int:
    return await asyncio.to_thread(_dir_size_sync, path)


def _read_head_sync(path: str, n: int) -> bytes:
    with open(path, "rb") as f:
        return f.read(n)


async def read_head_async(path: str, n: int = 16) -> bytes:
    """First n bytes of a file, b"" if it does not exist."""
    try:
        return await asyncio.to_thread(_read_head_sync, path, n)
    except FileNotFoundError:
        return b""


def _nonempty_file_sync(path: str) -> bool:
    return os.path.exists(path) and os.path.getsize(path) > 0


async def nonempty_file_async(path: str) -> bool:
    return await asyncio.to_thread(_nonempty_file_sync, path)


def _assemble_chunks_sync(upload_dir: str, target_path: str, total_chunks: int) -> None:
    with open(target_path, "wb") as outfile:
        for idx in range(total_chunks):
            chunk_filename = f"chunk_{idx:05d}"
            chunk_path = os.path.join(upload_dir, chunk_filename)
            if not os.path.exists(chunk_path):
                raise FileNotFoundError(f"Missing chunk index {idx}")
            with open(chunk_path, "rb") as infile:
                shutil.copyfileobj(infile, outfile)


async def assemble_chunks_async(upload_dir: str, target_path: str, total_chunks: int) -> None:
    await asyncio.to_thread(_assemble_chunks_sync, upload_dir, target_path, total_chunks)


def _run_cmd_sync(cmd: list, timeout: Optional[int] = None, capture_output: bool = False) -> subprocess.CompletedProcess:
    if capture_output:
        return subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=timeout)
    return subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=timeout)


async def run_cmd_async(cmd: list, timeout: Optional[int] = None, capture_output: bool = False) -> subprocess.CompletedProcess:
    return await asyncio.to_thread(_run_cmd_sync, cmd, timeout=timeout, capture_output=capture_output)


async def transcode_to_streaming_mp4(raw_path: str, mp4_path: str, fallback_path: str) -> Tuple[str, str]:
    """Transcodes raw webm into streaming MP4 with fallback."""
    safe_raw = get_validated_video_path(raw_path)
    safe_mp4 = get_validated_video_path(mp4_path)
    safe_fallback = get_validated_video_path(fallback_path)
    transcode_success = False
    try:
        proc = await run_cmd_async(
            [
                "ffmpeg", "-y", "-i", safe_raw, "-c:v", "libx264", "-preset", "veryfast",
                "-crf", "23", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", safe_mp4,
            ],
            timeout=45,
        )
        if proc.returncode == 0 and await nonempty_file_async(safe_mp4):
            transcode_success = True
    except Exception as e:
        logger.warning("Error during MP4 transcode: %s", type(e).__name__)

    if transcode_success:
        try:
            await asyncio.to_thread(os.remove, safe_raw)
        except OSError as cleanup_err:
            logger.debug("Raw video cleanup skipped: %s", type(cleanup_err).__name__)
        return safe_mp4, os.path.basename(safe_mp4)
    else:
        try:
            await asyncio.to_thread(os.rename, safe_raw, safe_fallback)
        except Exception:
            safe_fallback = safe_raw
        return safe_fallback, os.path.basename(safe_fallback)


async def extract_poster_thumbnail(video_path: str, poster_path: str) -> Optional[str]:
    """Extracts thumbnail poster at 0.5s with fallback to first frame."""
    safe_video = get_validated_video_path(video_path)
    safe_poster = get_validated_video_path(poster_path)
    try:
        await run_cmd_async(
            ["ffmpeg", "-y", "-ss", "00:00:00.500", "-i", safe_video, "-vframes", "1", "-q:v", "2", "-update", "1", safe_poster],
            timeout=10,
        )
    except Exception as e:
        logger.warning("Error extracting frame at 0.5s: %s", type(e).__name__)

    if not await nonempty_file_async(safe_poster):
        try:
            await run_cmd_async(
                ["ffmpeg", "-y", "-i", safe_video, "-vframes", "1", "-q:v", "2", "-update", "1", safe_poster],
                timeout=10,
            )
        except Exception as e:
            logger.warning("Fallback frame extraction error: %s", type(e).__name__)

    if await nonempty_file_async(safe_poster):
        return f"{get_settings().public_api_url}/uploads/videos/{os.path.basename(safe_poster)}"
    return "/images/home/matt-poster.png"


async def probe_video_duration(video_path: str) -> int:
    """Probes video duration in seconds via ffprobe."""
    safe_video = get_validated_video_path(video_path)
    duration_sec = 30
    try:
        dur_proc = await run_cmd_async(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", safe_video],
            capture_output=True,
            timeout=5,
        )
        if dur_proc.stdout and dur_proc.stdout.strip():
            duration_sec = int(round(float(dur_proc.stdout.strip())))
    except Exception as e:
        logger.warning("Duration probe error: %s", type(e).__name__)
    return duration_sec
