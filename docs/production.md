# Producción e integración productiva de AALIE

La fuente de verdad operacional para reconstruir y administrar la producción OCI de `aalie.dev` es [`06-operations/production-oci.md`](06-operations/production-oci.md). Este documento conserva el overview del runtime y el entorno productivo local usado por CI; no duplica bootstrap, SSH, secretos, patching ni rollback.

## Arquitectura

```text
Browser → aalie-web → Next BFF → aalie-api
                                      ↘ PostgreSQL (red Docker privada)
```

El navegador solo conoce `aalie-web`. Las operaciones de análisis, trace, quizzes, LLM y exportación atraviesan Route Handlers de Next bajo `/api/*`. FastAPI no necesita exponerse públicamente para que funcione la aplicación.

## Desarrollo vs producción

Desarrollo conserva `infra/docker-compose.yml`: usa bind mounts, instalación de dependencias y hot reload.

Producción usa `infra/docker-compose.prod.yml`: no usa bind mounts, no instala dependencias al arrancar y ejecuta Next standalone y Uvicorn sin reload.

OCI usa `infra/oci/compose.yml`: consume imágenes ARM64 ya publicadas en GHCR, mantiene web/API privadas y expone solo Caddy en 80/443.

```bash
# Producción local
docker compose -f infra/docker-compose.prod.yml build
docker compose -f infra/docker-compose.prod.yml up -d --wait
docker compose -f infra/docker-compose.prod.yml run --rm --no-deps api alembic upgrade head
python scripts/smoke_prod.py

# Detener
docker compose -f infra/docker-compose.prod.yml down
```

`docker compose down` conserva el volumen nombrado de PostgreSQL. `docker compose down -v` elimina los volúmenes y, por tanto, los datos persistentes; no debe usarse en producción.

El host solo necesita Docker y Compose.

## Variables de configuración

### Web públicas

- `NEXT_PUBLIC_USE_DETERMINISTIC_DIAGRAMS`: solo si una funcionalidad de navegador lo requiere.

### Web internas

- `API_INTERNAL_BASE_URL`: URL privada del API, normalmente `http://api:8000`.
- `HOSTNAME`: `0.0.0.0` para el servidor standalone dentro del contenedor.
- `PORT`: `3000` para el servidor standalone dentro del contenedor.

### API

- `CORS_ENABLED` y `CORS_ALLOWED_ORIGINS`.
- `QUIZ_DATA_DIR`.
- `AALIE_EXPORTER_ASSETS_DIR`.
- `DATABASE_URL` del API usa `postgresql+psycopg://...`; la web recibe una URL `postgresql://...` reservada para Better Auth.
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `API_DATABASE_URL` y `WEB_DATABASE_URL` provienen del runtime, nunca de una imagen.
- `LLM_PROVIDER`, `LLM_MODEL_*`, `LLM_TIMEOUT_SECONDS`.

### Secretos

- `API_KEY` y credenciales de proveedores LLM se inyectan únicamente en runtime.
- No deben aparecer en Dockerfiles, imágenes, `NEXT_PUBLIC_*`, Compose versionado ni logs.

## Health y smoke

API:

- `/health/live`: proceso HTTP vivo; no consulta dependencias.
- `/health/ready`: parser, assets de export, quizzes, `pdflatex` y PostgreSQL disponibles. No genera PDF.

Web:

- `/api/health/live`: proceso Next vivo.
- `/api/health`: comprobación del API a través del BFF.

El gate Docker de CI construye las imágenes, arranca Compose, espera health, ejecuta `scripts/smoke_prod.py`, genera PDF real y valida ZIP antes de destruir el stack.

## PDF

La imagen API incluye TeX Live, `pdflatex`, estilos, templates y logos. El proceso corre como usuario `aalie`; los temporales se crean fuera del código de la aplicación.

El pipeline mantiene dos pasadas de `pdflatex`: la primera prepara referencias auxiliares y la segunda produce el PDF final. El profiling del pipeline registra snapshot, modelo documental, assets de trace, renderer LaTeX, preparación temporal, ambas pasadas, lectura del PDF y cleanup.

### Benchmark de referencia

Ejecutado dentro de `aalie-api:prod` con el caso real `triangular(n)`, un PDF con diagramas de trace:

```bash
docker compose -f infra/docker-compose.prod.yml exec -T api \
  python scripts/benchmark_pdf.py --warm 5 --concurrency 1,2,5
```

Resultados observados en este host (milisegundos; el coste de preparar el snapshot de entrada del benchmark se mide también en `wall_total_ms`). Se ejecutaron 25 warm runs:

| Escenario | p50 total interno | wall total aproximado |
| --- | ---: | ---: |
| cold | 1.428 s | 3.100 s |
| warm, 25 | 2.512 s p50 / 2.799 s p95 | — |
| PDF pequeño | 1.026 s p50 | — |
| PDF representativo | 2.490 s p50 / 2.576 s p95 | — |
| concurrencia 1 | — | 2.476 s |
| concurrencia 2 | — | 3.594 s |
| concurrencia 5 | — | 7.846 s |

En warm, `pdflatex` representa aproximadamente 95% del tiempo interno medido; la pasada 2 fue ligeramente más costosa que la pasada 1. Snapshot ronda 55–60 ms, el modelo documental 3 ms, LaTeX renderer 5 ms y los assets de trace son despreciables para este caso. Con cinco exportaciones concurrentes aumenta la latencia y también el renderer/snapshot, consistente con contención de CPU.

La medición de recursos del proceso durante los lotes concurrentes registró aproximadamente:

| Concurrencia | CPU usuario | CPU sistema | aumento máximo RSS |
| ---: | ---: | ---: | ---: |
| 1 | 1.269 s | 1 ms | 2.1 MB |
| 2 | 2.278 s | 13 ms | 4.9 MB |
| 5 | 5.965 s | 56 ms | 10.9 MB |

Estos números son una línea base, no un SLO universal: deben repetirse en el host de despliegue.

La comparación experimental produjo PDF válido en ambos modos:

| Modo | p50 | p95 |
| --- | ---: | ---: |
| una pasada | 1.905 s | 1.941 s |
| dos pasadas | 2.485 s | 2.518 s |

La versión actual de los templates no contiene referencias `\\label`/`\\ref` ni índices que requieran una segunda resolución. Por eso una pasada produce un PDF válido para este caso, pero se conserva la configuración de dos pasadas como comportamiento seguro hasta validar visualmente todos los templates institucionales y casos con paginación. No se elimina la segunda pasada por rendimiento únicamente.

Si PDF falla:

1. comprobar `/health/ready` y la capacidad `pdflatex`;
2. revisar logs del contenedor API;
3. comprobar `AALIE_EXPORTER_ASSETS_DIR` solo si se sobreescribieron assets;
4. validar que los logos y `aalie-report.sty` existen dentro de la imagen.

Los errores públicos no devuelven `workDir` ni logs completos del compilador; los detalles permanecen en los logs del servidor.
