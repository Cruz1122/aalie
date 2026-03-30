from io import BytesIO
import zipfile

import pytest

from tests.system.export._helpers import build_export_payload, create_client, has_pdflatex

pytestmark = [pytest.mark.system, pytest.mark.export, pytest.mark.slow]


def test_export_report_returns_zip_bundle_contract():
    if not has_pdflatex():
        pytest.skip("pdflatex no está disponible en el entorno de tests")

    client = create_client()
    payload = build_export_payload(client, formats=["markdown", "pdf"])
    resp = client.post("/export/report", json=payload)

    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("application/zip")

    with zipfile.ZipFile(BytesIO(resp.content)) as bundle:
        names = bundle.namelist()
        assert names[0] == "report.md"
        assert names[1] == "report.pdf"
        assert "snapshot.json" in names
        assert names[-1] == "manifest.json"

        manifest = bundle.read("manifest.json").decode("utf-8")
        snapshot = bundle.read("snapshot.json").decode("utf-8")
        assert '"formats": [' in manifest
        assert '"snapshotId"' in manifest
        assert '"schemaVersion": "1.0.0"' in snapshot
