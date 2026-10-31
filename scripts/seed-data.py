#!/usr/bin/env python3
"""
Belooga Hermetic Seed Script
Populates the database idempotently with test candidates, admin user, job experiences,
education, and verified skills/languages/interests.
"""

import sys
import os
import asyncio
import json
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


# --- Demo content (formerly hard-coded seed arrays mixed into API results) ---
SEED_COMPANIES = [{'slug': 'vng-cloud',
  'name': 'VNG Cloud & AI Platform',
  'industry': 'AI / Cloud',
  'company_size': '500-1000 nhân sự',
  'location': 'Ho Chi Minh',
  'website': 'https://vngcloud.vn',
  'avg_rating': 4.8,
  'review_count': 42,
  'avg_salary_usd': 2800,
  'open_jobs_count': 6,
  'hiring_now': True,
  'description': 'Hạ tầng đám mây và nền tảng AI/GPU quy mô lớn phục vụ hàng chục triệu người dùng Đông Nam Á.',
  'tech_stack': ['Golang', 'Kubernetes', 'Python', 'PostgreSQL', 'React'],
  'benefits': ['Lương tháng 13 + Thưởng hiệu suất 3–6 tháng', 'Bảo hiểm sức khỏe cao cấp PVI'],
  'open_jobs': [{'id': 'vng-job-1',
                 'title': 'Principal Golang & Distributed Systems Engineer',
                 'salary_range': '$2,800 - $3,800',
                 'work_mode': 'Hybrid (HCMC)',
                 'skills': ['Golang', 'Kubernetes', 'PostgreSQL']}],
  'reviews': [{'id': 'rev-1',
               'author_role': 'Senior Backend Engineer',
               'rating': 5,
               'title': 'Môi trường kỹ thuật chiều sâu, bài toán tải lớn',
               'comment': 'Hệ thống microservices Golang chuẩn mực.',
               'created_at': '2026-10-15'}],
  'alumni': [{'username': 'phucnguyen',
              'full_name': 'Nguyễn Minh Phúc',
              'role': 'Principal Architect',
              'verified_expert': True}]},
 {'slug': 'momo-fintech',
  'name': 'M_Service (MoMo Fintech SuperApp)',
  'industry': 'Fintech',
  'company_size': '1000+ nhân sự',
  'location': 'Ho Chi Minh / Hybrid',
  'website': 'https://momo.vn',
  'avg_rating': 4.7,
  'review_count': 68,
  'avg_salary_usd': 3100,
  'open_jobs_count': 9,
  'hiring_now': True,
  'description': 'Siêu ứng dụng tài chính số hàng đầu Việt Nam xử lý hàng chục triệu giao dịch thời gian thực mỗi ngày.',
  'tech_stack': ['Golang', 'Python', 'FastAPI', 'React', 'Kafka'],
  'benefits': ['ESOP cho vị trí Senior/Lead', 'Hybrid làm việc linh hoạt'],
  'open_jobs': [{'id': 'momo-job-1',
                 'title': 'Staff Payment Core & Ledger Architect',
                 'salary_range': '$3,000 - $4,200',
                 'work_mode': 'Hybrid',
                 'skills': ['Golang', 'PostgreSQL', 'Kafka']}],
  'reviews': [{'id': 'rev-2',
               'author_role': 'Tech Lead Payment',
               'rating': 5,
               'title': 'Bài toán Fintech chuẩn ACID & High Availability',
               'comment': 'Lương thưởng cạnh tranh top thị trường.',
               'created_at': '2026-10-18'}],
  'alumni': [{'username': 'maivo', 'full_name': 'Võ Thị Mai', 'role': 'Staff Full-Stack Lead', 'verified_expert': True}]},
 {'slug': 'shopee-vn',
  'name': 'Shopee & SeaMoney Engineering VN',
  'industry': 'E-commerce',
  'company_size': '1000+ nhân sự',
  'location': 'Ho Chi Minh / Ha Noi',
  'website': 'https://careers.shopee.vn',
  'avg_rating': 4.6,
  'review_count': 54,
  'avg_salary_usd': 2950,
  'open_jobs_count': 5,
  'hiring_now': True,
  'description': 'Trung tâm R&D thương mại điện tử và thanh toán số quy mô khu vực châu Á.',
  'tech_stack': ['Golang', 'React', 'TypeScript', 'Kubernetes', 'PostgreSQL'],
  'benefits': ['15 ngày phép năm', 'Phụ cấp ăn trưa & thiết bị MacBook Pro M4'],
  'open_jobs': [{'id': 'shopee-job-1',
                 'title': 'Senior High-Concurrency Backend Engineer',
                 'salary_range': '$2,600 - $3,600',
                 'work_mode': 'Hybrid',
                 'skills': ['Golang', 'Redis', 'PostgreSQL']}],
  'reviews': [{'id': 'rev-3',
               'author_role': 'Senior Software Engineer',
               'rating': 5,
               'title': 'Quy trình code review & kiến trúc rất bài bản',
               'comment': 'Học được rất nhiều về distributed caching.',
               'created_at': '2026-10-12'}],
  'alumni': [{'username': 'phucnguyen', 'full_name': 'Nguyễn Minh Phúc', 'role': 'Ex-Staff Engineer', 'verified_expert': True}]}]

SEED_BLOG_POSTS = [{'id': 'editorial-1',
  'slug': 'how-to-master-the-30-second-pitch',
  'title': 'How to Master Your 30-Second Video Elevator Pitch',
  'excerpt': 'Proven techniques to articulate your career highlights, project confidence, and hook recruiters in half a minute.',
  'date': 'October 2026',
  'image': '/images/blog/blog-1.jpg',
  'author': 'Ava Morgan',
  'author_username': 'avamorgan',
  'author_headline': 'Head of Talent Coaching @ Belooga Editorial',
  'post_type': 'EDITORIAL',
  'category': 'Video Pitch Mastery',
  'tags': ['VideoPitch', 'CareerGrowth', 'InterviewPrep'],
  'read_time_minutes': 4,
  'likes_count': 42,
  'comments_count': 1,
  'liked_by': [],
  'comments': [{'id': 'c-1',
                'author_name': 'Alex Nguyen',
                'author_username': 'alexnguyen',
                'content': 'Kịch bản 60s Teleprompter trong ATS Studio giúp mình quay 1 lần ăn ngay!',
                'created_at': '2 giờ trước'}],
  'content': ["In today's fast-paced recruitment landscape, hiring managers spend an average of less than six seconds glancing at an incoming PDF resume before deciding whether to advance a candidate or pass.",
              'A high-impact 30-second elevator pitch breaks through automated applicant tracking systems (ATS) by instantly establishing human presence, communication clarity, and genuine enthusiasm for the role.'],
  'key_takeaways': ['Hook (0-5s): State your name, primary craft, and core value proposition.',
                    'Proof (5-20s): Share a tangible milestone or quantifiable impact.',
                    'Direction (20-30s): Clarify the mission you want to join next.']},
 {'id': 'status-1',
  'slug': 'alex-nguyen-ats-94-golang-milestone',
  'title': 'Vừa tối ưu CV chuẩn STAR đạt 94/100 điểm ATS cho vị trí Senior Golang @ VNG!',
  'excerpt': 'Sau khi dùng tính năng Nạp CV Hồ Sơ và 1-Click STAR Tailor trên Belooga, điểm khớp từ khóa PostgreSQL GIN & Distributed Systems của mình tăng từ 68 lên 94/100.',
  'date': 'Hôm nay',
  'image': '/images/blog/blog-1.jpg',
  'author': 'Alex Nguyen',
  'author_username': 'alexnguyen',
  'author_headline': 'Senior Distributed Systems Engineer',
  'post_type': 'USER_STATUS',
  'category': 'Community Feed',
  'tags': ['Golang', 'PostgreSQL', 'ATSScore', 'SystemDesign'],
  'ats_score_badge': 94,
  'read_time_minutes': 2,
  'likes_count': 29,
  'comments_count': 1,
  'liked_by': [],
  'comments': [{'id': 'c-2',
                'author_name': 'Minh Tran',
                'author_username': 'minhtran',
                'content': 'Chúc mừng bác! Điểm STAR Impact 24/25 quá đỉnh.',
                'created_at': '1 giờ trước'}],
  'content': ['Sau khi dùng tính năng Nạp CV Hồ Sơ và 1-Click STAR Tailor trên Belooga, điểm khớp từ khóa PostgreSQL GIN & Distributed Systems của mình tăng từ 68 lên 94/100.'],
  'key_takeaways': []},
 {'id': 'editorial-2',
  'slug': 'why-video-resumes-are-the-future',
  'title': 'Why Video Resumes Outperform Static PDFs by 3x',
  'excerpt': 'Data from 250+ tech companies reveals how personalized video introductions lead to higher interview conversion rates.',
  'date': 'September 2026',
  'image': '/images/blog/blog-1.jpg',
  'author': 'Jeremy Tran',
  'author_username': 'jeremytran',
  'author_headline': 'Principal Talent Researcher',
  'post_type': 'EDITORIAL',
  'category': 'Hiring Data',
  'tags': ['HiringData', 'VideoResume', 'ATS'],
  'read_time_minutes': 5,
  'likes_count': 37,
  'comments_count': 0,
  'liked_by': [],
  'comments': [],
  'content': ['Empirical cohort data across 250+ engineering teams shows candidates with a verified 30-second video pitch receive 3.1x more direct recruiter outreach than text-only resumes.',
              'Combining structured STAR metrics with a concise video introduction eliminates early screening friction and accelerates technical interview invitations.'],
  'key_takeaways': ['3.1x higher shortlist conversion rate compared to static PDF-only profiles.',
                    'Async video screening saves engineering managers up to 4.5 hours per hire.']},
 {'id': 'status-2',
  'slug': 'sarah-le-hiring-fullstack-nextjs-fastapi',
  'title': 'Team Fintech đang tìm gấp 2 Senior Full-Stack (Next.js 16 + FastAPI) — Ưu tiên ứng viên có Video Pitch!',
  'excerpt': 'Mình vừa lọc trên Recruiter Talent Shortlist thấy nhiều hồ sơ rất chất. Bạn nào có sẵn Video Pitch 30s và điểm ATS > 85 gửi link hồ sơ Belooga dưới comment nhé!',
  'date': '3 giờ trước',
  'image': '/images/blog/blog-1.jpg',
  'author': 'Sarah Le',
  'author_username': 'sarahle',
  'author_headline': 'Tech Talent Acquisition Lead @ FinCloud',
  'post_type': 'USER_STATUS',
  'category': 'Community Feed',
  'tags': ['Hiring', 'NextJS', 'FastAPI', 'RemoteVN'],
  'ats_score_badge': None,
  'read_time_minutes': 2,
  'likes_count': 51,
  'comments_count': 1,
  'liked_by': [],
  'comments': [{'id': 'c-3',
                'author_name': 'Hoang Pham',
                'author_username': 'hoangpham',
                'content': 'Mình vừa gửi link hồ sơ /public/alexnguyen kèm Video Pitch nhé chị!',
                'created_at': '45 phút trước'}],
  'content': ['Mình vừa lọc trên Recruiter Talent Shortlist thấy nhiều hồ sơ rất chất. Bạn nào có sẵn Video Pitch 30s và điểm ATS > 85 gửi link hồ sơ Belooga dưới comment nhé!'],
  'key_takeaways': []},
 {'id': 'editorial-3',
  'slug': 'optimizing-candidate-experience',
  'title': 'Reinventing the Modern Candidate Discovery Experience',
  'excerpt': "Behind the scenes of Belooga's design system and architectural evolution to Next.js 16.3.8, PostgreSQL 16 GIN, and FastAPI.",
  'date': 'September 2026',
  'image': '/images/blog/blog-1.jpg',
  'author': 'Engineering Team',
  'author_username': 'belooga_eng',
  'author_headline': 'Core Platform Engineering',
  'post_type': 'EDITORIAL',
  'category': 'Platform Engineering',
  'tags': ['PostgreSQL', 'FastAPI', 'NextJS16'],
  'read_time_minutes': 6,
  'likes_count': 64,
  'comments_count': 0,
  'liked_by': [],
  'comments': [],
  'content': ["Belooga's talent discovery engine combines PostgreSQL 16 GIN TSVECTOR full-text indexing with pg_trgm trigram similarity for sub-15ms candidate search.",
              'Every candidate workspace integrates WebRTC teleprompter recording, real-time ATS diagnostics, and verified career timelines into a single cohesive platform.'],
  'key_takeaways': ['Sub-15ms full-text & trigram search powered by PostgreSQL 16 GIN indexes.',
                    'Browser-native WebRTC studio with voice-activated teleprompter scrolling.']}]

SEED_USER_POSTS = [{'id': 'upost-1',
  'username': 'phucnguyen',
  'author_name': 'Nguyễn Minh Phúc',
  'title': 'Kiến trúc tối ưu FastAPI Async & Singleflight Cache chịu tải 25,000 CCU',
  'category': 'Chia sẻ kiến thức',
  'body': 'Khi thiết kế hệ thống tìm kiếm ứng viên thời gian thực với TSVECTOR trên PostgreSQL 16, việc kết hợp Singleflight Cache và Keyset Pagination giúp giảm 84% độ trễ P99.',
  'tags': ['Python', 'FastAPI', 'PostgreSQL', 'System Design'],
  'attachment_link': 'https://github.com/farmer911/belooga',
  'likes_count': 34,
  'comments': [{'id': 'uc-1',
                'author_name': 'Tech Recruiter @ VNG',
                'content': 'Bài viết rất thực chiến, bên mình đang tuyển Principal Backend!',
                'created_at': '2 giờ trước'}],
  'created_at': '2026-10-22'}]

SEED_CV_ROASTS = [{'id': 'roast-1',
  'alias': 'Anonymous Senior Go #402',
  'target_role': 'Staff Backend @ Fintech',
  'summary': '7 năm Go/K8s nhưng mô tả dự án toàn liệt kê trách nhiệm, thiếu metrics P99/RPS.',
  'ai_roast': 'AI Roast: Hãy thay các câu liệt kê nhiệm vụ bằng % giảm độ trễ P99.',
  'votes': 24}]



async def seed_demo_content(conn) -> None:
    """Idempotent demo content for the directory/feed tables (ON CONFLICT DO NOTHING keeps user edits)."""
    for c in SEED_COMPANIES:
        cid = (await conn.execute(
            text("""
                INSERT INTO company_profiles (slug, name, industry, company_size, location, website, avg_rating, review_count,
                    avg_salary_usd, open_jobs_count, hiring_now, description, tech_stack, benefits, open_jobs, alumni)
                VALUES (:slug, :name, :industry, :company_size, :location, :website, :avg_rating, :review_count,
                    :avg_salary_usd, :open_jobs_count, :hiring_now, :description, :tech_stack, :benefits,
                    CAST(:open_jobs AS jsonb), CAST(:alumni AS jsonb))
                ON CONFLICT (slug) DO NOTHING
                RETURNING id
            """),
            {**{k: v for k, v in c.items() if k not in ("reviews", "open_jobs", "alumni")},
             "open_jobs": json.dumps(c["open_jobs"], ensure_ascii=False), "alumni": json.dumps(c["alumni"], ensure_ascii=False)},
        )).scalar()
        if cid:
            for r in c["reviews"]:
                await conn.execute(
                    text("""
                        INSERT INTO company_reviews (id, company_id, author_role, rating, title, comment, created_at)
                        VALUES (:id, :cid, :author_role, :rating, :title, :comment, CAST(CAST(:created_at AS text) AS date))
                        ON CONFLICT DO NOTHING
                    """),
                    {**r, "cid": cid},
                )

    for p in SEED_BLOG_POSTS:
        author_id = (await conn.execute(
            text("SELECT identity_id FROM candidate_profiles WHERE username = :u"), {"u": p["author_username"]}
        )).scalar()
        inserted = (await conn.execute(
            text("""
                INSERT INTO blog_posts (id, slug, author_identity_id, author, author_username, author_headline, title, excerpt,
                    date_label, image, post_type, category, tags, ats_score_badge, read_time_minutes, likes_count, content, key_takeaways)
                VALUES (:id, :slug, :aid, :author, :author_username, :author_headline, :title, :excerpt,
                    :date, :image, :post_type, :category, :tags, :ats_score_badge, :read_time_minutes, :likes_count, :content, :key_takeaways)
                ON CONFLICT DO NOTHING
                RETURNING id
            """),
            {"aid": author_id, "ats_score_badge": p.get("ats_score_badge"),
             **{k: v for k, v in p.items() if k not in ("comments", "liked_by", "comments_count", "ats_score_badge")}},
        )).scalar()
        if inserted:
            for c in p["comments"]:
                await conn.execute(
                    text("""
                        INSERT INTO blog_post_comments (id, post_id, author_name, author_username, content)
                        VALUES (:id, :pid, :author_name, :author_username, :content) ON CONFLICT DO NOTHING
                    """),
                    {"pid": inserted, **{k: c[k] for k in ("id", "author_name", "author_username", "content")}},
                )

    for p in SEED_USER_POSTS:
        inserted = (await conn.execute(
            text("""
                INSERT INTO user_posts (id, username, author_name, title, category, body, tags, attachment_link, likes_count, created_at)
                VALUES (:id, :username, :author_name, :title, :category, :body, :tags, :attachment_link, :likes_count, CAST(CAST(:created_at AS text) AS date))
                ON CONFLICT DO NOTHING
                RETURNING id
            """),
            {k: v for k, v in p.items() if k != "comments"},
        )).scalar()
        if inserted:
            for c in p["comments"]:
                await conn.execute(
                    text("INSERT INTO user_post_comments (id, post_id, author_name, content) VALUES (:id, :pid, :author_name, :content) ON CONFLICT DO NOTHING"),
                    {"pid": inserted, "id": c["id"], "author_name": c["author_name"], "content": c["content"]},
                )

    for r in SEED_CV_ROASTS:
        await conn.execute(
            text("""
                INSERT INTO cv_roasts (id, alias, target_role, summary, ai_roast, votes)
                VALUES (:id, :alias, :target_role, :summary, :ai_roast, :votes) ON CONFLICT DO NOTHING
            """),
            r,
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
        await conn.execute(
            text(
                "DELETE FROM identities WHERE email LIKE '%@test.com' "
                "OR email LIKE '%@belooga.test' OR email LIKE '%@example.com'"
            )
        )
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
        all_skills = [
            "Golang", "Python", "React", "Next.js", "TypeScript", "Kubernetes",
            "PostgreSQL", "AWS", "Docker", "System Design", "AI/LLM", "FastAPI",
            "Product Design", "PyTorch", "Tailwind CSS", "React Native", "Expo", "Android", "Kafka", "Redis",
        ]
        for s in all_skills:
            s_id = uuid.uuid4()
            await conn.execute(
                text("INSERT INTO skills (id, name) VALUES (:id, :name) ON CONFLICT (name) DO NOTHING"),
                {"id": s_id, "name": s}
            )
        skills = ["React", "FastAPI", "PostgreSQL", "TypeScript", "Docker", "Product Design"]
        for s in skills:
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
        for loc_name, loc_st, loc_co in [
            ("San Francisco", "CA", "USA"),
            ("New York", "NY", "USA"),
            ("Austin", "TX", "USA"),
            ("Seattle", "WA", "USA"),
            ("Ho Chi Minh", None, "Vietnam"),
            ("Ha Noi", None, "Vietnam"),
            ("Remote", None, "Worldwide"),
        ]:
            loc_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"belooga.location.{loc_name}.{loc_co}")
            await conn.execute(
                text("INSERT INTO catalog_locations (id, name, state, country) VALUES (:id, :n, :st, :co) ON CONFLICT DO NOTHING"),
                {"id": loc_id, "n": loc_name, "st": loc_st, "co": loc_co},
            )
        print("  [+] Master catalogs (companies, schools, locations) seeded")

        # 9. Demo content for company directory / community feed / CV roasts
        await seed_demo_content(conn)

        # 9b. Seed Company Interview Questions
        for iq_id, iq_role, iq_diff, iq_text, iq_hint in [
            ("iq-1", "Principal Golang Engineer", "Hard", "Thiết kế cơ chế chống Double-Spend cho ví điện tử ở mức 20,000 TPS?", "Sử dụng Idempotency Key + pg_advisory_xact_lock + Outbox Ledger."),
            ("iq-2", "Senior AI Infrastructure", "Medium", "Tối ưu độ trễ RAG hybrid search trên PostgreSQL 16 như thế nào?", "Kết hợp GIN TSVECTOR + pg_trgm pre-filter trước khi rerank."),
        ]:
            await conn.execute(
                text("""
                    INSERT INTO company_interview_questions (id, company_id, role_title, difficulty, question_text, sample_answer_hint)
                    SELECT :id, id, :role, :diff, :qtxt, :hint FROM company_profiles WHERE slug = 'vng-cloud'
                    ON CONFLICT DO NOTHING
                """),
                {"id": iq_id, "role": iq_role, "diff": iq_diff, "qtxt": iq_text, "hint": iq_hint},
            )

        # 9c. Seed CV Review Packages & Expert Profiles
        for p_name, p_slug, p_desc, p_price, p_hours, p_pop, p_feat in [
            ("Essential Review", "essential", "Comprehensive ATS audit, keyword gap analysis, and bullet-point impact assessment.", 2900, 48, False, ["Full ATS Compatibility Scan & Score", "Keyword optimization for target job descriptions", "Grammar, formatting & brevity overhaul", "48-hour delivery guarantee"]),
            ("Pro Deep-Dive", "pro", "Line-by-line rewrite suggestions, metric quantification, and 10-minute async video walkthrough.", 5900, 48, True, ["Everything in Essential Review", "Line-by-line bullet rewriting for high impact", "10-min Loom video walkthrough by Senior Leader", "Quantifiable metrics & XYZ-formula alignment", "1 round of follow-up Q&A messaging"]),
            ("Elite 1-on-1 Fast-Track", "elite", "Everything in Pro plus 30-min live technical mock screen and direct referral consideration.", 9900, 24, False, ["Everything in Pro Deep-Dive", "Expedited 24-hour turnaround", "30-minute live 1-on-1 coaching session", "Mock interview calibration & pitch review", "Direct top-tier candidate pool spotlight"]),
        ]:
            await conn.execute(
                text("""
                    INSERT INTO cv_review_packages (id, name, slug, description, price_cents, turn_around_hours, is_popular, features)
                    VALUES (:id, :n, :s, :d, :p, :h, :pop, CAST(:f AS jsonb))
                    ON CONFLICT (slug) DO NOTHING
                """),
                {"id": uuid.uuid5(uuid.NAMESPACE_DNS, f"belooga.pkg.{p_slug}"), "n": p_name, "s": p_slug, "d": p_desc, "p": p_price, "h": p_hours, "pop": p_pop, "f": json.dumps(p_feat)},
            )

        existing_expert_names = {r[0] for r in (await conn.execute(text("SELECT full_name FROM expert_profiles"))).all()}
        for fn, hl, bio, av, co, rc, yoe, rt, cnt, td in [
            ("Sarah Jenkins", "Staff Software Engineer @ Stripe", "10+ years scaling payment infrastructures. Interviewed 300+ backend and distributed system candidates.", "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80", "Stripe", "Backend & Systems", 11, 4.98, 142, 2),
            ("Alex Chen", "Head of Frontend Engineering @ Figma, ex-Uber", "Specializing in React, Next.js architecture, and Design Systems. Passionate about helping engineers stand out.", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80", "Figma", "Frontend & Web", 9, 4.95, 98, 2),
            ("Marcus Vance", "AI Research Engineering Lead @ OpenAI", "LLM fine-tuning and ML infra lead. Reviewed 200+ ML and AI resumes for Silicon Valley research labs.", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80", "OpenAI", "AI & Machine Learning", 12, 5.00, 76, 1),
            ("Dr. Trần Minh Quân", "Principal Distributed Systems Architect", "High-scale payment ledger & Golang microservices architect.", "/images/avatar.jpg", "Grab Financial Group", "Backend & Systems", 12, 4.98, 186, 1),
            ("Lê Hoàng Nam", "Staff AI & LLM Infrastructure Lead", "PyTorch distributed training and RAG inference specialist.", "/images/avatar.jpg", "Shopee & Sea AI Lab", "AI & Machine Learning", 10, 4.95, 142, 1),
        ]:
            if fn in existing_expert_names:
                continue
            await conn.execute(
                text("""
                    INSERT INTO expert_profiles (id, full_name, headline, bio, avatar_url, company, role_category, years_of_experience, rating, total_reviews_count, turn_around_days, is_active)
                    VALUES (:id, :fn, :hl, :bio, :av, :co, :rc, :yoe, :rt, :cnt, :td, TRUE)
                    ON CONFLICT (id) DO NOTHING
                """),
                {"id": uuid.uuid5(uuid.NAMESPACE_DNS, f"belooga.exp.{fn}"), "fn": fn, "hl": hl, "bio": bio, "av": av, "co": co, "rc": rc, "yoe": yoe, "rt": rt, "cnt": cnt, "td": td},
            )

        # 9d. Seed Career Postings & Market Jobs
        for title, comp, dept, loc, sal, sks, is_part, desc in [
            ("Staff Full-Stack Engineer", "Belooga", "Engineering", "Remote / San Francisco", "$4,500 - $6,500 / month", ["Next.js", "FastAPI", "PostgreSQL", "TypeScript"], False, "Build high-throughput async services and sleek Next.js interfaces."),
            ("Lead Product Designer", "Belooga", "Design", "San Francisco, CA", "$4,000 - $5,800 / month", ["Figma", "Design Systems", "UX Research"], False, "Craft intuitive candidate workspaces and seamless WebRTC video studios."),
            ("Head of Talent Partnerships", "Belooga", "Operations", "New York, NY", "$4,200 - $6,000 / month", ["B2B Sales", "Talent Acquisition", "Partnerships"], False, "Expand employer networks across top high-growth tech companies."),
            ("Principal Golang & Payment Core Architect", "Grab Financial Group", "Engineering", "Ho Chi Minh", "65M - 95M VNĐ", ["Golang", "PostgreSQL", "Kubernetes", "Kafka"], True, "Architect ultra-high-throughput payment ledger systems."),
            ("Senior Golang Microservices Engineer", "VNG Digital Business", "Engineering", "Ho Chi Minh", "55M - 75M VNĐ", ["Golang", "Kafka", "Kubernetes"], True, "Scale distributed microservices handling 30k+ RPS."),
            ("Lead Distributed Systems Engineer", "Shopee Vietnam", "Engineering", "Ho Chi Minh / Hybrid", "65M - 90M VNĐ", ["Golang", "Redis", "PostgreSQL"], True, "Lead high-concurrency e-commerce backend infrastructure."),
        ]:
            pid = uuid.uuid5(uuid.NAMESPACE_DNS, f"belooga.career.{comp}.{title}")
            await conn.execute(
                text("""
                    INSERT INTO career_postings (id, title, department, location, description, is_active)
                    VALUES (:id, :title, :dept, :loc, :desc, TRUE)
                    ON CONFLICT (id) DO NOTHING
                """),
                {"id": pid, "title": title, "dept": dept, "loc": loc, "desc": desc},
            )
            await conn.execute(
                text("""
                    INSERT INTO career_posting_meta (career_posting_id, company_name, salary_range, skills, is_partner, is_system_role)
                    VALUES (:id, :comp, :sal, :sks, :part, :sys_role)
                    ON CONFLICT (career_posting_id) DO NOTHING
                """),
                {"id": pid, "comp": comp, "sal": sal, "sks": sks, "part": is_part, "sys_role": not is_part},
            )

        # 9e. Seed Top Candidates (phucnguyen, huypham, maivo)
        for uname, fn, ln, hl, loc, sks in [
            ("phucnguyen", "Phúc", "Nguyễn", "Principal Distributed Systems & Golang Architect", "Ho Chi Minh", ["Golang", "Python", "FastAPI", "PostgreSQL", "Kubernetes"]),
            ("huypham", "Huy", "Phạm", "Senior AI Infrastructure & PyTorch Engineer", "Ha Noi", ["Python", "PyTorch", "FastAPI", "Kubernetes"]),
            ("maivo", "Mai", "Võ", "Staff Frontend React 19 & Design Systems Lead", "Remote", ["React", "TypeScript", "Next.js", "Tailwind CSS"]),
        ]:
            res_u = await conn.execute(
                text("""
                    INSERT INTO identities (email, password_hash, role, status)
                    VALUES (:email, :pw, 'candidate', 'active')
                    ON CONFLICT (email) DO UPDATE SET status = 'active'
                    RETURNING id
                """),
                {"email": f"{uname}@belooga.com", "pw": alex_pass_hash},
            )
            uid = res_u.scalar()
            res_p = await conn.execute(
                text("""
                    INSERT INTO candidate_profiles (
                        identity_id, username, first_name, last_name, headline, bio,
                        location, employment_status, seeking_status, avatar_url, video_pitch_url, is_hidden, is_fresh
                    )
                    VALUES (:id, :u, :fn, :ln, :hl, :bio, :loc, 'Full-Time', 'Actively Looking', '/images/avatar.jpg', '/videos/pitch.mp4', FALSE, FALSE)
                    ON CONFLICT (username) DO UPDATE SET headline = :hl, is_hidden = FALSE
                    RETURNING id
                """),
                {"id": uid, "u": uname, "fn": fn, "ln": ln, "hl": hl, "bio": hl, "loc": loc},
            )
            cpid = res_p.scalar()
            for sk in sks:
                await conn.execute(
                    text("""
                        INSERT INTO profile_skills (profile_id, skill_id)
                        SELECT :pid, id FROM skills WHERE name = :name
                        ON CONFLICT DO NOTHING
                    """),
                    {"pid": cpid, "name": sk},
                )

        # 9f. Seed Baseline Analytics Orders & ATS Scan History for alexnguyen
        pro_pkg_id = (await conn.execute(text("SELECT id FROM cv_review_packages WHERE slug = 'pro' LIMIT 1"))).scalar()
        ess_pkg_id = (await conn.execute(text("SELECT id FROM cv_review_packages WHERE slug = 'essential' LIMIT 1"))).scalar()
        sarah_exp_id = (await conn.execute(text("SELECT id FROM expert_profiles WHERE full_name = 'Sarah Jenkins' LIMIT 1"))).scalar()
        for ord_key, pkg_uid, cents, days_ago in [
            ("seed-order-15d", pro_pkg_id, 5900, 15),
            ("seed-order-2d", ess_pkg_id, 2900, 2),
        ]:
            if not pkg_uid:
                continue
            oid = uuid.uuid5(uuid.NAMESPACE_DNS, f"belooga.{ord_key}")
            await conn.execute(
                text("""
                    INSERT INTO cv_review_orders (id, candidate_identity_id, expert_id, package_id, resume_url, target_role, amount_paid_cents, order_status, payment_reference, created_at)
                    VALUES (:id, :cid, :eid, :pid, '/uploads/resumes/alex_cv.pdf', 'Staff Backend Engineer', :cents, 'completed', 'BLG-SEED', NOW() - make_interval(days => :days))
                    ON CONFLICT (id) DO NOTHING
                """),
                {"id": oid, "cid": alex_id, "eid": sarah_exp_id, "pid": pkg_uid, "cents": cents, "days": days_ago},
            )
        for scan_key, jtitle, score in [
            ("seed-scan-1", "Senior Backend Engineer", 86),
            ("seed-scan-2", "Staff Platform Engineer", 92),
        ]:
            jd_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"belooga.jd.{scan_key}")
            m_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"belooga.match.{scan_key}")
            await conn.execute(
                text("""
                    INSERT INTO job_descriptions (id, company_name, job_title, raw_text, skills_extracted)
                    VALUES (:id, 'Belooga Cloud', :jt, 'Golang, PostgreSQL, Kubernetes', '["Golang", "PostgreSQL", "Kubernetes"]'::jsonb)
                    ON CONFLICT (id) DO NOTHING
                """),
                {"id": jd_id, "jt": jtitle},
            )
            await conn.execute(
                text("""
                    INSERT INTO resume_jd_matches (id, candidate_identity_id, job_description_id, ats_score, matched_skills, missing_skills, star_analysis, parse_warnings)
                    VALUES (:id, :cid, :jid, :sc, '["Golang", "PostgreSQL"]'::jsonb, '["Kubernetes"]'::jsonb, '[]'::jsonb, '[]'::jsonb)
                    ON CONFLICT (id) DO NOTHING
                """),
                {"id": m_id, "cid": alex_id, "jid": jd_id, "sc": score},
            )
        print("  [+] Demo companies, blog posts, user posts, CV roasts, experts, career postings, and baseline analytics seeded")


    print("[*] Database seeded successfully!")


if __name__ == "__main__":
    db_target = sys.argv[1] if len(sys.argv) > 1 else DB_URL
    asyncio.run(seed(db_target))
