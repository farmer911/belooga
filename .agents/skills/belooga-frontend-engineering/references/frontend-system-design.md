# Frontend System Design, Applied to Belooga

`donnemartin/system-design-primer` covers almost no frontend architecture, so this file collects the frontend side from the primary docs: Next.js App Router docs (rendering, caching, `next/image`, `next/font`, `next/dynamic`), React docs (Server and Client Components, Suspense), web.dev (Core Web Vitals), and OWASP (XSS, CSRF). Each topic is mapped to Belooga code. Code is the source of truth: if a line below disagrees with `frontend/`, trust the code and fix this file.

---

## 1. Design Method (use for every new page, feature, or `/investigate` plan)

1. **Requirements.** Who sees it (anonymous + crawler, candidate, recruiter, admin)? Does it need SEO? Offline? Real-time? Which devices (375px first)?
2. **Rendering choice** (section 2). Decide per route, before writing components.
3. **Data model and API.** Which `/v1/*` endpoints, Zod schema in `frontend/src/lib/schemas.ts` (mirror of Pydantic), query keys, which mutations invalidate which keys. Batch multi-widget reads through `/v1/rpc/*`.
4. **Component tree.** Server Component page shell; push `"use client"` down to the interactive leaves; keep high-frequency state (audio level, playback time) in leaf hooks.
5. **Optimizations and failure modes.** Core Web Vitals budget (section 4), loading/error states, offline and slow network, accessibility, security.

---

## 2. Rendering Strategy (Next.js 16 App Router)

| Strategy | When | How in Next.js |
|---|---|---|
| Static (SSG) | Same HTML for everyone, rarely changes (legal pages, help) | Server Component with no dynamic APIs |
| ISR | Public content that changes hourly or daily (blog, careers, FAQ, sitemap) | `fetch(url, { next: { revalidate: N } })` or `export const revalidate = N` |
| Dynamic SSR | Per-request public data that needs SEO (public profile `/public/[username]`) | Server Component fetching at request time + `generateMetadata` |
| CSR | Private, highly interactive views (workspace, studio, Kanban, analytics) | `"use client"` component + `@tanstack/react-query` |

AS-IS in Belooga (check with the commands in section 8):
- Most components and pages are Client Components. Only `frontend/src/app/sitemap.ts` uses `revalidate`, and `frontend/src/app/public/[username]/layout.tsx` uses `generateMetadata`.
- Trap: `"use client"` at page level ships the whole subtree as JS, delays LCP on public pages, and leaves crawlers with an empty shell until hydration. For public SEO pages, fetch in a Server Component and pass data down to small client leaves.
- Never call `apiClient` inside `useEffect`; server data on the client goes through `useQuery` / `useMutation` (GEMINI.md prohibition 3).

---

## 3. Data and Cache Layers (client side)

From closest to the user outward:
1. **React state / Zustand** (`frontend/src/store/auth-store.ts`): UI and session state only, never server data copies.
2. **react-query cache** (`frontend/src/components/providers/query-provider.tsx`): `staleTime: 30_000`, `retry: 1`, `refetchOnWindowFocus: false`. After a mutation, `invalidateQueries` on the exact keys it changes. Optimistic updates must roll back in `onError`; never show success before the server confirms.
3. **Service Worker** (`frontend/public/sw.js`): cache-first static shell, stale-while-revalidate for public catalog/CMS GETs, offline mutation outbox, `AbortSignal.timeout(8000)`. Never caches `Authorization` requests, PII routes, or `Range`/`206` video.
4. **HTTP layer**: gateway `ETag` -> `304` saves bytes on unchanged public responses.
5. **Backend caches** (`references/system-design-primer.md` in `belooga-backend-engineering`). Remember the frontend can show data up to `staleTime` + backend TTL old; pick key TTLs with that sum in mind.

Waterfalls: a page that needs several resources should batch them via `/v1/rpc/*` (see `frontend/src/app/public/[username]/page.tsx`) or fetch them in parallel on the server, never chain `useQuery` calls that wait on each other unless the second truly depends on the first.

---

## 4. Performance Budget (Core Web Vitals, p75 of real users)

| Metric | Good | Main levers in this stack |
|---|---|---|
| LCP (Largest Contentful Paint) | <= 2.5 s | Server-render the hero; `next/image` with `priority` on the LCP image; preload fonts via `next/font` |
| INP (Interaction to Next Paint) | <= 200 ms | Small client bundles; keep heavy work off the main thread; `useTransition` / `useDeferredValue` for expensive updates |
| CLS (Cumulative Layout Shift) | <= 0.1 | Fixed `width`/`height` or aspect ratio on media; `next/font` (no font swap shift); reserve space for async content |

Tools already in the stack:
- `next/dynamic` code-splits heavy client widgets (used in `frontend/src/app/user/[username]/page.tsx`). Apply it to WebRTC studio, charts, and editors that are not visible on first paint.
- `next/image` is barely used and raw `<img>` tags remain (e.g. `frontend/src/app/page.tsx`); prefer `next/image` for anything above the fold.
- `next/font` is not used yet; fonts loaded any other way risk CLS and render-blocking requests.
- Measure, do not guess: `cd frontend && bun x next build` prints per-route JS size; Lighthouse or the `web-vitals` library gives LCP/INP/CLS.

---

## 5. Loading, Error, and Streaming States
- Route-level boundaries exist at the root only: `frontend/src/app/error.tsx`, `frontend/src/app/global-error.tsx`, `frontend/src/app/not-found.tsx`. Add `app/**/loading.tsx` or a `<Suspense>` boundary for slow server segments so the shell streams first.
- Every query renders three states: loading skeleton (same size as content, no CLS), error with retry, and empty state. Never mask a failed request with placeholder arrays (`fe_mock_fallback_arrays == 0`).

---

## 6. Network Resilience
- Timeouts on every fetch (`AbortSignal.timeout`), bounded retry (`retry: 1`), and visible error states.
- Offline: queue editor saves through the SW outbox (`queueOfflineMutation`) and sync on reconnect; tell the user it is queued, not saved.
- Lie-fi (connected but useless network) is the common case on mobile: never block UI on a request without a timeout.

---

## 7. Security and Accessibility on the Client
- **Tokens:** access token in memory, refresh token in HttpOnly `samesite="lax"` cookie set by the backend; never in `localStorage` / `sessionStorage`.
- **XSS:** React escapes by default. `dangerouslySetInnerHTML` is allowed only for trusted static content (theme bootstrap script and JSON-LD in `frontend/src/app/layout.tsx`); never pass user content to it.
- **CSRF:** the `lax` refresh cookie plus bearer access token on mutations; do not add cookie-only auth to mutation endpoints.
- **Accessibility:** semantic elements, labelled inputs, focus trap and return in dialogs, `aria-hidden="true"` on decorative `lucide-react` icons, `prefers-reduced-motion` honored in `frontend/src/app/globals.css`, 375px with zero horizontal overflow.

---

## 8. Verify Before Claiming

```bash
grep -rl '^"use client"' frontend/src/app frontend/src/components | wc -l
grep -rnE "revalidate|generateMetadata|generateStaticParams" frontend/src/app
grep -rn "<img " frontend/src
cd frontend && bun x next build
```

## 9. Review Checklist (cite in `fe-code-review` and `/investigate`)
- Is the rendering choice for each new route deliberate (section 2), and is `"use client"` as low in the tree as possible?
- Are new public pages server-rendered with metadata, or at least not an empty client shell?
- Does every mutation invalidate exactly the keys it changes, with rollback on error?
- Are heavy widgets split with `next/dynamic`, images on `next/image`, sizes reserved (CLS)?
- Does every request have a timeout, a loading state, an error state, and an empty state?
- Any new client cache (SW, react-query) that could store authenticated or PII data? Reject.
