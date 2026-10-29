"""Decompose contact_inquiries key-value abuse into first-class tables and migrate legacy JSON rows.

Tables: recruiter_pipeline_items, reverse_bids, cv_roasts(+votes), salary_crawl_runs, company_profiles(+reviews,
interview_questions), career_posting_meta, blog_posts(+likes, comments), user_posts(+likes, comments),
expert_applications, career_goals. Wallet/payment keys are out of scope (handled by 0008).

Revision ID: 0009
Revises: 0008
Create Date: 2026-10-28 00:00:00.000000
"""

from typing import Sequence, Union
from alembic import op

revision: str = "0009"
down_revision: Union[str, Sequence[str], None] = "0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

__all__ = ("revision", "down_revision", "branch_labels", "depends_on", "upgrade", "downgrade")

DDL = """
-- 25. contact_inquiries key-value decomposition (Alembic 0009): first-class tables
CREATE TABLE IF NOT EXISTS recruiter_pipeline_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recruiter_identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
    candidate_username VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    headline VARCHAR(255) NOT NULL DEFAULT '',
    target_role VARCHAR(255) NOT NULL DEFAULT '',
    stage VARCHAR(32) NOT NULL DEFAULT 'SHORTLISTED'
        CHECK (stage IN ('SHORTLISTED', 'PITCH_REVIEWED', 'INTERVIEW_INVITED', 'OFFER_SENT', 'HIRED')),
    ats_score INTEGER NOT NULL DEFAULT 0 CHECK (ats_score BETWEEN 0 AND 100),
    years_experience INTEGER NOT NULL DEFAULT 0 CHECK (years_experience >= 0),
    expected_salary VARCHAR(100) NOT NULL DEFAULT '',
    video_pitch_url VARCHAR(512) NOT NULL DEFAULT '',
    matched_skills TEXT[] NOT NULL DEFAULT '{}',
    missing_skills TEXT[] NOT NULL DEFAULT '{}',
    recruiter_rating SMALLINT NOT NULL DEFAULT 4 CHECK (recruiter_rating BETWEEN 1 AND 5),
    evaluation_notes TEXT NOT NULL DEFAULT '',
    contact_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    interview_datetime VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_recruiter_pipeline_candidate
    ON recruiter_pipeline_items (recruiter_identity_id, LOWER(candidate_username));
CREATE INDEX IF NOT EXISTS idx_recruiter_pipeline_recruiter_created
    ON recruiter_pipeline_items (recruiter_identity_id, created_at DESC);

CREATE TABLE IF NOT EXISTS reverse_bids (
    id VARCHAR(64) PRIMARY KEY,
    recruiter_identity_id UUID REFERENCES identities(id) ON DELETE CASCADE,
    candidate_username VARCHAR(100) NOT NULL,
    role VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL DEFAULT '',
    salary_usd INTEGER NOT NULL CHECK (salary_usd > 0),
    pitch_note TEXT NOT NULL DEFAULT '',
    status VARCHAR(16) NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT', 'ACCEPTED', 'DECLINED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reverse_bids_recruiter_created ON reverse_bids (recruiter_identity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reverse_bids_candidate ON reverse_bids (LOWER(candidate_username));

CREATE TABLE IF NOT EXISTS cv_roasts (
    id VARCHAR(64) PRIMARY KEY,
    author_identity_id UUID REFERENCES identities(id) ON DELETE SET NULL,
    alias VARCHAR(120) NOT NULL,
    target_role VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    ai_roast TEXT NOT NULL,
    votes INTEGER NOT NULL DEFAULT 0 CHECK (votes >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cv_roasts_created ON cv_roasts (created_at DESC);

CREATE TABLE IF NOT EXISTS cv_roast_votes (
    roast_id VARCHAR(64) NOT NULL REFERENCES cv_roasts(id) ON DELETE CASCADE,
    identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (roast_id, identity_id)
);

CREATE TABLE IF NOT EXISTS salary_crawl_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    triggered_by_identity_id UUID REFERENCES identities(id) ON DELETE SET NULL,
    bonus_samples INTEGER NOT NULL CHECK (bonus_samples >= 0),
    career_postings_scanned INTEGER NOT NULL DEFAULT 0 CHECK (career_postings_scanned >= 0),
    crawled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_salary_crawl_runs_crawled ON salary_crawl_runs (crawled_at DESC);

CREATE TABLE IF NOT EXISTS company_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(120) UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    owner_identity_id UUID REFERENCES identities(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(120) NOT NULL DEFAULT '',
    company_size VARCHAR(120) NOT NULL DEFAULT '',
    location VARCHAR(255) NOT NULL DEFAULT '',
    website VARCHAR(512) NOT NULL DEFAULT '',
    avg_rating NUMERIC(3, 2) NOT NULL DEFAULT 0 CHECK (avg_rating BETWEEN 0 AND 5),
    review_count INTEGER NOT NULL DEFAULT 0 CHECK (review_count >= 0),
    avg_salary_usd INTEGER NOT NULL DEFAULT 0 CHECK (avg_salary_usd >= 0),
    open_jobs_count INTEGER NOT NULL DEFAULT 0 CHECK (open_jobs_count >= 0),
    hiring_now BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT NOT NULL DEFAULT '',
    tech_stack TEXT[] NOT NULL DEFAULT '{}',
    benefits TEXT[] NOT NULL DEFAULT '{}',
    open_jobs JSONB NOT NULL DEFAULT '[]'::jsonb,
    alumni JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_company_profiles_owner ON company_profiles (owner_identity_id);

CREATE TABLE IF NOT EXISTS company_reviews (
    id VARCHAR(64) PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
    author_identity_id UUID REFERENCES identities(id) ON DELETE SET NULL,
    author_role VARCHAR(255) NOT NULL DEFAULT '',
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title VARCHAR(300) NOT NULL,
    comment TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_company_reviews_company_created ON company_reviews (company_id, created_at DESC);

CREATE TABLE IF NOT EXISTS company_interview_questions (
    id VARCHAR(64) PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
    author_identity_id UUID REFERENCES identities(id) ON DELETE SET NULL,
    role_title VARCHAR(255) NOT NULL DEFAULT '',
    difficulty VARCHAR(32) NOT NULL DEFAULT 'Hard',
    question_text TEXT NOT NULL CHECK (length(question_text) > 0),
    sample_answer_hint TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_company_iq_company_created ON company_interview_questions (company_id, created_at DESC);

CREATE TABLE IF NOT EXISTS career_posting_meta (
    career_posting_id UUID PRIMARY KEY REFERENCES career_postings(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL DEFAULT 'Belooga',
    company_logo_url TEXT,
    company_website TEXT,
    salary_range VARCHAR(100) NOT NULL DEFAULT 'Negotiable',
    skills TEXT[] NOT NULL DEFAULT '{}',
    is_partner BOOLEAN NOT NULL DEFAULT FALSE,
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
    posted_by_identity_id UUID REFERENCES identities(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_career_posting_meta_poster ON career_posting_meta (posted_by_identity_id);

CREATE TABLE IF NOT EXISTS blog_posts (
    id VARCHAR(64) PRIMARY KEY,
    slug VARCHAR(160) UNIQUE NOT NULL,
    author_identity_id UUID REFERENCES identities(id) ON DELETE SET NULL,
    author VARCHAR(255) NOT NULL,
    author_username VARCHAR(100) NOT NULL,
    author_headline VARCHAR(255) NOT NULL DEFAULT '',
    author_avatar VARCHAR(512) NOT NULL DEFAULT '/images/avatar.jpg',
    title VARCHAR(300) NOT NULL,
    excerpt TEXT NOT NULL DEFAULT '',
    date_label VARCHAR(64) NOT NULL DEFAULT '',
    image VARCHAR(512) NOT NULL DEFAULT '/images/blog/blog-1.jpg',
    post_type VARCHAR(16) NOT NULL DEFAULT 'USER_STATUS' CHECK (post_type IN ('EDITORIAL', 'USER_STATUS')),
    category VARCHAR(120) NOT NULL DEFAULT 'Community Feed',
    tags TEXT[] NOT NULL DEFAULT '{}',
    ats_score_badge INTEGER CHECK (ats_score_badge BETWEEN 0 AND 100),
    read_time_minutes INTEGER NOT NULL DEFAULT 2 CHECK (read_time_minutes > 0),
    likes_count INTEGER NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
    content TEXT[] NOT NULL DEFAULT '{}',
    key_takeaways TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_blog_posts_type_created ON blog_posts (post_type, created_at DESC);

CREATE TABLE IF NOT EXISTS blog_post_likes (
    post_id VARCHAR(64) NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, identity_id)
);

CREATE TABLE IF NOT EXISTS blog_post_comments (
    id VARCHAR(64) PRIMARY KEY,
    post_id VARCHAR(64) NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    author_identity_id UUID REFERENCES identities(id) ON DELETE SET NULL,
    author_name VARCHAR(255) NOT NULL,
    author_username VARCHAR(100) NOT NULL,
    content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 2000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_blog_post_comments_post_created ON blog_post_comments (post_id, created_at);

CREATE TABLE IF NOT EXISTS user_posts (
    id VARCHAR(64) PRIMARY KEY,
    author_identity_id UUID REFERENCES identities(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    title VARCHAR(300) NOT NULL,
    category VARCHAR(120) NOT NULL DEFAULT 'Chia sẻ kiến thức',
    body TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    attachment_link TEXT,
    likes_count INTEGER NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_posts_username_created ON user_posts (LOWER(username), created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_posts_created ON user_posts (created_at DESC);

CREATE TABLE IF NOT EXISTS user_post_likes (
    post_id VARCHAR(64) NOT NULL REFERENCES user_posts(id) ON DELETE CASCADE,
    identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, identity_id)
);

CREATE TABLE IF NOT EXISTS user_post_comments (
    id VARCHAR(64) PRIMARY KEY,
    post_id VARCHAR(64) NOT NULL REFERENCES user_posts(id) ON DELETE CASCADE,
    author_identity_id UUID REFERENCES identities(id) ON DELETE SET NULL,
    author_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 2000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_post_comments_post_created ON user_post_comments (post_id, created_at);

CREATE TABLE IF NOT EXISTS expert_applications (
    identity_id UUID PRIMARY KEY REFERENCES identities(id) ON DELETE CASCADE,
    expert_profile_id UUID REFERENCES expert_profiles(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    role_title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    years_experience INTEGER NOT NULL DEFAULT 0 CHECK (years_experience >= 0),
    category VARCHAR(64) NOT NULL DEFAULT 'backend',
    specialties TEXT[] NOT NULL DEFAULT '{}',
    turnaround_hours INTEGER NOT NULL DEFAULT 24 CHECK (turnaround_hours > 0),
    hourly_rate_vnd INTEGER NOT NULL DEFAULT 0 CHECK (hourly_rate_vnd >= 0),
    linkedin_url TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS career_goals (
    identity_id UUID PRIMARY KEY REFERENCES identities(id) ON DELETE CASCADE,
    target_role VARCHAR(255) NOT NULL,
    target_salary VARCHAR(100) NOT NULL,
    preferred_skills TEXT NOT NULL DEFAULT '',
    location VARCHAR(255) NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""


# Rows are read only when the JSON parses (PG16 pg_input_is_valid) and the CTE is MATERIALIZED so the
# filter runs before any ::jsonb cast. Scalars are read only when their JSON type matches, so a malformed
# legacy row degrades to defaults instead of aborting the migration.
def _src(prefix: str) -> str:
    return (
        "WITH src AS MATERIALIZED ("
        " SELECT id, name, created_at, message::jsonb AS m, split_part(name, ':', 2) AS k1, split_part(name, ':', 3) AS k2"
        f" FROM contact_inquiries WHERE name LIKE '{prefix}:%' AND pg_input_is_valid(message, 'jsonb')"
        " AND jsonb_typeof(message::jsonb) = 'object')"
    )


def _num(expr: str) -> str:
    return f"(CASE WHEN jsonb_typeof({expr}) = 'number' THEN ({expr} #>> '{{}}')::numeric::int END)"


def _arr(expr: str) -> str:
    return f"ARRAY(SELECT jsonb_array_elements_text(CASE WHEN jsonb_typeof({expr}) = 'array' THEN {expr} ELSE '[]'::jsonb END))"


def _jarr(expr: str) -> str:
    return f"(CASE WHEN jsonb_typeof({expr}) = 'array' THEN {expr} ELSE '[]'::jsonb END)"


def _bool(expr: str, default: str = "FALSE") -> str:
    return f"(CASE WHEN jsonb_typeof({expr}) = 'boolean' THEN ({expr} #>> '{{}}')::boolean ELSE {default} END)"


def _ts(text_expr: str, fallback: str) -> str:
    """'YYYY-MM-DD[ HH:MM]' legacy strings -> timestamptz (UTC), otherwise fallback."""
    return (
        f"(CASE WHEN {text_expr} ~ '^\\d{{4}}-\\d{{2}}-\\d{{2}} \\d{{2}}.\\d{{2}}' THEN (left({text_expr}, 16) || '+00')::timestamptz"
        f" WHEN {text_expr} ~ '^\\d{{4}}-\\d{{2}}-\\d{{2}}$' THEN ({text_expr})::date::timestamp AT TIME ZONE 'UTC' ELSE {fallback} END)"
    )


SLUG_RE = "'^[a-z0-9]+(-[a-z0-9]+)*$'"
STAGES = "('SHORTLISTED', 'PITCH_REVIEWED', 'INTERVIEW_INVITED', 'OFFER_SENT', 'HIRED')"

DATA_MIGRATIONS = [
    # Recruiter pipeline: RECRUITER_PIPE:{recruiter_uuid|default}:{username}; 'default' rows had no owner -> dropped.
    _src("RECRUITER_PIPE") + f"""
    INSERT INTO recruiter_pipeline_items (id, recruiter_identity_id, candidate_username, full_name, headline, target_role,
        stage, ats_score, years_experience, expected_salary, video_pitch_url, matched_skills, missing_skills,
        recruiter_rating, evaluation_notes, contact_unlocked, interview_datetime, created_at)
    SELECT src.id, i.id, src.m->>'username', COALESCE(src.m->>'full_name', src.m->>'username'), COALESCE(src.m->>'headline', ''),
        COALESCE(src.m->>'target_role', ''),
        CASE WHEN src.m->>'stage' IN {STAGES} THEN src.m->>'stage' ELSE 'SHORTLISTED' END,
        LEAST(GREATEST(COALESCE({_num("src.m->'ats_score'")}, 0), 0), 100),
        GREATEST(COALESCE({_num("src.m->'years_experience'")}, 0), 0),
        COALESCE(src.m->>'expected_salary', ''), COALESCE(src.m->>'video_pitch_url', ''),
        {_arr("src.m->'matched_skills'")}, {_arr("src.m->'missing_skills'")},
        LEAST(GREATEST(COALESCE({_num("src.m->'recruiter_rating'")}, 4), 1), 5),
        COALESCE(src.m->>'evaluation_notes', ''), {_bool("src.m->'contact_unlocked'")}, src.m->>'interview_datetime', src.created_at
    FROM src JOIN identities i ON i.id::text = src.k1
    WHERE COALESCE(src.m->>'username', '') <> ''
    ON CONFLICT DO NOTHING
    """,
    _src("REVERSE_BID") + f"""
    INSERT INTO reverse_bids (id, recruiter_identity_id, candidate_username, role, salary_usd, status, created_at)
    SELECT src.k1, NULL, COALESCE(src.m->>'candidate_username', src.m->>'username'), COALESCE(src.m->>'role', 'Staff Software Engineer'),
        COALESCE({_num("src.m->'salary_usd'")}, {_num("src.m->'offered_salary_usd'")}, {_num("src.m->'salary_offer_usd'")}),
        CASE WHEN src.m->>'status' IN ('SENT', 'ACCEPTED', 'DECLINED') THEN src.m->>'status' ELSE 'SENT' END, src.created_at
    FROM src
    WHERE COALESCE(src.m->>'candidate_username', src.m->>'username', '') <> ''
      AND COALESCE({_num("src.m->'salary_usd'")}, {_num("src.m->'offered_salary_usd'")}, {_num("src.m->'salary_offer_usd'")}, 0) > 0
    ON CONFLICT DO NOTHING
    """,
    _src("CV_ROAST") + f"""
    INSERT INTO cv_roasts (id, alias, target_role, summary, ai_roast, votes, created_at)
    SELECT src.k1, COALESCE(src.m->>'alias', 'Anonymous Candidate'), COALESCE(src.m->>'target_role', 'Senior Backend Engineer'),
        COALESCE(src.m->>'summary', ''), COALESCE(src.m->>'ai_roast', ''),
        GREATEST(COALESCE({_num("src.m->'votes'")}, 0), 0), src.created_at
    FROM src WHERE src.k1 <> ''
    ON CONFLICT DO NOTHING
    """,
    _src("SALARY_CRAWL") + f"""
    INSERT INTO salary_crawl_runs (bonus_samples, career_postings_scanned, crawled_at)
    SELECT GREATEST(COALESCE({_num("src.m->'bonus_samples'")}, 0), 0), GREATEST(COALESCE({_num("src.m->'career_postings_scanned'")}, 0), 0),
        {_ts("(src.m->>'last_crawled_at')", "src.created_at")}
    FROM src
    """,
    _src("COMPANY_PROFILE") + f"""
    INSERT INTO company_profiles (slug, name, industry, company_size, location, website, avg_rating, review_count,
        avg_salary_usd, open_jobs_count, hiring_now, description, tech_stack, benefits, open_jobs, alumni, created_at)
    SELECT LOWER(src.k1), COALESCE(src.m->>'name', src.k1), COALESCE(src.m->>'industry', ''), COALESCE(src.m->>'company_size', ''),
        COALESCE(src.m->>'location', ''), COALESCE(src.m->>'website', ''),
        LEAST(GREATEST(COALESCE((CASE WHEN jsonb_typeof(src.m->'avg_rating') = 'number' THEN (src.m->>'avg_rating')::numeric END), 0), 0), 5),
        GREATEST(COALESCE({_num("src.m->'review_count'")}, 0), 0), GREATEST(COALESCE({_num("src.m->'avg_salary_usd'")}, 0), 0),
        GREATEST(COALESCE({_num("src.m->'open_jobs_count'")}, 0), 0), {_bool("src.m->'hiring_now'", "TRUE")},
        COALESCE(src.m->>'description', ''), {_arr("src.m->'tech_stack'")}, {_arr("src.m->'benefits'")},
        {_jarr("src.m->'open_jobs'")}, {_jarr("src.m->'alumni'")}, src.created_at
    FROM src WHERE LOWER(src.k1) ~ {SLUG_RE}
    ON CONFLICT (slug) DO NOTHING
    """,
    _src("COMPANY_PROFILE") + f"""
    INSERT INTO company_reviews (id, company_id, author_role, rating, title, comment, created_at)
    SELECT COALESCE(r->>'id', 'rev-' || left(md5(src.id::text || ord::text), 8)), cp.id, COALESCE(r->>'author_role', ''),
        LEAST(GREATEST(COALESCE({_num("r->'rating'")}, 5), 1), 5), COALESCE(r->>'title', ''), COALESCE(r->>'comment', ''),
        {_ts("(r->>'created_at')", "src.created_at")}
    FROM src JOIN company_profiles cp ON cp.slug = LOWER(src.k1)
    CROSS JOIN LATERAL jsonb_array_elements({_jarr("src.m->'reviews'")}) WITH ORDINALITY AS t(r, ord)
    WHERE jsonb_typeof(r) = 'object'
    ON CONFLICT DO NOTHING
    """,
    _src("COMPANY_PROFILE") + f"""
    INSERT INTO company_interview_questions (id, company_id, role_title, difficulty, question_text, sample_answer_hint, created_at)
    SELECT COALESCE(q->>'id', 'iq-' || left(md5(src.id::text || ord::text), 8)), cp.id, COALESCE(q->>'role_title', ''),
        COALESCE(q->>'difficulty', 'Hard'), COALESCE(NULLIF(q->>'question_text', ''), q->>'question'),
        COALESCE(q->>'sample_answer_hint', ''), src.created_at
    FROM src JOIN company_profiles cp ON cp.slug = LOWER(src.k1)
    CROSS JOIN LATERAL jsonb_array_elements({_jarr("src.m->'interview_questions'")}) WITH ORDINALITY AS t(q, ord)
    WHERE jsonb_typeof(q) = 'object' AND COALESCE(NULLIF(q->>'question_text', ''), q->>'question', '') <> ''
    ON CONFLICT DO NOTHING
    """,
    _src("CAREER_META") + f"""
    INSERT INTO career_posting_meta (career_posting_id, company_name, company_logo_url, company_website, salary_range, skills,
        is_partner, is_system_role, posted_by_identity_id)
    SELECT cp.id, COALESCE(src.m->>'company_name', 'Belooga'), src.m->>'company_logo_url', src.m->>'company_website',
        COALESCE(src.m->>'salary_range', 'Negotiable'), {_arr("src.m->'skills'")},
        {_bool("src.m->'is_partner'")}, {_bool("src.m->'is_system_role'")}, pi.id
    FROM src JOIN career_postings cp ON cp.id::text = src.k1
    LEFT JOIN identities pi ON pi.id::text = src.m->>'posted_by_identity_id'
    ON CONFLICT DO NOTHING
    """,
    _src("BLOG_POST") + f"""
    INSERT INTO blog_posts (id, slug, author_identity_id, author, author_username, author_headline, author_avatar, title, excerpt,
        date_label, image, post_type, category, tags, ats_score_badge, read_time_minutes, likes_count, content, key_takeaways, created_at)
    SELECT COALESCE(src.m->>'id', 'post-' || left(md5(src.k1), 8)), COALESCE(src.m->>'slug', src.k1), p.identity_id,
        COALESCE(src.m->>'author', src.m->>'author_username', 'community_member'), COALESCE(src.m->>'author_username', 'community_member'),
        COALESCE(src.m->>'author_headline', ''), COALESCE(src.m->>'author_avatar', '/images/avatar.jpg'),
        COALESCE(src.m->>'title', ''), COALESCE(src.m->>'excerpt', ''), COALESCE(src.m->>'date', ''),
        COALESCE(src.m->>'image', '/images/blog/blog-1.jpg'),
        CASE WHEN src.m->>'post_type' = 'EDITORIAL' THEN 'EDITORIAL' ELSE 'USER_STATUS' END,
        COALESCE(src.m->>'category', 'Community Feed'), {_arr("src.m->'tags'")},
        (CASE WHEN {_num("src.m->'ats_score_badge'")} BETWEEN 0 AND 100 THEN {_num("src.m->'ats_score_badge'")} END),
        GREATEST(COALESCE({_num("src.m->'read_time_minutes'")}, 2), 1), GREATEST(COALESCE({_num("src.m->'likes_count'")}, 0), 0),
        {_arr("src.m->'content'")}, {_arr("src.m->'key_takeaways'")}, src.created_at
    FROM src LEFT JOIN candidate_profiles p ON LOWER(p.username) = LOWER(src.m->>'author_username')
    ON CONFLICT DO NOTHING
    """,
    _src("BLOG_POST") + f"""
    INSERT INTO blog_post_comments (id, post_id, author_identity_id, author_name, author_username, content, created_at)
    SELECT COALESCE(c->>'id', 'cm-' || left(md5(src.id::text || ord::text), 8)), bp.id, p.identity_id,
        COALESCE(c->>'author_name', c->>'author_username', 'community_member'), COALESCE(c->>'author_username', c->>'author_name', 'community_member'),
        c->>'content', src.created_at
    FROM src JOIN blog_posts bp ON bp.slug = COALESCE(src.m->>'slug', src.k1)
    CROSS JOIN LATERAL jsonb_array_elements({_jarr("src.m->'comments'")}) WITH ORDINALITY AS t(c, ord)
    LEFT JOIN candidate_profiles p ON LOWER(p.username) = LOWER(c->>'author_username')
    WHERE jsonb_typeof(c) = 'object' AND length(COALESCE(c->>'content', '')) BETWEEN 1 AND 2000
    ON CONFLICT DO NOTHING
    """,
    _src("BLOG_POST") + f"""
    INSERT INTO blog_post_likes (post_id, identity_id)
    SELECT bp.id, p.identity_id
    FROM src JOIN blog_posts bp ON bp.slug = COALESCE(src.m->>'slug', src.k1)
    CROSS JOIN LATERAL jsonb_array_elements_text({_jarr("src.m->'liked_by'")}) AS u(uname)
    JOIN candidate_profiles p ON LOWER(p.username) = LOWER(u.uname)
    WHERE p.identity_id IS NOT NULL
    ON CONFLICT DO NOTHING
    """,
    _src("USER_POST") + f"""
    INSERT INTO user_posts (id, author_identity_id, username, author_name, title, category, body, tags, attachment_link, likes_count, created_at)
    SELECT COALESCE(src.m->>'id', src.k1), p.identity_id, src.m->>'username', COALESCE(src.m->>'author_name', src.m->>'username'),
        COALESCE(src.m->>'title', ''), COALESCE(src.m->>'category', 'Chia sẻ kiến thức'), COALESCE(src.m->>'body', ''),
        {_arr("src.m->'tags'")}, src.m->>'attachment_link', GREATEST(COALESCE({_num("src.m->'likes_count'")}, 0), 0),
        {_ts("(src.m->>'created_at')", "src.created_at")}
    FROM src LEFT JOIN candidate_profiles p ON LOWER(p.username) = LOWER(src.m->>'username')
    WHERE COALESCE(src.m->>'username', '') <> ''
    ON CONFLICT DO NOTHING
    """,
    _src("USER_POST") + f"""
    INSERT INTO user_post_comments (id, post_id, author_identity_id, author_name, content, created_at)
    SELECT COALESCE(c->>'id', 'uc-' || left(md5(src.id::text || ord::text), 8)), up.id, p.identity_id,
        COALESCE(c->>'author_name', 'community_member'), c->>'content', src.created_at
    FROM src JOIN user_posts up ON up.id = COALESCE(src.m->>'id', src.k1)
    CROSS JOIN LATERAL jsonb_array_elements({_jarr("src.m->'comments'")}) WITH ORDINALITY AS t(c, ord)
    LEFT JOIN candidate_profiles p ON LOWER(p.username) = LOWER(c->>'author_name')
    WHERE jsonb_typeof(c) = 'object' AND length(COALESCE(c->>'content', '')) BETWEEN 1 AND 2000
    ON CONFLICT DO NOTHING
    """,
    # EXPERT_APP:{identity_uuid|default}; 'default' (anonymous) rows had no owner -> dropped.
    _src("EXPERT_APP") + f"""
    INSERT INTO expert_applications (identity_id, expert_profile_id, full_name, role_title, company_name, years_experience, category,
        specialties, turnaround_hours, hourly_rate_vnd, linkedin_url, bio)
    SELECT i.id, ep.id, COALESCE(src.m->>'full_name', ''), COALESCE(src.m->>'role_title', ''), COALESCE(src.m->>'company_name', ''),
        GREATEST(COALESCE({_num("src.m->'years_experience'")}, 0), 0), COALESCE(src.m->>'category', 'backend'),
        {_arr("src.m->'specialties'")}, GREATEST(COALESCE({_num("src.m->'turnaround_hours'")}, 24), 1),
        GREATEST(COALESCE({_num("src.m->'hourly_rate_vnd'")}, 0), 0), COALESCE(src.m->>'linkedin_url', ''), COALESCE(src.m->>'bio', '')
    FROM src JOIN identities i ON i.id::text = src.k1
    LEFT JOIN expert_profiles ep ON ep.id::text = src.m->>'id'
    ON CONFLICT DO NOTHING
    """,
    # CAREER_GOAL:{identity_uuid|anon}; anonymous rows dropped.
    _src("CAREER_GOAL") + """
    INSERT INTO career_goals (identity_id, target_role, target_salary, preferred_skills, location)
    SELECT i.id, COALESCE(src.m->>'target_role', ''), COALESCE(src.m->>'target_salary', ''),
        COALESCE(src.m->>'preferred_skills', ''), COALESCE(src.m->>'location', '')
    FROM src JOIN identities i ON i.id::text = src.k1
    ON CONFLICT DO NOTHING
    """,
]

KV_PREFIXES = (
    "RECRUITER_PIPE", "REVERSE_BID", "CV_ROAST", "SALARY_CRAWL", "COMPANY_PROFILE",
    "CAREER_META", "BLOG_POST", "USER_POST", "EXPERT_APP", "CAREER_GOAL",
)

NEW_TABLES = (
    "career_goals", "expert_applications", "user_post_comments", "user_post_likes", "user_posts",
    "blog_post_comments", "blog_post_likes", "blog_posts", "career_posting_meta", "company_interview_questions",
    "company_reviews", "company_profiles", "salary_crawl_runs", "cv_roast_votes", "cv_roasts", "reverse_bids",
    "recruiter_pipeline_items",
)


def upgrade() -> None:
    if not revision and down_revision is None and branch_labels is None and depends_on is None:
        return
    for stmt in DDL.split(";"):  # asyncpg prepares one statement per execute
        if stmt.strip():
            op.execute(stmt)
    for stmt in DATA_MIGRATIONS:
        op.execute(stmt)
    like_any = ", ".join(f"'{p}:%'" for p in KV_PREFIXES)
    op.execute(f"DELETE FROM contact_inquiries WHERE name LIKE ANY (ARRAY[{like_any}])")


def downgrade() -> None:
    # Lossy by design: rows are not written back into contact_inquiries.
    for table in NEW_TABLES:
        op.execute(f"DROP TABLE IF EXISTS {table} CASCADE")
