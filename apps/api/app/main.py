"""
Punto de entrada principal de la aplicación FastAPI.

Configura la aplicación FastAPI, middlewares (CORS por entorno),
y registra los routers de los módulos principales.
"""

import os
import shutil
from pathlib import Path
from time import perf_counter

from dotenv import load_dotenv
from fastapi import FastAPI, Request
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
from .modules.rate_limits.router import router as rate_limits_router
from .modules.studies.router import router as studies_router
from .modules.studies.telemetry import event_for_path, record_request_event

env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")


def create_app() -> FastAPI:
    load_dotenv(env_path)

    app = FastAPI(title="algorithmic-analysis API", version="0.1.0")

    if get_cors_enabled():
        app.add_middleware(
            CORSMiddleware,
            allow_origins=get_cors_allowed_origins(),
            allow_credentials=False,
            allow_methods=["*"],
            allow_headers=["*"],
            expose_headers=[
                "Content-Disposition",
                "X-Snapshot-Id",
                "X-Content-Hash",
                "Retry-After",
            ],
            max_age=600,
        )

    @app.middleware("http")
    async def study_telemetry_middleware(request: Request, call_next):
        event_name = event_for_path(request.url.path)
        if event_name is None:
            return await call_next(request)

        started = perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            record_request_event(
                request,
                event_name=event_name,
                success=False,
                duration_ms=int((perf_counter() - started) * 1000),
                error_code="UNHANDLED_EXCEPTION",
            )
            raise

        record_request_event(
            request,
            event_name=event_name,
            success=response.status_code < 400,
            duration_ms=int((perf_counter() - started) * 1000),
            error_code=None if response.status_code < 400 else f"HTTP_{response.status_code}",
        )
        return response

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
        return JSONResponse({"status": "ok"})

    app.include_router(parse_router)
    app.include_router(analyze_router)
    app.include_router(auth_router)
    app.include_router(classify_router)
    app.include_router(llm_router)
    app.include_router(export_router)
    app.include_router(quizzes_router)
    app.include_router(rate_limits_router)
    app.include_router(studies_router)

    return app


app = create_app()
