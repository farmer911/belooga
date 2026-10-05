from typing import List, Optional, Union
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class CatalogItemResponse(BaseModel):
    """Generic catalog taxonomy item (skill, company, school, or location)."""

    model_config = ConfigDict(from_attributes=True)

    id: Optional[Union[UUID, str]] = None
    name: str
    logo_url: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None


class SuggestionResponse(BaseModel):
    """Autosuggestion search response."""

    query: Optional[str] = None
    items: List[CatalogItemResponse] = []


class SalarySkillItem(BaseModel):
    name: str
    salary_premium: str
    popularity_pct: int


class SalaryBenchmarkResponse(BaseModel):
    role: str
    tech_stack: str
    level: str
    location: str
    p25_salary_vnd: int
    p50_salary_vnd: int
    p75_salary_vnd: int
    sample_size_jds: int
    top_paid_skills: List[SalarySkillItem]
    market_demand: str
    growth_rate_yoy: str

