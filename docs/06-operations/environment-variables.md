# Variables de entorno

**Tipo:** guía
**Estado:** final
**Audiencia:** dev | operador
**Fuente de verdad:** `apps/api/app/core/config.py`, `apps/api/.env.example`, `apps/web/.env.example`, `apps/web/src/app/api/`, `apps/web/Dockerfile`, `infra/oci/compose.yml`
**Última revisión:** 2026-08-19
**Relacionado con informe técnico:** local-development, deployment, troubleshooting

## Propósito

Centralizar todas las variables de entorno del sistema, clasificar cuáles son obligatorias, opcionales o deprecated, y documentar su impacto en cada capa.

## Alcance

Cubre frontend (Next.js), BFF (server-side proxies), backend API (FastAPI), y configuración LLM/exportación.

## Estructura

### Frontend / BFF

| Variable | Capa | Obligatoria | Default | Uso | Riesgo | Fuente |
|---|---|---|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Web | No | `http://localhost:8000` | URL pública del backend para consumo cliente directo | URL incorrecta = frontend sin conexión a API | `.env.example` |
| `API_BASE_URL` | BFF | No | `http://localhost:8000` | URL base del backend para proxies Next.js (SSR) | URL incorrecta = proxies BFF rotos | código (`apps/web/src/app/api/`) |
| `API_INTERNAL_BASE_URL` | BFF/Docker | No | `http://api:8000` | URL interna del backend usada en SSR dentro de Docker | En Docker sin esta var, las llamadas SSR apuntan a localhost en vez de al contenedor api | código |
| `DOCKER` | Both | No | — | Flag de entorno Docker; cuando está presente activa resolución `http://api:8000` | Ausente en Docker = resuelve contra localhost, no contra el servicio api | código |
| `NODE_ENV` | Web | No | `development` | Entorno de ejecución Node.js | — | Next.js |
| `HOSTNAME` | Web runtime | No | `0.0.0.0` en imagen productiva | Dirección de escucha de Next standalone | Otro valor puede impedir acceso desde Caddy/contenedor | `apps/web/Dockerfile` |
| `PORT` | Web runtime | No | `3000` en imagen productiva | Puerto interno de Next standalone | Debe coincidir con healthcheck y upstream Caddy | `apps/web/Dockerfile` |
| `NEXT_PUBLIC_USE_DETERMINISTIC_DIAGRAMS` | Web | No | `false` | Fuerza diagramas deterministas sin LLM en frontend | Si es `true`, los diagramas LLM se deshabilitan | `.env.example` |
| `AALIE_USE_LATEX_ONLINE` | Web/API | No | `false` | Flag heredada para compilación LaTeX online; hoy sin consumo real en código | Deprecated; si se requiere en futuro debe auditarse el código | código |

### API backend — CORS

| Variable | Capa | Obligatoria | Default | Uso | Riesgo | Fuente |
|---|---|---|---|---|---|---|
| `CORS_ENABLED` | API | No | `true` (falls back a DEV_CORS_ENABLED) | Habilita middleware CORS global | Si es `false`, peticiones cross-origin son bloqueadas | `config.py` |
| `CORS_ALLOWED_ORIGINS` | API | No | `*` (o fallback a DEV_ALLOWED_ORIGINS → defaults locales) | Lista de orígenes permitidos separada por comas | Demasiado permisivo (`*`) en producción expone a riesgo de seguridad | `config.py` |
| `DEV_CORS_ENABLED` | API | No | `true` | Compatibilidad dev; CORS_ENABLED tiene prioridad | — | `config.py` |
| `DEV_ALLOWED_ORIGINS` | API | No | `http://localhost:3000,http://127.0.0.1:3000` | Compatibilidad dev; CORS_ALLOWED_ORIGINS tiene prioridad | — | `config.py` |

### API backend — LLM

| Variable | Capa | Obligatoria | Default | Uso | Riesgo | Fuente |
|---|---|---|---|---|---|---|
| `API_KEY` | API LLM | No | — | API key del servidor para proveedor LLM (Gemini). Tiene prioridad sobre key enviada por cliente. | Sin ella, el asistente LLM no se activa en la UI ni el servidor puede hacer jobs LLM | `.env.example` |
| `GEMINI_ENDPOINT_BASE` | API LLM | No | `https://generativelanguage.googleapis.com/v1beta/models` | Endpoint base del proveedor Gemini | URL incorrecta = todas las llamadas LLM fallan | `.env.example` |
| `LLM_MODEL_CLASSIFY` | API LLM | No | — | Modelo para clasificación asistida por LLM | Modelo incorrecto = job de clasificación falla | `.env.example` |
| `LLM_MODEL_PARSER_ASSIST` | API LLM | No | — | Modelo para asistencia al parser | Modelo incorrecto = parser assist falla | `.env.example` |
| `LLM_MODEL_GENERAL` | API LLM | No | — | Modelo para uso general LLM | Modelo incorrecto = job general falla | `.env.example` |
| `LLM_MODEL_REPAIR` | API LLM | No | — | Modelo para reparación de pseudocódigo | Modelo incorrecto = repair job falla | `.env.example` |
| `LLM_MODEL_COMPARE` | API LLM | No | — | Modelo para comparación de resultados | Modelo incorrecto = compare job falla | `.env.example` |
| `LLM_MODEL_RECURSION_DIAGRAM` | API LLM | No | — | Modelo para generación/soporte de diagramas recursivos | Modelo incorrecto = recursion diagram job falla | `.env.example` |
| `LLM_MODEL_GENERATE_DIAGRAM` | API LLM | No | — | Modelo para generación de diagramas | Modelo incorrecto = generate diagram job falla | `.env.example` |

### API backend — Exportación

| Variable | Capa | Obligatoria | Default | Uso | Riesgo | Fuente |
|---|---|---|---|---|---|---|
| `AALIE_EXPORTER_ASSETS_DIR` | API Export | No | — | Override del directorio de assets LaTeX para export PDF | Si no se define, el exportador usa rutas por defecto del proyecto; si apunta a un directorio inexistente, la compilación PDF falla | código (`export/asset_registry.py`) |

### PostgreSQL

| Variable | Capa | Obligatoria | Valor/forma | Uso | Secreto |
|---|---|---|---|---|---|
| `DATABASE_URL` | API | En runtime DB | `postgresql+psycopg://...` | URL SQLAlchemy/psycopg usada por FastAPI y Alembic | Sí |
| `DATABASE_URL` | Web server-side | En Better Auth | `postgresql://...` | URL reservada para Better Auth; no se expone al navegador | Sí |
| `POSTGRES_DB` | Compose PostgreSQL | Sí en OCI | `aalie` | Base inicial de la imagen oficial | No |
| `POSTGRES_USER` | Compose PostgreSQL | Sí en OCI | `aalie` | Usuario propietario de esta microfase | Sí |
| `POSTGRES_PASSWORD` | Compose PostgreSQL | Sí en OCI | Secreto hexadecimal generado en el servidor | Sí |
| `API_DATABASE_URL` | Compose host | Sí en OCI | URL con `postgresql+psycopg` y host `postgres` | Se transforma en `DATABASE_URL` del API | Sí |
| `WEB_DATABASE_URL` | Compose host | Sí en OCI | URL con `postgresql` y host `postgres` | Se transforma en `DATABASE_URL` de web | Sí |

### Deployment OCI

| Variable | Capa | Obligatoria | Valor/forma | Uso | Secreto |
|---|---|---|---|---|---|
| `AALIE_TAG` | Compose OCI | Sí | Git SHA lowercase de 40 caracteres | Selecciona las imágenes API y web inmutables; vive en `/home/ubuntu/aalie/.env` | No |
| `NODE_ENV` | Web OCI | Sí | `production` | Habilita runtime productivo Next.js | No |
| `HOSTNAME` | Web OCI | Sí | `0.0.0.0` | Escucha en todas las interfaces del contenedor | No |
| `PORT` | Web OCI | Sí | `3000` | Puerto privado del servidor standalone | No |
| `API_INTERNAL_BASE_URL` | BFF OCI | Sí | `http://api:8000` | Comunicación privada web → API en `aalie-internal` | No |

En OCI, `AALIE_TAG` vive en `.env` y las cinco variables PostgreSQL viven en `.env.runtime`, ambos fuera del repositorio. El deploy carga los dos archivos; no se deben combinar en un único archivo que el deploy pueda sobrescribir.

`OCI_SSH_PRIVATE_KEY` y `OCI_SSH_KNOWN_HOSTS` son material operacional de GitHub Actions, no variables runtime de la aplicación. La primera es secreta; la segunda es pinning de confianza. Viven en el Environment `Production – aalie` y no en `.env`. `API_KEY` no se expone al navegador ni se incorpora a imágenes; en OCI solo existiría si el operador habilita explícitamente LLM por un canal de secretos externo al repositorio.

## Comportamiento del asistente embebido

### AutenticaciÃ³n

- `BETTER_AUTH_URL` debe ser `https://aalie.dev` en producciÃ³n y `http://localhost:3000` local; define el callback OAuth.
- `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_SECRET` y las URLs de base de datos son secretos server-side y nunca deben usar el prefijo `NEXT_PUBLIC_`.
- `GOOGLE_CLIENT_ID` se usa server-side aunque no sea secreto; Google debe tener exactamente `/api/auth/callback/google` como redirect URI.
- `AUTH_JWT_ISSUER`, `AUTH_JWT_AUDIENCE` y `AUTH_JWKS_URL` forman el contrato web â†’ FastAPI. JWKS no es una dependencia de `/health/ready`.
- En OCI, las variables de autenticaciÃ³n se agregan a `.env.runtime`, junto con las variables PostgreSQL, y el archivo conserva modo `0600`.

- **Superficies:** `/analyzer`, `/examples`, `/user-guide`
- **Activación:** `getApiKeyStatus().hasAny === true`
- **Sin key válida:** no se renderiza launcher ni iframe
- **Con key válida:** launcher flotante visible, iframe interno comparte UI con chatbot base
- **Contexto:** se sincroniza por `postMessage` mismo-origen y cambia con la vista actual
- **Historial:** persiste entre navegación y es independiente del chatbot de home

## Jerarquía de resolución de URLs

Los Route Handlers BFF resuelven la URL del backend en este orden:

1. `API_INTERNAL_BASE_URL`, si está definida;
2. `API_BASE_URL`, si está definida;
3. fallback `http://api:8000` si `DOCKER` está presente;
4. fallback `http://localhost:8000` fuera de Docker.

El cliente directo, cuando una superficie lo usa, resuelve `NEXT_PUBLIC_API_BASE_URL`. En OCI el flujo contractual pasa por el BFF y el navegador no conoce FastAPI.

## Jerarquía de resolución CORS

1. Si `CORS_ENABLED` está definida → se usa ese valor
2. Si no → se consulta `DEV_CORS_ENABLED`
3. Si ninguno → `true` (CORS habilitado por defecto)

Para orígenes:

1. Si `CORS_ALLOWED_ORIGINS` está definida → se usa
2. Si no → se consulta `DEV_ALLOWED_ORIGINS`
3. Si ninguno → defaults: `["http://localhost:3000", "http://127.0.0.1:3000"]`

## Ejemplos

```bash
# Despliegue Docker con LLM
API_KEY=your-gemini-key docker compose up

# Desarrollo local con CORS personalizado
CORS_ENABLED=true CORS_ALLOWED_ORIGINS="http://localhost:5173" pnpm dev:api

# Frontend apuntando a backend remoto
NEXT_PUBLIC_API_BASE_URL=https://api.example.com pnpm dev
```

## Límites conocidos

- `DEV_*` se mantienen por compatibilidad, pero la configuración preferida es `CORS_*`.
- Algunas variables solo aplican al BFF/server-side y no al navegador.
- La lista canónica de variables LLM debe mantenerse sincronizada con `apps/api/.env.example`.
- `AALIE_USE_LATEX_ONLINE` está marcada como deprecated; no tiene consumo activo en código.

## Archivos relacionados

- `local-development.md`
- `deployment.md`
- `troubleshooting.md`
- `release-checklist.md`
- `production-oci.md`
- `../../04-api/llm-api.md`
