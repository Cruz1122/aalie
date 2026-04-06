import pytest

from app.modules.export.latex_renderer import (
    _build_column_spec,
    _is_trace_table,
    _language_package,
    _render_block,
    _render_institutional_code,
    _render_status,
    _render_table,
    _replace_token,
    render_latex_report,
)
from app.modules.export.models import (
    DocumentInstitutionInfo,
    DocumentModel,
    DocumentSection,
    DocumentTable,
)

pytestmark = [pytest.mark.unit, pytest.mark.fast, pytest.mark.export]


def _model_with_sections(locale: str = "en") -> DocumentModel:
    return DocumentModel(
        title="Report",
        locale=locale,
        snapshotId="snap-1",
        contentHash="hash-1",
        analysisId="analysis-1",
        createdAt="2026-03-29T00:00:00Z",
        disclaimer="Use for education",
        institution=DocumentInstitutionInfo(
            institutionLineA="Uni A",
            institutionLineB="Faculty B",
            institutionLineC="Dept C",
            reportCode="RPT-001",
            reportVersion="v1",
            reportDate="2026-03-29",
        ),
        sections=[
            DocumentSection(
                id="executive-summary",
                title="Executive",
                blocks=[{"kind": "paragraph", "text": "Summary with $n$ terms"}],
            ),
            DocumentSection(
                id="details",
                title="Details",
                blocks=[{"kind": "heading", "text": "Header"}],
            ),
        ],
    )


def test_basic_helpers_in_latex_renderer():
    assert _replace_token("A %%X%% B", "%%X%%", "ok") == "A ok B"
    assert _language_package("es") == "spanish,es-tabla"
    assert _language_package("en") == "english"


def test_trace_table_detection_and_column_specs():
    trace_headers = ["Paso", "Tipo", "Evento", "Contexto", "Estado", "Cambios", "Costo"]
    normal_headers = ["A", "B", "C"]

    assert _is_trace_table(trace_headers) is True
    assert _is_trace_table(normal_headers) is False

    trace_spec = _build_column_spec(trace_headers, None)
    normal_spec = _build_column_spec(normal_headers, ["left", "center", "right"])

    assert "p{0.055\\linewidth}" in trace_spec
    assert normal_spec.count("X") == 3
    assert "\\centering" in normal_spec
    assert "\\raggedleft" in normal_spec


def test_render_table_handles_trace_mode_and_empty_rows():
    i18n_es = {"locale": "es", "notAvailable": "No disponible"}

    trace_table = DocumentTable(
        headers=["Paso", "Tipo", "Evento", "Contexto", "Estado", "Cambios", "Costo"],
        rows=[],
        title="Tabla de traza",
    )
    regular_table = DocumentTable(
        headers=["Col A", "Col B"],
        rows=[["a", "b"]],
        title="Tabla normal",
        align=["left", "right"],
    )

    trace_rendered = _render_table(trace_table, i18n_es)
    regular_rendered = _render_table(regular_table, i18n_es)

    assert "\\begin{longtable}" in trace_rendered
    assert "Continúa en la siguiente página" in trace_rendered
    assert "No disponible" in trace_rendered
    assert "\\begin{tabularx}" in regular_rendered
    assert "Tabla normal" in regular_rendered


def test_render_institutional_code_and_status():
    code_block = {
        "title": "Pseudo",
        "lines": [
            {"lineNumber": 1, "text": "x <- 1"},
            {"lineNumber": 2, "text": "return x"},
        ],
    }
    rendered_code = _render_institutional_code(code_block)

    assert "GraySubsection" in rendered_code
    assert "1: x <- 1" in rendered_code
    assert "2: return x" in rendered_code

    status_rendered = _render_status(
        {
            "label": "Warnings",
            "status": "partial",
            "message": "Need review",
            "todos": ["todo-1"],
        },
        {"statusPrefix": "Estado"},
    )
    assert "Need review" in status_rendered
    assert "todo-1" in status_rendered


def test_render_block_covers_multiple_kinds_and_fallback_status():
    i18n_en = {
        **{
            "locale": "en",
            "caseLabels": {"worst": "Worst case"},
            "statusPrefix": "Status",
            "notAvailable": "N/A",
        }
    }

    blocks = [
        {"kind": "heading", "text": "H"},
        {"kind": "emphasis", "text": "E"},
        {"kind": "paragraph", "text": "p $n$"},
        {"kind": "list", "items": ["a", "b"]},
        {"kind": "code", "code": "print(1)"},
        {"kind": "subsection", "title": "Sub"},
        {"kind": "centeredParagraph", "text": "center"},
        {
            "kind": "institutionalCode",
            "title": "Pseudo",
            "lines": [{"lineNumber": 1, "text": "x <- 1"}],
        },
        {"kind": "formula", "label": "F", "formula": "T(n)=n"},
        {
            "kind": "pedagogicalStep",
            "step": {
                "index": 1,
                "title": "Step",
                "formula": "n",
                "explanation": "Because",
                "warning": "Warn",
                "supportReason": "Support",
            },
        },
        {
            "kind": "table",
            "table": DocumentTable(headers=["A"], rows=[["1"]]),
        },
        {"kind": "keyValue", "entries": [{"label": "L", "value": "V"}]},
        {
            "kind": "executionTraceDiagram",
            "diagram": {
                "caseName": "worst",
                "assetPdfPath": "assets/trace.pdf",
                "stats": {"totalCalls": 3, "maxDepth": 2},
                "diagnostics": {"truncated": True},
            },
        },
        {
            "kind": "unknown",
            "status": {"label": "L", "message": "Fallback", "todos": ["t"]},
        },
    ]

    rendered = [_render_block(block, i18n_en) for block in blocks]
    merged = "\n".join(rendered)

    assert "\\paragraph" in rendered[0]
    assert "\\textbf{\\textit" in rendered[1]
    assert "\\begin{itemize}" in merged
    assert "\\AALIEDisplayMath" in merged
    assert "trace was truncated" in merged
    assert "Fallback" in merged


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
        {"locale": "es", "caseLabels": {"worst": "peor caso"}},
    )

    assert r"width=0.98\linewidth,height=0.72\textheight,keepaspectratio" in rendered


def test_render_latex_report_applies_template_replacements(monkeypatch):
    model = _model_with_sections("en")
    template = "\n".join(
        [
            "%%__LANGUAGE_PACKAGE__%%",
            "%%__INSTITUTION_A__%%",
            "%%__INSTITUTION_B__%%",
            "%%__INSTITUTION_C__%%",
            "%%__REPORT_CODE__%%",
            "%%__REPORT_VERSION__%%",
            "%%__REPORT_DATE__%%",
            "%%__VERSION_LABEL__%%",
            "%%__DATE_LABEL__%%",
            "%%__DISCLAIMER__%%",
            "%%__EXECUTIVE_SUMMARY_TITLE__%%",
            "%%__EXECUTIVE_SUMMARY_BODY__%%",
            "%%__CONTENT_SECTIONS__%%",
        ]
    )

    monkeypatch.setattr(
        "app.modules.export.latex_renderer.read_latex_template",
        lambda: template,
    )

    rendered = render_latex_report({"snapshotId": "snap-1"}, model)

    assert "% snapshotId: snap-1" in rendered
    assert "english" in rendered
    assert "Uni A" in rendered
    assert "RPT-001" in rendered
    assert "Use for education" in rendered
    assert "Executive Summary" in rendered
    assert "\\section{Details}" in rendered
