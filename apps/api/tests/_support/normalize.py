"""
Normalización de cadenas y expresiones SymPy para tests.

Author: AALIE reform
Version: 0.1.0
"""


def normalize_whitespace(s: str | None) -> str:
    """Normaliza espacios en blanco para comparaciones."""
    if s is None:
        return ""
    return " ".join(s.split())
