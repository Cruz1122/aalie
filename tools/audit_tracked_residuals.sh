#!/usr/bin/env bash
set -euo pipefail

OUT="${1:-tracked-residual-candidates.txt}"

# Solo escanea archivos versionados en git.
python - "$OUT" <<'PY'
import re
import subprocess
import sys
from pathlib import Path

out_path = Path(sys.argv[1])
lines = subprocess.check_output(["git", "ls-files"], text=True, encoding="utf-8", errors="ignore").splitlines()

pattern = re.compile(
    r"("
    r"\.log$|\.tmp$|\.temp$|\.bak$|\.old$|\.orig$|\.rej$|"
    r"\.aux$|\.toc$|\.out$|\.fls$|\.fdb_latexmk$|\.synctex\.gz$|"
    r"\.pyc$|\.coverage$|"
    r"npm-debug\.log|yarn-debug\.log|pnpm-debug\.log|"
    r"\.DS_Store$|Thumbs\.db$|"
    r"(^|/)(__pycache__|\.pytest_cache|htmlcov|coverage|dist|build|\.next|node_modules|"
    r"playwright-report|test-results|debug_outputs|manual_exports|local_traces|profiling_outputs|generated_reports)(/|$)|"
    r"^scripts/\.cache/|"
    r"^scripts/requirements-translate\.txt$|"
    r"^scripts/translate_course_catalog\.py$|"
    r"^scripts/translate_quiz_bank\.py$|"
    r"^scripts/lote\.json$"
    r")",
    re.IGNORECASE,
)

hits = sorted([p for p in lines if pattern.search(p)])
out_path.write_text("\n".join(hits) + ("\n" if hits else ""), encoding="utf-8")
print(f"Candidatos versionados escritos en {out_path}")
print(len(hits))
PY
