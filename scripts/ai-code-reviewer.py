#!/usr/bin/env python3
"""
Belooga AI Code Reviewer Agent (Powered by Gemini)
Inspects git diffs against GEMINI.md invariants, Ponytail principles,
security boundaries, and async safety. Posts findings to GitHub Step Summary,
PR comments, or commit comments.
"""

import json
import os
import subprocess
import sys
import urllib.request
import urllib.error
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
GEMINI_MD = ROOT_DIR / "GEMINI.md"

GEMINI_MODELS = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
]


def get_git_diff() -> str:
    """Extract git diff for the current commit or pull request."""
    event_name = os.getenv("GITHUB_EVENT_NAME", "")
    event_path = os.getenv("GITHUB_EVENT_PATH", "")

    diff_cmd = ["git", "diff", "HEAD~1..HEAD"]

    if event_name == "pull_request" and event_path and os.path.exists(event_path):
        try:
            with open(event_path, "r", encoding="utf-8") as f:
                event_data = json.load(f)
            base_ref = event_data.get("pull_request", {}).get("base", {}).get("ref")
            if base_ref:
                diff_cmd = ["git", "diff", f"origin/{base_ref}...HEAD"]
        except Exception as e:
            print(f"[!] Warning: Could not parse PR base ref: {e}")

    try:
        diff_output = subprocess.check_output(diff_cmd, cwd=str(ROOT_DIR), text=True)
    except subprocess.CalledProcessError:
        # Fallback to single commit diff
        try:
            diff_output = subprocess.check_output(["git", "show", "HEAD", "--stat", "--patch"], cwd=str(ROOT_DIR), text=True)
        except Exception as e:
            print(f"[!] Could not obtain git diff: {e}")
            diff_output = ""

    return diff_output


def read_project_rules() -> str:
    """Read the always-on rules from GEMINI.md."""
    if GEMINI_MD.exists():
        return GEMINI_MD.read_text(encoding="utf-8")
    return "Enforce clean code, async safety, zero mock fallbacks, and valid tests."


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
        except Exception as e:
            pass
    return discovered


def call_gemini_api(api_key: str, prompt: str) -> str:
    """Call Google Gemini API using pure standard library (urllib) with dynamic model discovery."""
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
            "maxOutputTokens": 4096
        }
    }
    data = json.dumps(payload).encode("utf-8")

    available_targets = discover_gemini_models(api_key)
    if available_targets:
        print(f"[*] Discovered {len(available_targets)} supported model targets.")

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
            with urllib.request.urlopen(req, timeout=45) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                candidates = result.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        print(f"[✓] Successfully generated review using {ver}/{model}")
                        return parts[0].get("text", "")
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")
            print(f"[!] Gemini API Error on {ver}/{model} (HTTP {e.code}): {err_body}")
            last_error = e
        except Exception as e:
            print(f"[!] Connection error on {ver}/{model}: {e}")
            last_error = e

    if last_error:
        raise last_error
    return ""


def post_github_comment(review_text: str):
    """Post comment to GitHub Pull Request or Commit using GitHub REST API."""
    github_token = os.getenv("GITHUB_TOKEN")
    repo = os.getenv("GITHUB_REPOSITORY")
    event_name = os.getenv("GITHUB_EVENT_NAME", "")
    event_path = os.getenv("GITHUB_EVENT_PATH", "")
    sha = os.getenv("GITHUB_SHA", "")

    if not github_token or not repo:
        print("[*] GITHUB_TOKEN or GITHUB_REPOSITORY not set. Skipping API comment.")
        return

    headers = {
        "Authorization": f"Bearer {github_token}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "Belooga-AI-Reviewer"
    }

    url = None
    payload = {"body": review_text}

    # 1. Pull Request Comment
    if event_name == "pull_request" and event_path and os.path.exists(event_path):
        try:
            with open(event_path, "r", encoding="utf-8") as f:
                event_data = json.load(f)
            pr_num = event_data.get("pull_request", {}).get("number")
            if pr_num:
                url = f"https://api.github.com/repos/{repo}/issues/{pr_num}/comments"
                print(f"[*] Posting review to PR #{pr_num}...")
        except Exception as e:
            print(f"[!] Failed to parse PR event for commenting: {e}")

    # 2. Commit Comment (Push)
    if not url and sha:
        url = f"https://api.github.com/repos/{repo}/commits/{sha}/comments"
        print(f"[*] Posting review to Commit {sha[:8]}...")

    if not url:
        print("[!] No target PR or commit found for comment.")
        return

    try:
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=20) as resp:
            print(f"[✓] Successfully posted AI review comment (HTTP {resp.status}).")
    except urllib.error.HTTPError as e:
        print(f"[!] Warning: GitHub comment API returned HTTP {e.code}: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"[!] Warning: Failed to post GitHub comment: {e}")


def write_step_summary(review_text: str):
    """Write markdown summary to GITHUB_STEP_SUMMARY for native visual view in Actions UI."""
    summary_path = os.getenv("GITHUB_STEP_SUMMARY")
    if summary_path:
        try:
            with open(summary_path, "a", encoding="utf-8") as f:
                f.write(review_text)
                f.write("\n\n---\n*Automated review generated by Belooga AI Code Reviewer Agent (Gemini 2.0)*\n")
            print(f"[✓] Wrote AI review to GITHUB_STEP_SUMMARY.")
        except Exception as e:
            print(f"[!] Could not write to GITHUB_STEP_SUMMARY: {e}")


def main():
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        print("[-] GEMINI_API_KEY is not set. Skipping AI review.")
        sys.exit(0)

    diff = get_git_diff()
    if not diff or len(diff.strip()) < 10:
        print("[*] No code changes detected in diff. Nothing to review.")
        sys.exit(0)

    # Truncate diff if extremely large to prevent token exhaustion (> 60,000 chars)
    truncated = False
    if len(diff) > 60000:
        diff = diff[:60000] + "\n\n... [Diff truncated for AI review] ..."
        truncated = True

    rules = read_project_rules()

    prompt = f"""
You are the Belooga Staff Principal AI Code Reviewer.
Your role is to perform an uncompromising, constructive, and accurate code review on the git diff below.

### PROJECT GROUND TRUTH & LAWS (GEMINI.md)
{rules}

### ABSOLUTE REVIEW CRITERIA
1. **Rule 1: Never edit legacy/**: Any modification to files inside legacy/ is strictly prohibited.
2. **Rule 2: No Fake Success UI**: Stubs or buttons with fake toasts without real backend endpoints are prohibited.
3. **Rule 3: Async Event Loop Safety**: Never use synchronous blocking I/O (`open()`, `doc.build()`, etc.) inside async endpoints. Must use `asyncio.to_thread`.
4. **Rule 4: Search Conformance (ADR-005)**: Never use unindexed search fallbacks (`OR ILIKE` on search queries). Must rely on PostgreSQL GIN `search_vector`.
5. **Rule 5: No Proof = Not Done**: New endpoints or bug fixes must include tests.
6. **Ponytail Simplicity**: The best code is minimal, robust, and borrows from existing patterns. Reject speculative abstractions and unnecessary dependencies.
7. **Security & IDOR**: Mutations must check authenticated user ownership. PII (email, phone) must not leak to anonymous users.

### GIT DIFF TO REVIEW
```diff
{diff}
```
{"Note: Diff was truncated due to length." if truncated else ""}

### OUTPUT FORMAT REQUIREMENTS
Format your entire response in clear GitHub-flavored Markdown:
## 🤖 Belooga AI Code Review Report

### 🎯 Verdict: [PASS ✅ | WARNINGS ⚠️ | CHANGES REQUESTED 🛑]
(One-sentence executive verdict summarizing code safety and readiness)

### 📋 Executive Summary
(2-3 bullet points summarizing what this change introduces and overall engineering quality)

### 🔍 Detailed Analysis
- **Architecture & Rules Compliance:** (Check against GEMINI.md 5 Prohibitions)
- **Security & Integrity:** (IDOR, PII leakage, input validation)
- **Performance & Async Safety:** (Event loop non-blocking, database indexing)
- **Code Simplicity (Ponytail):** (Over-engineering check, minimal diff)

### 💡 Specific Suggestions & Improvements
(Point to specific files/lines if any, with concise code snippets if applicable)
"""

    print("[*] Querying Gemini AI for code review analysis...")
    try:
        review_markdown = call_gemini_api(api_key, prompt)
    except Exception as e:
        print(f"[!] AI Review failed: {e}")
        sys.exit(0)  # Do not block the build if API has temporary outage

    if not review_markdown:
        print("[!] No review content returned from Gemini.")
        sys.exit(0)

    # Output to console
    print("\n" + "=" * 60)
    print(review_markdown)
    print("=" * 60 + "\n")

    # Write to Step Summary
    write_step_summary(review_markdown)

    # Post comment to GitHub
    post_github_comment(review_markdown)


if __name__ == "__main__":
    main()
