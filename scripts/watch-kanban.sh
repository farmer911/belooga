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
    prs = gh_json(["pr", "list", "--state", "open", "--limit", "50", "--json", "number,title,headRefName,mergeable,statusCheckRollup"])
    actionable = []
    for pr in prs:
        checks = pr.get("statusCheckRollup") or []
        in_prog = [c for c in checks if c.get("status") != "COMPLETED"]
        failed = [c for c in checks if c.get("conclusion") not in ("SUCCESS", "NEUTRAL", "SKIPPED", "")]
        mergeable = pr.get("mergeable")
        if checks and not in_prog and not failed and mergeable == "MERGEABLE":
            actionable.append(f"PR #{pr['number']} ({pr['headRefName']}) ALL CI GREEN & MERGEABLE -> Verify & Merge")
    for iss in testing_issues:
        # Check if there is a matching PR with still-running checks
        matching_pr = next((p for p in prs if f"#{iss['number']}" in p.get("title", "") or ("BEL-" in iss.get("title", "") and iss["title"].split("]")[0].strip("[") in p.get("headRefName", ""))), None)
        if matching_pr:
            checks = matching_pr.get("statusCheckRollup") or []
            in_prog = [c for c in checks if c.get("status") != "COMPLETED"]
            if not checks or in_prog:
                continue
        actionable.append(f"Testing Issue #{iss['number']}: {iss['title']}")
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
    todo = []
    for iss in trusted_issues("status:todo", 60):
        names = {l.get("name") for l in (iss.get("labels") or [])}
        if names & target_labels:
            todo.append(f"Issue #{iss['number']}: {iss['title']}")
    if todo:
        print("\n".join(todo))
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
