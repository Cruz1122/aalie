"""
Identidad estable de nodos para trazabilidad.

Asigna IDs únicos por posición en el AST para poder referenciar
nodos en diagnósticos y evidencias.

Author: @Cruz1122
Version: 0.1.0
"""
from dataclasses import dataclass
from typing import Any


@dataclass
class NodeIdentity:
    """Identificador estable de un nodo en el AST."""

    path: str
    line: int
    column: int

    def __str__(self) -> str:
        return f"{self.path}:{self.line}:{self.column}"


def node_id(node: Any, path: str = "root") -> NodeIdentity:
    """
    Extrae la identidad de un nodo del AST.

    Args:
        node: Nodo del AST (debe tener pos o line/column)
        path: Ruta opcional del nodo en el árbol

    Returns:
        NodeIdentity con path, line, column
    """
    line = 0
    column = 0
    if isinstance(node, dict):
        pos = node.get("pos")
        if isinstance(pos, dict):
            line = pos.get("line", 0)
            column = pos.get("column", 0)
        else:
            line = node.get("line", 0)
            column = node.get("column", 0)
    return NodeIdentity(path=path, line=line, column=column)
