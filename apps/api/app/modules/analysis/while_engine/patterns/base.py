"""
Contrato base para patrones estructurales de WHILE.

Author: @Cruz1122
Version: 0.1.0
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Dict, List, Optional


@dataclass
class TerminationResult:
    """Resultado de terminación."""

    proven_terminating: bool
    proven_non_terminating: bool
    not_proven: bool


@dataclass
class IterationBoundResult:
    """Resultado de cota de iteraciones."""

    exact_symbolic_bound: Optional[str]
    asymptotic_bound: Optional[str]
    not_proven: bool
    iterations_class: Optional[str] = None
    evidence_level: Optional[str] = None
    reason_code: Optional[str] = None


@dataclass
class CaseResult:
    """Resultado por caso (best/avg/worst)."""

    best_case: Optional[str]
    avg_case: Optional[str]
    worst_case: Optional[str]


class WhilePattern(ABC):
    """Contrato base para patrones de WHILE."""

    @abstractmethod
    def matches(self, while_ctx: Dict[str, Any]) -> bool:
        """True si el patrón aplica al contexto del WHILE."""
        pass

    @abstractmethod
    def derive_termination(self, while_ctx: Dict[str, Any]) -> TerminationResult:
        """Deriva resultado de terminación."""
        pass

    @abstractmethod
    def derive_iterations(self, while_ctx: Dict[str, Any]) -> IterationBoundResult:
        """Deriva cota de iteraciones."""
        pass

    def derive_cases(self, while_ctx: Dict[str, Any]) -> CaseResult:
        """Deriva best/avg/worst. Por defecto not_proven."""
        return CaseResult(best_case=None, avg_case=None, worst_case=None)

    def explain(self, while_ctx: Dict[str, Any]) -> List[str]:
        """Explicación técnica del patrón."""
        return []
