#!/usr/bin/env bash
# ==============================================================================
# Belooga Local Pre-Push Adversarial Gate (Inspired by kunchenguid/no-mistakes)
# Blocks git push unless Skill SSOT, Ratchet, Anti-Deception Benchmark,
# TypeScript compilation, and Backend Integration Tests all pass (Exit: 0).
# ==============================================================================
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

CURRENT_BRANCH="$(git branch --show-current)"
if [[ "$CURRENT_BRANCH" == "main" || "$CURRENT_BRANCH" == "master" ]]; then
    echo "ERROR: Direct push to '$CURRENT_BRANCH' is forbidden! Always push a feature/fix branch and open a Pull Request (gh pr create -> gh pr checks --watch)."
    exit 1
fi

echo "[Pre-Push Gate] 1/4 Verifying Skill SSOT, Ratchet & Anti-Deception Benchmark..."
python3 scripts/render-skill-facts.py --write >/dev/null
python3 scripts/lint-skills.py --quiet
python3 scripts/ratchet.py
python3 scripts/trust-benchmark.py

echo "[Pre-Push Gate] 2/4 Verifying Frontend TypeScript Compilation..."
(cd frontend && bun x tsc --noEmit)

echo "[Pre-Push Gate] 3/4 Running Backend Pytest Suite..."
backend/.venv/bin/pytest backend/tests/ -q

echo "[Pre-Push Gate] 4/4 Verifying Zero Orphan Dev/Browser Test Workers..."
if pgrep -f "playwright.*test-server" >/dev/null 2>&1; then
    echo "ERROR: Orphan Playwright test-server child process still running! Reap before pushing."
    exit 1
fi

echo "✓ [Pre-Push Gate] All local verification gates green. Proceeding with push."
