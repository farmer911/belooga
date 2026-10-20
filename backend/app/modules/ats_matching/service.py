"""Service Layer for Domain 10: ATS Diagnostics, Recruiter Shortlist & Talent Market Pulse (Vertical Module: ats_matching)."""

import hashlib
import os
import re
import uuid
from typing import List, Set, Dict, Any, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import platform_cache
from app.modules.ats_matching.repository import ATSMatchingRepository
from app.schemas.ats_matching import (
    ATSScanRequest,
    ATSScanResponse,
    InterviewKitRequest,
    InterviewKitResponse,
    InterviewQuestionDTO,
    SkillScarcityItemDTO,
    TalentMarketPulseResponse,
    TalentShortlistRequest,
    TalentShortlistResponse,
)

CORE_TECH_TAXONOMY: List[str] = [
    "Golang", "Go", "Python", "TypeScript", "JavaScript", "React", "Next.js", "Vue", "Angular",
    "Node.js", "Express", "FastAPI", "Django", "Flask", "Java", "Spring Boot", "Kotlin", "Swift",
    "Flutter", "C++", "C#", ".NET", "Rust", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch",
    "Kafka", "RabbitMQ", "gRPC", "GraphQL", "REST API", "Docker", "Kubernetes", "Helm", "AWS", "GCP",
    "Azure", "CI/CD", "GitHub Actions", "Terraform", "Linux", "Git", "Microservices", "System Design",
    "Tailwind", "Tailwind CSS", "HTML5", "CSS3", "SQL", "NoSQL", "DevOps", "Unit Testing", "Playwright",
]

ACTION_VERB_PATTERNS = [
    r"\b(designed|architected|built|developed|implemented|optimized|scaled|reduced|increased|accelerated|automated|refactored|deployed|orchestrated|mentored|spearheaded)\b"
]

METRIC_PATTERNS = [
    r"\b\d+[%]\b",
    r"\b\d+[\+]?\s*(?:users|rps|tps|clients|requests|ms|seconds|minutes|hours|days|percent)\b",
    r"[$€₫]\s*[\d,]+",
    r"\b(?:reduced|increased|improved|scaled|saved)\s+by\s+\d+",
    r"\b\d+x\b",
]


class ATSMatchingService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ATSMatchingRepository(db)

    def _extract_skills(self, text: str) -> List[str]:
        found: Set[str] = set()
        lowered = text.lower()
        for skill in CORE_TECH_TAXONOMY:
            escaped = re.escape(skill.lower())
            if skill.lower() == "go":
                pattern = r"\bgo\b"
            elif skill.lower() in ("c++", "c#"):
                pattern = rf"(?<!\w){escaped}(?!\w)"
            else:
                pattern = rf"\b{escaped}\b"
            if re.search(pattern, lowered):
                found.add("Golang" if skill.lower() == "go" else skill)
        return sorted(list(found))

    def _analyze_star_bullets(self, cv_text: str) -> List[Dict[str, Any]]:
        critiques: List[Dict[str, Any]] = []
        lines = [line.strip("-•* \t") for line in cv_text.splitlines() if len(line.strip()) > 15]
        for line in lines[:8]:
            has_action_verb = any(re.search(pat, line, re.IGNORECASE) for pat in ACTION_VERB_PATTERNS)
            metrics_found = [m.group() for pat in METRIC_PATTERNS for m in re.finditer(pat, line, re.IGNORECASE)]
            if not metrics_found:
                critiques.append({
                    "original_text": line,
                    "critique": "Câu thiếu số liệu định lượng (Metrics). Bot ATS và Hiring Manager đánh giá thấp các câu mô tả chung chung.",
                    "suggested_star_rewrite": f"{line} (Đo lường bằng: tăng X% hiệu suất, xử lý Y requests/giây hoặc giảm Z thời gian chết).",
                    "metrics_detected": [],
                })
            elif not has_action_verb:
                critiques.append({
                    "original_text": line,
                    "critique": "Câu bắt đầu bằng động từ thụ động. Hãy đổi sang động từ hành động mạnh mẽ (Action Verb).",
                    "suggested_star_rewrite": f"Thiết kế / Tối ưu hóa: {line}",
                    "metrics_detected": metrics_found,
                })
        return critiques

    def _detect_format_warnings(self, cv_text: str) -> List[str]:
        warnings: List[str] = []
        if "\t\t" in cv_text or "  |  " in cv_text:
            warnings.append("Phát hiện định dạng bảng lồng hoặc ký tự phân cách phức tạp. Bot ATS có thể bóc tách sai thứ tự dòng.")
        if len(cv_text.splitlines()) < 10 and len(cv_text) > 500:
            warnings.append("CV thiếu các dấu gạch đầu dòng (bullet points) rõ ràng. Các đoạn văn dài gây khó khăn cho ATS entity parser.")
        return warnings

    async def scan_and_match(
        self, request: ATSScanRequest, candidate_identity_id: Optional[uuid.UUID] = None
    ) -> ATSScanResponse:
        if len(request.jd_text) > 50000 or len(request.cv_text) > 50000:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail="Payload Too Large: JD or CV text exceeds maximum allowed limit (50,000 characters).",
            )
        jd_skills = self._extract_skills(request.jd_text)
        cv_skills = self._extract_skills(request.cv_text)
        matched_skills = [s for s in jd_skills if s in cv_skills]
        missing_skills = [s for s in jd_skills if s not in cv_skills]
        star_critiques = self._analyze_star_bullets(request.cv_text)
        parse_warnings = self._detect_format_warnings(request.cv_text)

        skill_score = int((len(matched_skills) / max(len(jd_skills), 1)) * 60)
        bullets_analyzed = len(request.cv_text.splitlines())
        impact_ratio = max(0.0, 1.0 - (len(star_critiques) / max(bullets_analyzed, 1)))
        impact_score = int(impact_ratio * 25)
        format_score = max(0, 15 - (len(parse_warnings) * 5))
        total_score = min(100, max(15, skill_score + impact_score + format_score))

        jd_record = await self.repo.create_job_description(
            job_title=request.job_title,
            raw_text=request.jd_text,
            company_name=request.company_name,
            skills_extracted=jd_skills,
            commit=False,
        )
        match_record = await self.repo.create_match_record(
            job_description_id=jd_record.id,
            ats_score=total_score,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            star_analysis=star_critiques,
            parse_warnings=parse_warnings,
            candidate_identity_id=candidate_identity_id,
        )
        return ATSScanResponse(
            match_id=match_record.id,
            ats_score=total_score,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            star_analysis=star_critiques,
            parse_warnings=parse_warnings,
            breakdown={
                "hard_skills_score": skill_score,
                "impact_score": impact_score,
                "formatting_score": format_score,
            },
            created_at=match_record.created_at,
        )

    async def generate_talent_shortlist(
        self, request: TalentShortlistRequest
    ) -> TalentShortlistResponse:
        if len(request.jd_text) > 50000:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail="Payload Too Large: JD text exceeds maximum allowed limit (50,000 characters).",
            )

        async def _compute() -> Dict[str, Any]:
            jd_skills = self._extract_skills(f"{request.job_title} {request.jd_text}")
            search_terms = jd_skills if jd_skills else [request.job_title]
            rows, total_matched = await self.repo.find_shortlist_candidates(
                search_terms=search_terms,
                limit=min(request.limit * 2, 50),
                require_video_pitch=request.require_video_pitch,
                location_filter=request.location,
            )

            shortlist: List[Dict[str, Any]] = []
            video_count = 0
            active_count = 0

            for r in rows:
                cand_skills = self._extract_skills(f"{r.get('headline') or ''} {r.get('bio') or ''}")
                matched = [s for s in jd_skills if s in cand_skills]
                missing = [s for s in jd_skills if s not in cand_skills]

                skill_pts = int((len(matched) / max(len(jd_skills), 1)) * 70) if jd_skills else 55
                has_video = bool(r.get("video_pitch_url"))
                is_active = (r.get("seeking_status") or "Actively Looking") == "Actively Looking"
                video_pts = 18 if has_video else 0
                readiness_pts = 12 if is_active else 6
                total_score = min(100, max(25, skill_pts + video_pts + readiness_pts))
                video_count += int(has_video)
                active_count += int(is_active)

                shortlist.append({
                    "profile_id": str(r["id"]),
                    "username": r["username"],
                    "full_name": f"{r['first_name']} {r['last_name']}",
                    "headline": r.get("headline") or "Verified Candidate",
                    "location": r.get("location") or "Remote",
                    "seeking_status": r.get("seeking_status") or "Actively Looking",
                    "match_score": total_score,
                    "matched_skills": matched,
                    "missing_skills": missing,
                    "has_video_pitch": has_video,
                    "video_pitch_url": r.get("video_pitch_url"),
                    "avatar_url": r.get("avatar_url") or "/images/avatar.jpg",
                    "score_breakdown": {
                        "skill_coverage_score": skill_pts,
                        "video_pitch_boost": video_pts,
                        "readiness_boost": readiness_pts,
                    },
                })

            shortlist.sort(key=lambda c: (c["match_score"], c["has_video_pitch"]), reverse=True)
            is_senior = any(k in request.job_title.lower() for k in ("principal", "lead", "staff", "senior", "architect"))
            base_p50 = 68_000_000 if is_senior else 38_000_000
            p50 = int(base_p50 * (1.18 if any(s in jd_skills for s in ("Golang", "Rust", "Kubernetes", "Kafka")) else 1.0))

            return {
                "job_title": request.job_title,
                "company_name": request.company_name,
                "extracted_jd_skills": jd_skills,
                "pool_telemetry": {
                    "total_matching_candidates": total_matched,
                    "video_verified_count": video_count,
                    "actively_looking_count": active_count,
                    "estimated_salary_p25_vnd": int(p50 * 0.8),
                    "estimated_salary_p50_vnd": p50,
                    "estimated_salary_p75_vnd": int(p50 * 1.28),
                    "hiring_difficulty": "HIGH_COMPETITION" if total_matched < 20 else "BALANCED",
                },
                "candidates": shortlist[: request.limit],
            }

        if os.getenv("ENVIRONMENT") == "testing":
            data = await _compute()
        else:
            sig = hashlib.sha256(
                f"{request.job_title}|{request.jd_text}|{request.location}|{request.limit}|{request.require_video_pitch}".encode()
            ).hexdigest()[:20]
            data = await platform_cache.get_or_set(f"shortlist:{sig}", ttl_seconds=20, loader=_compute)

        return TalentShortlistResponse(**data)

    async def get_market_pulse(self) -> TalentMarketPulseResponse:
        async def _load_pulse() -> Dict[str, Any]:
            stats = await self.repo.get_market_pulse_stats()
            total = max(stats["total_visible"], 1)
            scarcity = [
                {"skill": "Golang / Distributed Systems", "candidate_supply": max(12, total // 14), "demand_index": 94, "scarcity_score": 9.1, "salary_premium_pct": "+24%"},
                {"skill": "Kubernetes & Cloud Native", "candidate_supply": max(15, total // 16), "demand_index": 91, "scarcity_score": 8.7, "salary_premium_pct": "+22%"},
                {"skill": "Python / FastAPI Async", "candidate_supply": max(24, total // 9), "demand_index": 89, "scarcity_score": 7.9, "salary_premium_pct": "+18%"},
                {"skill": "Next.js 16 / TypeScript", "candidate_supply": max(28, total // 8), "demand_index": 86, "scarcity_score": 7.4, "salary_premium_pct": "+16%"},
                {"skill": "PostgreSQL / High-Scale Indexing", "candidate_supply": max(19, total // 12), "demand_index": 88, "scarcity_score": 8.3, "salary_premium_pct": "+20%"},
            ]
            return {
                "total_visible_candidates": stats["total_visible"],
                "video_pitch_adoption_pct": round((stats["with_video"] / total) * 100.0, 1),
                "actively_seeking_pct": round((stats["actively_seeking"] / total) * 100.0, 1),
                "hiring_velocity_index": 88.4,
                "skill_scarcity_index": scarcity,
            }

        raw = await _load_pulse() if os.getenv("ENVIRONMENT") == "testing" else await platform_cache.get_or_set("market:pulse", ttl_seconds=30, loader=_load_pulse)
        return TalentMarketPulseResponse(
            total_visible_candidates=raw["total_visible_candidates"],
            video_pitch_adoption_pct=raw["video_pitch_adoption_pct"],
            actively_seeking_pct=raw["actively_seeking_pct"],
            hiring_velocity_index=raw["hiring_velocity_index"],
            skill_scarcity_index=[SkillScarcityItemDTO(**item) for item in raw["skill_scarcity_index"]],
        )

    async def generate_interview_kit(self, request: InterviewKitRequest) -> InterviewKitResponse:
        jd_skills = self._extract_skills(f"{request.job_title} {request.jd_text}")
        top_skills = jd_skills[:4] if jd_skills else ["System Design", "Backend Architecture", "PostgreSQL"]
        org = request.company_name or "your engineering team"
        script = (
            f"[00-15s Hook] Hi {org}, I'm applying for {request.job_title} with hands-on ownership in {', '.join(top_skills[:3])}.\n"
            f"[15-45s Proof & Metrics] In my recent production systems, I architected {', '.join(top_skills[:2])} pipelines with measurable SLA and latency gains.\n"
            f"[45-60s Call-to-Action] I'd love to walk through how I can accelerate {org}'s roadmap in my full Belooga profile."
        )
        questions = [
            InterviewQuestionDTO(
                focus_skill=sk,
                question=f"Describe a high-stakes production bottleneck you resolved using {sk}. What trade-offs did you make?",
                star_coaching_tip=f"State baseline p95 latency/throughput, explain your {sk} architecture decision, and quantify the post-deployment delta.",
            )
            for sk in top_skills[:3]
        ]
        return InterviewKitResponse(
            job_title=request.job_title,
            company_name=request.company_name,
            video_pitch_script_60s=script,
            star_interview_questions=questions,
            closing_questions_for_hiring_manager=[
                f"What is the highest-leverage bottleneck the {request.job_title} will own in the first 90 days?",
                f"How does {org} measure engineering velocity and production reliability across {', '.join(top_skills[:2])}?",
            ],
        )
