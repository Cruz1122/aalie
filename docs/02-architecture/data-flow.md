# Flujos de datos

**Tipo:** descriptiva  
**Estado:** final  
**Audiencia:** dev  
**Fuente de verdad:** `apps/api/app/modules/*`, `apps/api/app/core/*`, `apps/web/src/app/api/*`, `apps/web/src/lib/auth.ts`, `packages/*`  
**Última revisión:** 2026-08-20  
**Relacionado con informe técnico:** trazabilidad de datos entre componentes

## Propósito

Documentar los flujos principales de AALIE y separar explícitamente el flujo pedagógico determinista del nuevo flujo opcional de identidad.

## Principio de arquitectura

La autenticación no se inserta dentro del análisis matemático. El usuario puede continuar usando las superficies pedagógicas principales de forma anónima; Google OAuth añade identidad persistente para funcionalidades que la necesiten.

---

## 1. Parse: pseudocódigo → AST

```text
Monaco / UI
  → POST /api/grammar/parse
  → BFF
  → FastAPI /grammar/parse
  → ANTLR Python
  → AST / errors
```

El parser server-side es la fuente canónica. El frontend también usa ANTLR TypeScript para validación y asistencia inmediata.

## 2. Análisis iterativo y WHILE

```text
source
  → /api/analyze/open
  → parse + classify
  → AnalyzerRegistry
  → visitors / WhileEngine
  → LineCost[]
  → T_open
  → SymPy
  → O / Ω / Θ
```

WHILE usa heurísticas conservadoras. La ausencia de una derivación defendible puede producir un resultado parcial/unknown en lugar de inventar una complejidad.

## 3. Análisis recursivo

```text
source
  → detect-methods
  → recurrence detection
  → métodos aplicables
  → Master / Iteration / Recursion Tree / Characteristic Equation
  → step bundles
  → solución asintótica
```

Cada método tiene precondiciones propias; que una recurrencia sea válida no implica que todos los métodos sean aplicables.

## 4. Trace

```text
source + input concreto
  → trace_service
  → CodeExecutor
  → pasos + métricas + call tree
  → structured trace
  → UI
```

Trace es una visualización pedagógica de una ejecución concreta y no una prueba formal de complejidad.

## 5. Export

```text
source
  → build_export_state
  → AalieAnalysisSnapshotV1
  → DocumentModel
  → Markdown / LaTeX
  → PDF opcional con pdflatex
  → ZIP opcional
```

Todos los formatos salen del mismo snapshot. El render no vuelve a analizar el pseudocódigo.

## 6. Quizzes

```text
UI
  → BFF quizzes
  → backend dataset + selector determinista
  → sesión sanitizada
  → respuesta del estudiante
  → grading determinista
  → resultado
  → progreso local del navegador
```

MF2 no persiste intentos académicos en PostgreSQL.

## 7. Contenido modular

```text
JSON catalog
  → JSON Schema validation
  → loader
  → ContentBlock[]
  → React renderer
```

Agregar contenido válido no requiere reprogramar la lógica de render para cada módulo.

## 8. LLM opcional

```text
UI / assistant
  → BFF
  → FastAPI LLM service
  → provider externo
  → respuesta pedagógica
```

El motor determinista no depende del resultado LLM. Código fuente o contexto visible solo se envía al proveedor cuando la función LLM correspondiente es invocada.

---

## 9. Google OAuth y sesión Better Auth

```text
Usuario anónimo
  → Sign in with Google
  → /api/auth/sign-in/social
  → Google OAuth
  → /api/auth/callback/google
  → Better Auth
  → PostgreSQL schema auth
  → cookie de sesión
  → authClient.useSession()
```

### Datos persistidos

Better Auth puede persistir:

- usuario: id, nombre, email, estado de verificación, imagen y role;
- sesión: token, expiración y metadatos técnicos soportados por el adapter;
- cuenta OAuth: identidad del provider y credenciales OAuth cuando existan;
- claves JWKS.

Los tokens OAuth persistidos se cifran mediante la configuración `encryptOAuthTokens`.

`role` es server-owned y se restringe a `USER | ADMIN`.

### Degradación

Si el usuario cancela o no usa OAuth, permanece anónimo y puede seguir usando las funcionalidades pedagógicas públicas.

---

## 10. JWT/JWKS: Better Auth → FastAPI

```text
sesión Better Auth válida
  → /api/auth/token
  → sesión autoritativa
  → JWT Ed25519 / 5 min
  → Authorization: Bearer <jwt>
  → FastAPI get_identity()
  → fetch/cache JWKS desde web
  → validar firma + iss + aud + exp + sub + role
  → endpoint protegido
```

### Contratos actuales

- `GET /auth/whoami`: identidad válida requerida.
- `GET /auth/admin/ping`: identidad válida + `ADMIN`.

Las rutas pedagógicas existentes no reciben protección JWT de forma automática en MF2.

### Errores

- token ausente/malformado/expirado → 401;
- firma, issuer, audience o `kid` inválido → 401;
- role fuera de `USER | ADMIN` → 401;
- usuario `USER` sobre endpoint ADMIN → 403.

JWKS se cachea para evitar una llamada a `web` por request y se refresca de forma acotada ante rotación de claves.

---

## 11. PostgreSQL y deploy

```text
OCI deploy <SHA>
  → pull imágenes
  → postgres healthy
  → api container ejecuta alembic upgrade head
  → web/api start
  → readiness + smoke
```

El rollback de imagen no hace downgrade del schema. Las migraciones de producción deben mantener compatibilidad con la imagen anterior.

Backups usan `pg_dump -Fc` y restore valida el dato restaurado en una base vacía.

---

## 12. Identidad experimental futura

No existe todavía flujo de enrolamiento de estudio en MF2.

El contrato de diseño es:

```text
Google / product identity
  → user_id operativo
  → enrolamiento explícito futuro
  → participant_id seudónimo
  → condition AALIE | CONTROL
  → dataset académico
```

Reglas:

- `AALIE | CONTROL` no se almacena como `role`.
- email no debe ser la clave primaria del dataset experimental.
- login no equivale a consentimiento de investigación.
- la telemetría experimental debe ser allowlisted y evitar código fuente, prompts, respuestas LLM completas e IP como datos académicos por defecto.

## Límites actuales

- No existe rate limiting por feature para analysis/trace/export/LLM.
- Better Auth mantiene únicamente sus propios límites de autenticación.
- No existe `visitor_id` persistente para anónimos.
- No existen `studies`, `study_participants`, `study_measurements` ni event store académico.
- El progreso pedagógico continúa local al navegador.

## Archivos relacionados

- `system-architecture.md`
- `backend-architecture.md`
- `frontend-architecture.md`
- `../09-decisions/adr-018-google-oauth-better-auth-jwt.md`
