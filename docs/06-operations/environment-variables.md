# Variables de entorno

**Tipo:** normativa

## Propósito

Centralizar las variables de entorno del sistema y clasificar cuales son obligatorias, opcionales o deprecated.

## Alcance

Cubre frontend, BFF LLM y backend API.

## Fuente de verdad

- `apps/api/app/core/config.py`
- `apps/api/app/modules/export/asset_registry.py`
- `apps/web/src/app/api/`
- `apps/web/.env.example`
- `apps/web/src/app/api/llm/llm-config.ts`

## Estructura

### Frontend / BFF

| Variable | Uso | Tipo |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | URL pública para consumo cliente | opcional |
| `API_BASE_URL` | URL base del backend para rutas Next | opcional |
| `API_INTERNAL_BASE_URL` | URL interna backend en SSR/Docker | opcional |
| `DOCKER` | activa fallback `http://api:8000` | opcional |
| `NODE_ENV` | comportamiento de build/debug del frontend | opcional |
| `NEXT_PUBLIC_API_KEY` | fallback pública de API key | opcional |
| `API_KEY` | API key del servidor para Gemini | opcional |
| `GEMINI_ENDPOINT_BASE` | endpoint base del proveedor | opcional |
| `LLM_MODEL_PARSER_ASSIST` | modelo por job | opcional |
| `LLM_MODEL_GENERAL` | modelo por job | opcional |
| `LLM_MODEL_REPAIR` | modelo por job | opcional |
| `LLM_MODEL_COMPARE` | modelo por job | opcional |
| `LLM_MODEL_EXPLAIN` | modelo por job | opcional |
| `NEXT_PUBLIC_USE_DETERMINISTIC_DIAGRAMS` | flag frontend para diagramas deterministas | opcional |
| `AALIE_USE_LATEX_ONLINE` | flag local heredada; hoy debe tratarse como deprecated hasta que exista consumo real en código | deprecated |

### API backend

| Variable | Uso | Tipo |
| --- | --- | --- |
| `CORS_ENABLED` | habilita CORS global | opcional |
| `CORS_ALLOWED_ORIGINS` | origins permitidos | opcional |
| `DEV_CORS_ENABLED` | compatibilidad dev | deprecated-compatible |
| `DEV_ALLOWED_ORIGINS` | compatibilidad dev | deprecated-compatible |
| `AALIE_EXPORTER_ASSETS_DIR` | override de assets LaTeX | opcional |

## Ejemplos

- en Docker web usa `API_INTERNAL_BASE_URL=http://api:8000`;
- para soporte LLM servidor se configura `API_KEY`.

## Limites conocidos

- `DEV_*` se mantienen por compatibilidad, pero la configuración preferida es `CORS_*`.
- algunas variables solo aplican al BFF/server-side y no al navegador.

## Archivos relacionados

- `local-development.md`
- `deployment.md`
- `../04-api/llm-api.md`
