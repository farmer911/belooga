"""ATS Diagnostics & JD Matching Controller."""

from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import AuthenticatedUser, get_current_user_optional
from app.schemas.ats_matching import ATSScanRequest, ATSScanResponse
from app.services.ats_matching_service import ATSMatchingService

router = APIRouter(prefix="/match", tags=["Domain 10: ATS Diagnostics & JD Matching"])


@router.post("/ats-scan", response_model=ATSScanResponse)
async def scan_and_match_cv_jd(
    request: ATSScanRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """Scan and match candidate CV against a target Job Description.

    Returns overall ATS compatibility score, missing hard skills, STAR metric audit, and parse warnings.
    Supports both guest visitors (public free scan) and authenticated candidates.
    """
    candidate_id = current_user.id if current_user else None
    service = ATSMatchingService(db)
    return await service.scan_and_match(request=request, candidate_identity_id=candidate_id)
