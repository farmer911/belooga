# Active Working Memory (`STATE.md`)

## Objective & Expected Outcome
- **Task (`BEL-515`):** Research, Benchmark, Challenge, and Apply gRPC / ConnectRPC / Binary Framing & Multiplexed RPC Batching concepts where they **provably improve performance** in Belooga:
  1. **Supervisor Architectural Verdict:** Prove via empirical benchmark (`scripts/benchmark-rpc-and-serialization.py`) why **Loopback Network gRPC between internal monolith modules is an anti-pattern** (~675x slower than in-process Python calls), while **ConnectRPC-style Multiplexed Batch RPC (`POST /v1/rpc/batch`) + Binary Protobuf-Varint Framing (`application/x-protobuf`) + Shared Bundle Hydration** delivers a massive real-world speedup.
  2. **Eliminate Duplicate SQL & HTTP Waterfall on Profile/Workspace:** Refactor `ProfileService.get_candidate_trust_score` and `TimelineService.get_career_trajectory` to compute directly from the shared `pub_profile:{username}` bundle (cutting SQL queries per profile load from **14 down to 7**, and **0** on warm cache), and replace the 3-request sequential waterfall in `frontend/src/app/public/[username]/page.tsx` with `POST /v1/rpc/batch`.
  3. **Implement ConnectRPC-Style Multiplexed Batch & Binary Framing Engine (`backend/app/core/rpc.py`, mounted at `/v1/rpc`):**
     - `POST /v1/rpc/batch`: Executes multiple RPC procedures concurrently in **1 HTTP round-trip**.
     - Supports both compact JSON (`application/json`) and **Protobuf-style Binary Varint Wire Framing (`application/x-protobuf`)** via content negotiation.

## Pre-Mortem Risks
- Keep all `backend/app/**/*.py` <= 300 lines and frontend `page.tsx` <= 241 lines.

## Execution Checklist
- [x] Build & run empirical benchmark (`scripts/benchmark-rpc-and-serialization.py`)
- [x] Write TDD Red/Green test suite (`backend/tests/test_rpc_and_dossier_optimization.py`)
- [x] Implement `backend/app/core/rpc.py` (`/v1/rpc/batch` + Protobuf varint binary wire codec) & mount in `backend/app/main.py`
- [x] Optimize `ProfileService.get_candidate_trust_score` & `TimelineService.get_career_trajectory` to reuse shared bundle & wire `POST /v1/rpc/batch` in `public/[username]/page.tsx`
- [x] Verify `trust-benchmark.py`, `audit-truth.sh`, open PR #23, and merge into `main`
