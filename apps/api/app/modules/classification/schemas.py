"""
Modelos Pydantic para el módulo de classification.
"""
from typing import Any, Dict, Optional
from pydantic import BaseModel


class ClassifyRequest(BaseModel):
    """Request para clasificar algoritmo."""
    source: Optional[str] = None
    ast: Optional[Dict[str, Any]] = None


class ClassifyResponse(BaseModel):
    """Response de clasificación."""
    ok: bool
    kind: Optional[str] = None  # "iterative" | "recursive" | "hybrid" | "unknown"
    method: Optional[str] = None
    errors: Optional[list[Dict[str, Any]]] = None


