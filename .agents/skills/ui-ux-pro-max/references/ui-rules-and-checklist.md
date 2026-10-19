# Common Rules for Professional UI & Pre-Delivery Checklist

These are frequently overlooked issues that make UI look unprofessional.

## Icons & Visual Elements

- Primary Belooga stack icon library: **Lucide (`lucide-react`)** (or **Phosphor (`@phosphor-icons/react`)** / **Heroicons (`@heroicons/react`)** for external datasets). The icons in `icons.csv` list common semantic recommendations.
- When recommendations lack an exact match:
  - Prefer choosing any semantic icon from `lucide-react` in Belooga frontend components while maintaining stroke and visual style consistency.

| Rule | Standard | Avoid | Why It Matters |
|------|----------|--------|----------------|
| **No Emoji as Structural Icons** | Use vector-based SVG icons (Phosphor, Heroicons, Lucide). | Using emojis (🎨 🚀 ⚙️) for navigation, settings, or controls. | Emojis are platform-dependent, inconsistent, and lack design token control. |
| **Vector-Only Assets** | Use SVG or platform vector icons that scale cleanly. | Raster PNG icons that blur or pixelate. | Ensures scalability, crisp rendering, and dark/light mode adaptability. |
| **Contextual Semantics** | Use `aria-hidden="true"` for decorative icons beside visible text; give standalone icons accessible labels. | Treating one icon name as permanently decorative or interactive. | The same glyph serves different purposes across components. |
| **Stable Interaction States** | Use color, opacity, or elevation transitions for press states without changing layout bounds. | Layout-shifting transforms that move surrounding content. | Prevents visual jitter and preserves perceived polish. |
| **Consistent Icon Sizing** | Define icon sizes as design tokens (e.g., 16px, 20px, 24px). | Mixing arbitrary values like 21px / 27px randomly. | Maintains rhythm and visual hierarchy across the interface. |
| **Stroke Consistency** | Use consistent stroke width within the same visual layer (e.g., 1.5px or 2px). | Mixing thick and thin stroke styles arbitrarily. | Inconsistent strokes reduce perceived polish. |
| **Touch Target Minimum** | Minimum 44x44px; expand hit area when visual icon is smaller. | Tiny tap targets without padding. | Mobile touch accessibility compliance. |
| **Icon Contrast** | Meaningful icons and control boundaries need at least 3:1 against background. | Low-contrast icons that carry state. | WCAG non-text contrast requirement. |

---

## Interaction Rules

| Rule | Do | Don't |
|------|----|-------|
| **Tap / Click feedback** | Provide immediate visual feedback (opacity/color/elevation) within 80-150ms | No visual response on click/tap |
| **Animation timing** | Use shared transition tokens (e.g. 150-250ms ease-out) | One duration copied blindly everywhere |
| **Accessibility focus** | Ensure visible focus ring and logical tab order | Hiding outline (`outline: none`) without focus-visible replacement |
| **Disabled state clarity** | Use disabled attributes, reduced opacity, and pointer-events prevention | Controls that look clickable but do nothing |
| **Semantic controls** | Prefer native `<button>`, `<a>`, `<input>` elements | `<div>` with `onClick` lacking keyboard listeners and roles |

---

## Light/Dark Mode Contrast

| Rule | Do | Don't |
|------|----|-------|
| **Surface readability (light)** | Separate cards from page background with subtle border or shadow | Overly transparent surfaces that blur hierarchy |
| **Text contrast (light)** | Maintain body text contrast >= 4.5:1 against background | Low-contrast light gray body text |
| **Text contrast (dark)** | Maintain body text contrast >= 4.5:1 on dark surfaces; 3:1 for large headings | Muted text falling below readable thresholds |
| **Border visibility** | Ensure borders and dividers are visible in both themes | Theme-specific borders disappearing in dark mode |
| **Token-driven theming** | Use semantic CSS/Tailwind variables mapped per theme | Hardcoded hex values scattered in components |

---

## Layout & Spacing

| Rule | Do | Don't |
|------|----|-------|
| **Consistent spacing scale** | Use standard 4px / 8px spacing increments (e.g., 8, 16, 24, 32, 48, 64px) | Random spacing values (e.g., 13px, 27px) |
| **Readable text measure** | Restrict body copy line length to 45–75 characters (max-w-prose / ~65ch) | Full-width text stretching across wide monitors |
| **Responsive breakpoints** | Test layouts across 375px (mobile), 768px (tablet), 1024px, and 1440px | Desktop-only layouts that break on mobile screens |
| **Content clearance** | Ensure sticky footers/headers do not obscure content or interactive controls | Fixed banners overlapping bottom navigation |

---

## Pre-Delivery Checklist

Before delivering UI components or pages, verify these items:

### Visual Quality
- [ ] No emojis used as structural UI icons (use SVG vector icons instead).
- [ ] All icons come from a consistent icon family and stroke style.
- [ ] Pressed-state visuals do not shift layout bounds or cause visual jitter.
- [ ] Semantic theme tokens are used consistently (no hardcoded hex colors).

### Interaction & Feedback
- [ ] Clickable elements provide hover and active states (transitions between 150-250ms).
- [ ] `cursor-pointer` on all interactive buttons and links.
- [ ] Focus rings are visible for keyboard navigation (`focus-visible:ring-2`).
- [ ] Disabled states are visually distinct and suppress click handlers.

### Light/Dark Mode
- [ ] Primary text contrast >= 4.5:1 in both light and dark mode.
- [ ] Secondary / muted text contrast meets minimum readability standards.
- [ ] Borders and surface dividers are visible across themes.

### Layout & Responsiveness
- [ ] Tested on mobile (375px) and desktop (1280px+).
- [ ] No horizontal overflow or unintentional scrollbars.
- [ ] Spacing follows a consistent 4px / 8px rhythm.

### Accessibility
- [ ] Decorative icons have `aria-hidden="true"`.
- [ ] Icon-only buttons have descriptive `aria-label` or visually hidden screen reader text.
- [ ] Form inputs have associated `<label>` tags and clear validation error messages.
- [ ] Respects `prefers-reduced-motion` media query.
