# CI y CD

**Tipo:** descriptiva

## Propósito

Explicar qué valida el pipeline actual y cómo un commit aceptado en `main` llega a producción OCI.

## Alcance

Cubre build, tests, lint, Docker, contratos OCI, publicación GHCR y deploy productivo.

## Fuente de verdad

- `.github/workflows/ci.yaml`
- `.github/workflows/arm64-validation.yml`
- `infra/docker-compose.prod.yml`
- `infra/oci/compose.yml`

## Estructura

### Jobs actuales

- `build`: paquetes, web y smoke de dependencias API;
- `test-pr-gate`: PostgreSQL de servicio, migración Alembic y lanes fast/oracle con cobertura mínima de 70%;
- `test-extended-lanes` y `test-nightly-lanes`;
- `lint-web` y `lint-api`;
- `docs-contracts` y calidad de quizzes;
- `oci-contracts`: Compose OCI, PostgreSQL privado, aislamiento de puertos, shell y Caddyfile;
- `docker-integration`: build productivo amd64, migración, persistencia down/up, backup/restore, runtime no-root, health interno, smoke funcional y SIGTERM/PDF.

### ARM64, GHCR y OCI

`.github/workflows/arm64-validation.yml` corre en un runner Ubuntu ARM nativo cuando cambian runtime, paquetes o infraestructura productiva. Construye API/web, confirma `linux/arm64`, levanta `infra/docker-compose.prod.yml`, comprueba el health de Next dentro del contenedor y ejecuta el smoke completo.

En pushes exitosos a `main` publica dos tags por imagen:

- `${{ github.sha }}`: fuente contractual inmutable para deploy/rollback;
- `latest-arm64`: alias informativo, nunca fuente de verdad operacional.

El job `deploy-production`, protegido por el Environment `Production – aalie`, envía solo `deploy <SHA>` con una clave SSH restringida. `/usr/local/bin/aalie-deploy` hace pull de ambas imágenes, conserva `.env.runtime`, aplica Alembic antes de levantar API/web, espera health/readiness y revierte al SHA anterior si falla. Después Actions ejecuta `scripts/smoke_prod.py` contra `https://aalie.dev`.

### Regla de equipo

- un cambio contractual no cierra si rompe tests o docs-contracts;
- un cambio OCI no cierra si expone 3000/8000 o rompe shell/Caddy;
- ningún PR normal se conecta a la VM ni consume secretos productivos;
- solo un push a `main` que supera ARM64 validation puede desplegar.

## Ejemplos

- si cambia un endpoint y no cambia su doc, CI falla.

## Límites conocidos

- CI valida que la guía OCI exista, pero las rotaciones y verificaciones físicas de recuperación requieren al operador.
- No hay staging equivalente a OCI; el Compose productivo local es el gate reproducible previo.

## Archivos relacionados

- `coverage-policy.md`
- `../../scripts/check_docs_contracts.py`
- `../06-operations/production-oci.md`
