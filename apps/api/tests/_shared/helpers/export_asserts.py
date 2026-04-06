from __future__ import annotations


def assert_export_headers(response_headers: dict, content_type_prefix: str) -> None:
    assert response_headers.get("content-type", "").startswith(content_type_prefix)
    assert "x-snapshot-id" in response_headers
    assert "x-content-hash" in response_headers
