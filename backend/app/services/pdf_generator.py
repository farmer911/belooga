"""PDF Resume generator service.

Compiles candidate credentials, work history, and skills into a standardized
branded PDF document using ReportLab in a non-blocking background thread.
"""

import asyncio
import io
from typing import Any, Dict, List

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer


def _build_pdf_sync(row: Any, jobs: List[Dict[str, Any]], education: List[Dict[str, Any]], skills: List[str], clean_username: str) -> bytes:
    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        pdf_buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#21655e"),
    )
    headline_style = ParagraphStyle(
        "Headline",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#5bbbae"),
    )
    meta_style = ParagraphStyle(
        "Meta",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#666666"),
    )
    section_title = ParagraphStyle(
        "SectionTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=colors.HexColor("#252525"),
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#444444"),
    )
    bold_item = ParagraphStyle(
        "BoldItem",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#252525"),
    )

    elements = []

    # 1. Header
    full_name = f"{row.first_name} {row.last_name}"
    elements.append(Paragraph(full_name, title_style))
    elements.append(Paragraph(f"@{clean_username} • {row.headline or 'Candidate on Belooga'}", headline_style))
    elements.append(Spacer(1, 4))

    contact_line = f"Email: {row.email}  |  Location: {row.location or 'Global'}  |  Status: {row.seeking_status or 'Actively Looking'}"
    elements.append(Paragraph(contact_line, meta_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#5bbbae"), spaceAfter=14))

    # 2. Executive Bio
    if row.bio:
        elements.append(Paragraph("ABOUT & EXECUTIVE SUMMARY", section_title))
        elements.append(Paragraph(row.bio, body_style))
        elements.append(Spacer(1, 14))

    # 3. Work Experience
    elements.append(Paragraph("WORK EXPERIENCE", section_title))
    if jobs:
        for job in jobs:
            dates = f"{job['from_date_year']} — {'Present' if job['currently_work_here'] else (job['to_date_year'] or 'Present')}"
            elements.append(Paragraph(f"<b>{job['title']}</b>  |  <font color='#5bbbae'>{job['company_name']}</font>  <font color='#888888'>({dates})</font>", bold_item))
            if job["description"]:
                elements.append(Spacer(1, 2))
                elements.append(Paragraph(job["description"], body_style))
            elements.append(Spacer(1, 8))
    else:
        elements.append(Paragraph("No previous work experiences listed.", meta_style))
        elements.append(Spacer(1, 8))

    elements.append(Spacer(1, 6))

    # 4. Education
    elements.append(Paragraph("EDUCATION & CREDENTIALS", section_title))
    if education:
        for edu in education:
            dates = f"{edu['from_date_year']} — {edu['to_date_year'] or 'Present'}"
            gpa_text = f" (GPA: {edu['gpa']})" if edu["gpa"] else ""
            elements.append(Paragraph(f"<b>{edu['school_name']}</b> — {edu['degree_name']}{gpa_text}  <font color='#888888'>({dates})</font>", bold_item))
            elements.append(Spacer(1, 6))
    else:
        elements.append(Paragraph("No academic credentials listed.", meta_style))
        elements.append(Spacer(1, 6))

    elements.append(Spacer(1, 6))

    # 5. Technical Skills
    elements.append(Paragraph("SKILLS & CORE PROFICIENCIES", section_title))
    active_skills = skills if skills else ["Product Design", "React", "TypeScript", "FastAPI", "PostgreSQL"]
    skills_text = " • ".join(active_skills)
    elements.append(Paragraph(skills_text, body_style))
    elements.append(Spacer(1, 16))

    # 6. Verification Footer
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#d1d6da"), spaceAfter=8))
    elements.append(Paragraph("Official candidate profile verified via Belooga Talent Discovery & Video Elevator Pitch Platform © 2026", meta_style))

    doc.build(elements)
    pdf_bytes = pdf_buffer.getvalue()
    pdf_buffer.close()
    return pdf_bytes


async def generate_pdf_resume_async(row: Any, jobs: List[Dict[str, Any]], education: List[Dict[str, Any]], skills: List[str], clean_username: str) -> bytes:
    """Non-blocking PDF generation delegating ReportLab build to threadpool."""
    return await asyncio.to_thread(_build_pdf_sync, row, jobs, education, skills, clean_username)
