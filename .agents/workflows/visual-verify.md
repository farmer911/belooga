---
name: visual-verify
description: Visual and behavioral verification procedure against legacy source.
---

# Workflow: Visual Verification

## 1. Locate Legacy Source
- Local repository: `/Users/phucnguyen/Dev/Beloga-CV`
- Check original components in `/Users/phucnguyen/Dev/Beloga-CV/src/` or `/legacy/`

## 2. Check CSS Scoping
- Ensure new or modified styles do not attach width, height, or background to generic trigger classes (`.modal-trigger`, `.modal-start`).
- Use Tailwind CSS v4 utility classes scoped to the component.

## 3. Live Browser Inspection
- Start frontend: `cd frontend && bun run dev` (running at `http://localhost:3000`)
- Verify page rendering, hover states, modal triggers, and responsive viewports.
- Confirm exact color codes, SVG icons, and typography against legacy reference.

## 4. Run Playwright Visual Tests
```bash
cd qc && bun run test:visual
```
