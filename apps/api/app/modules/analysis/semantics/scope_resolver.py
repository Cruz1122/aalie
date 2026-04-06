"""
Resolución de scope para procedimientos.

Distingue parámetros vs locales, loop_local.
Recorre el AST del procedimiento para extraer la estructura de scope.

Author: @Cruz1122
Version: 0.1.0
"""

from typing import Any, Dict, Set

from .symbol_table import SymbolTable


def _collect_params(proc_def: Dict[str, Any]) -> Set[str]:
    """Extrae nombres de parámetros del procedimiento."""
    params = set()
    params_node = proc_def.get("params") or proc_def.get("parameters")
    if isinstance(params_node, list):
        for p in params_node:
            if isinstance(p, dict):
                name = p.get("name") or p.get("identifier")
                if name:
                    params.add(name)
            elif isinstance(p, str):
                params.add(p)
    return params


def _collect_assign_targets(expr: Any) -> Set[str]:
    """Recolecta identificadores que son targets de asignación."""
    from ..ir.expr_utils import expr_vars

    if isinstance(expr, dict):
        t = (expr.get("type") or "").lower()
        if t == "assign":
            target = expr.get("target")
            if isinstance(target, dict) and target.get("type", "").lower() == "identifier":
                return {target.get("name", "")}
            return expr_vars(target) if target else set()
        if t == "block":
            out = set()
            for stmt in expr.get("body") or []:
                out.update(_collect_assign_targets(stmt))
            return out
        if t == "if":
            out = set()
            out.update(_collect_assign_targets(expr.get("consequent")))
            out.update(_collect_assign_targets(expr.get("alternate")))
            return out
    return set()


class ScopeResolver:
    """
    Resuelve el scope de variables en un procedimiento.
    """

    def __init__(self, proc_def: Dict[str, Any]):
        self.proc_def = proc_def
        self.params = _collect_params(proc_def)

    def resolve(self) -> SymbolTable:
        """Construye la tabla de símbolos con scope resuelto."""
        table = SymbolTable(self.proc_def.get("name", ""))
        body = self.proc_def.get("body")
        if body:
            self._visit(body, table, in_loop=False)
        return table

    def _visit(self, node: Any, table: SymbolTable, in_loop: bool) -> None:
        """Recorre el AST y actualiza la tabla."""
        if not isinstance(node, dict):
            return
        t = (node.get("type") or "").lower()
        pos = node.get("pos", {})
        line = pos.get("line", 0) if isinstance(pos, dict) else 0
        col = pos.get("column", 0) if isinstance(pos, dict) else 0
        loc = {"line": line, "column": col}

        if t == "assign":
            target = node.get("target")
            if isinstance(target, dict) and target.get("type", "").lower() == "identifier":
                name = target.get("name", "")
                if name:
                    info = table.get_or_create(name)
                    info.assigned_at.append(loc)
                    info.origin = (
                        "parameter"
                        if name in self.params
                        else ("loop_local" if in_loop else "local")
                    )
            self._visit(node.get("value"), table, in_loop)
            return

        if t == "block":
            for stmt in node.get("body") or []:
                self._visit(stmt, table, in_loop)
            return

        if t == "if":
            self._visit(node.get("test"), table, in_loop)
            self._visit(node.get("consequent"), table, in_loop)
            self._visit(node.get("alternate"), table, in_loop)
            return

        if t in ("while", "repeat"):
            self._visit(node.get("test"), table, in_loop)
            self._visit(node.get("body"), table, in_loop=True)
            return

        if t == "for":
            var = node.get("variable")
            if isinstance(var, dict) and var.get("type", "").lower() == "identifier":
                name = var.get("name", "")
                if name:
                    info = table.get_or_create(name)
                    info.origin = "loop_local"
            self._visit(node.get("body"), table, in_loop=True)
            return

        # Identifiers, binary, etc.: marcar como read
        from ..ir.expr_utils import expr_vars

        for var in expr_vars(node):
            if var:
                info = table.get_or_create(var)
                info.read_at.append(loc)


def resolve_scope(proc_def: Dict[str, Any]) -> SymbolTable:
    """Resuelve el scope de un procedimiento y retorna la tabla de símbolos."""
    resolver = ScopeResolver(proc_def)
    return resolver.resolve()
