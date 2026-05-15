# Especificación de detección de técnicas algorítmicas

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `packages/web/src/lib/analysis/technique-detector.ts`, `apps/api/app/modules/classification/classifier.py`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** Sección 2.2 — Clasificación de técnicas

## Propósito

Definir cómo AALIE detecta y clasifica técnicas algorítmicas, la distinción entre clasificación técnica (basada en AST) y etiquetas pedagógicas, y qué técnicas tienen soporte formal del motor de análisis frente a cuáles son solo etiquetas pedagógicas.

## Decision Surface

The technique detector classifies algorithms from structural AST evidence, not from names, slugs, or catalog metadata.

## Distinción fundamental

AALIE opera con dos niveles de clasificación:

### (a) Clasificación técnica (formal, basada en AST)

Determinista, basada en el análisis estructural del código fuente. Produce el `algorithmType` que selecciona el analizador:

| Tipo técnico | Criterio | Analizador |
|---|---|---|
| `iterative` | Presencia de FOR, WHILE o REPEAT; ausencia de llamadas recursivas | `IterativeAnalyzer` |
| `recursive` | Presencia de llamada recursiva (Call con nombre = nombre del procedimiento) | `RecursiveAnalyzer` |
| `hybrid` | Presencia tanto de construcciones iterativas como llamadas recursivas | `RecursiveAnalyzer` |
| `dummy` | Pseudocódigo sin operaciones reales (solo declaraciones, prints, etc.) | `IterativeAnalyzer` (simplificado) |
| `unknown` | No se pudo clasificar | `IterativeAnalyzer` (default) |

Esta clasificación es ejecutada por `detect_algorithm_kind()` en `apps/api/app/modules/classification/classifier.py`.

### (b) Etiquetas pedagógicas de técnica (para UI y catalog)

Etiquetas de alto nivel que describen la técnica algorítmica desde una perspectiva pedagógica. Se usan en el catálogo de ejemplos (`examples-catalog-spec.md`), la UI y la guía de usuario.

## Main Pipeline

1. Normalize and index AST nodes.
2. Collect global structural facts once.
3. Evaluate scoring rules over the collected facts.
4. Pick the strongest rule, degrade confidence on strong ambiguity.
5. Build a pedagogical evidence bundle for UI consumption.

## Required Output

`detectTechniqueFromAst(ast)` returns:

- `technique`: string — técnica detectada
- `confidence`: number — 0.0 a 1.0
- `score`: number — puntaje de la regla ganadora
- `secondarySignals`: string[] — señales secundarias detectadas
- `evidence.compactSnippet`: string — fragmento de código relevante
- `evidence.items`: array — ítems de evidencia
- `evidence.explanationFacts`: array — hechos para explicación pedagógica
- `diagnostics`: array — diagnóstico interno

## Técnicas con soporte formal del motor de análisis

Estas técnicas tienen soporte en el motor de análisis (pueden generar análisis de complejidad real):

| Técnica | Soporte del motor | Descripción |
|---|---|---|
| `iterative` (FOR/WHILE) | Completo | `IterativeAnalyzer` con todos los visitors |
| `recursive` (divide and conquer) | Completo | `RecursiveAnalyzer` con Master Theorem, recursion tree, iteration |
| `linear_shift` (resta) | Completo | `RecursiveAnalyzer` con characteristic equation, iteration |
| `divide_and_conquer` | Completo | Detectado como `divide_conquer` recurrence family; Master Theorem, recursion tree |
| `dynamic_programming` | Parcial | `RecursiveAnalyzer` con detección de storage (memoization). La metadata de PD es auxiliar. No reemplaza el método principal de complejidad. |

### Divide and Conquer
- Modelado como descomposición k-way.
- Recurrencia de familia `divide_conquer`: `T(n) = a·T(n/b) + f(n)`.
- Soporte completo via `RecursiveAnalyzer`: Master Theorem (3 casos), recursion tree, iteration method.
- El engine detecta parámetros a, b, f(n) desde el AST.

### Dynamic Programming
- Requiere evidencia de storage-shape (acceso a estructura de almacenamiento), no solo cualquier acceso a arreglo.
- El `RecursiveAnalyzer` detecta patrones de memoization y emite metadata de PD.
- La metadata de PD es auxiliar y no reemplaza el método principal de complejidad.
- Ejemplo: Fibonacci con memoization → `T(n) = T(n-1) + Θ(1)` (lineal), no exponencial.

## Técnicas pedagógicas sin soporte formal de análisis

Estas técnicas son etiquetas pedagógicas. El motor de AALIE **no** tiene soporte formal para analizar su complejidad. Se detectan por heurísticas de AST (estructura, señales) pero el análisis formal de complejidad depende de los analizadores iterativo/recursivo subyacentes:

| Técnica | Estado | Criterio de detección (AST) |
|---|---|---|
| `greedy` | **Solo etiqueta pedagógica** | Elección greedy detectable por patrón de selección local sin backtracking. No hay motor de optimalidad greedy. Se mantiene conservador y no debe ganar en transiciones partition-like o stateful. |
| `backtracking` | **Solo etiqueta pedagógica** | Requiere mutación + exploración recursiva + deshacer (undo). Detectable por presencia de asignación + llamada recursiva + reasignación. El análisis de complejidad resultante es el del motor recursivo (puede producir O(2^n) o O(n!)). |
| `branch_and_bound` | **Solo etiqueta pedagógica** | Requiere lo de backtracking + evidencia de bound/poda (prune). La poda no se modela formalmente. El análisis asume worst case sin poda. |
| `divide_and_conquer` | Completo (ver arriba) | Clasificación técnica también, con soporte completo. |
| `dynamic_programming` | Parcial (ver arriba) | Metadata auxiliar; análisis formal via recursivo subyacente. |

### Greedy
- No hay motor de optimalidad greedy: AALIE no verifica la propiedad de subestructura óptima ni la elección greedy.
- La etiqueta se asigna por heurística estructural (selección local, sin backtracking).
- El análisis de complejidad corresponde al tipo técnico subyacente (iterativo o recursivo).
- Regla: no debe ganar en algoritmos partition-like o stateful (como ordenamiento o búsqueda en espacio de estados).

### Backtracking
- Detectado por patrón: asignación de estado → llamada recursiva → deshacer estado.
- Ejemplo típico: N-Queens, subset sum, permutaciones.
- Sin poda modelada, el análisis reporta worst case exponencial.
- La confianza de la detección se degrada si no hay evidencia clara de undo.

### Branch and Bound
- Requiere todo lo de backtracking + evidencia de bound/prune.
- La poda no se modela formalmente: el análisis asume worst case sin poda.
- La etiqueta es informativa para el estudiante; el análisis no refleja la mejora real de branch and bound.

## Structural Constraints

- Divide and Conquer is modeled as k-way decomposition.
- Recursive classification distinguishes co-executed calls from mutually exclusive calls.
- Dynamic programming requires storage-shape evidence, not just any array access.
- Greedy stays conservative and should not win on partition-like or stateful transitions.
- Backtracking requires mutation plus recursive exploration plus undo.
- Branch and Bound requires the above plus bound/prune evidence.

## Performance Goals

- One node index build per AST.
- One global fact collection pass per AST.
- Rules operate over facts, not over full AST traversals.
- Evidence rendering is capped to a small, UI-friendly payload.

## Evidencia

La detección de técnica es independiente del análisis de complejidad. Un algoritmo puede:
1. Tener una etiqueta pedagógica (ej. `greedy`) pero ser analizado como iterativo simple.
2. Tener etiqueta `backtracking` pero el análisis reporta complejidad exponencial (sin poda).
3. Tener etiqueta `divide_and_conquer` y análisis formal completo via Master Theorem.

## Casos soportados

1. **Bubble Sort**: técnico = `iterative`, pedagógico = `iterative` (sin etiqueta especial).
2. **Merge Sort**: técnico = `recursive`, pedagógico = `divide_and_conquer`.
3. **Fibonacci ingenuo**: técnico = `recursive`, pedagógico = `recursive` (linear_shift).
4. **N-Queens**: técnico = `recursive`, pedagógico = `backtracking`.
5. **Knapsack (greedy)**: técnico = `iterative`, pedagógico = `greedy`.
6. **Knapsack (DP)**: técnico = `recursive` o `iterative`, pedagógico = `dynamic_programming`.
7. **Branch and Bound (TSP)**: técnico = `recursive`, pedagógico = `branch_and_bound`.

## Casos no soportados

1. Verificación formal de optimalidad greedy.
2. Modelado cuantitativo de poda en branch and bound.
3. Análisis de complejidad específico para backtracking (usa worst case del motor subyacente).

## Archivos relacionados

- `algorithm-classification-spec.md`
- `analysis-engine-spec.md`
- `recurrence-methods-spec.md`
- `examples-catalog-spec.md`
- `../02-architecture/analysis-engine-architecture.md`
