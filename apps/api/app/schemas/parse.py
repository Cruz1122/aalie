from pydantic import BaseModel, Field
from typing import Any, List, Optional

class ParseRequest(BaseModel):
    source: str = Field("", description="Código fuente en pseudocódigo del proyecto.")

class ParseError(BaseModel):
    line: int
    column: int
    message: str

class ParseResponse(BaseModel):
    ok: bool
    ast: Optional[Any] = None
    errors: List[ParseError] = []
