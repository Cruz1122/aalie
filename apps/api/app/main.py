# path: apps/api/app/main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .core.config import get_dev_allowed_origins, get_dev_cors_enabled

app = FastAPI(title="algorithmic-analysis API", version="0.1.0")

# --- CORS SOLO DEV ---
if get_dev_cors_enabled():
    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_dev_allowed_origins(),
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
        max_age=600,
    )


# --- Rutas ---
@app.get("/health")
def health():
    # Respeta tu forma actual (JSON con {"status":"ok"})
    return JSONResponse({"status": "ok"})


@app.post("/grammar/parse")
async def grammar_parse(request: Request):
    _ = await request.json()  # TODO: Usar data para parseo real
    # Implementa aquí el parseo real, por ahora responde dummy:
    return {"ok": True, "available": True, "runtime": "python", "error": None}
