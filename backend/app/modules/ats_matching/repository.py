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
        commit: bool = True,
    ) -> JobDescription:
        jd = JobDescription(
            company_name=company_name,
            job_title=job_title,
            raw_text=raw_text,
            skills_extracted=skills_extracted or [],
        )
        self.db.add(jd)
        if commit:
            await self.db.commit()
            await self.db.refresh(jd)
        else:
            await self.db.flush()
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
        query = text("""
            WITH matched_pool AS MATERIALIZED (
                SELECT p.id, p.username, p.first_name, p.last_name, p.headline, p.bio,
                       p.location, p.seeking_status, p.avatar_url, p.video_pitch_url,
                       p.created_at,
                       ts_rank_cd(p.search_vector, to_tsquery('english', :ts_q)) AS ts_rank
                FROM candidate_profiles p
                WHERE p.is_hidden = FALSE
                  AND p.search_vector @@ to_tsquery('english', :ts_q)
                  AND (NOT CAST(:req_video AS boolean) OR p.video_pitch_url IS NOT NULL)
                  AND (CAST(:loc AS text) IS NULL OR p.location ILIKE CAST(:loc AS text))
                LIMIT 250
            )
            SELECT id, username, first_name, last_name, headline, bio,
                   location, seeking_status, avatar_url, video_pitch_url,
                   ts_rank,
                   COALESCE((
                       SELECT array_agg(s.name ORDER BY s.name)
                       FROM profile_skills ps
                       JOIN skills s ON s.id = ps.skill_id
                       WHERE ps.profile_id = matched_pool.id
                   ), ARRAY[]::text[]) AS db_skills,
                   COUNT(*) OVER() AS total_window_count
            FROM matched_pool
            ORDER BY
                (CASE WHEN video_pitch_url IS NOT NULL THEN 0.35 ELSE 0.0 END +
                 CASE WHEN seeking_status = 'Actively Looking' THEN 0.20 ELSE 0.0 END +
                 ts_rank) DESC,
                created_at DESC
            LIMIT :limit
        """)
        params: Dict[str, Any] = {
            "ts_q": ts_expr,
            "limit": limit,
            "req_video": bool(require_video_pitch),
            "loc": f"%{location_filter.strip()}%" if location_filter else None,
        }

        res = await self.db.execute(query, params)
        rows = [dict(r._mapping) for r in res.fetchall()]
        total_matched = int(rows[0]["total_window_count"]) if rows else 0
        return rows, total_matched

    async def list_scan_history(self, candidate_identity_id: uuid.UUID, limit: int = 20) -> List[Dict[str, Any]]:
        """Only the caller's own scans (anonymous scans are never listed)."""
        res = await self.db.execute(
            text("""
                SELECT m.id, m.id AS match_id, jd.job_title, jd.company_name,
                       m.ats_score, m.matched_skills, m.missing_skills, m.created_at
                FROM resume_jd_matches m
                JOIN job_descriptions jd ON jd.id = m.job_description_id
                WHERE m.candidate_identity_id = :cid
                ORDER BY m.created_at DESC
                LIMIT :lim
            """),
            {"cid": candidate_identity_id, "lim": limit},
        )
        return [dict(r._mapping) for r in res.fetchall()]

    async def get_market_pulse_stats(self) -> Dict[str, Any]:
        query = text("""
            SELECT
                GREATEST(
                    (SELECT reltuples::bigint FROM pg_class WHERE oid = 'candidate_profiles'::regclass),
                    COUNT(*)
                ) AS total_visible,
                (SELECT COUNT(*) FROM job_descriptions) AS total_jds_analyzed,
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
        skill_res = await self.db.execute(
            text("""
                SELECT s.name AS skill, COUNT(ps.profile_id)::int AS supply_cnt
                FROM skills s
                LEFT JOIN profile_skills ps ON ps.skill_id = s.id
                GROUP BY s.id, s.name
                ORDER BY supply_cnt DESC, s.name ASC
                LIMIT 8
            """)
        )
        skill_counts = {r.skill.lower(): int(r.supply_cnt) for r in skill_res.fetchall()}
        if not row:
            return {
                "total_visible": 0,
                "total_jds_analyzed": 0,
                "with_video": 0,
                "actively_seeking": 0,
                "skill_counts": skill_counts,
            }
        total_vis = int(row["total_visible"] or 0)
        sample_sz = int(row["sample_size"] or 1)
        scale = total_vis / sample_sz if total_vis > sample_sz else 1.0
        return {
            "total_visible": total_vis,
            "total_jds_analyzed": int(row["total_jds_analyzed"] or 0),
            "with_video": int(round(int(row["sampled_video"] or 0) * scale)),
            "actively_seeking": int(round(int(row["sampled_seeking"] or 0) * scale)),
            "skill_counts": skill_counts,
        }
