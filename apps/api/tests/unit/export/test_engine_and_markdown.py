import base64

from app.modules.export.engine import (
    _artifact_mime_type,
    _normalize_confidence,
    _normalize_formats,
    _safe_json_parse,
    _to_bytes,
    _to_string_array,
    normalize_llm_comparative_payload,
    render_report_result,
)
from app.modules.export.latex_compiler import LatexCompilationError
from app.modules.export.markdown_renderer import render_markdown_report
from app.modules.export.models import (
    DocumentInstitutionInfo,
    DocumentModel,
    DocumentSection,
    DocumentTable,
    ExportArtifact,
)


def _build_model(blocks):
    return DocumentModel(
        title="Report",
        locale="en",
        snapshotId="snap-1",
        contentHash="hash-1",
        analysisId="analysis-1",
        createdAt="2026-03-29T00:00:00Z",
        disclaimer="disc",
        institution=DocumentInstitutionInfo(
            institutionLineA="A",
            institutionLineB="B",
            institutionLineC="C",
            reportCode="R",
            reportVersion="1",
            reportDate="today",
        ),
        sections=[DocumentSection(id="s1", title="Section", blocks=blocks)],
    )


def test_engine_small_helpers():
    assert _to_bytes("abc") == b"abc"
    assert _to_bytes(b"xyz") == b"xyz"

    assert _artifact_mime_type("markdown").startswith("text/markdown")
    assert _artifact_mime_type("latex").startswith("application/x-tex")
    assert _artifact_mime_type("pdf") == "application/pdf"
    assert _artifact_mime_type("other").startswith("application/json")

    assert _normalize_formats(None) == ["markdown", "latex"]
    assert _normalize_formats(["pdf", "pdf", "latex", "x"]) == ["pdf", "latex"]

    assert _to_string_array([" a ", "", None, "b"]) == ["a", "b"]
    assert _to_string_array("bad") is None

    assert _normalize_confidence(0.5) == 0.5
    assert _normalize_confidence("0.25") == 0.25
    assert _normalize_confidence("bad") is None


def test_safe_json_parse_and_normalize_llm_payload():
    wrapped = """```json\n{\"verdict\":\"ok\",\"confidence\":\"0.9\",\"matches\":[\"x\"],\"differences\":[\"y\"]}\n```"""
    parsed = _safe_json_parse(wrapped)
    assert parsed["verdict"] == "ok"

    payload = {"data": {"candidates": [{"content": {"parts": [{"text": wrapped}]}}]}}
    normalized = normalize_llm_comparative_payload(payload)
    assert normalized["normalized"]["verdict"] == "ok"
    assert normalized["normalized"]["confidence"] == 0.9
    assert normalized["normalized"]["matches"] == ["x"]
    assert normalized["normalized"]["differences"] == ["y"]


def test_render_markdown_report_covers_block_kinds(monkeypatch):
    import app.modules.export.markdown_renderer as md

    monkeypatch.setattr(
        md,
        "render_trace_diagram_mermaid",
        lambda *args, **kwargs: {
            "mermaid": "```mermaid\\ngraph TD; A-->B;\\n```",
            "stats": {
                "totalCalls": 3,
                "maxDepth": 2,
                "collapsedNodes": 1,
                "truncated": True,
            },
        },
    )

    blocks = [
        {"kind": "heading", "text": "H"},
        {"kind": "emphasis", "text": "E"},
        {"kind": "paragraph", "text": "x + y\\nline"},
        {"kind": "list", "items": ["item1", "item2"]},
        {"kind": "subsection", "title": "Sub"},
        {"kind": "centeredParagraph", "text": "center"},
        {"kind": "code", "language": "text", "code": "print('ok')"},
        {
            "kind": "institutionalCode",
            "title": "Pseudo",
            "lines": [{"lineNumber": 1, "text": "a <- 1"}],
        },
        {"kind": "formula", "label": "F", "formula": "T(n)=n"},
        {
            "kind": "pedagogicalStep",
            "step": {
                "index": 1,
                "title": "S",
                "formula": "n",
                "explanation": "exp",
                "warning": "warn",
                "supportReason": "because",
            },
        },
        {
            "kind": "table",
            "table": DocumentTable(
                headers=["A|B"], rows=[["x|y"]], title="Tab", align=["center"]
            ),
        },
        {"kind": "keyValue", "entries": [{"label": "L", "value": "V"}]},
        {
            "kind": "executionTraceDiagram",
            "diagram": {
                "title": "Trace",
                "caseName": "worst",
                "graph": {},
                "summary": {},
                "diagnostics": {},
            },
        },
        {
            "kind": "unknown",
            "status": {
                "label": "L",
                "status": "missing_data",
                "message": "M",
                "todos": ["t"],
            },
        },
    ]

    md_text = render_markdown_report({"snapshotId": "snap-1"}, _build_model(blocks))

    assert "# Report" in md_text
    assert "## Section" in md_text
    assert "```mermaid" in md_text
    assert "TODO" in md_text


def test_render_report_result_success_and_pdf_error(monkeypatch):
    import app.modules.export.engine as eng

    snapshot = {
        "snapshotId": "snap-1",
        "contentHash": "hash-1",
        "createdAt": "2026-03-29T00:00:00Z",
    }

    monkeypatch.setattr(
        eng, "build_snapshot_result", lambda state: {"ok": True, "snapshot": snapshot}
    )
    monkeypatch.setattr(eng, "build_document_model", lambda s: _build_model([]))
    monkeypatch.setattr(
        eng,
        "build_trace_diagram_assets",
        lambda model: [
            ExportArtifact(
                format="asset",
                filename="trace/a.svg",
                mimeType="image/svg+xml",
                content="<svg/>",
            )
        ],
    )
    monkeypatch.setattr(eng, "render_markdown_report", lambda snapshot, model: "# md")
    monkeypatch.setattr(eng, "render_latex_report", lambda snapshot, model: "latex")
    monkeypatch.setattr(
        eng,
        "compile_latex_to_pdf",
        lambda *args, **kwargs: {"pdfBuffer": b"PDF", "assetManifest": []},
    )
    monkeypatch.setattr(
        eng,
        "create_zip_bundle",
        lambda artifacts, metadata: type(
            "B", (), {"filename": "bundle.zip", "content": b"ZIP"}
        )(),
    )

    export_state = {
        "snapshotInput": {"analysis": {}},
        "render": {
            "formats": ["markdown", "latex", "pdf"],
            "includeSnapshotJson": True,
            "includeZipBundle": True,
        },
    }
    ok = render_report_result(export_state)

    assert ok["ok"] is True
    assert ok["filename"] == "bundle.zip"
    assert base64.b64decode(ok["contentBase64"]) == b"ZIP"
    assert ok["assetManifest"][0]["filename"] == "trace/a.svg"

    monkeypatch.setattr(
        eng,
        "compile_latex_to_pdf",
        lambda *args, **kwargs: (_ for _ in ()).throw(
            LatexCompilationError("compilation_failed", "boom", logs="x")
        ),
    )
    err = render_report_result(export_state)
    assert err["ok"] is False
    assert err["kind"] == "compilation_failed"
    assert err["status"] == 500
