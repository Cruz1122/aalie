import time

import pytest

from tests.system.test_export_endpoint import _build_export_payload, _create_client

pytestmark = [pytest.mark.benchmark, pytest.mark.slow, pytest.mark.export]


def test_export_markdown_benchmark():
    client = _create_client()
    payload = _build_export_payload(client, formats=["markdown"])
    start = time.perf_counter()
    resp = client.post("/export/report", json=payload)
    elapsed = time.perf_counter() - start
    assert resp.status_code == 200
    assert elapsed < 15
