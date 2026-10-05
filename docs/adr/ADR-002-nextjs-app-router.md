# ADR-002: Next.js 16 App Router & Server/Client Segregation

* **Status:** Accepted
* **Context:** Belooga requires SEO-indexed public discovery pages (Talent Search, Public Profiles, CMS, Expert Review) combined with highly interactive private workspaces (WebRTC Studio, Drag-and-Drop Timeline).
* **Decision:** Adopt **Next.js 16 App Router (React 19)** with strict Server Component (RSC) and Client Component (`"use client"`) segregation.
* **Rationale:**
  1. **Bundle Size Minimization:** Public marketing and CMS routes remain zero-bundle-size React Server Components.
  2. **Streaming & Suspense:** Native support for `loading.tsx` and `error.tsx` route boundaries prevents full-page crash cascades.
  3. **SEO Performance:** Public profiles render pre-computed semantic HTML with OpenGraph meta tags for candidate social sharing.
* **Consequences:**
  * Interactive widgets must declare `"use client"` at the lowest possible leaf node. Root page shells must remain pure orchestrators.
