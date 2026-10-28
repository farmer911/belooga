"""Trust gate for issues that coding agents act on (agent-dispatch.py, watch-kanban.sh).

This repo is public: anyone can open an issue, and its body becomes an agent prompt.
Only issues authored by repo owners/members/collaborators (or the Actions bot that the
gated AI PM workflow uses) may be dispatched.
"""
import json
import subprocess

TRUSTED_ASSOCIATIONS = {"OWNER", "MEMBER", "COLLABORATOR"}
TRUSTED_BOTS = {"github-actions[bot]"}


def is_trusted(issue: dict) -> bool:
    """`issue` is a GitHub REST issue object (has author_association and user.login)."""
    return (
        issue.get("author_association") in TRUSTED_ASSOCIATIONS
        or (issue.get("user") or {}).get("login") in TRUSTED_BOTS
    )


def gh_api(path: str):
    """GET a REST path via `gh api` ({owner}/{repo} placeholders are resolved by gh)."""
    out = subprocess.check_output(["gh", "api", path], text=True, encoding="utf-8", stderr=subprocess.DEVNULL)
    return json.loads(out)


if __name__ == "__main__":
    assert is_trusted({"author_association": "OWNER", "user": {"login": "farmer911"}})
    assert is_trusted({"author_association": "NONE", "user": {"login": "github-actions[bot]"}})
    assert not is_trusted({"author_association": "NONE", "user": {"login": "outsider"}})
    assert not is_trusted({"author_association": "CONTRIBUTOR", "user": {"login": "drive-by"}})
    assert not is_trusted({})
    print("kanban_trust self-check OK")
