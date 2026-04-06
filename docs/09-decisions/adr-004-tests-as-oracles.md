# ADR-004: Tests como oraculos de comportamiento

**Tipo:** normativa

## Propósito

Formalizar que los tests del motor deben validar entradas y salidas auténticas, no solo ejecución superficial.

## Alcance

Aplica a parseo, análisis, trace, export y ejemplos canónicamente soportados.

## Fuente de verdad

- `apps/api/tests/`
- `05-quality/algorithm-oracles.md`

## Estructura

### Decision

- Los tests críticos usan pseudocódigo real y expectativas reales de salida.
- Cobertura sin valor semantico no cuenta como cierre de calidad.

## Ejemplos

- `mergeSort` debe validar método, theta y bundle paso a paso defendible.
- `while_linear` debe validar conteo y no solo status code 200.

## Limites conocidos

- Algunos oraculos deben aceptar estados `partial` o `unsupported` cuando esa es la salida correcta bajo cobertura actual.

## Archivos relacionados

- `../05-quality/testing-strategy.md`
- `../05-quality/algorithm-oracles.md`
