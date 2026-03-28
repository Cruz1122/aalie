# Desarrollo local

**Tipo:** normativa

## Propósito

Permitir levantar y probar AALIE localmente sin consultar documentos legacy.

## Alcance

Cubre flujo local con `pnpm`/Python y opcion Docker.

## Fuente de verdad

- `package.json`
- `apps/web/package.json`
- `apps/api/pyproject.toml`
- `infra/docker-compose.yml`

## Estructura

### Requisitos

- Node `>=20 <23`
- `pnpm@9.15.0`
- Python `3.11+`
- `pdflatex` si se quiere PDF

### Flujo recomendado sin Docker

1. `pnpm install`
2. `pnpm -C packages/types build`
3. `pnpm -C packages/grammar build`
4. `cd apps/api && python3 -m pip install -r requirements.txt -r requirements-dev.txt`
5. `pip install -e ../../packages/grammar/py`
6. `pnpm dev:api`
7. `pnpm -C apps/web dev`

### Flujo con Docker

1. `cd infra`
2. `docker compose up --build`

### Regenerar gramaticas

- TS: `pnpm -C packages/grammar build`
- Python: `pnpm -C packages/grammar gen:py`

Java solo se necesita para regenerar el parser Python, no para correr el sistema con artefactos ya committeados.

## Ejemplos

- validar API: `pnpm test:api:gate`
- validar examples catalog: `pnpm -C apps/web validate:examples-catalog`

## Limites conocidos

- si falta el paquete Python de grammar, parse y tests backend fallaran.

## Archivos relacionados

- `environment-variables.md`
- `deployment.md`
- `troubleshooting.md`
