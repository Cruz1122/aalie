# Especificación del motor de análisis

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/analysis/service.py`, `apps/api/app/modules/analysis/analyzers/`, `apps/api/app/modules/classification/classifier.py`, `packages/types/src/index.ts`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** Sección 2.3 (análisis), Sección 3 (pipeline), Apéndice C (contratos de datos)

---

## Propósito

Definir el pipeline contractual del motor de análisis, la forma mínima de sus salidas, los contratos de `T_open`, `T_polynomial` y notaciones asintóticas, y el manejo de casos (worst/best/average).

## Alcance

Aplica a `analyze_algorithm`, `detect_methods`, `detect_algorithm_kind`, analyzers iterativos (`IterativeAnalyzer`) y recursivos (`RecursiveAnalyzer`), generación de `loopInvariant` y `recursiveInvariant`, selección de casos, y modelos de caso promedio.

## Fuera de alcance

- Gramática y parseo (cubierto por `pseudocode-grammar-spec.md` y `ast-schema.md`)
- Heurísticas WHILE (cubierto por `while-heuristics-spec.md`)
- Métodos de recurrencia (cubierto por `recurrence-methods-spec.md`)
- Trazas de ejecución (cubierto por `execution-trace-spec.md`)
- Export (cubierto por `export-engine-spec.md` y `report-snapshot-spec.md`)

## Contenido

### 1. Pipeline completo

```
source (string)
  → parse (ANTLR4 → CST → AST canónico)
  → detect_algorithm_kind (classifier: iterative/recursive/hybrid/unknown)
  → analyze (strategy pattern: IterativeAnalyzer | RecursiveAnalyzer)
    → by_line_counts (multiplicidad por línea)
    → T_open (suma simbólica con constantes C_k)
    → SymPy closure (simplificación de sumatorias)
    → T_polynomial (forma cerrada reducida)
    → ComplexityClasses (O, Ω, Θ)
    → loopInvariant (artefacto pedagógico, paralelo)
  → snapshot (export/UI)
```

### 2. Estrategia de análisis (`AnalyzerRegistry`)

```
AnalyzerRegistry = {
  "iterative": IterativeAnalyzer,
  "recursive": RecursiveAnalyzer,
  "hybrid": RecursiveAnalyzer,  // híbridos usan RecursiveAnalyzer
}
```

- `detect_algorithm_kind` clasifica por presencia de construcciones iterativas (FOR, WHILE, REPEAT) vs llamadas recursivas (Call con nombre = nombre del procedimiento).
- `"unknown"` cae a `IterativeAnalyzer` por defecto.
- Los híbridos se analizan con `RecursiveAnalyzer` (se prioriza la extracción de recurrencia).

### 3. Contrato de `T_open`

```
T_open(n) = Σ C_k · count_k(n)
```

- **Definición:** Expresión simbólica abierta de costo total construida por el motor antes del cierre algebraico final. Su dominio es el de expresiones sobre tamaño de entrada, contadores de iteración, sumatorias y constantes de costo por línea.
- **Preserva estructura analítica:** puede contener sumatorias, productos de multiplicidad y términos todavía no simplificados.
- **Las constantes `C_k`** representan costos elementales y se preservan simbólicamente en `T_open`.
- **Formato de salida:** string KaTeX (ej. `C_1 \cdot n + C_2 \cdot (n+1) + C_3 \cdot n`).
- **En modo `avg`, se denomina `A(n)`** (average case) en lugar de `T_open`.
- **Si hay bucles unbounded,** `T_open` retorna `\infty`.

### 4. Contrato de `T_polynomial`

- **Definición:** Forma cerrada o más reducida derivada de `T_open` cuando el motor logra simplificación defendible.
- **No exige ser literalmente un polinomio;** el nombre es histórico. Contractualmente representa la mejor forma simplificada estable que el motor puede publicar sin inventar pasos.
- **Relación obligatoria:** `T_polynomial` solo puede derivarse de `T_open` por transformaciones simbólicas defendibles y trazables; nunca por recomputación independiente del algoritmo.
- **Solo se publica cuando todos los bloques de loop tienen cierre exacto** (`_can_publish_exact_polynomial()`).
- Si hay WHILE con estado `partial` o `unknown`, `T_polynomial` se omite (es `null`/`None`).
- Si hay bucles unbounded, `T_polynomial` = `\infty`.

### 5. Notaciones asintóticas (O, Ω, Θ)

- Se derivan de `T_open` (no de `T_polynomial`) usando `ComplexityClasses`.
- **Flujo:** `T_open` (SymPy Expr) → `ComplexityClasses.calculate_big_O`, `.calculate_big_Omega`, `.calculate_big_Theta`.
- **Casos especiales:**
  - Euclides (patrón `euclid_mod`): `O(log(min(a,b)))`, `Ω(1)`, `Θ(log(min(a,b)))`.
  - Sin variable de tamaño y bucle acotado: `O(1)`, `Ω(1)`, `Θ(1)`.
  - Bloques WHILE parciales con iteraciones logarítmicas: `O(log(n))`, `Ω(1)`, `Θ(log(n))`.
  - WHILE parcial con cota constante: `O(1)`, `Ω(1)`, `Θ(1)`.

#### Reglas de simplificación asintótica vs algebraica

| Operación | Permitida en T_open | Permitida en T_polynomial | Permitida en O/Ω/Θ |
|---|---|---|---|
| Expansión algebraica | Sí | Sí | No corresponde |
| Factorización | Sí | Sí | No corresponde |
| Evaluación de sumatorias | Sí | Sí | No corresponde |
| Cancelación de términos | Sí | Sí | No corresponde |
| Eliminar términos dominados | No | Solo si se declara asintótico | Sí |
| Colapsar n log n → n | No | No | No |
| Colapsar n + log n → n | No | No | Solo en O/Ω/Θ |

- Las reglas del motor prevalecen sobre cualquier simplificación agresiva de biblioteca si esa simplificación oculta estructura relevante del análisis.
- SymPy puede ejecutar simplificación simbólica general, pero el contrato final solo acepta resultados que el motor pueda mapear a una transformación conocida y defendible.

### 6. Casos de análisis (worst, best, avg, all)

#### Modo `mode="single"` (worst, best, avg individualmente)

- `analyze_algorithm` retorna `AnalyzeOpenResponse`.
- `mode="avg"` requiere modelo probabilístico. Si no se provee, se usa `{mode: "uniform", predicates: {}}`.

#### Modo `mode="all"`

- Retorna `AnalyzeAllCasesResponse`.
- Ejecuta tres análisis independientes con analizadores separados.
- Si `worst == best` (misma `T_open` y `recurrence`), se considera **determinístico**:
  - `best = "same_as_worst"`
  - `avg = "same_as_worst"` (sin modelo probabilístico)
- Si hay variabilidad:
  - `best` tiene su propio resultado.
  - `avg` se calcula con modelo probabilístico (por defecto uniforme).
  - Si `avg` falla, se omite (no se incluye en la respuesta).

#### Soporte de caso promedio (`avg`)

| Condición | Comportamiento |
|---|---|
| Algoritmo determinístico (worst = best) | `avg = "same_as_worst"` |
| `avgMode = "uniform"` (por defecto) | Cada predicado de condición tiene probabilidad uniforme \(p = \frac{1}{2}\) |
| `avgMode = "symbolic"` | Probabilidades explícitas en `predicates` map |
| Sin modelo probabilístico | `{mode: "uniform", predicates: {}}` |
| Algoritmo recursivo con poda | `avg` se omite si la variabilidad no es modelable |

### 7. Uniform cost model

- **Cada operación elemental tiene costo 1.**
- Operaciones elementales:
  - Asignación: 1
  - Operación aritmética (+, -, *, /, DIV, MOD): 1 cada una
  - Comparación (=, !=, <, <=, >, >=): 1
  - Acceso a arreglo (A[i]): 1
  - Field access (obj.campo): 1
  - Llamada a función: 1 + argumentos
  - Return: 1 + expresión
  - Print: 1 + argumentos
- Las constantes simbólicas `C_k` se asignan por línea y se preservan en `T_open`.
- En la simplificación final, `C_k` se sustituyen por 1 para el cálculo de notaciones asintóticas.

### 8. Loop Invariant

- **`loopInvariant`** es un artefacto auxiliar pedagógico asociado al ciclo principal seleccionado por el motor.
- Se genera mediante `generate_loop_invariant()` en `apps/api/app/modules/analysis/invariants/`.
- Un `loopInvariant` correcto, a efectos contractuales, es un objeto estructuralmente válido y coherente con el AST seleccionado; **no certifica prueba formal completa del algoritmo.**
- Si falla su generación, el resultado principal del análisis sigue siendo válido y `loopInvariant` debe marcarse como no disponible.
- `loopInvariant` no altera la complejidad calculada; acompaña el análisis, no lo gobierna.

Estados del invariante:

| Estado | Significado |
|---|---|
| `"ok"` | Invariante generado satisfactoriamente |
| `"unavailable"` | No se pudo generar (fallo interno o loop no soportado) |
| `"low_confidence"` | Invariante generado pero con baja confianza |

### 9. Recursive Invariant

- **`recursiveInvariant`** es un artefacto pedagógico para algoritmos recursivos (generado en `RecursiveAnalyzer`).
- Contiene: `recursiveStructure` (baseCondition, baseResult, recursiveCallPattern), `invariant` (baseProperty, inductiveHypothesis, recursiveStep, terminationGuarantee), `confidence` (0.0 a 1.0).
- Se genera después del análisis principal; si falla, se omite sin degradar el resultado.

Estados:

| Estado | Significado |
|---|---|
| `"ok"` | Invariante generado |
| `"unavailable"` | No aplicable (ej. sin llamadas recursivas) |
| `"low_confidence"` | Invariante con evidencia insuficiente |

## Inputs

```typescript
AnalyzeRequest {
  source: string;                             // pseudocódigo fuente
  mode?: "worst" | "best" | "avg" | "all";   // default "worst"
  avgModel?: {
    mode: "uniform" | "symbolic";
    predicates?: Record<string, string>;      // ej. "A[j] > A[j+1]": "1/2"
  };
  algorithm_kind?: "iterative" | "recursive" | "hybrid" | "unknown";
  preferred_method?: "master" | "iteration" | "recursion_tree" | "characteristic_equation";
  locale?: "en" | "es";                      // default "en"
}
```

## Outputs

```typescript
AnalyzeOpenResponse {
  ok: true;
  byLine: LineCost[];           // tabla línea por línea
  loopInvariant?: LoopInvariant;
  recursiveInvariant?: RecursiveInvariant;
  totals: {
    T_open: string;             // Σ C_k · count_k (KaTeX)
    T_polynomial?: string;      // forma polinómica (opcional)
    big_o: string;              // O(...)
    big_omega: string;          // Ω(...)
    big_theta: string;          // Θ(...)
    A_of_n?: string;            // alias de T_open para avg
    avg_model_info?: {          // info del modelo probabilístico
      mode: string;
      note: string;
    };
    symbols?: Record<string, string>;   // mapeo de símbolos
    notes?: string[];           // reglas aplicadas
    recurrence?: object;        // solo para recursivos
    master?: object;            // solo para Teorema Maestro
    iteration?: object;         // solo para iteración
    recursion_tree?: object;    // solo para árbol
    characteristic_equation?: object;  // solo para ec. característica
    proof?: array;              // pasos de prueba
    step_by_step?: AnalysisStepBundle;  // walkthrough tipado
    whileBlocks?: WhileBlockView[];  // bloques WHILE
    dp_validation_events?: array;   // eventos de validación DP
    hypotheses?: string[];      // hipótesis para avg simbólico
  };
}

AnalyzeAllCasesResponse {
  ok: true;
  has_case_variability: boolean;
  loopInvariant?: LoopInvariant;
  worst: AnalyzeOpenResponse;
  best: AnalyzeOpenResponse | "same_as_worst";
  avg?: AnalyzeOpenResponse | "same_as_worst";
}

AnalyzeError {
  ok: false;
  errors: { message: string; line?: number; column?: number }[];
}
```

## Contrato

1. Parseo exitoso es prerrequisito para el análisis.
2. `detect_algorithm_kind` precede a la selección del analizador.
3. `loopInvariant` se calcula una vez por AST y se adjunta aun cuando el resultado sea parcial.
4. En algoritmos determinísticos, `best` y `avg` se resuelven como `"same_as_worst"`.
5. El motor puede retornar estados parciales o `unsupported` en subartefactos sin inventar conclusión total.
6. `T_open` es la fuente contractual para `T_polynomial` y notaciones posteriores.
7. Ningún artefacto auxiliar puede contradecir el resultado principal de `totals`.
8. Las reglas de simplificación exacta y las reglas de dominancia asintótica no deben mezclarse en una misma salida sin marcar el cambio de nivel semántico.
9. **Misma entrada → mismo resultado** (determinismo, no LLM involvement en análisis formal).
10. Si ocurre una excepción interna, se retorna `AnalyzeError` con mensaje descriptivo.

## Invariantes

- El análisis es **100% determinista**: no depende de LLM, random seed, ni estado global mutable entre requests.
- `IterativeAnalyzer` usa `Counter` para generar constantes `C_k` secuenciales (C_1, C_2, ...).
- `RecursiveAnalyzer` usa SymPy `rsolve` para resolver recurrencias lineales.
- Los invariantes (loop y recursive) son opcionales; su fallo no degrada el análisis principal.
- `ComplexityClasses` calcula notaciones desde expresión SymPy, no desde strings LaTeX frágiles.

## Errores esperables

| Condición | Código/Estado |
|---|---|
| Parseo inválido | `ok: false`, `errors` con detalles |
| AST ausente | `ok: false`, error descriptivo |
| Método preferido inválido | `ok: false`, error de método |
| Recurrencia no aplicable | `ok: false`, notas de no aplicabilidad |
| Excepción interna del motor | `ok: false`, mensaje de error |
| WHILE no analizable | `whileBlock.status = "unknown"`, T_polynomial omitido |
| Bucle sin terminación | `unbounded: true`, `T_open = \infty` |

## Casos soportados

### Ejemplo 1: Algoritmo iterativo simple
```python
# source: "sumaArreglo(A[n]) BEGIN ... END"
# mode: "worst"
result = analyze_algorithm(source, mode="worst")
# result.ok → True
# result.byLine → [línea por línea con costos C_k]
# result.totals.T_open → "C_1 + C_2·(n+1) + C_3·n"
# result.totals.big_o → "O(n)"
# result.totals.big_theta → "Θ(n)"
```

### Ejemplo 2: Algoritmo recursivo con Master Theorem
```python
# source: "mergesort(A[1]..[n]) BEGIN ... END"
result = analyze_algorithm(source, mode="worst", preferred_method="master")
# result.totals.recurrence.type → "divide_conquer"
# result.totals.recurrence.a → 2
# result.totals.recurrence.b → 2
# result.totals.master.case → 2
# result.totals.master.theta → "Θ(n·log(n))"
```

### Ejemplo 3: Análisis completo con variabilidad
```python
# source: "busquedaLineal(A[n], x) BEGIN ... END"
result = analyze_algorithm(source, mode="all")
# result.has_case_variability → True
# result.worst.totals.big_o → "O(n)"
# result.best → AnalyzeOpenResponse (T_open = constante)
# result.avg → AnalyzeOpenResponse (con A(n))
```

## Casos no soportados

- Usar `avg` sin entrada analizable cuando la estructura no admite modelo promedio defendible (ej. recursivo con poda no modelable).
- Forzar un método recursivo incompatible con la forma detectada (ej. Master Theorem en Fibonacci).
- Analizar algoritmos con `ClassDef` (se espera comportamiento parcial o ignorado).

## Evidencia desde código o configuración

- **Registry:** `apps/api/app/modules/analysis/analyzers/registry.py` — mapea `iterative` → `IterativeAnalyzer`, `recursive` → `RecursiveAnalyzer`, `hybrid` → `RecursiveAnalyzer`.
- **Service:** `apps/api/app/modules/analysis/service.py` — implementa `analyze_algorithm()` y `detect_methods()`.
- **Classifier:** `apps/api/app/modules/classification/classifier.py` — `detect_algorithm_kind()`.
- **Types:** `packages/types/src/index.ts` líneas 534-746 (`AnalyzeOpenResponse`, `AnalyzeAllCasesResponse`).
- **Simplificación:** `SummationCloser` en `apps/api/app/modules/analysis/utils/summation_closer.py`.
- **Notaciones:** `ComplexityClasses` en `apps/api/app/modules/analysis/utils/complexity_classes.py`.

## Limitaciones

- La exactitud matemática y la heurística conservadora conviven en el mismo contrato; por eso hay estados `partial` y advertencias.
- `loopInvariant` es local al ciclo significativo, no una prueba global del algoritmo.
- `recursiveInvariant` tiene confianza numérica (0.0-1.0) que refleja la calidad de la evidencia estructural extraída.
- El caso promedio (`avg`) usa modelo uniforme por defecto; no todos los algoritmos admiten un modelo probabilístico defendible.
- Algoritmos híbridos se analizan con `RecursiveAnalyzer`, lo que puede perder costos iterativos no recursivos en ciertos casos.

## Archivos relacionados

- `pseudocode-grammar-spec.md` — gramática fuente
- `ast-schema.md` — estructura del AST
- `iterative-analysis-spec.md` — detalle del análisis iterativo
- `algorithm-classification-spec.md` — clasificación de algoritmos
- `while-heuristics-spec.md` — heurísticas WHILE
- `recurrence-methods-spec.md` — métodos de recurrencia
- `execution-trace-spec.md` — traza de ejecución
- `report-snapshot-spec.md` — snapshot para export
- `../04-api/analysis-api.md` — API de análisis
- `../09-decisions/adr-003-conservative-while-heuristics.md` — ADR sobre heurísticas WHILE
