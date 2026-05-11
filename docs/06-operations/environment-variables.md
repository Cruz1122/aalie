# Variables de entorno

**Tipo:** normativa

## Propósito

Centralizar las variables de entorno del sistema y clasificar cuales son obligatorias, opcionales o deprecated.

## Alcance

Cubre frontend, BFF LLM y backend API.

## Fuente de verdad

- `apps/api/app/core/config.py`
- `apps/api/app/modules/llm/config.py`
- `apps/api/app/modules/export/asset_registry.py`
- `apps/web/src/app/api/`
- `apps/web/.env.example`
- `apps/api/.env.example`

## Estructura

### Frontend / BFF

| Variable | Uso | Tipo |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | URL pública para consumo cliente | opcional |
| `API_BASE_URL` | URL base del backend para rutas Next | opcional |
| `API_INTERNAL_BASE_URL` | URL interna backend en SSR/Docker | opcional |
| `DOCKER` | activa fallback `http://api:8000` | opcional |
| `NODE_ENV` | comportamiento de build/debug del frontend | opcional |
| `NEXT_PUBLIC_USE_DETERMINISTIC_DIAGRAMS` | flag frontend para diagramas deterministas | opcional |
| `AALIE_USE_LATEX_ONLINE` | flag local heredada; hoy debe tratarse como deprecated hasta que exista consumo real en código | deprecated |

### API backend

| Variable | Uso | Tipo |
| --- | --- | --- |
| `CORS_ENABLED` | habilita CORS global | opcional |
| `CORS_ALLOWED_ORIGINS` | origins permitidos | opcional |
| `DEV_CORS_ENABLED` | compatibilidad dev | deprecated-compatible |
| `DEV_ALLOWED_ORIGINS` | compatibilidad dev | deprecated-compatible |
| `API_KEY` | API key del servidor para LLM; prioridad sobre la key enviada por cliente | opcional |
| `GEMINI_ENDPOINT_BASE` | endpoint base del proveedor Gemini | opcional |
| `LLM_MODEL_CLASSIFY` | modelo para clasificación asistida por LLM (si aplica) | opcional |
| `LLM_MODEL_PARSER_ASSIST` | modelo por job | opcional |
| `LLM_MODEL_GENERAL` | modelo por job | opcional |
| `LLM_MODEL_REPAIR` | modelo por job | opcional |
| `LLM_MODEL_COMPARE` | modelo por job | opcional |
| `LLM_MODEL_RECURSION_DIAGRAM` | modelo para generación/soporte de diagramas recursivos | opcional |
| `LLM_MODEL_GENERATE_DIAGRAM` | modelo para generación de diagramas | opcional |
| `AALIE_EXPORTER_ASSETS_DIR` | override de assets LaTeX | opcional |

## Ejemplos

- en Docker web usa `API_INTERNAL_BASE_URL=http://api:8000`;
- para soporte LLM servidor se configura `API_KEY` en `apps/api`;
- el asistente embebido se habilita solo si existe `API_KEY` válida en servidor o API key válida almacenada localmente por el usuario;
- con `API_KEY` válida en backend, el navegador no necesita reenviar key en cada request.

## Comportamiento del asistente embebido

- superficies: `/analyzer`, `/examples`, `/user-guide`;
- activación: `getApiKeyStatus().hasAny === true`;
- sin key válida: no se renderiza launcher ni iframe;
- con key válida: se muestra launcher flotante y el iframe interno comparte UI con el chatbot base;
- el contexto se sincroniza por `postMessage` mismo-origen y cambia en vivo con la vista actual;
- el historial embebido persiste entre navegación y es independiente del chatbot de home.

## Limites conocidos

- `DEV_*` se mantienen por compatibilidad, pero la configuración preferida es `CORS_*`.
- algunas variables solo aplican al BFF/server-side y no al navegador.
- la lista canónica de variables LLM para despliegue debe mantenerse sincronizada con `apps/api/.env.example`.

## Archivos relacionados

- `local-development.md`
- `deployment.md`
- `../04-api/llm-api.md`
