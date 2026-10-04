#!/usr/bin/env python3
"""
Belooga Agent Dispatcher
Fetches a Task Issue from GitHub, checks out an isolated feature branch,
updates issue status to 'status:in-progress', and prints the implementation contract.
"""

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent


def slugify(text: str) -> str:
    text = re.sub(r"[^\w\s-]", "", text.lower()).strip()
    return re.sub(r"[-\s]+", "-", text)[:30]


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/agent-dispatch.py <issue_number>")
        sys.exit(1)

    issue_arg = sys.argv[1].lstrip("#")
    if not issue_arg.isdigit():
        print(f"[!] Invalid issue number: {sys.argv[1]}")
        sys.exit(1)

    issue_num = int(issue_arg)

    print(f"[*] Fetching Task #{issue_num} from GitHub...")
    try:
        raw = subprocess.check_output(
            ["gh", "issue", "view", str(issue_num), "--json", "number,title,body,labels"],
            cwd=str(ROOT_DIR),
            text=True
        )
        issue = json.loads(raw)
    except Exception as e:
        print(f"[!] Failed to fetch issue #{issue_num}: {e}")
        sys.exit(1)

    title = issue.get("title", f"Task {issue_num}")
    body = issue.get("body", "")
    slug = slugify(title)
    branch_name = f"feat/issue-{issue_num}-{slug}"

    print(f"\n[+] Preparing workspace for Task #{issue_num}: '{title}'")
    print(f"[*] Creating & switching to branch '{branch_name}'...")

    try:
        subprocess.check_call(["git", "checkout", "-b", branch_name], cwd=str(ROOT_DIR))
    except subprocess.CalledProcessError:
        print(f"[*] Branch '{branch_name}' may already exist. Switching...")
        subprocess.check_call(["git", "checkout", branch_name], cwd=str(ROOT_DIR))

    # Update issue label to status:in-progress
    try:
        subprocess.check_call(
            ["gh", "issue", "edit", str(issue_num), "--remove-label", "status:todo", "--add-label", "status:in-progress"],
            cwd=str(ROOT_DIR)
        )
        print(f"[✓] Updated GitHub Issue #{issue_num} label to 'status:in-progress'.")
    except Exception as e:
        print(f"[!] Warning: Could not update issue status label: {e}")

    print("\n" + "=" * 70)
    print(f"🎯 TASK CONTEXT LOADED: #{issue_num} - {title}")
    print("=" * 70)
    print(body)
    print("=" * 70)
    print("\n💡 NEXT STEPS FOR AGENT:")
    print("1. Follow TDD Workflow: Write failing pytest / Playwright test first.")
    print("2. Implement minimal working code abiding by GEMINI.md rules.")
    print("3. Verify with `bash scripts/audit-truth.sh`.")
    print(f"4. Commit and open Pull Request: `gh pr create --title \"{title}\" --body \"Closes #{issue_num}\"`")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
