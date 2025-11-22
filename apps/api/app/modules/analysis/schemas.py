"""
Modelos Pydantic para el módulo de analysis.
"""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class AvgModelConfig(BaseModel):
    mode: str = "uniform"  # "uniform" | "symbolic"
    predicates: Optional[Dict[str, str]] = None  # ej: {"A[j] > A[j+1]": "1/2"}


class AnalyzeRequest(BaseModel):
    source: str
    mode: str = "worst"  # "worst" | "best" | "avg" | "all"
    api_key: Optional[str] = None  # API Key de Gemini (opcional)
    avgModel: Optional[AvgModelConfig] = None  # Modelo probabilístico para caso promedio
    algorithm_kind: Optional[str] = None  # "iterative" | "recursive" | "hybrid" | "unknown"
    preferred_method: Optional[str] = None  # "characteristic_equation" | "iteration" | "recursion_tree" | "master"


class LineCost(BaseModel):
    line: int
    kind: str  # "assign" | "if" | "for" | "while" | "repeat" | "call" | "return" | "decl" | "other"
    ck: str
    count: str
    count_raw: str  # Sumatorias sin simplificar
    note: Optional[str] = None


class AnalyzeOpenResponse(BaseModel):
    ok: bool = True
    byLine: List[LineCost]
    totals: Dict[str, Any]


class AnalyzeError(BaseModel):
    ok: bool = False
    errors: List[Dict[str, Any]]

