# LLM API (@llm)

## Arquitectura y Organización

**El frontend NO llama al proveedor LLM directamente.**

- `/api/llm` y `/api/llm/status` en Next funcionan como proxy interno.
- El backend FastAPI (`/llm`, `/llm/status`) es el unico punto autorizado para ejecutar requests al proveedor.
- Configuracion de provider, modelos, timeouts y API keys vive en `apps/api/app/modules/llm`.
- El frontend conserva soporte opcional para API key en localStorage, pero solo la reenvia al backend cuando no hay `API_KEY` de servidor.

### Archivos principales

- `route.ts`: proxy de `POST /api/llm` -> backend `POST /llm`.
- `status/route.ts`: proxy de `GET /api/llm/status` -> backend `GET /llm/status`.
- `classify/route.ts`: clasificación AST (sin dependencia de proveedor LLM).
- README.md: documentación de integración en capa web.

## ¿Cómo funciona?

### Selección de modelo/job

- La seleccion de modelo/job se resuelve en backend FastAPI.
- `POST /api/llm` mantiene el contrato de entrada (`job`, `prompt`, `chatHistory`, `assistantContext`, `apiKey`) para no romper la UI.
- El proxy no contiene detalles de proveedor ni prompts.

### Consumo de status/modelos activos

- El status de todos los jobs está en una única ruta (proxy web):
  ```
  GET /api/llm/status
  ```
  Devuelve:
  ```json
  {
    "ok": true,
    "status": {
      "timestamp": "2025-11-01T12:00:00.000Z",
      "config": { "...": "info extendida" },
      "jobs": {
        "parser_assist": "gemini-3-flash-preview",
        "general": "gemini-2.5-flash",
        "repair": "gemini-3-flash-preview",
        "compare": "gemini-3-flash-preview"
      }
    }
  }
  ```

### Configuracion

- Variables LLM ahora residen en `apps/api/.env`.
- Variables clave: `API_KEY`, `GEMINI_ENDPOINT_BASE`, `LLM_MODEL_CLASSIFY`, `LLM_MODEL_PARSER_ASSIST`, `LLM_MODEL_GENERAL`, `LLM_MODEL_REPAIR`, `LLM_MODEL_COMPARE`, `LLM_MODEL_RECURSION_DIAGRAM`, `LLM_MODEL_GENERATE_DIAGRAM`.

### ¿Como agregar o modificar un job/modelo?

1. Edita la configuracion en backend (`apps/api/app/modules/llm/config.py`).
2. Si aplica, ajusta orquestacion del proveedor en backend (`service.py` / `providers.py`).
3. Mantén el contrato proxy web estable para no romper frontend.

### Buenas prácticas

- **Nunca** agregues llamadas directas a proveedor LLM en frontend.
- Mantén al backend como unica capa con secretos y politicas de uso.
- Si cambias los modelos o agregas endpoints, solo actualiza la config central y todo quedará sincronizado.
- Haz las pruebas de status para verificar que todo se orquesta desde un solo punto.
- Si cambias variables de entorno en Docker, recrea el servicio para aplicar cambios.

### Ejemplo de consumo desde frontend

```ts
// En React o similar:
fetch("/api/llm/status")
  .then((res) => res.json())
  .then(({ status }) => {
    const modeloParser = status.jobs.parser_assist;
    // Mostrar badge, usar para analytics, etc.
  });
```

### Contexto estructurado del asistente embebido

- Cuando el chat se usa desde el iframe embebido, el frontend envía `assistantContext` con la superficie (`home`, `analyzer`, `examples`, `user-guide`, `course`, `quizzes`, `about`, `privacy`, `terms`), metadatos de la vista y, si aplica, un resumen formal curado. En **quizzes** puede incluir `quizDashboard` (áreas a reforzar, fortalezas, intentos recientes con puntuación) y, tras enviar respuestas, `quizSessionReview` (todas las preguntas del intento con respuestas del usuario, corrección y feedback serializado).
- El endpoint transforma ese contexto en un preámbulo determinista y agrega reglas explícitas para que el asistente trate el análisis formal como fuente de verdad.
- Si existe un panel o modal en foco, ese bloque se serializa antes que el análisis formal para darle prioridad semántica en preguntas ambiguas.
- En `analyzer` el contexto puede incluir seguimiento de ejecución con resumen curado del diagrama visible, parámetros iniciales, paso activo y patrón estructural detectado.
- El asistente embebido persiste historial entre navegación y mantiene una conversación separada del chatbot de home.

---

## Estructura del directorio web

```
llm/
├── route.ts
├── classify/
│   └── route.ts
└── status/
    └── route.ts
```

## FAQ rápida

- **¿Dónde están prompts y modelos?** En backend FastAPI.
- **¿Cómo saber el modelo activo?** Consulta `/api/llm/status` (proxy de `/llm/status`).
- **¿Dónde se valida la API key?** En backend, con prioridad a `API_KEY` de servidor.

---

> _Cualquier cambio de proveedor, modelo, quota o timeout debe hacerse en backend. El frontend solo consume endpoints internos controlados._
