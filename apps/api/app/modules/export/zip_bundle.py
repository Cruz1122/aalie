"""
Deterministic ZIP bundle creation.
"""

from __future__ import annotations

import json
from io import BytesIO
from typing import Iterable
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

from .models import ExportArtifact, ExportBundleResult

_FIXED_ZIP_TIME = (2000, 1, 1, 0, 0, 0)
_ORDER = {
    "report.md": 0,
    "report.tex": 1,
    "report.pdf": 2,
    "snapshot.json": 3,
}


def _as_bytes(content: bytes | str) -> bytes:
    return content if isinstance(content, bytes) else content.encode("utf-8")


def _writestr(zip_file: ZipFile, filename: str, content: bytes | str) -> None:
    info = ZipInfo(filename)
    info.date_time = _FIXED_ZIP_TIME
    info.compress_type = ZIP_DEFLATED
    info.create_system = 3
    info.external_attr = 0o644 << 16
    zip_file.writestr(info, _as_bytes(content))


def create_zip_bundle(
    artifacts: Iterable[ExportArtifact],
    metadata: dict,
) -> ExportBundleResult:
    buffer = BytesIO()
    files = sorted(
        artifacts,
        key=lambda artifact: (_ORDER.get(artifact.filename, 4), artifact.filename),
    )
    with ZipFile(buffer, mode="w", compression=ZIP_DEFLATED) as zip_file:
        for artifact in files:
            _writestr(zip_file, artifact.filename, artifact.content)
        _writestr(
            zip_file,
            "manifest.json",
            json.dumps(
                {
                    "snapshotId": metadata["snapshotId"],
                    "contentHash": metadata["contentHash"],
                    "createdAt": metadata["createdAt"],
                    "formats": metadata["formats"],
                },
                ensure_ascii=False,
                indent=2,
            ),
        )
    return ExportBundleResult(
        filename=f"aalie-export-{metadata['snapshotId']}.zip",
        content=buffer.getvalue(),
    )
