"""
Constructor del rastro de ejecución.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
import json

# Estimación de coste por operación primitiva (μs). Heurística basada en operaciones típicas.
MICROSECONDS_PER_TOKEN = 3.0


def _estimate_step_cost(event_kind: str) -> Tuple[int, float]:
    """Estima tokens (ops elementales) y microsegundos para un paso."""
    # Tokens por tipo: operaciones más costosas (condiciones, llamadas) = 2
    token_map = {
        "assign": 1,
        "condition_eval": 2,
        "loop_iter_enter": 1,
        "loop_iter_exit": 1,
        "call_enter": 2,
        "call_spawn_child": 2,
        "call_resume": 1,
        "return_emit": 1,
        "call_exit": 1,
        "print": 2,
        "end": 0,
        "enter_block": 0,
    }
    tokens = token_map.get(event_kind, 1)
    microseconds = tokens * MICROSECONDS_PER_TOKEN
    return (tokens, microseconds)


@dataclass
class ExecutionStep:
    """Un paso de ejecución individual."""
    step_number: int
    line: int
    kind: str  # eventKind: "assign" | "condition_eval" | "loop_iter_enter" | "call_enter" | "return_emit" | ...
    variables: Dict[str, Any]
    iteration: Optional[Dict[str, Any]] = None  # Para bucles: {loopVar, currentValue, maxValue}
    recursion: Optional[Dict[str, Any]] = None  # Para recursión: {depth, callId, params}
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
    parent_id: Optional[str] = None
    function_name: Optional[str] = None
    entry_line: Optional[int] = None
    return_value: Optional[Any] = None
    base_case: Optional[Dict[str, Any]] = None  # {detected: bool, conditionText?: str, matched?: bool}


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
        
        step = ExecutionStep(
            step_number=self.step_counter,
            line=line,
            kind=effective_kind,
            variables=variables.copy(),
            iteration=iteration,
            recursion=recursion,
            cost=cost,
            accumulated_cost=accumulated_cost,
            description=description,
            decision=decision,
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
    ) -> None:
        """
        Registra el inicio de una llamada recursiva.

        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        parent_id = self.recursion_stack[-1] if self.recursion_stack else None

        call = RecursionCall(
            id=call_id,
            depth=depth,
            params=params.copy(),
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
        result: Dict[str, Any] = {
            "steps": [asdict(step) for step in self.steps]
        }
        
        # Agregar árbol de recursión si hay llamadas recursivas
        if self.recursion_calls:
            # Encontrar la raíz (llamada sin padre)
            root_calls = [
                call_id for call_id, call in self.recursion_calls.items()
                if call.depth == 0
            ]
            
            calls_list = []
            for call_id in sorted(self.recursion_calls.keys()):
                c = self.recursion_calls[call_id]
                d = asdict(c)
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

