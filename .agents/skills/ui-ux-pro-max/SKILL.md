---
name: ui-ux-pro-max
description: UI/UX design intelligence for web, mobile, and desktop. Use when designing, building, reviewing, or fixing interfaces, pages, components, design systems, layouts, typography, color palettes, charts, and stack-specific UI implementation.
---

# UI/UX Pro Max

AI design intelligence powered by local datasets: styles, palettes, font pairings, UX guidelines, icons, animation presets, charts, and tech stacks.

## Prerequisites

The search engine runs locally using Python 3 standard library only (zero third-party packages, zero network calls, zero npm packages):

```bash
python3 --version
```

---

## How to Use This Skill

Use this skill when the user requests any of the following:

| Scenario | Trigger Examples | Action |
|----------|------------------|--------|
| **New page / layout** | "Tạo landing page", "Build dashboard" | Step 1 → Step 2 (`--design-system`) |
| **New component** | "Create pricing card", "Fix modal focus" | Step 3 (`--domain ux` or component search) |
| **Pick colors & fonts** | "Tư vấn bảng màu", "Font pairing cho SaaS" | Step 2 or Step 3 (`--domain color/typography`) |
| **Review UI / audit** | "Review trang này", "Kiểm tra UX" | See `references/ui-rules-and-checklist.md` |
| **Fix UI / styling bug** | "Button hover bị giật", "Contrast kém" | Step 3 (`--domain style/ux`) |
| **Data visualization** | "Thêm biểu đồ doanh thu" | Step 3 (`--domain chart`) |
| **Stack best practices** | "Next.js 16 UI tips", "Tailwind best practice" | Step 4 (`--stack nextjs/react/html-tailwind`) |

---

## Workflow & Commands

All commands run the local search engine at `.agents/skills/ui-ux-pro-max/scripts/search.py`.

### Step 1: Analyze Requirements
Identify product type (SaaS, E-commerce, Fintech, Tool, etc.), audience, visual tone (minimal, modern, vibrant), and target stack.

### Step 2: Generate Design System (New Projects / Pages)
Use `--design-system` to aggregate style, color palette, typography, layout pattern, and anti-patterns:

```bash
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "<product_type> <industry> <keywords>" --design-system [-p "Project Name"]
```

**Example:**
```bash
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "recruitment career talent platform" --design-system -p "Belooga"
```

#### Design Dials (Tuning 1–10)
Tune visual personality without rewriting queries:
- `--variance <1-10>`: 1 = minimal/centered, 10 = bold/asymmetric
- `--motion <1-10>`: 1 = subtle micro-interactions, 10 = complex choreography
- `--density <1-10>`: 1 = spacious (marketing), 10 = dense (dashboards/tables)

```bash
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "recruitment dashboard" --design-system --variance 6 --motion 5 --density 7
```

#### Persist Design System
Save the generated system as the project Source of Truth:

```bash
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "Project Name" --output-dir "."
```

---

### Step 3: Domain Searches (Targeted Details)
Query specific domains for deep guidance:

```bash
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain <domain> [-n <max_results>]
```

| Need | Domain | Example |
|------|--------|---------|
| Styles & effects | `style` | `python3 .agents/skills/ui-ux-pro-max/scripts/search.py "glassmorphism dark" --domain style` |
| Color palettes | `color` | `python3 .agents/skills/ui-ux-pro-max/scripts/search.py "saas modern vibrant" --domain color` |
| Font pairings | `typography` | `python3 .agents/skills/ui-ux-pro-max/scripts/search.py "professional modern sans" --domain typography` |
| Charts & data viz | `chart` | `python3 .agents/skills/ui-ux-pro-max/scripts/search.py "real-time analytics" --domain chart` |
| UX best practices | `ux` | `python3 .agents/skills/ui-ux-pro-max/scripts/search.py "inline validation error" --domain ux` |
| Landing structure | `landing` | `python3 .agents/skills/ui-ux-pro-max/scripts/search.py "hero social proof" --domain landing` |
| React performance | `react` | `python3 .agents/skills/ui-ux-pro-max/scripts/search.py "rerender memo list" --domain react` |
| Icons | `icons` | `python3 .agents/skills/ui-ux-pro-max/scripts/search.py "search user settings" --domain icons` |
| GSAP animations | `gsap` | `python3 .agents/skills/ui-ux-pro-max/scripts/search.py "stagger reveal" --domain gsap` |

---

### Step 4: Stack Guidelines
Retrieve verified implementation rules for the project stack:

```bash
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "<query>" --stack <stack>
```

**Common Stacks:** `nextjs`, `react`, `html-tailwind`, `shadcn`, `threejs`, `vue`, `svelte`, `astro`.

**Example:**
```bash
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "form validation server actions" --stack nextjs
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "responsive navbar" --stack html-tailwind
```

---

## Detailed References & Primer 3-Tier Design Token SSOT (`tokens/design-tokens.json`)

- **Mandatory W3C 3-Tier Primer Design Token SSOT:** Every Design (`role:design`), Frontend (`frontend/`), and Mobile (`mobile/`) change must treat `tokens/design-tokens.json` (`base` -> `semantic` [`light`, `dark`, `neumorphic`] -> `component`) as the single source of truth, synchronized across `frontend/src/app/globals.css`, `frontend/src/lib/design-tokens.ts`, and `mobile/src/theme/tokens.ts` via `python3 scripts/sync-design-tokens.py --check` (`fe_arbitrary_hex == 0`, zero raw `#hex` in Canvas/WebGL).
- See `.agents/skills/ui-ux-pro-max/references/search-reference.md` for full domain tables and query strategies.
- See `.agents/skills/ui-ux-pro-max/references/ui-rules-and-checklist.md` for iconography standards, contrast requirements, and pre-delivery checklist.
