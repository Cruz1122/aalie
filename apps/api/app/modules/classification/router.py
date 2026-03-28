"""
Enrutador del módulo de clasificación.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""

from typing import Any, Dict

from fastapi import APIRouter, Body

from .service import classify_algorithm

router = APIRouter(prefix="/classify", tags=["classify"])


@router.post("")
def classify(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """
    Clasifica un algoritmo a partir del contenido recibido en el cuerpo.

    Acepta dos formatos de entrada en el payload:
    {"source": str} para parsear y clasificar código fuente, o
    {"ast": Dict[str, Any]} para clasificar un AST ya construido.

    Args:
        payload: Diccionario con la clave "source" o "ast" que
            contiene la información a clasificar.

    Returns:
        Diccionario con el resultado de la clasificación. Incluye ok,
        kind, method y, cuando aplica, la lista errors.

    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """
    source = payload.get("source")
    ast = payload.get("ast")

    return classify_algorithm(source=source, ast=ast)
