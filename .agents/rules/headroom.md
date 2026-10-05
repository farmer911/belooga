---
trigger: model_decision
description: Headroom context and token optimization guidelines when Headroom MCP tools are available.
---

# Headroom Context Optimization Guidelines

When the Headroom MCP server is active with tools `headroom_compress`, `headroom_retrieve`, `headroom_stats`, and `headroom_read`:

1. **Large Output & File Optimization:**
   - When inspecting large command outputs, lengthy logs, large data/JSON dumps, or files (> 250 lines), use `headroom_compress` or `headroom_read` to compress repetitive context before reasoning over it.
   - The original content is automatically preserved in Headroom's local Compress-Cache-Retrieve (CCR) store.

2. **Decompression on Demand:**
   - If exact, uncompressed details are required for a specific code block or hash marker (e.g. `[N items compressed... hash=abc123]`), call `headroom_retrieve(hash="<hash>")` to pull the exact content from the CCR store.

3. **Session Monitoring:**
   - To inspect token and cost reduction in the current session, call `headroom_stats`.
