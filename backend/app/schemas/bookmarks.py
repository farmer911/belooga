"""Pydantic v2 DTO schemas for Candidate Shortlist Bookmarks (BEL-145), Recruiter Hub (BEL-183) & Growth (BEL-211/225)."""

from typing import List, Optional
from pydantic import BaseModel, Field


class BookmarkCreateRequest(BaseModel):
    """Optional note payload when bookmarking a candidate profile."""
    note: Optional[str] = Field(default=None, max_length=1000)


class CandidateBookmarkItemDTO(BaseModel):
    """Enriched candidate bookmark metadata matching Design Spec #64."""
    id: str
    recruiter_identity_id: str
    candidate_profile_id: str
    username: str
    full_name: str
    headline: str = ""
    location: str = ""
    seeking_status: str = "Open to Offers"
    avatar_url: Optional[str] = None
    note: Optional[str] = None
    created_at: str


class RecruiterPipelineItemDTO(BaseModel):
    """B2B Recruiter Hiring Pipeline card DTO (BEL-183)."""
    id: str
    username: str
    full_name: str
    headline: str = "Senior Software Engineer"
    target_role: str = "Principal Engineer"
    stage: str = "SHORTLISTED"
    ats_score: int = 88
    years_experience: int = 4
    expected_salary: str = "Negotiable"
    video_pitch_url: str = "/videos/pitch.mp4"
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    recruiter_rating: int = 4
    evaluation_notes: str = ""
    contact_unlocked: bool = False
    interview_datetime: Optional[str] = None


class RecruiterPipelineCreateRequest(BaseModel):
    """Payload to add a candidate into the recruiter hiring pipeline."""
    username: str
    target_role: str = "Principal Engineer"
    stage: str = "SHORTLISTED"
    recruiter_rating: int = Field(default=4, ge=1, le=5)
    evaluation_notes: str = "Thêm trực tiếp từ Recruiter Command Center."


class RecruiterPipelineUpdateRequest(BaseModel):
    """Payload to update hiring stage, rating, or evaluation notes."""
    stage: Optional[str] = None
    recruiter_rating: Optional[int] = Field(default=None, ge=1, le=5)
    evaluation_notes: Optional[str] = None
    contact_unlocked: Optional[bool] = None
    interview_datetime: Optional[str] = None


class RecruiterCompareRequest(BaseModel):
    """Payload to compare 2-3 candidates side-by-side against a target JD."""
    usernames: List[str]
    jd_text: Optional[str] = None


class RecruiterCompareItemDTO(BaseModel):
    """Side-by-side candidate comparison item against target JD."""
    username: str
    full_name: str
    headline: str
    ats_score: int
    matched_skills: List[str]
    missing_skills: List[str]
    years_experience: int
    expected_salary: str
    video_pitch_url: str
    differentiator: str


class RecruiterCompareResponse(BaseModel):
    """Comparison matrix response for 2-3 candidates."""
    comparisons: List[RecruiterCompareItemDTO]


class RecruiterInviteRequest(BaseModel):
    """Payload to invite a candidate to interview, unlock contact via Wallet, and sync Kanban."""
    username: str
    job_title: str = "Senior Distributed Systems Engineer"
    interview_datetime: str = "Scheduled"
    offered_salary_range: str = "Negotiable"
    custom_video_prompt: Optional[str] = None
    unlock_contact_via_wallet: bool = True


class MockInterviewEvalRequest(BaseModel):
    role_title: Optional[str] = "Senior Backend Engineer"
    job_title: Optional[str] = None
    question: str = "Hãy mô tả một lần bạn xử lý nghẽn cổ chai hiệu năng ở Production."
    answer_text: str = ""


class MockInterviewEvalResponse(BaseModel):
    overall_score: int
    star_score: int
    clarity_score: int
    star_breakdown: dict[str, int]
    coach_feedback: str
    feedback_summary: str
    upgraded_answer: str
    improved_star_answer: str


class SalaryNegotiationRequest(BaseModel):
    current_offer_usd: float = 2600.0
    target_offer_usd: Optional[float] = None
    role_title: Optional[str] = "Senior Backend Engineer"
    tech_stack: Optional[str] = "Golang"
    level: Optional[str] = "Senior"


class SalaryNegotiationResponse(BaseModel):
    current_offer_usd: float
    recommended_counter_usd: float
    uplift_pct: float
    lift_pct: float
    negotiation_script: str


class CareerRoadmapStepDTO(BaseModel):
    level: str
    target_role: str
    median_salary_usd: int
    timeline_months: int
    salary_jump_pct: float
    required_skills: List[str]
    milestone_outcome: str


class CareerRoadmapResponse(BaseModel):
    current_role: str
    steps: List[CareerRoadmapStepDTO]


class OutreachGeneratorRequest(BaseModel):
    company_name: str = ""
    role_title: Optional[str] = "Senior Backend Engineer"
    job_title: Optional[str] = None

class OutreachGeneratorResponse(BaseModel):
    cover_letter: str
    cold_dm: str
    cold_dm_script: str

class SkillAssessmentRequest(BaseModel):
    skill_name: str = "PostgreSQL High-Scale"
    score_pct: Optional[float] = None
    correct_answers: int = 5
    total_questions: int = 5

class SkillAssessmentResponse(BaseModel):
    skill_name: str
    score_pct: float
    verified: bool
    badge_slug: str

class PitchScriptRequest(BaseModel):
    username: Optional[str] = ""
    target_role: Optional[str] = "Principal Software Engineer"
    role_title: Optional[str] = None
    top_skills: List[str] = Field(default_factory=list)

class PitchScriptResponse(BaseModel):
    duration_seconds: int
    wpm_target: int
    script_text: str

class CvAutoImportRequest(BaseModel):
    raw_cv_text: str = ""

class CvAutoImportResponse(BaseModel):
    full_name: str
    headline: str
    extracted_skills: List[str]
    experience_count: int
    imported_count: int

class StealthModeRequest(BaseModel):
    stealth_enabled: bool = True
    blocked_companies: List[str] = Field(default_factory=list)

class StealthModeResponse(BaseModel):
    stealth_enabled: bool
    blocked_companies: List[str]

class GrowthHubResponse(BaseModel):
    github_impact: dict[str, int | str]
    culture_fit_radar: dict[str, int]
    interview_calendar: List[dict[str, str | bool]]
    b2b_roi_defaults: dict[str, int]
    qr_career_card: dict[str, str]
    smart_career_pulse: dict[str, int | str | float]

class ReferralSlotItemDTO(BaseModel):
    id: str
    company_name: str
    referrer_name: str
    referrer_role: str
    target_positions: List[str]
    bonus_vnd: int

class ReferralRequestCreate(BaseModel):
    slot_id: Optional[str] = "ref-1"
    company_name: str = ""
    role_title: str = "Senior Golang"
    note: str = ""

class ReferralRequestResponse(BaseModel):
    id: str
    slot_id: str
    status: str

class CvRoastRequest(BaseModel):
    summary: Optional[str] = None
    anonymous_handle: str = "Anonymous Candidate"
    target_role: str = "Senior Backend Engineer"
    cv_snippet: str = ""

class CvRoastResponse(BaseModel):
    id: str
    alias: str = "Anonymous Candidate"
    target_role: str = "Senior Backend Engineer"
    summary: str = ""
    votes: int = 12
    upvotes: int = 12
    ai_roast: str

class ExpertMockSlotDTO(BaseModel):
    id: str
    expert_name: str
    role: str
    topic: str
    price_vnd: int

class ExpertMockBookingRequest(BaseModel):
    slot_id: Optional[str] = "exp-1"
    expert_id: Optional[str] = "exp-1"
    topic: str = "System Design & High-Concurrency Mock"

class ExpertMockBookingResponse(BaseModel):
    booking_id: str
    status: str

class WalletRewardItemDTO(BaseModel):
    id: str
    title: str
    bonus_vnd: int

class ClaimRewardRequest(BaseModel):
    reward_id: str = "rew-1"

class ClaimRewardResponse(BaseModel):
    reward_id: str
    credited_vnd: int

class ReverseBidRequest(BaseModel):
    username: Optional[str] = None
    candidate_username: Optional[str] = None
    role: str = "Staff Software Engineer"
    company_name: str = "Enterprise Tech"
    salary_usd: Optional[int] = None
    offered_salary_usd: Optional[int] = None
    salary_offer_usd: Optional[int] = None
    pitch_note: str = ""

class ReverseBidResponse(BaseModel):
    id: str
    username: str
    candidate_username: str
    role: str = "Staff Software Engineer"
    salary_usd: int
    salary_offer_usd: int
    offered_salary_usd: int
    status: str
