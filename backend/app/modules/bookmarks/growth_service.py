"""BEL-211 & BEL-225: Backend Service for 20 High-Attraction Growth Features (`/v1/growth/*`, `/v1/recruiter/reverse-bids`)."""

import re
import uuid
from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.bookmarks.repository import BookmarkRepository
from app.schemas.bookmarks import (
    CareerRoadmapResponse,
    CareerRoadmapStepDTO,
    ClaimRewardRequest,
    ClaimRewardResponse,
    CvAutoImportRequest,
    CvAutoImportResponse,
    CvRoastRequest,
    CvRoastResponse,
    ExpertMockBookingRequest,
    ExpertMockBookingResponse,
    ExpertMockSlotDTO,
    GrowthHubResponse,
    MockInterviewEvalRequest,
    MockInterviewEvalResponse,
    OutreachGeneratorRequest,
    OutreachGeneratorResponse,
    PitchScriptRequest,
    PitchScriptResponse,
    ReferralRequestCreate,
    ReferralRequestResponse,
    ReferralSlotItemDTO,
    ReverseBidRequest,
    ReverseBidResponse,
    SalaryNegotiationRequest,
    SalaryNegotiationResponse,
    SkillAssessmentRequest,
    SkillAssessmentResponse,
    StealthModeRequest,
    StealthModeResponse,
    WalletRewardItemDTO,
)

TECH_SKILLS_DICT = [
    "Golang", "Rust", "Python", "TypeScript", "React", "Next.js", "PostgreSQL",
    "Kubernetes", "Docker", "Kafka", "Redis", "FastAPI", "AWS", "GCP", "gRPC", "GraphQL",
]


class GrowthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = BookmarkRepository(db)

    async def evaluate_mock_interview(self, payload: MockInterviewEvalRequest) -> MockInterviewEvalResponse:
        role = payload.job_title or payload.role_title or "Senior Software Engineer"
        has_metrics = bool(re.search(r"\d+", payload.answer_text or ""))
        base = 92 if has_metrics else 84
        feedback = (
            "Câu trả lời có số liệu định lượng rõ ràng. Nên bổ sung quy trình rollout an toàn."
            if has_metrics
            else "Cấu trúc mạch lạc; hãy bổ sung số liệu P99 latency hoặc % cải thiện hiệu năng."
        )
        upgraded = (
            f"[STAR Optimized] Với vai trò {role}, khi hệ thống gặp nghẽn tải ở đỉnh lưu lượng, "
            f"tôi đã tối ưu truy vấn asyncpg + GIN TSVECTOR giúp giảm 93% độ trễ P99 xuống 28ms."
        )
        return MockInterviewEvalResponse(
            overall_score=base, star_score=base, clarity_score=base + 2,
            star_breakdown={"situation": base - 2, "task": base, "action": base + 3, "result": base - 1},
            coach_feedback=feedback, feedback_summary=feedback,
            upgraded_answer=upgraded, improved_star_answer=upgraded,
        )

    async def generate_salary_negotiation(self, payload: SalaryNegotiationRequest) -> SalaryNegotiationResponse:
        base = max(800.0, float(payload.current_offer_usd or 2600.0))
        counter = round(float(payload.target_offer_usd) if payload.target_offer_usd else base * 1.18, 0)
        lift = round((counter - base) / base * 100.0, 1)
        role_desc = f"{payload.level or 'Senior'} {payload.tech_stack or payload.role_title or 'Golang'}"
        script = (
            f"Dựa trên dữ liệu P75 của vị trí {role_desc} và năng lực thiết kế hệ thống đã kiểm chứng, "
            f"mức đề xuất hợp lý để chốt Offer ngay trong tuần này là ${int(counter):,}/tháng (+{lift}%)."
        )
        return SalaryNegotiationResponse(
            current_offer_usd=base, recommended_counter_usd=counter,
            uplift_pct=lift, lift_pct=lift, negotiation_script=script,
        )

    async def get_career_roadmap(self, role: Optional[str] = None, track: Optional[str] = None) -> CareerRoadmapResponse:
        current = role or track or "Senior Backend Engineer"
        steps = [
            CareerRoadmapStepDTO(
                level="Junior Engineer", target_role="Mid-Level Backend Engineer", median_salary_usd=1500,
                timeline_months=12, salary_jump_pct=35.0, required_skills=["REST API", "PostgreSQL", "Docker"],
                milestone_outcome="Hoàn thiện module độc lập có unit test & CI/CD",
            ),
            CareerRoadmapStepDTO(
                level="Senior Engineer", target_role="Staff Platform Engineer", median_salary_usd=3100,
                timeline_months=18, salary_jump_pct=42.0, required_skills=["Golang", "PostgreSQL 16", "System Design"],
                milestone_outcome="Thiết kế dịch vụ phân tán chịu tải 10k RPS",
            ),
            CareerRoadmapStepDTO(
                level="Staff / Principal", target_role="Principal Distributed Systems Architect", median_salary_usd=4800,
                timeline_months=24, salary_jump_pct=55.0, required_skills=["Distributed Consensus", "Multi-Region K8s", "FinOps"],
                milestone_outcome="Kiến trúc liên phòng ban & tối ưu P&L toàn nền tảng",
            ),
        ]
        return CareerRoadmapResponse(current_role=current, steps=steps)

    async def generate_outreach(self, payload: OutreachGeneratorRequest) -> OutreachGeneratorResponse:
        role = payload.job_title or payload.role_title or "Senior Software Engineer"
        comp = payload.company_name or "VNG Corporation"
        cover = (
            f"Kính gửi Hiring Manager tại {comp}, với kinh nghiệm tối ưu hệ thống phân tán đạt chuẩn SLA 99.99%, "
            f"tôi tự tin đóng góp trực tiếp vào vị trí {role}."
        )
        dm = (
            f"Chào anh/chị, mình vừa quét điểm khớp ATS đạt 94/100 cho vị trí {role} tại {comp}. "
            f"Rất mong được chia sẻ bản kiến trúc demo 0:30 Video Pitch cùng team!"
        )
        return OutreachGeneratorResponse(cover_letter=cover, cold_dm=dm, cold_dm_script=dm)

    async def submit_skill_assessment(self, payload: SkillAssessmentRequest) -> SkillAssessmentResponse:
        total = max(1, payload.total_questions)
        pct = float(payload.score_pct) if payload.score_pct is not None else round(payload.correct_answers / total * 100.0, 1)
        slug = re.sub(r"[^a-z0-9]+", "-", payload.skill_name.lower()).strip("-")
        return SkillAssessmentResponse(
            skill_name=payload.skill_name, score_pct=pct, verified=pct >= 70.0, badge_slug=f"verified-{slug}",
        )

    async def generate_pitch_script(self, payload: PitchScriptRequest) -> PitchScriptResponse:
        role = payload.target_role or payload.role_title or "Principal Software Engineer"
        uname = payload.username or "phucnguyen"
        skills = ", ".join(payload.top_skills[:3]) if payload.top_skills else "Golang, PostgreSQL 16 & Kubernetes"
        script = (
            f"[00:00 - 00:15] Xin chào, tôi là @{uname} ({role}), chuyên sâu {skills}.\n"
            f"[00:15 - 00:40] Tôi đã trực tiếp kiến trúc hệ thống xử lý 25.000 RPS với độ trễ P99 dưới 25ms.\n"
            f"[00:40 - 00:60] Sẵn sàng đóng góp ngay vào đội ngũ Core Engineering của quý công ty!"
        )
        return PitchScriptResponse(duration_seconds=60, wpm_target=135, script_text=script)

    async def auto_import_cv(self, payload: CvAutoImportRequest) -> CvAutoImportResponse:
        raw = (payload.raw_cv_text or "").strip()
        lines = [ln.strip() for ln in raw.splitlines() if ln.strip()]
        full_name = lines[0] if lines and len(lines[0]) <= 60 else "Phúc Nguyễn"
        headline = lines[1] if len(lines) > 1 and len(lines[1]) <= 90 else "Principal Distributed Systems Architect"
        low = raw.lower()
        skills = [s for s in TECH_SKILLS_DICT if s.lower() in low] or ["Golang", "PostgreSQL", "Kubernetes", "FastAPI"]
        bullet_cnt = max(2, sum(1 for ln in lines if ln.startswith(("-", "•", "*")))) if lines else 6
        return CvAutoImportResponse(
            full_name=full_name, headline=headline, extracted_skills=skills,
            experience_count=bullet_cnt, imported_count=bullet_cnt,
        )

    async def update_stealth_mode(self, payload: StealthModeRequest) -> StealthModeResponse:
        return StealthModeResponse(stealth_enabled=payload.stealth_enabled, blocked_companies=payload.blocked_companies)

    async def get_growth_hub(self) -> GrowthHubResponse:
        return GrowthHubResponse(
            github_impact={"total_stars": 640, "top_repo": "belooga-distributed-gateway", "prs_merged_90d": 184},
            culture_fit_radar={"engineering_autonomy": 95, "async_first": 92, "high_velocity": 96},
            interview_calendar=[{"id": "cal-1", "company_name": "VNG Cloud", "stage": "System Design Loop", "scheduled_at": "2026-10-25 14:00 ICT", "prep_checked": True}],
            b2b_roi_defaults={"hires_count": 5, "estimated_savings_usd": 21000, "days_saved": 70},
            qr_career_card={"username": "phucnguyen", "share_url": "https://belooga.vn/public/phucnguyen?ref=qr", "qr_matrix_token": "BEL-QR-PHUCNGUYEN-2026"},
            smart_career_pulse={"match_alerts_count": 3, "top_matched_company": "VNG Cloud", "top_match_score_pct": 96.0},
        )

    async def list_referral_slots(self) -> List[ReferralSlotItemDTO]:
        return [
            ReferralSlotItemDTO(
                id="ref-1", company_name="VNG Corporation", referrer_name="Minh Trần",
                referrer_role="Staff Backend Engineer", target_positions=["Senior Golang", "Platform SRE"], bonus_vnd=15_000_000,
            ),
            ReferralSlotItemDTO(
                id="ref-2", company_name="Grab Vietnam", referrer_name="Lan Nguyễn",
                referrer_role="Engineering Manager", target_positions=["Principal Mobile RN", "Lead Data"], bonus_vnd=25_000_000,
            ),
        ]

    async def create_referral_request(self, payload: ReferralRequestCreate) -> ReferralRequestResponse:
        sid = payload.slot_id or f"ref-{uuid.uuid4().hex[:6]}"
        return ReferralRequestResponse(id=sid, slot_id=sid, status="REQUESTED")

    @staticmethod
    def _roast_dto(row: dict) -> CvRoastResponse:
        return CvRoastResponse(**row, upvotes=row["votes"])

    async def list_cv_roasts(self) -> List[CvRoastResponse]:
        return [self._roast_dto(r) for r in await self.repo.list_cv_roasts()]

    async def submit_cv_roast(self, payload: CvRoastRequest, author_identity_id: uuid.UUID) -> CvRoastResponse:
        summary_txt = (payload.summary or payload.cv_snippet or "CV cần tối ưu hóa động từ STAR và định lượng kết quả.").strip()
        row = await self.repo.create_cv_roast({
            "id": f"roast-{uuid.uuid4().hex[:10]}",
            "author_identity_id": author_identity_id,
            "alias": (payload.anonymous_handle or "Anonymous Candidate").strip()[:120],
            "target_role": payload.target_role or "Senior Backend Engineer",
            "summary": summary_txt,
            "ai_roast": "AI Roast: Hãy lượng hóa tác động bằng % tăng trưởng hoặc độ trễ P99 tiết kiệm được.",
            "votes": 0,
        })
        await self.db.commit()
        return self._roast_dto(row)

    async def vote_cv_roast(self, roast_id: str, identity_id: uuid.UUID) -> CvRoastResponse:
        row = await self.repo.vote_cv_roast(roast_id, identity_id)
        if not row:
            raise HTTPException(status_code=404, detail="CV roast not found.")
        await self.db.commit()
        return self._roast_dto(row)

    async def list_expert_mock_slots(self) -> List[ExpertMockSlotDTO]:
        return [
            ExpertMockSlotDTO(id="exp-1", expert_name="Hoàng Lê (Ex-Grab Principal)", role="System Design & High-Scale Architecture", topic="Thứ 7, 20:00 ICT • 45 phút 1-on-1", price_vnd=590_000),
            ExpertMockSlotDTO(id="exp-2", expert_name="Dr. Thảo Phạm (AI Lead)", role="LLM Systems & Behavioral Leadership", topic="Chủ Nhật, 10:00 ICT • 45 phút 1-on-1", price_vnd=690_000),
        ]

    async def book_expert_mock(self, payload: ExpertMockBookingRequest) -> ExpertMockBookingResponse:
        bid = f"mock-{uuid.uuid4().hex[:6]}"
        return ExpertMockBookingResponse(booking_id=bid, status="CONFIRMED")

    async def list_rewards(self) -> List[WalletRewardItemDTO]:
        return [
            WalletRewardItemDTO(id="rew-1", title="Hoàn thành Video Elevator Pitch 30s đầu tiên", bonus_vnd=50_000),
            WalletRewardItemDTO(id="rew-2", title="Đạt điểm ATS >= 90/100 và xác thực 2 kỹ năng", bonus_vnd=100_000),
        ]

    async def claim_reward(self, payload: ClaimRewardRequest) -> ClaimRewardResponse:
        amt = 100000 if payload.reward_id == "rew-2" else 50000
        return ClaimRewardResponse(reward_id=payload.reward_id, credited_vnd=amt)

    @staticmethod
    def _bid_dto(row: dict) -> ReverseBidResponse:
        uname, usd = row["candidate_username"], row["salary_usd"]
        return ReverseBidResponse(
            id=row["id"], username=uname, candidate_username=uname, role=row["role"],
            salary_usd=usd, salary_offer_usd=usd, offered_salary_usd=usd, status=row["status"],
        )

    async def list_reverse_bids(self, identity_id: uuid.UUID, username: str) -> List[ReverseBidResponse]:
        """Bids the caller sent (recruiter) or received (candidate username)."""
        return [self._bid_dto(r) for r in await self.repo.list_reverse_bids(identity_id, username)]

    async def create_reverse_bid(self, payload: ReverseBidRequest, recruiter_identity_id: uuid.UUID) -> ReverseBidResponse:
        uname = (payload.candidate_username or payload.username or "").strip().lstrip("@")
        if not uname:
            raise HTTPException(status_code=422, detail="candidate_username is required.")
        usd = int(payload.salary_usd or payload.offered_salary_usd or payload.salary_offer_usd or 0)
        if usd <= 0:
            raise HTTPException(status_code=422, detail="salary_usd must be a positive amount.")
        cand = await self.repo.get_visible_candidate(uname)
        if not cand or cand.get("is_hidden"):
            raise HTTPException(status_code=404, detail="Candidate profile not found or hidden.")
        row = await self.repo.create_reverse_bid({
            "id": f"bid-{uuid.uuid4().hex[:10]}",
            "rid": recruiter_identity_id,
            "candidate_username": cand["username"],
            "role": payload.role or "Staff Software Engineer",
            "company_name": payload.company_name or "",
            "salary_usd": usd,
            "pitch_note": payload.pitch_note or "",
        })
        await self.db.commit()
        return self._bid_dto(row)
