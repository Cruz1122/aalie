"""
Tests unitarios para app.core.config.

Author: Juan Felipe Henao (@Pipe-1z)
"""

import os
from unittest.mock import patch

from app.core.config import (
    _as_bool,
    get_cors_allowed_origins,
    get_cors_enabled,
    get_dev_allowed_origins,
    get_dev_cors_enabled,
)


class TestAsBool:
    """Tests para la funcion _as_bool."""

    def test_truthy_values(self):
        assert _as_bool("1")
        assert _as_bool("true")
        assert _as_bool("True")
        assert _as_bool("TRUE")
        assert _as_bool("yes")
        assert _as_bool("Yes")
        assert _as_bool("y")
        assert _as_bool("Y")
        assert _as_bool("on")
        assert _as_bool("ON")

    def test_falsy_values(self):
        assert not _as_bool("0")
        assert not _as_bool("false")
        assert not _as_bool("False")
        assert not _as_bool("no")
        assert not _as_bool("n")
        assert not _as_bool("off")
        assert not _as_bool("")
        assert not _as_bool("random")

    def test_with_whitespace(self):
        assert _as_bool(" 1 ")
        assert _as_bool(" true ")
        assert _as_bool("\t1\t")
        assert not _as_bool(" false ")


class TestGetDevCorsEnabled:
    """Tests para la funcion get_dev_cors_enabled."""

    @patch.dict(os.environ, {}, clear=True)
    def test_default_enabled(self):
        assert get_dev_cors_enabled()

    @patch.dict(os.environ, {"DEV_CORS_ENABLED": "1"})
    def test_explicitly_enabled(self):
        assert get_dev_cors_enabled()

    @patch.dict(os.environ, {"DEV_CORS_ENABLED": "true"})
    def test_enabled_with_true(self):
        assert get_dev_cors_enabled()

    @patch.dict(os.environ, {"DEV_CORS_ENABLED": "yes"})
    def test_enabled_with_yes(self):
        assert get_dev_cors_enabled()

    @patch.dict(os.environ, {"DEV_CORS_ENABLED": "0"})
    def test_disabled_with_zero(self):
        assert not get_dev_cors_enabled()

    @patch.dict(os.environ, {"DEV_CORS_ENABLED": "false"})
    def test_disabled_with_false(self):
        assert not get_dev_cors_enabled()

    @patch.dict(os.environ, {"DEV_CORS_ENABLED": "no"})
    def test_disabled_with_no(self):
        assert not get_dev_cors_enabled()


class TestGetDevAllowedOrigins:
    """Tests para la funcion get_dev_allowed_origins."""

    @patch.dict(os.environ, {}, clear=True)
    def test_default_origins(self):
        result = get_dev_allowed_origins()
        expected = ["http://localhost:3000", "http://127.0.0.1:3000"]
        assert result == expected

    @patch.dict(os.environ, {"DEV_ALLOWED_ORIGINS": ""})
    def test_empty_string_uses_defaults(self):
        result = get_dev_allowed_origins()
        expected = ["http://localhost:3000", "http://127.0.0.1:3000"]
        assert result == expected

    @patch.dict(os.environ, {"DEV_ALLOWED_ORIGINS": "http://example.com"})
    def test_single_origin(self):
        result = get_dev_allowed_origins()
        assert result == ["http://example.com"]

    @patch.dict(
        os.environ, {"DEV_ALLOWED_ORIGINS": "http://example.com,http://test.com"}
    )
    def test_multiple_origins(self):
        result = get_dev_allowed_origins()
        assert result == ["http://example.com", "http://test.com"]

    @patch.dict(
        os.environ,
        {
            "DEV_ALLOWED_ORIGINS": "http://example.com, http://test.com , https://secure.com"
        },
    )
    def test_origins_with_whitespace(self):
        result = get_dev_allowed_origins()
        assert result == ["http://example.com", "http://test.com", "https://secure.com"]

    @patch.dict(
        os.environ, {"DEV_ALLOWED_ORIGINS": "http://example.com,,http://test.com"}
    )
    def test_origins_with_empty_items(self):
        result = get_dev_allowed_origins()
        assert result == ["http://example.com", "http://test.com"]


class TestGetCorsEnabled:
    """Tests para la funcion get_cors_enabled."""

    @patch.dict(os.environ, {}, clear=True)
    def test_defaults_to_enabled(self):
        assert get_cors_enabled()

    @patch.dict(os.environ, {"DEV_CORS_ENABLED": "0"}, clear=True)
    def test_uses_dev_flag_for_compatibility(self):
        assert not get_cors_enabled()

    @patch.dict(os.environ, {"DEV_CORS_ENABLED": "0", "CORS_ENABLED": "1"}, clear=True)
    def test_cors_enabled_takes_precedence(self):
        assert get_cors_enabled()


class TestGetCorsAllowedOrigins:
    """Tests para la funcion get_cors_allowed_origins."""

    @patch.dict(os.environ, {}, clear=True)
    def test_defaults_to_localhost_origins(self):
        result = get_cors_allowed_origins()
        expected = ["http://localhost:3000", "http://127.0.0.1:3000"]
        assert result == expected

    @patch.dict(
        os.environ,
        {
            "DEV_ALLOWED_ORIGINS": "http://localhost:3000",
            "CORS_ALLOWED_ORIGINS": "https://frontend.example,https://admin.example",
        },
        clear=True,
    )
    def test_cors_origins_take_precedence_over_dev_origins(self):
        result = get_cors_allowed_origins()
        assert result == ["https://frontend.example", "https://admin.example"]

    @patch.dict(os.environ, {"DEV_ALLOWED_ORIGINS": "https://dev.example"}, clear=True)
    def test_falls_back_to_dev_allowed_origins(self):
        result = get_cors_allowed_origins()
        assert result == ["https://dev.example"]

    @patch.dict(os.environ, {"CORS_ALLOWED_ORIGINS": "*"}, clear=True)
    def test_supports_explicit_wildcard(self):
        result = get_cors_allowed_origins()
        assert result == ["*"]
