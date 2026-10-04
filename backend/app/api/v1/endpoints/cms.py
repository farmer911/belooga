import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.database import get_db

router = APIRouter()

class ContactInquiryRequest(BaseModel):
    name: str
    email: EmailStr
    message: str

class ReportProfileRequest(BaseModel):
    reason: str

class JobApplicantRequest(BaseModel):
    applicant_name: str
    applicant_email: EmailStr
    resume_url: str

@router.post("/contact/", status_code=status.HTTP_201_CREATED, tags=["Domain 8: Public CMS & Moderation"])
async def submit_contact_inquiry(payload: ContactInquiryRequest, db: AsyncSession = Depends(get_db)):
    inquiry_id = uuid.uuid4()
    await db.execute(
        text("INSERT INTO contact_inquiries (id, name, email, message) VALUES (:id, :n, :e, :m)"),
        {"id": inquiry_id, "n": payload.name, "e": payload.email, "m": payload.message}
    )
    await db.commit()
    return {"message": "Thank you! Your inquiry has been received.", "id": str(inquiry_id)}

@router.get("/faqs", tags=["Domain 8: Public CMS & Moderation"])
async def get_faqs():
    return [
        {
            "id": 1,
            "category": "Candidate Experience",
            "question": "What is the 30-second elevator pitch video?",
            "answer": "It is an authentic short video where you introduce yourself, highlight your primary superpowers, and articulate what kind of team you want to join."
        },
        {
            "id": 2,
            "category": "Candidate Experience",
            "question": "Can I re-record my video elevator pitch?",
            "answer": "Yes! You can record or upload as many takes as you want inside your candidate workspace until you are 100% satisfied."
        },
        {
            "id": 3,
            "category": "Privacy & Security",
            "question": "Who can view my candidate profile?",
            "answer": "You have full control. You can set your profile to Public for recruiters, or keep it Hidden while continuing to refine your credentials."
        },
        {
            "id": 4,
            "category": "Recruiters",
            "question": "How do recruiters contact candidates?",
            "answer": "Recruiters can review video pitches, verify timelines, and contact candidates directly via their verified email or phone."
        }
    ]

@router.get("/career/jobs/", tags=["Domain 8: Public CMS & Moderation"])
async def list_career_jobs(db: AsyncSession = Depends(get_db)):
    res = await db.execute(text("SELECT id, title, department, location, description FROM career_postings WHERE is_active = TRUE"))
    jobs = [dict(r._mapping) for r in res.fetchall()]
    if not jobs:
        jobs = [
            {"id": "c1", "title": "Staff Full-Stack Engineer", "department": "Engineering", "location": "Remote / San Francisco", "description": "Build high-throughput async services and sleek Next.js interfaces."},
            {"id": "c2", "title": "Lead Product Designer", "department": "Design", "location": "San Francisco, CA", "description": "Craft intuitive candidate workspaces and seamless WebRTC video studios."},
            {"id": "c3", "title": "Head of Talent Partnerships", "department": "Operations", "location": "New York, NY", "description": "Expand employer networks across top high-growth tech companies."}
        ]
    return jobs

@router.post("/profile/{user_id}/report/", tags=["Domain 8: Public CMS & Moderation"])
async def report_candidate_profile(user_id: str, payload: ReportProfileRequest, db: AsyncSession = Depends(get_db)):
    report_id = uuid.uuid4()
    await db.execute(
        text("INSERT INTO profile_reports (id, reported_profile_id, reason) VALUES (:id, :pid, :r)"),
        {"id": report_id, "pid": user_id, "r": payload.reason}
    )
    await db.commit()
    return {"message": "Candidate profile reported. Our trust and safety team will investigate.", "id": str(report_id)}
