"""
Export service facade for the backend.
"""

from __future__ import annotations

from typing import Any, Dict

from .asset_builder import build_asset_manifest
from .document_model import build_document_model
from .engine import build_snapshot_result, render_report_result
from .snapshot_builder import build_export_state
from .trace_diagram_assets import build_trace_diagram_assets


class ExportService:
    def build_snapshot(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        export_state = build_export_state(payload)
        return build_snapshot_result(export_state)

    def build_assets(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        snapshot_result = self.build_snapshot(payload)
        snapshot = snapshot_result.get("snapshot") or {}
        document_model = build_document_model(snapshot)
        assets = build_trace_diagram_assets(document_model)
        entries = [
            {
                "filename": asset.filename,
                "mimeType": asset.mimeType,
                "size": len(
                    asset.content
                    if isinstance(asset.content, bytes)
                    else asset.content.encode("utf-8")
                ),
            }
            for asset in assets
        ]
        return {"assetManifest": build_asset_manifest(entries)}

    def render_report(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        export_state = build_export_state(payload)
        return render_report_result(export_state)
