"""
Tabla de símbolos para procedimientos.

Infiere el rol real de cada símbolo usando el AST y la gramática, no su nombre textual.

Author: @Cruz1122
Version: 0.1.0
"""
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set


@dataclass
class SymbolInfo:
    """
    Información semántica de un símbolo.

    Attributes:
        name: Nombre del símbolo
        scope: Scope (procedure, block, loop)
        origin: parameter | local | loop_local | temp
        kind: numeric | boolean | array | object | unknown
        declared_at: Lista de posiciones (line, col) donde se declara
        assigned_at: Lista de posiciones donde se asigna
        read_at: Lista de posiciones donde se lee
        participates_in_guard: True si aparece en condición de guard
        participates_in_index: True si se usa como índice (A[var])
        aliases: Nombres que pueden referenciar al mismo valor
    """

    name: str
    scope: str = "procedure"
    origin: str = "local"  # parameter | local | loop_local | temp
    kind: str = "unknown"  # numeric | boolean | array | object | unknown
    declared_at: List[Dict[str, int]] = field(default_factory=list)
    assigned_at: List[Dict[str, int]] = field(default_factory=list)
    read_at: List[Dict[str, int]] = field(default_factory=list)
    participates_in_guard: bool = False
    participates_in_index: bool = False
    aliases: Set[str] = field(default_factory=set)

    @property
    def is_control_candidate(self) -> bool:
        """True si es candidato a variable de control (escrito en cuerpo y en guard)."""
        return (
            self.participates_in_guard
            and len(self.assigned_at) > 0
            and self.kind in ("numeric", "boolean", "unknown")
        )

    @property
    def is_bound_candidate(self) -> bool:
        """True si es candidato a límite (solo leído, no escrito en cuerpo del loop)."""
        return self.participates_in_guard and len(self.assigned_at) == 0


class SymbolTable:
    """
    Tabla de símbolos por procedimiento.

    Construida a partir del AST recorriendo el procedimiento.
    """

    def __init__(self, proc_name: str = ""):
        self.proc_name = proc_name
        self._symbols: Dict[str, SymbolInfo] = {}

    def get_or_create(self, name: str) -> SymbolInfo:
        """Obtiene o crea la entrada de un símbolo."""
        if name not in self._symbols:
            self._symbols[name] = SymbolInfo(name=name)
        return self._symbols[name]

    def get(self, name: str) -> Optional[SymbolInfo]:
        """Obtiene la entrada de un símbolo si existe."""
        return self._symbols.get(name)

    def symbol_names(self) -> Set[str]:
        """Retorna todos los nombres de símbolos."""
        return set(self._symbols.keys())

    def control_candidates(self) -> List[SymbolInfo]:
        """Símbolos candidatos a variable de control."""
        return [s for s in self._symbols.values() if s.is_control_candidate]

    def bound_candidates(self) -> List[SymbolInfo]:
        """Símbolos candidatos a límite."""
        return [s for s in self._symbols.values() if s.is_bound_candidate]

    def __iter__(self):
        return iter(self._symbols.values())
