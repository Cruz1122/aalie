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

### Definiciones matemáticas obligatorias

- `T_open`: expresión simbólica abierta de costo construida por el motor antes del cierre algebraico final. Su dominio es el de expresiones sobre tamaño de entrada, contadores de iteración, sumatorias y constantes de costo por línea.
- `T_open` preserva estructura analítica: puede contener sumatorias, productos de multiplicidad y términos todavía no simplificados.
- `T_polynomial`: forma cerrada o más reducida derivada de `T_open` cuando el motor logra simplificación defendible.
- `T_polynomial` no exige ser literalmente un polinomio; el nombre es histórico. Contractualmente representa la mejor forma simplificada estable que el motor puede publicar sin inventar pasos.
- relación obligatoria: `T_polynomial` solo puede derivarse de `T_open` por transformaciones simbólicas defendibles y trazables; nunca por recomputación independiente del algoritmo.

### Dominio permitido de simplificación

- se permite cierre algebraico, expansión controlada, factorización, evaluación de sumatorias soportadas y cancelación de términos algebraicamente equivalentes.
- se permite eliminar términos dominados solo en la derivación de notaciones asintóticas, no en `T_open`. En `T_polynomial`, la eliminación de dominancia solo es válida si el contrato de salida declara explícitamente que esa forma ya es asintótica y no exacta.
- logs, polinomios, exponenciales y constantes deben conservar su relación matemática real; no se permite colapsar `n log n` a `n` ni `n + log n` a `n` dentro de la forma exacta publicada.
- SymPy puede ejecutar simplificación simbólica general, pero el contrato final solo acepta resultados que el motor pueda mapear a una transformación conocida y defendible.
- las reglas propias del motor prevalecen sobre cualquier simplificación agresiva de biblioteca si esa simplificación oculta estructura relevante del análisis.

### Contrato de `loopInvariant`

- `loopInvariant` es un artefacto auxiliar pedagógico asociado al ciclo principal seleccionado por el motor.
- un `loopInvariant` correcto, a efectos contractuales, es un objeto estructuralmente válido y coherente con el AST seleccionado; no certifica prueba formal completa del algoritmo.
- si falla su generación, el resultado principal del análisis sigue siendo válido y `loopInvariant` debe ausentarse o marcarse como no disponible; no debe degradar artificialmente `T_open`, `T_polynomial` ni notaciones.
- `loopInvariant` no altera la complejidad calculada; acompaña el análisis, no lo gobierna.

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
- `T_open` es la fuente contractual para `T_polynomial` y notaciones posteriores;
- ningún artefacto auxiliar puede contradecir el resultado principal de `totals`.
- las reglas de simplificación exacta y las reglas de dominancia asintótica no deben mezclarse en una misma salida sin marcar el cambio de nivel semántico.

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
