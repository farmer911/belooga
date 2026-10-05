# ADR-006: ReportLab Python Canvas over Headless Browser for PDF Resumes

* **Status:** Accepted
* **Context:** Candidates require high-fidelity, printable PDF resumes generated on demand from their profile data.
* **Decision:** Implement **ReportLab Platypus Engine** natively in Python, rejecting headless browser rendering (Puppeteer / Playwright).
* **Rationale:**
  1. **Memory Footprint:** ReportLab compiles PDFs in $< 50\text{ms}$ consuming $< 15\text{MB}$ RAM. Spawning a headless Chromium browser requires $> 200\text{MB}$ RAM per instance and takes $> 1,500\text{ms}$.
  2. **Container Portability:** ReportLab requires zero external browser binaries or heavy OS graphics dependencies in the Docker container.
  3. **Print-Perfect Geometry:** Exact point-based typography, margins, and page breaks without CSS print media query inconsistencies.
* **Consequences:**
  * PDF generation must be executed inside `asyncio.to_thread` to prevent blocking Uvicorn's event loop thread.
