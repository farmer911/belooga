---
name: belooga-frontend-engineering
description: Complete ground-truth engineering guide for the Belooga Frontend conversion to Next.js 14+ (App Router), Bun, Tailwind CSS, shadcn/ui, Zustand, and TanStack Query. Contains 16-route inventory, component hierarchy, common UI components, services architecture, design tokens, and anti-hallucination rules.
---

# 🎨 Belooga Frontend Engineering Skill & Architecture Guide

This skill serves as the authoritative, zero-hallucination engineering blueprint for the **Frontend Sub-Agent**. It defines the directory structure, design tokens, common UI components, service layer, Zustand stores, React Query hooks, and all 16 page families.

---

## 1. Technical Stack & Environment

- **Runtime & Package Manager:** `Bun 1.4+` (lightning fast package resolution, scripts, and runtime).
- **Core Framework:** `Next.js 14+` (App Router, React Server Components for SEO/marketing, Client Components for interactive workspace).
- **Styling:** `Tailwind CSS v3.4+` configured with exact Belooga design system tokens.
- **Component Primitives:** `shadcn/ui` (accessible Radix UI primitives + Tailwind styling).
- **Client State Management:** `Zustand` (authentication tokens, candidate profile draft, video modal state, search query).
- **Server State & Data Fetching:** `@tanstack/react-query v5` (caching, optimistic mutations, pagination, automatic retries).
- **Form Management & Validation:** `react-hook-form` + `zod` schemas matching backend DTOs.
- **Icons & Assets:** Strict literal imports from `/images/` (verified legacy assets). Zero synthetic SVG approximations.

---

## 2. Design System Tokens (`tailwind.config.ts`)

Configure `tailwind.config.ts` with these exact tokens:

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        brand: {
          primary: "#5bbbae",       // Signature Seafoam Teal
          hover: "#497d76",         // Darkened Interaction Teal
          accent: "#3fc6b7",        // Vibrant Highlight Teal
          dark: "#21655e",          // Deep Contrast Anchor
          blue: "#39a0e8",          // Action & Link Blue
          overlay: "#d7ecea",       // Auth Split-screen Overlay Tint
        },
        surface: {
          page: "#f8f9fa",          // Background canvas
          card: "#ffffff",          // Clean card surface
          border: "#d1d6da",        // Muted structural border
          divider: "#f0f2f5",       // Section separator
          subtle: "#fafafa",        // Subtle card highlight
        },
        typography: {
          main: "#252525",          // High contrast headline
          heading: "#515151",       // Standard header
          body: "#666666",          // Main reading copy
          muted: "#737475",         // Secondary metadata
          inverse: "#ffffff",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

---

## 3. Common UI Components Specification (`src/components/ui/`)

All common components are built on `shadcn/ui` primitives with Belooga brand customization:

### 3.1 Button (`src/components/ui/button.tsx`)
- **Variants:**
  - `default`: Background `bg-brand-primary` (`#5bbbae`), text white, hover `bg-brand-hover` (`#497d76`).
  - `secondary`: Background `bg-brand-blue` (`#39a0e8`), text white, hover `bg-blue-600`.
  - `outline`: Border `border-brand-primary`, text `text-brand-primary`, hover `bg-brand-primary/10`.
  - `ghost`: Transparent background, hover `bg-surface-subtle`.
  - `destructive`: Background `bg-red-500`, text white, hover `bg-red-600`.
- **Sizes:** `sm` (h-8 px-3 text-xs), `default` (h-10 px-4 text-sm), `lg` (h-12 px-6 text-base), `icon` (h-10 w-10).

### 3.2 Input (`src/components/ui/input.tsx`)
- Standard text, email, password input with `border-surface-border`, focus ring `ring-brand-primary`, text `text-typography-main`.
- Icon prefix and suffix slots (e.g. search icon, eye toggle).

### 3.3 Modal / Dialog (`src/components/ui/dialog.tsx`)
- Accessible overlay backdrop `bg-black/50 backdrop-blur-sm`.
- Animated slide-in and scale container `bg-surface-card rounded-lg shadow-2xl border border-surface-border`.
- Header, Title, Description, Body, Footer action button layout.

### 3.4 Card (`src/components/ui/card.tsx`)
- Clean white surface `bg-white rounded-lg border border-surface-border shadow-sm p-6`.
- Header with title, action slot (e.g. edit button), body content, and footer.

### 3.5 Badge (`src/components/ui/badge.tsx`)
- Variants: `brand` (`bg-brand-primary/15 text-brand-dark`), `neutral` (`bg-gray-100 text-typography-body`), `success` (`bg-emerald-100 text-emerald-800`).

### 3.6 Avatar (`src/components/ui/avatar.tsx`)
- Circular wrapper with fallback initials and default image `/images/avatar.jpg`.

### 3.7 Toast Notifications (`src/components/ui/toast.tsx`)
- Integrated with Radix UI Toast / Sonner for success, error, and network notification toasts.

---

## 4. Strict Anti-Hallucination Component Rules

### Rule 1: The 54px Video Elevator Pitch Play Button
Under NO circumstances hand-draw an SVG or use FontAwesome. The play button MUST be pure CSS:
```css
/* Container */
.start-content-video {
  position: relative;
  overflow: hidden;
  border-radius: 6px;
}
/* Play Overlay - Hidden by default, ONLY reveals on :hover */
.start-content-video .modal-start {
  position: absolute;
  inset: 0;
  display: none;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  transition: opacity 0.2s ease;
  z-index: 2;
}
.start-content-video:hover .modal-start {
  display: flex;
}
/* 54px White Circle */
.video-play-icon {
  width: 54px;
  height: 54px;
  background: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s ease;
}
.start-content-video:hover .video-play-icon {
  transform: scale(1.08);
}
/* Pure CSS Play Triangle */
.video-play-icon:before {
  content: "";
  display: block;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 8px 0 9px 13px;
  border-color: transparent transparent transparent #5bbbae;
  margin-left: 3px;
}
```

### Rule 2: Brand Logo Integrity
- Always use literal image file `/images/logo-big.png` with height 38px for desktop and 32px for mobile.
- Never substitute with inline text or synthetic SVG paths.

### Rule 3: Zero Global Dimension Pollution
- Never inject `width`, `height`, or `background` into `.modal-trigger` or generic interactive class names.

---

## 5. Services & State Architecture

### 5.1 API Client (`src/services/api-client.ts`)
```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth-store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send HttpOnly refresh cookies
});

// Request interceptor injecting short-lived access token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor handling 401 refresh rotation
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/v1/auth/refresh/`,
          {},
          { withCredentials: true }
        );
        const newAccessToken = refreshResponse.data.access_token;
        useAuthStore.getState().setAccessToken(newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
```

### 5.2 Zustand Client Stores (`src/store/`)
- `auth-store.ts`:
  - `accessToken: string | null`
  - `user: UserProfileSummary | null`
  - `isAuthenticated: boolean`
  - Actions: `setAccessToken()`, `setUser()`, `logout()`
- `draft-profile-store.ts`:
  - Draft state during multi-step profile editing
  - Instant field updates with optimistic rollback
- `video-modal-store.ts`:
  - `isOpen: boolean`
  - `videoUrl: string | null`
  - `title: string | null`
  - Actions: `openModal(videoUrl, title)`, `closeModal()`

### 5.3 React Query Hooks (`src/hooks/`)
- `useAuth`: `useLoginMutation`, `useRegisterMutation`, `useLogoutMutation`
- `useProfile`:
  - `useCandidateProfile(username: string)`: Fetches candidate profile
  - `useUpdateProfileMutation`: Mutates headline, bio, location
  - `useUploadAvatarMutation`: Multipart upload
- `useTimeline`:
  - `useJobExperiences()`
  - `useReorderJobExperiencesMutation`: Optimistic drag-and-drop reorder
  - `useEducationExperiences()`
  - `useAwardCertifications()`
- `useTalentSearch`:
  - `useSearchCandidates(query, page, limit)`
  - `useSearchSuggestions(query)`: Trigram debounce 300ms autocomplete

---

## 6. Directory Structure & 16-Route Mapping

```
frontend/
├── public/
│   ├── images/               # Literal legacy assets (logo-big.png, avatar.jpg, etc.)
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx                     # Route 01: Home
│   │   │   ├── blog/page.tsx                # Route 14: Blog list
│   │   │   ├── blog/[slug]/page.tsx         # Route 14: Blog detail
│   │   │   ├── careers/page.tsx             # Route 13: Careers
│   │   │   ├── help/page.tsx                # Route 12: Help & FAQs
│   │   │   ├── contact-us/page.tsx          # Route 11: Contact Us
│   │   │   ├── privacy-policy/page.tsx      # Route 10A
│   │   │   └── terms-and-conditions/page.tsx# Route 10B
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx               # Route 02: Login
│   │   │   ├── register/page.tsx            # Route 03: Register
│   │   │   ├── forgot-password/page.tsx     # Route 04: Forgot Password
│   │   │   └── activate/[key]/page.tsx      # Account Activation
│   │   ├── user/
│   │   │   └── [username]/
│   │   │       ├── page.tsx                 # Route 05: Workspace Profile
│   │   │       ├── update/page.tsx          # Route 06: Update Profile
│   │   │       └── settings/page.tsx        # Route 07: Account Settings
│   │   ├── search/page.tsx                  # Route 08: Talent Discovery
│   │   ├── public/[username]/page.tsx       # Route 09: Public Candidate View
│   │   ├── layout.tsx                       # Root layout (QueryProvider, Header, Footer)
│   │   ├── not-found.tsx                    # Route 16: 404 Error Screen
│   │   └── globals.css                      # Tailwind imports + legacy tokens
│   ├── components/
│   │   ├── ui/                              # shadcn primitives (button, dialog, input, etc.)
│   │   ├── layout/                          # Header, Footer, Sidebar, Navigation
│   │   ├── workspace/                       # VideoPitchPlayer, TimelineCard, PDFViewer
│   │   ├── search/                          # SearchBar, FilterBar, CandidateCardGrid
│   │   └── shared/                          # ModalManager, ToastProvider
│   ├── hooks/                               # React Query hooks
│   ├── services/                            # API endpoints & HTTP client
│   ├── store/                               # Zustand state stores
│   └── types/                               # TypeScript DTO interfaces
├── tailwind.config.ts
├── package.json
└── tsconfig.json
```
