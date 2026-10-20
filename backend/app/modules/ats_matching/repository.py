"""Repository Layer for Domain 10: ATS Diagnostics, JD Matching & Recruiter Talent Shortlist (Vertical Module: ats_matching)."""

import re
import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ats_matching import JobDescription, ResumeJDMatch


class ATSMatchingRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_job_description(
        self,
        job_title: str,
        raw_text: str,
        company_name: Optional[str] = None,
        skills_extracted: Optional[List[str]] = None,
    ) -> JobDescription:
        jd = JobDescription(
            company_name=company_name,
            job_title=job_title,
            raw_text=raw_text,
            skills_extracted=skills_extracted or [],
        )
        self.db.add(jd)
        await self.db.commit()
        await self.db.refresh(jd)
        return jd

    async def create_match_record(
        self,
        job_description_id: uuid.UUID,
        ats_score: int,
        matched_skills: List[str],
        missing_skills: List[str],
        star_analysis: List[dict],
        parse_warnings: List[str],
        candidate_identity_id: Optional[uuid.UUID] = None,
    ) -> ResumeJDMatch:
        match = ResumeJDMatch(
            candidate_identity_id=candidate_identity_id,
            job_description_id=job_description_id,
            ats_score=ats_score,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            star_analysis=star_analysis,
            parse_warnings=parse_warnings,
        )
        self.db.add(match)
        await self.db.commit()
        await self.db.refresh(match)
        return match

    async def find_shortlist_candidates(
        self,
        search_terms: List[str],
        limit: int = 25,
        require_video_pitch: bool = False,
        location_filter: Optional[str] = None,
    ) -> tuple[List[Dict[str, Any]], int]:
        clean_tokens = []
        for term in search_terms:
            for tok in re.findall(r"[a-zA-Z0-9]+", term.lower()):
                if len(tok) >= 2 and tok not in clean_tokens:
                    clean_tokens.append(tok)

        ts_expr = " | ".join(clean_tokens[:12]) if clean_tokens else "engineer | developer"
        video_clause = "AND p.video_pitch_url IS NOT NULL" if require_video_pitch else ""
        loc_clause = "AND p.location ILIKE :loc" if location_filter else ""

        query = text(f"""
            WITH matched_pool AS MATERIALIZED (
                SELECT p.id, p.username, p.first_name, p.last_name, p.headline, p.bio,
                       p.location, p.seeking_status, p.avatar_url, p.video_pitch_url,
                       p.created_at, p.search_vector
                FROM candidate_profiles p
                WHERE p.is_hidden = FALSE
                  AND p.search_vector @@ to_tsquery('english', :ts_q)
                  {video_clause}
                  {loc_clause}
                LIMIT 250
            )
            SELECT id, username, first_name, last_name, headline, bio,
                   location, seeking_status, avatar_url, video_pitch_url,
                   ts_rank_cd(search_vector, to_tsquery('english', :ts_q)) AS ts_rank
            FROM matched_pool
            ORDER BY
                (CASE WHEN video_pitch_url IS NOT NULL THEN 0.35 ELSE 0.0 END +
                 CASE WHEN seeking_status = 'Actively Looking' THEN 0.20 ELSE 0.0 END +
                 ts_rank_cd(search_vector, to_tsquery('english', :ts_q))) DESC,
                created_at DESC
            LIMIT :limit
        """)
        count_query = text(f"""
            SELECT COUNT(*) FROM (
                SELECT 1 FROM candidate_profiles p
                WHERE p.is_hidden = FALSE
                  AND p.search_vector @@ to_tsquery('english', :ts_q)
                  {video_clause}
                  {loc_clause}
                LIMIT 1000
            ) capped
        """)
        params: Dict[str, Any] = {"ts_q": ts_expr, "limit": limit}
        if location_filter:
            params["loc"] = f"%{location_filter.strip()}%"

        res = await self.db.execute(query, params)
        rows = [dict(r._mapping) for r in res.fetchall()]
        cnt_res = await self.db.execute(count_query, params)
        total_matched = int(cnt_res.scalar() or len(rows))
        return rows, total_matched

    async def get_market_pulse_stats(self) -> Dict[str, int]:
        query = text("""
            SELECT
                GREATEST(
                    (SELECT reltuples::bigint FROM pg_class WHERE oid = 'candidate_profiles'::regclass),
                    COUNT(*)
                ) AS total_visible,
                COUNT(*) FILTER (WHERE video_pitch_url IS NOT NULL) AS sampled_video,
                COUNT(*) FILTER (WHERE seeking_status = 'Actively Looking') AS sampled_seeking,
                GREATEST(COUNT(*), 1) AS sample_size
            FROM (
                SELECT video_pitch_url, seeking_status
                FROM candidate_profiles
                WHERE is_hidden = FALSE
                LIMIT 2000
            ) sampled
        """)
        res = await self.db.execute(query)
        row = res.mappings().first()
        if not row:
            return {"total_visible": 0, "with_video": 0, "actively_seeking": 0}
        total_vis = int(row["total_visible"] or 0)
        sample_sz = int(row["sample_size"] or 1)
        scale = total_vis / sample_sz if total_vis > sample_sz else 1.0
        return {
            "total_visible": total_vis,
            "with_video": int(round(int(row["sampled_video"] or 0) * scale)),
            "actively_seeking": int(round(int(row["sampled_seeking"] or 0) * scale)),
        }
