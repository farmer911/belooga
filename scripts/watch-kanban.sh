#!/usr/bin/env bash
# Silent Blocking Kanban Watcher for Belooga Multi-Agent Team
# Usage: bash scripts/watch-kanban.sh <design|be|fe|mobile|qc|architect>
# Blocks silently in background until actionable work exists on GitHub, preventing 30s LLM polling spam.

ROLE=$(echo "${1:-}" | tr '[:upper:]' '[:lower:]')
if [ -z "$ROLE" ]; then
  echo "Usage: bash scripts/watch-kanban.sh <design|be|fe|mobile|qc|architect>"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

while true; do
  RESULT=$(python3 - "$ROLE" "$SCRIPT_DIR" << 'PYEOF'
import json, subprocess, sys

role = sys.argv[1]
sys.path.insert(0, sys.argv[2])
from kanban_trust import gh_api, is_trusted  # untrusted authors never reach an agent

def gh_json(args):
    try:
        out = subprocess.check_output(["gh"] + args, stderr=subprocess.DEVNULL, text=True, encoding="utf-8")
        return json.loads(out)
    except Exception:
        return []

def trusted_issues(label, limit):
    """Open, non-PR issues with `label`, authored by a trusted user (REST carries author_association)."""
    try:
        items = gh_api(f"repos/{{owner}}/{{repo}}/issues?state=open&labels={label}&per_page={limit}")
    except Exception:
        return []
    return [i for i in items if "pull_request" not in i and is_trusted(i)]

if role == "qc":
    testing_issues = trusted_issues("status:testing", 50)
    runs = gh_json(["run", "list", "--branch", "main", "--limit", "5", "--json", "databaseId,name,status,conclusion,headSha"])
    actionable = []
    for run in runs:
        if run.get("name") == "Belooga SSOT & Integrity CI" and run.get("status") == "completed":
            if run.get("conclusion") not in ("success", "neutral", "skipped"):
                actionable.append(f"Post-Merge Automation CI Run #{run['databaseId']} FAILED on main ({run.get('headSha', '')[:7]}) -> File regression or revert")
    for iss in testing_issues:
        actionable.append(f"Post-Merge QC Manual & Automation Verification -> Testing Issue #{iss['number']}: {iss['title']}")
    if actionable:
        print("\n".join(actionable))
        sys.exit(0)
else:
    label_map = {
        "design": {"Design", "role:design"},
        "be": {"BE", "role:backend"},
        "fe": {"FE", "role:frontend"},
        "mobile": {"mobile", "role:mobile"},
        "architect": {"Architect", "role:architect"},
    }
    target_labels = label_map.get(role, {role})
    actionable = []

    # Priority 0: Open PRs with failing AI Review Agent or Build checks that need immediate fixes on the agent's worktree
    prs = gh_json(["pr", "list", "--state", "open", "--limit", "30", "--json", "number,title,headRefName,mergeable,statusCheckRollup"])
    for pr in prs:
        if str(pr.get("headRefName", "")).startswith("dependabot/"):
            continue
        checks = pr.get("statusCheckRollup") or []
        in_prog = [c for c in checks if c.get("status") != "COMPLETED"]
        failed = [c for c in checks if c.get("conclusion") not in ("SUCCESS", "NEUTRAL", "SKIPPED", "")]
        if failed and not in_prog:
            actionable.append(f"PR #{pr['number']} ({pr['headRefName']}) FAILED Review/Build -> Fix on worktree")
        elif checks and not in_prog and not failed and pr.get("mergeable") == "MERGEABLE":
            actionable.append(f"PR #{pr['number']} ({pr['headRefName']}) Review & Fast Build GREEN -> Merge to main & move ticket to Testing")

    # Priority 1: Todo tickets matching the agent's role
    for iss in trusted_issues("status:todo", 60):
        names = {l.get("name") for l in (iss.get("labels") or [])}
        if names & target_labels:
            actionable.append(f"Issue #{iss['number']}: {iss['title']} -> Dispatch isolated worktree")
    if actionable:
        print("\n".join(actionable))
        sys.exit(0)

sys.exit(1)
PYEOF
)
  if [ $? -eq 0 ] && [ -n "$RESULT" ]; then
    echo "Actionable work detected for [$ROLE]:"
    echo "$RESULT"
    exit 0
  fi
  sleep 20
done
