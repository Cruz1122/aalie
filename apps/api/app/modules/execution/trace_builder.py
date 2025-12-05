"""
Constructor del rastro de ejecución.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, asdict
import json


@dataclass
class ExecutionStep:
    """Un paso de ejecución individual."""
    step_number: int
    line: int
    kind: str  # "assign" | "for" | "while" | "if" | "return" | "call" | "print"
    variables: Dict[str, Any]
    iteration: Optional[Dict[str, Any]] = None  # Para bucles: {loopVar, currentValue, maxValue}
    recursion: Optional[Dict[str, Any]] = None  # Para recursión: {depth, callId, params}
    cost: Optional[str] = None  # "C1", "C2", etc.
    accumulated_cost: Optional[str] = None  # Expresión acumulada
    description: Optional[str] = None  # Descripción del paso
    microseconds: Optional[float] = None  # Tiempo estimado en microsegundos
    tokens: Optional[int] = None  # Número de operaciones elementales (tokens)


@dataclass
class RecursionCall:
    """Una llamada recursiva en el árbol."""
    id: str
    depth: int
    params: Dict[str, Any]
    children: List[str]  # IDs de llamadas hijas


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
        description: Optional[str] = None
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
        
        step = ExecutionStep(
            step_number=self.step_counter,
            line=line,
            kind=kind,
            variables=variables.copy(),
            iteration=iteration,
            recursion=recursion,
            cost=cost,
            accumulated_cost=accumulated_cost,
            description=description
        )
        
        self.steps.append(step)
    
    def enter_recursion(self, call_id: str, depth: int, params: Dict[str, Any]) -> None:
        """
        Registra el inicio de una llamada recursiva.
        
        Args:
            call_id: ID único de la llamada
            depth: Profundidad de la recursión
            params: Parámetros de la llamada
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        parent_id = self.recursion_stack[-1] if self.recursion_stack else None
        
        call = RecursionCall(
            id=call_id,
            depth=depth,
            params=params.copy(),
            children=[]
        )
        
        self.recursion_calls[call_id] = call
        
        if parent_id:
            self.recursion_calls[parent_id].children.append(call_id)
        
        self.recursion_stack.append(call_id)
    
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
            
            recursion_tree = {
                "calls": [asdict(self.recursion_calls[call_id]) for call_id in sorted(self.recursion_calls.keys())],
                "root_calls": root_calls
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

