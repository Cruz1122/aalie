# Panorama de endpoints

**Tipo:** normativa

## Propósito

Dar un mapa único de todos los endpoints relevantes del sistema y señalar qué contratos viven en backend y cuáles en el BFF/frontend.

## Alcance

Cubre FastAPI y rutas Next `/api/*` consumidas por la UI.

## Fuente de verdad

- routers de `apps/api/app/modules/`
- rutas de `apps/web/src/app/api/`

## Estructura

### Backend FastAPI

| Path | Method | Propósito |
| --- | --- | --- |
| `/health` | `GET` | healthcheck |
| `/grammar/parse` | `POST` | parseo a AST |
| `/classify` | `POST` | clasificación por AST |
| `/analyze/open` | `POST` | análisis principal |
| `/analyze/detect-methods` | `POST` | métodos aplicables recursivos |
| `/analyze/trace` | `POST` | trace de ejecución |
| `/export/report` | `POST` | export institucional |

### BFF / Next

| Path | Method | Propósito |
| --- | --- | --- |
| `/api/grammar/parse` | `POST` | proxy a parse |
| `/api/analyze/open` | `POST` | proxy a análisis |
| `/api/analyze/detect-methods` | `POST` | proxy a métodos |
| `/api/analyze/trace` | `POST` | proxy a trace |
| `/api/health` | `GET` | proxy a health |
| `/api/llm` | `POST` | jobs Gemini |
| `/api/llm/status` | `GET` | estado/config LLM |
| `/api/llm/classify` | `POST` | clasificación consumida por frontend |

## Ejemplos

- Un cambio en `/analyze/open` impacta backend y también el proxy `/api/analyze/open`.
- Un cambio en un job LLM impacta `/api/llm` y `status`, no FastAPI.

## Limites conocidos

- Los proxies de Next no redefinen el contrato funcional del backend; lo transportan o lo adaptan mínimamente.

## Archivos relacionados

- `parse-api.md`
- `analysis-api.md`
- `execution-api.md`
- `llm-api.md`
