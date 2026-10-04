import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select

from app.core.database import get_db

router = APIRouter()

# DTOs
class JobExperienceCreate(BaseModel):
    title: str
    company_name: str
    from_date_month: Optional[int] = 1
    from_date_year: Optional[int] = 2022
    currently_work_here: bool = False
    to_date_month: Optional[int] = None
    to_date_year: Optional[int] = None
    description: Optional[str] = ""
    logo_url: Optional[str] = "/images/logo.svg"

class EducationExperienceCreate(BaseModel):
    school_name: str
    degree_name: str
    gpa: Optional[str] = "3.8"
    from_date_month: Optional[int] = 9
    from_date_year: Optional[int] = 2018
    currently_work_here: bool = False
    to_date_month: Optional[int] = 6
    to_date_year: Optional[int] = 2022
    description: Optional[str] = ""

class AwardCertificationCreate(BaseModel):
    title: str
    location_name: Optional[str] = "Global"
    from_date_month: Optional[int] = 1
    from_date_year: Optional[int] = 2023
    description: Optional[str] = ""

class ReorderItem(BaseModel):
    id: str
    order: int

class ReorderRequest(BaseModel):
    orders: List[ReorderItem]

# --- 1. JOB EXPERIENCES ---

@router.get("/profile/{username}/job-experiences/", tags=["Domain 3: Timeline CRUD & Reordering"])
async def list_job_experiences(username: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        text("""
            SELECT j.id, j.title, j.company_name, j.from_date_month, j.from_date_year,
                   j.currently_work_here, j.to_date_month, j.to_date_year, j.description,
                   j.logo_url, j.display_order
            FROM job_experiences j
            JOIN candidate_profiles p ON p.id = j.profile_id
            WHERE p.username = :username
            ORDER BY j.display_order ASC, j.from_date_year DESC NULLS LAST
        """),
        {"username": username.lower().strip()}
    )
    return [dict(r._mapping) for r in res.fetchall()]

@router.post("/profile/{username}/job-experiences/", status_code=status.HTTP_201_CREATED, tags=["Domain 3: Timeline CRUD & Reordering"])
async def create_job_experience(username: str, payload: JobExperienceCreate, db: AsyncSession = Depends(get_db)):
    prof_res = await db.execute(text("SELECT id FROM candidate_profiles WHERE username = :u"), {"u": username.lower().strip()})
    p_row = prof_res.fetchone()
    if not p_row:
        raise HTTPException(status_code=404, detail="Candidate not found")
    profile_id = p_row.id

    # Get max display_order
    max_res = await db.execute(text("SELECT COALESCE(MAX(display_order), -1) + 1 FROM job_experiences WHERE profile_id = :pid"), {"pid": profile_id})
    next_order = max_res.scalar()

    item_id = uuid.uuid4()
    await db.execute(
        text("""
            INSERT INTO job_experiences (
                id, profile_id, title, company_name, from_date_month, from_date_year,
                currently_work_here, to_date_month, to_date_year, description, logo_url, display_order
            ) VALUES (
                :id, :pid, :title, :company_name, :fm, :fy, :cur, :tm, :ty, :desc, :logo, :ord
            )
        """),
        {
            "id": item_id, "pid": profile_id, "title": payload.title, "company_name": payload.company_name,
            "fm": payload.from_date_month, "fy": payload.from_date_year, "cur": payload.currently_work_here,
            "tm": payload.to_date_month, "ty": payload.to_date_year, "desc": payload.description,
            "logo": payload.logo_url, "ord": next_order
        }
    )
    await db.commit()
    return {"id": str(item_id), "display_order": next_order, "message": "Job experience added"}

@router.delete("/profile/{username}/job-experiences/{item_id}/", tags=["Domain 3: Timeline CRUD & Reordering"])
async def delete_job_experience(username: str, item_id: str, db: AsyncSession = Depends(get_db)):
    await db.execute(text("DELETE FROM job_experiences WHERE id = :id"), {"id": item_id})
    await db.commit()
    return {"message": "Job experience deleted"}

@router.post("/profile/{username}/job-experiences/order/", tags=["Domain 3: Timeline CRUD & Reordering"])
async def reorder_job_experiences(username: str, payload: ReorderRequest, db: AsyncSession = Depends(get_db)):
    # Concurrency Control: Pessimistic locking inside explicit transaction
    async with db.begin():
        prof_res = await db.execute(text("SELECT id FROM candidate_profiles WHERE username = :u"), {"u": username.lower().strip()})
        p_row = prof_res.fetchone()
        if not p_row:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        # Lock candidate's jobs for update
        await db.execute(
            text("SELECT id FROM job_experiences WHERE profile_id = :pid FOR UPDATE"),
            {"pid": p_row.id}
        )

        for item in payload.orders:
            await db.execute(
                text("UPDATE job_experiences SET display_order = :ord WHERE id = :id AND profile_id = :pid"),
                {"ord": item.order, "id": item.id, "pid": p_row.id}
            )

    return {"message": "Job experiences reordered successfully"}

# --- 2. EDUCATION EXPERIENCES ---

@router.get("/profile/{username}/education/", tags=["Domain 3: Timeline CRUD & Reordering"])
async def list_education_experiences(username: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        text("""
            SELECT e.id, e.school_name, e.degree_name, e.gpa, e.from_date_month, e.from_date_year,
                   e.currently_work_here, e.to_date_month, e.to_date_year, e.description,
                   e.logo_url, e.display_order
            FROM education_experiences e
            JOIN candidate_profiles p ON p.id = e.profile_id
            WHERE p.username = :username
            ORDER BY e.display_order ASC
        """),
        {"username": username.lower().strip()}
    )
    return [dict(r._mapping) for r in res.fetchall()]

@router.post("/profile/{username}/education/", status_code=status.HTTP_201_CREATED, tags=["Domain 3: Timeline CRUD & Reordering"])
async def create_education(username: str, payload: EducationExperienceCreate, db: AsyncSession = Depends(get_db)):
    prof_res = await db.execute(text("SELECT id FROM candidate_profiles WHERE username = :u"), {"u": username.lower().strip()})
    p_row = prof_res.fetchone()
    if not p_row:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    item_id = uuid.uuid4()
    await db.execute(
        text("""
            INSERT INTO education_experiences (
                id, profile_id, school_name, degree_name, gpa, from_date_month, from_date_year,
                currently_work_here, to_date_month, to_date_year, description, display_order
            ) VALUES (
                :id, :pid, :school, :degree, :gpa, :fm, :fy, :cur, :tm, :ty, :desc, 0
            )
        """),
        {
            "id": item_id, "pid": p_row.id, "school": payload.school_name, "degree": payload.degree_name,
            "gpa": payload.gpa, "fm": payload.from_date_month, "fy": payload.from_date_year,
            "cur": payload.currently_work_here, "tm": payload.to_date_month, "ty": payload.to_date_year,
            "desc": payload.description
        }
    )
    await db.commit()
    return {"id": str(item_id), "message": "Education added successfully"}

@router.delete("/profile/{username}/education/{item_id}/", tags=["Domain 3: Timeline CRUD & Reordering"])
async def delete_education(username: str, item_id: str, db: AsyncSession = Depends(get_db)):
    await db.execute(text("DELETE FROM education_experiences WHERE id = :id"), {"id": item_id})
    await db.commit()
    return {"message": "Education experience deleted"}
