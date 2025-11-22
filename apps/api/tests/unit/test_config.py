"""
Tests unitarios para app.core.config.

Author: Juan Felipe Henao (@Pipe-1z)
"""
import unittest
from unittest.mock import patch
import os
from app.core.config import _as_bool, get_dev_cors_enabled, get_dev_allowed_origins


class TestAsBool(unittest.TestCase):
    """Tests para la función _as_bool."""

    def test_truthy_values(self):
        """Test: Valores que deben retornar True"""
        self.assertTrue(_as_bool("1"))
        self.assertTrue(_as_bool("true"))
        self.assertTrue(_as_bool("True"))
        self.assertTrue(_as_bool("TRUE"))
        self.assertTrue(_as_bool("yes"))
        self.assertTrue(_as_bool("Yes"))
        self.assertTrue(_as_bool("y"))
        self.assertTrue(_as_bool("Y"))
        self.assertTrue(_as_bool("on"))
        self.assertTrue(_as_bool("ON"))

    def test_falsy_values(self):
        """Test: Valores que deben retornar False"""
        self.assertFalse(_as_bool("0"))
        self.assertFalse(_as_bool("false"))
        self.assertFalse(_as_bool("False"))
        self.assertFalse(_as_bool("no"))
        self.assertFalse(_as_bool("n"))
        self.assertFalse(_as_bool("off"))
        self.assertFalse(_as_bool(""))
        self.assertFalse(_as_bool("random"))

    def test_with_whitespace(self):
        """Test: Valores con espacios en blanco"""
        self.assertTrue(_as_bool(" 1 "))
        self.assertTrue(_as_bool(" true "))
        self.assertTrue(_as_bool("\t1\t"))
        self.assertFalse(_as_bool(" false "))


class TestGetDevCorsEnabled(unittest.TestCase):
    """Tests para la función get_dev_cors_enabled."""

    @patch.dict(os.environ, {}, clear=True)
    def test_default_enabled(self):
        """Test: Por defecto CORS está habilitado"""
        result = get_dev_cors_enabled()
        self.assertTrue(result)

    @patch.dict(os.environ, {"DEV_CORS_ENABLED": "1"})
    def test_explicitly_enabled(self):
        """Test: CORS explícitamente habilitado"""
        result = get_dev_cors_enabled()
        self.assertTrue(result)

    @patch.dict(os.environ, {"DEV_CORS_ENABLED": "true"})
    def test_enabled_with_true(self):
        """Test: CORS habilitado con 'true'"""
        result = get_dev_cors_enabled()
        self.assertTrue(result)

    @patch.dict(os.environ, {"DEV_CORS_ENABLED": "yes"})
    def test_enabled_with_yes(self):
        """Test: CORS habilitado con 'yes'"""
        result = get_dev_cors_enabled()
        self.assertTrue(result)

    @patch.dict(os.environ, {"DEV_CORS_ENABLED": "0"})
    def test_disabled_with_zero(self):
        """Test: CORS deshabilitado con '0'"""
        result = get_dev_cors_enabled()
        self.assertFalse(result)

    @patch.dict(os.environ, {"DEV_CORS_ENABLED": "false"})
    def test_disabled_with_false(self):
        """Test: CORS deshabilitado con 'false'"""
        result = get_dev_cors_enabled()
        self.assertFalse(result)

    @patch.dict(os.environ, {"DEV_CORS_ENABLED": "no"})
    def test_disabled_with_no(self):
        """Test: CORS deshabilitado con 'no'"""
        result = get_dev_cors_enabled()
        self.assertFalse(result)


class TestGetDevAllowedOrigins(unittest.TestCase):
    """Tests para la función get_dev_allowed_origins."""

    @patch.dict(os.environ, {}, clear=True)
    def test_default_origins(self):
        """Test: Orígenes por defecto cuando no hay variable de entorno"""
        result = get_dev_allowed_origins()
        expected = ["http://localhost:3000", "http://127.0.0.1:3000"]
        self.assertEqual(result, expected)

    @patch.dict(os.environ, {"DEV_ALLOWED_ORIGINS": ""})
    def test_empty_string_uses_defaults(self):
        """Test: String vacío usa valores por defecto"""
        result = get_dev_allowed_origins()
        expected = ["http://localhost:3000", "http://127.0.0.1:3000"]
        self.assertEqual(result, expected)

    @patch.dict(os.environ, {"DEV_ALLOWED_ORIGINS": "http://example.com"})
    def test_single_origin(self):
        """Test: Un solo origen personalizado"""
        result = get_dev_allowed_origins()
        self.assertEqual(result, ["http://example.com"])

    @patch.dict(os.environ, {"DEV_ALLOWED_ORIGINS": "http://example.com,http://test.com"})
    def test_multiple_origins(self):
        """Test: Múltiples orígenes separados por comas"""
        result = get_dev_allowed_origins()
        self.assertEqual(result, ["http://example.com", "http://test.com"])

    @patch.dict(os.environ, {"DEV_ALLOWED_ORIGINS": "http://example.com, http://test.com , https://secure.com"})
    def test_origins_with_whitespace(self):
        """Test: Orígenes con espacios en blanco se limpian"""
        result = get_dev_allowed_origins()
        self.assertEqual(result, ["http://example.com", "http://test.com", "https://secure.com"])

    @patch.dict(os.environ, {"DEV_ALLOWED_ORIGINS": "http://example.com,,http://test.com"})
    def test_origins_with_empty_items(self):
        """Test: Elementos vacíos se filtran"""
        result = get_dev_allowed_origins()
        self.assertEqual(result, ["http://example.com", "http://test.com"])

