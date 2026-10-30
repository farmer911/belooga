#!/usr/bin/env python3
"""
Belooga Domain-Specialized AI Code Reviewer Agents (Backend / Frontend / Mobile)
Partitions git diffs by domain, loads domain-specific review skills
(be-code-review/SKILL.md, fe-code-review/SKILL.md), posts domain review reports
to GitHub PR comments + Step Summary, and exits 1 on CHANGES REQUESTED.
"""

import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

from gemini_client import generate

ROOT_DIR = Path(__file__).resolve().parent.parent
GEMINI_MD = ROOT_DIR / "GEMINI.md"
BE_REVIEW_SKILL = ROOT_DIR / ".agents" / "skills" / "be-code-review" / "SKILL.md"
FE_REVIEW_SKILL = ROOT_DIR / ".agents" / "skills" / "fe-code-review" / "SKILL.md"


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
        diff_output = subprocess.check_output(diff_cmd, cwd=str(ROOT_DIR), text=True, encoding="utf-8")
    except subprocess.CalledProcessError:
        try:
            diff_output = subprocess.check_output(
                ["git", "show", "HEAD", "--stat", "--patch"],
                cwd=str(ROOT_DIR), text=True, encoding="utf-8",
            )
        except Exception as e:
            print(f"[!] Could not obtain git diff: {e}")
            diff_output = ""

    return diff_output


def partition_diff_by_domain(diff_text: str) -> dict[str, str]:
    """Split a unified git diff into backend, frontend, mobile, and other chunks."""
    buckets: dict[str, list[str]] = {"backend": [], "frontend": [], "mobile": [], "other": []}
    if not diff_text:
        return {k: "" for k in buckets}

    chunks = re.split(r"(?=^diff --git )", diff_text, flags=re.MULTILINE)
    for chunk in chunks:
        if not chunk.strip():
            continue
        first_line = chunk.splitlines()[0]
        m = re.match(r"^diff --git a/(\S+)\s+b/(\S+)", first_line)
        rel_path = m.group(2) if m else ""
        if rel_path.startswith(("backend/", "scripts/")):
            buckets["backend"].append(chunk)
        elif rel_path.startswith("frontend/"):
            buckets["frontend"].append(chunk)
        elif rel_path.startswith("mobile/"):
            buckets["mobile"].append(chunk)
        else:
            buckets["other"].append(chunk)

    return {k: "".join(v) for k, v in buckets.items()}


def read_project_rules() -> str:
    """Read the always-on rules from GEMINI.md."""
    if GEMINI_MD.exists():
        return GEMINI_MD.read_text(encoding="utf-8")
    return "Enforce clean code, async safety, zero mock fallbacks, and valid tests."


def read_domain_review_rules(domain: str) -> str:
    """Load the dedicated BE / FE / Mobile adversarial code review skill."""
    norm = domain.lower().strip()
    if norm == "backend" and BE_REVIEW_SKILL.exists():
        return BE_REVIEW_SKILL.read_text(encoding="utf-8")
    if norm == "frontend" and FE_REVIEW_SKILL.exists():
        return FE_REVIEW_SKILL.read_text(encoding="utf-8")
    if norm == "mobile":
        return (
            "name: mobile-code-review\n"
            "- Enforce Expo SDK 58 + React Native 0.88 TypeScript strictness, @tanstack/react-query, "
            "expo-secure-store for tokens, and zero mock/fallback arrays."
        )
    return read_project_rules()


def has_blocking_verdict(review_markdown: str) -> bool:
    """Return True if the AI Reviewer issued a blocking CHANGES REQUESTED verdict."""
    for line in review_markdown.splitlines():
        if "Verdict:" in line and "CHANGES REQUESTED" in line.upper():
            return True
    return False


def post_github_comment(review_text: str):
    """Post the review as a PR comment (pull_request events only; needs pull-requests: write)."""
    github_token = os.getenv("GITHUB_TOKEN")
    repo = os.getenv("GITHUB_REPOSITORY")
    event_name = os.getenv("GITHUB_EVENT_NAME", "")
    event_path = os.getenv("GITHUB_EVENT_PATH", "")

    if not github_token or not repo:
        print("[*] GITHUB_TOKEN or GITHUB_REPOSITORY not set. Skipping API comment.")
        return

    headers = {
        "Authorization": f"Bearer {github_token}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "Belooga-AI-Reviewer",
    }

    url = None
    payload = {"body": review_text}

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

    if not url:
        print("[*] Not a pull_request event: review is in the step summary only.")
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
                f.write("\n\n---\n*Automated review generated by Belooga Domain AI Code Reviewer Agent*\n")
            print("[✓] Wrote AI review to GITHUB_STEP_SUMMARY.")
        except Exception as e:
            print(f"[!] Could not write to GITHUB_STEP_SUMMARY: {e}")


def review_single_domain(api_key: str, domain: str, domain_diff: str, project_rules: str) -> str:
    """Execute the specialized review agent for a single domain (backend, frontend, mobile)."""
    truncated = False
    if len(domain_diff) > 50000:
        domain_diff = domain_diff[:50000] + "\n\n... [Diff truncated for AI review] ..."
        truncated = True

    domain_skill = read_domain_review_rules(domain)
    domain_label = domain.upper()

    prompt = f"""
You are the Belooga Staff Principal {domain_label} AI Code Reviewer Agent.
Perform an uncompromising, accurate code review on the {domain_label} git diff below.

### PROJECT GROUND TRUTH & LAWS (GEMINI.md)
{project_rules}

### DOMAIN REVIEW SKILL ({domain_label})
{domain_skill}

### GIT DIFF TO REVIEW ({domain_label})
```diff
{domain_diff}
```
{"Note: Diff was truncated due to length." if truncated else ""}

### OUTPUT FORMAT REQUIREMENTS
Format your response in GitHub-flavored Markdown:
## 🤖 Belooga {domain_label} AI Code Review Report

### 🎯 Verdict: [PASS ✅ | WARNINGS ⚠️ | CHANGES REQUESTED 🛑]
(Issue CHANGES REQUESTED 🛑 ONLY for actual bugs, IDOR/security holes, blocking async calls, mock/fallback violations, or broken contracts.)

### 📋 Executive Summary
(2-3 concise bullet points)

### 🔍 Domain Checklist ({domain_label})
- **Architecture & Layering:**
- **Security, IDOR & Data Integrity:**
- **Performance & Ponytail Minimalism:**
"""
    return generate(api_key, prompt, max_tokens=3072, timeout=45) or ""


def main():
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        print("[-] GEMINI_API_KEY is not set. Skipping AI review.")
        sys.exit(0)

    requested_domain = os.getenv("REVIEW_DOMAIN", "all").lower().strip()
    if len(sys.argv) > 1 and sys.argv[1] in ("backend", "frontend", "mobile", "all"):
        requested_domain = sys.argv[1]

    full_diff = get_git_diff()
    if not full_diff or len(full_diff.strip()) < 10:
        print("[*] No code changes detected in diff. Nothing to review.")
        sys.exit(0)

    partitions = partition_diff_by_domain(full_diff)
    project_rules = read_project_rules()

    domains_to_run = (
        [requested_domain]
        if requested_domain in ("backend", "frontend", "mobile")
        else [d for d in ("backend", "frontend", "mobile") if partitions.get(d, "").strip()]
    )

    if not domains_to_run:
        if requested_domain in ("backend", "frontend", "mobile"):
            print(f"[*] No {requested_domain} changes in this PR. Skipping {requested_domain} review agent.")
            sys.exit(0)
        domains_to_run = ["other"]

    blocking = False
    for dom in domains_to_run:
        dom_diff = partitions.get(dom, "") or full_diff
        if not dom_diff.strip():
            continue
        print(f"[*] Running Dedicated {dom.upper()} AI Code Review Agent...")
        try:
            report = review_single_domain(api_key, dom, dom_diff, project_rules)
        except Exception as e:
            print(f"[!] {dom.upper()} AI Review failed: {e}")
            continue
        if not report:
            continue
        print("\n" + "=" * 60)
        print(report)
        print("=" * 60 + "\n")
        write_step_summary(report)
        post_github_comment(report)
        if has_blocking_verdict(report):
            blocking = True

    if blocking:
        print("[!] Blocking verdict (CHANGES REQUESTED) detected by AI Review Agent.")
        sys.exit(1)


if __name__ == "__main__":
    main()
