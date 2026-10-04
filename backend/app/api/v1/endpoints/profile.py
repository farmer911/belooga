import uuid
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.database import get_db
from app.core.security import get_current_user, get_current_user_optional, AuthenticatedUser, verify_profile_owner

router = APIRouter()

class ProfileUpdate(BaseModel):
    headline: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    seeking_status: Optional[str] = None
    employment_status: Optional[str] = None

class SkillAdd(BaseModel):
    name: str

@router.get("/profile/{username}", tags=["Domain 2: Candidate Profile"])
async def get_candidate_public_profile(
    username: str,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    clean_username = username.lower().strip()

    # Query candidate profile
    query = text("""
        SELECT p.id, p.identity_id, p.username, p.first_name, p.last_name,
               p.headline, p.bio, p.location, p.phone, p.employment_status,
               p.seeking_status, p.avatar_url, p.video_pitch_url, p.resume_url,
               p.is_hidden, p.is_fresh, p.created_at,
               i.email
        FROM candidate_profiles p
        JOIN identities i ON i.id = p.identity_id
        WHERE p.username = :username
        LIMIT 1
    """)
    res = await db.execute(query, {"username": clean_username})
    row = res.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate @{username} not found"
        )

    # Privacy Guard: Hidden profile can only be viewed by its owner or admin
    is_owner = current_user is not None and (
        current_user.username.lower() == clean_username or current_user.role == "admin"
    )
    if row.is_hidden and not is_owner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate @{username} not found"
        )

    profile_id = row.id

    # Fetch Job Experiences
    jobs_res = await db.execute(
        text("""
            SELECT id, title, company_name, from_date_month, from_date_year,
                   currently_work_here, to_date_month, to_date_year, description,
                   logo_url, display_order
            FROM job_experiences
            WHERE profile_id = :pid
            ORDER BY display_order ASC, from_date_year DESC NULLS LAST
        """),
        {"pid": profile_id}
    )
    jobs = [dict(r._mapping) for r in jobs_res.fetchall()]

    # Fetch Education
    edu_res = await db.execute(
        text("""
            SELECT id, school_name, degree_name, gpa, from_date_month, from_date_year,
                   currently_work_here, to_date_month, to_date_year, description,
                   logo_url, display_order
            FROM education_experiences
            WHERE profile_id = :pid
            ORDER BY display_order ASC
        """),
        {"pid": profile_id}
    )
    education = [dict(r._mapping) for r in edu_res.fetchall()]

    # Fetch Skills
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

    # Fetch Poster from profile_media
    poster_res = await db.execute(
        text("SELECT file_url FROM profile_media WHERE profile_id = :pid AND category = 'pitch_poster' LIMIT 1"),
        {"pid": profile_id}
    )
    poster_row = poster_res.fetchone()
    video_pitch_poster = poster_row[0] if poster_row else None

    # Fetch Languages
    langs_res = await db.execute(
        text("""
            SELECT l.name, pl.proficiency
            FROM languages l
            JOIN profile_languages pl ON pl.language_id = l.id
            WHERE pl.profile_id = :pid
            ORDER BY l.name ASC
        """),
        {"pid": profile_id}
    )
    languages = [{"name": r[0], "proficiency": r[1]} for r in langs_res.fetchall()]

    # Fetch Interests
    int_res = await db.execute(
        text("""
            SELECT i.name
            FROM interests i
            JOIN profile_interests pi ON pi.interest_id = i.id
            WHERE pi.profile_id = :pid
            ORDER BY i.name ASC
        """),
        {"pid": profile_id}
    )
    interests = [r[0] for r in int_res.fetchall()]

    return {
        "id": str(row.id),
        "username": row.username,
        "first_name": row.first_name,
        "last_name": row.last_name,
        "full_name": f"{row.first_name} {row.last_name}",
        "email": row.email if is_owner else None,
        "headline": row.headline,
        "bio": row.bio,
        "location": row.location,
        "phone": row.phone if is_owner else None,
        "avatar_url": row.avatar_url or "/images/avatar.jpg",
        "video_pitch_url": row.video_pitch_url,
        "video_pitch_poster": video_pitch_poster,
        "resume_url": row.resume_url or f"http://localhost:8000/v1/profile/{clean_username}/pdf/",
        "seeking_status": row.seeking_status,
        "employment_status": row.employment_status,
        "job_experiences": jobs,
        "education_experiences": education,
        "skills": skills,
        "languages": languages,
        "interests": interests
    }

@router.patch("/profile/{username}", tags=["Domain 2: Candidate Profile"])
async def update_candidate_profile(
    username: str,
    payload: ProfileUpdate,
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

    update_fields = []
    values = {"pid": p_row.id}

    if payload.headline is not None:
        update_fields.append("headline = :headline")
        values["headline"] = payload.headline
    if payload.bio is not None:
        update_fields.append("bio = :bio")
        values["bio"] = payload.bio
    if payload.location is not None:
        update_fields.append("location = :location")
        values["location"] = payload.location
    if payload.phone is not None:
        update_fields.append("phone = :phone")
        values["phone"] = payload.phone
    if payload.seeking_status is not None:
        update_fields.append("seeking_status = :seeking_status")
        values["seeking_status"] = payload.seeking_status
    if payload.employment_status is not None:
        update_fields.append("employment_status = :employment_status")
        values["employment_status"] = payload.employment_status

    if update_fields:
        query_str = f"UPDATE candidate_profiles SET {', '.join(update_fields)}, updated_at = NOW() WHERE id = :pid"
        await db.execute(text(query_str), values)
        await db.commit()

    return {"message": "Profile updated successfully"}

@router.post("/profile/{username}/skills/", tags=["Domain 2: Candidate Profile"])
async def add_candidate_skill(
    username: str,
    payload: SkillAdd,
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

    skill_name = payload.name.strip()
    if not skill_name:
        raise HTTPException(status_code=400, detail="Skill name cannot be empty")

    # Insert skill if not exists
    await db.execute(
        text("INSERT INTO skills (id, name) VALUES (:id, :name) ON CONFLICT (name) DO NOTHING"),
        {"id": uuid.uuid4(), "name": skill_name}
    )
    skill_res = await db.execute(text("SELECT id FROM skills WHERE name = :name"), {"name": skill_name})
    s_row = skill_res.fetchone()

    # Link in profile_skills
    if s_row:
        await db.execute(
            text("INSERT INTO profile_skills (profile_id, skill_id) VALUES (:pid, :sid) ON CONFLICT DO NOTHING"),
            {"pid": p_row.id, "sid": s_row.id}
        )
        await db.commit()

    return {"message": f"Skill '{skill_name}' added successfully"}

@router.delete("/profile/{username}/skills/{skill_name}/", tags=["Domain 2: Candidate Profile"])
async def remove_candidate_skill(
    username: str,
    skill_name: str,
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

    skill_res = await db.execute(text("SELECT id FROM skills WHERE name = :name"), {"name": skill_name.strip()})
    s_row = skill_res.fetchone()
    if s_row:
        await db.execute(
            text("DELETE FROM profile_skills WHERE profile_id = :pid AND skill_id = :sid"),
            {"pid": p_row.id, "sid": s_row.id}
        )
        await db.commit()

    return {"message": f"Skill '{skill_name}' removed"}
