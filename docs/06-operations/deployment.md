# Despliegue

**Tipo:** guía
**Estado:** final
**Audiencia:** dev | operador
**Fuente de verdad:** `apps/api/Dockerfile`, `apps/web/Dockerfile`, `infra/docker-compose.yml`, `infra/docker-compose.prod.yml`, `infra/oci/compose.yml`, `.github/workflows/arm64-validation.yml`
**Última revisión:** 2026-08-19
**Relacionado con informe técnico:** local-development, environment-variables, troubleshooting, release-checklist

## Modos de despliegue

### 1. Desarrollo local (sin Docker)

Backend y frontend se ejecutan por separado:

```bash
# Terminal 1: Backend
cd apps/api
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd apps/web
pnpm dev
```

**Variables necesarias:**

| Variable | Valor típico |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000` |
| `API_BASE_URL` | `http://localhost:8000` |
| `CORS_ENABLED` (o `DEV_CORS_ENABLED`) | `true` |
| `DEV_ALLOWED_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` |

### 2. Docker Compose (full stack)

```bash
cd infra
docker compose up --build
```

Levanta ambos servicios con hot-reload.

**Variables necesarias:**

| Servicio | Variable | Valor |
|---|---|---|
| web | `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000` |
| web | `API_INTERNAL_BASE_URL` | `http://api:8000` |
| web | `NODE_ENV` | `development` |
| api (por defecto) | `DEV_CORS_ENABLED` | `1` |
| api (por defecto) | `DEV_ALLOWED_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` |

Para habilitar LLM en Docker:

```bash
API_KEY=your-gemini-key docker compose up
```

### 3. Integración productiva local

`infra/docker-compose.prod.yml` construye las imágenes de producción, ejecuta Next.js standalone y Uvicorn sin reload, y publica 3000/8000 únicamente para integración y smoke local/CI:

```bash
docker compose -f infra/docker-compose.prod.yml build
docker compose -f infra/docker-compose.prod.yml up -d --wait
python scripts/smoke_prod.py
```

Este archivo no es el deployment OCI.

### 4. Producción OCI

La producción real vive en `aalie.dev` sobre OCI Ampere A1/ARM64. El workflow `.github/workflows/arm64-validation.yml` construye y valida imágenes nativas, las publica en GHCR con el SHA exacto y ejecuta un deploy por SSH restringido. La VM hace pull; no construye.

`infra/oci/compose.yml` mantiene API y web privadas y publica únicamente 80/443 mediante Caddy. La guía canónica de bootstrap, seguridad, secretos, patching, rollback y recuperación es [`production-oci.md`](production-oci.md).

#### CORS para producción

En OCI, FastAPI no es público: el navegador habla same-origin con Next.js y el BFF usa la red Docker privada. Por eso el deployment canónico no habilita CORS ni publica 8000. Solo un hosting alternativo que exponga API deliberadamente debe usar `CORS_ENABLED=true` y una lista exacta en `CORS_ALLOWED_ORIGINS`; nunca `*` en producción.

#### Healthcheck

El backend expone `GET /health/live` y `GET /health/ready`. La readiness valida parser, assets de export, quizzes y `pdflatex`. El BFF expone `GET /api/health/live` para su propio proceso y `GET /api/health` para comprobar el backend privado. Una respuesta base del backend es:

```json
{
  "status": "ok"
}
```

#### Export PDF

La imagen productiva del backend incluye:

- `pdflatex` (TeX Live, MiKTeX, o texlive-core)
- Paquetes LaTeX requeridos por las plantillas del exportador
- Assets LaTeX accesibles (variable `AALIE_EXPORTER_ASSETS_DIR` para override)

Sin `pdflatex`, la exportación PDF falla. Los formatos Markdown y LaTeX siguen funcionando.

#### Sin LLM

La plataforma funciona completamente sin API key. El análisis determinista (parseo, clasificación, análisis, trazas, export) no depende de LLM. Si no hay `API_KEY` configurada:

- El asistente embebido no se renderiza en la UI
- Los jobs LLM devuelven error
- Todo el resto funciona normalmente

#### Hosting

AALIE tiene estas características relevantes para hosting:

- **No requiere base de datos:** el contenido (catálogo, quizzes) vive en archivos JSON versionados dentro del repositorio. No hay migraciones ni esquemas de DB que gestionar.
- **No tiene autenticación de usuarios:** no hay sesiones, login, registro, ni almacenamiento de usuarios. El progreso de quizzes se persiste en `localStorage` del navegador.
- **Contenido file-based:** todo el contenido pedagógico está en `packages/content-data/` dentro del monorepo. Las actualizaciones de contenido requieren un nuevo build/web deploy.
- **API stateless:** FastAPI no mantiene estado entre requests; escalamiento horizontal sencillo.
- **Frontend standalone:** Next.js ejecuta un servidor Node standalone con Route Handlers BFF; no es un sitio puramente estático ni se sirve omitiendo ese runtime.

#### Puertos

| Servicio | Puerto por defecto |
|---|---|
| API (uvicorn) | `8000` |
| Web (Next.js) | `3000` |

Configurables via `--port` en uvicorn o Next.js.

## Límites conocidos

- El deploy productivo depende de disponibilidad de los runners ARM64, GHCR, SSH/DNS y la VM OCI.
- No existe staging equivalente a OCI; el Compose productivo local es el gate previo reproducible.
- El export PDF depende de la toolchain TeX incluida en la imagen API; en runtimes alternativos sin `pdflatex` el formato no está disponible.

## Archivos relacionados

- `local-development.md`
- `environment-variables.md`
- `troubleshooting.md`
- `release-checklist.md`
- `production-oci.md`
- `../../03-specs/export-engine-spec.md`
