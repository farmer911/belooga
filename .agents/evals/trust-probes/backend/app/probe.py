import subprocess
import time
from pathlib import Path


async def handler(job):
    time.sleep(2)  # CHEAT
    subprocess.run(["ls"], check=True)  # CHEAT
    Path(job).read_text(encoding="utf-8")  # CHEAT
    try:
        job()
    except Exception:  # CHEAT
        ...
    try:
        job()
    except Exception:  # CHEAT
        return None
