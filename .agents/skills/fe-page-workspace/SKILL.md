---
name: fe-page-workspace
description: Master Orchestrator Architecture Skill for the Candidate Workspace page (/user/[username]). Defines page shell layout, unified React Query state coordination, cross-section communication, and sub-component routing.
---

# 🌐 Master Page Orchestrator Skill: Candidate Workspace (`/user/[username]`)

> **Route:** `frontend/src/app/user/[username]/page.tsx`  
> **Type:** Protected Client Workspace / Candidate Profile Management Hub  
> **Master Query Key:** `['candidate-profile', username]`  

---

## 1. Page Role & Component Hierarchy

The Candidate Workspace is the central control hub allowing candidates to manage their career identity, elevator pitch video, work history, education credentials, and technical skills.

### 📐 Target Component Decomposition Architecture (Target Refactor):
> [!WARNING] TARGET REFACTORING PATTERN – CURRENTLY INLINED IN APP ROUTER PAGE SHELL
> The tree below represents the planned Atomic Design decomposition. In the current production codebase, the workspace layout and its interactive sections are implemented within `frontend/src/app/user/[username]/page.tsx`.

```
frontend/src/app/user/[username]/page.tsx (Page Shell & Current Unified Implementation)
│
├── 1. ProfileHeaderSection (`src/components/organisms/workspace/profile-header-section.tsx`)
│      └── Avatar uploads, full name, headline, bio, seeking status, PDF resume export
│
├── 2. VideoPitchPlayerSection (`src/components/organisms/workspace/video-pitch-section.tsx`)
│      └── 30-second pitch preview, custom modal video player, unmuted/muted autoplay fallback
│
├── 3. VideoStudioModalSection (`src/components/organisms/workspace/video-studio-section.tsx`)
│      └── WebRTC recording studio, device selector, 60fps VU meter isolation, speech teleprompter, chunked upload
│
├── 4. TimelineSection (`src/components/organisms/workspace/timeline-section.tsx`)
│      └── Work Experience & Education tabs, HTML5 Drag-and-Drop reordering, CRUD modals
│
└── 5. SkillsSection (`src/components/organisms/workspace/skills-section.tsx`)
       └── Skill badges, Master Skills Catalog autocomplete, skill additions/deletions
```

---

## 2. State Management Architecture & Cross-Section Coordination

### 2.1. Server State: TanStack React Query as Single Source of Truth
Candidate profile data is fetched, cached, and coordinated through a unified query key:
```typescript
const { data: profile, isLoading, error } = useQuery({
  queryKey: ['candidate-profile', username],
  queryFn: () => apiClient.get(`/v1/profile/${username}`).then(res => res.data),
  staleTime: 1000 * 60 * 5, // 5-minute cache freshness
});
```

### 2.2. Cross-Section Communication via Invalidation
When an individual section executes a mutation, it **MUST NOT** use prop-drilled callbacks or window events. Instead, it invalidates the central query cache:
```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

// When Studio finishes uploading a new pitch video:
await queryClient.invalidateQueries({ queryKey: ['candidate-profile', username] });

// When Timeline completes a drag-and-drop reorder:
await queryClient.invalidateQueries({ queryKey: ['candidate-profile', username] });
```
👉 The Header, Pitch Player, and Timeline automatically receive fresh data without a full page reload.

---

## 3. Section Skills Routing Map

When assigned to modify a specific section of the workspace, agents must consult and ingest the corresponding skill:

| Target Functional Block | Specialized Section Skill to Ingest |
| :--- | :--- |
| Avatar, Bio, Resume PDF download, Public/Hidden visibility | `fe-section-workspace-header` |
| 30s elevator pitch preview, modal player, audio fallback | `fe-section-workspace-pitch-player` |
| WebRTC camera/mic recording, VU meter, voice-following teleprompter | `fe-section-workspace-studio` |
| Add/Edit/Delete Work Experience, Education, Drag-and-Drop reordering | `fe-section-workspace-timeline` |
| Skill badges, Master catalog search autocomplete | `fe-section-workspace-skills` |

---

## 4. QC Guardrails & Essential Shell Selectors

The following structural selectors are required by Playwright E2E suites:
* `[data-testid="workspace-container"]`: Primary page container element.
* `[data-testid="workspace-loading-spinner"]`: Skeleton/loading state indicator.
* `[data-testid="workspace-error-banner"]`: 404 candidate not found state.
