#!/usr/bin/env python3
"""
Belooga Hermetic Seed Script
Populates the database idempotently with test candidates, admin user, job experiences,
education, and verified skills/languages/interests.
"""

import sys
import os
import asyncio
import uuid
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from app.core.security import get_password_hash

DB_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://belooga:belooga_secret_password@localhost:5433/belooga_db"
)


async def seed(db_url: str):
    print(f"[*] Seeding database at {db_url}...")
    engine = create_async_engine(db_url, echo=False)

    async with engine.begin() as conn:
        await conn.execute(
            text("""
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
                )
            """)
        )
        await conn.execute(
            text("""
                CREATE TABLE IF NOT EXISTS notification_preferences (
                    identity_id UUID PRIMARY KEY REFERENCES identities(id) ON DELETE CASCADE,
                    email_security_alerts BOOLEAN NOT NULL DEFAULT TRUE,
                    email_order_updates BOOLEAN NOT NULL DEFAULT TRUE,
                    email_career_matches BOOLEAN NOT NULL DEFAULT TRUE,
                    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            """)
        )
        await conn.execute(
            text("""
                CREATE TABLE IF NOT EXISTS candidate_bookmarks (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    recruiter_identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
                    candidate_profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
                    note TEXT,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    UNIQUE(recruiter_identity_id, candidate_profile_id)
                )
            """)
        )
        for idx_sql in (
            "CREATE INDEX IF NOT EXISTS idx_notifications_identity_unread_created ON notifications (identity_id, is_read, created_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_cv_review_orders_candidate_created ON cv_review_orders (candidate_identity_id, created_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_cv_review_orders_status_created ON cv_review_orders (order_status, created_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_job_tracker_candidate_created ON candidate_job_applications_tracker (candidate_identity_id, created_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_resume_jd_matches_candidate_created ON resume_jd_matches (candidate_identity_id, created_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_candidate_bookmarks_recruiter_created ON candidate_bookmarks (recruiter_identity_id, created_at DESC)",
        ):
            await conn.execute(text(idx_sql))
        await conn.execute(text("DELETE FROM identities WHERE email LIKE '%@test.com'"))
        # 1. Admin Identity
        admin_pass_hash = get_password_hash("AdminSecret123!")
        res = await conn.execute(
            text("""
                INSERT INTO identities (email, password_hash, role, status)
                VALUES ('admin@belooga.com', :pw, 'admin', 'active')
                ON CONFLICT (email) DO UPDATE SET role = 'admin', password_hash = :pw
                RETURNING id
            """),
            {"pw": admin_pass_hash}
        )
        admin_id = res.scalar()
        print(f"  [+] Admin user seeded: admin@belooga.com (ID: {admin_id})")

        # 2. Main Candidate: alexnguyen
        alex_pass_hash = get_password_hash("SecurePassword123!")
        res = await conn.execute(
            text("""
                INSERT INTO identities (email, password_hash, role, status)
                VALUES ('alex@belooga.com', :pw, 'candidate', 'active')
                ON CONFLICT (email) DO UPDATE SET role = 'candidate', password_hash = :pw
                RETURNING id
            """),
            {"pw": alex_pass_hash}
        )
        alex_id = res.scalar()

        res_prof = await conn.execute(
            text("""
                INSERT INTO candidate_profiles (
                    identity_id, username, first_name, last_name, headline, bio,
                    location, phone, employment_status, seeking_status,
                    avatar_url, video_pitch_url, is_hidden, is_fresh
                )
                VALUES (
                    :id, 'alexnguyen', 'Alex', 'Nguyen',
                    'Staff Full-Stack Engineer',
                    'Building scalable distributed systems, real-time WebRTC, and sleek Next.js interfaces.',
                    'San Francisco, CA', '+1 (555) 019-2834', 'Full-Time', 'Actively Looking',
                    '/images/avatar.jpg', '/uploads/videos/alexnguyen_pitch.webm',
                    FALSE, FALSE
                )
                ON CONFLICT (username) DO UPDATE SET
                    identity_id = :id,
                    first_name = 'Alex',
                    last_name = 'Nguyen',
                    headline = 'Staff Full-Stack Engineer',
                    bio = 'Building scalable distributed systems, real-time WebRTC, and sleek Next.js interfaces.',
                    location = 'San Francisco, CA',
                    phone = '+1 (555) 019-2834',
                    is_hidden = FALSE
                RETURNING id
            """),
            {"id": alex_id}
        )
        alex_prof_id = res_prof.scalar()
        print(f"  [+] Candidate alexnguyen seeded (Profile ID: {alex_prof_id})")

        # 3. Seed Skills & Profile Skills
        skills = ["React", "FastAPI", "PostgreSQL", "TypeScript", "Docker", "Product Design"]
        for s in skills:
            s_id = uuid.uuid4()
            await conn.execute(
                text("INSERT INTO skills (id, name) VALUES (:id, :name) ON CONFLICT (name) DO NOTHING"),
                {"id": s_id, "name": s}
            )
            # Link to alexnguyen
            await conn.execute(
                text("""
                    INSERT INTO profile_skills (profile_id, skill_id)
                    SELECT :pid, id FROM skills WHERE name = :name
                    ON CONFLICT DO NOTHING
                """),
                {"pid": alex_prof_id, "name": s}
            )
        print("  [+] Skills seeded and linked to alexnguyen")

        # 4. Seed Job Experiences
        await conn.execute(
            text("DELETE FROM job_experiences WHERE profile_id = :pid"),
            {"pid": alex_prof_id}
        )
        await conn.execute(
            text("""
                INSERT INTO job_experiences (
                    id, profile_id, title, company_name, from_date_month, from_date_year,
                    currently_work_here, to_date_month, to_date_year, description, display_order
                )
                VALUES 
                (
                    gen_random_uuid(), :pid, 'Senior Product Designer', 'Stripe Inc.',
                    '01', 2024, TRUE, NULL, NULL,
                    'Leading product design systems and design engineering.', 0
                ),
                (
                    gen_random_uuid(), :pid, 'Staff Full-Stack Engineer', 'Belooga Tech Inc.',
                    '06', 2021, FALSE, '12', 2023,
                    'Architecting clean async services and responsive Next.js web application.', 1
                )
            """),
            {"pid": alex_prof_id}
        )
        print("  [+] Job experiences seeded for alexnguyen")

        # 5. Seed Education Experiences
        await conn.execute(
            text("DELETE FROM education_experiences WHERE profile_id = :pid"),
            {"pid": alex_prof_id}
        )
        await conn.execute(
            text("""
                INSERT INTO education_experiences (
                    id, profile_id, school_name, degree_name, gpa, from_date_year, to_date_year, display_order
                )
                VALUES (
                    gen_random_uuid(), :pid, 'Stanford University', 'B.S. in Computer Science', 3.9, 2017, 2021, 0
                )
            """),
            {"pid": alex_prof_id}
        )
        print("  [+] Education seeded for alexnguyen")

        # 6. Seed Languages & Interests
        langs = [("English", "Native"), ("Vietnamese", "Fluent")]
        for l_name, prof in langs:
            await conn.execute(
                text("INSERT INTO languages (name) VALUES (:name) ON CONFLICT (name) DO NOTHING"),
                {"name": l_name}
            )
            await conn.execute(
                text("""
                    INSERT INTO profile_languages (profile_id, language_id, proficiency)
                    SELECT :pid, id, :prof FROM languages WHERE name = :name
                    ON CONFLICT DO NOTHING
                """),
                {"pid": alex_prof_id, "name": l_name, "prof": prof}
            )

        interests = ["Distributed Systems", "WebRTC", "High-Concurrency Backend", "AI Engineering"]
        for int_name in interests:
            await conn.execute(
                text("INSERT INTO interests (name) VALUES (:name) ON CONFLICT (name) DO NOTHING"),
                {"name": int_name}
            )
            await conn.execute(
                text("""
                    INSERT INTO profile_interests (profile_id, interest_id)
                    SELECT :pid, id FROM interests WHERE name = :name
                    ON CONFLICT DO NOTHING
                """),
                {"pid": alex_prof_id, "name": int_name}
            )
        print("  [+] Languages and interests seeded")

        # 7. Seed Hidden Candidate: hidden_jane
        jane_pass_hash = get_password_hash("JaneSecret123!")
        res = await conn.execute(
            text("""
                INSERT INTO identities (email, password_hash, role, status)
                VALUES ('jane@belooga.com', :pw, 'candidate', 'active')
                ON CONFLICT (email) DO UPDATE SET role = 'candidate', password_hash = :pw
                RETURNING id
            """),
            {"pw": jane_pass_hash}
        )
        jane_id = res.scalar()
        await conn.execute(
            text("""
                INSERT INTO candidate_profiles (
                    identity_id, username, first_name, last_name, headline, bio,
                    location, phone, employment_status, seeking_status,
                    avatar_url, is_hidden, is_fresh
                )
                VALUES (
                    :id, 'hidden_jane', 'Jane', 'Doe',
                    'Private Stealth Founder',
                    'Confidential profile for privacy verification testing.',
                    'New York, NY', '+1 (555) 999-8888', 'Full-Time', 'Hidden',
                    '/images/avatar.jpg', TRUE, FALSE
                )
                ON CONFLICT (username) DO UPDATE SET
                    identity_id = :id,
                    is_hidden = TRUE,
                    phone = '+1 (555) 999-8888'
            """),
            {"id": jane_id}
        )
        print("  [+] Hidden candidate 'hidden_jane' seeded (is_hidden=TRUE)")

        # 8. Seed Master Catalogs (catalog_companies, catalog_schools, catalog_locations)
        for c_name, c_logo in [
            ("Stripe Inc.", "/images/logo.svg"),
            ("Airbnb", "/images/logo.svg"),
            ("Google", "/images/logo.svg"),
            ("Meta", "/images/logo.svg"),
            ("Apple", "/images/logo.svg"),
            ("Belooga", "/images/logo-big.png"),
        ]:
            await conn.execute(
                text("INSERT INTO catalog_companies (name, logo_url) VALUES (:n, :l) ON CONFLICT (name) DO NOTHING"),
                {"n": c_name, "l": c_logo},
            )
        for s_name in ["Stanford University", "MIT", "UC Berkeley", "Harvard University", "Carnegie Mellon University"]:
            await conn.execute(
                text("INSERT INTO catalog_schools (name, logo_url) VALUES (:n, '/images/logo.svg') ON CONFLICT (name) DO NOTHING"),
                {"n": s_name},
            )
        print("  [+] Master catalogs (companies & schools) seeded")


    print("[*] Database seeded successfully!")


if __name__ == "__main__":
    db_target = sys.argv[1] if len(sys.argv) > 1 else DB_URL
    asyncio.run(seed(db_target))
