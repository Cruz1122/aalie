# path: apps/api/app/core/config.py
import os


def _as_bool(value: str) -> bool:
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


def get_dev_cors_enabled() -> bool:
    # Por defecto lo dejamos encendido en dev
    return _as_bool(os.getenv("DEV_CORS_ENABLED", "1"))


def get_dev_allowed_origins() -> list[str]:
    raw = os.getenv("DEV_ALLOWED_ORIGINS", "")
    defaults = ["http://localhost:3000", "http://127.0.0.1:3000"]
    items = [s.strip() for s in raw.split(",") if s.strip()]
    return items if items else defaults
