from fastapi import APIRouter, Body
from typing import Any, Dict

router = APIRouter(prefix="/grammar", tags=["grammar"])

# Intentar usar el parser real si está instalado
try:
    from aa_grammar.api import parse_to_ast  # type: ignore
    GRAMMAR_AVAILABLE = True
except Exception:
    parse_to_ast = None
    GRAMMAR_AVAILABLE = False

@router.post("/parse")
def parse(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """
    Parsea pseudocódigo y devuelve AST o errores.
    
    Body compat:
      { "input": string }  o  { "source": string }
    Respuesta compat con el frontend:
      { ok, available, runtime, error?, ast?, errors? }
    """
    # Extraer source de input o source para compatibilidad
    source = str(payload.get("input") or payload.get("source") or "")

    if not GRAMMAR_AVAILABLE or parse_to_ast is None:
        return {
            "ok": False,
            "available": False,
            "runtime": "python",
            "error": "aa_grammar no disponible",
            "ast": None,
            "errors": [{"line": 0, "column": 0, "message": "aa_grammar no disponible"}],
        }

    # Parsear el código
    ast, raw_errors = parse_to_ast(source)
    ok = len(raw_errors) == 0
    
    # Convertir errores al formato estándar
    errors_list = [
        {
            "line": e.get("line", 0),
            "column": e.get("column", 0),
            "message": e.get("message", "error de sintaxis")
        }
        for e in raw_errors
    ]
    
    # Mensaje compacto (primero) para `error`
    msg = None if ok else errors_list[0]["message"]
    
    return {
        "ok": ok,
        "available": True,
        "runtime": "python",
        "error": msg,
        "ast": ast if ok else None,
        "errors": errors_list,
    }
