# ADR-003: FastAPI & Python 3.12+ Async for Modular Monolith Backend

* **Status:** Accepted
* **Context:** The backend powers real-time WebRTC uploads, PDF resume compilation, Argon2id authentication, and candidate discovery.
* **Decision:** Use **FastAPI with Python 3.12+ Async (Uvicorn / AnyIO)** structured as a Modular Monolith.
* **Rationale:**
  1. **Async High Concurrency:** Asyncio event loop handles thousands of concurrent I/O-bound connections (chunk uploads, search queries).
  2. **Strict Type Safety:** Pydantic v2 schemas provide compile-time request validation and automatic OpenAPI contract generation.
  3. **Python Ecosystem:** Direct integration with ReportLab (PDF compilation) and NumPy/AI tooling without multi-process microservice overhead.
* **Consequences:**
  * Any synchronous CPU-bound task (ReportLab, FFmpeg) must be offloaded via `asyncio.to_thread` or background worker tasks.
