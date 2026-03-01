"""MCP AALIE Conventions - tools para convenciones, i18n, changelog y docs."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

try:
    from mcp.server.fastmcp import FastMCP
except ImportError:
    raise SystemExit("pip install mcp")

mcp = FastMCP("AALIE Conventions", json_response=True)


@mcp.tool()
def read_conventions() -> str:
    """OBLIGATORIO antes de crear/modificar código. Devuelve convenciones AALIE."""
    p = ROOT / "docs" / "development" / "conventions.md"
    return p.read_text(encoding="utf-8") if p.exists() else "No encontrado."


@mcp.tool()
def read_doc(path: str) -> str:
    """Lee docs. Ej: app/i18n-labels-prompts.md, api/endpoints.md."""
    p = ROOT / "docs" / path
    if not str(p.resolve()).startswith(str(ROOT)):
        return "Ruta no permitida."
    return p.read_text(encoding="utf-8") if p.exists() else "No encontrado."


@mcp.tool()
def list_components(folder: str = "") -> str:
    """Lista componentes en apps/web/src/components. Revisar antes de crear uno nuevo."""
    base = ROOT / "apps" / "web" / "src" / "components"
    d = base / folder if folder else base
    if not d.exists():
        return "No encontrado."
    files = list(d.glob("*.tsx")) + list(d.glob("*.ts"))
    return "\n".join(f.name for f in sorted(files, key=lambda x: x.name))


@mcp.tool()
def changelog_template() -> str:
    """Formato para CHANGELOG.md. Añadir entrada en [Unreleased] antes de commit."""
    return """## [Unreleased]
### Added
### Changed
### Fixed
### Removed"""


@mcp.tool()
def i18n_reminder() -> str:
    """Recordatorio i18n: no literales en UI. Usar useTranslations + messages/."""
    return (
        "Frontend: useTranslations('ns') -> t('key'). "
        "Archivos: messages/es.json, en.json. "
        "Backend: translations.py"
    )


@mcp.tool()
def test_suite_commands() -> str:
    """Comandos de la suite de tests backend (apps/api). Usar desde raíz del repo."""
    return """Suite de tests API (ejecutar desde raíz: pnpm <script> o cd apps/api && python -m pytest ...):

- pnpm test:api          → Todos los tests (tests/ -v)
- pnpm test:api:gate     → Daily gate (unit or component or system, -q)
- pnpm test:api:contract → Solo contract (nightly)
- pnpm test:api:cov      → Con cobertura (--cov=app --cov-report=term)
- pnpm test:api:unit     → Solo tests/unit/ -v
- pnpm test:api:stress   → Solo test_stress_algorithms.py (Prueba1–Prueba7)

Desde apps/api: python -m pytest tests/ -v (siempre python -m pytest, no pytest directo).
Markers: unit, component, contract, system, slow, while, recursive, dp."""


if __name__ == "__main__":
    mcp.run(transport="stdio")
