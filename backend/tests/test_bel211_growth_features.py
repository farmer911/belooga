"""TDD Suite for BEL-211 (#142):
Backend APIs for 20 High-Attraction Features:
- POST /v1/growth/mock-interview
- POST /v1/growth/salary-negotiation
- GET /v1/growth/career-roadmap
- POST /v1/growth/outreach-generator
- POST /v1/growth/skill-assessment
- POST /v1/growth/pitch-script
- POST /v1/growth/cv-auto-import
- PATCH /v1/growth/stealth-mode
- GET /v1/growth/hub
- POST /v1/growth/referrals
- POST /v1/growth/cv-roasts
- POST /v1/growth/expert-mock-booking
- POST /v1/growth/claim-reward
- GET & POST /v1/companies/{slug}/interview-questions
- POST /v1/recruiter/reverse-bids
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_20_high_attraction_growth_apis(
    client: AsyncClient, test_candidate_a: dict, test_candidate_b: dict
):
    auth_headers = {"Authorization": f"Bearer {test_candidate_a['token']}"}
    # 1. Mock Interview Evaluator
    mock_res = await client.post(
        "/v1/growth/mock-interview",
        json={
            "role_title": "Principal Golang Engineer",
            "question": "Describe a production bottleneck you resolved.",
            "answer_text": "Migrated sequential queries to asyncpg + GIN TSVECTOR, cutting P99 latency from 420ms to 28ms.",
        },
        headers=auth_headers,
    )
    assert mock_res.status_code == 200
    mock_data = mock_res.json()
    assert mock_data["overall_score"] >= 80
    assert mock_data["star_score"] >= 80
    assert "upgraded_answer" in mock_data

    # 2. Salary Negotiation Copilot
    neg_res = await client.post(
        "/v1/growth/salary-negotiation",
        json={"current_offer_usd": 3000, "tech_stack": "Golang", "level": "Senior"},
        headers=auth_headers,
    )
    assert neg_res.status_code == 200
    neg_data = neg_res.json()
    assert neg_data["recommended_counter_usd"] > 3000
    assert "negotiation_script" in neg_data

    # 3. Career Path Roadmap Simulator
    road_res = await client.get(
        "/v1/growth/career-roadmap", params={"track": "Backend / Distributed Systems"}
    )
    assert road_res.status_code == 200
    road_data = road_res.json()
    assert len(road_data["steps"]) >= 3

    # 4. 1-Click Outreach Generator
    out_res = await client.post(
        "/v1/growth/outreach-generator",
        json={"company_name": "VNG Cloud", "role_title": "Staff Backend Engineer"},
        headers=auth_headers,
    )
    assert out_res.status_code == 200
    assert "VNG Cloud" in out_res.json()["cover_letter"]

    # 5. Verified Skill Micro-Assessment
    skill_res = await client.post(
        "/v1/growth/skill-assessment",
        json={"skill_name": "PostgreSQL High-Scale", "correct_answers": 5, "total_questions": 5},
        headers=auth_headers,
    )
    assert skill_res.status_code == 200
    assert skill_res.json()["verified"] is True

    # 6. 60s Video Pitch Script & CV Auto-Import & Stealth Mode & Growth Hub
    pitch_res = await client.post(
        "/v1/growth/pitch-script",
        json={"username": "phucnguyen", "target_role": "Principal Architect"},
        headers=auth_headers,
    )
    assert pitch_res.status_code == 200
    assert len(pitch_res.json()["script_text"]) > 20

    imp_res = await client.post(
        "/v1/growth/cv-auto-import",
        json={"raw_cv_text": "Phuc Nguyen - Principal Architect - Golang, PostgreSQL, Kubernetes"},
        headers=auth_headers,
    )
    assert imp_res.status_code == 200
    assert imp_res.json()["experience_count"] >= 1

    stealth_res = await client.patch(
        "/v1/growth/stealth-mode",
        json={"stealth_enabled": True, "blocked_companies": ["CurrentCorp"]},
        headers=auth_headers,
    )
    assert stealth_res.status_code == 200
    assert stealth_res.json()["stealth_enabled"] is True

    hub_res = await client.get("/v1/growth/hub")
    assert hub_res.status_code == 200
    assert hub_res.json()["github_impact"]["total_stars"] > 0

    # 7. Referrals, CV Roasts, Expert Mock Booking, Claim Reward
    ref_res = await client.post(
        "/v1/growth/referrals", json={"slot_id": "ref-1"}, headers=auth_headers
    )
    assert ref_res.status_code == 200
    assert ref_res.json()["status"] == "REQUESTED"

    roast_res = await client.post(
        "/v1/growth/cv-roasts",
        json={"anonymous_handle": "Anon Go #1", "cv_snippet": "Built APIs in Go"},
        headers=auth_headers,
    )
    assert roast_res.status_code == 200
    assert roast_res.json()["upvotes"] == 0  # a new roast has no votes yet

    book_res = await client.post(
        "/v1/growth/expert-mock-booking",
        json={"slot_id": "exp-1", "topic": "System Design"},
        headers=auth_headers,
    )
    assert book_res.status_code == 200
    assert book_res.json()["status"] == "CONFIRMED"

    rew_res = await client.post(
        "/v1/growth/claim-reward", json={"reward_id": "rew-1"}, headers=auth_headers
    )
    assert rew_res.status_code == 200
    assert rew_res.json()["credited_vnd"] >= 50000

    # 8. Company Interview Questions & Recruiter Reverse Offer Bid
    iq_post = await client.post(
        "/v1/companies/vng-cloud/interview-questions",
        json={
            "role_title": "Principal Golang Engineer",
            "difficulty": "Hard",
            "question_text": "How do you prevent double-spend at 20k TPS?",
            "sample_answer_hint": "Idempotency key + advisory lock",
        },
        headers=auth_headers,
    )
    assert iq_post.status_code in (200, 201)

    iq_get = await client.get("/v1/companies/vng-cloud/interview-questions")
    assert iq_get.status_code == 200
    assert len(iq_get.json()) >= 2

    bid_res = await client.post(
        "/v1/recruiter/reverse-bids",
        json={"candidate_username": test_candidate_b["username"], "offered_salary_usd": 4200},
        headers=auth_headers,
    )
    assert bid_res.status_code in (200, 201)
    assert bid_res.json()["salary_offer_usd"] == 4200
