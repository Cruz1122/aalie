# Especificación de métodos de recurrencia

**Tipo:** normativa

## Propósito

Definir qué métodos recursivos soporta AALIE, cómo se detectan y qué salida mínima debe producir cada uno.

## Alcance

Aplica a `detect_methods`, `RecursiveAnalyzer` y bundles paso a paso.

## Fuente de verdad

- `apps/api/app/modules/analysis/analyzers/recursive.py`
- step bundles en `characteristic_steps.py`, `iteration_steps.py`, `master_steps.py`, `recursion_tree_steps.py`
- tests contract/system de recursivos

## Estructura

### Métodos soportados

- `master`
- `iteration`
- `recursion_tree`
- `characteristic_equation`

### Prioridades

- `linear_shift`: `characteristic_equation` > `iteration` > `recursion_tree`
- `divide_conquer`: `master` > `recursion_tree` > `iteration`
- la lista de `applicable_methods` no implica que todos sean igual de recomendables; `default_method` fija la prioridad contractual.

### Salida mínima por método

- `recurrence`
- `theta` o conclusión asintótica equivalente cuando aplique
- `step_by_step` con `method`, `version`, `overallStatus`, `steps`
- advertencias o razones de soporte parcial cuando la cobertura sea incompleta

## Inputs

- AST recursivo válido;
- `preferred_method` opcional;
- `mode`;
- metadata de recurrencia detectada.

## Outputs

- `applicable_methods`
- `default_method`
- `recurrence_info`
- detalle del método seleccionado dentro de `totals`

## Invariantes

- `characteristic_equation` solo aplica a familias lineales con shift bajo cobertura;
- `master` se reserva para divide-and-conquer de forma canónica;
- `recursion_tree` y `iteration` pueden coexistir con el método por defecto;
- si el método no aplica, el motor debe fallar de forma explícita o degradar a parcial, nunca fingir aplicabilidad.

## Errores esperables

- procedimiento principal ausente;
- recurrencia no extraible;
- método preferido inválido o no aplicable;
- forma recursiva fuera de cobertura.

## Ejemplos

### Ejemplos validos

- `mergeSort`: `master`, `recursion_tree`, a veces `iteration`.
- `factorial(n) = n * factorial(n-1)`: `iteration`, `characteristic_equation` según cobertura.
- `fibonacci(n) = fibonacci(n-1) + fibonacci(n-2)`: `characteristic_equation` con validación DP.

### Ejemplos no soportados

- recurrencias no lineales o con tamaños de subproblema no inferibles;
- formas que no puedan ubicarse en `divide_conquer` ni `linear_shift` bajo la cobertura actual.

## Limites conocidos

- algunos bundles pueden terminar en `partial` o `unsupported` y aun así ser la salida correcta del sistema;
- la metadata de PD es auxiliar y no reemplaza el método principal de complejidad.

## Archivos relacionados

- `analysis-engine-spec.md`
- `execution-trace-spec.md`
- `../04-api/analysis-api.md`
