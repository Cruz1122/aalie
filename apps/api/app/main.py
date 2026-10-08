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
from .modules.llm.schemas import MAX_LLM_REQUEST_BYTES
from .modules.parsing.router import router as parse_router
from .modules.quizzes.router import router as quizzes_router
from .modules.rate_limits.router import router as rate_limits_router
from .modules.studies.router import router as studies_router
from .modules.studies.telemetry import event_for_path, record_request_event

env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
root_env_path = str(Path(__file__).resolve().parents[3] / ".env")


class LLMBodyLimitMiddleware:
    """Reject oversized LLM bodies before FastAPI parses or materializes them."""

    def __init__(self, app, max_bytes: int):
        self.app = app
        self.max_bytes = max_bytes

    @staticmethod
    async def _send_too_large(scope, receive, send) -> None:
        response = JSONResponse(
            {
                "ok": False,
                "error": "LLM request payload is too large",
                "errorCode": "LLM_PAYLOAD_TOO_LARGE",
            },
            status_code=413,
        )
        await response(scope, receive, send)

    async def __call__(self, scope, receive, send):
        if scope.get("type") != "http" or scope.get("path") != "/llm" or scope.get(
            "method"
        ) != "POST":
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers", []))
        raw_content_length = headers.get(b"content-length")
        if raw_content_length:
            try:
                if int(raw_content_length) > self.max_bytes:
                    await self._send_too_large(scope, receive, send)
                    return
            except ValueError:
                pass

        chunks: list[bytes] = []
        received_bytes = 0
        disconnected = False
        while True:
            message = await receive()
            message_type = message.get("type")
            if message_type == "http.disconnect":
                disconnected = True
                break
            if message_type != "http.request":
                continue

            chunk = message.get("body", b"")
            received_bytes += len(chunk)
            if received_bytes > self.max_bytes:
                await self._send_too_large(scope, receive, send)
                return
            chunks.append(chunk)
            if not message.get("more_body", False):
                break

        body = b"".join(chunks)
        delivered = False

        async def replay_receive():
            nonlocal delivered
            if delivered:
                return {"type": "http.disconnect"}
            delivered = True
            if disconnected:
                return {"type": "http.disconnect"}
            return {"type": "http.request", "body": body, "more_body": False}

        await self.app(scope, replay_receive, send)


def create_app() -> FastAPI:
    load_dotenv(root_env_path)
    load_dotenv(env_path)

    app = FastAPI(title="algorithmic-analysis API", version="0.1.0")

    app.add_middleware(LLMBodyLimitMiddleware, max_bytes=MAX_LLM_REQUEST_BYTES)

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
