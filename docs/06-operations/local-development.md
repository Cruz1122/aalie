# Desarrollo local

**Tipo:** guía
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `package.json`, `apps/web/package.json`, `apps/api/pyproject.toml`, `infra/docker-compose.yml`, `README.md`
**Última revisión:** 2026-08-19
**Relacionado con informe técnico:** environment-variables, deployment, troubleshooting

## Requisitos

| Herramienta | Versión | Nota |
|---|---|---|
| Node.js | `>=20 <23` | Engines lock en root package.json |
| pnpm | `9.15.0` | Package manager del monorepo; `corepack enable` recomendado |
| Python | `3.11+` | Usado por backend API y scripts de validación |
| Java | `>=8` | Solo necesario para regenerar parser ANTLR (codegen), no para ejecutar |
| pdflatex | — | Opcional para export PDF en local |

## Instalación

```bash
# Dependencias Node (frontend + packages)
pnpm install

# Dependencias Python (backend API)
cd apps/api
pip install -r requirements.txt
pip install -r requirements-dev.txt   # solo para desarrollo/tests
```

### Grammar package (Python)

El backend necesita el parser ANTLR de Python. Instalarlo en modo editable:

```bash
pip install -e packages/grammar/py
```

Si falta, `import aanlie_parser` falla y todos los tests de parse/análisis se rompen.

## Backend

```bash
cd apps/api
python -m uvicorn app.main:app --reload --port 8000
```

Servicio disponible en `http://localhost:8000`.

- Healthcheck: `GET /health` → `{"status": "ok", "version": "..."}`
- Documentación interactiva: `GET /docs`

### Lint del backend (local, sin Docker)

```bash
pnpm lint:api:local
# Equivale a: cd apps/api && python -m ruff check app
```

## Frontend

```bash
cd apps/web
pnpm dev
```

Interfaz disponible en `http://localhost:3000`.

### Lint del frontend

```bash
pnpm lint:web
# Equivale a: pnpm -C apps/web lint
```

## Codegen

### Regenerar parser TypeScript

```bash
pnpm --filter @aa/grammar build
```

### Regenerar parser Python

```bash
pnpm --filter @aa/grammar gen:py
```

Java es necesario solo para este paso. Los artefactos generados ya están commiteados; en condiciones normales no es necesario regenerarlos.

## Docker

```bash
cd infra
docker compose up --build
```

Esto levanta:

| Servicio | Puerto | Container name |
|---|---|---|
| API (FastAPI + uvicorn) | `8000` | `algoritmos-api` |
| Web (Next.js dev) | `3000` | `algoritmos-web` |
| PostgreSQL 18.6 | solo red Compose (`5432`) | `algoritmos-postgres` |

**Variables de entorno** en Docker:

| Servicio | Variable | Valor |
|---|---|---|
| web | `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000` |
| web | `API_INTERNAL_BASE_URL` | `http://api:8000` |
| api (implícito) | `DEV_CORS_ENABLED` | `1` |
| api (implícito) | `DEV_ALLOWED_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` |

La web depende de `api`, por lo que Docker Compose garantiza el orden de inicio.

El servicio PostgreSQL usa el volumen nombrado `postgres-dev-data` y no publica `5432` al host. Tras iniciar el stack, aplicar la baseline vacía una vez:

```bash
docker compose exec api alembic upgrade head
```

La URL de la API usa `postgresql+psycopg://`; la web usa `postgresql://`. No hay tablas de negocio en esta microfase.

### Volúmenes

- `algoritmos-api`: monta `apps/api` y `packages/` para hot-reload
- `algoritmos-web`: monta `apps/web` y `packages/` para hot-reload; usa volúmenes anónimos para `node_modules` a fin de no pisarlos con el bind mount

## Tests

```bash
# Todos los tests de la API
pnpm test:api

# PR gate (unit + component + system, con cobertura ≥ 70%)
pnpm test:api:cov

# Solo unitarias
pnpm test:api:unit

# Solo contract
pnpm test:api:contract

# Solo while_domain
pnpm test:api:while

# Stress
pnpm test:api:stress

# Docs contracts
pnpm test:docs-contracts

# Quiz bank validation
python apps/api/scripts/validate_quiz_bank.py

# Quiz bank coverage (con gate crítico)
python apps/api/scripts/report_quiz_bank_coverage.py --fail-on-critical
```

## Quick troubleshooting

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Port 8000 already in use` | Otro proceso en el puerto | `netstat -ano \| findstr :8000` y matar proceso, o cambiar puerto |
| `import aanlie_parser` fails | Grammar package no instalado | `pip install -e packages/grammar/py` |
| `pnpm --filter @aa/grammar build` not found | Grammar package no construido | `pnpm -C packages/grammar build` |
| `Module not found: @aa/types` | Paquete types no construido | `pnpm -C packages/types build` |
| `pdflatex: command not found` | TeX no instalado | Instalar MiKTeX / TeX Live / texlive-core |
| `CORS` bloquea requests | CORS no configurado | Ver `environment-variables.md` sección CORS |
| Frontend sin conexión a API | URL equivocada o backend apagado | Verificar `NEXT_PUBLIC_API_BASE_URL` y que uvicorn esté corriendo |

## Límites conocidos

- Si falta el paquete Python de grammar, parse y tests del backend fallan.
- `infra/docker-compose.yml` está orientado a desarrollo; el mismo Dockerfile contiene un runner standalone productivo usado por `infra/docker-compose.prod.yml` y `infra/oci/compose.yml`.
- `validate:content-catalog` no existe como script npm; la validación de contenido se hace mediante `test:docs-contracts` y los scripts Python del banco de quizzes.

## Archivos relacionados

- `environment-variables.md`
- `deployment.md`
- `troubleshooting.md`
- `release-checklist.md`
- `production-oci.md`
