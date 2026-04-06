import json
from zipfile import ZipFile

import pytest

from app.modules.export.asset_builder import build_asset_manifest
from app.modules.export.asset_registry import (
    read_latex_template,
    resolve_latex_asset_registry,
)
from app.modules.export.i18n import get_export_i18n
from app.modules.export.models import (
    DocumentInstitutionInfo,
    DocumentModel,
    DocumentSection,
    ExportArtifact,
)
from app.modules.export.section_status import (
    create_section,
    is_section_available,
    mark_missing_data,
    mark_not_implemented,
)
from app.modules.export.trace_diagram_assets import build_trace_diagram_assets
from app.modules.export.zip_bundle import create_zip_bundle

pytestmark = [pytest.mark.unit, pytest.mark.fast, pytest.mark.export]


def test_build_asset_manifest_filters_and_sorts():
    manifest = build_asset_manifest(
        [
            {"filename": "b.pdf", "mimeType": "application/pdf", "size": 20},
            {"filename": "", "size": 10},
            {"filename": "a.txt", "size": "5"},
        ]
    )

    assert [m["filename"] for m in manifest] == ["a.txt", "b.pdf"]
    assert manifest[0]["mimeType"] == "application/octet-stream"
    assert manifest[0]["size"] == 5


def test_section_status_helpers():
    available = create_section("available", data={"ok": True})
    assert is_section_available(available) is True

    missing = mark_missing_data({"message": "missing"})
    assert missing["status"] == "missing_data"
    assert missing["warnings"][0]["message"] == "missing"

    pending = mark_not_implemented("todo")
    assert pending["status"] == "not_implemented"
    assert pending["todos"] == ["todo"]
    assert is_section_available(pending) is False


def test_get_export_i18n_locale_switch():
    assert get_export_i18n("es")["locale"] == "es"
    assert get_export_i18n("es-CO")["locale"] == "es"
    assert get_export_i18n("en")["locale"] == "en"


def test_resolve_latex_registry_from_env_and_read_template(tmp_path, monkeypatch):
    root = tmp_path / "assets"
    (root / "templates").mkdir(parents=True)
    (root / "logos").mkdir(parents=True)

    (root / "aalie-report.sty").write_text("style", encoding="utf-8")
    (root / "templates" / "main.template.tex").write_text("TEMPLATE", encoding="utf-8")
    (root / "logos" / "ucaldas.pdf").write_bytes(b"pdf1")
    (root / "logos" / "aalie.pdf").write_bytes(b"pdf2")

    monkeypatch.setenv("AALIE_EXPORTER_ASSETS_DIR", str(root))

    registry = resolve_latex_asset_registry()
    assert registry.asset_root == str(root)
    assert read_latex_template(registry) == "TEMPLATE"


def test_resolve_latex_registry_raises_when_missing(monkeypatch):
    import app.modules.export.asset_registry as registry_mod

    monkeypatch.setattr(
        registry_mod,
        "_candidate_roots",
        lambda: [__import__("pathlib").Path("Z:/path/that/does/not/exist")],
    )

    try:
        resolve_latex_asset_registry()
        assert False, "Expected RuntimeError"
    except RuntimeError as exc:
        assert "Unable to resolve LaTeX assets" in str(exc)


def test_create_zip_bundle_is_deterministic_order():
    artifacts = [
        ExportArtifact(
            format="asset", filename="z.txt", mimeType="text/plain", content="z"
        ),
        ExportArtifact(
            format="markdown",
            filename="report.md",
            mimeType="text/markdown",
            content="# report",
        ),
        ExportArtifact(
            format="snapshot",
            filename="snapshot.json",
            mimeType="application/json",
            content="{}",
        ),
    ]

    bundle = create_zip_bundle(
        artifacts,
        {
            "snapshotId": "snap-1",
            "contentHash": "hash",
            "createdAt": "2026-03-29T00:00:00Z",
            "formats": ["markdown"],
        },
    )

    assert bundle.filename == "aalie-export-snap-1.zip"

    with ZipFile(__import__("io").BytesIO(bundle.content), "r") as zf:
        names = zf.namelist()
        assert names == ["report.md", "snapshot.json", "z.txt", "manifest.json"]
        manifest = json.loads(zf.read("manifest.json"))
        assert manifest["snapshotId"] == "snap-1"


def test_build_trace_diagram_assets_uses_renderer(monkeypatch):
    model = DocumentModel(
        title="t",
        locale="es",
        snapshotId="s",
        contentHash="h",
        analysisId="a",
        createdAt="now",
        disclaimer="d",
        institution=DocumentInstitutionInfo(
            institutionLineA="a",
            institutionLineB="b",
            institutionLineC="c",
            reportCode="r",
            reportVersion="v",
            reportDate="date",
        ),
        sections=[
            DocumentSection(
                id="trace",
                title="Trace",
                blocks=[
                    {
                        "kind": "executionTraceDiagram",
                        "diagram": {
                            "title": "Case",
                            "graph": {"nodes": []},
                            "assetSvgPath": "trace/case.svg",
                            "assetPdfPath": "trace/case.pdf",
                        },
                    }
                ],
            )
        ],
    )

    import app.modules.export.trace_diagram_assets as mod

    monkeypatch.setattr(
        mod, "render_trace_diagram_svg", lambda *args, **kwargs: {"svg": "<svg/>"}
    )
    monkeypatch.setattr(mod, "render_trace_diagram_pdf", lambda *args, **kwargs: b"pdf")

    assets = build_trace_diagram_assets(model)

    assert len(assets) == 2
    assert {a.filename for a in assets} == {"trace/case.svg", "trace/case.pdf"}
