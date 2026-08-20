"""
Punto de entrada principal de la aplicación FastAPI.

Configura la aplicación FastAPI, middlewares (CORS por entorno),
y registra los routers de los módulos principales.

Author: Juan Felipe Henao (@Pipe-1z)
"""

import os
import shutil
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .core.config import get_cors_allowed_origins, get_cors_enabled
from .modules.analysis.router import router as analyze_router
from .modules.auth.router import router as auth_router
from .modules.classification.router import router as classify_router
from .modules.export.asset_registry import resolve_latex_asset_registry
from .modules.export.router import router as export_router
from .modules.llm.router import router as llm_router
from .modules.parsing.router import router as parse_router
from .modules.quizzes.router import router as quizzes_router

# Cargar variables de entorno desde .env
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")


def create_app() -> FastAPI:
    load_dotenv(env_path)

    app = FastAPI(title="algorithmic-analysis API", version="0.1.0")

    # --- CORS configurado por entorno ---
    if get_cors_enabled():
        app.add_middleware(
            CORSMiddleware,
            allow_origins=get_cors_allowed_origins(),
            allow_credentials=False,
            allow_methods=["*"],
            allow_headers=["*"],
            expose_headers=["Content-Disposition", "X-Snapshot-Id", "X-Content-Hash"],
            max_age=600,
        )

    # --- Rutas ---
    @app.get("/health/live")
    def health_live():
        return JSONResponse({"ok": True, "status": "live"})

    @app.get("/health/ready")
    def health_ready():
        checks: dict[str, bool] = {}

        try:
            import aa_grammar  # noqa: F401

            checks["parser"] = True
        except Exception:
            checks["parser"] = False

        try:
            assets = resolve_latex_asset_registry()
            checks["export_assets"] = all(
                Path(path).is_file()
                for path in (
                    assets.style_file_path,
                    assets.template_path,
                    assets.ucaldas_logo_path,
                    assets.aalie_logo_path,
                )
            )
        except Exception:
            checks["export_assets"] = False

        try:
            from .modules.quizzes.repository import get_validated_dataset

            _, report = get_validated_dataset()
            checks["quizzes"] = len(report.errors) == 0
        except Exception:
            checks["quizzes"] = False

        checks["pdflatex"] = shutil.which("pdflatex") is not None

        try:
            from .core.database import check_database_connection

            checks["postgresql"] = check_database_connection()
        except Exception:
            checks["postgresql"] = False

        ready = all(checks.values())
        return JSONResponse(
            {"ok": ready, "status": "ready" if ready else "not_ready", "checks": checks},
            status_code=200 if ready else 503,
        )

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
    app.include_router(auth_router)
    app.include_router(classify_router)
    app.include_router(llm_router)
    app.include_router(export_router)
    app.include_router(quizzes_router)

    return app


app = create_app()
