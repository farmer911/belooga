"""ATS Diagnostics, Recruiter Talent Shortlist & Market Pulse Controller."""

from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import AuthenticatedUser, get_current_user_optional
from app.modules.ats_matching import ATSMatchingService
from app.schemas.ats_matching import (
    ATSScanHistoryItem,
    ATSScanRequest,
    ATSScanResponse,
    ATSTailorResponse,
    InterviewKitRequest,
    InterviewKitResponse,
    TalentMarketPulseResponse,
    TalentShortlistRequest,
    TalentShortlistResponse,
)

router = APIRouter(prefix="/match", tags=["Domain 10: ATS Diagnostics & JD Matching"])


@router.post("/ats-scan", response_model=ATSScanResponse)
async def scan_and_match_cv_jd(
    request: ATSScanRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """Scan and match candidate CV against a target Job Description."""
    candidate_id = current_user.id if current_user else None
    service = ATSMatchingService(db)
    return await service.scan_and_match(request=request, candidate_identity_id=candidate_id)


@router.post("/tailor-cv", response_model=ATSTailorResponse, status_code=status.HTTP_200_OK)
async def tailor_cv(
    request: ATSScanRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """Rewrite weak CV bullets with quantified STAR metrics, inject missing JD skills, and persist re-scored match."""
    candidate_id = current_user.id if current_user else None
    service = ATSMatchingService(db)
    return await service.tailor_cv(request=request, candidate_identity_id=candidate_id)


@router.get("/history", response_model=List[ATSScanHistoryItem])
async def list_ats_scan_history(
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """List recent ATS scan history from PostgreSQL."""
    candidate_id = current_user.id if current_user else None
    service = ATSMatchingService(db)
    return await service.list_scan_history(candidate_identity_id=candidate_id)


@router.post("/talent-shortlist", response_model=TalentShortlistResponse)
async def generate_recruiter_talent_shortlist(
    request: TalentShortlistRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """Rank and shortlist verified candidates against a target JD using GIN search_vector + video pitch readiness."""
    _ = current_user
    service = ATSMatchingService(db)
    return await service.generate_talent_shortlist(request=request)


@router.get("/market-pulse", response_model=TalentMarketPulseResponse)
async def get_talent_market_pulse(
    db: AsyncSession = Depends(get_db),
):
    """Return real-time talent pool scarcity index, video pitch adoption rate, and hiring velocity telemetry."""
    service = ATSMatchingService(db)
    return await service.get_market_pulse()


@router.post("/interview-kit", response_model=InterviewKitResponse)
async def generate_interview_kit_and_pitch_script(
    request: InterviewKitRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """Generate a 60s Video Pitch Teleprompter script and targeted STAR behavioral interview questions."""
    _ = current_user
    service = ATSMatchingService(db)
    return await service.generate_interview_kit(request=request)

