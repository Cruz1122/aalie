# Variables de entorno

**Tipo:** guía
**Estado:** final
**Audiencia:** dev | operador
**Fuente de verdad:** `apps/api/app/core/config.py`, `apps/api/.env.example`, `apps/web/.env.example`, `apps/web/src/app/api/`
**Última revisión:** 2026-05-18
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

## Comportamiento del asistente embebido

- **Superficies:** `/analyzer`, `/examples`, `/user-guide`
- **Activación:** `getApiKeyStatus().hasAny === true`
- **Sin key válida:** no se renderiza launcher ni iframe
- **Con key válida:** launcher flotante visible, iframe interno comparte UI con chatbot base
- **Contexto:** se sincroniza por `postMessage` mismo-origen y cambia con la vista actual
- **Historial:** persiste entre navegación y es independiente del chatbot de home

## Jerarquía de resolución de URLs

El frontend y BFF resuelven la URL del backend en este orden:

1. Si `DOCKER` está definido → usa `API_INTERNAL_BASE_URL` (default `http://api:8000`)
2. Si no Docker → usa `API_BASE_URL` (default `http://localhost:8000`)
3. El cliente directo siempre usa `NEXT_PUBLIC_API_BASE_URL`

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
- `../../04-api/llm-api.md`
