# Panorama de endpoints

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/main.py`, `apps/api/app/modules/*/router.py`, `apps/web/src/app/api/*/route.ts`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** secciones 4.1, 4.2, 4.3

## Propósito

Dar un mapa único de todos los endpoints relevantes del sistema y señalar qué contratos viven en backend, cuáles en el BFF/frontend, y cuáles se exponen en ambas capas.

## Alcance

Cubre FastAPI (backend) y rutas Next `/api/*` (BFF) consumidas por la UI. No cubre rutas de página de Next App Router.

## Fuente de verdad

- `apps/api/app/main.py` — registro de routers
- `apps/api/app/modules/*/router.py` — decoradores de cada módulo
- `apps/web/src/app/api/*/route.ts` — proxies BFF

## Mapa de capas

| Capa | Método | Path | Consumidor | Fuente de verdad | Doc detalle |
|------|--------|------|------------|------------------|-------------|
| Backend | GET | `/health` | Healthchecks, BFF | `apps/api/app/main.py:47` | — |
| Backend | POST | `/grammar/parse` | BFF, cliente directo | `apps/api/app/modules/parsing/router.py:17` | `parse-api.md` |
| Backend + BFF | POST | `/classify` | BFF `llm/classify` | `apps/api/app/modules/classification/router.py:16` | `classification-api.md` |
| Backend + BFF | POST | `/analyze/open` | BFF, cliente directo | `apps/api/app/modules/analysis/router.py:18` | `analysis-api.md` |
| Backend + BFF | POST | `/analyze/detect-methods` | BFF, cliente directo | `apps/api/app/modules/analysis/router.py:55` | `analysis-api.md` |
| Backend + BFF | POST | `/analyze/trace` | BFF, TraceDedicatedView | `apps/api/app/modules/analysis/router.py:74` | `execution-api.md` |
| Backend | POST | `/export/report` | Cliente directo | `apps/api/app/modules/export/router.py:22` | `execution-api.md` |
| Backend + BFF | POST | `/llm` | BFF `api/llm` | `apps/api/app/modules/llm/router.py:14` | `llm-api.md` |
| Backend + BFF | GET | `/llm/status` | BFF `api/llm/status` | `apps/api/app/modules/llm/router.py:21` | `llm-api.md` |
| BFF | POST | `/api/llm/classify` | UI | `apps/web/src/app/api/llm/classify/route.ts` | `classification-api.md` |
| Backend + BFF | GET | `/quizzes/health` | — | `apps/api/app/modules/quizzes/router.py:13` | `quizzes-api.md` |
| Backend + BFF | GET | `/quizzes/taxonomy` | BFF `api/quizzes/taxonomy` | `apps/api/app/modules/quizzes/router.py:18` | `quizzes-api.md` |
| Backend + BFF | GET | `/quizzes/dataset/summary` | BFF `api/quizzes/summary` | `apps/api/app/modules/quizzes/router.py:23` | `quizzes-api.md` |
| Backend | POST | `/quizzes/validate` | CLI/scripts | `apps/api/app/modules/quizzes/router.py:28` | `quizzes-api.md` |
| Backend + BFF | POST | `/quizzes/attempts` | BFF `api/quizzes/session` | `apps/api/app/modules/quizzes/router.py:38` | `quizzes-api.md` |
| Backend + BFF | POST | `/quizzes/attempts/evaluate` | BFF `api/quizzes/evaluate` | `apps/api/app/modules/quizzes/router.py:46` | `quizzes-api.md` |
| Backend | POST | `/quizzes/session` | Legacy alias → attempts | `apps/api/app/modules/quizzes/router.py:55` | `quizzes-api.md` |
| Backend | POST | `/quizzes/evaluate` | Legacy alias → attempts/evaluate | `apps/api/app/modules/quizzes/router.py:60` | `quizzes-api.md` |

### Backend FastAPI — tabla completa

| Path | Method | Propósito | Router |
|------|--------|-----------|--------|
| `/health` | `GET` | Healthcheck | `main.py` |
| `/grammar/parse` | `POST` | Parseo de pseudocódigo a AST | `parsing/router.py` |
| `/classify` | `POST` | Clasificación del algoritmo por AST | `classification/router.py` |
| `/analyze/open` | `POST` | Análisis principal de complejidad | `analysis/router.py` |
| `/analyze/detect-methods` | `POST` | Detección de métodos recursivos aplicables | `analysis/router.py` |
| `/analyze/trace` | `POST` | Trace de ejecución paso a paso | `analysis/router.py` |
| `/export/report` | `POST` | Export institucional (Markdown/PDF/ZIP) | `export/router.py` |
| `/llm` | `POST` | Jobs LLM (general, repair, compare, explain, parser_assist) | `llm/router.py` |
| `/llm/status` | `GET` | Estado y configuración del subsistema LLM | `llm/router.py` |
| `/quizzes/health` | `GET` | Estado del módulo de quizzes | `quizzes/router.py` |
| `/quizzes/taxonomy` | `GET` | Taxonomía del banco de preguntas | `quizzes/router.py` |
| `/quizzes/dataset/summary` | `GET` | Resumen estadístico del dataset | `quizzes/router.py` |
| `/quizzes/validate` | `POST` | Validar integridad del dataset | `quizzes/router.py` |
| `/quizzes/attempts` | `POST` | Crear sesión/intento de quiz | `quizzes/router.py` |
| `/quizzes/attempts/evaluate` | `POST` | Evaluar respuestas de quiz | `quizzes/router.py` |
| `/quizzes/session` | `POST` | Alias legacy → `/quizzes/attempts` | `quizzes/router.py` |
| `/quizzes/evaluate` | `POST` | Alias legacy → `/quizzes/attempts/evaluate` | `quizzes/router.py` |

### BFF / Next — tabla completa

| Path | Method | Propósito | Proxy a backend |
|------|--------|-----------|-----------------|
| `/api/health` | `GET` | Healthcheck del backend | `GET /health` |
| `/api/grammar/parse` | `POST` | Proxy de parseo | `POST /grammar/parse` |
| `/api/analyze/open` | `POST` | Proxy de análisis | `POST /analyze/open` |
| `/api/analyze/detect-methods` | `POST` | Proxy de detección de métodos | `POST /analyze/detect-methods` |
| `/api/analyze/trace` | `POST` | Proxy de trace | `POST /analyze/trace` |
| `/api/llm` | `POST` | Proxy de jobs LLM | `POST /llm` |
| `/api/llm/status` | `GET` | Estado/configuración LLM | `GET /llm/status` |
| `/api/llm/classify` | `POST` | Clasificación consumida por frontend (usa backend `/classify`) | `POST /classify` |
| `/api/quizzes/session` | `POST` | Proxy de inicio de quiz | `POST /quizzes/attempts` |
| `/api/quizzes/evaluate` | `POST` | Proxy de evaluación | `POST /quizzes/attempts/evaluate` |
| `/api/quizzes/summary` | `GET` | Resumen del banco | `GET /quizzes/dataset/summary` |
| `/api/quizzes/taxonomy` | `GET` | Taxonomía del banco | `GET /quizzes/taxonomy` |

## Relaciones capa a capa

| Patrón | Ejemplos |
|--------|----------|
| **Backend-only** (sin BFF) | `/health`, `/export/report`, `/quizzes/validate`, `/quizzes/session`, `/quizzes/evaluate` |
| **Backend + BFF proxy** | `/grammar/parse`, `/analyze/open`, `/analyze/detect-methods`, `/analyze/trace`, `/llm`, `/llm/status`, `/quizzes/attempts`, `/quizzes/attempts/evaluate`, `/quizzes/taxonomy`, `/quizzes/dataset/summary` |
| **BFF-only** (consumo frontend) | `/api/llm/classify` (usa backend `/classify` internamente) |

## Variables de entorno relevantes para API

| Variable | Capa | Uso |
|----------|------|-----|
| `NEXT_PUBLIC_API_BASE_URL` | Web | URL pública del backend para consumo cliente directo |
| `API_BASE_URL` | BFF | URL base del backend para proxies Next |
| `API_INTERNAL_BASE_URL` | BFF/Docker | URL interna del backend (prioritaria sobre `API_BASE_URL`) |
| `DOCKER` | BFF | Flag para entorno Docker (cambia resolución de host) |
| `NODE_ENV` | Web | Entorno Node (development/production/test) |
| `NEXT_PUBLIC_USE_DETERMINISTIC_DIAGRAMS` | Web | Fuerza diagramas deterministas sin LLM |
| `AALIE_USE_LATEX_ONLINE` | API export | Usa servicio LaTeX online en vez de `pdflatex` local |
| `CORS_ENABLED` | API | Habilita/deshabilita CORS |
| `CORS_ALLOWED_ORIGINS` | API | Orígenes permitidos (comma-separated) |
| `DEV_CORS_ENABLED` | API | CORS en desarrollo (default true) |
| `DEV_ALLOWED_ORIGINS` | API | Orígenes en desarrollo |
| `API_KEY` | Backend LLM | API key del proveedor (server-side, preferida sobre client key) |
| `GEMINI_ENDPOINT_BASE` | Backend LLM | Endpoint base del proveedor Gemini |
| `LLM_MODEL_CLASSIFY` | Backend LLM | Modelo para clasificación |
| `LLM_MODEL_PARSER_ASSIST` | Backend LLM | Modelo para asistencia de parseo |
| `LLM_MODEL_GENERAL` | Backend LLM | Modelo general |
| `LLM_MODEL_REPAIR` | Backend LLM | Modelo de reparación |
| `LLM_MODEL_COMPARE` | Backend LLM | Modelo de comparación |
| `LLM_MODEL_RECURSION_DIAGRAM` | Backend LLM | Modelo para diagramas de recursión |
| `LLM_MODEL_GENERATE_DIAGRAM` | Backend LLM | Modelo para generación de diagramas |
| `AALIE_EXPORTER_ASSETS_DIR` | API export | Override de directorio de assets LaTeX |

## Ejemplos

- Un cambio en `/analyze/open` impacta backend y también el proxy `/api/analyze/open`.
- Un cambio en un job LLM impacta `/llm` (backend) y `/api/llm` (BFF), más `status`.
- Un cambio en quizzes impacta 6 endpoints backend + 4 BFF.

## Límites conocidos

- Los proxies de Next no redefinen el contrato funcional del backend; lo transportan o lo adaptan mínimamente.
- `/quizzes/session` y `/quizzes/evaluate` son alias legacy que delegan en `/quizzes/attempts` y `/quizzes/attempts/evaluate` respectivamente.
- El BFF `/api/llm/classify` no es un proxy directo: contiene lógica propia (clasificación forzada por AST, rechazo de `mode="llm"`).

## Archivos relacionados

- `parse-api.md`
- `analysis-api.md`
- `execution-api.md`
- `llm-api.md`
- `quizzes-api.md`
- `classification-api.md`
- `schemas/`
