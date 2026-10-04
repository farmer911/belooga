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
import urllib.request
import urllib.error
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
CURRENT_STATE_MD = ROOT_DIR / "CURRENT_STATE.md"
GEMINI_MD = ROOT_DIR / "GEMINI.md"


def discover_gemini_models(api_key: str) -> list[str]:
    """Query Google API to discover available models for this specific API key."""
    discovered = []
    for ver in ["v1beta", "v1"]:
        url = f"https://generativelanguage.googleapis.com/{ver}/models?key={api_key}"
        try:
            req = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                for m in data.get("models", []):
                    methods = m.get("supportedGenerationMethods", [])
                    if "generateContent" in methods:
                        name = m.get("name", "").replace("models/", "")
                        if name and f"{ver}/{name}" not in discovered:
                            discovered.append(f"{ver}/{name}")
        except Exception:
            pass
    return discovered


def call_gemini_api(api_key: str, prompt: str) -> str:
    """Call Google Gemini API using pure standard library (urllib)."""
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 8192
        }
    }
    data = json.dumps(payload).encode("utf-8")

    available_targets = discover_gemini_models(api_key)
    preferred = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro"
    ]
    targets_to_try = []
    for pref in preferred:
        for target in available_targets:
            if pref in target and target not in targets_to_try:
                targets_to_try.append(target)
    for target in available_targets:
        if target not in targets_to_try:
            targets_to_try.append(target)

    if not targets_to_try:
        targets_to_try = ["v1beta/gemini-1.5-flash", "v1/gemini-1.5-flash", "v1beta/gemini-pro"]

    last_error = None
    for target in targets_to_try:
        if "/" in target:
            ver, model = target.split("/", 1)
        else:
            ver, model = "v1beta", target
        url = f"https://generativelanguage.googleapis.com/{ver}/models/{model}:generateContent?key={api_key}"
        try:
            req = urllib.request.Request(url, data=data, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=60) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                candidates = result.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "")
        except urllib.error.HTTPError as e:
            last_error = e
        except Exception as e:
            last_error = e

    if last_error:
        raise last_error
    return ""


def get_issue_details(issue_number: int) -> dict:
    """Fetch issue details from GitHub via gh CLI."""
    try:
        cmd = ["gh", "issue", "view", str(issue_number), "--json", "number,title,body,labels"]
        res = subprocess.check_output(cmd, cwd=str(ROOT_DIR), text=True)
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
        out = subprocess.check_output(cmd, cwd=str(ROOT_DIR), text=True).strip()
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

### YOUR TASK
1. Assess feasibility, data architecture, and existing API reuse.
2. Formulate a technical architecture specification (PRD).
3. Decompose the feature into strictly 2 to 3 discrete engineering tasks:
   - Backend Task (FastAPI endpoint, PostgreSQL migration/schema, IDOR guard, TDD Pytest)
   - Frontend Task (Next.js App Router UI, state management, API integration, Tailwind styling)
   - (Optional) QC Task (Playwright test scenario)

You MUST respond strictly with valid JSON conforming to this schema (do not wrap in extra prose, output ONLY the JSON object):
{{
  "summary": "2-3 sentence executive summary of the feature and architecture",
  "spec_markdown": "Full PRD with User Stories, Architectural Decisions, Endpoints to touch, Tables to modify or create, and Acceptance Criteria",
  "tasks": [
    {{
      "role": "backend",
      "title": "[BE]: Brief descriptive title",
      "body": "Detailed backend implementation plan citing specific files, endpoints, schema changes, and test files."
    }},
    {{
      "role": "frontend",
      "title": "[FE]: Brief descriptive title",
      "body": "Detailed frontend implementation plan citing specific page files, UI components, states, and data fetching."
    }}
  ]
}}
"""

    print("[*] Requesting PM decomposition from Gemini AI...")
    try:
        raw_response = call_gemini_api(api_key, prompt)
    except Exception as e:
        print(f"[!] Gemini call failed: {e}")
        sys.exit(1)

    # Clean markdown json fencing if returned
    clean_json = raw_response.strip()
    if clean_json.startswith("```"):
        clean_json = re.sub(r"^```(?:json)?\n", "", clean_json)
        clean_json = re.sub(r"\n```$", "", clean_json)

    try:
        plan = json.loads(clean_json)
    except Exception as e:
        print(f"[!] Failed to parse Gemini response as JSON: {e}\nRaw was:\n{raw_response}")
        sys.exit(1)

    spec_md = plan.get("spec_markdown", "")
    tasks = plan.get("tasks", [])

    print(f"\n[✓] PM Decomposition Successful! Generated {len(tasks)} engineering tasks.")

    created_task_ids = []
    parent_ref = f"#{issue_num}" if issue_num else "Direct Submission"

    for t in tasks:
        role = t.get("role", "backend")
        title = t.get("title", f"[{role.upper()}] Task")
        body = t.get("body", "")
        
        full_body = f"""### 📋 Context & Parent Idea
Originating from {parent_ref}: **{idea_title}**

### 🎯 Task Objective & Scope
{body}

---
*Created automatically by Belooga AI PM Manager Agent*
"""
        role_label = f"role:{role}" if role in ["backend", "frontend", "qc"] else "type:task"
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
        except Exception:
            pass

    print("\n" + "=" * 60)
    print("✓ All tasks generated and synced to GitHub successfully!")
    print("=" * 60)


if __name__ == "__main__":
    main()
