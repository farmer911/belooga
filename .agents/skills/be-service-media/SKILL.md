---
name: be-service-media
description: Authoritative Backend Department Skill for Media Processing & Storage (Domain 4). Covers chunked video uploads, binary reassembly, non-blocking disk I/O, ReportLab PDF generation, and storage strategies.
---

# 📹 Backend Department Skill: Media Processing & Storage (Domain 4)

> [!WARNING] TARGET ARCHITECTURE (NOT YET IMPLEMENTED) – CURRENTLY INLINED IN ROUTER ENDPOINTS
> **Current Reality:** Inlined directly in router endpoints at `backend/app/api/v1/endpoints/media.py` (chunked streaming, upload session validation, ReportLab PDF generation via asyncio.to_thread).
> **Target Modular Services:** backend/app/services/media_service.py, backend/app/services/pdf_service.py (planned target)
> **Department:** Backend Systems Engineering — Media & Document Processing Division  
> **Storage Directories:** `/app/uploads/avatars/`, `/app/uploads/videos/`, `/app/uploads/chunks/`, `/app/uploads/resumes/`  

---

## 1. Department Role & Mission

This department manages all binary assets: candidate avatar image validation, multi-chunk video pitch uploads, atomic chunk reassembly, WebM/MP4 format conversion, and server-side PDF resume compilation via ReportLab.

---

## 2. Cross-Departmental Impact Matrix (Dependencies)

| Dependency Direction | Department | Interface & Contract |
| :--- | :--- | :--- |
| **Upstream (Depends on)** | `be-service-profile` | Associates merged media URLs with `candidate_profiles` |
| **Upstream (Depends on)** | `be-service-timeline` | Ingests job/edu credentials into ReportLab PDF generator |
| **Downstream (Outputs to)** | `fe-section-workspace-studio` | Serves chunk upload endpoints: `/chunk/` and `/complete/` |
| **Downstream (Outputs to)** | `fe-section-workspace-header` | Serves avatar upload and PDF export endpoints |
| **Downstream (Outputs to)** | `fe-section-workspace-pitch-player` | Streams public video pitch and poster |

---

## 3. Non-Blocking Async File I/O Protocol

Merging large video chunks (10MB - 100MB) synchronously in FastAPI blocks the event loop. The Media Department enforces non-blocking execution:

```python
import anyio
import shutil

async def assemble_chunks_async(chunk_paths: list[str], output_path: str):
    def _sync_merge():
        with open(output_path, "wb") as outfile:
            for cp in chunk_paths:
                with open(cp, "rb") as infile:
                    shutil.copyfileobj(infile, outfile)
    # Offload blocking disk writes to AnyIO worker thread
    await anyio.to_thread.run_sync(_sync_merge)
```
👉 **Guarantees FastAPI event loop remains 100% responsive during multi-megabyte video assembly.**
