"""
Export service facade for the backend.
"""

from __future__ import annotations

from typing import Any, Dict

from .asset_builder import build_asset_manifest
from .render_service import build_snapshot_with_renderer, render_report_with_renderer
from .snapshot_builder import build_export_state


class ExportService:
    def build_snapshot(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        export_state = build_export_state(payload)
        return build_snapshot_with_renderer(export_state)

    def build_assets(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        snapshot_result = self.build_snapshot(payload)
        snapshot = snapshot_result.get("snapshot") or {}
        comparative = (snapshot.get("comparative") or {}) if isinstance(snapshot, dict) else {}
        gpu_cpu = (comparative.get("gpuCpu") or {}) if isinstance(comparative, dict) else {}
        data = gpu_cpu.get("data") if isinstance(gpu_cpu, dict) else None
        entries = []
        if data:
            entries.append(
                {
                    "filename": "comparative/gpu-cpu.json",
                    "mimeType": "application/json; charset=utf-8",
                    "size": len(str(data)),
                }
            )
        return {"assetManifest": build_asset_manifest(entries)}

    def render_report(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        export_state = build_export_state(payload)
        return render_report_with_renderer(export_state)
