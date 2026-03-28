# CI y CD

**Tipo:** descriptiva

## Propósito

Explicar qué valida el pipeline actual y qué pasa a validar con el check documental.

## Alcance

Cubre build, tests, lint, docker y docs-contracts.

## Fuente de verdad

- `.github/workflows/ci.yaml`
- `.github/workflows/format-autofix.yaml`

## Estructura

### Jobs actuales

- build monorepo
- tests backend con cobertura
- lint web
- lint api
- docker integration

### Cambio introducido

- job `docs-contracts` para estructura de `/docs`, etiquetas, archivos críticos, endpoints, env vars, ADRs y versión de snapshot.

### Regla de equipo

- un cambio contractual no cierra si rompe tests o docs-contracts;
- el autofix formatea código, no redacta documentación.

## Ejemplos

- si cambia un endpoint y no cambia su doc, CI falla.

## Limites conocidos

- el pipeline no genera la documentación; solo valida consistencia mínima.

## Archivos relacionados

- `coverage-policy.md`
- `../../scripts/check_docs_contracts.py`
