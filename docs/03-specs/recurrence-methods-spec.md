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

### Detección contractual de familias

- `linear_shift`: una sola rama recursiva dominante con desplazamiento del argumento por constante o transformación lineal equivalente defendible, más combinación algebraica local compatible.
- `divide_conquer`: varias subllamadas recursivas homogéneas sobre subproblemas de tamaño fraccional o reducible multiplicativamente, con término no recursivo separable.
- si la forma detectada no satisface ninguna familia con evidencia suficiente, el sistema no debe promover método principal concluyente.
- la detección de familia precede a la selección de método; primero se clasifica la forma de recurrencia y después se aplica la prioridad.

### Salida mínima por método

- `recurrence`
- `theta` o conclusión asintótica equivalente cuando aplique
- `step_by_step` con `method`, `version`, `overallStatus`, `steps`
- advertencias o razones de soporte parcial cuando la cobertura sea incompleta

### Alcance matemático por método

- el contrato debe poder distinguir si un método aporta una `equivalent` result, una `upper` bound, una `lower` bound o una salida `partial`;
- `applicable_methods` indica que el método puede seleccionarse, no que garantice la misma fuerza de conclusión que el método por defecto;
- cuando un método sea aplicable pero solo produzca una cota parcial o una cota de un solo lado, el sistema debe explicitarlo en la metadata y en la explicación pedagógica.

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
- `default_method` debe ser coherente con la familia detectada;
- un método aplicable no puede publicarse si contradice la familia de recurrencia inferida.

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
- el selector puede ofrecer métodos no recomendados siempre que su alcance matemático quede señalado como `equivalent`, `upper`, `lower` o `partial`.

## Archivos relacionados

- `analysis-engine-spec.md`
- `execution-trace-spec.md`
- `../04-api/analysis-api.md`
