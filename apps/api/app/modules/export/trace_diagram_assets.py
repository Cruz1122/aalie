"""
Trace diagram asset generation from the Python document model.
"""

from __future__ import annotations

from typing import List

from .models import DocumentModel, ExportArtifact
from .trace_diagram import render_trace_diagram_pdf, render_trace_diagram_svg


def build_trace_diagram_assets(model: DocumentModel) -> List[ExportArtifact]:
    assets_by_filename: dict[str, ExportArtifact] = {}
    for section in model.sections:
        for block in section.blocks:
            if block.get("kind") != "executionTraceDiagram":
                continue
            diagram = block.get("diagram") or {}
            svg_rendered = render_trace_diagram_svg(
                diagram.get("graph") or {},
                title=str(diagram.get("title") or ""),
                case_name="Peor caso" if model.locale == "es" else "Worst case",
                locale=model.locale,
                summary=diagram.get("summary"),
                diagnostics=diagram.get("diagnostics"),
            )
            assets_by_filename[str(diagram.get("assetSvgPath") or "")] = ExportArtifact(
                format="asset",
                filename=str(diagram.get("assetSvgPath") or ""),
                mimeType="image/svg+xml",
                content=svg_rendered["svg"],
            )
            pdf_buffer = render_trace_diagram_pdf(
                diagram.get("graph") or {},
                title=str(diagram.get("title") or ""),
                case_name="Peor caso" if model.locale == "es" else "Worst case",
                locale=model.locale,
                summary=diagram.get("summary"),
                diagnostics=diagram.get("diagnostics"),
            )
            assets_by_filename[str(diagram.get("assetPdfPath") or "")] = ExportArtifact(
                format="asset",
                filename=str(diagram.get("assetPdfPath") or ""),
                mimeType="application/pdf",
                content=pdf_buffer,
            )
    return [assets_by_filename[name] for name in sorted(assets_by_filename)]

