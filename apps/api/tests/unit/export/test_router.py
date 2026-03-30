import base64
import json

import pytest
from starlette.requests import Request

from app.modules.export import router as export_router

pytestmark = [pytest.mark.unit, pytest.mark.fast, pytest.mark.export]


class _FakeService:
    def __init__(self, response=None, error=None):
        self.response = response
        self.error = error
        self.last_payload = None

    def render_report(self, payload):
        self.last_payload = payload
        if self.error is not None:
            raise self.error
        return self.response


def _request_with_headers(headers):
    raw_headers = [
        (key.encode("utf-8"), value.encode("utf-8")) for key, value in headers.items()
    ]
    scope = {
        "type": "http",
        "method": "POST",
        "path": "/export/report",
        "headers": raw_headers,
    }
    return Request(scope)


def test_export_report_rejects_empty_source(monkeypatch):
    monkeypatch.setattr(
        export_router, "export_service", _FakeService(response={"ok": True})
    )

    response = export_router.export_report(_request_with_headers({}), {"source": "   "})

    assert response.status_code == 400
    assert (
        json.loads(response.body.decode("utf-8"))["error"]
        == "Field 'source' is required."
    )


def test_export_report_success_propagates_origin_and_attachment_headers(monkeypatch):
    payload = {"source": "BEGIN END"}
    service = _FakeService(
        response={
            "ok": True,
            "mimeType": "application/pdf",
            "filename": "report.pdf",
            "contentBase64": base64.b64encode(b"PDF-BYTES").decode("utf-8"),
            "snapshotId": "snap-123",
            "contentHash": "hash-xyz",
        }
    )
    monkeypatch.setattr(export_router, "export_service", service)

    request = _request_with_headers({"origin": "http://localhost:3000"})
    response = export_router.export_report(request, payload)

    assert response.status_code == 200
    assert response.body == b"PDF-BYTES"
    assert response.headers["content-type"] == "application/pdf"
    assert (
        response.headers["content-disposition"] == 'attachment; filename="report.pdf"'
    )
    assert response.headers["x-snapshot-id"] == "snap-123"
    assert response.headers["x-content-hash"] == "hash-xyz"
    assert service.last_payload["requestOrigin"] == "http://localhost:3000"


def test_export_report_formats_error_response_details(monkeypatch):
    service = _FakeService(
        response={
            "ok": False,
            "error": "compilation failed",
            "kind": "compilation_failed",
            "logs": ["log-a", "log-b"],
            "compilerLogs": "compiler-log",
            "assetManifest": [{"filename": "report.tex", "size": 10}],
            "workDir": "/tmp/workdir",
            "status": 422,
        }
    )
    monkeypatch.setattr(export_router, "export_service", service)

    response = export_router.export_report(_request_with_headers({}), {"source": "x"})
    body = json.loads(response.body.decode("utf-8"))

    assert response.status_code == 422
    assert body["ok"] is False
    assert body["kind"] == "compilation_failed"
    assert body["logs"] == ["log-a", "log-b"]
    assert body["compilerLogs"] == "compiler-log"
    assert body["assetManifest"] == [{"filename": "report.tex", "size": 10}]
    assert body["workDir"] == "/tmp/workdir"


def test_export_report_returns_500_when_service_raises(monkeypatch):
    monkeypatch.setattr(
        export_router,
        "export_service",
        _FakeService(error=RuntimeError("unexpected crash")),
    )

    response = export_router.export_report(_request_with_headers({}), {"source": "x"})

    assert response.status_code == 500
    assert json.loads(response.body.decode("utf-8"))["error"] == "unexpected crash"
