# Benchmarking

**Tipo:** normativa

## Propósito

Definir cómo se mide rendimiento reproducible del motor en escenarios relevantes.

## Alcance

Aplica a parse, classify, analyze, trace y export.

## Fuente de verdad

- `apps/api/tests/benchmark_while_algorithms.py`
- suites contract/system

## Estructura

### Escenarios mínimos

- parse de algoritmos pequenos y medianos
- análisis iterativo canónico
- análisis WHILE lineal/log
- análisis recursivo de `mergeSort`, `factorial`, `fibonacci`
- export markdown y PDF del caso triangular

### Regla

- medir antes/después en el mismo entorno;
- comparar mediana o promedio sobre múltiples ejecuciones;
- separar costo del motor simbólico de costo de export PDF.

## Ejemplos

- benchmark de WHILE para detectar regresiones al ajustar heuristicas.

## Limites conocidos

- resultados absolutos dependen del entorno; lo contractual es la reproducibilidad del método, no un número universal.

## Archivos relacionados

- `performance.md`
- `algorithm-oracles.md`
