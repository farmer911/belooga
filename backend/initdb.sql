-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- 1. identities
CREATE TABLE IF NOT EXISTS identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(32) NOT NULL DEFAULT 'candidate',
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_identities_email ON identities(email);

-- 2. refresh_sessions
CREATE TABLE IF NOT EXISTS refresh_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
    family_id UUID NOT NULL,
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(45),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refresh_sessions_lookup ON refresh_sessions(token_hash, revoked_at);
CREATE INDEX IF NOT EXISTS idx_refresh_sessions_family ON refresh_sessions(family_id);

-- 3. social_accounts
CREATE TABLE IF NOT EXISTS social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
    provider VARCHAR(32) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_social_provider UNIQUE (provider, provider_user_id)
);

-- 4. password_reset_tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ
);

-- 5. email_verification_tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

-- 6. candidate_profiles
CREATE TABLE IF NOT EXISTS candidate_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identity_id UUID UNIQUE NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
    username VARCHAR(100) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    headline VARCHAR(255),
    bio TEXT,
    location VARCHAR(255),
    phone VARCHAR(50),
    employment_status VARCHAR(64),
    seeking_status VARCHAR(64),
    avatar_url TEXT,
    video_pitch_url TEXT,
    resume_url TEXT,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    is_fresh BOOLEAN NOT NULL DEFAULT TRUE,
    submitted BOOLEAN NOT NULL DEFAULT FALSE,
    search_vector TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(headline, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(bio, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(location, '')), 'D')
    ) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_username ON candidate_profiles(username);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_search_vector ON candidate_profiles USING GIN(search_vector);

-- 7. profile_media
CREATE TABLE IF NOT EXISTS profile_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    category VARCHAR(64) NOT NULL,
    file_url TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_profile_media_category UNIQUE (profile_id, category)
);

-- 8. job_experiences
CREATE TABLE IF NOT EXISTS job_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    company_id UUID,
    from_date_month INT,
    from_date_year INT,
    currently_work_here BOOLEAN NOT NULL DEFAULT FALSE,
    to_date_month INT,
    to_date_year INT,
    description TEXT,
    logo_url TEXT,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_job_exp_order ON job_experiences(profile_id, display_order ASC);

-- 9. education_experiences
CREATE TABLE IF NOT EXISTS education_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    school_name VARCHAR(255) NOT NULL,
    school_id UUID,
    degree_name VARCHAR(255),
    gpa VARCHAR(50),
    from_date_month INT,
    from_date_year INT,
    currently_work_here BOOLEAN NOT NULL DEFAULT FALSE,
    to_date_month INT,
    to_date_year INT,
    description TEXT,
    logo_url TEXT,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_edu_exp_order ON education_experiences(profile_id, display_order ASC);

-- 10. award_certifications
CREATE TABLE IF NOT EXISTS award_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    location_name VARCHAR(255),
    from_date_month INT,
    from_date_year INT,
    currently_work_here BOOLEAN NOT NULL DEFAULT FALSE,
    to_date_month INT,
    to_date_year INT,
    description TEXT,
    logo_url TEXT,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_award_cert_order ON award_certifications(profile_id, display_order ASC);

-- 11. skills & profile_skills
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_skills_name_trgm ON skills USING gin (name gin_trgm_ops);

CREATE TABLE IF NOT EXISTS profile_skills (
    profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (profile_id, skill_id)
);

-- 12. languages & profile_languages
CREATE TABLE IF NOT EXISTS languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS profile_languages (
    profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    proficiency VARCHAR(50) DEFAULT 'Fluent',
    PRIMARY KEY (profile_id, language_id)
);

-- 13. interests & profile_interests
CREATE TABLE IF NOT EXISTS interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS profile_interests (
    profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    interest_id UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
    PRIMARY KEY (profile_id, interest_id)
);

-- 14. catalog_companies & catalog_schools
CREATE TABLE IF NOT EXISTS catalog_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    logo_url TEXT
);
CREATE INDEX IF NOT EXISTS idx_companies_trgm ON catalog_companies USING gin (name gin_trgm_ops);

CREATE TABLE IF NOT EXISTS catalog_schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    logo_url TEXT
);
CREATE INDEX IF NOT EXISTS idx_schools_trgm ON catalog_schools USING gin (name gin_trgm_ops);

-- 15. catalog_locations
CREATE TABLE IF NOT EXISTS catalog_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    state VARCHAR(100),
    country VARCHAR(100) NOT NULL
);

-- 16. video_archives
CREATE TABLE IF NOT EXISTS video_archives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    opentok_session_id VARCHAR(255) NOT NULL,
    opentok_archive_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'started',
    video_url TEXT,
    duration_seconds INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. contact_inquiries
CREATE TABLE IF NOT EXISTS contact_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. profile_reports
CREATE TABLE IF NOT EXISTS profile_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reported_profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    reporter_identity_id UUID REFERENCES identities(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. career_postings & career_applications
CREATE TABLE IF NOT EXISTS career_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS career_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES career_postings(id) ON DELETE CASCADE,
    applicant_name VARCHAR(255) NOT NULL,
    applicant_email VARCHAR(255) NOT NULL,
    resume_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. Domain 9: Expert CV Review & Monetization
CREATE TABLE IF NOT EXISTS expert_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identity_id UUID REFERENCES identities(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    headline VARCHAR(255) NOT NULL,
    bio TEXT NOT NULL,
    avatar_url VARCHAR(512),
    company VARCHAR(255) NOT NULL,
    role_category VARCHAR(100) NOT NULL,
    years_of_experience INTEGER NOT NULL DEFAULT 5,
    rating NUMERIC(3, 2) NOT NULL DEFAULT 5.0,
    total_reviews_count INTEGER NOT NULL DEFAULT 0,
    turn_around_days INTEGER NOT NULL DEFAULT 2,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cv_review_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    turn_around_hours INTEGER NOT NULL DEFAULT 48,
    is_popular BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cv_review_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
    expert_id UUID REFERENCES expert_profiles(id) ON DELETE SET NULL,
    package_id UUID NOT NULL REFERENCES cv_review_packages(id) ON DELETE RESTRICT,
    resume_url VARCHAR(512) NOT NULL,
    target_role VARCHAR(255) NOT NULL,
    target_companies VARCHAR(255),
    candidate_notes TEXT,
    order_status VARCHAR(50) NOT NULL DEFAULT 'pending_payment',
    amount_paid_cents INTEGER NOT NULL,
    payment_reference VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cv_review_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID UNIQUE NOT NULL REFERENCES cv_review_orders(id) ON DELETE CASCADE,
    expert_id UUID NOT NULL REFERENCES expert_profiles(id) ON DELETE CASCADE,
    score_overall INTEGER NOT NULL,
    score_ats_compatibility INTEGER NOT NULL,
    score_impact_action_verbs INTEGER NOT NULL,
    score_structure_formatting INTEGER NOT NULL,
    summary_verdict TEXT NOT NULL,
    strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
    improvements JSONB NOT NULL DEFAULT '[]'::jsonb,
    annotated_cv_url VARCHAR(512),
    video_feedback_url VARCHAR(512),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. Domain 10: ATS Diagnostics & JD Matching Engine
CREATE TABLE IF NOT EXISTS job_descriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255),
    job_title VARCHAR(255) NOT NULL,
    raw_text TEXT NOT NULL,
    skills_extracted JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resume_jd_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_identity_id UUID REFERENCES identities(id) ON DELETE CASCADE,
    job_description_id UUID NOT NULL REFERENCES job_descriptions(id) ON DELETE CASCADE,
    ats_score INTEGER NOT NULL,
    matched_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    missing_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    star_analysis JSONB NOT NULL DEFAULT '[]'::jsonb,
    parse_warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. Domain 11: Candidate Job Applications Tracker (Kanban Board)
CREATE TABLE IF NOT EXISTS candidate_job_applications_tracker (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_identity_id UUID REFERENCES identities(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    position_title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'TARGETING',
    expected_salary VARCHAR(100),
    match_score INTEGER DEFAULT 0,
    interview_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
