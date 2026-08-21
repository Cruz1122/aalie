"""
Módulo de configuración core para la aplicación.

Author: Juan Felipe Henao (@Pipe-1z)
"""

import os

DEFAULT_ALLOWED_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]


def _as_bool(value: str) -> bool:
    """
    Convierte un string a booleano.

    Args:
        value: String a convertir (acepta "1", "true", "yes", "y", "on" para True)

    Returns:
        True si el valor representa verdadero, False en caso contrario

    Author: Juan Felipe Henao (@Pipe-1z)
    """
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


def get_dev_cors_enabled() -> bool:
    """
    Obtiene si CORS está habilitado en modo desarrollo.

    Por defecto está habilitado (retorna True si la variable de entorno
    DEV_CORS_ENABLED no está definida o está en un valor "truthy").

    Returns:
        True si CORS está habilitado, False en caso contrario

    Author: Juan Felipe Henao (@Pipe-1z)
    """
    # Por defecto lo dejamos encendido en dev
    return _as_bool(os.getenv("DEV_CORS_ENABLED", "1"))


def get_cors_enabled() -> bool:
    """
    Habilita CORS en cualquier ambiente.

    - Si `CORS_ENABLED` está definida, se usa.
    - Si no, se mantiene compatibilidad con `DEV_CORS_ENABLED`.
    """

    return _as_bool(os.getenv("CORS_ENABLED", os.getenv("DEV_CORS_ENABLED", "1")))


def _parse_allowed_origins(raw: str) -> list[str]:
    raw = (raw or "").strip()
    if raw == "*":
        return ["*"]
    items = [s.strip() for s in raw.split(",") if s.strip()]
    return items


def get_dev_allowed_origins() -> list[str]:
    """
    Obtiene los orígenes permitidos para CORS en modo desarrollo.

    Si la variable de entorno DEV_ALLOWED_ORIGINS está definida y contiene valores,
    se usan esos valores separados por comas. Si no, se usan valores por defecto:
    ["http://localhost:3000", "http://127.0.0.1:3000"]

    Returns:
        Lista de strings con los orígenes permitidos

    Author: Juan Felipe Henao (@Pipe-1z)
    """
    raw = os.getenv("DEV_ALLOWED_ORIGINS", "")
    items = _parse_allowed_origins(raw)
    return items if items else DEFAULT_ALLOWED_ORIGINS


def get_cors_allowed_origins() -> list[str]:
    """
    Orígenes permitidos para CORS.

    - Primero intenta `CORS_ALLOWED_ORIGINS`.
    - Si no está, intenta `DEV_ALLOWED_ORIGINS`.
    - Si no hay ninguno definido, usa los orígenes de desarrollo por defecto.
    - El wildcard (`*`) solo se habilita si se configura explícitamente.
    """

    raw = (
        os.getenv("CORS_ALLOWED_ORIGINS")
        or os.getenv("DEV_ALLOWED_ORIGINS")
        or ",".join(DEFAULT_ALLOWED_ORIGINS)
    )
    items = _parse_allowed_origins(raw)
    return items if items else DEFAULT_ALLOWED_ORIGINS


def get_database_url() -> str:
    """Obtiene la URL de PostgreSQL configurada para el runtime."""

    database_url = os.getenv("DATABASE_URL", "").strip()
    if not database_url:
        raise RuntimeError("DATABASE_URL is required")
    return database_url
