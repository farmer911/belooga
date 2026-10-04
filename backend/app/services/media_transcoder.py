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

from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

DEFAULT_UPLOAD_BASE = (
    "/app/uploads"
    if os.path.exists("/app") and os.access("/app", os.W_OK)
    else os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads"))
)
UPLOAD_BASE = os.getenv("UPLOAD_DIR", DEFAULT_UPLOAD_BASE)
AVATARS_DIR = os.path.join(UPLOAD_BASE, "avatars")
RESUMES_DIR = os.path.join(UPLOAD_BASE, "resumes")
VIDEOS_DIR = os.path.join(UPLOAD_BASE, "videos")
CHUNKS_DIR = os.path.join(UPLOAD_BASE, "chunks")

for d in [AVATARS_DIR, RESUMES_DIR, VIDEOS_DIR, CHUNKS_DIR]:
    os.makedirs(d, exist_ok=True)

UPLOAD_ID_REGEX = re.compile(r"^upload_\d+_[a-zA-Z0-9]+$")


def get_validated_upload_dir(upload_id: str, user_id: Optional[uuid.UUID] = None) -> str:
    """Strictly validates upload_id against path traversal attacks and scopes by user."""
    if not UPLOAD_ID_REGEX.match(upload_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid upload session identifier format",
        )
    base_dir = os.path.join(CHUNKS_DIR, str(user_id)) if user_id else CHUNKS_DIR
    os.makedirs(base_dir, exist_ok=True)
    chunks_base_real = os.path.realpath(base_dir)
    resolved_path = os.path.realpath(os.path.join(base_dir, upload_id))
    if not resolved_path.startswith(chunks_base_real + os.sep):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Path traversal attempt detected",
        )
    return resolved_path


def _write_bytes_sync(path: str, data: bytes) -> None:
    with open(path, "wb") as f:
        f.write(data)


async def write_bytes_async(path: str, data: bytes) -> None:
    await asyncio.to_thread(_write_bytes_sync, path, data)


def _assemble_chunks_sync(upload_dir: str, target_path: str, total_chunks: int) -> None:
    with open(target_path, "wb") as outfile:
        for idx in range(total_chunks):
            chunk_filename = f"chunk_{idx:05d}"
            chunk_path = os.path.join(upload_dir, chunk_filename)
            if not os.path.exists(chunk_path):
                raise FileNotFoundError(f"Missing chunk index {idx}")
            with open(chunk_path, "rb") as infile:
                outfile.write(infile.read())


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
    transcode_success = False
    try:
        proc = await run_cmd_async(
            [
                "ffmpeg", "-y", "-i", raw_path, "-c:v", "libx264", "-preset", "veryfast",
                "-crf", "23", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", mp4_path,
            ],
            timeout=45,
        )
        if proc.returncode == 0 and os.path.exists(mp4_path) and os.path.getsize(mp4_path) > 0:
            transcode_success = True
    except Exception as e:
        logger.warning(f"Error during MP4 transcode: {e}")

    if transcode_success:
        try:
            await asyncio.to_thread(os.remove, raw_path)
        except Exception:
            pass
        return mp4_path, os.path.basename(mp4_path)
    else:
        try:
            await asyncio.to_thread(os.rename, raw_path, fallback_path)
        except Exception:
            fallback_path = raw_path
        return fallback_path, os.path.basename(fallback_path)


async def extract_poster_thumbnail(video_path: str, poster_path: str) -> Optional[str]:
    """Extracts thumbnail poster at 0.5s with fallback to first frame."""
    try:
        await run_cmd_async(
            ["ffmpeg", "-y", "-ss", "00:00:00.500", "-i", video_path, "-vframes", "1", "-q:v", "2", "-update", "1", poster_path],
            timeout=10,
        )
    except Exception as e:
        logger.warning(f"Error extracting frame at 0.5s: {e}")

    if not os.path.exists(poster_path) or os.path.getsize(poster_path) == 0:
        try:
            await run_cmd_async(
                ["ffmpeg", "-y", "-i", video_path, "-vframes", "1", "-q:v", "2", "-update", "1", poster_path],
                timeout=10,
            )
        except Exception as e:
            logger.warning(f"Fallback frame extraction error: {e}")

    if os.path.exists(poster_path) and os.path.getsize(poster_path) > 0:
        return f"http://localhost:8000/uploads/videos/{os.path.basename(poster_path)}"
    return "/images/home/matt-poster.png"


async def probe_video_duration(video_path: str) -> int:
    """Probes video duration in seconds via ffprobe."""
    duration_sec = 30
    try:
        dur_proc = await run_cmd_async(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", video_path],
            capture_output=True,
            timeout=5,
        )
        if dur_proc.stdout and dur_proc.stdout.strip():
            duration_sec = int(round(float(dur_proc.stdout.strip())))
    except Exception as e:
        logger.warning(f"Duration probe error: {e}")
    return duration_sec
