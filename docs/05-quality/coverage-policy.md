# Política de cobertura

**Tipo:** normativa

## Propósito

Fijar el umbral de cobertura y evitar que la cobertura se use como métrica vacía.

## Alcance

Aplica al backend y a los módulos críticos del contrato técnico.

## Fuente de verdad

- `.github/workflows/ci.yaml`
- `apps/api/tests/README.md`

## Estructura

### Gate actual

- cobertura global mínima en CI: `70%`
- objetivo operativo: `70–75% o más`

### Módulos prioritarios

- parser y AST
- analysis service
- visitors
- `while_engine`
- métodos recursivos
- trace
- export/snapshot

### Regla semantica

Cobertura sin oraculo util no cuenta como cierre de calidad.

## Ejemplos

- subir cobertura con asserts superficiales en helpers sin proteger el contrato no es suficiente.

## Limites conocidos

- la cobertura global no reemplaza tests contract para dominios complejos como WHILE y recurrencias.

## Archivos relacionados

- `testing-strategy.md`
- `algorithm-oracles.md`
- `ci-cd.md`
