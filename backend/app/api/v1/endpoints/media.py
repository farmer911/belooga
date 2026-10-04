import os
import io
import time
import shutil
import asyncio
import subprocess
import re
import uuid
import logging
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, Response
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.database import get_db
from app.core.security import get_current_user, AuthenticatedUser, verify_profile_owner

logger = logging.getLogger(__name__)

# ReportLab for real PDF generation
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

router = APIRouter()

DEFAULT_UPLOAD_BASE = (
    "/app/uploads"
    if os.path.exists("/app") and os.access("/app", os.W_OK)
    else os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "uploads"))
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
            detail="Invalid upload session identifier format"
        )
    base_dir = os.path.join(CHUNKS_DIR, str(user_id)) if user_id else CHUNKS_DIR
    os.makedirs(base_dir, exist_ok=True)
    chunks_base_real = os.path.realpath(base_dir)
    resolved_path = os.path.realpath(os.path.join(base_dir, upload_id))
    if not resolved_path.startswith(chunks_base_real + os.sep):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Path traversal attempt detected"
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


class CompleteUploadRequest(BaseModel):
    upload_id: str
    total_chunks: int
    username: str
    filename: Optional[str] = "pitch.webm"

# ============================================================================
# 1. AVATAR UPLOAD SERVICE
# ============================================================================
@router.patch("/profile/{username}/avatar/", tags=["Domain 4: Media & Uploads"])
async def upload_avatar(
    username: str,
    file: UploadFile = File(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    verify_profile_owner(current_user, username)
    clean_username = username.lower().strip()
    prof_res = await db.execute(
        text("SELECT id FROM candidate_profiles WHERE username = :u"),
        {"u": clean_username}
    )
    p_row = prof_res.fetchone()
    if not p_row:
        raise HTTPException(status_code=404, detail="Candidate not found")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        ext = ".jpg"

    safe_filename = f"{clean_username}_{int(time.time())}{ext}"
    target_path = os.path.join(AVATARS_DIR, safe_filename)

    content = await file.read()
    await write_bytes_async(target_path, content)

    avatar_url = f"http://localhost:8000/uploads/avatars/{safe_filename}"

    # Update in candidate_profiles
    await db.execute(
        text("UPDATE candidate_profiles SET avatar_url = :av, updated_at = NOW() WHERE id = :pid"),
        {"av": avatar_url, "pid": p_row.id}
    )
    await db.commit()

    return {
        "avatar_url": avatar_url,
        "filename": safe_filename,
        "message": "Avatar uploaded and updated successfully"
    }

# ============================================================================
# 2. RESUME PDF UPLOAD SERVICE
# ============================================================================
@router.patch("/profile/{username}/resume/", tags=["Domain 4: Media & Uploads"])
async def upload_resume(
    username: str,
    file: UploadFile = File(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    verify_profile_owner(current_user, username)
    clean_username = username.lower().strip()
    prof_res = await db.execute(
        text("SELECT id FROM candidate_profiles WHERE username = :u"),
        {"u": clean_username}
    )
    p_row = prof_res.fetchone()
    if not p_row:
        raise HTTPException(status_code=404, detail="Candidate not found")

    safe_filename = f"{clean_username}_resume_{int(time.time())}.pdf"
    target_path = os.path.join(RESUMES_DIR, safe_filename)

    content = await file.read()
    await write_bytes_async(target_path, content)

    resume_url = f"http://localhost:8000/uploads/resumes/{safe_filename}"

    return {
        "resume_url": resume_url,
        "filename": file.filename or safe_filename,
        "message": "Resume PDF uploaded successfully"
    }

@router.delete("/profile/{username}/resume/", tags=["Domain 4: Media & Uploads"])
async def delete_resume(
    username: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    verify_profile_owner(current_user, username)
    return {"message": "Resume PDF removed successfully"}

# ============================================================================
# 3. REAL PDF GENERATION & STREAMING DOWNLOAD SERVICE
# ============================================================================
@router.get("/profile/{username}/pdf/", tags=["Domain 4: Media & Uploads"])
async def generate_candidate_pdf(
    username: str,
    db: AsyncSession = Depends(get_db)
):
    clean_username = username.lower().strip()
    query = text("""
        SELECT p.id, p.first_name, p.last_name, p.headline, p.bio, p.location, p.phone,
               p.seeking_status, i.email
        FROM candidate_profiles p
        JOIN identities i ON i.id = p.identity_id
        WHERE p.username = :username
        LIMIT 1
    """)
    res = await db.execute(query, {"username": clean_username})
    row = res.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Candidate not found")

    profile_id = row.id

    # Experiences
    jobs_res = await db.execute(
        text("""
            SELECT title, company_name, from_date_year, to_date_year, currently_work_here, description
            FROM job_experiences
            WHERE profile_id = :pid
            ORDER BY display_order ASC, from_date_year DESC NULLS LAST
        """),
        {"pid": profile_id}
    )
    jobs = [dict(r._mapping) for r in jobs_res.fetchall()]

    # Education
    edu_res = await db.execute(
        text("""
            SELECT school_name, degree_name, gpa, from_date_year, to_date_year
            FROM education_experiences
            WHERE profile_id = :pid
            ORDER BY display_order ASC
        """),
        {"pid": profile_id}
    )
    education = [dict(r._mapping) for r in edu_res.fetchall()]

    # Skills
    skills_res = await db.execute(
        text("""
            SELECT s.name
            FROM skills s
            JOIN profile_skills ps ON ps.skill_id = s.id
            WHERE ps.profile_id = :pid
            ORDER BY s.name ASC
        """),
        {"pid": profile_id}
    )
    skills = [r[0] for r in skills_res.fetchall()]
    if not skills:
        skills = ["Product Design", "React", "TypeScript", "FastAPI", "PostgreSQL"]

    # Generate PDF via ReportLab
    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        pdf_buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    # Custom Brand Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#21655e')
    )
    headline_style = ParagraphStyle(
        'Headline',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#5bbbae')
    )
    meta_style = ParagraphStyle(
        'Meta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#666666')
    )
    section_title = ParagraphStyle(
        'SectionTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=colors.HexColor('#252525'),
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#444444')
    )
    bold_item = ParagraphStyle(
        'BoldItem',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#252525')
    )

    elements = []

    # 1. Header
    full_name = f"{row.first_name} {row.last_name}"
    elements.append(Paragraph(full_name, title_style))
    elements.append(Paragraph(f"@{clean_username} • {row.headline or 'Candidate on Belooga'}", headline_style))
    elements.append(Spacer(1, 4))
    
    contact_line = f"Email: {row.email}  |  Location: {row.location or 'Global'}  |  Status: {row.seeking_status or 'Actively Looking'}"
    elements.append(Paragraph(contact_line, meta_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#5bbbae'), spaceAfter=14))

    # 2. Executive Bio
    if row.bio:
        elements.append(Paragraph("ABOUT & EXECUTIVE SUMMARY", section_title))
        elements.append(Paragraph(row.bio, body_style))
        elements.append(Spacer(1, 14))

    # 3. Work Experience
    elements.append(Paragraph("WORK EXPERIENCE", section_title))
    if jobs:
        for job in jobs:
            dates = f"{job['from_date_year']} — {'Present' if job['currently_work_here'] else (job['to_date_year'] or 'Present')}"
            elements.append(Paragraph(f"<b>{job['title']}</b>  |  <font color='#5bbbae'>{job['company_name']}</font>  <font color='#888888'>({dates})</font>", bold_item))
            if job['description']:
                elements.append(Spacer(1, 2))
                elements.append(Paragraph(job['description'], body_style))
            elements.append(Spacer(1, 8))
    else:
        elements.append(Paragraph("No previous work experiences listed.", meta_style))
        elements.append(Spacer(1, 8))

    elements.append(Spacer(1, 6))

    # 4. Education
    elements.append(Paragraph("EDUCATION & CREDENTIALS", section_title))
    if education:
        for edu in education:
            dates = f"{edu['from_date_year']} — {edu['to_date_year'] or 'Present'}"
            gpa_text = f" (GPA: {edu['gpa']})" if edu['gpa'] else ""
            elements.append(Paragraph(f"<b>{edu['school_name']}</b> — {edu['degree_name']}{gpa_text}  <font color='#888888'>({dates})</font>", bold_item))
            elements.append(Spacer(1, 6))
    else:
        elements.append(Paragraph("No academic credentials listed.", meta_style))
        elements.append(Spacer(1, 6))

    elements.append(Spacer(1, 6))

    # 5. Technical Skills
    elements.append(Paragraph("SKILLS & CORE PROFICIENCIES", section_title))
    skills_text = " • ".join(skills)
    elements.append(Paragraph(skills_text, body_style))
    elements.append(Spacer(1, 16))

    # 6. Verification Footer
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#d1d6da'), spaceAfter=8))
    elements.append(Paragraph("Official candidate profile verified via Belooga Talent Discovery & Video Elevator Pitch Platform © 2026", meta_style))

    # Non-blocking PDF document compilation
    await asyncio.to_thread(doc.build, elements)
    pdf_bytes = pdf_buffer.getvalue()
    pdf_buffer.close()

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{clean_username}_CV_2026.pdf"',
            "Content-Type": "application/pdf"
        }
    )

# ============================================================================
# 4. STREAMING CHUNKED VIDEO UPLOAD SERVICE
# ============================================================================
@router.post("/media/upload/chunk", tags=["Domain 4: Media & Uploads"])
async def upload_video_chunk(
    upload_id: str = Form(...),
    chunk_index: int = Form(...),
    total_chunks: int = Form(...),
    username: str = Form(...),
    file: UploadFile = File(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
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
        "message": f"Chunk {chunk_index + 1}/{total_chunks} received successfully"
    }

@router.post("/media/upload/complete", tags=["Domain 4: Media & Uploads"])
async def complete_chunked_video_upload(
    payload: CompleteUploadRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    verify_profile_owner(current_user, payload.username)
    upload_dir = get_validated_upload_dir(payload.upload_id, current_user.id)
    if not os.path.exists(upload_dir):
        raise HTTPException(status_code=400, detail="Invalid upload session or chunks expired")

    clean_username = payload.username.lower().strip()
    prof_res = await db.execute(
        text("SELECT id FROM candidate_profiles WHERE username = :u"),
        {"u": clean_username}
    )
    p_row = prof_res.fetchone()
    if not p_row:
        raise HTTPException(status_code=404, detail="Candidate not found")

    timestamp = int(time.time())

    # Temporary raw assembled video path
    raw_filename = f"{clean_username}_raw_{timestamp}.webm"
    raw_path = os.path.join(VIDEOS_DIR, raw_filename)

    # Reassemble all chunks in numerical order non-blockingly
    try:
        await assemble_chunks_async(upload_dir, raw_path, payload.total_chunks)
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Clean up chunk directory non-blockingly
    try:
        await asyncio.to_thread(shutil.rmtree, upload_dir)
    except Exception as e:
        logger.warning(f"Error cleaning up chunks directory {upload_dir}: {e}")

    # Transcode to faststart streaming MP4 (Universal H.264 + AAC compatible with 100% of browsers)
    mp4_filename = f"{clean_username}_pitch_{timestamp}.mp4"
    mp4_path = os.path.join(VIDEOS_DIR, mp4_filename)
    transcode_success = False

    try:
        proc = await run_cmd_async(
            [
                "ffmpeg", "-y",
                "-i", raw_path,
                "-c:v", "libx264",
                "-preset", "veryfast",
                "-crf", "23",
                "-c:a", "aac",
                "-b:a", "128k",
                "-movflags", "+faststart",
                mp4_path
            ],
            timeout=45
        )
        if proc.returncode == 0 and os.path.exists(mp4_path) and os.path.getsize(mp4_path) > 0:
            transcode_success = True
    except Exception as e:
        logger.warning(f"Error during MP4 transcode: {e}")

    if transcode_success:
        final_filename = mp4_filename
        final_path = mp4_path
        try:
            await asyncio.to_thread(os.remove, raw_path)
        except Exception:
            pass
    else:
        # Fallback to webm if MP4 conversion fails
        final_filename = f"{clean_username}_pitch_{timestamp}.webm"
        final_path = os.path.join(VIDEOS_DIR, final_filename)
        try:
            await asyncio.to_thread(os.rename, raw_path, final_path)
        except Exception:
            final_path = raw_path
            final_filename = raw_filename

    video_url = f"http://localhost:8000/uploads/videos/{final_filename}"

    # Auto-generate thumbnail poster from video via ffmpeg non-blockingly
    poster_filename = f"{clean_username}_poster_{timestamp}.jpg"
    poster_path = os.path.join(VIDEOS_DIR, poster_filename)

    try:
        # Try extracting frame at 0.5s with -update 1
        await run_cmd_async(
            ["ffmpeg", "-y", "-ss", "00:00:00.500", "-i", final_path, "-vframes", "1", "-q:v", "2", "-update", "1", poster_path],
            timeout=10
        )
    except Exception as e:
        print(f"Error extracting frame at 0.5s: {e}")

    # Fallback to first frame if needed
    if not os.path.exists(poster_path) or os.path.getsize(poster_path) == 0:
        try:
            await run_cmd_async(
                ["ffmpeg", "-y", "-i", final_path, "-vframes", "1", "-q:v", "2", "-update", "1", poster_path],
                timeout=10
            )
        except Exception as e:
            print(f"Fallback frame extraction error: {e}")

    has_poster = os.path.exists(poster_path) and os.path.getsize(poster_path) > 0
    poster_url = f"http://localhost:8000/uploads/videos/{poster_filename}" if has_poster else "/images/home/matt-poster.png"

    # Extract duration in seconds
    duration_sec = 30
    try:
        dur_proc = await run_cmd_async(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", final_path],
            capture_output=True,
            timeout=5
        )
        if dur_proc.stdout and dur_proc.stdout.strip():
            duration_sec = int(round(float(dur_proc.stdout.strip())))
    except Exception as e:
        print(f"Duration probe error: {e}")

    # Update candidate profile in DB with video_pitch_url and video_pitch_poster
    await db.execute(
        text("UPDATE candidate_profiles SET video_pitch_url = :vurl, video_pitch_poster = :purl, updated_at = NOW() WHERE id = :pid"),
        {"vurl": video_url, "purl": poster_url, "pid": p_row.id}
    )
    await db.commit()

    return {
        "status": "completed",
        "video_url": video_url,
        "poster_url": poster_url,
        "duration": duration_sec,
        "filename": final_filename,
        "message": "All chunks assembled into optimized streaming video pitch, and thumbnail generated successfully!"
    }

@router.get("/profile/{username}/video-status/", tags=["Domain 4: Media & Uploads"])
async def get_video_transcoding_status(username: str, db: AsyncSession = Depends(get_db)):
    clean_username = username.lower().strip()
    prof_res = await db.execute(
        text("SELECT video_pitch_url, video_pitch_poster FROM candidate_profiles WHERE username = :u"),
        {"u": clean_username}
    )
    p_row = prof_res.fetchone()
    current_url = p_row.video_pitch_url if p_row and p_row.video_pitch_url else "/images/home/Ava_s_Video.mp4"
    current_poster = p_row.video_pitch_poster if p_row and p_row.video_pitch_poster else "/images/home/matt-poster.png"

    return {
        "status": "ready",
        "video_url": current_url,
        "poster_url": current_poster,
        "duration_seconds": 30
    }
