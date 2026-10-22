from typing import List, Optional, Union
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class CatalogItemResponse(BaseModel):
    """Generic catalog taxonomy item (skill, company, school, or location)."""

    model_config = ConfigDict(from_attributes=True)

    id: Optional[Union[UUID, str]] = None
    name: str
    category: Optional[str] = "Engineering"
    logo_url: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None


class SkillCreateRequest(BaseModel):
    """Payload for creating a custom skill in the master catalog."""

    name: str
    category: Optional[str] = "Engineering"


class SuggestionResponse(BaseModel):
    """Autosuggestion search response."""

    query: Optional[str] = None
    items: List[CatalogItemResponse] = []


class SalarySkillItem(BaseModel):
    name: str
    salary_premium: str
    popularity_pct: int


class CrawlerSourceItem(BaseModel):
    source_name: str
    sample_count: int
    status: str = "ACTIVE"


class HistoricalSalaryPointItem(BaseModel):
    period: str
    year: str
    p25_salary_vnd: int
    p50_salary_vnd: int
    p75_salary_vnd: int
    yoy_change_pct: str
    sample_count: int


class SalaryCrawlRequest(BaseModel):
    role: Optional[str] = "backend"
    tech_stack: Optional[str] = "Golang"
    level: Optional[str] = "Senior"
    location: Optional[str] = "Ho Chi Minh"
    city: Optional[str] = None


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
    growth_since_2024_pct: float = 28.4
    last_crawled_at: str = "2026-10-22 18:00 UTC"
    crawler_sources: List[CrawlerSourceItem] = []
    historical_series: List[HistoricalSalaryPointItem] = []


class UpskillRoiItem(BaseModel):
    skill: str
    salary_premium_pct: str
    monthly_delta_vnd: int
    learning_weeks: int
    roi_score: float


class CareerRoiResponse(BaseModel):
    tech_stack: str
    level: str
    location: str
    current_median_vnd: int
    projected_upskill_vnd: int
    annual_comp_gain_vnd: int
    upskill_recommendations: List[UpskillRoiItem]
    negotiation_leverage_script: str


class SearchTrendingItem(BaseModel):
    keyword: str
    demand_growth: str
    category: str


class SearchTrendingInsightsResponse(BaseModel):
    total_searchable_profiles: int
    video_verified_pct: float
    trending_queries: List[SearchTrendingItem]
    recruiter_tip: str


class CompanyJobItemDTO(BaseModel):
    id: str
    title: str
    salary_range: str = "$2,500 - $3,500"
    work_mode: str = "Hybrid"
    skills: List[str] = []


class CompanyReviewItemDTO(BaseModel):
    id: str
    author_role: str = "Senior Software Engineer"
    rating: int = 5
    title: str
    comment: str
    created_at: str = "2026-10-22"


class CompanyReviewCreateRequest(BaseModel):
    author_role: str = "Senior Software Engineer"
    rating: int = 5
    title: str
    comment: str = ""


class CompanyAlumniItemDTO(BaseModel):
    username: str
    full_name: str
    role: str
    verified_expert: bool = False


class CompanyProfileCreateRequest(BaseModel):
    slug: Optional[str] = None
    name: str
    industry: str = "AI / Cloud"
    company_size: str = "100-500 nhân sự"
    location: str = "Ho Chi Minh / Remote"
    website: Optional[str] = None
    avg_rating: float = 4.9
    review_count: int = 1
    avg_salary_usd: int = 2700
    open_jobs_count: int = 3
    hiring_now: bool = True
    description: str = "Doanh nghiệp công nghệ xác thực trên hệ sinh thái Belooga."
    tech_stack: List[str] = []
    benefits: List[str] = []


class CompanyProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    avg_salary_usd: Optional[int] = None
    open_jobs_count: Optional[int] = None
    hiring_now: Optional[bool] = None
    description: Optional[str] = None
    tech_stack: Optional[List[str]] = None
    benefits: Optional[List[str]] = None


class CompanyProfileItemDTO(BaseModel):
    slug: str
    name: str
    industry: str = "AI / Cloud"
    company_size: str = "100-500 nhân sự"
    location: str = "Ho Chi Minh"
    website: str = "https://belooga.com"
    avg_rating: float = 4.8
    review_count: int = 12
    avg_salary_usd: int = 2800
    open_jobs_count: int = 4
    hiring_now: bool = True
    description: str = ""
    tech_stack: List[str] = []
    benefits: List[str] = []
    open_jobs: List[CompanyJobItemDTO] = []
    reviews: List[CompanyReviewItemDTO] = []
    alumni: List[CompanyAlumniItemDTO] = []


class TopCandidateRankItemDTO(BaseModel):
    rank: int
    username: str
    full_name: str
    headline: str
    category: str = "backend"
    location: str = "Ho Chi Minh"
    potential_score: int = 95
    badge_tier: str = "TOP_1_PCT"
    highlight_reason: str = ""
    skills: List[str] = []
    actively_looking: bool = True
    has_video_pitch: bool = True
    video_pitch_url: str = "/videos/pitch.mp4"


class CompanyInterviewQuestionItemDTO(BaseModel):
    id: str
    role_title: str = "Principal Golang Engineer"
    difficulty: str = "Hard"
    question_text: str
    question: str
    sample_answer_hint: str = "Trình bày theo cấu trúc STAR + số liệu benchmark thực tế."


class CompanyInterviewQuestionCreateRequest(BaseModel):
    id: Optional[str] = None
    role_title: str = "Senior Engineer"
    difficulty: str = "Hard"
    question_text: Optional[str] = None
    question: Optional[str] = None
    sample_answer_hint: str = "Trình bày theo cấu trúc STAR + số liệu benchmark thực tế."






