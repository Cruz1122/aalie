import time

import pytest

from tests.system.export._helpers import build_export_payload, create_client

pytestmark = [pytest.mark.benchmark, pytest.mark.slow, pytest.mark.export]


def test_export_markdown_benchmark():
    client = create_client()
    payload = build_export_payload(client, formats=["markdown"])
    start = time.perf_counter()
    resp = client.post("/export/report", json=payload)
    elapsed = time.perf_counter() - start
    assert resp.status_code == 200
    assert elapsed < 15
