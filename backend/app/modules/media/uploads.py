"""Upload validation: magic-byte type sniffing, size-capped streaming writes, random filenames."""

import os
import secrets
from typing import Dict, Optional

from fastapi import HTTPException, UploadFile

from app.services.media_transcoder import save_upload_capped

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
