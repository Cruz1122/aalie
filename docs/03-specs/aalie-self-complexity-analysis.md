# Análisis de complejidad de AALIE

**Tipo:** descriptiva
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/analysis/`, `apps/api/app/modules/llm/`, `apps/api/app/modules/quizzes/`, `packages/content-catalog/`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** Apéndice A — Complejidad del sistema

## Propósito

Analizar la complejidad temporal y espacial de los componentes principales de AALIE, documentando las variables de entrada, supuestos y fuentes de evidencia. Este análisis es autocontenido y describe el costo de ejecutar cada etapa del pipeline.

## Variables

| Variable | Significado |
|---|---|
| `L` | Líneas de pseudocódigo (source) |
| `N` | Nodos del AST después del parseo |
| `E` | Expresiones en el AST |
| `D` | Profundidad de anidamiento del AST |
| `W` | Número de ciclos WHILE en el código fuente |
| `R` | Número de llamadas recursivas detectadas |
| `M` | Número de métodos de recurrencia evaluados |
| `S` | Tamaño de la expresión simbólica (SymPy) |
| `Q` | Preguntas candidatas para una sesión de quiz |
| `B` | Tamaño del banco de preguntas (~476 por locale) |
| `C` | Tamaño del catálogo de contenido (módulos × bloques) |
| `T_sympy(S)` | Costo de simplificación SymPy para expresión de tamaño S |
| `T_pdf` | Costo externo de compilación pdflatex |
| `T_llm` | Costo de llamada externa a proveedor LLM (red + proceso) |

## Tabla de complejidad

### Nota sobre caso promedio

No se reclama un caso promedio global sin distribución formal. Donde se documenta caso promedio ("avg"), se asume modelo uniforme (cada rama con probabilidad p = 1/2, cada entrada con igual probabilidad). Esto es aplicable a algoritmos de búsqueda lineal, ordenamiento por inserción, y otros con estructura probabilística simétrica.

| Componente | Input | Tiempo | Espacio | Supuestos | Evidencia |
|---|---|---|---|---|---|
| **Parse** | `L` | O(L) | O(N) | ANTLR4 adaptivePredict sobre gramática LL(*) | `pseudocode-grammar-spec.md`, grammar tests |
| **Build AST** | tokens | O(N) | O(N) | Builder recorre tokens una vez | `ast-schema.md`, builder tests |
| **Classify** (algorithm kind) | `N` | O(N) | O(1) | Pattern match sobre estructura del AST (presencia de FOR/WHILE vs calls recursivos) | `analysis-engine-spec.md`, classifier tests |
| **Iterative analyzer** (by-line cost) | `N` | O(N * S) avg: O(N * avg(S)) | O(N) | SymPy domina en expresiones con sumatorias cerrables; S es tamaño de la expresión simbólica | `iterative-analysis-spec.md`, SymPy benchmarks |
| **FOR visitor** | FOR nodes | O(F) por nodo | O(D) | Multiplicadores se acumulan en loop_stack; cada FOR anidado multiplica contexto | `for_visitor.py` tests |
| **IF/ELSE visitor** | IF nodes | O(branches) | O(D) | Worst = MAX(branches), Best = MIN(branches), Avg = weighted avg | `if_visitor.py` tests |
| **Simple visitor** | non-loop lines | O(1) por línea | O(1) | Asignaciones, llamadas, returns | `simple_visitor.py` tests |
| **WHILE engine** | `D`, `W` | O(D * W) avg: O(D * avg_pattern_eval) | O(D) | Pattern registry con 12 patrones; cada patrón evalúa guard + variables de control + actualizaciones | `while-heuristics-spec.md`, while oracle tests |
| **Summation closer** (SymPy) | expression `S` | T_sympy(S) | O(S) | SymPy `Sum.doit()`, `simplify()`, `together()`. Costo depende de complejidad del término | `summation_closer.py` (2485 líneas) |
| **Recurrence extraction** | `N` | O(N) | O(R) | Identifica llamadas recursivas y deduce patrones de reducción de argumentos | `recurrence-methods-spec.md` |
| **Recurrence detection** (detect-methods) | `R`, `M` | O(R * M) | O(R) | Evalúa cada método independientemente: master, iteration, recursion_tree, characteristic_equation | `detect-methods` tests |
| **Master theorem** | recurrence | O(1) | O(1) | 3 casos + verificación de regularidad; casos especiales para log^k n | `master_steps.py` tests |
| **Characteristic equation** | recurrence | O(r³) | O(r²) | r = grado de la ecuación característica; resuelve raíces de polinomio | `characteristic_steps.py` tests |
| **Iteration method** | recurrence | O(k * S) | O(k) | k = pasos de expansión hasta detectar patrón | `iteration_steps.py` tests |
| **Recursion tree** | recurrence | O(levels * branches) | O(levels) | levels = log_b(n), branches = a^levels | `recursion_tree_steps.py` tests |
| **Trace** (execution) | `N`, input size | O(steps) truncado a max_steps | O(steps) | Truncation at max configured steps; worst-case exponential sin truncation | `execution-trace-spec.md`, trace tests |
| **Snapshot build** | `N` + all results | O(N + results) | O(N + results) | In-memory construction from parse + analyze + trace outputs | `report-snapshot-spec.md`, snapshot tests |
| **Export Markdown** | snapshot | O(snapshot) | O(snapshot) | Template rendering with Jinja2-like string formatting | `export-engine-spec.md`, export tests |
| **Export LaTeX** | snapshot | O(snapshot) | O(snapshot) | LaTeX escaping + template; same complexity as Markdown | latex tests |
| **Export PDF** | LaTeX | T_pdf | O(file_size) | External pdflatex compilation; skipped if pdflatex not available | pdf tests (skip if no pdflatex) |
| **Quiz selection** | `B`, `Q` | O(B log Q) avg: O(B) | O(B) | Filter active → exclude recent → prioritize weak topics → balance difficulty → tie-break by questionId. B = banco completo, Q = preguntas seleccionadas | `quizzes-spec.md`, quiz tests |
| **Quiz evaluation** | per question | O(options) por pregunta | O(1) por pregunta | Grade by policy (all_or_nothing, partial_credit, etc.) | `grading.py` tests |
| **Quiz validation** | `B` | O(B * refs) | O(B) | Schema validation + business rules + cross-reference check against content catalog | `validator.py`, `validate_quiz_bank.py` |
| **Quiz coverage report** | `B` | O(B) | O(B) | Count by topic/difficulty/cognitive/skill + check critical thresholds | `report_quiz_bank_coverage.py` |
| **LLM call** | prompt | T_llm | O(response_size) | Network-bound; timeout at LLM_TIMEOUT_SECONDS (default 30s) | `llm-assistance-spec.md`, llm tests |
| **Content catalog validation** | `C` | O(C) avg: O(C) | O(C) | Schema (AJV) + semantic + cross-reference + locale coverage + resource path checks | `content-modules-spec.md`, validate.ts tests |
| **Content search index** | `C` | O(C) | O(C) | Build search index entries per module and section | `search.ts` tests |

## Notas sobre SymPy

SymPy domina el costo del análisis iterativo. Las expresiones simbólicas pueden crecer significativamente con:

- **FOR anidados**: producto de sumatorias, ej. `Sum(Sum(f(i,j), (j, a, b)), (i, c, d))`. Cada nivel de anidamiento multiplica la complejidad de `Sum.doit()`.
- **Sumatorias con límites simbólicos**: `Sum(i, (i, 1, n))` se resuelve en O(1), pero `Sum(i^2 * A[i], (i, 1, n))` puede requerir más pasos.
- **Formas cerradas**: sumatorias polinomiales se resuelven en tiempo polinomial en el grado. Sumatorias exponenciales o logarítmicas pueden requerir funciones especiales.
- **Sanitización**: el costo pos-cierre incluye sustitución de variables de iteración y parámetros.

En el caso promedio (bajo modelo uniforme), las sumatorias más comunes son lineales (`Σ 1 = n`, `Σ i = n(n+1)/2`), que SymPy resuelve en O(1). Para anidamiento de profundidad `d` con límites lineales, el costo esperado es O(d) con términos pequeños.

## Nota sobre LLM

`T_llm` es el componente de mayor latencia y varianza en el sistema. Los factores que afectan `T_llm`:

- **Proveedor**: latencia de red del proveedor (Gemini vs OpenAI-compatible)
- **Modelo**: modelos más grandes tienen mayor latencia
- **Tamaño del prompt**: el contexto inyectado (assistantContext, chatHistory) aumenta el tiempo de procesamiento
- **Tamaño de respuesta**: respuestas más largas toman más tiempo
- **Timeout**: configurable por `LLM_TIMEOUT_SECONDS` (default 30s)
- **Reintentos**: Gemini reintenta hasta 3 veces, OpenAI hasta 2

`T_llm` es O(prompt_size * model_factor) en el proveedor, pero desde la perspectiva del sistema es una caja negra con timeout.

## Nota sobre contenido (`C`)

El tamaño del catálogo de contenido se mide como:

```
C = Σ_{locales} Σ_{espacios} módulos(locale, space) × secciones × bloques
```

Actualmente:
- 2 espacios (course, user-guide) × 2 locales (es, en) = 4 bundles
- course: 20 módulos por locale
- user-guide: 7 módulos por locale
- Cada módulo tiene capítulos, secciones y bloques variables

La validación del catálogo escala linealmente con `C` (una pasada para schema, otra para referencias, otra para semántica, otra para cobertura de locales).

## Límites del análisis

1. **SymPy puede fallar**: expresiones no cerrables devuelven sumatorias sin simplificar. El sistema no degrada por esto.
2. **WHILE sin patrón**: el motor no puede determinar cota, y la expresión T_open incluye símbolos no resueltos.
3. **Quiz bank escalado**: validación O(B * refs) asume referencias verificables contra el catálogo. Si el catálogo crece, la validación crece proporcionalmente.
4. **Snapshot no cacheado**: el snapshot se construye en cada solicitud de análisis completo. No hay caché de snapshot por contentHash.
5. **LLM no determinista**: la latencia y respuesta del LLM no son predecibles. El sistema maneja esto con timeouts y reintentos, pero no puede garantizar tiempo de respuesta.
6. **`T_pdf` depende del sistema**: pdflatex no está disponible en todos los entornos. Las pruebas se omiten si no hay binario.
7. **Caso promedio no modelable**: para algoritmos con distribuciones de entrada asimétricas o no modelables, el avg case no es computable.
