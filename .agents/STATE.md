# Active State Scratchpad (<= 50 lines)

> Per-task working memory. Overwrite (do not append) when starting a new ticket.

- **Active Ticket:** `[BEL-246]` Multi-Agent Worktree, Split FE/BE Review Agents & Post-Merge Parallel QC/Automation Pipeline
- **Branch / Worktree:** `feature/BEL-246-multi-agent-worktree-ci-pipeline`
- **Objective & Hypothesis:**
  1. **`scripts/ai-pm-manager.py`:** Support `ROLES = {"design", "backend", "frontend", "mobile", "architect"}` (no standalone `qc` Todo ticket) and automatically add created issues to `Kanban Belooga` Project #1 (`Todo` column `b5bd229a`).
  2. **`scripts/agent-dispatch.py`:** Create isolated per-ticket `git worktree` (`.claude/worktrees/BEL-<id>-<slug>`), symlink shared `.venv`/`node_modules`, and move both Issue Label (`status:in-progress`) and Project Board column (`ef71cae9`).
  3. **`scripts/ai-code-reviewer.py` & `.github/workflows/ai-code-review.yml`:** Split review by changed paths into dedicated **Backend Review Agent** (`be-code-review/SKILL.md`), **Frontend Review Agent** (`fe-code-review/SKILL.md`), and **Mobile Review Agent**, and exit `1` on `CHANGES REQUESTED 🛑`.
  4. **`.github/workflows/ci.yml`, `deploy.yml` & `scripts/watch-kanban.sh`:** On PR, run fast build/unit/audit + split FE/BE Review Agents; on `push` to `main` (post-merge), trigger parallel `automation-e2e` (Playwright/Maestro) and `qc-manual-dispatch` (`Testing` column notification), gating production release on both.
- **Pre-Mortem Risks:**
  - Keep all Python scripts clean of unused imports and bare `except:` so `scripts/trust-benchmark.py` stays 100%.
- **Target Files:**
  - `scripts/{agent-dispatch.py,ai-code-reviewer.py,ai-pm-manager.py,watch-kanban.sh}`
  - `.github/workflows/{ai-code-review.yml,ci.yml,deploy.yml}`
  - `.agents/skills/belooga-senior-agile-workflow/SKILL.md`
  - `backend/tests/test_agent_workflow_pipeline.py`
- **Execution Checklist:**
  - [x] Write RED tests in `backend/tests/test_agent_workflow_pipeline.py` & verify RED
  - [x] Upgrade `agent-dispatch.py`, `ai-code-reviewer.py`, `ai-pm-manager.py`, `watch-kanban.sh` (GREEN)
  - [x] Upgrade `.github/workflows/{ai-code-review.yml,ci.yml,deploy.yml}` & `SKILL.md`
  - [ ] Run DoD gates, open PR, watch CI green & merge
