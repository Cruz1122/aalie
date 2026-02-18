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

## Ejecutar tests (Backend)

Usar `python -m pytest` para evitar problemas de PATH:

```bash
cd apps/api && python -m pytest tests/ -v
python -m pytest tests/unit/ -v
python -m pytest tests/integration/test_iterative_analyzer.py::TestIterativeAnalyzer::test_foo -v
```

## Verificar MCP

```bash
cd c:/dev/algorithmic-analysis
python mcp/server.py
```

El servidor usa stdio; Cursor lo invoca automáticamente.
