"""Service Layer for Domain 10: ATS Diagnostics, Recruiter Shortlist & Talent Market Pulse (Vertical Module: ats_matching)."""

import asyncio
import hashlib
import io
import os
import re
import uuid
import xml.etree.ElementTree as ET
import zipfile
import zlib
from typing import Any, Dict, List, Optional, Set
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import platform_cache
from app.modules.ats_matching.repository import ATSMatchingRepository
from app.schemas.ats_matching import (
    ATSScanHistoryItem, ATSScanRequest, ATSScanResponse, ATSTailorResponse,
    CVFileExtractResponse, InterviewKitRequest, InterviewKitResponse, InterviewQuestionDTO,
    SkillScarcityItemDTO, TalentMarketPulseResponse, TalentShortlistRequest, TalentShortlistResponse,
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
    r"\b(engineered|designed|architected|built|developed|implemented|optimized|scaled|reduced|increased|accelerated|automated|refactored|deployed|orchestrated|mentored|spearheaded)\b"
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
            esc = re.escape(skill.lower())
            pat = r"\bgo\b" if skill.lower() == "go" else (rf"(?<!\w){esc}(?!\w)" if skill.lower() in ("c++", "c#") else rf"\b{esc}\b")
            if re.search(pat, lowered):
                found.add("Golang" if skill.lower() == "go" else skill)
        return sorted(found)

    def _analyze_star_bullets(self, cv_text: str) -> List[Dict[str, Any]]:
        critiques: List[Dict[str, Any]] = []
        lines = [line.strip("-•* \t") for line in cv_text.splitlines() if len(line.strip()) > 15]
        for line in lines[:8]:
            has_action_verb = any(re.search(pat, line, re.IGNORECASE) for pat in ACTION_VERB_PATTERNS)
            metrics_found = [m.group() for pat in METRIC_PATTERNS for m in re.finditer(pat, line, re.IGNORECASE)]
            if not metrics_found:
                critiques.append({
                    "original_text": line, "metrics_detected": [],
                    "critique": "Câu thiếu số liệu định lượng (Metrics). Bot ATS và Hiring Manager đánh giá thấp các câu mô tả chung chung.",
                    "suggested_star_rewrite": f"{line} (Đo lường bằng: tăng X% hiệu suất, xử lý Y requests/giây hoặc giảm Z thời gian chết).",
                })
            elif not has_action_verb:
                critiques.append({
                    "original_text": line, "metrics_detected": metrics_found,
                    "critique": "Câu bắt đầu bằng động từ thụ động. Hãy đổi sang động từ hành động mạnh mẽ (Action Verb).",
                    "suggested_star_rewrite": f"Thiết kế / Tối ưu hóa: {line}",
                })
        return critiques

    def _detect_format_warnings(self, cv_text: str) -> List[str]:
        warnings: List[str] = []
        if "\t\t" in cv_text or "  |  " in cv_text:
            warnings.append("Phát hiện định dạng bảng lồng hoặc ký tự phân cách phức tạp. Bot ATS có thể bóc tách sai thứ tự dòng.")
        if len(cv_text.splitlines()) < 10 and len(cv_text) > 500:
            warnings.append("CV thiếu các dấu gạch đầu dòng (bullet points) rõ ràng. Các đoạn văn dài gây khó khăn cho ATS entity parser.")
        return warnings

    async def scan_and_match(self, request: ATSScanRequest, candidate_identity_id: Optional[uuid.UUID] = None) -> ATSScanResponse:
        if len(request.jd_text) > 50000 or len(request.cv_text) > 50000:
            raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail="Payload Too Large: JD or CV text exceeds maximum allowed limit (50,000 characters).")
        jd_skills, cv_skills = self._extract_skills(request.jd_text), self._extract_skills(request.cv_text)
        matched_skills = [s for s in jd_skills if s in cv_skills]
        missing_skills = [s for s in jd_skills if s not in cv_skills]
        star_critiques, parse_warnings = self._analyze_star_bullets(request.cv_text), self._detect_format_warnings(request.cv_text)

        skill_score = int((len(matched_skills) / max(len(jd_skills), 1)) * 60)
        impact_score = int(max(0.0, 1.0 - (len(star_critiques) / max(len(request.cv_text.splitlines()), 1))) * 25)
        format_score = max(0, 15 - (len(parse_warnings) * 5))
        total_score = min(100, max(15, skill_score + impact_score + format_score))

        jd_record = await self.repo.create_job_description(
            job_title=request.job_title, raw_text=request.jd_text, company_name=request.company_name, skills_extracted=jd_skills, commit=False,
        )
        match_record = await self.repo.create_match_record(
            job_description_id=jd_record.id, ats_score=total_score, matched_skills=matched_skills, missing_skills=missing_skills,
            star_analysis=star_critiques, parse_warnings=parse_warnings, candidate_identity_id=candidate_identity_id,
        )
        await platform_cache.invalidate_prefix("market:pulse")
        await platform_cache.invalidate_prefix("salary_benchmark:")
        await platform_cache.invalidate_prefix("analytics:")
        return ATSScanResponse(
            match_id=match_record.id, ats_score=total_score, matched_skills=matched_skills, missing_skills=missing_skills,
            star_analysis=star_critiques, parse_warnings=parse_warnings,
            breakdown={"hard_skills_score": skill_score, "impact_score": impact_score, "formatting_score": format_score},
            created_at=match_record.created_at,
        )

    async def tailor_cv(self, request: ATSScanRequest, candidate_identity_id: Optional[uuid.UUID] = None) -> ATSTailorResponse:
        jd_skills, cv_skills = self._extract_skills(request.jd_text), self._extract_skills(request.cv_text)
        missing = [s for s in jd_skills if s not in cv_skills]
        star_critiques = self._analyze_star_bullets(request.cv_text)
        focus_skills = ", ".join((missing or jd_skills or cv_skills or ["Python", "PostgreSQL"])[:4])
        weak_map = {
            c["original_text"]: f"• Engineered and optimized {focus_skills} workflows ({c['original_text']})."
            for c in star_critiques
        }
        rewritten = [weak_map.get(ln.strip("-•* \t"), ln) for ln in request.cv_text.splitlines() if ln.strip()]
        if missing:
            rewritten.append(f"• Target Role Alignment ({request.job_title}): {', '.join(missing)}.")
        all_skills = sorted(set(cv_skills + jd_skills))
        if all_skills:
            rewritten.append(f"• Core Technical Stack: {', '.join(all_skills)}.")
        tailored_cv_text = "\n".join(rewritten)
        scan_result = await self.scan_and_match(
            ATSScanRequest(job_title=request.job_title, company_name=request.company_name, jd_text=request.jd_text, cv_text=tailored_cv_text),
            candidate_identity_id=candidate_identity_id,
        )
        return ATSTailorResponse(tailored_cv_text=tailored_cv_text, scan_result=scan_result)

    async def list_scan_history(self, candidate_identity_id: uuid.UUID) -> List[ATSScanHistoryItem]:
        return [ATSScanHistoryItem(**r) for r in await self.repo.list_scan_history(candidate_identity_id=candidate_identity_id, limit=20)]

    async def generate_talent_shortlist(self, request: TalentShortlistRequest) -> TalentShortlistResponse:
        if len(request.jd_text) > 50000:
            raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail="Payload Too Large: JD text exceeds maximum allowed limit (50,000 characters).")

        async def _compute() -> Dict[str, Any]:
            jd_skills = self._extract_skills(f"{request.job_title} {request.jd_text}")
            rows, total_matched = await self.repo.find_shortlist_candidates(
                search_terms=jd_skills or [request.job_title], limit=min(request.limit * 2, 50),
                require_video_pitch=request.require_video_pitch, location_filter=request.location,
            )
            shortlist, video_count, active_count = [], 0, 0
            for r in rows:
                db_skills = [str(s) for s in (r.get("db_skills") or [])]
                cand_skills = set(self._extract_skills(f"{r.get('headline') or ''} {r.get('bio') or ''} {' '.join(db_skills)}")) | set(db_skills)
                matched = [s for s in jd_skills if s in cand_skills]
                missing = [s for s in jd_skills if s not in cand_skills]
                skill_pts = int((len(matched) / max(len(jd_skills), 1)) * 70) if jd_skills else 55
                has_video, is_active = bool(r.get("video_pitch_url")), (r.get("seeking_status") or "Actively Looking") == "Actively Looking"
                video_pts, readiness_pts = (18 if has_video else 0), (12 if is_active else 6)
                video_count, active_count = video_count + int(has_video), active_count + int(is_active)
                shortlist.append({
                    "profile_id": str(r["id"]), "username": r["username"], "full_name": f"{r['first_name']} {r['last_name']}",
                    "headline": r.get("headline") or "Verified Candidate", "location": r.get("location") or "Remote",
                    "seeking_status": r.get("seeking_status") or "Actively Looking",
                    "match_score": min(100, max(25, skill_pts + video_pts + readiness_pts)),
                    "matched_skills": matched, "missing_skills": missing, "has_video_pitch": has_video,
                    "video_pitch_url": r.get("video_pitch_url"), "avatar_url": r.get("avatar_url") or "/images/avatar.jpg",
                    "score_breakdown": {"skill_coverage_score": skill_pts, "video_pitch_boost": video_pts, "readiness_boost": readiness_pts},
                })
            shortlist.sort(key=lambda c: (c["match_score"], c["has_video_pitch"]), reverse=True)
            is_senior = any(k in request.job_title.lower() for k in ("principal", "lead", "staff", "senior", "architect"))
            p50 = int((68_000_000 if is_senior else 38_000_000) * (1.18 if any(s in jd_skills for s in ("Golang", "Rust", "Kubernetes", "Kafka")) else 1.0))
            return {
                "job_title": request.job_title, "company_name": request.company_name, "extracted_jd_skills": jd_skills,
                "pool_telemetry": {
                    "total_matching_candidates": total_matched, "video_verified_count": video_count, "actively_looking_count": active_count,
                    "estimated_salary_p25_vnd": int(p50 * 0.8), "estimated_salary_p50_vnd": p50, "estimated_salary_p75_vnd": int(p50 * 1.28),
                    "hiring_difficulty": "HIGH_COMPETITION" if total_matched < 20 else "BALANCED",
                },
                "candidates": shortlist[: request.limit],
            }

        sig = hashlib.sha256(f"{request.job_title}|{request.jd_text}|{request.location}|{request.limit}|{request.require_video_pitch}".encode()).hexdigest()[:20]
        data = await _compute() if os.getenv("ENVIRONMENT") == "testing" else await platform_cache.get_or_set(f"shortlist:{sig}", ttl_seconds=20, loader=_compute)
        return TalentShortlistResponse(**data)

    async def get_market_pulse(self) -> TalentMarketPulseResponse:
        async def _load_pulse() -> Dict[str, Any]:
            stats = await self.repo.get_market_pulse_stats()
            total, sk_cnt = max(stats["total_visible"], 1), stats.get("skill_counts") or {}
            scarcity = [
                {"skill": "Golang / Distributed Systems", "candidate_supply": sk_cnt.get("golang", 0) + max(12, total // 14), "demand_index": 94, "scarcity_score": 9.1, "salary_premium_pct": "+24%"},
                {"skill": "Kubernetes & Cloud Native", "candidate_supply": sk_cnt.get("kubernetes", 0) + max(15, total // 16), "demand_index": 91, "scarcity_score": 8.7, "salary_premium_pct": "+22%"},
                {"skill": "Python / FastAPI Async", "candidate_supply": sk_cnt.get("fastapi", 0) + max(24, total // 9), "demand_index": 89, "scarcity_score": 7.9, "salary_premium_pct": "+18%"},
                {"skill": "Next.js 16 / TypeScript", "candidate_supply": sk_cnt.get("typescript", 0) + max(28, total // 8), "demand_index": 86, "scarcity_score": 7.4, "salary_premium_pct": "+16%"},
                {"skill": "PostgreSQL / High-Scale Indexing", "candidate_supply": sk_cnt.get("postgresql", 0) + max(19, total // 12), "demand_index": 88, "scarcity_score": 8.3, "salary_premium_pct": "+20%"},
            ]
            return {
                "total_visible_candidates": stats["total_visible"], "total_jds_analyzed": stats.get("total_jds_analyzed", 0),
                "video_pitch_adoption_pct": round((stats["with_video"] / total) * 100.0, 1),
                "actively_seeking_pct": round((stats["actively_seeking"] / total) * 100.0, 1),
                "hiring_velocity_index": 88.4, "skill_scarcity_index": scarcity,
            }

        raw = await _load_pulse() if os.getenv("ENVIRONMENT") == "testing" else await platform_cache.get_or_set("market:pulse", ttl_seconds=30, loader=_load_pulse)
        return TalentMarketPulseResponse(
            total_visible_candidates=raw["total_visible_candidates"], total_jds_analyzed=raw.get("total_jds_analyzed", 0),
            video_pitch_adoption_pct=raw["video_pitch_adoption_pct"], actively_seeking_pct=raw["actively_seeking_pct"],
            hiring_velocity_index=raw["hiring_velocity_index"],
            skill_scarcity_index=[SkillScarcityItemDTO(**item) for item in raw["skill_scarcity_index"]],
        )

    async def generate_interview_kit(self, request: InterviewKitRequest) -> InterviewKitResponse:
        jd_skills, cv_raw = self._extract_skills(f"{request.job_title} {request.jd_text}"), (request.cv_text or "").strip()
        cv_skills = self._extract_skills(cv_raw) if cv_raw else []
        matched, missing = [s for s in jd_skills if s in cv_skills], [s for s in jd_skills if s not in cv_skills]
        ordered = matched + missing + [s for s in cv_skills if s not in jd_skills]
        top_skills = ordered[:4] if ordered else ["System Design", "Backend Architecture", "PostgreSQL"]
        cv_snippet = next((ln.strip("-•* \t") for ln in cv_raw.splitlines() if len(ln.strip()) > 12), "")
        proof_clause, gap_clause, org = (f" ({cv_snippet[:90]})" if cv_snippet else ""), (f" while bridging {', '.join(missing[:2])}" if missing else ""), (request.company_name or "your engineering team")
        script = (
            f"[00-15s Hook] Hi {org}, I'm applying for {request.job_title} with hands-on ownership in {', '.join((matched or top_skills)[:3])}.\n"
            f"[15-45s Proof & Metrics] In my recent production systems{proof_clause}, I architected {', '.join(top_skills[:2])} pipelines with measurable SLA gains{gap_clause}.\n"
            f"[45-60s Call-to-Action] I'd love to walk through how I can accelerate {org}'s roadmap in my full Belooga profile."
        )
        questions = [
            InterviewQuestionDTO(
                focus_skill=sk,
                question=f"Based on your CV experience{proof_clause if sk in matched else ''}, describe a production challenge you solved with {sk}."
                if sk in matched else f"How would you ramp up on {sk} and apply your {', '.join((matched or top_skills)[:2])} background to our stack?",
                star_coaching_tip=f"State baseline p95 latency/throughput, explain your {sk} architecture decision, and quantify the post-deployment delta.",
            )
            for sk in top_skills[:3]
        ]
        return InterviewKitResponse(
            job_title=request.job_title, company_name=request.company_name, video_pitch_script_60s=script, star_interview_questions=questions,
            closing_questions_for_hiring_manager=[
                f"What is the highest-leverage bottleneck the {request.job_title} will own in the first 90 days?",
                f"How does {org} measure engineering velocity and production reliability across {', '.join(top_skills[:2])}?",
            ],
        )

    @staticmethod
    def _extract_cv_bytes_sync(ext: str, raw_bytes: bytes) -> str:
        if ext in (".txt", ".md"):
            return raw_bytes.decode("utf-8", errors="ignore").strip()
        if ext == ".docx":
            if zipfile.is_zipfile(io.BytesIO(raw_bytes)):
                with zipfile.ZipFile(io.BytesIO(raw_bytes)) as zf:
                    if "word/document.xml" in zf.namelist():
                        root = ET.fromstring(zf.read("word/document.xml"))
                        paragraphs = ["".join(t.text for t in p.iter() if (t.tag.endswith("}t") or t.tag == "w:t") and t.text).strip() for p in root.iter() if p.tag.endswith("}p") or p.tag == "w:p"]
                        if any(paragraphs):
                            return "\n".join(p for p in paragraphs if p)
            return raw_bytes.decode("utf-8", errors="ignore").strip()

        chunks = [raw_bytes]
        for m in re.finditer(rb"stream[\r\n]+(.*?)[\r\n]+endstream", raw_bytes, re.DOTALL):
            raw_stream = m.group(1).strip()
            chunks.append(raw_stream)
            for wbits in (zlib.MAX_WBITS, -zlib.MAX_WBITS):
                try:
                    chunks.append(zlib.decompressobj(wbits).decompress(raw_stream))
                    break
                except zlib.error:
                    continue
        lines, seen = [], set()
        skip_prefixes = ("ReportLab", "PDF-", "http://www.reportlab", "anonymous", "opensource", "unspecified", "D:20")
        for chunk in chunks:
            for m in re.finditer(r"\(([^\r\n()]+)\)", chunk.decode("latin-1", errors="ignore")):
                val = re.sub(r"\\[0-7]{1,3}", " ", m.group(1)).replace("\\", "").strip()
                if len(val) >= 2 and any(c.isalpha() for c in val) and not val.startswith(skip_prefixes) and val not in seen:
                    seen.add(val)
                    lines.append(val)
        return "\n".join(lines) if lines else "\n".join(ln.strip() for ln in raw_bytes.decode("utf-8", errors="ignore").splitlines() if len(ln.strip()) >= 3)

    async def extract_cv_file_text(self, file: UploadFile) -> CVFileExtractResponse:
        max_bytes = 5 * 1024 * 1024
        raw_bytes = await file.read(max_bytes + 1)
        if len(raw_bytes) > max_bytes:
            raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail="CV file exceeds maximum allowed limit (5MB).")
        if not raw_bytes:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded CV file is empty.")
        filename, ext = (file.filename or "resume.txt").strip(), os.path.splitext((file.filename or "resume.txt").strip().lower())[1]
        if ext not in (".pdf", ".docx", ".txt", ".md"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported CV file format. Allowed: .pdf, .docx, .txt, .md")
        extracted_text = await asyncio.to_thread(self._extract_cv_bytes_sync, ext, raw_bytes)
        if not extracted_text.strip():
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Could not extract readable text from uploaded CV file.")
        words = [w for w in re.split(r"\s+", extracted_text.strip()) if w]
        return CVFileExtractResponse(
            filename=filename, file_type=ext.lstrip("."), extracted_text=extracted_text,
            char_count=len(extracted_text), word_count=len(words), extracted_skills=self._extract_skills(extracted_text),
        )
