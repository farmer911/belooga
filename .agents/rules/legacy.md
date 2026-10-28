---
trigger: glob
globs: legacy/**
description: Strict READ-ONLY protection for legacy artifacts.
---

# Legacy Artifacts Rules (READ-ONLY)

1. **Strictly READ-ONLY:**
   - Any modification to files in `legacy/**` is strictly FORBIDDEN.
   - Do not edit HTML, CSS, JS, or SVG assets in this directory.
2. **Reference Purpose Only:**
   - Legacy files exist solely to verify original layouts, visual themes, colors, and behavior.
   - `legacy/` is the reference. `$LEGACY_DIR` may point at an optional upstream checkout; when it is unset, use `legacy/`.
