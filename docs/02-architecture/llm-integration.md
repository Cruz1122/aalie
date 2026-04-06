# Integración LLM

**Tipo:** descriptiva

## Propósito

Documentar dónde entra el LLM en AALIE y dejar claro que es un subsistema auxiliar, no contractual.

## Alcance

Cubre configuración, jobs, rutas BFF y dependencias de entorno del frontend.

## Fuente de verdad

- `apps/web/src/app/api/llm/`
- `apps/web/src/hooks/useApiKey.ts`
- `apps/web/src/components/ChatBot.tsx`
- `apps/web/src/components/assistant/EmbeddedAssistantLauncher.tsx`
- `apps/web/src/app/[locale]/assistant-frame/page.tsx`
- `apps/web/src/lib/assistant/`

## Estructura

### Punto de integración

El LLM vive en el frontend/BFF de Next, no en la API FastAPI. Las rutas `/api/llm/*`:

- seleccionan modelo y prompt;
- resuelven API key;
- llaman al proveedor Gemini;
- devuelven payloads para chat, repair y compare.

El asistente embebido vive como una composición frontend:

- launcher flotante en la página host;
- `iframe` interno mismo-origen para aislar shell e historial;
- sincronización de contexto host -> frame por `postMessage`;
- serialización determinista del contexto en `/api/llm`.

### Jobs actuales

- `parser_assist`
- `general`
- `repair`
- `compare`
- `explain`

### Reglas de producto

- parse, classify, analyze, trace y export base no dependen del LLM;
- si no hay API key, el flujo principal sigue disponible;
- el asistente embebido es opcional y complementario; no reemplaza el análisis formal;
- si hay panel o modal en foco, esa vista manda sobre el resto del contexto al responder preguntas ambiguas;
- el contrato del proveedor puede cambiar y por eso la respuesta LLM no se usa como contrato canónico del sistema.

### Configuración

- endpoint configurable por `GEMINI_ENDPOINT_BASE`;
- modelos por job configurables por `LLM_MODEL_*`;
- disponibilidad de API key por `API_KEY` del servidor o `NEXT_PUBLIC_API_KEY`/localStorage del cliente.

### Contexto estructurado del asistente

`POST /api/llm` acepta `assistantContext` opcional. Ese contexto hoy cubre:

- superficie (`home`, `analyzer`, `examples`, `user-guide`);
- metadatos de página;
- resumen formal visible;
- código fuente visible;
- ejemplo o sección de guía en foco;
- panel o modal en foco;
- funcionalidades relevantes de la app.

En `analyzer`, el contexto puede incluir además detalles curados de:

- procedimientos por línea o general;
- loop invariant;
- GPU/CPU;
- comparación con LLM;
- modales recursivos;
- seguimiento de ejecución, con resumen curado de diagrama, parámetros visibles y paso activo.

## Ejemplos

- `repair` corrige pseudocódigo con errores de sintaxis.
- `compare` contrasta el análisis determinista con una lectura LLM del mismo algoritmo.
- `general` alimenta tanto el chatbot de home como el asistente embebido, pero este último añade `assistantContext`.

## Limites conocidos

- Cuotas, errores del proveedor y cambios de modelo son externos al backend determinista.
- Los contratos de salida del proveedor deben normalizarse antes de usarse en UI o export.

## Archivos relacionados

- `frontend-architecture.md`
- `../04-api/llm-api.md`
- `../06-operations/environment-variables.md`
