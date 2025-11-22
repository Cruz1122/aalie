"""
Router para el módulo de classification.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""
from fastapi import APIRouter, Body
from typing import Any, Dict
from .service import classify_algorithm

router = APIRouter(prefix="/classify", tags=["classify"])


@router.post("")
def classify(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """
    Clasifica un algoritmo como iterative, recursive, hybrid o unknown.
    
    Acepta dos formatos de entrada:
    - {"source": str}: Código fuente a parsear y clasificar
    - {"ast": Dict[str, Any]}: AST ya parseado a clasificar
    
    Args:
        payload: Diccionario con "source" o "ast" a clasificar
        
    Returns:
        Diccionario con ok, kind ("iterative"|"recursive"|"hybrid"|"unknown"), method y errors (opcional)
        
    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """
    source = payload.get("source")
    ast = payload.get("ast")
    
    return classify_algorithm(source=source, ast=ast)

