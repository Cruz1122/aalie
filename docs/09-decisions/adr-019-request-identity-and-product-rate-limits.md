# ADR-019: Identidad de request y rate limiting de producto

**Estado:** aceptado  
**Fecha:** 2026-08-20  
**Ámbito:** AALIE Fase 4 / Microfase 3

## Contexto

AALIE conserva el uso anónimo de sus funciones pedagógicas, pero la infraestructura actual necesita distinguir de forma estable y no invasiva entre requests anónimos y autenticados para aplicar cuotas por coste real. Better Auth limita sus propios endpoints de autenticación, pero no protege análisis, trace, quizzes, exportes o LLM.

Los Route Handlers del BFF repiten hoy resolución de API interna, parseo de payload y proxy. Copiar identidad, límites y timeouts en cada handler produciría políticas divergentes.

## Decisión

### Contexto de request centralizado

El BFF construirá un contexto server-side único para toda ruta de producto:

```text
sesión Better Auth válida → subject = user:<user.id>
sin sesión               → subject = visitor:<uuid aleatorio>
```

El navegador no puede definir `userId`, `role`, `participantId` ni subject mediante headers o payload. Cualquier header de identidad enviado por cliente se ignora/elimina y el BFF reconstruye la identidad.

### Identidad anónima

Usar cookie `aalie_vid`:

- UUID criptográficamente aleatorio;
- `HttpOnly`;
- `SameSite=Lax`;
- `Secure` en producción;
- `Path=/`;
- expiración aproximada de 90 días.

No usar fingerprinting, canvas fingerprint, IP, user-agent ni combinaciones de atributos del dispositivo como identidad persistente.

### Rate limiting

El rate limit de producto se implementa en PostgreSQL, sin Redis, mediante una fila por `scope + subject_hash` y UPSERT atómico. `subject_hash` se deriva con HMAC-SHA256 y un secreto de runtime para no persistir directamente el identificador operacional.

Scopes iniciales:

- `parse`;
- `analysis`;
- `trace`;
- `quiz`;
- `export_text`;
- `export_pdf`;
- `llm`.

Las cuotas se configuran por entorno. Usuarios anónimos tienen cuotas más restrictivas que usuarios autenticados. Los rechazos usan HTTP 429 y `Retry-After`.

### Fallo del limiter

- operaciones deterministas baratas pueden usar fallback process-local más restrictivo;
- operaciones caras (`export_pdf`, `llm`) fallan cerradas con 503 si no se puede determinar una cuota segura.

### BFF común

Crear una capa compartida para:

- API base interna;
- request id;
- identidad;
- tamaño máximo de body;
- timeout;
- rate-limit policy;
- JWT interno opcional;
- traducción consistente de errores.

No convertir `middleware.ts` de next-intl en barrera de seguridad para `/api/*`.

### PDF

Rate limit y concurrencia son problemas distintos. El compilador PDF tendrá un límite explícito de concurrencia, inicialmente `PDF_EXPORT_MAX_CONCURRENCY=1` para la VM actual. Si el slot está ocupado se devuelve un error controlado con `Retry-After`.

## Motivos

- preserva uso anónimo;
- evita fingerprinting invasivo;
- PostgreSQL ya existe y es suficiente para la escala de AALIE;
- el UPSERT atómico evita carreras de contador;
- centralizar el BFF evita políticas inconsistentes;
- separar cuota de concurrencia protege específicamente `pdflatex`.

## Seguridad

- no confiar en headers de identidad del navegador;
- no exponer JWT de servicio al cliente;
- no persistir IP/user-agent como identidad de rate limiting;
- secretos HMAC solo server-side;
- límites de body y timeout por scope;
- errores de rate limit no deben filtrar subject interno.

## Validación requerida

- mismo `aalie_vid` consume el mismo bucket;
- visitors distintos no comparten bucket;
- autenticado recibe política autenticada;
- concurrencia no supera la cuota por race condition;
- reset de ventana es determinista;
- 429 incluye `Retry-After`;
- headers de identidad falsificados no cambian subject;
- body demasiado grande produce 413;
- timeout produce respuesta controlada;
- solo una compilación PDF simultánea con el baseline productivo actual.

## Alternativas descartadas

- Redis: infraestructura adicional innecesaria para la escala actual.
- IP como subject: NAT, aulas compartidas, privacidad y baja estabilidad.
- fingerprinting: invasivo y contrario al objetivo pedagógico.
- limiter solo en memoria: no es autoritativo ni reproducible ante reinicios.
- copiar lógica en cada Route Handler: deriva inevitable de políticas.
