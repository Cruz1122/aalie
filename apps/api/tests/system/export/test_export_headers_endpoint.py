import pytest

from tests.system.test_export_endpoint import _build_export_payload, _create_client, _has_pdflatex

pytestmark = [pytest.mark.system, pytest.mark.export, pytest.mark.slow]


def test_export_pdf_headers_contract():
    if not _has_pdflatex():
        pytest.skip("pdflatex no está disponible en el entorno de tests")
    client = _create_client()
    payload = _build_export_payload(client)
    resp = client.post("/export/report", json=payload)
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("application/pdf")
    assert "content-disposition" in resp.headers
