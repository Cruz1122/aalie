#!/usr/bin/env python3
"""Validación mínima de contratos entre código y documentación (CI)."""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]


def _read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _snapshot_versions_match() -> list[str]:
    errors: list[str] = []
    py_path = REPO / "apps/api/app/modules/export/constants.py"
    ts_path = REPO / "packages/types/src/export-snapshot.ts"
    if not py_path.is_file():
        errors.append(f"Falta archivo Python de export: {py_path}")
        return errors
    if not ts_path.is_file():
        errors.append(f"Falta archivo TypeScript de snapshot: {ts_path}")
        return errors

    py_text = _read_text(py_path)
    ts_text = _read_text(ts_path)
    py_m = re.search(r'SNAPSHOT_SCHEMA_VERSION\s*=\s*"([^"]+)"', py_text)
    ts_m = re.search(
        r'export const SNAPSHOT_SCHEMA_VERSION\s*=\s*"([^"]+)"\s+as const',
        ts_text,
    )
    if not py_m:
        errors.append("No se encontró SNAPSHOT_SCHEMA_VERSION en constants.py")
    if not ts_m:
        errors.append("No se encontró SNAPSHOT_SCHEMA_VERSION en export-snapshot.ts")
    if py_m and ts_m and py_m.group(1) != ts_m.group(1):
        errors.append(
            f"schemaVersion desincronizado: Python={py_m.group(1)!r} "
            f"TypeScript={ts_m.group(1)!r}"
        )
    return errors


def _docs_layout() -> list[str]:
    errors: list[str] = []
    required_dirs = [
        REPO / "docs/03-specs",
        REPO / "docs/04-api",
        REPO / "docs/09-decisions",
    ]
    for d in required_dirs:
        if not d.is_dir():
            errors.append(f"Directorio docs requerido ausente: {d}")
    index = REPO / "docs/index.md"
    if not index.is_file():
        errors.append(f"Falta índice de docs: {index}")
    production_oci = REPO / "docs/06-operations/production-oci.md"
    if not production_oci.is_file():
        errors.append(f"Falta guía canónica de producción OCI: {production_oci}")
    return errors


def main() -> int:
    failures: list[str] = []
    failures.extend(_docs_layout())
    failures.extend(_snapshot_versions_match())

    if failures:
        print("docs-contracts: FAIL", file=sys.stderr)
        for msg in failures:
            print(f"- {msg}", file=sys.stderr)
        return 1

    print("docs-contracts: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
