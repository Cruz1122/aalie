# Oráculos de algoritmos

**Tipo:** normativa

## Propósito

Centralizar los algoritmos de referencia y sus expectativas oficiales.

## Alcance

Aplica a suites `component`, `contract` y `system`.

## Fuente de verdad

- `apps/api/tests/_support/algorithms/`
- `apps/api/tests/_support/expectations/`
- tests contract de recursivos y WHILE

## Estructura

| Familia | Algoritmo | Expectativa mínima |
| --- | --- | --- |
| iterativo | `bubbleSort` | cuadrático, casos coherentes |
| iterativo | `binarySearch` | mejor `O(1)`, peor/log |
| while | `linear` | lineal |
| while | `logLoop` | logarítmico |
| while | `mcd` | `O(log(min(a,b)))` |
| recursivo | `mergeSort` | `Theta(n log n)` con método compatible |
| recursivo | `factorial` | lineal |
| recursivo | `fibonacci` | validación DP + método lineal_shift |
| recursivo | `binarySearchRecursive` | logarítmico |
| export | algoritmo triangular | snapshot y artefactos deterministas |

## Ejemplos

- si `mergeSort` deja de exponer `master` como método aplicable, eso es regresión o cambio contractual.

## Limites conocidos

- este documento resume el set canónico; el detalle fino sigue viviendo en tests y expectations versionadas.

## Archivos relacionados

- `testing-strategy.md`
- `benchmarking.md`
