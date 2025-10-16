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
    Body compat:
      { "input": string }  o  { "source": string }
    Respuesta compat con el frontend:
      { ok, available, runtime, error?, ast? }
    """
    source = str(payload.get("input") or payload.get("source") or "")

    if not GRAMMAR_AVAILABLE or parse_to_ast is None:
        return {
            "ok": False,
            "available": False,
            "runtime": "python",
            "error": "aa_grammar no disponible",
            "ast": None,
        }

    ast, errors = parse_to_ast(source)
    ok = len(errors) == 0
    # Mensaje compacto (primero) para `error`
    msg = None if ok else (errors[0].get("message", "error de sintaxis"))
    return {
        "ok": ok,
        "available": True,
        "runtime": "python",
        "error": msg,
        "ast": ast if ok else None,
        "errors": errors,  # útil para depurar (el front puede ignorarlo)
    }
