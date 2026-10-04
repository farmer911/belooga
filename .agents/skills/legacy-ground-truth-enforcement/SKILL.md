---
name: legacy-ground-truth-enforcement
description: Enforces strict zero-hallucination protocols when working with legacy codebases, migrations, and UI reconstructions. Mandates exact asset extraction, verified source citations, direct user alignment, and mandatory browser visual verification.
---

# Legacy Ground-Truth Enforcement & Anti-Hallucination Protocol

This skill enforces strict operational discipline when analyzing, reconstructing, or migrating legacy software systems. It prohibits the agent from inventing, approximating, or hallucinating UI components, icons, brand assets, routes, or behaviors.

---

## 1. Core Principles

1. **Zero Hallucination Policy:**
   - Never invent, draw, or synthesize brand assets, logos, custom iconography, or design tokens out of thin air.
   - If an asset, logo, SVG, or icon exists in the legacy codebase, it must be fetched or referenced directly from the literal file (e.g., `public/images/`, `src/assets/`, `icons/`).
   - If a visual asset is missing or unclear, explicitly ask the user for the authoritative source or clarification. Never attempt to guess or fake it.

2. **Source-Anchored Evidence:**
   - Every UI element, route path, text label, and navigation link must be traced directly to a specific source file, component, or technical discovery record.
   - Always reference the exact file paths and line numbers when proposing or implementing legacy parity.

3. **Author Authority & Truth Alignment:**
   - When the user (system author/architect) clarifies a requirement or corrects an implementation, treat their statement as ground truth.
   - Never defend or persist synthesized/hallucinated artifacts over author specifications.

4. **Zero Global CSS Pollution:**
   - Never inject layout dimensions (`height`, `width`, `background`) into generic behavioral/trigger utility classes (such as `.modal-trigger`, `.modal-instance`).
   - All custom styles must be scoped tightly under their parent component container to prevent catastrophic cascade collisions.

---

## 2. Asset & Iconography Extraction Workflow

When tasked with reproducing or referencing icons, brand marks, and UI assets:

1. **Search Exact Asset Files:**
   - Inspect the legacy repository's asset directories:
     - `public/images/`
     - `src/styles/fonts/` (icon fonts like `iconsmind`, `socicon`, `font-awesome`)
     - `src/commons/components/` (custom SVG/Icon components)
   - Read the exact file contents or download the raw binary/SVG asset directly from the source repository.

2. **Verify Icon Classes & Font Mappings:**
   - In legacy projects using icon font systems (e.g., Stack Theme, Iconsmind, FontAwesome), use the exact CSS class names (e.g., `icon-Cranium`, `icon-Tripod-withCamera`, `icon-Video-2`) rather than substituting modern approximations without permission.

3. **Fallback & Clarification Rule:**
   - If an asset is unavailable or corrupt in the source repository:
     - State explicitly: *"The asset `<path>` is missing from the repository."*
     - Ask the user to provide the asset or approve a temporary placeholder.
     - **NEVER** fabricate a complex vector/shape and present it as the original legacy asset.

---

## 3. Mandatory Interactive & Visual Verification Gate

Before declaring ANY UI fix or interactive feature (hover, click, modal, dropdown) complete:
1. **Live Browser Test:** The agent MUST trigger the interaction (e.g., hover over the card, open the modal) in the running browser session.
2. **Computed Style & Layout Check:** Verify that the element's rendered geometry (`width`, `height`, `border-radius`, `background`) matches the legacy specifications without distortion.
3. **No False Completion:** It is strictly forbidden to claim a bug is fixed based solely on code edits without visual inspection.

---

## 4. Quality Checklist Before Response

Before delivering any UI mockup, asset, or migration code, verify:
- [ ] Are all icons, SVGs, and brand marks literal extracts from the legacy repository or user-provided files?
- [ ] Are all text labels, headings, and menus verified against the legacy source files?
- [ ] Have all generic utility classes (like `.modal-trigger`) been kept clean of polluting CSS dimensions?
- [ ] Has the interaction state (hover/modal/popup) been verified with actual browser testing?
- [ ] Has `VIOLATIONS_REGISTER.md` been consulted and updated?
- [ ] Is there zero synthesized or fabricated design geometry?
