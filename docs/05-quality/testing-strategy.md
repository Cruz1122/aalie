# Estrategia de pruebas

**Tipo:** normativa

## Propósito

Definir cómo se valida AALIE en capas y qué significa una prueba útil en este repo.

## Alcance

Aplica a backend, contratos, sistema, examples catalog y checks documentales.

## Fuente de verdad

- `apps/api/tests/README.md`
- `.github/workflows/ci.yaml`
- `apps/web/package.json`

## Estructura

### Capas

- `unit`: componentes aislados del motor
- `component`: algoritmos canónicos
- `contract`: regresión parametrizada y stress
- `system`: endpoints HTTP y BDD
- `web`: tests de componentes/utilidades frontend

### Regla central

Las pruebas críticas deben ser auténticas: `input -> expected output real`, no solo “no explota”.

### Distribución por responsabilidad

- parser/AST: unit + system parse
- clasificación y análisis: unit + contract + system
- WHILE y recurrencias: contract obligatoria
- trace y export: unit + system
- ejemplos: validación dedicada del catálogo

## Ejemplos

- `mergeSort` y `factorial` como algoritmos canónicos recursivos.
- `while_linear` y `euclides` como oraculos WHILE.

## Limites conocidos

- algunos resultados correctos son `partial` o `unsupported`; la prueba debe reflejar eso, no forzar certeza inexistente.

## Archivos relacionados

- `algorithm-oracles.md`
- `coverage-policy.md`
- `ci-cd.md`
