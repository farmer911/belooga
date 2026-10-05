"""Service Layer for Domain 10: ATS Diagnostics & JD Matching Engine."""

import re
import uuid
from typing import List, Set, Tuple, Dict, Any, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.ats_matching_repo import ATSMatchingRepository
from app.schemas.ats_matching import ATSScanRequest, ATSScanResponse


# Standard Tech Taxonomy for Fast Heuristic Extraction ($0 token cost)
CORE_TECH_TAXONOMY: List[str] = [
    "Golang", "Go", "Python", "TypeScript", "JavaScript", "React", "Next.js", "Vue", "Angular",
    "Node.js", "Express", "FastAPI", "Django", "Flask", "Java", "Spring Boot", "Kotlin", "Swift",
    "Flutter", "C++", "C#", ".NET", "Rust", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch",
    "Kafka", "RabbitMQ", "gRPC", "GraphQL", "REST API", "Docker", "Kubernetes", "Helm", "AWS", "GCP",
    "Azure", "CI/CD", "GitHub Actions", "Terraform", "Linux", "Git", "Microservices", "System Design",
    "Tailwind", "Tailwind CSS", "HTML5", "CSS3", "SQL", "NoSQL", "DevOps", "Unit Testing", "Playwright"
]

ACTION_VERB_PATTERNS = [
    r"\b(designed|architected|built|developed|implemented|optimized|scaled|reduced|increased|accelerated|automated|refactored|deployed|orchestrated|mentored|spearheaded)\b"
]

METRIC_PATTERNS = [
    r"\b\d+[%]\b",
    r"\b\d+[\+]?\s*(?:users|rps|tps|clients|requests|ms|seconds|minutes|hours|days|percent)\b",
    r"[$€₫]\s*[\d,]+",
    r"\b(?:reduced|increased|improved|scaled|saved)\s+by\s+\d+",
    r"\b\d+x\b"
]


class ATSMatchingService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ATSMatchingRepository(db)

    def _extract_skills(self, text: str) -> List[str]:
        found: Set[str] = set()
        lowered = text.lower()
        for skill in CORE_TECH_TAXONOMY:
            # Word boundary check for accurate matching (e.g. Go vs Google)
            escaped = re.escape(skill.lower())
            if skill.lower() == "go":
                pattern = r"\bgo\b"
            elif skill.lower() == "c":
                pattern = r"\bc\b"
            elif skill.lower() == "c++":
                pattern = r"\bc\+\+\b"
            elif skill.lower() == "c#":
                pattern = r"\bc#\b"
            else:
                pattern = rf"\b{escaped}\b"

            if re.search(pattern, lowered):
                # Canonical normalization
                canonical = "Golang" if skill.lower() == "go" else skill
                found.add(canonical)
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
                    "metrics_detected": []
                })
            elif not has_action_verb:
                critiques.append({
                    "original_text": line,
                    "critique": "Câu bắt đầu bằng động từ thụ động. Hãy đổi sang động từ hành động mạnh mẽ (Action Verb).",
                    "suggested_star_rewrite": f"Thiết kế / Tối ưu hóa: {line}",
                    "metrics_detected": metrics_found
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
        self,
        request: ATSScanRequest,
        candidate_identity_id: Optional[uuid.UUID] = None
    ) -> ATSScanResponse:
        # 1. Hard payload safety guard (Prevent DoS / OOM)
        if len(request.jd_text) > 50000 or len(request.cv_text) > 50000:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail="Payload Too Large: JD or CV text exceeds maximum allowed limit (50,000 characters)."
            )

        # 2. Extract skills from JD & CV
        jd_skills = self._extract_skills(request.jd_text)
        cv_skills = self._extract_skills(request.cv_text)

        matched_skills = [s for s in jd_skills if s in cv_skills]
        missing_skills = [s for s in jd_skills if s not in cv_skills]

        # 3. STAR & Impact Audit
        star_critiques = self._analyze_star_bullets(request.cv_text)

        # 4. Formatting & Parser Warnings
        parse_warnings = self._detect_format_warnings(request.cv_text)

        # 5. ATS Scoring Algorithm
        # - Skill Coverage: 60% weight
        # - Impact & Metrics: 25% weight
        # - Parseability: 15% weight
        skill_coverage_ratio = len(matched_skills) / max(len(jd_skills), 1)
        skill_score = int(skill_coverage_ratio * 60)

        bullets_analyzed = len(request.cv_text.splitlines())
        unquantified_count = len(star_critiques)
        impact_ratio = max(0.0, 1.0 - (unquantified_count / max(bullets_analyzed, 1)))
        impact_score = int(impact_ratio * 25)

        format_score = max(0, 15 - (len(parse_warnings) * 5))

        total_score = min(100, max(15, skill_score + impact_score + format_score))

        # 6. Persist to DB for history & telemetry
        jd_record = await self.repo.create_job_description(
            job_title=request.job_title,
            raw_text=request.jd_text,
            company_name=request.company_name,
            skills_extracted=jd_skills,
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
