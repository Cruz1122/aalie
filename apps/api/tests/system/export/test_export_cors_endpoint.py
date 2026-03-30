import pytest

from tests.system.export._helpers import build_export_payload, create_client, has_pdflatex

pytestmark = [pytest.mark.system, pytest.mark.export]


def test_export_report_preflight_allows_configured_origin():
    allowed_origin = "https://frontend.example"
    client = create_client({"CORS_ALLOWED_ORIGINS": allowed_origin})

    resp = client.options(
        "/export/report",
        headers={
            "Origin": allowed_origin,
            "Access-Control-Request-Method": "POST",
        },
    )

    assert resp.status_code == 200
    assert resp.headers["access-control-allow-origin"] == allowed_origin
    assert "POST" in resp.headers["access-control-allow-methods"]
    assert resp.headers["access-control-max-age"] == "600"


def test_export_report_preflight_rejects_disallowed_origin():
    client = create_client({"CORS_ALLOWED_ORIGINS": "https://frontend.example"})

    resp = client.options(
        "/export/report",
        headers={
            "Origin": "https://malicious.example",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert resp.status_code == 400
    assert "access-control-allow-origin" not in resp.headers


@pytest.mark.slow
def test_export_report_returns_cors_headers_for_allowed_origin():
    if not has_pdflatex():
        pytest.skip("pdflatex no está disponible en el entorno de tests")

    allowed_origin = "https://frontend.example"
    client = create_client({"CORS_ALLOWED_ORIGINS": allowed_origin})
    payload = build_export_payload(client)

    resp = client.post(
        "/export/report",
        json=payload,
        headers={"Origin": allowed_origin},
    )

    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("application/pdf")
    assert resp.headers["access-control-allow-origin"] == allowed_origin
    assert resp.headers["content-disposition"].startswith("attachment; filename=")
    assert "Content-Disposition" in resp.headers["access-control-expose-headers"]
    assert "X-Snapshot-Id" in resp.headers["access-control-expose-headers"]
    assert "X-Content-Hash" in resp.headers["access-control-expose-headers"]
    assert "x-snapshot-id" in resp.headers
    assert "x-content-hash" in resp.headers
