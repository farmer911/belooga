# Active Stateful Working Memory (.agents/STATE.md)

## Active Task: Harness honesty - make the trust gate provably catch cheats
- **Hypothesis:** `trust-benchmark.py` is only trustworthy if a fixed probe set of planted cheats must all be reported (`path:line`); prose rules and pasted logs prove nothing, CI does.
- **Findings:** review probe caught 0 planted cheats; `core.hooksPath` unset locally; E2E ran post-merge only; IDOR/async checks duplicated in `audit-truth.sh` with a drifted whitelist; integrity skill contradicted harness rule 6 and forced pasted logs.
- **Risks:** stricter checks hit real code (5 spots fixed); `return null` in catch stays allowed (legit "not available"); E2E as PR gate adds CI minutes; branch protection must list `Automation E2E Suite` (needs `gh`, not set from here).

## Execution Checklist
- [x] 1. RED: `.agents/evals/trust-probes/` + `backend/tests/test_trust_benchmark_probes.py` (benchmark ignored probes, exit 0).
- [x] 2. GREEN: AST/regex checks per occurrence with line numbers; probe test passes; real repo back to 100% after 5 fixes.
- [x] 3. CI: E2E gates PRs; drop duplicate checks from `audit-truth.sh`; `git config core.hooksPath .githooks` locally.
- [x] 4. Skills: proof = `command -> exit code`; ask-policy points to harness rule 6; one answer-format rule in `GEMINI.md` 4.
- [ ] 5. Branch protection: require `Automation E2E Suite` on `main` (owner, via GitHub settings).
- [ ] Carried over: wire Redis Pub/Sub subscriber -> `apply_remote_invalidation`; route `/auth/me/` to primary.
