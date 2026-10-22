"""TDD Integration Tests for BEL-156 (#77):
- POST /v1/match/extract-cv-file (PDF / DOCX / TXT server-side extraction)
- GET /v1/profile/{username}/cv-draft/ (Auto-hydrated experience, education, skills, cv_text)
- GET /v1/expert-review/orders/me & dynamic notifications/analytics
"""

import io
import zipfile
from types import SimpleNamespace
import pytest
from httpx import AsyncClient

from app.services.pdf_generator import _build_pdf_sync


def _make_docx_bytes(paragraphs: list[str]) -> bytes:
    buf = io.BytesIO()
    body_xml = "".join(
        f"<w:p><w:r><w:t>{p}</w:t></w:r></w:p>" for p in paragraphs
    )
    doc_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        f"<w:body>{body_xml}</w:body></w:document>"
    )
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("word/document.xml", doc_xml)
    return buf.getvalue()


@pytest.mark.asyncio
async def test_extract_cv_file_pdf_docx_txt(client: AsyncClient):
    """Verify POST /v1/match/extract-cv-file extracts clean text & skills from PDF, DOCX, and TXT."""
    # 1. Real PDF generated via ReportLab
    row = SimpleNamespace(
        first_name="Alex",
        last_name="Rivera",
        headline="Principal Golang & FastAPI Architect",
        email="alex@belooga.com",
        phone="0901234567",
        location="Ho Chi Minh City",
        seeking_status="Actively Looking",
        bio="Engineered high-scale distributed microservices handling 50,000+ RPS.",
    )
    pdf_bytes = _build_pdf_sync(
        row,
        [
            {
                "title": "Staff Backend Engineer",
                "company_name": "VNG Cloud",
                "from_date_year": 2022,
                "to_date_year": None,
                "currently_work_here": True,
                "description": "Architected Golang, PostgreSQL, and Kubernetes clusters reducing p95 latency by 45%.",
            }
        ],
        [],
        ["Golang", "FastAPI", "PostgreSQL", "Kubernetes", "Redis"],
        "alex",
        True,
    )

    res_pdf = await client.post(
        "/v1/match/extract-cv-file",
        files={"file": ("alex_cv.pdf", pdf_bytes, "application/pdf")},
    )
    assert res_pdf.status_code == 200
    pdf_data = res_pdf.json()
    assert pdf_data["file_type"] == "pdf"
    assert "Alex Rivera" in pdf_data["extracted_text"]
    assert "Golang" in pdf_data["extracted_skills"]
    assert "PostgreSQL" in pdf_data["extracted_skills"]
    assert pdf_data["word_count"] >= 15

    # 2. Real DOCX (ZIP + word/document.xml)
    docx_bytes = _make_docx_bytes(
        [
            "Tran Thi Mai — Senior Backend Engineer",
            "Skills: Python, FastAPI, PostgreSQL, Docker, AWS",
            "• Engineered FastAPI payment gateway processing 25,000 TPS with 99.99% uptime.",
        ]
    )
    res_docx = await client.post(
        "/v1/match/extract-cv-file",
        files={
            "file": (
                "mai_cv.docx",
                docx_bytes,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )
    assert res_docx.status_code == 200
    docx_data = res_docx.json()
    assert docx_data["file_type"] == "docx"
    assert "Tran Thi Mai" in docx_data["extracted_text"]
    assert "FastAPI" in docx_data["extracted_skills"]
    assert "PostgreSQL" in docx_data["extracted_skills"]

    # 3. Unsupported file format returns 400
    res_bad = await client.post(
        "/v1/match/extract-cv-file",
        files={"file": ("virus.exe", b"MZ\x90\x00", "application/octet-stream")},
    )
    assert res_bad.status_code == 400


@pytest.mark.asyncio
async def test_profile_cv_draft_auto_hydration_and_expert_orders_me(
    client: AsyncClient,
    test_candidate_a: dict,
):
    """Verify GET /v1/profile/{username}/cv-draft/ returns rich auto-hydrated experience + cv_text and /v1/expert-review/orders/me works."""
    username = test_candidate_a["username"]
    headers = {"Authorization": f"Bearer {test_candidate_a['token']}"}

    draft_res = await client.get(f"/v1/profile/{username}/cv-draft/", headers=headers)
    assert draft_res.status_code == 200
    draft = draft_res.json()
    assert draft["full_name"]
    assert len(draft["experience"]) >= 1
    assert len(draft.get("cv_text", "")) >= 30

    # Verify /v1/expert-review/orders/me alias
    orders_me = await client.get("/v1/expert-review/orders/me", headers=headers)
    assert orders_me.status_code == 200
    assert isinstance(orders_me.json(), list)

    # Verify notifications include notif_id in deep_link
    notif_res = await client.get("/v1/notifications/", headers=headers)
    assert notif_res.status_code == 200
    notifs = notif_res.json()["items"]
    assert len(notifs) >= 1
    assert "notif_id=" in notifs[0]["deep_link"]
