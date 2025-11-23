"""
Modelos Pydantic para el módulo de parsing.
"""
from typing import Any, Dict, Optional
from pydantic import BaseModel


class ParseRequest(BaseModel):
    """Request para parsear código."""
    input: Optional[str] = None
    source: Optional[str] = None


class ParseResponse(BaseModel):
    """Response del parsing."""
    ok: bool
    available: bool
    runtime: str
    error: Optional[str] = None
    ast: Optional[Dict[str, Any]] = None
    errors: list[Dict[str, Any]] = []

