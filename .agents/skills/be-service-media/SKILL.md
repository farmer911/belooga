---
name: be-service-media
description: Chunked video uploads, avatar/resume media storage, and ReportLab PDF resume generation in backend/app/api/v1/endpoints/media.py. Use when updating file uploads, path traversal checks, chunk reassembly, or PDF layout. Not for video recording UI (fe-section-workspace-studio) or general profile attributes (be-service-profile).
---

# Media Processing & Document Generation (Domain 4)

## Current Reality (AS-IS)
- Implemented directly in `backend/app/api/v1/endpoints/media.py`.
- No separate service layer; endpoints handle chunked file I/O and PDF generation directly.
- Storage volumes: `/app/uploads/avatars/`, `/app/uploads/resumes/`, `/app/uploads/videos/`, `/app/uploads/chunks/`.

## Project-Specific Rules
- **Non-blocking Event Loop I/O (ADR-006):**
  - Never call `open()`, `shutil.rmtree()`, `os.remove()`, or `ReportLab doc.build()` synchronously inside async functions.
  - Always wrap filesystem operations in `asyncio.to_thread` or `anyio.to_thread.run_sync`.
- **Path Traversal Protection:**
  - `upload_id` must match `r"^upload_\d+_[a-zA-Z0-9]+$"`.
  - All file paths must be scoped under user ID and validated using `os.path.realpath`.
- **Public & Hidden PDF Generation:**
  - `GET /v1/profile/{username}/pdf/` uses `Depends(get_current_user_optional)`.
  - Hidden profiles return `404` for non-owners/unauthenticated users.
  - Public caller receives sanitized PDF; owner receives PDF with full contact details.

## Known Traps
- ReportLab canvas drawing is CPU-bound; running it in the main thread stalls all concurrent HTTP requests.
- Always verify chunk index sequence and byte size during `/v1/media/upload/complete`.

## Canonical Example
- `backend/app/api/v1/endpoints/media.py:generate_candidate_pdf`

## Self-Verification
- `backend/.venv/bin/pytest backend/tests/test_media_traversal.py -v`
- `bash scripts/audit-truth.sh`
