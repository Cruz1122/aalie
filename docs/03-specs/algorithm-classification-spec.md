# Especificación de clasificación de algoritmos

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/classification/classifier.py`, `apps/api/app/modules/classification/service.py`, `apps/web/src/features/analyzer/technique-detection/`, `apps/web/src/features/analyzer/technique-detection/types.ts`, `apps/web/src/lib/examples/catalog.ts`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** Sección 2.4 (clasificación), Sección 4 (técnicas pedagógicas)

---

## Propósito

Definir los dos niveles de clasificación que AALIE aplica a los algoritmos — **tipo algorítmico** (técnico, para enrutamiento del análisis formal) y **técnica pedagógica** (didáctico, para UI y catalogación) — y establecer qué técnicas tienen soporte analítico real vs. solo clasificación pedagógica.

## Alcance

Aplica al endpoint `POST /classify`, al clasificador interno `detect_algorithm_kind()`, al detector de técnicas `detectTechniqueFromAst()` (frontend), al catálogo de ejemplos, y a la distinción entre clasificación para análisis formal y clasificación para visualización pedagógica.

## Fuera de alcance

- Análisis de complejidad en sí mismo (cubierto por `analysis-engine-spec.md`, `iterative-analysis-spec.md`, `recurrence-methods-spec.md`)
- Heurísticas WHILE (cubierto por `while-heuristics-spec.md`)
- Contenido del catálogo de ejemplos (cubierto por `examples-catalog-spec.md`)

## Contenido

### 1. Dualidad de clasificación

AALIE mantiene **dos sistemas de clasificación independientes**:

| Sistema | Propósito | Dónde se ejecuta | Uso |
|---|---|---|---|
| **Tipo algorítmico** (técnico) | Determinar qué motor de análisis usar | Backend (Python), `detect_algorithm_kind()` | Enrutamiento a `IterativeAnalyzer` o `RecursiveAnalyzer` |
| **Técnica pedagógica** (didáctico) | Clasificar para UI, badges, contenido | Frontend (TypeScript), `detectTechniqueFromAst()` | Catálogo de ejemplos, badges, explicaciones |

**Regla fundamental:**
- Si una técnica existe solo en el catálogo o en la UI pero **no tiene implementación analítica en el backend**, se marca como **"pedagógica / no analítica"**.
- No debe afirmarse soporte de análisis formal para técnicas como `backtracking`, `branch_and_bound`, o `greedy` a menos que el backend implemente explícitamente su análisis.

### 2. Tipo algorítmico (backend)

#### Valores posibles

```typescript
type AlgorithmKind = "iterative" | "recursive" | "hybrid" | "unknown";
```

#### Algoritmo de clasificación (`detect_algorithm_kind`)

```
1. Buscar construcciones iterativas (For, While, Repeat) en el AST
   → has_iterative = true si encuentra alguna

2. Buscar el primer ProcDef en Program.body
   → Si existe, buscar llamadas recursivas (Call con callee = proc_name)
   → has_recursive = true si encuentra al menos una

3. Clasificar:
   has_iterative && has_recursive → "hybrid"
   has_recursive                  → "recursive"
   has_iterative                  → "iterative"
   else                           → "unknown"
```

#### Mapeo a analizadores

| Tipo | Analizador | Comportamiento |
|---|---|---|
| `iterative` | `IterativeAnalyzer` | Análisis línea-por-línea con visitors |
| `recursive` | `RecursiveAnalyzer` | Extracción de recurrencia + método |
| `hybrid` | `RecursiveAnalyzer` | Prioriza extracción de recurrencia |
| `unknown` | `IterativeAnalyzer` (fallback) | Análisis iterativo por defecto |

#### Llamadas recursivas detectadas

Se detectan nodos `Call` donde el `callee` coincide (case-insensitive) con el nombre del procedimiento que las contiene. Esto cubre:
- Recursión directa: `f() { ... CALL f(...) ... }`
- Recursión dentro de IF, FOR, WHILE, etc.

No se detecta:
- Recursión indirecta (f → g → f) — el clasificador actual es de un solo paso.
- Recursión mutua entre procedimientos.

#### Invariante

- La clasificación es **puramente estructural** (basada en AST). No depende de nombres, etiquetas ni metadatos.
- El tipo se determina antes del análisis y no cambia durante el análisis.
- El usuario puede **sobreescribir** el tipo detectado mediante `algorithm_kind` en el request.

### 3. Técnica pedagógica (frontend)

#### Valores posibles (`TechniqueId`)

```typescript
type TechniqueId =
  | "branch_and_bound"        // pedagógica / no analítica
  | "dp_top_down"             // pedagógica / con validación analítica parcial
  | "dp_bottom_up"            // pedagógica / con validación analítica parcial
  | "backtracking"            // pedagógica / no analítica
  | "divide_and_conquer"      // pedagógica + analítica (divide_conquer recurrence)
  | "decrease_and_conquer"    // pedagógica + analítica (linear_shift recurrence, a=1)
  | "decrease_and_get_conquered" // pedagógica + analítica (linear_shift multi-branch)
  | "greedy"                  // pedagógica / no analítica
  | "iterative"               // pedagógica + analítica (IterativeAnalyzer)
  | "unknown";                // no clasificado
```

#### Matriz de soporte analítico

| TechniqueId | Soporte analítico | Motor de análisis |
|---|---|---|
| `iterative` | **Sí** | `IterativeAnalyzer` |
| `divide_and_conquer` | **Sí** | `RecursiveAnalyzer` con recurrencia `divide_conquer` |
| `decrease_and_conquer` | **Sí** | `RecursiveAnalyzer` con recurrencia `linear_shift` (rama única) |
| `decrease_and_get_conquered` | **Sí** | `RecursiveAnalyzer` con recurrencia `linear_shift` (multi-rama) |
| `dp_top_down` | Parcial | `RecursiveAnalyzer` + `characteristic_equation` + `dp_validation` |
| `dp_bottom_up` | Parcial | `RecursiveAnalyzer` + `characteristic_equation` + `dp_validation` |
| `greedy` | **No** | Solo clasificación pedagógica |
| `backtracking` | **No** | Solo clasificación pedagógica |
| `branch_and_bound` | **No** | Solo clasificación pedagógica |
| `unknown` | No | Clasificación fallida |

#### Algoritmo de detección (`detectTechniqueFromAst`)

```
1. Normalizar e indexar nodos AST.
2. Recolectar hechos estructurales globales (una sola pasada).
3. Evaluar reglas de puntuación sobre los hechos recolectados.
4. Seleccionar la regla con mayor puntuación.
5. Degradar confianza si hay ambigüedad fuerte (runner-up con score cercano).
6. Construir paquete de evidencia pedagógica para consumo UI.
```

**Reglas de puntuación implementadas:**

| Regla | Señales clave |
|---|---|
| `divide_and_conquer` | Múltiples llamadas recursivas, tamaños fraccionales, merge/partition |
| `decrease_and_conquer` | Una llamada recursiva, tamaño n-1 o n-k |
| `decrease_and_get_conquered` | Múltiples llamadas recursivas con tamaño n-1, n-2 |
| `iterative` | Bucles FOR/WHILE/REPEAT, sin llamadas recursivas |
| `dp_top_down` | Almacenamiento en memoria (memoization), llamadas recursivas con tabla |
| `dp_bottom_up` | Llenado de tabla iterativo, acceso a estados previos |
| `greedy` | Elección local óptima, sin backtracking ni exploración |
| `backtracking` | Mutación + exploración recursiva + deshacer (undo) |
| `branch_and_bound` | Backtracking + poda/cota (bound/prune) |
| `unknown` | Fallback cuando ninguna regla gana |

#### Evidencia pedagógica

Cada resultado incluye:
- `technique`: TechniqueId
- `confidence`: "high" | "medium" | "low"
- `score`: número (puntuación de la regla ganadora)
- `secondarySignals`: señales de técnicas secundarias detectadas
- `evidence.compactSnippet`: resumen compacto para UI
- `evidence.items`: ítems de evidencia con role, nodeId, range
- `evidence.explanationFacts`: hechos explicativos
- `diagnostics`: advertencias y diagnósticos

#### Roles de evidencia

```typescript
type EvidenceRole =
  | "base_case"    | "split"       | "partition"    | "recursive_call"
  | "combine"      | "memo_read"   | "memo_write"   | "state_init"
  | "transition"   | "choice"      | "mutation"     | "undo"
  | "bound"        | "prune"       | "commit"       | "loop";
```

### 4. Badges del catálogo de ejemplos

El catálogo (`apps/web/src/lib/examples/catalog.ts`) usa badges para clasificación pedagógica:

| Badge | Significado |
|---|---|
| `ITER` | Iterativo |
| `DyV` | Divide y Vencerás |
| `RyV` | Resta y Vencerás (decrease and conquer, rama única) |
| `RySV` | Resta y Serás Vencido (decrease and get conquered, multi-rama) |
| `PD-TD` | Programación Dinámica Top-Down |
| `PD-BU` | Programación Dinámica Bottom-Up |
| `GREEDY` | Algoritmo Goloso |
| `BT` | Backtracking |
| `B&B` | Branch and Bound |
| `ACCUM` | Acumulador |
| `SORT` | Ordenamiento |
| `SEARCH` | Búsqueda |
| `FLAG` | Bandera / flag |
| `WHILE` | Bucle WHILE |
| `NESTED` | Bucles anidados |
| `TABLE` | Uso de tabla/arreglo auxiliar |
| `MEMO` | Memoización |
| `UNDO` | Deshacer (backtracking) |
| `BOUND` | Cota (branch and bound) |

La presencia de un badge **no implica** que el motor de análisis soporte formalmente la técnica.

### 5. Técnicas pedagógicas sin soporte analítico

Las siguientes técnicas existen en la UI y el catálogo pero **no tienen motor de análisis dedicado** en el backend:

| Técnica | Qué hace el motor actual | Limitación |
|---|---|---|
| **Greedy** | El análisis cae a `IterativeAnalyzer` (cuenta líneas) o `RecursiveAnalyzer` (si hay recursión). No hay validación de optimalidad greedy ni de propiedad de subestructura óptima. | No se verifica que la estrategia greedy sea correcta ni se analiza su optimalidad. |
| **Backtracking** | El análisis cae a `RecursiveAnalyzer` (si hay recursión) con posible DP validation. No se modela el espacio de búsqueda ni la poda. | No hay análisis del árbol de búsqueda, ni cotas ajustadas para backtracking. |
| **Branch and Bound** | Similar a backtracking. No se detectan cotas inferiores/superiores ni funciones de poda. | No hay análisis formal de la poda ni certificación de optimalidad. |
| **DP (top-down / bottom-up)** | El `characteristic_equation` method puede detectar estructura lineal recurrente y generar `dp_validation_events`. No hay análisis completo de subestructura óptima. | La validación DP (`dp_validation`) es conservadora y reporta confianza. No se garantiza optimalidad DP. |

### 6. Relación entre clasificación y análisis

```
       Clasificación técnica (backend)      Clasificación pedagógica (frontend)
              │                                        │
              ▼                                        ▼
     Tipo algorítmico                            TechniqueId
     (iterative/recursive/hybrid)                (divide_and_conquer, greedy, ...)
              │                                        │
              ▼                                        ▼
     Selección de analyzer                       UI: badges, filtros,
     (IterativeAnalyzer /                             explicaciones,
      RecursiveAnalyzer)                               contenido
              │
              ▼
     Análisis formal
     (T_open, O/Ω/Θ)
```

- La clasificación técnica es **necesaria** para el análisis.
- La clasificación pedagógica es **opcional** para la UI y contenido; no afecta el resultado del análisis.

## Contrato

1. `detect_algorithm_kind` retorna uno de los cuatro valores: `"iterative"`, `"recursive"`, `"hybrid"`, `"unknown"`.
2. La clasificación técnica se basa únicamente en tipos de nodos AST (For, While, Repeat, Call).
3. La clasificación pedagógica se basa en reglas de puntuación sobre hechos estructurales del AST.
4. Una técnica pedagógica **sin soporte analítico** debe declararse explícitamente como tal en la documentación.
5. El catálogo de ejemplos puede asociar múltiples `techniqueBadges` a un ejemplo, combinando badges técnicos y pedagógicos.

## Invariantes

- La clasificación técnica es un subconjunto de la información disponible en la clasificación pedagógica: todo algoritmo `iterative` será `iterative` también como techniqueId.
- La clasificación pedagógica puede asignar `divide_and_conquer` a un algoritmo que técnicamente es `recursive`.
- `"unknown"` como tipo técnico no implica `"unknown"` como técnica pedagógica (puede tener señales débiles).
- Los valores de `TechniqueId` no crecen sin actualizar este spec; toda nueva técnica requiere revisión de este documento.

## Errores esperables

| Condición | Resultado |
|---|---|
| AST vacío o inválido | `detect_algorithm_kind` → no clasifica |
| Sin `ProcDef` en el AST | `has_recursive = false` (no se busca recursión fuera de procedimientos) |
| Múltiples procedimientos | Solo se analiza el primer `ProcDef` para recursión |
| Técnica pedagógica sin evidencia suficiente | `technique: "unknown"`, `confidence: "low"` |

## Casos soportados

### Clasificación técnica

| Pseudocódigo | Tipo |
|---|---|
| `suma() BEGIN FOR i ... END` | `iterative` |
| `factorial(n) BEGIN IF n=0 THEN 1 ELSE n*factorial(n-1) END` | `recursive` |
| `sort(A,n) BEGIN FOR i ... CALL sort(...) END` | `hybrid` |
| `x = 5;` (sin procedimiento ni bucles) | `unknown` |

### Clasificación pedagógica

| Pseudocódigo | TechniqueId |
|---|---|
| `mergesort(A,n) BEGIN ... CALL mergesort(...) END` | `divide_and_conquer` |
| `factorial(n) BEGIN ... CALL factorial(n-1) END` | `decrease_and_conquer` |
| `fib(n) BEGIN ... CALL fib(n-1) + fib(n-2) END` | `decrease_and_get_conquered` |
| `suma(A,n) BEGIN FOR i ... END` | `iterative` |

## Casos no soportados

- No se detecta recursión indirecta (f → g → f).
- No se detectan técnicas como "aleatorizado", "probabilístico", "aproximación".
- No hay análisis formal para greedy, backtracking, ni branch and bound.
- `dp_top_down` y `dp_bottom_up` tienen validación analítica parcial (solo para recurrencias lineales detectables por `characteristic_equation`).

## Evidencia desde código o configuración

- **Classifier backend:** `apps/api/app/modules/classification/classifier.py` (205 líneas) — `detect_algorithm_kind()`.
- **Service:** `apps/api/app/modules/classification/service.py` (79 líneas) — `classify_algorithm()`.
- **Registry:** `apps/api/app/modules/analysis/analyzers/registry.py` — mapeo de tipo a clase analizadora.
- **Types (frontend):** `apps/web/src/features/analyzer/technique-detection/types.ts` — `TechniqueId`, `TechniqueDetectionResult`.
- **Reglas:** `apps/web/src/features/analyzer/technique-detection/rules/` — implementaciones de cada técnica.
- **Catálogo:** `apps/web/src/lib/examples/catalog.ts` — more than 50 ejemplos con `techniqueBadges`.

## Limitaciones

- El clasificador técnico no distingue entre recursión directa e indirecta.
- El clasificador pedagógico no tiene acceso a la semántica del programa; solo a la estructura sintáctica.
- Técnicas como greedy, backtracking, y branch and bound existen solo a nivel pedagógico — no deben citarse como analíticamente soportadas.
- La validación DP (`characteristic_equation` + `dp_validation_events`) reporta confianza y puede rechazar falsos positivos, pero no certifica optimalidad.
- No existe clasificación de "técnica mixta" — un algoritmo solo recibe una `TechniqueId`.

## Archivos relacionados

- `analysis-engine-spec.md` — pipeline que usa la clasificación técnica
- `technique-detection-spec.md` — spec del detector pedagógico (frontend)
- `iterative-analysis-spec.md` — análisis de iterativos
- `recurrence-methods-spec.md` — análisis de recursivos
- `examples-catalog-spec.md` — catálogo de ejemplos con badges
- `pseudocode-grammar-spec.md` — gramática fuente del AST
