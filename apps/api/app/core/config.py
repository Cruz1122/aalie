"""
Módulo de configuración core para la aplicación.

Author: Juan Felipe Henao (@Pipe-1z)
"""
import os


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
    defaults = ["http://localhost:3000", "http://127.0.0.1:3000"]
    items = [s.strip() for s in raw.split(",") if s.strip()]
    return items if items else defaults
