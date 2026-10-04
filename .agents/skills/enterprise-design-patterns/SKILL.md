---
name: enterprise-design-patterns
description: Authoritative Technical Standard & Master Catalog of Production-Grade Design Patterns for Senior Frontend, Backend, QC, and Systems Engineers. Enforces zero-compromise best practices across Clean Architecture, Concurrency, State Segregation, Headless UI, Enterprise Design Systems, and Test Automation.
---

# 🏛️ ENTERPRISE DESIGN PATTERNS & ZERO-COMPROMISE PRODUCTION STANDARDS

> **Scope:** Repository-Wide Engineering Mandate  
> **Target Audience:** Principal Architects, Senior Frontend Engineers, Principal Backend Engineers, Lead QC Automation Engineers, and All Autonomous Agents  
> **Policy:** ZERO-COMPROMISE PRODUCTION STANDARD. No trade-offs that sacrifice correctness, maintainability, type safety, data integrity, or 60fps performance.

---

## 1. CORE ARCHITECTURAL PHILOSOPHY

1. **Code is a Liability, Correctness is an Invariant:** Every line of code introduces operational surface area. Patterns are not decorative abstractions; they are structural guarantees against concurrency race conditions, event-loop starvation, cascade re-renders, and distributed state corruption.
2. **Strict Separation of Concerns:** Domain logic never depends on delivery mechanisms (HTTP/CLI), persistence engines (PostgreSQL/Redis), or styling layers (Tailwind/CSS).
3. **Single Source of Truth (SSOT):** Every piece of state (server data, client session, UI route, database schema) has exactly one authoritative owner. Duplicating state across tiers is an automatic code rejection.

---

## 2. BACKEND DESIGN PATTERNS (BE & DISTRIBUTED SYSTEMS)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BACKEND ARCHITECTURE MATRIX                     │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ 1. Enterprise     │ 2. Data & Trans-  │ 3. Distributed Reliability     │
│    Architecture   │    action Control │    & High-Throughput           │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ • Clean 4-Layer   │ • Repository &    │ • Transactional Outbox         │
│ • Domain-Driven   │   Unit of Work    │ • Circuit Breaker & Jitter     │
│   Design (DDD)    │ • Pessimistic     │ • CQRS (GIN / Trigram)         │
│ • Dependency      │   Locking (FOR    │ • Event-Loop Offloading        │
│   Injection (DI)  │   UPDATE)         │ • Idempotency Keys             │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

### 2.1. Clean 4-Layer Architecture (Ports & Adapters)

* **Technical Definition:** Structuring the application into concentric rings where dependencies point strictly inward toward pure business logic.
  * **Layer 1: Delivery / Presentation (`routers/`):** Accepts HTTP requests, parses headers/cookies, validates inputs via Schemas, invokes Domain Services, and returns HTTP status codes. Contains **zero database queries and zero business rules**.
  * **Layer 2: Application DTOs (`schemas/`):** Pydantic v2 schemas validating request payloads and serializing output models (`model_config = ConfigDict(from_attributes=True)`).
  * **Layer 3: Domain Services (`services/`):** Pure business logic, workflow orchestration, authorization guards, and transaction boundaries.
  * **Layer 4: Persistence & Infrastructure (`repositories/`, `models/`):** SQLAlchemy 2.0 Async mapped entities, database drivers, external API HTTP clients, disk I/O adapters.
* **When to Use:** Mandatory for all API domains and microservices.
* **Best Practice Implementation:**
  ```python
  # router -> service -> repository (Strict Inward Flow)
  @router.post("/timeline", response_model=TimelineItemResponse, status_code=status.HTTP_201_CREATED)
  async def create_timeline_item(
      payload: TimelineItemCreateRequest,
      current_user: Annotated[UserTokenPayload, Depends(get_current_authenticated_user)],
      service: Annotated[TimelineDomainService, Depends(get_timeline_service)],
  ) -> TimelineItemResponse:
      # Thin controller: delegates 100% to Domain Service
      return await service.create_item_with_reordering(current_user.id, payload)
  ```
* **Rejection Criteria:** Any database query (`select()`, `session.execute()`) or raw SQL written inside a Router function.

---

### 2.2. Repository & Unit of Work (UoW) Pattern

* **Technical Definition:** 
  * **Repository:** Encapsulates data retrieval and persistence, presenting an in-memory collection interface to the Domain Service.
  * **Unit of Work:** Coordinates the work of multiple repositories by maintaining a single database transaction context, guaranteeing atomic commits or rollbacks across all modified entities.
* **When to Use:** Whenever a business operation modifies more than one database table, or requires complex querying decoupled from the ORM.
* **Best Practice Implementation:**
  ```python
  class UnitOfWork:
      def __init__(self, session_factory: async_sessionmaker[AsyncSession]):
          self._session_factory = session_factory

      async def __aenter__(self):
          self.session = self._session_factory()
          self.experience_repo = ExperienceRepository(self.session)
          self.education_repo = EducationRepository(self.session)
          return self

      async def __aexit__(self, exc_type, exc_val, exc_tb):
          if exc_type:
              await self.session.rollback()
          else:
              await self.session.commit()
          await self.session.close()
  ```

---

### 2.3. Pessimistic Concurrency Locking Pattern (`SELECT FOR UPDATE`)

* **Technical Definition:** Explicitly locks matching rows at the PostgreSQL database level using `FOR UPDATE` within an active transaction, serializing concurrent writes and preventing race conditions / dirty reads.
* **When to Use:** Reordering sequence positions (`display_order`), financial balance deductions, inventory reservations, single-seat booking, or counter increments.
* **Best Practice Implementation:**
  ```python
  async def shift_display_orders(
      session: AsyncSession, 
      profile_id: uuid.UUID, 
      from_order: int, 
      to_order: int
  ) -> None:
      # Pessimistic Row Locking: prevents concurrent mutations from corrupting order indices
      stmt = (
          select(JobExperience)
          .where(JobExperience.profile_id == profile_id)
          .where(JobExperience.display_order >= min(from_order, to_order))
          .with_for_update()
      )
      result = await session.execute(stmt)
      items = result.scalars().all()
      # Mutate indices atomically within transaction
  ```
* **Rejection Criteria:** Using simple read-then-write (`SELECT` followed by `UPDATE`) on sequence-dependent records without `with_for_update()`.

---

### 2.4. CQRS (Command Query Responsibility Segregation) with GIN/Trigram Indexing

* **Technical Definition:** Separating mutations (Commands) from read operations (Queries) to maximize search throughput without locking normalized write tables.
* **When to Use:** Full-text talent search, multi-faceted filtering, autocomplete suggestion engines.
* **Best Practice Implementation:**
  * **Command Path:** Writes to normalized 3NF relational tables (`candidates`, `skills`, `job_experiences`). A PostgreSQL trigger or generated column compiles textual representations into a pre-computed `tsvector` column (`search_vector`).
  * **Query Path:** Pure read engine querying the pre-computed `search_vector` via **GIN Index** (`ts_rank_cd`), complemented by `pg_trgm` similarity for fuzzy typo tolerance.
* **Rejection Criteria:** Combining full-text `search_vector @@ plainto_tsquery()` with `OR column ILIKE '%term%'`. The `OR` operator forces the query planner to abort the GIN index and execute a sequential full table scan.

---

### 2.5. Transactional Outbox Pattern

* **Technical Definition:** Eliminates the distributed Dual-Write failure mode (writing to DB + publishing to Message Broker like Kafka/RabbitMQ) by storing domain events in a dedicated `outbox` database table within the primary business transaction.
* **When to Use:** Asynchronous workflows, video transcoding notifications, analytics event broadcasting, email triggering.
* **Best Practice Implementation:**
  1. Transaction begins:
     - Mutate entity: `INSERT INTO video_uploads ...`
     - Record event: `INSERT INTO outbox_events (event_name, payload, status) VALUES ('video.transcode.requested', {...}, 'PENDING')`
  2. Transaction commits atomically.
  3. Change Data Capture (CDC via Debezium) or a dedicated polling worker reads `outbox_events` and publishes to the broker with guaranteed delivery.

---

### 2.6. Non-Blocking Event-Loop Offloading Pattern

* **Technical Definition:** Moving CPU-intensive computations or synchronous disk/network I/O off the async event loop thread into a background thread pool or worker process.
* **When to Use:** PDF generation (ReportLab), image resizing (Pillow), cryptographic key generation, synchronous disk file writing (`open(..., "wb")`), audio/video processing.
* **Best Practice Implementation:**
  ```python
  import anyio

  # Offload synchronous disk writing and PDF generation to thread pool
  await anyio.to_thread.run_sync(pdf_generator.build, document_canvas)
  ```
* **Rejection Criteria:** Direct invocation of blocking libraries or `subprocess.run()` inside an `async def` FastAPI endpoint.

---

### 2.7. Circuit Breaker & Exponential Backoff with Full Jitter

* **Technical Definition:** Halts requests to an external failing dependency when failure rates cross a defined threshold (Closed ➔ Open), allowing the downstream service to recover without causing cascading failures. Retries use exponential delays randomized with jitter.
* **When to Use:** Third-party integrations (OAuth providers, AI model APIs, S3/Cloud storage, payment gateways).
* **Formula:**
  $$\text{Sleep} = \text{random}(0, \min(T_{\max}, T_{\text{base}} \times 2^{\text{attempt}}))$$

---

## 3. FRONTEND DESIGN PATTERNS (FE & CLIENT-SIDE ARCHITECTURE)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND ARCHITECTURE MATRIX                    │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ 1. Component      │ 2. State Boundary │ 3. Render Lifecycle &          │
│    Architecture   │    Segregation    │    Frame Budget Isolation      │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ • Atomic Design   │ • Server State    │ • Leaf-Node Isolation          │
│ • Headless UI /   │ • Global State    │ • Virtualization (Windowing)   │
│   Custom Hooks    │ • URL State       │ • Optimistic UI with Rollback  │
│ • Compound Comps  │ • High-Frequency  │ • Web-Worker Offloading        │
│ • Inversion of C. │   Transient State │ • Progressive Hydration        │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

### 3.1. Atomic Design System Hierarchy

* **Technical Definition:** Structuring UI components into five discrete levels of abstraction based on complexity and dependency.
  * **Level 1: Atoms (< 50 LOC):** Indivisible building blocks (`Button`, `Input`, `Badge`, `Avatar`, `Typography`). Contain zero business logic, zero API calls, and zero external store subscriptions.
  * **Level 2: Molecules (< 100 LOC):** Combinations of atoms acting as a unit (`SearchBar` = `Input` + `Button` + `Icon`, `FormField` = `Label` + `Input` + `ErrorMessage`).
  * **Level 3: Organisms (< 300 LOC):** Complex, distinct sections of an interface (`ProfileHeader`, `TimelineList`, `VideoStudio`, `NavigationMaster`). Coordinate molecules and atoms.
  * **Level 4: Templates (< 150 LOC):** Page-level layouts defining spatial arrangement and structural grids without real domain data.
  * **Level 5: Pages (< 100 LOC):** Next.js route entrypoints (`page.tsx`). Pure orchestrators that consume route parameters, initialize React Query boundaries, and compose organisms.
* **Rejection Criteria:** Any `page.tsx` file exceeding 150 lines or containing raw HTML tags (`<div>`, `<svg>`), inline styling, or multiple local `useState` hooks.

---

### 3.2. Headless UI & Inversion of Control (IoC) Pattern

* **Technical Definition:** Completely separating state machines, event handlers, and accessibility attributes from the visual presentation layer.
* **When to Use:** Complex interactive components: WebRTC media recorders, teleprompters, drag-and-drop lists, modal dialogs, data tables.
* **Best Practice Implementation:**
  ```tsx
  // Pure logic engine encapsulated in a headless hook
  export function useMediaRecorder(options: RecorderOptions) {
    const [state, setState] = useState<RecorderState>("idle");
    // WebRTC MediaRecorder logic, stream management, chunk buffers
    return { state, startRecording, stopRecording, videoRef, mediaStream };
  }

  // Pure presentation component consuming the engine
  export function VideoStudioOrganism() {
    const { state, startRecording, stopRecording, videoRef } = useMediaRecorder({ maxDurationSec: 30 });
    return (
      <Card className="p-6">
        <video ref={videoRef} autoPlay playsInline muted />
        <StudioControls state={state} onStart={startRecording} onStop={stopRecording} />
      </Card>
    );
  }
  ```

---

### 3.3. 4-Tier State Segregation Standard

* **Technical Definition:** Categorizing every single piece of state into one of four distinct tiers based on ownership, lifecycle, and access frequency.

| State Tier | Authoritative Tool | Criteria & Boundaries | Anti-Pattern to Reject |
| :--- | :--- | :--- | :--- |
| **Tier 1: Server State** | **TanStack Query** | Data originating from the backend. Handles caching, deduplication, revalidation, and pagination. | Storing API response payloads in Zustand or local `useState`. |
| **Tier 2: Global Client State** | **Zustand** | App-wide ephemeral client state: authentication tokens, active theme (light/dark), global side drawer open/close. | Storing server-fetched entity collections in global client stores. |
| **Tier 3: URL State** | **Next.js `searchParams` / `nuqs`** | Any state that must survive a page reload or be shareable via a hyperlink (search keywords, active filters, page numbers, active tab index). | Keeping active search query strings purely in component `useState`. |
| **Tier 4: High-Frequency State** | **`useRef` / Direct DOM / Canvas** | Telemetry updating at 30Hz–60Hz (audio decibel VU meters, video playback progress, cursor coordinates). | Setting React state 60 times/second, triggering full-tree Virtual DOM reconciliation. |

---

### 3.4. Leaf-Node High-Frequency Isolation Pattern

* **Technical Definition:** Isolating high-frequency state mutations to the absolute lowest leaf node of the component tree, completely bypassing React's Virtual DOM diffing engine for parent and sibling components.
* **When to Use:** Real-time audio VU meters, video scrubbing bars, streaming text cursors, live canvas rendering.
* **Best Practice Implementation:**
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

      let animationFrameId: number;
      const draw = () => {
        analyser.getByteFrequencyData(dataArray);
        // Paint directly to HTML5 Canvas via requestAnimationFrame
        renderCanvas(canvasRef.current, dataArray);
        animationFrameId = requestAnimationFrame(draw);
      };
      draw();

      return () => {
        cancelAnimationFrame(animationFrameId);
        audioContext.close();
      };
    }, [stream]);

    // Zero parent state triggers, exactly 0 re-renders of the parent organism
    return <canvas ref={canvasRef} width={240} height={24} className="rounded" />;
  }
  ```

---

### 3.5. Optimistic UI Mutations with Automatic Rollback

* **Technical Definition:** Instantly mutating the local client cache before the network request resolves, providing a 0ms perceived response time. If the backend fails, the cache automatically reverts to the previous snapshot.
* **When to Use:** Favoriting, deleting items, reordering list entries, editing text fields.
* **Best Practice Implementation:**
  ```tsx
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deleteSkillApi,
    onMutate: async (deletedSkillId) => {
      await queryClient.cancelQueries({ queryKey: ["skills", username] });
      const previousSkills = queryClient.getQueryData(["skills", username]);
      queryClient.setQueryData(["skills", username], (old: Skill[]) => 
        old.filter((s) => s.id !== deletedSkillId)
      );
      return { previousSkills };
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(["skills", username], context?.previousSkills);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["skills", username] });
    },
  });
  ```

---

### 3.6. Compound Components Pattern

* **Technical Definition:** A pattern where multiple components work together to form a cohesive unit, sharing implicit state via an internal React Context without prop drilling.
* **When to Use:** Modal dialogs, tabs, dropdown menus, multi-step accordions.
* **Best Practice Implementation:**
  ```tsx
  <Dialog open={isOpen} onOpenChange={setIsOpen}>
    <Dialog.Trigger asChild>
      <Button variant="primary">Edit Profile</Button>
    </Dialog.Trigger>
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title>Edit Profile Information</Dialog.Title>
      </Dialog.Header>
      <ProfileEditForm />
    </Dialog.Content>
  </Dialog>
  ```

---

## 4. DESIGN SYSTEM STANDARDS (ENTERPRISE UI INFRASTRUCTURE)

```
┌────────────────────────────────────────────────────────────────────────┐
│                     DESIGN SYSTEM TOKEN LIFECYCLE                      │
├────────────────────────────────────────────────────────────────────────┤
│  Figma Core Library                                                    │
│    │                                                                   │
│    ▼ [Design Token Pipeline: Style Dictionary]                         │
│  Tier 1: Primitive Tokens (colors.neutral.900 = #0f172a)               │
│    │                                                                   │
│    ▼                                                                   │
│  Tier 2: Semantic Tokens (surface.canvas = var(--neutral-900))         │
│    │                                                                   │
│    ▼                                                                   │
│  Tier 3: Component Tokens (card.background = var(--surface-canvas))    │
│    │                                                                   │
│    ▼                                                                   │
│  Tailwind CSS Config + Class Variance Authority (CVA)                  │
│    │                                                                   │
│    ▼                                                                   │
│  WCAG 2.1 AA Compliance + Focus Trapping + Zero Arbitrary Hex Policy   │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.1. 3-Tier Design Token Architecture

* **Tier 1: Global / Primitive Tokens:** Raw physical values (`blue-500: #0ea5e9`, `spacing-4: 16px`, `radius-md: 8px`). Never consumed directly by UI components.
* **Tier 2: Semantic / Contextual Tokens:** Mapped to functional meaning (`color.brand.primary: var(--blue-500)`, `surface.card.background: var(--neutral-50)` in Light Mode / `var(--neutral-900)` in Dark Mode).
* **Tier 3: Component-Specific Tokens:** Strictly scoped properties (`button.primary.hover.background: var(--color-brand-primary-hover)`).
* **Zero Arbitrary Values Mandate:**
  * **FORBIDDEN:** `className="bg-[#0f172a] text-[#ffffff] p-[13px]"`
  * **MANDATORY:** `className="bg-surface-elevated text-text-primary p-4"`

---

### 4.2. Component Variant Modeling via CVA

* Every reusable Atom and Molecule must define variants using `class-variance-authority`:
  ```typescript
  import { cva, type VariantProps } from "class-variance-authority";

  export const badgeVariants = cva(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
      variants: {
        variant: {
          default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
          secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
          destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
          outline: "text-foreground border border-border",
        },
      },
      defaultVariants: {
        variant: "default",
      },
    }
  );
  ```

---

### 4.3. Accessibility (WCAG 2.1 AA) Invariants

1. **Focus Trapping:** Active modal dialogs must trap keyboard focus (`Tab` / `Shift+Tab`) within the modal boundary. Focus must never escape to obscured backdrop DOM nodes.
2. **Keyboard Escapability:** Pressing `Escape` must close any active modal, popover, or dropdown menu.
3. **Contrast Ratio:** Normal text must maintain a minimum contrast ratio of 4.5:1 against its background (3:1 for large text $\ge 18\text{pt}$).
4. **Interactive Semantics:** Only native `<button>` or `<a href>` elements may carry click handlers. Divs with `onClick` without `role="button"` and `tabIndex={0}` are strictly prohibited.

---

## 5. QUALITY CONTROL & TEST AUTOMATION PATTERNS (QC & QA)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        QC TEST ARCHITECTURE MATRIX                     │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ 1. Page Object    │ 2. Test Fixtures  │ 3. Flakiness Elimination       │
│    Model (POM)    │    & Data State   │    & Verification Standards    │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ • Component-level │ • Isolated Test   │ • Auto-Waiting Assertions      │
│   POM encapsulation│  User Factory    │ • Zero Arbitrary Sleeps        │
│ • Deterministic   │ • Hermetic DB     │ • Visual Regression Thresholds │
│   data-testid loc.│   Cleaners        │ • Network Request Interception │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

### 5.1. Component-Scoped Page Object Model (POM)

* **Technical Definition:** Encapsulates page structure and user interactions within class methods, completely decoupling test specifications from internal DOM hierarchy.
* **Best Practice Implementation:**
  ```typescript
  export class WorkspacePage {
    readonly page: Page;
    readonly profileName: Locator;
    readonly addExperienceBtn: Locator;

    constructor(page: Page) {
      this.page = page;
      // Strictly locate via dedicated data-testid attributes
      this.profileName = page.getByTestId("profile-display-name");
      this.addExperienceBtn = page.getByTestId("add-experience-button");
    }

    async openAddExperienceModal(): Promise<ExperienceModal> {
      await this.addExperienceBtn.click();
      return new ExperienceModal(this.page);
    }
  }
  ```

---

### 5.2. Deterministic Selector Policy

* **Hierarchy of Allowed Locators:**
  1. `page.getByTestId("...")` (Authoritative primary selector)
  2. `page.getByRole("button", { name: "..." })` (Semantic accessible selector)
  3. `page.getByLabel("...")` (Form inputs)
* **Strict Rejection Criteria:**
  * CSS selector paths: `div > div:nth-child(3) > span` (Extremely brittle)
  * Raw class-name locators: `.btn-primary`, `.text-blue-500` (Fails whenever Tailwind classes are refactored)

---

### 5.3. Anti-Flakiness & Zero-Sleep Rule

* **The Absolute Rule:** Arbitrary sleep calls (`page.waitForTimeout(3000)`, `time.sleep()`) are **STRICTLY PROHIBITED**.
* **Mandatory Replacement:** Web-First Assertions with automatic retry:
  ```typescript
  // CORRECT: Auto-retries until condition is met or timeout occurs
  await expect(page.getByTestId("timeline-card-0")).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId("candidate-grid")).toHaveCount(12);

  // FORBIDDEN: Anti-pattern
  await page.waitForTimeout(3000);
  expect(await page.getByTestId("timeline-card-0").isVisible()).toBe(true);
  ```

---

## 6. MASTER DECISION & ENFORCEMENT MATRIX

| Feature Requirement | Mandatory Production Pattern | Implementation Standard | Immediate Rejection Trigger |
| :--- | :--- | :--- | :--- |
| **High-Frequency VU Meter / Telemetry** | **Leaf-Node Canvas Isolation** | Direct Canvas painting via `requestAnimationFrame` | Storing decibel level in parent `useState` (causes 60fps full-tree re-render). |
| **Sequence Reordering (`display_order`)** | **Pessimistic Locking + UoW** | `SELECT ... FOR UPDATE` inside an async transaction block | Updating positions via sequential un-locked `UPDATE` queries (race conditions). |
| **Search & Discovery Engine** | **CQRS + PostgreSQL GIN Index** | Read from compiled `tsvector` generated column using `ts_rank_cd` | Querying with `OR ILIKE '%term%'`, which disables the GIN index scan. |
| **Heavy File / Document Generation** | **Thread-Pool Offloading** | Wrap synchronous PDF / image work in `anyio.to_thread.run_sync` | Running blocking CPU or synchronous disk I/O directly in an `async def` route. |
| **Component Hierarchy & File Sizing** | **Atomic Design Decomposition** | Atoms <50, Molecules <100, Organisms <300, Pages <100 LOC | Monolithic components (>350 LOC) with mixed business logic and inline DOM. |
| **Design Token Compliance** | **3-Tier Token Standard** | Semantic tokens via Tailwind config & CVA | Arbitrary hex values in JSX: `className="bg-[#1e293b]"`. |
| **Test Automation Verification** | **Page Object Model + Web-First** | `getByTestId` with auto-waiting `expect(locator).toBeVisible()` | Brittle CSS selectors (`div > span`) or arbitrary sleeps (`waitForTimeout`). |

---

## 7. VERIFICATION & ADHERENCE CHECKLIST

Before any Pull Request is approved:
- [ ] **Architecture Check:** Routers contain 0 SQL queries; all business operations reside in Services.
- [ ] **Concurrency Check:** Any record index or balance update is guarded by `with_for_update()`.
- [ ] **Thread Safety Check:** All synchronous disk I/O and PDF compilation are wrapped in `anyio.to_thread.run_sync()`.
- [ ] **Render Budget Check:** High-frequency audio/visual telemetry is completely isolated in leaf nodes.
- [ ] **Token Check:** Zero arbitrary hex codes (`[#...]`) or non-standard pixel dimensions exist in frontend code.
- [ ] **A11y Check:** Active modals implement strict focus trapping and keyboard escapability (`Escape`).
- [ ] **E2E Check:** All tests run deterministically with zero `waitForTimeout` calls and pass with exit code `0`.
