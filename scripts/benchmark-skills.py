#!/usr/bin/env python3
"""Empirical A/B Skill Benchmark Parser (reads real subagent transcript_full.jsonl)."""

from __future__ import annotations

from datetime import datetime
import json
import pathlib
import sys


def parse_subagent_transcript(cid: str, label: str, index_chars: int, skill_count: int) -> dict:
    p = pathlib.Path.home() / f".gemini/antigravity/brain/{cid}/.system_generated/logs/transcript_full.jsonl"
    if not p.exists():
        raise FileNotFoundError(f"Transcript not found: {p}")
    lines = [json.loads(line) for line in p.read_text(encoding="utf-8").splitlines() if line.strip()]
    t0 = datetime.fromisoformat(lines[0]["created_at"])
    t1 = datetime.fromisoformat(lines[-1]["created_at"])
    wall_sec = (t1 - t0).total_seconds()

    planner_steps = [s for s in lines if s.get("type") == "PLANNER_RESPONSE"]
    tool_calls = []
    skill_reads = []
    thinking_chars = 0
    content_chars = 0
    tool_output_chars = 0

    for s in lines:
        if s.get("type") == "PLANNER_RESPONSE":
            thinking_chars += len(s.get("thinking") or "")
            content_chars += len(s.get("content") or "")
            for tc in s.get("tool_calls") or []:
                tool_calls.append(tc)
                args = tc.get("arguments") or tc.get("args") or {}
                if isinstance(args, str):
                    try:
                        args = json.loads(args)
                    except Exception:
                        args = {}
                path = args.get("AbsolutePath", "") if isinstance(args, dict) else str(args)
                if ".agents/" in path:
                    skill_reads.append(path)
        else:
            tool_output_chars += len(s.get("content") or "")

    index_tokens_per_turn = index_chars // 4
    cum_index_tokens = index_tokens_per_turn * len(planner_steps)
    tool_tokens = tool_output_chars // 4
    gen_tokens = (thinking_chars + content_chars) // 4
    total_tokens = cum_index_tokens + tool_tokens + gen_tokens

    return {
        "label": label,
        "cid": cid,
        "skills": skill_count,
        "steps": len(lines),
        "llm_turns": len(planner_steps),
        "tool_calls": len(tool_calls),
        "skill_reads": len(skill_reads),
        "wall_sec": wall_sec,
        "index_tokens_per_turn": index_tokens_per_turn,
        "cum_index_tokens": cum_index_tokens,
        "tool_tokens": tool_tokens,
        "gen_tokens": gen_tokens,
        "total_tokens": total_tokens,
    }


if __name__ == "__main__":
    cid_a = sys.argv[1] if len(sys.argv) > 1 else "f3388ebc-5b3b-40a8-8944-1dbc19c3de97"
    cid_b = sys.argv[2] if len(sys.argv) > 2 else "f10f7626-5bd1-4266-9128-87f6ee029d39"
    a = parse_subagent_transcript(cid_a, "Branch A (41 Skills)", index_chars=14960, skill_count=41)
    b = parse_subagent_transcript(cid_b, "Branch B (23 Skills)", index_chars=8539, skill_count=23)
    for r in (a, b):
        print(
            f"{r['label']}: {r['wall_sec']:.1f}s | turns={r['llm_turns']} | tools={r['tool_calls']} "
            f"| .agents reads={r['skill_reads']} | total_tokens=~{r['total_tokens']:,}"
        )
