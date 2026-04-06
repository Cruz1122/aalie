import pytest

from tests.system.export._helpers import build_export_payload, create_client

pytestmark = [pytest.mark.system, pytest.mark.fast, pytest.mark.export]


def test_export_markdown_endpoint_is_deterministic():
    client = create_client()
    payload = build_export_payload(client, formats=["markdown"])
    resp_a = client.post("/export/report", json=payload)
    resp_b = client.post("/export/report", json=payload)
    assert resp_a.status_code == 200
    assert resp_b.status_code == 200
    assert resp_a.headers["content-type"].startswith("text/markdown")
    assert resp_a.content == resp_b.content
