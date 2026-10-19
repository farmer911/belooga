#!/usr/bin/env python3
"""
High-Speed Idempotent PostgreSQL 16 Bulk Seeder for 500,000 Synthetic Candidate Profiles.

Uses PostgreSQL server-side `generate_series` + parallel index construction (`maintenance_work_mem = '512MB'`)
and runs `ANALYZE` so the query planner has exact 500k-row statistics (`reltuples`).
Zero external PII crawling; 100% synthetic domain-realistic engineering profiles.
"""

import subprocess
import sys
import time

TARGET_TOTAL = int(sys.argv[1]) if len(sys.argv) > 1 else 500_000
DB_NAME = sys.argv[2] if len(sys.argv) > 2 else "belooga_db"


def run_psql(sql: str, db: str = DB_NAME) -> str:
    cmd = [
        "docker", "exec", "-i", "belooga-postgres",
        "psql", "-U", "belooga", "-d", db, "-v", "ON_ERROR_STOP=1", "-q", "-t", "-A",
    ]
    res = subprocess.run(cmd, input=sql, text=True, capture_output=True)
    if res.returncode != 0:
        raise RuntimeError(f"psql failed ({db}): {res.stderr}")
    return res.stdout.strip()


def ensure_indexes(db: str) -> None:
    sql = """
    SET maintenance_work_mem = '512MB';
    SET max_parallel_maintenance_workers = 4;
    CREATE INDEX IF NOT EXISTS idx_candidate_profiles_search_vector
        ON candidate_profiles USING GIN(search_vector);
    CREATE INDEX IF NOT EXISTS idx_candidate_profiles_visible_created
        ON candidate_profiles (created_at DESC, id DESC)
        WHERE is_hidden = FALSE;
    CREATE INDEX IF NOT EXISTS idx_candidate_profiles_autocomplete_trgm
        ON candidate_profiles
        USING gin ((coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' || coalesce(username, '') || ' ' || coalesce(headline, '')) gin_trgm_ops)
        WHERE is_hidden = FALSE;
    ANALYZE identities;
    ANALYZE candidate_profiles;
    """
    run_psql(sql, db=db)


def main() -> None:
    t0 = time.perf_counter()
    current_count = int(run_psql("SELECT COUNT(*) FROM candidate_profiles;") or "0")
    print(f"[*] Current candidate_profiles in {DB_NAME}: {current_count:,}")

    if current_count < TARGET_TOTAL:
        needed = TARGET_TOTAL - current_count
        print(f"[*] Seeding {needed:,} synthetic candidates to reach {TARGET_TOTAL:,}+ rows...")
        run_psql("""
            DROP INDEX IF EXISTS idx_candidate_profiles_search_vector;
            DROP INDEX IF EXISTS idx_candidate_profiles_autocomplete_trgm;
            DROP INDEX IF EXISTS idx_candidate_profiles_visible_created;
        """)

        batch_size = 100_000
        start_idx = current_count + 1
        end_idx = TARGET_TOTAL

        for b_start in range(start_idx, end_idx + 1, batch_size):
            b_end = min(b_start + batch_size - 1, end_idx)
            b_t0 = time.perf_counter()
            sql = f"""
            SET synchronous_commit = OFF;
            WITH series AS (
                SELECT
                    g AS seq,
                    (
                        substr(md5('id:' || g::text), 1, 8) || '-' ||
                        substr(md5('id:' || g::text), 9, 4) || '-4' ||
                        substr(md5('id:' || g::text), 14, 3) || '-a' ||
                        substr(md5('id:' || g::text), 18, 3) || '-' ||
                        substr(md5('id:' || g::text), 21, 12)
                    )::uuid AS ident_id,
                    (
                        substr(md5('prof:' || g::text), 1, 8) || '-' ||
                        substr(md5('prof:' || g::text), 9, 4) || '-4' ||
                        substr(md5('prof:' || g::text), 14, 3) || '-b' ||
                        substr(md5('prof:' || g::text), 18, 3) || '-' ||
                        substr(md5('prof:' || g::text), 21, 12)
                    )::uuid AS prof_id,
                    (ARRAY['Minh','Lan','Huy','An','Tuan','Linh','Khoa','Mai','Duc','Thao','Long','Phuc','Quang','Vy','Binh','Khanh'])[1 + (g % 16)] AS fname,
                    (ARRAY['Nguyen','Tran','Le','Pham','Hoang','Vu','Dang','Bui','Do','Ho','Ngo','Duong'])[1 + (g % 12)] AS lname,
                    (ARRAY[
                        'Senior Golang Distributed Systems Engineer',
                        'Staff Python FastAPI & PostgreSQL Architect',
                        'Principal React Next.js TypeScript Lead',
                        'Cloud Native Kubernetes & DevOps SRE',
                        'Rust High-Frequency Systems Developer',
                        'Full-Stack TypeScript Node.js & GraphQL Engineer',
                        'AI/ML Platform Engineer (Python, PyTorch, Redis)',
                        'Lead Backend Microservices Architect (Go, Kafka)'
                    ])[1 + (g % 8)] AS hline,
                    (ARRAY[
                        'Architected high-concurrency Golang, Kubernetes, PostgreSQL, Redis, and Kafka services handling 50000 rps.',
                        'Built async FastAPI, Python, PostgreSQL, Docker, and AWS microservices with sub-10ms p95 latency.',
                        'Delivered Next.js, React, TypeScript, Tailwind CSS, and GraphQL web applications for 500k users.',
                        'Scaled Kubernetes, Terraform, CI/CD, Linux, and Prometheus observability clusters across multi-region clouds.'
                    ])[1 + (g % 4)] AS bio_txt,
                    (ARRAY['Ho Chi Minh City','Hanoi','Da Nang','Singapore','San Francisco, CA','Remote'])[1 + (g % 6)] AS loc,
                    (ARRAY['Actively Looking','Open to Offers','Actively Looking','Not Looking'])[1 + (g % 4)] AS seek_st,
                    CASE WHEN (g % 3) = 0 THEN '/images/home/Ava_s_Video.mp4' ELSE NULL END AS vid_url,
                    NOW() - ((g % 365) || ' days')::interval - ((g % 86400) || ' seconds')::interval AS c_at
                FROM generate_series({b_start}, {b_end}) AS g
            ),
            ins_ident AS (
                INSERT INTO identities (id, email, password_hash, role, status, created_at, updated_at)
                SELECT ident_id, 'cand_' || seq || '@belooga.synthetic', 'argon2$synthetic_hash', 'candidate', 'active', c_at, c_at
                FROM series
                ON CONFLICT (email) DO NOTHING
            )
            INSERT INTO candidate_profiles (
                id, identity_id, username, first_name, last_name, headline, bio, location,
                employment_status, seeking_status, avatar_url, video_pitch_url, is_hidden, is_fresh, submitted, created_at, updated_at
            )
            SELECT
                prof_id, ident_id, 'talent_' || seq, fname, lname, hline, bio_txt, loc,
                'Employed', seek_st, '/images/avatar.jpg', vid_url, FALSE, FALSE, TRUE, c_at, c_at
            FROM series
            ON CONFLICT (username) DO NOTHING;
            """
            run_psql(sql)
            print(f"  [+] Batch {b_start:,}..{b_end:,} inserted in {time.perf_counter() - b_t0:.2f}s")

    print("[*] Building GIN (search_vector + pg_trgm) and Partial B-Tree Keyset indexes & running ANALYZE...")
    idx_t0 = time.perf_counter()
    ensure_indexes(DB_NAME)
    ensure_indexes("belooga_test")
    final_count = int(run_psql("SELECT COUNT(*) FROM candidate_profiles;") or "0")
    print(f"[✓] Completed in {time.perf_counter() - t0:.2f}s (Index build: {time.perf_counter() - idx_t0:.2f}s). Total candidate_profiles: {final_count:,}")


if __name__ == "__main__":
    main()
