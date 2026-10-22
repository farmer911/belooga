"""Pydantic v2 DTO Schemas for Domain 10: ATS Diagnostics, Recruiter Talent Shortlist & Market Pulse."""

import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, ConfigDict, Field


class ATSScanRequest(BaseModel):
    job_title: str = Field(..., max_length=255, description="Target job position title")
    company_name: Optional[str] = Field(None, max_length=255, description="Target hiring company name")
    jd_text: str = Field(..., description="Full text or requirements of the target Job Description")
    cv_text: str = Field(..., description="Extracted plain text or bullet points of the candidate CV")


class ATSScanResponse(BaseModel):
    match_id: Optional[uuid.UUID] = None
    ats_score: int = Field(..., ge=0, le=100, description="Overall ATS compatibility score (0-100)")
    matched_skills: List[str] = Field(default_factory=list, description="Skills present in both JD and CV")
    missing_skills: List[str] = Field(default_factory=list, description="Crucial JD skills missing from CV")
    star_analysis: List[Dict[str, Any]] = Field(default_factory=list, description="Action-verb & STAR impact critiques")
    parse_warnings: List[str] = Field(default_factory=list, description="Format, layout, or font warnings for ATS parsers")
    breakdown: Dict[str, int] = Field(default_factory=dict, description="Sub-scores: skills, impact, formatting")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(from_attributes=True)


class ATSScanHistoryItem(BaseModel):
    id: uuid.UUID
    match_id: uuid.UUID
    job_title: str
    company_name: Optional[str] = None
    ats_score: int = Field(..., ge=0, le=100)
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ATSTailorResponse(BaseModel):
    tailored_cv_text: str
    scan_result: ATSScanResponse


class TalentShortlistRequest(BaseModel):
    job_title: str = Field(..., max_length=255, description="Target role title for recruiter shortlist")
    company_name: Optional[str] = Field(None, max_length=255, description="Hiring organization")
    jd_text: str = Field(..., description="Job description text used to extract required skill taxonomy")
    location: Optional[str] = Field(None, max_length=120, description="Optional location filter")
    limit: int = Field(10, ge=1, le=50, description="Maximum shortlisted candidates to return")
    require_video_pitch: bool = Field(False, description="Only include candidates with verified video pitches")


class ShortlistedCandidateDTO(BaseModel):
    profile_id: str
    username: str
    full_name: str
    headline: str
    location: str
    seeking_status: str
    match_score: int = Field(..., ge=0, le=100)
    matched_skills: List[str]
    missing_skills: List[str]
    has_video_pitch: bool
    video_pitch_url: Optional[str] = None
    avatar_url: str
    score_breakdown: Dict[str, int]


class TalentPoolTelemetryDTO(BaseModel):
    total_matching_candidates: int
    video_verified_count: int
    actively_looking_count: int
    estimated_salary_p25_vnd: int
    estimated_salary_p50_vnd: int
    estimated_salary_p75_vnd: int
    hiring_difficulty: str


class TalentShortlistResponse(BaseModel):
    job_title: str
    company_name: Optional[str] = None
    extracted_jd_skills: List[str]
    pool_telemetry: TalentPoolTelemetryDTO
    candidates: List[ShortlistedCandidateDTO]
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SkillScarcityItemDTO(BaseModel):
    skill: str
    candidate_supply: int
    demand_index: int
    scarcity_score: float
    salary_premium_pct: str


class TalentMarketPulseResponse(BaseModel):
    total_visible_candidates: int
    total_jds_analyzed: int = 0
    video_pitch_adoption_pct: float
    actively_seeking_pct: float
    hiring_velocity_index: float
    skill_scarcity_index: List[SkillScarcityItemDTO]
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class InterviewKitRequest(BaseModel):
    job_title: str = Field(..., max_length=255)
    company_name: Optional[str] = Field(None, max_length=255)
    jd_text: str = Field(..., max_length=50000)
    cv_text: Optional[str] = Field("", max_length=50000)


class InterviewQuestionDTO(BaseModel):
    focus_skill: str
    question: str
    star_coaching_tip: str


class InterviewKitResponse(BaseModel):
    job_title: str
    company_name: Optional[str] = None
    video_pitch_script_60s: str
    star_interview_questions: List[InterviewQuestionDTO]
    closing_questions_for_hiring_manager: List[str]


class CVFileExtractResponse(BaseModel):
    filename: str
    file_type: str
    extracted_text: str
    char_count: int
    word_count: int
    extracted_skills: List[str] = Field(default_factory=list)


