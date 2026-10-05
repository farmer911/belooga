"""Pydantic v2 DTO Schemas for Domain 10: ATS Diagnostics & JD Matching Engine."""

import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, ConfigDict, Field


class STARAnalysisItem(BaseModel):
    original_text: str
    critique: str
    suggested_star_rewrite: str
    metrics_detected: List[str] = Field(default_factory=list)


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
