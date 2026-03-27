"""
Módulo IR compartido para análisis de complejidad.

Proporciona normalización de AST, utilidades de expresiones e identidad de nodos
para uso unificado en visitors, while_engine y analyzers.

Author: @Cruz1122
Version: 0.1.0
"""
from .ast_normalizer import normalize_expr, normalize_node
from .expr_utils import (
    expr_equals,
    expr_kind,
    expr_to_str,
    expr_vars,
    is_boolean_expr,
    is_literal_false,
    is_literal_true,
    is_numeric_expr,
    is_simple_constant,
)
from .node_identity import NodeIdentity, node_id

__all__ = [
    "expr_to_str",
    "expr_vars",
    "expr_kind",
    "is_numeric_expr",
    "is_boolean_expr",
    "is_literal_true",
    "is_literal_false",
    "expr_equals",
    "is_simple_constant",
    "normalize_node",
    "normalize_expr",
    "node_id",
    "NodeIdentity",
]
