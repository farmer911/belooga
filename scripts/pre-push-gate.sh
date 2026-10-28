#!/usr/bin/env bash
# ==============================================================================
# Belooga Local Pre-Push Adversarial Gate (Inspired by kunchenguid/no-mistakes)
# Automates Steps 1-3 of the canonical DoD (.agents/workflows/definition-of-done.md):
# Skill SSOT, Ratchet, Anti-Deception Benchmark, TypeScript compilation, and
# Backend Integration Tests must all pass (Exit: 0).
# Install once per clone:  git config core.hooksPath .githooks
# ==============================================================================
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

PY="$(command -v python3 || command -v python)"
PYTEST="backend/.venv/bin/pytest"
[ -x "$PYTEST" ] || PYTEST="backend/.venv/Scripts/pytest.exe"  # Windows venv layout

CURRENT_BRANCH="$(git branch --show-current)"
if [[ "$CURRENT_BRANCH" == "main" || "$CURRENT_BRANCH" == "master" ]]; then
    echo "ERROR: Direct push to '$CURRENT_BRANCH' is forbidden! Always push a feature/fix branch and open a Pull Request (gh pr create -> gh pr checks --watch)."
    exit 1
fi

echo "[Pre-Push Gate] 1/4 Verifying Skill SSOT, Ratchet & Anti-Deception Benchmark..."
"$PY" scripts/render-skill-facts.py --write >/dev/null
"$PY" scripts/lint-skills.py --quiet
"$PY" scripts/ratchet.py
"$PY" scripts/trust-benchmark.py

echo "[Pre-Push Gate] 2/4 Verifying Frontend & Mobile TypeScript Compilation + Mobile Tests..."
(cd frontend && bun x tsc --noEmit)
if [ -d "mobile" ]; then
    (cd mobile && bun x tsc --noEmit && bun test)
fi

echo "[Pre-Push Gate] 3/4 Running Backend Pytest Suite..."
"$PYTEST" backend/tests/ -q

echo "[Pre-Push Gate] 4/4 Verifying Zero Orphan Dev/Browser Test Workers..."
if pgrep -f "playwright.*test-server" >/dev/null 2>&1; then
    echo "ERROR: Orphan Playwright test-server child process still running! Reap before pushing."
    exit 1
fi

echo "✓ [Pre-Push Gate] All local verification gates green. Proceeding with push."
