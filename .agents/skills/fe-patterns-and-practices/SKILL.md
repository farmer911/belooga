---
name: fe-patterns-and-practices
description: Authoritative Technical Standard & Master Design Patterns for Senior Frontend Engineers. Enforces zero-compromise best practices across Atomic Design sizing, Headless UI, 4-Tier State Segregation, 60fps Leaf-Node Canvas Isolation, 3-Tier Design Tokens via CVA, and WCAG 2.1 AA Accessibility.
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

## 2. HEADLESS UI & INVERSION OF CONTROL (IoC) PATTERN

* **The Rule:** Presentation components must never contain device I/O, WebRTC, MediaRecorder, speech synthesis, or complex timers. All non-visual state machines must reside in **Custom Hooks**.
* **Best Practice Blueprint:**
  ```tsx
  // /hooks/use-media-recorder.ts (Headless Logic Engine)
  export function useMediaRecorder({ maxDurationSec = 30 }: UseMediaRecorderOptions) {
    const [status, setStatus] = useState<RecorderStatus>("idle");
    const [duration, setDuration] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const videoPreviewRef = useRef<HTMLVideoElement | null>(null);

    const startRecording = useCallback(async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoPreviewRef.current) videoPreviewRef.current.srcObject = stream;
      // Initialize MediaRecorder...
      setStatus("recording");
    }, []);

    const stopRecording = useCallback(() => {
      mediaRecorderRef.current?.stop();
      setStatus("stopped");
    }, []);

    return { status, duration, videoPreviewRef, startRecording, stopRecording };
  }

  // /components/organisms/video-studio-section.tsx (Pure View Component)
  export function VideoStudioSection() {
    const { status, duration, videoPreviewRef, startRecording, stopRecording } = useMediaRecorder({ maxDurationSec: 30 });
    return (
      <Card className="p-6">
        <video ref={videoPreviewRef} autoPlay playsInline muted className="w-full rounded-lg" />
        <StudioControls status={status} duration={duration} onStart={startRecording} onStop={stopRecording} />
      </Card>
    );
  }
  ```

---

## 3. 4-TIER STATE SEGREGATION PROTOCOL

State must be categorized into one of 4 strict tiers. Mixing tiers is an immediate rejection trigger:

| State Tier | Authoritative Tool | Permitted Usage | FORBIDDEN Anti-Pattern |
| :--- | :--- | :--- | :--- |
| **Tier 1: Server State** | **TanStack React Query** | Caching API responses, pagination, background refetching, optimistic updates. | Storing API response payloads in Zustand or `useState`. |
| **Tier 2: Global Client State**| **Zustand** | App-wide ephemeral client settings: auth session, theme mode, global drawer state. | Storing server entity collections in Zustand. |
| **Tier 3: URL State** | **Next.js SearchParams (`nuqs`)** | Any state that must survive page reload or be shareable: search keywords, filter badges, page index. | Keeping active search query strings purely in component `useState`. |
| **Tier 4: High-Frequency** | **`useRef` / Direct Canvas** | Telemetry updating at 30Hz–60Hz: audio decibel VU meters, video scrubbing bars, cursors. | Setting React state 60 times/second, triggering full-tree Virtual DOM reconciliation. |

---

## 4. 60FPS LEAF-NODE ISOLATION PATTERN

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

## 5. OPTIMISTIC UI MUTATIONS WITH AUTOMATIC ROLLBACK

* **The Invariant:** Every user mutation (delete, reorder, toggle) must render instantly in 0ms, backed by automatic rollback if the backend rejects the request.
* **Implementation Standard:**
  ```tsx
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: (skillId: string) => api.deleteSkill(skillId),
    onMutate: async (skillId) => {
      await queryClient.cancelQueries({ queryKey: ["skills", username] });
      const previousSkills = queryClient.getQueryData<Skill[]>(["skills", username]);
      queryClient.setQueryData<Skill[]>(["skills", username], (old = []) =>
        old.filter((s) => s.id !== skillId)
      );
      return { previousSkills };
    },
    onError: (_err, _skillId, context) => {
      if (context?.previousSkills) {
        queryClient.setQueryData(["skills", username], context.previousSkills);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["skills", username] });
    },
  });
  ```

---

## 6. DESIGN SYSTEM INTEGRATION & ZERO ARBITRARY TOKENS

1. **3-Tier Design Tokens:**
   * Tier 1: Primitive (`colors.blue.500`) ➔ Tier 2: Semantic (`color.brand.primary`) ➔ Tier 3: Component (`button.primary.bg`).
   * **STRICT PROHIBITION:** Arbitrary Tailwind hex classes like `bg-[#0f172a]`, `text-[#ffffff]`, `w-[54px]`. Only semantic tokens (`bg-surface-elevated`, `text-primary`) are permitted.
2. **Component Variance Authority (CVA):**
   * Reusable atoms and molecules must define variants using CVA:
   ```typescript
   export const buttonVariants = cva(
     "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50",
     {
       variants: {
         variant: {
           primary: "bg-brand-primary text-white hover:bg-brand-primary/90",
           outline: "border border-border-subtle bg-transparent hover:bg-surface-muted",
           ghost: "hover:bg-surface-muted hover:text-text-primary",
         },
         size: {
           sm: "h-8 px-3 text-xs rounded-md",
           md: "h-10 px-4 text-sm rounded-lg",
           lg: "h-12 px-6 text-base rounded-xl",
         },
       },
       defaultVariants: { variant: "primary", size: "md" },
     }
   );
   ```

---

## 7. ACCESSIBILITY (WCAG 2.1 AA) INVARIANTS

1. **Focus Trapping:** Active dialogs/modals must trap keyboard focus (`Tab` / `Shift+Tab`) within the modal boundary.
2. **Keyboard Escapability:** Pressing `Escape` must dismiss any active modal, popover, or dropdown.
3. **Semantic Tags:** Interactive elements must be native `<button>` or `<a href>`. Using `<div onClick>` without ARIA role and keyboard handlers is an immediate rejection trigger.
4. **Deterministic Locators:** Every interactive element must provide a dedicated `data-testid` attribute for automated E2E testing.

---

## 8. REJECTION CHECKLIST FOR SENIOR FRONTEND CODE

Before submitting any code for review, verify:
- [ ] Component is under line limit: Atoms <50, Molecules <100, Organisms <300, Pages <100 LOC.
- [ ] Page component contains zero inline layout DOM or raw HTML tags.
- [ ] No high-frequency telemetry exists in React `useState`.
- [ ] No API responses are copied into Zustand or local component state.
- [ ] Zero arbitrary Tailwind hex values (`[#...]`) or non-standard pixel dimensions.
- [ ] TypeScript passes with zero `any` types (`bun x tsc --noEmit` exits with 0).
- [ ] Every interactive element includes a semantic `data-testid`.
