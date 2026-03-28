from app.modules.export.i18n import get_export_i18n
from app.modules.export.latex_renderer import _render_block


def test_execution_trace_diagram_is_constrained_by_page_height_in_latex():
    rendered = _render_block(
        {
            "kind": "executionTraceDiagram",
            "diagram": {
                "caseName": "worst",
                "assetPdfPath": "assets/trace-diagram-worst.pdf",
                "stats": {"totalCalls": 128, "maxDepth": 9},
            },
        },
        get_export_i18n("es"),
    )

    assert r"width=0.98\linewidth,height=0.72\textheight,keepaspectratio" in rendered
