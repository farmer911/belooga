# Active Working Memory (`STATE.md`)

## Objective & Expected Outcome
- **Task (`BEL-516`):** Evaluate, Benchmark, and Apply **Kafka (Partitioned Event Streaming, Consumer Groups, DLQ)** & **Kubernetes (Liveness/Readiness Probes, Graceful Lifespan Drain, HPA Manifests)** to Belooga without JVM/infrastructure bloat:
  1. **Supervisor Challenge & Benchmark (`scripts/benchmark-event-stream-and-k8s.py`):**
     - Reject deploying a 2GB JVM Kafka/Zookeeper cluster (violates 80/20 YAGNI), while adopting **Kafka's Partitioned Event Log + Consumer Group + Dead-Letter Queue (DLQ)** pattern via `backend/app/core/events.py`.
     - Fix `backend/app/main.py`'s empty `lifespan` and static `/health` by adding **Kubernetes Liveness (`/health/live`)**, **Readiness (`/health/ready`)**, graceful shutdown drain, and `k8s/deployment-and-hpa.yaml`.
  2. **TDD Verification (`backend/tests/test_event_stream_and_k8s_probes.py`):**
     - Test partitioned event publishing (`partition = crc32(key) % num_partitions`), per-key ordering, Consumer Group offset tracking, Dead-Letter Queue (DLQ) isolation on failing handlers, `/v1/events/status`, `/health/live`, and `/health/ready`.

## Pre-Mortem Risks
- Keep all `backend/app/**/*.py` <= 300 lines.
- Ensure background event workers drain cleanly without leaking tasks across pytest tests.

## Execution Checklist
- [x] Build & run empirical benchmark (`scripts/benchmark-event-stream-and-k8s.py`)
- [x] Write TDD Red/Green test suite (`backend/tests/test_event_stream_and_k8s_probes.py`)
- [x] Implement `backend/app/core/events.py` (Partitioned Event Stream, Consumer Groups, DLQ, `/v1/events/status` & `/v1/events/publish`)
- [x] Upgrade `backend/app/main.py` (`/health/live`, `/health/ready`, Graceful Lifespan Drain) & add `k8s/deployment-and-hpa.yaml`
- [x] Verify `trust-benchmark.py`, `audit-truth.sh`, open PR #24, and merge into `main`
