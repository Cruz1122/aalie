# Despliegue

**Tipo:** guía
**Estado:** final
**Audiencia:** dev | operador
**Fuente de verdad:** `apps/api/Dockerfile`, `apps/web/Dockerfile`, `infra/docker-compose.yml`, `apps/api/app/core/config.py`
**Última revisión:** 2026-05-18
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

### 3. Producción compatible

AALIE no tiene un pipeline de publicación externa automatizada. El despliegue en producción requiere configuración manual basada en los principios descritos aquí.

#### CORS para producción

```bash
# Producción
CORS_ENABLED=true
CORS_ALLOWED_ORIGINS=https://mi-dominio.com,https://otro-dominio.com
```

No usar `*` en producción si hay múltiples orígenes; restringir a la lista exacta.

#### Healthcheck

El backend expone `GET /health`. Respuesta esperada:

```json
{
  "status": "ok",
  "version": "1.9.0"
}
```

El frontend expone `GET /api/health` como proxy del backend.

#### Export PDF

Si se necesita export PDF, el runtime del backend debe incluir:

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
- **Frontend estático:** Next.js genera build estático; puede servirse desde cualquier CDN o servidor web.

#### Puertos

| Servicio | Puerto por defecto |
|---|---|
| API (uvicorn) | `8000` |
| Web (Next.js) | `3000` |

Configurables via `--port` en uvicorn o Next.js.

## Límites conocidos

- La imagen Docker de web está orientada a desarrollo (hot-reload, dev server). Si se endurece para producción, esta documentación debe actualizarse junto con el Dockerfile.
- No existe pipeline CI/CD automatizado más allá de GitHub Actions para PR validation.
- El export PDF depende de la toolchain TeX; en entornos sin `pdflatex` el formato no está disponible.

## Archivos relacionados

- `local-development.md`
- `environment-variables.md`
- `troubleshooting.md`
- `release-checklist.md`
- `../../03-specs/export-engine-spec.md`
