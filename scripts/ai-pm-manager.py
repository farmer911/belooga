#!/usr/bin/env python3
"""
Belooga AI PM Manager Agent (Powered by Gemini)
Ingests high-level ideas, cross-references live AST and PostgreSQL schema
from CURRENT_STATE.md and GEMINI.md, formulates technical specifications,
and automatically creates linked Backend, Frontend, and QC tasks on GitHub.
"""

import json
import os
import re
import subprocess
import sys
from pathlib import Path

from gemini_client import generate

ROOT_DIR = Path(__file__).resolve().parent.parent
CURRENT_STATE_MD = ROOT_DIR / "CURRENT_STATE.md"
GEMINI_MD = ROOT_DIR / "GEMINI.md"
# Hard cap: the issue text is untrusted LLM input, so one idea can never fan out into an
# unbounded number of status:todo tickets that coding agents will pick up.
MAX_TASKS = 8
ROLES = {"backend", "frontend", "qc"}


def get_issue_details(issue_number: int) -> dict:
    """Fetch issue details from GitHub via gh CLI."""
    try:
        cmd = ["gh", "issue", "view", str(issue_number), "--json", "number,title,body,labels"]
        res = subprocess.check_output(cmd, cwd=str(ROOT_DIR), text=True, encoding="utf-8")
        return json.loads(res)
    except Exception as e:
        print(f"[!] Error fetching issue #{issue_number}: {e}")
        return {}


def create_github_task_issue(title: str, body: str, labels: list[str]) -> int:
    """Create a new GitHub Task Issue using gh CLI."""
    cmd = ["gh", "issue", "create", "--title", title, "--body", body]
    for lbl in labels:
        cmd.extend(["--label", lbl])
    try:
        out = subprocess.check_output(cmd, cwd=str(ROOT_DIR), text=True, encoding="utf-8").strip()
        # Output is issue URL e.g. https://github.com/farmer911/belooga/issues/12
        match = re.search(r"/issues/(\d+)", out)
        if match:
            return int(match.group(1))
        return 0
    except Exception as e:
        print(f"[!] Failed to create issue '{title}': {e}")
        return 0


def post_issue_comment(issue_number: int, comment: str):
    """Post comment to GitHub Issue."""
    cmd = ["gh", "issue", "comment", str(issue_number), "--body", comment]
    try:
        subprocess.check_call(cmd, cwd=str(ROOT_DIR))
    except Exception as e:
        print(f"[!] Failed to post comment on #{issue_number}: {e}")


def main():
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        print("[-] GEMINI_API_KEY is not set. Cannot run PM Agent.")
        sys.exit(0)

    issue_num = None
    raw_idea = ""

    if len(sys.argv) > 1:
        arg = sys.argv[1].strip()
        if arg.isdigit():
            issue_num = int(arg)
        elif arg.startswith("#") and arg[1:].isdigit():
            issue_num = int(arg[1:])
        else:
            raw_idea = " ".join(sys.argv[1:])

    # If triggered via GitHub Actions event
    event_path = os.getenv("GITHUB_EVENT_PATH", "")
    if not issue_num and event_path and os.path.exists(event_path):
        try:
            with open(event_path, "r", encoding="utf-8") as f:
                event_data = json.load(f)
            issue_num = event_data.get("issue", {}).get("number")
        except Exception as e:
            print(f"[!] Could not read GITHUB_EVENT_PATH: {e}")

    if not issue_num and not raw_idea:
        print("Usage: python3 scripts/ai-pm-manager.py <issue_number | 'idea string'>")
        sys.exit(1)

    issue_data = {}
    if issue_num:
        print(f"[*] Fetching Issue #{issue_num} from GitHub...")
        issue_data = get_issue_details(issue_num)
        idea_title = issue_data.get("title", f"Idea #{issue_num}")
        idea_body = issue_data.get("body", "")
    else:
        idea_title = "User Proposed Idea"
        idea_body = raw_idea

    current_state = CURRENT_STATE_MD.read_text(encoding="utf-8") if CURRENT_STATE_MD.exists() else ""
    gemini_rules = GEMINI_MD.read_text(encoding="utf-8") if GEMINI_MD.exists() else ""

    print(f"[*] Analyzing Idea: '{idea_title}'...")

    prompt = f"""
You are the Belooga Staff Principal Product Manager & Lead Enterprise Architect.
Your mission is to ingest the following user idea, cross-reference it against the Belooga codebase ground truth,
and decompose it into a pristine, actionable technical specification and concrete engineering tasks.

### BELOOGA ARCHITECTURAL LAWS (GEMINI.md)
{gemini_rules}

### BELOOGA CODEBASE GROUND TRUTH (CURRENT_STATE.md)
{current_state}

### USER'S PROPOSED IDEA
Title: {idea_title}
Details:
{idea_body}

### STRICT LANGUAGE REQUIREMENT (NON-NEGOTIABLE)
ALL generated outputs (summaries, PRDs, task titles, user stories, acceptance criteria, and task bodies) MUST BE 100% IN PROFESSIONAL TECHNICAL ENGLISH.
Even if the user's input idea or title is in Vietnamese or another language, you must translate, synthesize, and write ALL ticket titles and content strictly in English. Never use Vietnamese in any ticket title or body.

### YOUR TASK
1. Assess feasibility, data architecture, and existing API reuse.
2. Formulate a technical architecture specification (PRD) in English.
3. Decompose the feature into strictly 2 to 3 discrete engineering tasks in English:
   - Backend Task (FastAPI endpoint, PostgreSQL migration/schema, IDOR guard, TDD Pytest)
   - Frontend Task (Next.js App Router UI, state management, API integration, Tailwind styling)
   - (Optional) QC Task (Playwright test scenario)

You MUST respond strictly with valid JSON conforming to this schema (do not wrap in extra prose, output ONLY the JSON object):
{{
  "summary": "2-3 sentence executive summary of the feature and architecture in English",
  "spec_markdown": "Full PRD with User Stories, Architectural Decisions, Endpoints to touch, Tables to modify or create, and Acceptance Criteria in English",
  "tasks": [
    {{
      "role": "backend",
      "title": "[BE]: Brief descriptive English title",
      "body": "Detailed backend implementation plan in English citing specific files, endpoints, schema changes, and test files."
    }},
    {{
      "role": "frontend",
      "title": "[FE]: Brief descriptive English title",
      "body": "Detailed frontend implementation plan in English citing specific page files, UI components, states, and data fetching."
    }}
  ]
}}
"""

    print("[*] Requesting PM decomposition from Gemini AI...")
    try:
        raw_response = generate(api_key, prompt, max_tokens=8192, json_mode=True)
    except Exception as e:
        print(f"[!] Gemini call failed: {e}")
        sys.exit(1)

    # Extract JSON object reliably
    clean_json = raw_response.strip()
    match = re.search(r"\{.*\}", clean_json, re.DOTALL)
    if match:
        clean_json = match.group(0)

    try:
        plan = json.loads(clean_json)
    except Exception as e:
        print(f"[!] Failed to parse Gemini response as JSON: {e}\nRaw was:\n{raw_response}")
        sys.exit(1)

    spec_md = str(plan.get("spec_markdown", ""))
    tasks = [t for t in plan.get("tasks", []) if isinstance(t, dict)] if isinstance(plan.get("tasks"), list) else []
    if len(tasks) > MAX_TASKS:
        print(f"[!] Gemini proposed {len(tasks)} tasks; keeping the first {MAX_TASKS}.")
        tasks = tasks[:MAX_TASKS]

    print(f"\n[✓] PM Decomposition Successful! Generated {len(tasks)} engineering tasks.")

    created_task_ids = []
    parent_ref = f"#{issue_num}" if issue_num else "Direct Submission"

    for t in tasks:
        role = str(t.get("role", "backend")).lower()
        title = str(t.get("title", f"[{role.upper()}] Task"))[:120]
        body = str(t.get("body", ""))
        
        full_body = f"""### 📋 Context & Parent Idea
Originating from {parent_ref}: **{idea_title}**

### 🎯 Task Objective & Scope
{body}

---
*Created automatically by Belooga AI PM Manager Agent*
"""
        role_label = f"role:{role}" if role in ROLES else "type:task"
        labels = ["type:task", "status:todo", role_label]
        
        print(f"[*] Creating GitHub Task: {title}...")
        tid = create_github_task_issue(title, full_body, labels)
        if tid:
            created_task_ids.append(tid)
            print(f"    [+] Created Task #{tid}")

    # Post spec summary on parent issue if applicable
    if issue_num:
        task_links = "\n".join([f"- Task #{tid}: Assigned to {tasks[idx].get('role', 'eng').upper()}" for idx, tid in enumerate(created_task_ids)])
        comment_body = f"""## 🤖 Belooga PM Agent Analysis & Decomposition Complete

### 📌 Architecture Summary
{plan.get("summary", "")}

### 🛠️ Generated Engineering Tasks
{task_links}

<details>
<summary><b>🔍 View Full Technical Specification (PRD)</b></summary>

{spec_md}

</details>

---
*Status updated to `status:in-progress`. Work can now be dispatched to FE/BE agents.*
"""
        print(f"[*] Updating Parent Issue #{issue_num} with PRD and task references...")
        post_issue_comment(issue_num, comment_body)
        # Update label
        try:
            subprocess.check_call(
                ["gh", "issue", "edit", str(issue_num), "--remove-label", "status:todo", "--add-label", "status:in-progress"],
                cwd=str(ROOT_DIR)
            )
        except Exception as e:
            sys.stderr.write(f"[warn] GitHub label update skipped: {e}\n")

    print("\n" + "=" * 60)
    print("✓ All tasks generated and synced to GitHub successfully!")
    print("=" * 60)


if __name__ == "__main__":
    main()
