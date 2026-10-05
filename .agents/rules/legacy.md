---
trigger: glob: legacy/**
description: Strict READ-ONLY protection for legacy artifacts.
---

# Legacy Artifacts Rules (READ-ONLY)

1. **Strictly READ-ONLY:**
   - Any modification to files in `legacy/**` is strictly FORBIDDEN.
   - Do not edit HTML, CSS, JS, or SVG assets in this directory.
2. **Reference Purpose Only:**
   - Legacy files exist solely to verify original layouts, visual themes, colors, and behavior.
   - The original upstream repository is at `$LEGACY_DIR` (default: `../Beloga-CV`).
