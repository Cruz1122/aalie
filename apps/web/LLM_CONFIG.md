# Configuración de LLM para Despliegue

## Variables de Entorno

Definir en `apps/web/.env` (desarrollo) o en variables del entorno del contenedor/servidor (deploy):

```env
# Endpoint base del proveedor Gemini
GEMINI_ENDPOINT_BASE=https://generativelanguage.googleapis.com/v1beta/models

# Modelos por job
LLM_MODEL_CLASSIFY=gemini-2.0-flash-lite
LLM_MODEL_PARSER_ASSIST=gemini-2.5-flash
LLM_MODEL_GENERAL=gemini-2.5-flash
LLM_MODEL_SIMPLIFIER=gemini-2.5-flash
LLM_MODEL_REPAIR=gemini-2.5-flash
LLM_MODEL_COMPARE=gemini-2.5-pro
LLM_MODEL_RECURSION_DIAGRAM=gemini-2.0-flash
LLM_MODEL_GENERATE_DIAGRAM=gemini-2.0-flash

# API key opcional del servidor Next.js para /api/llm/*
API_KEY=
```

## Comportamiento ante variables faltantes

- La configuración lee primero `process.env`.
- Si falta una variable de modelo o endpoint, se usa un valor por defecto centralizado en `src/app/api/llm/llm-defaults.ts`.
- Esto evita que el sistema crashee por env incompleto.

## Docker / Deploy

### Aplicar cambios en variables

Cuando cambies variables de entorno, recrea el servicio web:

```bash
docker compose up -d --force-recreate web
```

Si también cambiaste `Dockerfile` o dependencias:

```bash
docker compose up -d --build web
```

## Verificación post-deploy

Valida modelos y endpoint activos en runtime:

```bash
curl http://localhost:3000/api/llm/status
```

Revisa en la respuesta:

- `status.config.endpoint`
- `status.jobs.classify`
- `status.jobs.parser_assist`
- `status.jobs.general`

Si esos valores coinciden con tu configuración esperada, el despliegue tomó correctamente las nuevas variables.
