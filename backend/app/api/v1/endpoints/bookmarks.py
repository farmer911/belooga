"""Candidate Shortlist Bookmarks (BEL-145) & B2B Recruiter Hiring Hub (BEL-183) endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Body, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import AuthenticatedUser, get_current_user, get_current_user_optional
from app.modules.bookmarks import BookmarkService, GrowthService
from app.schemas.bookmarks import (
    BookmarkCreateRequest,
    CandidateBookmarkItemDTO,
    CareerRoadmapResponse,
    ClaimRewardRequest,
    ClaimRewardResponse,
    CvAutoImportRequest,
    CvAutoImportResponse,
    CvRoastRequest,
    CvRoastResponse,
    ExpertMockBookingRequest,
    ExpertMockBookingResponse,
    GrowthHubResponse,
    MockInterviewEvalRequest,
    MockInterviewEvalResponse,
    OutreachGeneratorRequest,
    OutreachGeneratorResponse,
    PitchScriptRequest,
    PitchScriptResponse,
    RecruiterCompareRequest,
    RecruiterCompareResponse,
    RecruiterInviteRequest,
    RecruiterPipelineCreateRequest,
    RecruiterPipelineItemDTO,
    RecruiterPipelineUpdateRequest,
    ReferralRequestCreate,
    ReferralRequestResponse,
    ReverseBidRequest,
    ReverseBidResponse,
    SalaryNegotiationRequest,
    SalaryNegotiationResponse,
    SkillAssessmentRequest,
    SkillAssessmentResponse,
    StealthModeRequest,
    StealthModeResponse,
)

router = APIRouter(tags=["Domain 6: Talent Discovery & Search"])


@router.get("/bookmarks/", response_model=List[CandidateBookmarkItemDTO])
async def list_candidate_bookmarks(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List bookmarked candidates for the authenticated recruiter."""
    return await BookmarkService(db).list_bookmarks(current_user.id)


@router.post("/bookmarks/{username}/", response_model=CandidateBookmarkItemDTO, status_code=status.HTTP_201_CREATED)
async def add_candidate_bookmark(
    username: str,
    payload: Optional[BookmarkCreateRequest] = Body(default=None),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Bookmark a visible candidate profile for the authenticated recruiter."""
    note = payload.note if payload else None
    return await BookmarkService(db).add_bookmark(
        recruiter_identity_id=current_user.id,
        username=username,
        note=note,
    )


@router.delete("/bookmarks/{username}/", response_model=dict[str, str])
async def remove_candidate_bookmark(
    username: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a candidate profile from the authenticated recruiter's shortlist."""
    return await BookmarkService(db).remove_bookmark(
        recruiter_identity_id=current_user.id,
        username=username,
    )


@router.get("/recruiter/pipeline", response_model=List[RecruiterPipelineItemDTO])
async def list_recruiter_pipeline(
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """BEL-183: List B2B recruiter hiring pipeline cards across 5 stages."""
    return await BookmarkService(db).list_pipeline(current_user.id if current_user else None)


@router.post("/recruiter/pipeline", response_model=RecruiterPipelineItemDTO, status_code=status.HTTP_201_CREATED)
async def add_recruiter_pipeline_candidate(
    payload: RecruiterPipelineCreateRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """BEL-183: Add a visible candidate into the B2B recruiter hiring pipeline."""
    return await BookmarkService(db).add_to_pipeline(current_user.id if current_user else None, payload)


@router.patch("/recruiter/pipeline/{item_id}", response_model=RecruiterPipelineItemDTO)
async def update_recruiter_pipeline_candidate(
    item_id: str,
    payload: RecruiterPipelineUpdateRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """BEL-183: Update recruiter hiring pipeline stage, rating, or internal evaluation notes."""
    return await BookmarkService(db).update_pipeline_item(current_user.id if current_user else None, item_id, payload)


@router.post("/recruiter/compare", response_model=RecruiterCompareResponse)
async def compare_recruiter_candidates(
    payload: RecruiterCompareRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """BEL-183: Compare 2-3 candidates side-by-side against a target JD."""
    return await BookmarkService(db).compare_candidates(payload)


@router.post("/recruiter/invite", response_model=RecruiterPipelineItemDTO)
async def invite_recruiter_candidate(
    payload: RecruiterInviteRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """BEL-183: Send interview invite, unlock contact via Wallet (49,000 VND), and sync candidate Kanban."""
    return await BookmarkService(db).invite_candidate(current_user.id if current_user else None, payload)


@router.post("/recruiter/reverse-bids", response_model=ReverseBidResponse)
async def submit_recruiter_reverse_bid(
    payload: ReverseBidRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """BEL-211: Recruiter Reverse Offer Bidding for top candidates."""
    return await GrowthService(db).create_reverse_bid(payload)


@router.post("/growth/mock-interview", response_model=MockInterviewEvalResponse)
async def evaluate_mock_interview(
    payload: MockInterviewEvalRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    return await GrowthService(db).evaluate_mock_interview(payload)


@router.post("/growth/salary-negotiation", response_model=SalaryNegotiationResponse)
async def generate_salary_negotiation(
    payload: SalaryNegotiationRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    return await GrowthService(db).generate_salary_negotiation(payload)


@router.get("/growth/career-roadmap", response_model=CareerRoadmapResponse)
async def get_career_roadmap(
    role: Optional[str] = Query(None),
    track: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await GrowthService(db).get_career_roadmap(role=role, track=track)


@router.post("/growth/outreach-generator", response_model=OutreachGeneratorResponse)
async def generate_outreach_scripts(
    payload: OutreachGeneratorRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    return await GrowthService(db).generate_outreach(payload)


@router.post("/growth/skill-assessment", response_model=SkillAssessmentResponse)
async def submit_skill_assessment(
    payload: SkillAssessmentRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    return await GrowthService(db).submit_skill_assessment(payload)


@router.post("/growth/pitch-script", response_model=PitchScriptResponse)
async def generate_pitch_script(
    payload: PitchScriptRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    return await GrowthService(db).generate_pitch_script(payload)


@router.post("/growth/cv-auto-import", response_model=CvAutoImportResponse)
async def auto_import_cv_to_profile(
    payload: CvAutoImportRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    return await GrowthService(db).auto_import_cv(payload)


@router.patch("/growth/stealth-mode", response_model=StealthModeResponse)
async def update_stealth_mode(
    payload: StealthModeRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    return await GrowthService(db).update_stealth_mode(payload)


@router.get("/growth/hub", response_model=GrowthHubResponse)
async def get_growth_hub(db: AsyncSession = Depends(get_db)):
    return await GrowthService(db).get_growth_hub()


@router.post("/growth/referrals", response_model=ReferralRequestResponse)
async def create_referral_request(
    payload: ReferralRequestCreate,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    return await GrowthService(db).create_referral_request(payload)


@router.post("/growth/cv-roasts", response_model=CvRoastResponse)
async def submit_anonymous_cv_roast(
    payload: CvRoastRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    return await GrowthService(db).submit_cv_roast(payload)


@router.post("/growth/expert-mock-booking", response_model=ExpertMockBookingResponse)
async def book_expert_mock_interview(
    payload: ExpertMockBookingRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    return await GrowthService(db).book_expert_mock(payload)


@router.post("/growth/claim-reward", response_model=ClaimRewardResponse)
async def claim_wallet_cashback_reward(
    payload: ClaimRewardRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    return await GrowthService(db).claim_reward(payload)


