import pytest

from tests.system.export._helpers import (
    build_export_payload,
    create_client,
    has_pdflatex,
)

pytestmark = [pytest.mark.system, pytest.mark.export, pytest.mark.slow]


def test_export_pdf_headers_contract():
    if not has_pdflatex():
        pytest.skip("pdflatex no está disponible en el entorno de tests")
    client = create_client()
    payload = build_export_payload(client)
    resp = client.post("/export/report", json=payload)
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("application/pdf")
    assert "content-disposition" in resp.headers
