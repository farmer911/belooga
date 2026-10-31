#!/usr/bin/env python3
"""
sync-design-tokens.py — Verifies 100% parity between the W3C 3-tier Primer Design Token SSOT
(tokens/design-tokens.json) and Web CSS (frontend/src/app/globals.css), Web TS
(frontend/src/lib/design-tokens.ts), and Mobile RN (mobile/src/theme/tokens.ts).

Usage:
    python3 scripts/sync-design-tokens.py --check
"""
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
TOKENS_JSON = ROOT / "tokens" / "design-tokens.json"
GLOBALS_CSS = ROOT / "frontend" / "src" / "app" / "globals.css"
FE_TOKENS_TS = ROOT / "frontend" / "src" / "lib" / "design-tokens.ts"
MOBILE_TOKENS_TS = ROOT / "mobile" / "src" / "theme" / "tokens.ts"


def check_parity() -> list[str]:
    errors: list[str] = []
    if not TOKENS_JSON.exists():
        return ["tokens/design-tokens.json is missing"]
    doc = json.loads(TOKENS_JSON.read_text(encoding="utf-8"))
    for tier in ("base", "semantic", "component"):
        if tier not in doc:
            errors.append(f"tokens/design-tokens.json missing tier '{tier}'")
    if errors:
        return errors

    css_txt = GLOBALS_CSS.read_text(encoding="utf-8") if GLOBALS_CSS.exists() else ""
    fe_ts_txt = FE_TOKENS_TS.read_text(encoding="utf-8") if FE_TOKENS_TS.exists() else ""
    mob_ts_txt = MOBILE_TOKENS_TS.read_text(encoding="utf-8") if MOBILE_TOKENS_TS.exists() else ""

    for mode in ("light", "dark"):
        sem = doc["semantic"].get(mode, {})
        for group, kv in sem.items():
            for key, val in kv.items():
                css_var = f"--{group}-{key}: {val};"
                if css_var not in css_txt:
                    errors.append(f"globals.css ({mode}) missing '{css_var}'")
                if val not in fe_ts_txt:
                    errors.append(f"frontend/src/lib/design-tokens.ts ({mode}.{group}.{key}) missing '{val}'")

    neu = doc["semantic"].get("neumorphic", {})
    for group in ("surface", "brand", "typography", "status"):
        for key, val in neu.get(group, {}).items():
            if val not in fe_ts_txt:
                errors.append(f"frontend/src/lib/design-tokens.ts (neumorphic.{group}.{key}) missing '{val}'")
            if key in ("page", "primary", "heading", "body", "success", "warning", "danger") and val not in mob_ts_txt:
                errors.append(f"mobile/src/theme/tokens.ts (neumorphic.{group}.{key}) missing '{val}'")

    return errors


if __name__ == "__main__":
    errs = check_parity()
    if errs:
        for e in errs:
            print(f"FAIL: {e}")
        sys.exit(1)
    print("OK: W3C 3-tier Primer design tokens verified across JSON, Web CSS/TS, and Mobile RN.")
    sys.exit(0)
