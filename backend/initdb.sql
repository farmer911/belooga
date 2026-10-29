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
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_visible_created
    ON candidate_profiles (created_at DESC, id DESC)
    WHERE is_hidden = FALSE;
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_autocomplete_trgm
    ON candidate_profiles
    USING gin ((coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' || coalesce(username, '') || ' ' || coalesce(headline, '')) gin_trgm_ops)
    WHERE is_hidden = FALSE;

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

-- 23. Domain 12: Enterprise Notifications & Email Deep-Link Preferences
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    deep_link VARCHAR(512) NOT NULL DEFAULT '/',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    send_email BOOLEAN NOT NULL DEFAULT FALSE,
    email_sent BOOLEAN NOT NULL DEFAULT FALSE,
    email_subject VARCHAR(255),
    email_deeplink_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_identity_unread
    ON notifications(identity_id, is_read, created_at DESC);

CREATE TABLE IF NOT EXISTS notification_preferences (
    identity_id UUID PRIMARY KEY REFERENCES identities(id) ON DELETE CASCADE,
    email_security_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    email_order_updates BOOLEAN NOT NULL DEFAULT TRUE,
    email_career_matches BOOLEAN NOT NULL DEFAULT TRUE,
    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 24. Domain 6: Recruiter Candidate Shortlist Bookmarks (BEL-145)
CREATE TABLE IF NOT EXISTS candidate_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recruiter_identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
    candidate_profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(recruiter_identity_id, candidate_profile_id)
);
CREATE INDEX IF NOT EXISTS idx_candidate_bookmarks_recruiter_created
    ON candidate_bookmarks(recruiter_identity_id, created_at DESC);


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
