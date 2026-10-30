"""Stdlib-only Gemini client shared by ai-code-reviewer.py, ai-pm-manager.py and eval-triggers.py.

The API key travels in the `x-goog-api-key` header, never in the URL (URLs end up in logs,
proxies and exception messages).
"""
import json
import sys
import urllib.error
import urllib.request

API = "https://generativelanguage.googleapis.com"
PREFERRED = ("gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash")


def _call(api_key: str, url: str, payload: dict | None = None, timeout: int = 60) -> dict:
    req = urllib.request.Request(
        url,
        data=None if payload is None else json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
        method="GET" if payload is None else "POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def candidate_models(api_key: str) -> list[str]:
    """`ver/model` targets that support generateContent, preferred models first."""
    found = []
    for ver in ("v1beta", "v1"):
        try:
            for m in _call(api_key, f"{API}/{ver}/models", timeout=10).get("models", []):
                name = m.get("name", "").removeprefix("models/")
                if name and "generateContent" in m.get("supportedGenerationMethods", []):
                    found.append(f"{ver}/{name}")
        except Exception as e:  # discovery is best-effort; fall back below
            sys.stderr.write(f"[warn] Gemini model discovery skipped for {ver}: {e}\n")
    ordered = [t for p in PREFERRED for t in found if t.endswith("/" + p)]
    ordered += [t for t in found if t not in ordered]
    return ordered or [f"v1beta/{p}" for p in PREFERRED]


def generate(api_key: str, prompt: str, *, max_tokens: int = 4096, json_mode: bool = False,
             temperature: float = 0.2, timeout: int = 60, models: list[str] | None = None) -> str:
    """Return the first candidate's text from the first model that answers; raise the last error."""
    config = {"temperature": temperature, "maxOutputTokens": max_tokens}
    if json_mode:
        config["responseMimeType"] = "application/json"
    payload = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": config}
    last_error: Exception | None = None
    for target in models or candidate_models(api_key):
        ver, model = target.split("/", 1)
        try:
            result = _call(api_key, f"{API}/{ver}/models/{model}:generateContent", payload, timeout)
            parts = (result.get("candidates") or [{}])[0].get("content", {}).get("parts", [])
            if parts:
                return parts[0].get("text", "")
        except urllib.error.HTTPError as e:
            sys.stderr.write(f"[!] Gemini {target} HTTP {e.code}: {e.read().decode('utf-8', 'replace')[:300]}\n")
            last_error = e
        except Exception as e:
            sys.stderr.write(f"[!] Gemini {target} error: {e}\n")
            last_error = e
    if last_error:
        raise last_error
    return ""
