"""scripts/trust-benchmark.py must report every planted cheat in .agents/evals/trust-probes/."""
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROBES = ROOT / ".agents" / "evals" / "trust-probes"


def test_benchmark_reports_every_planted_cheat(tmp_path):
    shutil.copytree(PROBES, tmp_path, dirs_exist_ok=True)
    expected = set()
    for p in tmp_path.rglob("*"):
        if p.suffix in (".py", ".ts"):
            with p.open(encoding="utf-8") as f:
                rel = p.relative_to(tmp_path).as_posix()
                expected |= {f"{rel}:{i}" for i, line in enumerate(f, 1) if "CHEAT" in line}
    assert len(expected) >= 14

    proc = subprocess.run(
        [sys.executable, str(ROOT / "scripts" / "trust-benchmark.py")],
        env={**os.environ, "TRUST_ROOT": str(tmp_path), "CI": "true"},
        capture_output=True, text=True, encoding="utf-8", timeout=120,
    )
    out = proc.stdout.replace("\\", "/")
    assert proc.returncode == 1
    missed = sorted(loc for loc in expected if f"{loc} " not in out and f"{loc}:" not in out)
    assert not missed, f"trust-benchmark missed planted cheats: {missed}\n{out[-3000:]}"
