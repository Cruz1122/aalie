from __future__ import annotations

import argparse
import collections
import xml.etree.ElementTree as ET
from pathlib import Path


def build_report(junit_xml: Path, top_n: int = 20) -> str:
    root = ET.parse(junit_xml).getroot()
    cases = []
    for case in root.iter("testcase"):
        name = f"{case.get('classname', '')}::{case.get('name', '')}"
        t = float(case.get("time", "0") or 0)
        file_hint = case.get("file") or case.get("classname", "").split(".")[0]
        cases.append((name, t, file_hint))

    top = sorted(cases, key=lambda x: x[1], reverse=True)[:top_n]
    by_file = collections.defaultdict(float)
    for _, t, f in cases:
        by_file[f] += t

    lines = ["# Profiling Report", "", "## Top slow tests"]
    for name, t, _ in top:
        lines.append(f"- {name} | {t:.3f}s")

    lines.extend(["", "## Time by file"])
    for f, t in sorted(by_file.items(), key=lambda x: x[1], reverse=True):
        lines.append(f"- {f} | {t:.3f}s")
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--junit", required=True, type=Path)
    parser.add_argument("--top", default=20, type=int)
    parser.add_argument("--out", default=None, type=Path)
    args = parser.parse_args()
    report = build_report(args.junit, top_n=args.top)
    if args.out:
        args.out.write_text(report, encoding="utf-8")
    else:
        print(report)


if __name__ == "__main__":
    main()
