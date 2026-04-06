# LLM API (@llm)

## Arquitectura y Organización

**Toda la gestión de modelos de lenguaje (LLM) está CENTRALIZADA:**

- La lógica de selección de modelo, prompts, endpoints y helpers vive en `llm-config.ts`.
- Los endpoints consumen exclusivamente esta configuración, asegurando consistencia y mantenibilidad.
- El status global de todos los jobs se expone vía `/api/llm/status`.
- Los jobs ahora son homogéneos: `parser_assist`, `general`, `repair`, `compare` (puedes agregar más fácilmente).
- Los modelos y endpoint se controlan por variables `LLM_MODEL_*` y `GEMINI_ENDPOINT_BASE`.

### Archivos principales

- `llm-config.ts`: fuente única de verdad para config de jobs/modelos/prompts.
- `route.ts`: endpoint general para asistencia/consulta de LLM (todos los jobs).
- `classify/route.ts`: endpoint específico para clasificación de código (usa backend Python y, opcionalmente, LLM).
- `status/route.ts`: endpoint **único** de status global LLM.
- README.md (este archivo): documentación de uso y buenas prácticas.

## ¿Cómo funciona?

### Selección de modelo/job

- Cualquier endpoint o función que requiera modelo, prompt o configuración usa exclusivamente helpers de `llm-config.ts`, por ejemplo:
  ```ts
  import { getJobConfig } from "./llm-config";
  // ...
  const config = getJobConfig("parser_assist", "es");
  const model = config.model;
  ```
- Los endpoints nunca almacenan lógica de modelo o prompt localmente.
- `POST /api/llm` acepta `assistantContext` opcional para serializar contexto curado de `/analyzer`, `/examples` y `/user-guide` sin duplicar prompts por superficie.

### Consumo de status/modelos activos

- El status de todos los jobs está en una única ruta:
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

### Fallback por defecto

```ts
export const DEFAULT_GEMINI_ENDPOINT_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export const DEFAULT_GEMINI_MODELS = {
  parser_assist: "gemini-2.5-flash",
  general: "gemini-3-flash-preview",
  repair: "gemini-2.5-flash",
  compare: "gemini-2.5-flash",
} as const;

export const DEFAULT_GEMINI_DIAGRAM_MODELS = {
  recursion_diagram: "gemini-3-flash-preview",
  generate_diagram: "gemini-3-flash-preview",
} as const;
```

- El frontend puede mostrar siempre el modelo real activo por job leyendo sólo de aquí.

### ¿Cómo agregar o modificar un job/modelo?

1. Edita `llm-config.ts`:
   - Agrega/modifica el modelo, el prompt o los parámetros para el nuevo job.
   - Asegúrate de incluirlo en el mapeo de jobs/export.
2. No es necesario tocar ningún endpoint.
3. El status reflejará automáticamente el nuevo modelo/job.

### Buenas prácticas

- **Nunca** mantengas prompts/modelos/payloads en endpoints individuales.
- Siempre importa y usa los helpers del config central.
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

- Cuando el chat se usa desde el iframe embebido, el frontend envía `assistantContext` con la superficie (`analyzer`, `examples`, `user-guide`), metadatos de la vista y, si aplica, un resumen formal curado.
- El endpoint transforma ese contexto en un preámbulo determinista y agrega reglas explícitas para que el asistente trate el análisis formal como fuente de verdad.
- Si existe un panel o modal en foco, ese bloque se serializa antes que el análisis formal para darle prioridad semántica en preguntas ambiguas.
- En `analyzer` el contexto puede incluir seguimiento de ejecución con resumen curado del diagrama visible, parámetros iniciales, paso activo y patrón estructural detectado.
- El asistente embebido persiste historial entre navegación y mantiene una conversación separada del chatbot de home.

---

## Estructura final del directorio

```
llm/
├── llm-config.ts
├── route.ts
├── classify/
│   └── route.ts
└── status/
    └── route.ts
```

## FAQ rápida

- **¿Dónde están los prompts?** En llm-config, uno por job.
- **¿Cambio de modelo?** Solo en config central.
- **¿Cómo saber el modelo activo?** Solo consulta `/api/llm/status`.
- **¿Agrego un job?** Solo lo defines en config y, si necesitas endpoint, lo implementas como todos (usando getJobConfig).

---

> _Cualquier cambio de modelo, job, prompt o endpoint debe registrarse en el config central. Así todo el backend y el frontend trabajan desde una sola fuente de la verdad._
