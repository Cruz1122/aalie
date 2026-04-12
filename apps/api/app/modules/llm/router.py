"""Router de endpoints LLM backend."""

from __future__ import annotations

from fastapi import APIRouter, Body
from fastapi.responses import JSONResponse

from .schemas import LLMRequest
from .service import execute_llm_request, get_status_payload

router = APIRouter(prefix="/llm", tags=["llm"])


@router.post("")
def llm_execute(payload: LLMRequest = Body(...)):
    result = execute_llm_request(payload.model_dump(by_alias=True, exclude_none=True))
    status = int(result.pop("status", 200))
    return JSONResponse(content=result, status_code=status)


@router.get("/status")
def llm_status():
    return {
        "ok": True,
        "status": get_status_payload(),
    }
