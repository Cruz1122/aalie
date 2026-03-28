"""
Helpers for export asset manifests.
"""

from __future__ import annotations

from typing import Any, Dict, Iterable, List


def build_asset_manifest(entries: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
    manifest: List[Dict[str, Any]] = []
    for entry in entries:
        filename = str(entry.get("filename") or "").strip()
        if not filename:
            continue
        manifest.append(
            {
                "filename": filename,
                "mimeType": str(entry.get("mimeType") or "application/octet-stream"),
                "size": int(entry.get("size") or 0),
            }
        )
    return sorted(manifest, key=lambda item: item["filename"])
