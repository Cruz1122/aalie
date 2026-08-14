"""
AA Grammar - ANTLR4 Python parser for Algorithmic Analysis

Este paquete contiene el parser y lexer generados por ANTLR4 para el análisis
de pseudocódigo y algoritmos.
"""

__version__ = "0.1.0"

# Mantener el paquete importable incluso si algunas partes fallan
__all__ = []

# Importar solo lo esencial para que el paquete sea funcional
try:
    # Solo importar las funciones críticas que necesita la API
    from .api import parse_to_ast  # noqa: F401

    __all__.append("parse_to_ast")
except ImportError:
    # Si falla, al menos el paquete será importable
    pass
