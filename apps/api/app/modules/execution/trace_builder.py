"""
Constructor del rastro de ejecución.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""

import copy
from dataclasses import asdict, dataclass
from typing import Any, Dict, List, Optional, Tuple

from sympy import Expr
from sympy.core.basic import Basic

# Estimación de coste por operación primitiva (μs). Heurística basada en operaciones típicas.
MICROSECONDS_PER_TOKEN = 3.0


def _estimate_step_cost(event_kind: str) -> Tuple[int, float]:
    """Estima tokens (ops elementales) y microsegundos para un paso."""
    # Tokens por tipo: operaciones más costosas (condiciones, llamadas) = 2
    token_map = {
        "assign": 1,
        "condition_eval": 2,
        "loop_enter": 1,
        "loop_iter_enter": 1,
        "loop_iter_exit": 1,
        "loop_exit": 1,
        "call_enter": 2,
        "call_spawn_child": 2,
        "call_resume": 1,
        "return_emit": 1,
        "call_exit": 1,
        "print": 2,
        "end": 0,
        "enter_block": 0,
        "operation_enter": 2,
        "operation_exit": 1,
        "state_mutation": 1,
        "result_emit": 1,
    }
    tokens = token_map.get(event_kind, 1)
    microseconds = tokens * MICROSECONDS_PER_TOKEN
    return (tokens, microseconds)


def _serialize_value(value: Any) -> Any:
    """Convierte valores no serializables (ej. SymPy) a formas seguras."""
    if isinstance(value, Expr):
        return str(value)
    if isinstance(value, Basic):
        # SymPy BooleanTrue/BooleanFalse/Relational, etc.
        try:
            return bool(value)
        except Exception:
            return str(value)
    if isinstance(value, dict):
        return {k: _serialize_value(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_serialize_value(v) for v in value]
    return value


@dataclass
class ExecutionStep:
    """Un paso de ejecución individual."""

    id: str
    step_number: int
    line: Optional[int]
    kind: str  # eventKind: "assign" | "condition_eval" | "loop_enter" | ...
    variables: Dict[str, Any]  # variablesSnapshot
    variables_changed: Optional[Dict[str, Any]] = None  # Diff respecto al paso anterior
    iteration: Optional[Dict[str, Any]] = None  # Para bucles: {loopVar, currentValue, maxValue}
    recursion: Optional[Dict[str, Any]] = (
        None  # Para recursión: {depth, callId, params, parentCallId}
    )
    cost: Optional[str] = None  # "C1", "C2", etc.
    accumulated_cost: Optional[str] = None  # Expresión acumulada
    description: Optional[str] = None  # Descripción del paso
    microseconds: Optional[float] = None  # Tiempo estimado en microsegundos
    tokens: Optional[int] = None  # Número de operaciones elementales (tokens)
    decision: Optional[Dict[str, Any]] = None  # {conditionText, result} para condition_eval


@dataclass
class RecursionCall:
    """Una llamada recursiva en el árbol (árbol de llamadas recursivas)."""

    id: str
    depth: int
    params: Dict[str, Any]
    children: List[str]  # IDs de llamadas hijas
    final_params: Optional[Dict[str, Any]] = None
    parent_id: Optional[str] = None
    function_name: Optional[str] = None
    entry_line: Optional[int] = None
    return_value: Optional[Any] = None
    base_case: Optional[Dict[str, Any]] = (
        None  # {detected: bool, conditionText?: str, matched?: bool}
    )


class TraceBuilder:
    """
    Constructor del rastro de ejecución.

    Acumula pasos de ejecución y construye el árbol de recursión si aplica.

    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """

    def __init__(self, build_detailed_trace: bool = True):
        """
        Inicializa el constructor de rastro.

        Args:
            build_detailed_trace: Si False, no construye trace detallado (para recursivos/híbridos)

        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        self.build_detailed_trace = build_detailed_trace
        self.steps: List[ExecutionStep] = []
        self.recursion_calls: Dict[str, RecursionCall] = {}
        self.recursion_stack: List[str] = []  # Stack de IDs de llamadas recursivas
        self.step_counter = 0
        self.call_id_counter = 0
        self.cost_counter = 0
        self.accumulated_cost_parts: List[str] = []
        self._prev_variables: Optional[Dict[str, Any]] = None

    def add_step(
        self,
        line: int,
        kind: str,
        variables: Dict[str, Any],
        iteration: Optional[Dict[str, Any]] = None,
        recursion: Optional[Dict[str, Any]] = None,
        cost: Optional[str] = None,
        description: Optional[str] = None,
        event_kind: Optional[str] = None,
        decision: Optional[Dict[str, Any]] = None,
        variables_changed: Optional[Dict[str, Any]] = None,
    ) -> None:
        """
        Agrega un paso de ejecución.

        Args:
            line: Número de línea ejecutada
            kind: Tipo de instrucción
            variables: Snapshot de variables en este paso
            iteration: Información de iteración (si aplica)
            recursion: Información de recursión (si aplica)
            cost: Coste de este paso (ej: "C1")
            description: Descripción opcional del paso

        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        # Si build_detailed_trace es False, no construir pasos detallados
        if not self.build_detailed_trace:
            return

        self.step_counter += 1

        # Generar coste si no se proporciona
        if cost is None:
            self.cost_counter += 1
            cost = f"C_{self.cost_counter}"

        # Actualizar coste acumulado
        if cost:
            self.accumulated_cost_parts.append(cost)
            accumulated_cost = " + ".join(self.accumulated_cost_parts)
        else:
            accumulated_cost = None

        # Estimar tokens y microsegundos (heurística determinista)
        effective_kind = event_kind if event_kind else kind
        est_tokens, est_microseconds = _estimate_step_cost(effective_kind)

        # Calcular variablesChanged si no se proporciona
        vchanged = variables_changed
        if vchanged is None and self._prev_variables is not None:
            vchanged = {
                k: v
                for k, v in variables.items()
                if k not in self._prev_variables or self._prev_variables.get(k) != v
            }
            if not vchanged:
                vchanged = None
        self._prev_variables = copy.deepcopy(variables)

        step = ExecutionStep(
            id=f"step_{self.step_counter}",
            step_number=self.step_counter,
            line=line if line else None,
            kind=effective_kind,
            variables=copy.deepcopy(variables),
            variables_changed=copy.deepcopy(vchanged) if vchanged is not None else None,
            iteration=copy.deepcopy(iteration) if iteration is not None else None,
            recursion=copy.deepcopy(recursion) if recursion is not None else None,
            cost=cost,
            accumulated_cost=accumulated_cost,
            description=description,
            decision=copy.deepcopy(decision) if decision is not None else None,
            tokens=est_tokens,
            microseconds=est_microseconds,
        )
        self.steps.append(step)

    def enter_recursion(
        self,
        call_id: str,
        depth: int,
        params: Dict[str, Any],
        function_name: Optional[str] = None,
        entry_line: Optional[int] = None,
        parent_call_id: Optional[str] = None,
    ) -> None:
        """
        Registra el inicio de una llamada recursiva.

        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        parent_id = parent_call_id or (self.recursion_stack[-1] if self.recursion_stack else None)

        call = RecursionCall(
            id=call_id,
            depth=depth,
            params=copy.deepcopy(params),
            children=[],
            parent_id=parent_id,
            function_name=function_name,
            entry_line=entry_line,
        )

        self.recursion_calls[call_id] = call

        if parent_id:
            self.recursion_calls[parent_id].children.append(call_id)

        self.recursion_stack.append(call_id)

    def record_return_value(self, call_id: str, value: Any) -> None:
        """Registra el valor de retorno de una llamada recursiva."""
        if call_id in self.recursion_calls:
            self.recursion_calls[call_id].return_value = value

    def record_final_params(self, call_id: str, params: Dict[str, Any]) -> None:
        """Registra estado final de parámetros observables al salir de la llamada."""
        if call_id in self.recursion_calls:
            self.recursion_calls[call_id].final_params = copy.deepcopy(params)

    def record_base_case(
        self,
        call_id: str,
        detected: bool,
        condition_text: Optional[str] = None,
        matched: Optional[bool] = None,
    ) -> None:
        """Registra si la llamada es caso base (heurística conservadora)."""
        if call_id in self.recursion_calls:
            self.recursion_calls[call_id].base_case = {
                "detected": detected,
                "conditionText": condition_text,
                "matched": matched,
            }

    def exit_recursion(self) -> None:
        """
        Registra el fin de una llamada recursiva.

        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        if self.recursion_stack:
            self.recursion_stack.pop()

    def generate_call_id(self) -> str:
        """
        Genera un ID único para una llamada recursiva.

        Returns:
            ID único de llamada

        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        self.call_id_counter += 1
        return f"call_{self.call_id_counter}"

    def build(self) -> Dict[str, Any]:
        """
        Construye el rastro final en formato JSON.

        Returns:
            Diccionario con el rastro completo

        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """

        def _step_to_dict(s: ExecutionStep) -> Dict[str, Any]:
            d = asdict(s)
            if d.get("variables_changed") is None:
                d.pop("variables_changed", None)
            if d.get("recursion") and isinstance(d["recursion"], dict):
                d["recursion"]["params"] = _serialize_value(d["recursion"].get("params", {}))
            d["eventKind"] = d.get("kind", "")
            return d

        result: Dict[str, Any] = {"steps": [_step_to_dict(step) for step in self.steps]}

        # Agregar árbol de recursión si hay llamadas recursivas
        if self.recursion_calls:
            # Encontrar la raíz (llamada sin padre)
            root_calls = [
                call_id for call_id, call in self.recursion_calls.items() if call.depth == 0
            ]

            calls_list = []
            for call_id in sorted(self.recursion_calls.keys()):
                c = self.recursion_calls[call_id]
                d = asdict(c)
                d["params"] = _serialize_value(d.get("params", {}))
                if d.get("final_params") is not None:
                    d["final_params"] = _serialize_value(d.get("final_params", {}))
                d["return_value"] = _serialize_value(d.get("return_value"))
                if c.base_case is not None:
                    d["is_base_case"] = bool(
                        c.base_case.get("detected", False) and c.base_case.get("matched", False)
                    )
                else:
                    d["is_base_case"] = False
                calls_list.append(d)
            recursion_tree = {
                "calls": calls_list,
                "root_calls": root_calls,
            }
            result["recursionTree"] = recursion_tree

        return result

    def reset(self) -> None:
        """
        Reinicia el constructor (útil para múltiples ejecuciones).

        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        self.steps.clear()
        self.recursion_calls.clear()
        self.recursion_stack.clear()
        self.step_counter = 0
        self.call_id_counter = 0
        self.cost_counter = 0
        self.accumulated_cost_parts.clear()
        self._prev_variables = None
