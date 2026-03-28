# Especificación del motor de análisis

**Tipo:** normativa

## Propósito

Definir el pipeline contractual del motor de análisis y la forma mínima de sus salidas.

## Alcance

Aplica a `analyze_algorithm`, analyzers iterativos/recursivos, `loopInvariant` y selección de casos.

## Fuente de verdad

- `apps/api/app/modules/analysis/service.py`
- `apps/api/app/modules/analysis/analyzers/`
- `packages/types/src/index.ts`

## Estructura

### Pipeline

`AST -> classify -> analyzer -> byLine/totals -> T_open -> T_polynomial -> notaciones`

En paralelo, el servicio puede adjuntar:

- `loopInvariant`;
- información de recurrencia y método;
- bundles paso a paso por método.

### Salidas minimas

- `ok`
- `byLine`
- `totals.T_open`
- `totals.big_o`
- `totals.big_omega`
- `totals.big_theta`
- `loopInvariant`

En `mode="all"`:

- `worst`
- `best`
- `avg` o `"same_as_worst"`
- `has_case_variability`

## Inputs

- `source`
- `mode`
- `avgModel`
- `algorithm_kind`
- `preferred_method`
- `locale`

## Outputs

- resultado por caso o agrupado en `all`;
- errors si parse o análisis fallan;
- artefactos auxiliares cuando existan.

## Invariantes

- parseo exitoso es prerrequisito;
- `loopInvariant` se calcula una vez por AST y se adjunta aun cuando el resultado sea parcial;
- en algoritmos deterministicos `best` y `avg` pueden resolverse como `"same_as_worst"`;
- el motor puede retornar estados parciales o `unsupported` en subartefactos sin inventar conclusión total.

## Errores esperables

- parse invalido;
- AST ausente;
- método preferido inválido;
- recurrencia no aplicable o fuera de cobertura;
- excepcion interna del motor.

## Ejemplos

### Ejemplos validos

- algoritmo iterativo con `mode="worst"`: retorna `byLine`, `totals` y `loopInvariant`.
- algoritmo recursivo con `preferred_method="master"`: retorna `recurrence`, detalle del método y notaciones.

### Ejemplos no soportados

- usar `avg` sin entrada analizable cuando la estructura no admite modelo promedio defendible;
- forzar un método recursivo incompatible con la forma detectada.

## Limites conocidos

- La exactitud matemática y la heurística conservadora conviven en el mismo contrato; por eso hay estados parciales y advertencias.
- `loopInvariant` es local al ciclo significativo, no una prueba global del algoritmo.

## Archivos relacionados

- `while-heuristics-spec.md`
- `recurrence-methods-spec.md`
- `../04-api/analysis-api.md`
