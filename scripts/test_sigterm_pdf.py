#!/usr/bin/env python3
"""Exercise SIGTERM while a production PDF request is active."""
from __future__ import annotations

import json
import subprocess
import threading
import time
import urllib.request

SOURCE = """triangular(n) BEGIN
  FOR i <- 1 TO n DO BEGIN
    FOR j <- i TO n DO BEGIN
      x <- i + j;
    END
  END
END
"""
PAYLOAD = json.dumps(
    {"source": SOURCE, "formats": ["pdf"], "locale": "en", "includeZipBundle": False}
).encode()


def request_result(result: dict[str, object]) -> None:
    request = urllib.request.Request(
        "http://127.0.0.1:3000/api/export/report",
        data=PAYLOAD,
        headers={"content-type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            result["status"] = response.status
            result["bytes"] = len(response.read())
    except Exception as error:  # shutdown intentionally interrupts the request
        result["error"] = type(error).__name__


def main() -> None:
    subprocess.run(
        ["docker", "compose", "-f", "infra/compose.prod.yml", "up", "-d", "--wait"],
        check=True,
    )
    result: dict[str, object] = {}
    worker = threading.Thread(target=request_result, args=(result,), daemon=True)
    worker.start()
    time.sleep(0.25)
    subprocess.run(["docker", "kill", "--signal", "SIGTERM", "aalie-api"], check=True)
    worker.join(timeout=15)
    inspect = subprocess.run(
        ["docker", "inspect", "--format", "{{.State.ExitCode}} {{.State.OOMKilled}}", "aalie-api"],
        check=True,
        capture_output=True,
        text=True,
    ).stdout.strip()
    assert inspect == "0 false", inspect

    subprocess.run(
        ["docker", "compose", "-f", "infra/compose.prod.yml", "up", "-d", "--wait", "--force-recreate"],
        check=True,
    )
    orphan_check = subprocess.run(
        ["docker", "compose", "-f", "infra/compose.prod.yml", "exec", "-T", "api", "sh", "-c", "pgrep -x pdflatex"],
        capture_output=True,
        text=True,
    )
    assert orphan_check.returncode != 0, orphan_check.stdout
    print(json.dumps({"request": result, "exit": inspect, "orphan_pdflatex": False}))


if __name__ == "__main__":
    main()
