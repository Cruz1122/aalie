import pytest

from app.modules.export.models import ExportArtifact
from app.modules.export.service import ExportService

pytestmark = [pytest.mark.unit, pytest.mark.fast, pytest.mark.export]


def test_export_service_build_snapshot(monkeypatch):
    service = ExportService()

    import app.modules.export.service as service_mod

    monkeypatch.setattr(
        service_mod, "build_export_state", lambda payload: {"state": payload}
    )
    monkeypatch.setattr(
        service_mod,
        "build_snapshot_result",
        lambda export_state: {
            "ok": True,
            "snapshot": {"id": export_state["state"]["id"]},
        },
    )

    result = service.build_snapshot({"id": "abc"})
    assert result["ok"] is True
    assert result["snapshot"]["id"] == "abc"


def test_export_service_build_assets_handles_bytes_and_text(monkeypatch):
    service = ExportService()

    import app.modules.export.service as service_mod

    monkeypatch.setattr(
        service,
        "build_snapshot",
        lambda payload: {"snapshot": {"snapshotId": "s1", "contentHash": "h1"}},
    )
    monkeypatch.setattr(
        service_mod, "build_document_model", lambda snapshot: {"dummy": True}
    )
    monkeypatch.setattr(
        service_mod,
        "build_trace_diagram_assets",
        lambda model: [
            ExportArtifact(
                format="asset",
                filename="trace/a.svg",
                mimeType="image/svg+xml",
                content="<svg/>",
            ),
            ExportArtifact(
                format="asset",
                filename="trace/a.pdf",
                mimeType="application/pdf",
                content=b"PDF",
            ),
        ],
    )

    result = service.build_assets({"id": "abc"})

    assert "assetManifest" in result
    assert [entry["filename"] for entry in result["assetManifest"]] == [
        "trace/a.pdf",
        "trace/a.svg",
    ]
    assert all(entry["size"] > 0 for entry in result["assetManifest"])


def test_export_service_render_report(monkeypatch):
    service = ExportService()

    import app.modules.export.service as service_mod

    monkeypatch.setattr(
        service_mod, "build_export_state", lambda payload: {"state": payload}
    )
    monkeypatch.setattr(
        service_mod,
        "render_report_result",
        lambda export_state: {
            "ok": True,
            "mimeType": "application/zip",
            "state": export_state["state"],
        },
    )

    result = service.render_report({"id": "abc"})

    assert result["ok"] is True
    assert result["mimeType"] == "application/zip"
    assert result["state"]["id"] == "abc"
