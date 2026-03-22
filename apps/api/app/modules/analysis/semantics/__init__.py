"""
Módulo de semántica para análisis de complejidad.

Proporciona tabla de símbolos, inferencia de tipos y resolución de scope
para identificar variables de control, límites y demás roles sin heurísticas por nombre.

Author: @Cruz1122
Version: 0.1.0
"""
from .symbol_table import SymbolTable, SymbolInfo
from .type_inference import infer_type
from .scope_resolver import ScopeResolver, resolve_scope

__all__ = [
    "SymbolTable",
    "SymbolInfo",
    "infer_type",
    "ScopeResolver",
    "resolve_scope",
]
