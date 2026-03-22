"""
Detección estructural de variables de control.

Identifica qué variable o conjunto gobierna la terminación del ciclo
sin heurísticas por nombre.

Author: @Cruz1122
Version: 0.1.0
"""
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Set
from ..ir.expr_utils import expr_vars
from ..semantics import SymbolTable, SymbolInfo


@dataclass
class ControlVariableResult:
    """Resultado de detección de variables de control."""

    primary_numeric_controller: Optional[str] = None
    primary_boolean_controller: Optional[str] = None
    coupled_controllers: List[str] = None
    bound_variables: List[str] = None
    data_dependent_witnesses: List[str] = None
    non_controllers: List[str] = None

    def __post_init__(self):
        if self.coupled_controllers is None:
            self.coupled_controllers = []
        if self.bound_variables is None:
            self.bound_variables = []
        if self.data_dependent_witnesses is None:
            self.data_dependent_witnesses = []
        if self.non_controllers is None:
            self.non_controllers = []


def detect_control_variables(
    guard_info: Any,
    updates: Dict[str, Any],
    symbol_table: Optional[SymbolTable] = None,
) -> ControlVariableResult:
    """
    Detecta variables de control a partir del guard y los updates.

    Usa symbol_table si está disponible para refinar por tipo/rol.
    """
    result = ControlVariableResult()
    vars_in_guard = getattr(guard_info, "vars_used", set()) or set()
    if isinstance(vars_in_guard, (list, tuple)):
        vars_in_guard = set(vars_in_guard)

    # Booleano: si hay bool_var en guard y tiene kill must
    bool_var = getattr(guard_info, "bool_var", None)
    if bool_var and bool_var in vars_in_guard:
        summary = updates.get(bool_var) if isinstance(updates, dict) else None
        if summary and getattr(summary, "kills_guard_must", False):
            result.primary_boolean_controller = bool_var

    # Numérico: atoms relacionales con var que tiene update monotónico
    atoms = getattr(guard_info, "atoms", []) or []
    two_vars_found: Set[str] = set()
    for atom in atoms:
        if not isinstance(atom, dict):
            continue
        var = atom.get("var")
        if not var:
            continue
        if atom.get("two_vars"):
            two_vars_found.add(var)
            limit = atom.get("limit")
            if limit and limit in vars_in_guard:
                two_vars_found.add(limit)
        else:
            summary = updates.get(var) if isinstance(updates, dict) else None
            if summary and getattr(summary, "monotone_progress_must", False):
                if not result.primary_numeric_controller:
                    result.primary_numeric_controller = var
                else:
                    result.bound_variables.append(var)

    if two_vars_found and len(two_vars_found) >= 2:
        result.coupled_controllers = list(two_vars_found)

    # Data-dependent: has_array_access en guard
    if getattr(guard_info, "has_array_access", False):
        for v in vars_in_guard:
            if v not in (result.primary_numeric_controller or "") and v not in (result.primary_boolean_controller or ""):
                if v not in result.coupled_controllers:
                    result.data_dependent_witnesses.append(v)

    return result
