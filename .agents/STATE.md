# Active Working Memory (`STATE.md`)

## Objective & Expected Outcome
- **Task (`BEL-519`):** Codify Agent Operating Workflows, Mermaid Architecture/Mindmap Diagrams, and Continuous Scalable Tech Adoption Protocols across `.agents/ROUTER.md` and `.agents/skills/*/SKILL.md`:
  1. `.agents/ROUTER.md`: Add Master Agent Execution Pipeline Diagram + Full-Stack Platform Architecture & Scalability Mindmap.
  2. `.agents/skills/belooga-backend-engineering/SKILL.md`: Codify 5-Layer Backend Pipeline (`Pure-ASGI Gateway -> Router/RPC Batch -> Service/SWR Cache/Event Stream -> Single-Roundtrip SQL 16 Repo -> K8s Probes`) + benchmark suite.
  3. `.agents/skills/belooga-frontend-engineering/SKILL.md`: Codify Frontend Data, ConnectRPC Batch, SEO & Service Worker (`sw.js`) flow diagram and security guardrails.
  4. `.agents/skills/belooga-self-learn/SKILL.md`, `belooga-supervisor/SKILL.md`, `belooga-senior-agile-workflow/SKILL.md`: Codify Continuous Learning, Empirical A/B Benchmarking & 10x–100x Scalability Adoption Loop diagrams.

## Pre-Mortem Risks
- Keep all `SKILL.md` files <= 200 lines and zero `lint-skills.py` errors/warnings.

## Execution Checklist
- [x] Update `.agents/ROUTER.md` with execution flowchart & full-stack scalability mindmap
- [x] Update `belooga-backend-engineering/SKILL.md` & `belooga-frontend-engineering/SKILL.md` with pipeline diagrams
- [x] Update `belooga-self-learn/SKILL.md`, `belooga-supervisor/SKILL.md`, `belooga-senior-agile-workflow/SKILL.md`
- [x] Update `feature_mindmap.md` artifact with full `BEL-501..BEL-519` mindmap & agent workflow diagrams
- [x] Verify `lint-skills.py`, `trust-benchmark.py`, `audit-truth.sh`, open PR #27, and merge into `main`
