"""
Punto de entrada principal de la aplicación FastAPI.

Configura la aplicación FastAPI, middlewares (CORS en desarrollo),
y registra los routers de los módulos principales.

Author: Juan Felipe Henao (@Pipe-1z)
"""
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .core.config import get_dev_allowed_origins, get_dev_cors_enabled
from .modules.analysis.router import router as analyze_router
from .modules.classification.router import router as classify_router
from .modules.parsing.router import router as parse_router

# Cargar variables de entorno desde .env
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(env_path)

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
    """
    Endpoint de health check para verificar el estado del servidor.
    
    Returns:
        JSONResponse con {"status": "ok"}
        
    Author: Juan Felipe Henao (@Pipe-1z)
    """
    # Respeta tu forma actual (JSON con {"status":"ok"})
    return JSONResponse({"status": "ok"})


app.include_router(parse_router)
app.include_router(analyze_router)
app.include_router(classify_router)
