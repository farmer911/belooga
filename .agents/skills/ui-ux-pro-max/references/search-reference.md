# Search Reference & Query Strategy

## Available Domains

| Domain | Use For | Example Keywords |
|--------|---------|------------------|
| `product` | Product type recommendations | SaaS, e-commerce, portfolio, healthcare, beauty, service |
| `style` | UI styles, colors, effects | glassmorphism, minimalism, dark mode, brutalism |
| `typography` | Font pairings, Google Fonts | elegant, playful, professional, modern |
| `color` | Color palettes by product type | saas, ecommerce, healthcare, beauty, fintech, service |
| `landing` | Page structure, CTA strategies | hero, hero-centric, testimonial, pricing, social-proof |
| `chart` | Chart types, library recommendations | trend, comparison, timeline, funnel, pie |
| `ux` | Best practices, anti-patterns | animation, accessibility, z-index, loading |
| `gsap` | GSAP animation skeletons by intensity tier | scroll reveal, stagger, magnetic cursor, page transition |
| `react` | React/Next.js performance | waterfall, bundle, suspense, memo, rerender, cache |
| `web` | App interface guidelines (iOS/Android/React Native) | accessibilityLabel, touch targets, safe areas, Dynamic Type |
| `icons` | Icon recommendations with import code | arrow, navigation, lucide, phosphor |
| `google-fonts` | Individual Google Fonts lookup | sans serif, monospace, japanese, variable font, popular |

---

## Available Stacks

Supported stack rule sets in `data/stacks/`:

`react`, `nextjs`, `vue`, `svelte`, `astro`, `swiftui`, `react-native`, `flutter`, `nuxtjs`, `nuxt-ui`, `html-tailwind`, `shadcn`, `jetpack-compose`, `threejs`, `angular`, `laravel`, `javafx`, `wpf`, `winui`, `avalonia`, `uno`, `uwp`

**JavaFX / Desktop examples:**

```bash
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "atlantafx primer enterprise theme" --stack javafx
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "enterprise tableview density permission" --stack javafx
```

---

## Example Workflow

**User request:** "Make an AI search homepage"

### Step 1: Analyze Requirements
- Product type: Tool (AI search engine)
- Target audience: End users looking for fast, intelligent search
- Style keywords: modern, minimal, content-first, dark mode
- Stack: Next.js, detected from the project

### Step 2: Generate Design System

```bash
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "AI search tool modern minimal" --design-system -p "AI Search"
```

**Output:** Complete design system with pattern, style, colors, typography, effects, and anti-patterns.

### Step 3: Supplement with Detailed Searches (as needed)

```bash
# Get style options for a modern tool product
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "minimalism dark mode" --domain style

# Get UX best practices for search interaction and loading
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "search loading animation" --domain ux
```

### Step 4: Stack Guidelines

```bash
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "streaming suspense" --stack nextjs
```

**Then:** Synthesize design system + detailed searches and implement the design.

---

## Output Formats

The `--design-system` flag supports two output formats:

```bash
# ASCII box (default) - best for terminal display
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "fintech crypto" --design-system

# Markdown - best for documentation
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "fintech crypto" --design-system -f markdown
```

---

## Tips for Better Results

### Query Strategy

- Keep one dominant intent and 2–5 meaningful terms per query: `"keyboard focus modal"`, not a full audit checklist.
- Retry once with a narrower phrase or explicit domain/stack; do not cycle through unrelated keywords.
- Use `--design-system` for a new project/page; use `--domain` for a focused concern.
- Add `--stack <stack>` for implementation-specific guidance when the target stack is known.

### Common Sticking Points

| Problem | What to Do |
|---------|------------|
| Can't decide on style/color | Verify the category, then retry once with one product and one tone |
| Dark mode contrast issues | `"color-dark-mode color-accessible-pairs" --domain ux` |
| Animations feel unnatural | `"spring-physics easing" --domain ux` |
| Form UX is poor | `"inline-validation error-clarity" --domain ux` |
| Navigation feels confusing | `"nav-hierarchy back-behavior" --domain ux` |
| Layout breaks on small screens | `"mobile-first breakpoint-consistency" --domain ux` |
| Performance / jank | `"virtualize-lists debounce-throttle" --domain ux` |
