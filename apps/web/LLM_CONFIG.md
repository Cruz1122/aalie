# Configuración LLM para Despliegue

## Estado actual de arquitectura

El frontend no configura ni llama proveedores LLM directamente.

- `apps/web` solo consume `/api/llm` y `/api/llm/status` como proxy interno.
- La configuración LLM vive en `apps/api/.env`.

## Variables vigentes (backend)

Definir en `apps/api/.env` o en variables del entorno del contenedor/servidor:

```env
# API key del servidor para LLM (preferida sobre key enviada por cliente)
API_KEY=

# Endpoint base para Gemini
GEMINI_ENDPOINT_BASE=https://generativelanguage.googleapis.com/v1beta/models

# Modelos por job
LLM_MODEL_CLASSIFY=
LLM_MODEL_PARSER_ASSIST=
LLM_MODEL_GENERAL=
LLM_MODEL_REPAIR=
LLM_MODEL_COMPARE=
LLM_MODEL_RECURSION_DIAGRAM=
LLM_MODEL_GENERATE_DIAGRAM=
```

## Docker / Deploy

Cuando cambies variables de entorno LLM, recrea al menos el servicio `api`:

```bash
docker compose up -d --force-recreate api
```

Si también cambiaste build/dependencias:

```bash
docker compose up -d --build api web
```

## Verificación post-deploy

```bash
curl http://localhost:3000/api/llm/status
```

Revisa en la respuesta:

- `status.apiKey.serverAvailable`
- `status.jobs`

Con `serverAvailable=true`, el frontend puede usar LLM sin key en `localStorage`.
