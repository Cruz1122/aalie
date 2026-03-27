"""
Router para el módulo de parsing.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""

from typing import Any, Dict

from fastapi import APIRouter, Body

from .adapter import is_grammar_available
from .service import parse_source

router = APIRouter(prefix="/grammar", tags=["grammar"])


@router.post("/parse")
def parse(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """
    Parsea pseudocódigo y devuelve AST o errores.

    Body compat:
      { "input": string }  o  { "source": string }
    Respuesta compat con el frontend:
      { ok, available, runtime, error?, ast?, errors? }

    Args:
        payload: Diccionario con "input" o "source" conteniendo el código a parsear

    Returns:
        Diccionario con ok, available, runtime, error (opcional), ast (opcional) y errors (opcional)

    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """
    # Extraer source de input o source para compatibilidad
    source = str(payload.get("input") or payload.get("source") or "")

    # Usar la función parse_source
    result = parse_source(source)

    # Agregar campos adicionales para compatibilidad con el frontend
    return {
        "ok": result["ok"],
        "available": is_grammar_available(),
        "runtime": "python",
        "error": result["errors"][0]["message"] if result["errors"] else None,
        "ast": result["ast"],
        "errors": result["errors"],
    }
