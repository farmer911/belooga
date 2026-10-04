---
name: fe-patterns-and-practices
description: Authoritative Technical Standard & Master Design Patterns for Senior Frontend Engineers. Enforces zero-compromise best practices across Atomic Design sizing, Headless UI, 4-Tier State Segregation, 60fps Leaf-Node Canvas Isolation, 3-Tier Design Tokens via CVA, WCAG 2.1 AA Accessibility, and GoF patterns (Adapter/Mapper, Finite State Machine, Command Pattern, Proxy/Interceptor).
---

# 🎨 SENIOR FRONTEND ENGINEER — PRODUCTION PATTERNS & STANDARDS

> **Role Authority:** Senior Frontend Engineer (10+ Years Experience)  
> **Status:** MANDATORY & ENFORCED FOR ALL FRONTEND IMPLEMENTATIONS  
> **Core Principle:** ZERO-COMPROMISE PRODUCTION STANDARD. No trade-offs that cause DOM thrashing, frame drops, state spaghetti, CSS drift, or accessibility barriers.

---

## 1. COMPONENT ARCHITECTURE & SIZING LIMITS

Every frontend file must strictly adhere to the **Atomic Design Hierarchy**. Components exceeding these bounds must be rejected immediately:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ATOMS (< 50 LOC)                                         │
│ • Button, Input, Badge, Typography, Avatar, Spinner         │
│ • Zero business logic, zero API calls, zero store listeners │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. MOLECULES (< 100 LOC)                                    │
│ • SearchBar (Input + Button), FormField (Label+Input+Error) │
│ • Simple composition, local transient props only            │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. ORGANISMS (< 300 LOC)                                    │
│ • ProfileHeader, VideoStudio, TimelineSection, SearchGrid   │
│ • Coordinates molecules and atoms; consumes headless hooks  │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. TEMPLATES (< 150 LOC)                                    │
│ • WorkspaceLayout, AuthSplitLayout, PublicPageLayout        │
│ • Defines structural grids, responsive slots, zero raw data │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. PAGES (< 100 LOC)                                        │
│ • Next.js route entrypoint (app/.../page.tsx)               │
│ • PURE ORCHESTRATOR: parses params, initializes TanStack    │
│   Query boundaries, renders Organisms. ZERO inline JSX divs │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. STRUCTURAL PATTERN: ADAPTER / MAPPER PATTERN (DTO TO VIEWMODEL)

* **Technical Definition:** A translation layer that normalizes raw backend API responses (snake_case, nullable database fields) into clean, type-safe Frontend ViewModels (camelCase, deterministic fallbacks).
* **The Problem It Solves:** Prevents frontend crashes caused by missing fields (`Cannot read properties of undefined`) and isolates the UI from backend schema migrations.
* **Best Practice Blueprint:**
  ```typescript
  // /types/candidate.dto.ts (Raw Backend Response)
  export interface CandidateProfileDTO {
    id: string;
    identity_id: string;
    first_name: string;
    last_name: string;
    headline: string | null;
    avatar_url: string | null;
    is_hidden: boolean;
  }

  // /types/candidate.vm.ts (Frontend ViewModel)
  export interface CandidateProfileViewModel {
    id: string;
    fullName: string;
    headline: string;
    avatarUrl: string;
    isVisible: boolean;
  }

  // /adapters/candidate.adapter.ts
  export function toCandidateViewModel(dto: CandidateProfileDTO): CandidateProfileViewModel {
    return {
      id: dto.id,
      fullName: `${dto.first_name} ${dto.last_name}`.trim() || "Anonymous Candidate",
      headline: dto.headline ?? "Open to opportunities",
      avatarUrl: dto.avatar_url ?? "/images/default-avatar.svg",
      isVisible: !dto.is_hidden,
    };
  }
  ```
* **Rejection Trigger:** Consuming raw `snake_case` DTO properties directly inside leaf UI components.

---

## 3. BEHAVIORAL PATTERN: FINITE STATE MACHINE (FSM) PATTERN

* **Technical Definition:** Models component behavior as a finite set of discrete states, with explicit allowed transitions triggered by specific events.
* **The Problem It Solves:** Eliminates "impossible UI states" caused by multiple boolean flags (e.g. `isLoading: true` and `isError: true` occurring simultaneously).
* **Best Practice Blueprint (WebRTC Video Studio FSM):**
  ```typescript
  export type StudioState =
    | { status: "idle" }
    | { status: "requesting_devices" }
    | { status: "device_ready"; stream: MediaStream }
    | { status: "recording"; stream: MediaStream; durationSec: number }
    | { status: "paused"; stream: MediaStream; durationSec: number }
    | { status: "transcoding"; blob: Blob }
    | { status: "uploading"; progress: number }
    | { status: "completed"; videoUrl: string }
    | { status: "error"; message: string };

  export type StudioAction =
    | { type: "INIT_DEVICES" }
    | { type: "DEVICES_GRANTED"; stream: MediaStream }
    | { type: "START_RECORDING" }
    | { type: "TICK" }
    | { type: "STOP_RECORDING"; blob: Blob }
    | { type: "UPLOAD_PROGRESS"; progress: number }
    | { type: "UPLOAD_SUCCESS"; videoUrl: string }
    | { type: "FAIL"; error: string };

  export function studioReducer(state: StudioState, action: StudioAction): StudioState {
    switch (state.status) {
      case "idle":
        if (action.type === "INIT_DEVICES") return { status: "requesting_devices" };
        break;
      case "requesting_devices":
        if (action.type === "DEVICES_GRANTED") return { status: "device_ready", stream: action.stream };
        if (action.type === "FAIL") return { status: "error", message: action.error };
        break;
      case "device_ready":
        if (action.type === "START_RECORDING") return { status: "recording", stream: state.stream, durationSec: 0 };
        break;
      case "recording":
        if (action.type === "TICK") return { ...state, durationSec: state.durationSec + 1 };
        if (action.type === "STOP_RECORDING") return { status: "transcoding", blob: action.blob };
        break;
      // Additional deterministic transitions...
    }
    return state;
  }
  ```

---

## 4. BEHAVIORAL PATTERN: COMMAND PATTERN (UNDO / REDO)

* **Technical Definition:** Encapsulates a UI mutation as an object containing all information necessary to execute the action or revert (undo) it.
* **When to Use:** Career timeline drag-and-drop reordering, accidental skill badge deletions, form section reverts.
* **Best Practice Blueprint:**
  ```typescript
  export interface Command {
    execute(): Promise<void>;
    undo(): Promise<void>;
  }

  export class ReorderTimelineCommand implements Command {
    constructor(
      private timelineService: TimelineService,
      private profileId: string,
      private fromIndex: number,
      private toIndex: number
    ) {}

    async execute(): Promise<void> {
      await this.timelineService.reorder(this.profileId, this.fromIndex, this.toIndex);
    }

    async undo(): Promise<void> {
      await this.timelineService.reorder(this.profileId, this.toIndex, this.fromIndex);
    }
  }

  export class CommandHistoryManager {
    private undoStack: Command[] = [];
    private redoStack: Command[] = [];

    async executeCommand(cmd: Command): Promise<void> {
      await cmd.execute();
      this.undoStack.push(cmd);
      this.redoStack = [];
    }

    async undo(): Promise<void> {
      const cmd = this.undoStack.pop();
      if (cmd) {
        await cmd.undo();
        this.redoStack.push(cmd);
      }
    }
  }
  ```

---

## 5. STRUCTURAL PATTERN: PROXY / INTERCEPTOR PATTERN (SILENT TOKEN REFRESH)

* **Technical Definition:** Intercepts outgoing HTTP requests and incoming responses to transparently handle cross-cutting network concerns.
* **When to Use:** Authentication expiration: catching `401 Unauthorized`, pausing downstream requests, refreshing the JWT via `/auth/refresh`, and silently replaying the original request.
* **Best Practice Blueprint:**
  ```typescript
  let isRefreshing = false;
  let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return apiClient(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const { accessToken } = await refreshAuthToken();
          useAuthStore.getState().setAccessToken(accessToken);
          failedQueue.forEach((prom) => prom.resolve(accessToken));
          failedQueue = [];
          originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        } catch (refreshErr) {
          failedQueue.forEach((prom) => prom.reject(refreshErr));
          failedQueue = [];
          useAuthStore.getState().logout();
          return Promise.reject(refreshErr);
        } finally {
          isRefreshing = false;
        }
      }
      return Promise.reject(error);
    }
  );
  ```

---

## 6. STRUCTURAL PATTERN: POLYMORPHIC COMPONENT PATTERN (`asChild`)

* **Technical Definition:** Enables a component to forward its styles, behavior, and accessibility props to an alternative child element (e.g. rendering a `<Button>` as a Next.js `<Link>`) without DOM wrapper duplication.
* **Best Practice Blueprint (Radix Slot Composition):**
  ```tsx
  import { Slot } from "@radix-ui/react-slot";
  import { cva, type VariantProps } from "class-variance-authority";

  export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
  }

  export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
      const Comp = asChild ? Slot : "button";
      return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
    }
  );
  ```

---

## 7. 4-TIER STATE SEGREGATION PROTOCOL

State must be categorized into one of 4 strict tiers. Mixing tiers is an immediate rejection trigger:

| State Tier | Authoritative Tool | Permitted Usage | FORBIDDEN Anti-Pattern |
| :--- | :--- | :--- | :--- |
| **Tier 1: Server State** | **TanStack React Query** | Caching API responses, pagination, background refetching, optimistic updates. | Storing API response payloads in Zustand or `useState`. |
| **Tier 2: Global Client State**| **Zustand** | App-wide ephemeral client settings: auth session, theme mode, global drawer state. | Storing server entity collections in Zustand. |
| **Tier 3: URL State** | **Next.js SearchParams (`nuqs`)** | Any state that must survive page reload or be shareable: search keywords, filter badges, page index. | Keeping active search query strings purely in component `useState`. |
| **Tier 4: High-Frequency** | **`useRef` / Direct Canvas** | Telemetry updating at 30Hz–60Hz: audio decibel VU meters, video scrubbing bars, cursors. | Setting React state 60 times/second, triggering full-tree Virtual DOM reconciliation. |

---

## 8. 60FPS LEAF-NODE ISOLATION PATTERN

* **The Invariant:** High-frequency audio/visual telemetry must NEVER trigger reconciliation on parent components or siblings.
* **Canvas VU Meter Blueprint:**
  ```tsx
  export function AudioVUMeter({ stream }: { stream: MediaStream | null }) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
      if (!stream || !canvasRef.current) return;
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      let animId: number;
      const render = () => {
        analyser.getByteFrequencyData(dataArray);
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Paint decibel bars directly on hardware canvas
          }
        }
        animId = requestAnimationFrame(render);
      };
      render();

      return () => {
        cancelAnimationFrame(animId);
        audioContext.close();
      };
    }, [stream]);

    // Isolated Leaf Node: Parent re-renders = 0
    return <canvas ref={canvasRef} width={240} height={20} className="rounded" />;
  }
  ```

---

## 9. DESIGN SYSTEM INTEGRATION & ZERO ARBITRARY TOKENS

1. **3-Tier Design Tokens:**
   * Tier 1: Primitive (`colors.blue.500`) ➔ Tier 2: Semantic (`color.brand.primary`) ➔ Tier 3: Component (`button.primary.bg`).
   * **STRICT PROHIBITION:** Arbitrary Tailwind hex classes like `bg-[#0f172a]`, `text-[#ffffff]`, `w-[54px]`. Only semantic tokens (`bg-surface-elevated`, `text-primary`) are permitted.
2. **Component Variance Authority (CVA):**
   * Reusable atoms and molecules must define variants using CVA.

---

## 10. ACCESSIBILITY (WCAG 2.1 AA) INVARIANTS

1. **Focus Trapping:** Active dialogs/modals must trap keyboard focus (`Tab` / `Shift+Tab`) within the modal boundary.
2. **Keyboard Escapability:** Pressing `Escape` must dismiss any active modal, popover, or dropdown.
3. **Semantic Tags:** Interactive elements must be native `<button>` or `<a href>`. Using `<div onClick>` without ARIA role and keyboard handlers is an immediate rejection trigger.
4. **Deterministic Locators:** Every interactive element must provide a dedicated `data-testid` attribute for automated E2E testing.

---

## 11. COMPLEXITY CONTROL & PERFORMANCE BUDGETS

Frontend applications are distributed client systems running on constrained hardware. Senior Frontend Engineers must enforce strict computational and cognitive complexity budgets:

### 11.1. Algorithmic Complexity in JSX (The $O(1)$ Lookup Rule)
* **The Invariant:** Chaining `.filter().map()` inside JSX render blocks is **STRICTLY PROHIBITED**.
  ```tsx
  // REJECT: O(N * M) executed on EVERY re-render
  {candidates.map(candidate => (
    <Card key={candidate.id}>
      {skills.filter(s => s.candidateId === candidate.id).map(renderSkill)}
    </Card>
  ))}
  ```
* **Mandatory Standard:** Normalize relational data into $O(1)$ Hash Maps (`Map<string, Skill[]>` or `Record<string, Skill[]>`) within the **Adapter Layer** or a memoized selector (`useMemo`), reducing rendering loops from $O(N \times M)$ to linear $O(N)$.

### 11.2. Frame Budget (16.6ms) & Long Task Budget (< 50ms)
* **60fps Frame Budget:** Any UI animation, Canvas drawing, or reactive telemetry must execute in under **16.6ms**.
* **Zero Long Tasks:** No synchronous JavaScript execution on the browser main thread may exceed **50ms** (guaranteeing Interaction to Next Paint - INP $\le 200\text{ms}$).
* **Heavy Offloading:** CPU-intensive computations (e.g. video transcode chunking, large CSV imports) must be offloaded to a **Web Worker**.

### 11.3. Cyclomatic Complexity Limit ($\le 10$) & Component Flattening
* **The Rule:** No component or hook may exceed a Cyclomatic Complexity of **10**.
* **The Invariant:** Max nesting depth of ternary expressions or conditional blocks is **1**.
  * FORBIDDEN: Nested ternaries: `condition ? a : (otherCondition ? b : c)`.
  * MANDATORY: Extract sub-components or use guard clauses / early returns.

### 11.4. Memory Leak & Resource Cleanup Invariants
* **The Rule:** Any `useEffect` subscribing to hardware streams, WebSockets, or DOM listeners must implement strict idempotent teardown:
  ```tsx
  useEffect(() => {
    const stream = ...;
    return () => {
      // Mandatory: Stop hardware tracks immediately on unmount
      stream.getTracks().forEach(track => track.stop());
      audioContext.close();
    };
  }, []);
  ```

### 11.5. The Rule of Three (Anti-Overengineering & YAGNI)
* **The Invariant:** Do not construct speculative Compound Components, Provider hierarchies, or complex factories for one-off widgets.
* Abstract logic into reusable components ONLY when identical UI patterns occur $\ge 3$ times across separate routes.

---

## 12. REJECTION CHECKLIST FOR SENIOR FRONTEND CODE

Before submitting any code for review, verify:
- [ ] Zero $O(N \times M)$ nested `.filter().map()` inside JSX; $O(1)$ Hash Maps used for relational lookups.
- [ ] Frame Budget respected: High-frequency telemetry executes in $< 16.6\text{ms}$ with zero parent re-renders.
- [ ] Zero synchronous Long Tasks ($> 50\text{ms}$) on the main thread.
- [ ] Cyclomatic complexity $\le 10$; zero nested ternary operators in JSX.
- [ ] All hardware media streams and audio contexts implement idempotent cleanup in `useEffect`.
- [ ] Raw API DTOs are mapped through an **Adapter** into ViewModels before reaching UI components.
- [ ] Complex multi-stage asynchronous interactions implement a **Finite State Machine**.
- [ ] Component is under line limit: Atoms <50, Molecules <100, Organisms <300, Pages <100 LOC.
- [ ] Page component contains zero inline layout DOM or raw HTML tags.
- [ ] No high-frequency telemetry exists in React `useState`.
- [ ] No API responses are copied into Zustand or local component state.
- [ ] Zero arbitrary Tailwind hex values (`[#...]`) or non-standard pixel dimensions.
- [ ] TypeScript passes with zero `any` types (`bun x tsc --noEmit` exits with 0).
- [ ] Every interactive element includes a semantic `data-testid`.
