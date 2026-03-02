# MCP AALIE Conventions

Servidor MCP que expone herramientas para seguir convenciones del proyecto.

## Instalación

```bash
pip install -r mcp/requirements.txt
```

## Configuración

La configuración está en `.cursor/mcp.json`. Cursor la carga automáticamente al abrir el proyecto.

## Herramientas

| Tool | Descripción |
|------|-------------|
| `read_conventions` | Lee docs/development/conventions.md |
| `read_doc` | Lee documentación por ruta (ej: app/i18n-labels-prompts.md) |
| `list_components` | Lista componentes en apps/web/src/components |
| `changelog_template` | Formato para CHANGELOG.md |
| `i18n_reminder` | Recordatorio de uso de i18n |
| `test_suite_commands` | Comandos de la suite de tests (pnpm test:api, test:api:gate, etc.) |

## Ejecutar tests (Backend)

Desde la raíz del repo: `pnpm test:api`, `pnpm test:api:gate`, `pnpm test:api:contract`, `pnpm test:api:cov`, `pnpm test:api:unit`, `pnpm test:api:stress`.  
O desde `apps/api` con `python -m pytest` (no `pytest` directo):

```bash
cd apps/api && python -m pytest tests/ -v
python -m pytest tests/unit/ -v
python -m pytest tests/contract/test_stress_algorithms.py -v
```

## Verificar MCP

```bash
cd c:/dev/algorithmic-analysis
python mcp/server.py
```

El servidor usa stdio; Cursor lo invoca automáticamente.
