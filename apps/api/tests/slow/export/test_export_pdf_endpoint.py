import pytest

from tests.system.test_export_endpoint import _build_export_payload, _create_client, _has_pdflatex

pytestmark = [pytest.mark.slow, pytest.mark.export]


def test_export_pdf_real_integration():
    if not _has_pdflatex():
        pytest.skip("pdflatex no está disponible en el entorno de tests")
    client = _create_client()
    payload = _build_export_payload(client, formats=["pdf"])
    resp = client.post("/export/report", json=payload)
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("application/pdf")
    assert resp.content and len(resp.content) > 1000
