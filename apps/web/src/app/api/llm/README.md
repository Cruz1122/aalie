# LLM API (@llm)

## Arquitectura y Organización

**Toda la gestión de modelos de lenguaje (LLM) está CENTRALIZADA:**
- La lógica de selección de modelo, prompts, endpoints y helpers vive en `llm-config.ts`.
- Los endpoints consumen exclusivamente esta configuración, asegurando consistencia y mantenibilidad.
- El status global de todos los jobs (incluyendo el clasificador) se expone vía `/api/llm/status`.
- Los jobs ahora son homogéneos: `classify`, `parser_assist`, `general` (puedes agregar más fácilmente).
- El modo (`LOCAL` o `REMOTE`) se controla con `LLM_MODE` en variables de entorno.

### Archivos principales
- `llm-config.ts`: fuente única de verdad para config de jobs/modelos/prompts.
- `route.ts`: endpoint general para asistencia/consulta de LLM (todos los jobs).
- `classify/route.ts`: endpoint específico para clasificación de código (usa config central como cualquier job).
- `status/route.ts`: endpoint **único** de status global LLM.
- README.md (este archivo): documentación de uso y buenas prácticas.

## ¿Cómo funciona?

### Selección de modelo/job
- Cualquier endpoint o función que requiera modelo, prompt o configuración usa exclusivamente helpers de `llm-config.ts`, por ejemplo:
  ```ts
  import { getJobConfig } from "./llm-config";
  // ...
  const config = getJobConfig('parser_assist', 'REMOTE');
  const model = config.model;
  ```
- Los endpoints nunca almacenan lógica de modelo o prompt localmente.

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
      "mode": "REMOTE",   // o "LOCAL"
      "timestamp": "2025-11-01T12:00:00.000Z",
      "config": { ... info extendida ... },
      "jobs": {
        "classify": "gemini-2.0-flash-lite",
        "parser_assist": "gemini-2.5-flash",
        "general": "gemini-2.5-flash"
      }
    }
  }
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
- Si usas el modo LOCAL, asegúrate que el modelo y endpoint estén correctamente configurados en las variables de entorno.

### Ejemplo de consumo desde frontend
```ts
// En React o similar:
fetch('/api/llm/status').then(res => res.json()).then(({status}) => {
  const modeloParser = status.jobs.parser_assist;
  // Mostrar badge, usar para analytics, etc.
});
```

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

> *Cualquier cambio de modelo, job, prompt o endpoint debe registrarse en el config central. Así todo el backend y el frontend trabajan desde una sola fuente de la verdad.*
