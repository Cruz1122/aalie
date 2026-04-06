import pytest
from fastapi.testclient import TestClient

from app.main import app
from tests._shared.helpers.trace_asserts import assert_trace_shape

pytestmark = [pytest.mark.contract, pytest.mark.trace]

client = TestClient(app)

SOURCE = """linear(n) BEGIN
  i <- 0;
  WHILE (i < n) DO BEGIN
    i <- i + 1;
  END
END
"""


def test_trace_shape_contract():
    res = client.post(
        "/analyze/trace",
        json={
            "source": SOURCE,
            "case": "worst",
            "input_size": 5,
            "initial_variables": {},
            "locale": "en",
        },
    ).json()
    assert_trace_shape(res)
