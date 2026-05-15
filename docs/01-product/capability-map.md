# Mapa de capacidades

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev | evaluador | docente
**Fuente de verdad:** `apps/`, `packages/`, `.github/workflows/ci.yaml`, `infra/`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** 2.5 Análisis de Complejidad, 2.6 Detalles de Implementación

## Propósito

Proveer un mapa granular de cada capacidad del producto, con evidencia de implementación en código, UI/API, limitaciones conocidas y fuente normativa asociada. Más detallado que `final-scope.md`.

## Alcance

Cubre todas las capacidades visibles en el monorepo a corte 2026-05-18. Cada capacidad tiene evidencia verificable.

## Fuente de verdad

- Código fuente en `apps/api/app/modules/`, `apps/web/src/app/`, `packages/`.
- Tests en `apps/api/tests/`.
- Configuración en `.github/workflows/ci.yaml`, `infra/docker-compose.yml`.

## Contrato

Cada fila es un compromiso: si la capacidad está implementada, debe existir código que la ejecute y tests que la validen. Si tiene limitación, debe documentarse.

## Capacidades

| Capacidad | Implementada | Evidencia código | Evidencia UI/API | Limitación | Fuente normativa |
|---|---|---|---|---|---|
| **Editor Monaco** | Sí | `apps/web/src/app/[locale]/analyzer/` | `/{locale}/analyzer` | No es IDE general | `03-specs/pseudocode-grammar-spec.md` |
| Validación en tiempo real | Sí | Monaco API `onValidate` | Errores en panel | Solo valida gramática, no semántica | `03-specs/pseudocode-grammar-spec.md` |
| Autocompletado contextual | Sí | Monaco completions provider | Sugerencias al escribir | Solo palabras clave de gramática | `03-specs/pseudocode-grammar-spec.md` |
| Snippets | Sí | Monaco snippets | Plantillas de código | Por idioma | `03-specs/pseudocode-grammar-spec.md` |
| Import pseudocódigo `.txt` | Sí | File upload handler | Botón importar | Solo `.txt`, sin drag & drop | `03-specs/pseudocode-grammar-spec.md` |
| **Parser ANTLR** | Sí | `packages/grammar/Language.g4` | `POST /grammar/parse` | No lenguaje general | `03-specs/pseudocode-grammar-spec.md` |
| Parser compartido TS/Python | Sí | `packages/grammar/` (build y gen:py) | Mismo AST en FE/BE | Codegen requiere Java >=8 | `03-specs/pseudocode-grammar-spec.md` |
| **AST building** | Sí | `packages/types/src/index.ts` (19+ tipos) | `POST /grammar/parse` response | Sin normalización de pseudocódigo | `03-specs/ast-schema.md` |
| **Clasificación** | Sí | `apps/api/app/modules/classification/classifier.py` | `algorithm_kind` en responses | Indirecta compleja no detectada | `03-specs/analysis-engine-spec.md` |
| **Análisis iterativo** | Sí | `apps/api/app/modules/analysis/analyzers/iterative.py` | `POST /analyze/open` → `byLine`, `totals` | SymPy bottleneck | `03-specs/analysis-engine-spec.md` |
| Line costs (`byLine`) | Sí | `helpers/line_coster.py` | Tabla por línea | Costo elemental único por línea | `03-specs/analysis-engine-spec.md` |
| T_open | Sí | `analysis/utils/summation_closer.py` | `totals.T_open` (KaTeX) | Expressión puede ser larga | `03-specs/analysis-engine-spec.md` |
| T_polynomial | Sí | SymPy simplification | `totals.T_polynomial` (KaTeX) | No siempre alcanzable | `03-specs/analysis-engine-spec.md` |
| O notation | Sí | SymPy `big_o` derivation | `totals.big_o` | Depende de SymPy | `03-specs/analysis-engine-spec.md` |
| Ω notation | Sí | SymPy `big_omega` derivation | `totals.big_omega` | Depende de SymPy | `03-specs/analysis-engine-spec.md` |
| Θ notation | Sí | SymPy `big_theta` derivation | `totals.big_theta` | Depende de SymPy | `03-specs/analysis-engine-spec.md` |
| Best/worst/avg cases | Sí | `analyze_algorithm()` con mode="all" | Mode selector en UI | Avg requiere modelo probabilístico | `03-specs/analysis-engine-spec.md` |
| **Uniform cost model** | Sí | `avg_model.py` | avgModel config | No hay modelo logarítmico ni de costo real | `03-specs/analysis-engine-spec.md` |
| **Loop invariant** | Sí | `apps/api/app/modules/analysis/invariants/` | loopInvariant en response | Confidence variable (ok/low_confidence/unavailable) | `03-specs/analysis-engine-spec.md` |
| **WHILE analysis** | Sí | `apps/api/app/modules/analysis/while_engine/engine.py` | whileBlocks en totals | Heurística conservadora | `03-specs/while-heuristics-spec.md` |
| WHILE: linear_counter | Sí | `patterns/linear_counter.py` | patternUsed="linear_counter" | Solo contadores con incremento constante | `03-specs/while-heuristics-spec.md` |
| WHILE: geometric_growth | Sí | `patterns/geometric_growth.py` | patternUsed="geometric_growth" | Solo multiplicación/división constante | `03-specs/while-heuristics-spec.md` |
| WHILE: binary_search_interval | Sí | `patterns/binary_search_interval.py` | patternUsed="binary_search_interval" | Solo reducción por mitad | `03-specs/while-heuristics-spec.md` |
| WHILE: euclid_mod | Sí | `patterns/euclid_mod.py` | patternUsed="euclid_mod" | Solo algoritmo de Euclides | `03-specs/while-heuristics-spec.md` |
| WHILE: flag_kill | Sí | `patterns/flag_kill.py` | patternUsed="flag_kill" | Bandera booleana simple | `03-specs/while-heuristics-spec.md` |
| WHILE: interval_shrink | Sí | `patterns/interval_shrink.py` | patternUsed="interval_shrink" | Reducción de intervalo | `03-specs/while-heuristics-spec.md` |
| WHILE: sentinel_scan | Sí | `patterns/sentinel_scan.py` | patternUsed="sentinel_scan" | Escaneo con centinela | `03-specs/while-heuristics-spec.md` |
| WHILE: gap_shrink_then_scan | Sí | `patterns/gap_shrink_then_scan.py` | patternUsed="gap_shrink_then_scan" | Shell sort-like | `03-specs/while-heuristics-spec.md` |
| WHILE: gnome_sort_cursor | Sí | `patterns/gnome_sort_cursor.py` | patternUsed="gnome_sort_cursor" | Gnome sort | `03-specs/while-heuristics-spec.md` |
| WHILE: merge_two_pointers | Sí | `patterns/merge_two_pointers.py` | patternUsed="merge_two_pointers" | Dos punteros en merge | `03-specs/while-heuristics-spec.md` |
| WHILE: phase_loop_composition | Sí | `patterns/phase_loop_composition.py` | patternUsed="phase_loop_composition" | Composición de fases | `03-specs/while-heuristics-spec.md` |
| WHILE: shrinking_window_bidirectional | Sí | `patterns/shrinking_window_bidirectional.py` | patternUsed="shrinking_window_bidirectional" | Ventana bidireccional | `03-specs/while-heuristics-spec.md` |
| **Recurrence analysis** | Sí | `apps/api/app/modules/analysis/analyzers/recursive.py` | `POST /analyze/open` → totals.recurrence | Solo divide_conquer y linear_shift | `03-specs/recurrence-methods-spec.md` |
| Detect methods | Sí | `detect_methods()` endpoint | `POST /analyze/detect-methods` | Solo algoritmos recursivos | `03-specs/recurrence-methods-spec.md` |
| Master Theorem | Sí | `analyzers/master_steps.py` | totals.master (case, theta, regularity) | Solo T(n)=aT(n/b)+f(n) | `03-specs/recurrence-methods-spec.md` |
| Iteration method | Sí | `analyzers/iteration_steps.py` | totals.iteration (expansions, general_form) | Requiere patrón identificable | `03-specs/recurrence-methods-spec.md` |
| Recursion tree | Sí | `analyzers/recursion_tree_steps.py` | totals.recursion_tree (levels, height) | Visual + analítico | `03-specs/recurrence-methods-spec.md` |
| Characteristic equation | Sí | `analyzers/characteristic_steps.py` | totals.characteristic_equation (roots, closed_form) | Solo recurrencias lineales con coeficientes constantes | `03-specs/recurrence-methods-spec.md` |
| Step-by-step bundles | Sí | `analyzers/*_steps.py` | totals.*.step_by_step (steps tipados) | No todos los métodos tienen walkthrough completo | `03-specs/recurrence-methods-spec.md` |
| DP detection for recurrences | Sí | `analyzers/characteristic_steps.py` | totals.characteristic_equation.dp_validation | Solo lineales con desplazamiento | `03-specs/recurrence-methods-spec.md` |
| **Trace** | Sí | `apps/api/app/modules/analysis/trace_service.py` | `POST /analyze/trace` | Inputs heurísticos | `03-specs/execution-trace-spec.md` |
| Iterative trace | Sí | `execution/executor.py` | trace.steps con eventKind | Truncable por profundidad | `03-specs/execution-trace-spec.md` |
| Recursive trace | Sí | `execution/executor.py` | trace.steps + callTreeSource | Truncable por recursión profunda | `03-specs/execution-trace-spec.md` |
| Structured trace | Sí | `execution/derivations/structured_trace_builder.py` | derived.structuredTrace.graph | Fallback a genérico si falla | `03-specs/execution-trace-spec.md` |
| Call tree | Sí | `execution/derivations/` | callTreeSource.calls | Solo recursivos | `03-specs/execution-trace-spec.md` |
| **Snapshot** | Sí | `apps/api/app/modules/export/snapshot_builder.py` | build_snapshot() → snapshot dict | Campos no implementados marcados | `03-specs/report-snapshot-spec.md` |
| schemaVersion | Sí | `SNAPSHOT_SCHEMA_VERSION = "1.0.0"` | snapshot.schemaVersion | Requiere migración al cambiar | `03-specs/report-snapshot-spec.md` |
| snapshotId | Sí | UUID v5 from namespace + seed | snapshot.snapshotId | Estable para mismo contenido | `03-specs/report-snapshot-spec.md` |
| contentHash | Sí | SHA-256 normalized snapshot | snapshot.contentHash | Excluye createdAt | `03-specs/report-snapshot-spec.md` |
| **Export** | Sí | `apps/api/app/modules/export/engine.py` | `POST /export/report` | Snapshot precargado | `03-specs/export-engine-spec.md` |
| Export Markdown | Sí | `markdown_renderer.py` | format=markdown | Sin syntax highlighting en código | `03-specs/export-engine-spec.md` |
| Export LaTeX | Sí | `latex_renderer.py` | format=latex | Requiere template .tex | `03-specs/export-engine-spec.md` |
| Export PDF | Sí (condicional) | `latex_compiler.py` | format=pdf | **Requiere pdflatex en runtime** | `03-specs/export-engine-spec.md` |
| Export ZIP | Sí | `zip_bundle.py` | format=zip | Incluye manifest, snapshot, assets | `03-specs/export-engine-spec.md` |
| Manifest | Sí | `zip_bundle.py` | manifest.json | Incluye metadatos de export | `03-specs/export-engine-spec.md` |
| **LLM** | Sí (opcional) | `apps/api/app/modules/llm/service.py` | `POST /llm` | Requiere API key | `04-api/llm-api.md` |
| LLM: embedded assistant | Sí | `llm/config.py` (job=general) | Chat contextual en UI | Proveedor-dependente | `04-api/llm-api.md` |
| LLM: compare | Sí | `llm/config.py` (job=compare, schema estructurado) | Comparación resultados | No es validación formal | `04-api/llm-api.md` |
| LLM: repair | Sí | `llm/config.py` (job=repair, schema estructurado) | Reparar pseudocódigo | Puede producir código no parseable | `04-api/llm-api.md` |
| LLM: explain | Sí | `llm/config.py` (job=explain) | Explicación pedagógica | Sin control de profundidad | `04-api/llm-api.md` |
| LLM: parser_assist | Sí | `llm/config.py` (job=parser_assist) | Asistencia de gramática | Latex/no en todos los modelos | `04-api/llm-api.md` |
| LLM: diagrams | Sí (con limitación) | `NEXT_PUBLIC_USE_DETERMINISTIC_DIAGRAMS` | Diagramas en UI | Determinista o LLM según flag | `04-api/llm-api.md` |
| LLM: providers | Sí (Gemini + OpenAI-compatible) | `llm/providers.py` (GeminiProvider, OpenAICompatibleProvider) | `LLM_PROVIDER` env | Sin soporte para otros | `04-api/llm-api.md` |
| LLM: no RAG | Sí (explícito) | No hay pipeline de retrieval | N/A | No implementado | `04-api/llm-api.md` |
| **Course content** | Sí | `packages/content-catalog/` | `/{locale}/course` | Edición JSON directa | `08-content/content-model.md` |
| Course space | Sí | `catalog/spaces/course/` | Curricular | 20 módulos por locale | `08-content/content-model.md` |
| User-guide space | Sí | `catalog/spaces/user-guide/` | `/{locale}/user-guide` | 7 módulos por locale | `08-content/content-model.md` |
| Modules/chapters/blocks | Sí | Schemas en `packages/content-catalog/schemas/` | Estructura JSON anidada | Validación separada | `08-content/block-json-schema.md` |
| Locales en contenido | Sí | `catalog/spaces/*/{es,en}/` | Contenido bilingüe | Fallback controlado | `08-content/content-model.md` |
| **Quizzes** | Sí | `apps/api/app/modules/quizzes/` | `/{locale}/quizzes` | Banco requiere curaduría | `08-content/quiz-json-schema.md` |
| Quiz backend endpoints | Sí | `quizzes/router.py` (6 endpoints) | `POST /quizzes/attempts`, `POST /quizzes/attempts/evaluate` | Validación de dataset obligatoria | `04-api/quizzes-api.md` |
| Quiz dashboard | Sí | Frontend quizzes page | `/{locale}/quizzes` | Progreso localStorage | `08-content/quiz-json-schema.md` |
| Quiz evaluation | Sí | `quizzes/grading.py` (determinista) | POST `/quizzes/attempts/evaluate` | Backend-only | `08-content/quiz-json-schema.md` |
| Quiz taxonomy | Sí | `quizzes/taxonomy.py` | `GET /quizzes/taxonomy` | Cargada desde JSON | `08-content/quiz-json-schema.md` |
| Quiz selector | Sí | `quizzes/selector.py` (adaptativo determinista) | `POST /quizzes/attempts` | Sin ML en selección | `08-content/quiz-json-schema.md` |
| Quiz bank ES | Sí | `packages/content-data/quizzes/ada-quiz-bank.json` | 476 preguntas activas | Curaduría continua | `08-content/quiz-json-schema.md` |
| Quiz bank EN | Sí | `packages/content-data/quizzes/ada-quiz-bank.en.json` | 476 preguntas activas | Curaduría continua | `08-content/quiz-json-schema.md` |
| Quiz validation scripts | Sí | `scripts/validate_quiz_bank.py`, `report_quiz_bank_coverage.py` | CI job "Quizzes quality" | Falla en crítico | `08-content/content-validation.md` |
| Quiz: localProgress | Sí | `localStorage` en frontend | Progreso persistido | Solo navegador actual | `08-content/progress-model.md` |
| **Examples catalog** | Sí | `apps/web/src/app/[locale]/examples/` | `/{locale}/examples` | Por categoría | N/A |
| **i18n** | Sí | `apps/web/next-intl.config.js`, `messages/` | Rutas `/{es,en}/...` | Traducción manual | N/A |
| i18n: es | Sí | `messages/es.json` | UI en español | Cobertura completa | N/A |
| i18n: en | Sí | `messages/en.json` | UI en inglés | Cobertura completa | N/A |
| **CI** | Sí | `.github/workflows/ci.yaml` | GitHub Actions | 8 jobs, schedules | `05-quality/testing-strategy.md` |
| CI: Build (web + API smoke) | Sí | Job `build` | Build crítico | Debe pasar siempre | `05-quality/testing-strategy.md` |
| CI: Test PR gate | Sí | Job `test-pr-gate` | pytest fast + oracle, --cov-fail-under=70 | Coverage gate 70% | `05-quality/testing-strategy.md` |
| CI: Test extended | Sí | Job `test-extended-lanes` | pytest contract + system | No bloqueante (continue-on-error) | `05-quality/testing-strategy.md` |
| CI: Test nightly | Sí | Job `test-nightly-lanes` | pytest slow + stress + export + benchmark | Solo schedule | `05-quality/testing-strategy.md` |
| CI: Lint web | Sí | Job `lint-web` | ESLint + Prettier | Solo web | `05-quality/testing-strategy.md` |
| CI: Lint API | Sí | Job `lint-api` | Ruff check | Solo API | `05-quality/testing-strategy.md` |
| CI: Docs contracts | Sí | Job `docs-contracts` | `scripts/check_docs_contracts.py` | Validación estructural | `05-quality/testing-strategy.md` |
| CI: Quizzes quality | Sí | Job `quizzes-quality` | validate + coverage + tests | Falla en crítico | `08-content/content-validation.md` |
| **Docker** | Sí | `infra/docker-compose.yml`, `apps/api/Dockerfile` | `docker compose build` | Solo API, web es Next.js standalone | `06-operations/deployment.md` |
| Docker: compose config | Sí | CI job `docker-integration` | `docker compose config` | Valida sintaxis | `06-operations/deployment.md` |
| Docker: API build | Sí | CI job `docker-integration` | `docker build -f apps/api/Dockerfile` | Imagen de producción | `06-operations/deployment.md` |

## Archivos relacionados

- `final-scope.md` — alcance agregado por área
- `vision.md` — visión del producto
- `known-limitations.md` — límites conocidos por módulo
- `../03-specs/` — contratos normativos
- `../04-api/` — contratos de API
