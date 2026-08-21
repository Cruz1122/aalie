# Arquitectura backend

**Tipo:** descriptiva  
**Estado:** final  
**Audiencia:** dev  
**Fuente de verdad:** `apps/api/app/main.py`, `apps/api/app/core/`, `apps/api/app/modules/`, `apps/api/migrations/`, `apps/api/tests/`  
**Última revisión:** 2026-08-20  
**Relacionado con informe técnico:** API, análisis, trace, export, quizzes, LLM, persistencia y auth

## Propósito

Explicar la organización del backend FastAPI, su frontera con PostgreSQL y Better Auth, y los contratos de autorización disponibles en la Microfase 2.

## Aplicación FastAPI

- Entry point: `apps/api/app/main.py`.
- `create_app()` configura CORS por entorno, healthchecks y routers.
- `/health/live` verifica únicamente que el proceso responda.
- `/health/ready` comprueba parser, assets de export, quizzes, `pdflatex` y PostgreSQL.
- La disponibilidad del JWKS no se incorpora a readiness para evitar una dependencia circular de arranque con `web`.

FastAPI no tiene un middleware global de autenticación. Las rutas pedagógicas existentes siguen públicas y las rutas protegidas declaran explícitamente dependencias de identidad.

## Routers

| Router | Prefijo | Propósito |
|---|---|---|
| parsing | `/grammar` | pseudocódigo → AST |
| analysis | `/analyze` | análisis, detección de métodos y trace |
| auth | `/auth` | demostración de identidad JWT y autorización ADMIN |
| classification | `/classify` | clasificación estructural del algoritmo |
| LLM | `/llm` | jobs opcionales y estado de proveedor |
| export | `/export` | snapshot → MD/LaTeX/PDF/ZIP |
| quizzes | `/quizzes` | dataset, selección, sesiones y grading |

### Endpoints de autenticación

`apps/api/app/modules/auth/router.py` define:

- `GET /auth/whoami` → requiere `get_identity`; devuelve `{userId, role}`.
- `GET /auth/admin/ping` → requiere `require_admin`; un `USER` autenticado recibe 403.

Estos endpoints prueban la frontera Better Auth → JWT → FastAPI sin convertir análisis/trace/export en endpoints privados antes de que exista la política de rate limiting de la Microfase 3.

## Persistencia PostgreSQL

`apps/api/app/core/database.py` crea el engine SQLAlchemy y la sesión de DB. La configuración usa `DATABASE_URL=postgresql+psycopg://...`.

Principios:

- `pool_pre_ping` para detectar conexiones rotas;
- dependencia `get_db()` con cierre de sesión garantizado;
- comprobación explícita `SELECT 1` para readiness;
- sin `Base.metadata.create_all()`;
- Alembic es la única fuente de verdad de migraciones.

### Esquemas

- `public`: dominio AALIE. En esta microfase no se crean tablas académicas de negocio.
- `auth`: tablas de Better Auth y JWKS.

La migración inicial de auth crea `user`, `session`, `account`, `verification` y `jwks`, incluyendo constraint de roles `USER | ADMIN` e índices relevantes.

## JWT/JWKS

`apps/api/app/core/auth.py` implementa la frontera de confianza con Better Auth.

### Validación del bearer token

FastAPI exige:

- token con tamaño y forma acotados;
- header `alg=EdDSA`;
- `kid` presente y acotado;
- clave JWKS `OKP` / `Ed25519` / `EdDSA`;
- firma válida;
- `issuer` esperado;
- `audience` esperado;
- claims requeridos `exp`, `iss`, `aud`, `sub`;
- `role` estrictamente en `USER | ADMIN`.

Tokens inválidos, expirados, con firma incorrecta, issuer/audience incorrectos o `kid` desconocido responden 401. Falta de privilegio ADMIN responde 403.

### Caché JWKS

El cache es deliberadamente acotado:

- máximo de respuesta y cantidad de claves;
- TTL de cinco minutos;
- stale fallback corto si el JWKS no está momentáneamente disponible;
- single-flight refresh para evitar tormentas concurrentes;
- refresh de `kid` desconocido limitado temporalmente.

El endpoint JWKS se consume por la red privada desde `AUTH_JWKS_URL=http://web:3000/api/auth/jwks` en producción.

## Análisis y motor determinista

El flujo de análisis se mantiene independiente de autenticación:

1. parseo ANTLR;
2. clasificación;
3. selección en `AnalyzerRegistry`;
4. visitors / analizadores iterativos o recursivos;
5. costos por línea y `T_open`;
6. cierre simbólico con SymPy;
7. O/Ω/Θ y artefactos pedagógicos.

WHILE usa heurísticas conservadoras y patrones especializados. Los métodos recursivos soportados incluyen Master, Iteration, Recursion Tree y Characteristic Equation cuando sus precondiciones son aplicables.

## Trace

`trace_service.py` coordina ejecución concreta, pasos, diagnóstico, métricas y representación estructurada. Trace es una herramienta pedagógica y no una prueba formal de complejidad o corrección.

## Export

El export parte de un snapshot único. `snapshot_builder.py`, `document_model.py`, renderers y `latex_compiler.py` producen los formatos institucionales sin recalcular el análisis durante el render.

## Quizzes

El backend carga bancos JSON versionados, valida esquema, selecciona preguntas de forma determinista y aplica políticas de grading. La persistencia del progreso del usuario continúa fuera del backend en esta microfase.

## LLM

El backend es el único punto autorizado para hablar con proveedores LLM. El subsistema es opcional y no sustituye al motor determinista.

## Configuración nueva de MF1/MF2

Variables relevantes del API:

- `DATABASE_URL`;
- `AUTH_JWKS_URL`;
- `AUTH_JWT_ISSUER`;
- `AUTH_JWT_AUDIENCE`;
- variables existentes de CORS, export, quizzes y LLM.

No existen secrets de Google en FastAPI: `GOOGLE_CLIENT_SECRET` pertenece al runtime `web`/Better Auth.

## Tests y quality gates

La rama valida:

- migraciones Alembic sobre PostgreSQL real;
- unit tests de database y JWT;
- JWT válido, expirado, sin `exp`, issuer/audience incorrectos, firma incorrecta y `kid` desconocido;
- USER vs ADMIN;
- lanes rápidas con cobertura ≥70%;
- `contract + system` bloqueantes;
- Docker E2E y ARM64;
- persistencia, dump y restore.

## Límites de esta microfase

- No existe rate limiting por feature en FastAPI.
- No existe `visitor_id` estable para anónimos.
- No existen modelos `studies`, `study_participants` o `study_measurements`.
- No existe telemetría académica persistente.
- Las rutas pedagógicas permanecen públicas por diseño hasta definir la política de Microfase 3.
- El cache de quizzes sigue siendo en memoria.

## Archivos relacionados

- `system-architecture.md`
- `frontend-architecture.md`
- `data-flow.md`
- `../09-decisions/adr-017-postgresql-self-hosted-oci.md`
- `../09-decisions/adr-018-google-oauth-better-auth-jwt.md`
