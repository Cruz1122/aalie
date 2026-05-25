# Flujos de datos

**Tipo:** descriptiva
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/*`, `apps/web/src/app/api/*`, `packages/*`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** trazabilidad de datos entre componentes

## Propósito

Documentar los 9 flujos de datos principales de AALIE, detallando entrada, salida, errores posibles y evidencia en código para cada paso.

## Alcance

Cubre parse, análisis iterativo, WHILE, recursivo, trace, export, quizzes, contenido y LLM.

## Contenido

### Convención

Cada paso se documenta como: `Componente → Entrada → Salida → Error posible → Evidencia`

---

### 1. Parse flow: pseudocódigo → AST

| Paso | Componente | Entrada | Salida | Error posible | Evidencia |
|---|---|---|---|---|---|
| 1.1 Envío | Monaco Editor / BFF `POST /api/grammar/parse` | `{ input: string }` | JSON serializado | — | `apps/web/src/app/api/grammar/parse/route.ts:27` |
| 1.2 Proxy BFF | `route.ts` | `{ input }` | Fetch a backend | Backend unreachable (503) | `route.ts:37-71` |
| 1.3 Recepción API | `parsing/router.py` | `{ input \| source }` | `{ ok, ast?, errors? }` | — | `apps/api/app/modules/parsing/router.py:36-48` |
| 1.4 Parseo ANTLR | `parsing/service.py` + `aa_grammar` | Source string | Parse tree → AST dict | Syntax error → `errors[]` | `service.py` → `parse_source()` |
| 1.5 Validación | BFF response check | Backend JSON | `GrammarParseResponse` | Bad response shape (502) | `parse/route.ts:49-52` |
| 1.6 Render | `AnalyzerEditor` | AST | Highlighting, errors UI | — | Componentes del analyzer |

**Flujo alternativo**: El frontend puede parsear localmente con el parser ANTLR TypeScript para validación sintáctica en tiempo real (autocompletado, errores inline). El server-side es la fuente de verdad canónica.

---

### 2. Iterative analysis flow: AST → byLine → T_open → O/Ω/Θ

| Paso | Componente | Entrada | Salida | Error posible | Evidencia |
|---|---|---|---|---|---|
| 2.1 Envío | BFF `POST /api/analyze/open` | `{ source, mode, ... }` | JSON | — | `analyze/open/route.ts:19` |
| 2.2 Proxy | `route.ts` | Body JSON | Fetch backend | 502/503 | `route.ts:25-45` |
| 2.3 Route API | `analysis/router.py → analyze_open()` | `AnalyzeRequest` | Dict | — | `analysis/router.py:18` |
| 2.4 Facade | `analysis/service.py → analyze_algorithm()` | source, mode, avg_model | Parse → classify → analyze | Parse errors → early return | `service.py:18-344` |
| 2.5 Parse + classify | `parse_source()` + `detect_algorithm_kind()` | source | AST + kind | Parse fail → `{ok:false, errors}` | `service.py:55-97` |
| 2.6 Registry | `AnalyzerRegistry.get(kind)` | "iterative" | `IterativeAnalyzer` class | No matching → fallback IterativeAnalyzer | `analyzers/registry.py:9-13` |
| 2.7 Visit AST | `IterativeAnalyzer.analyze()` (MRO: ForVisitor, IfVisitor, WhileRepeatVisitor, SimpleVisitor) | AST | `self.rows[]` (LineCost list) | — | `iterative.py` + `visitors/*` |
| 2.8 Build T_open | `BaseAnalyzer.build_t_open()` | `self.rows[]` | T_open string (KaTeX) | SymPy error → simplified fallback | `base.py:645-764` |
| 2.9 Summation close | `SummationCloser._evaluate_all_sums_sympy()` | T_open expr | Simplified polynomial | Summation out of SymPy scope → partial | `utils/summation_closer.py` |
| 2.10 Complexity class | `ComplexityClasses` | T_polynomial | big_o, big_omega, big_theta | — | `utils/complexity_classes.py` |
| 2.11 Loop invariant | `generate_loop_invariant()` | AST | LoopInvariant or empty | Exception → `empty_loop_invariant` | `invariants/` |
| 2.12 Response | `BaseAnalyzer.result()` | rows, totals | `AnalyzeOpenResponse` | — | `base.py:1085` |

---

### 3. WHILE analysis flow: WHILE node → pattern match → cost estimate

| Paso | Componente | Entrada | Salida | Error posible | Evidencia |
|---|---|---|---|---|---|
| 3.1 WHILE detection | `WhileRepeatVisitor` (called by IterativeAnalyzer) | WHILE AST node | Delegates to WhileEngine | — | `visitors/while_repeat_visitor.py` |
| 3.2 Guard analysis | `WhileEngine.analyze()` → `analyze_guard_for_engine()` | test expression | Guard info (vars, op, value) | — | `engine.py:183` |
| 3.3 Update analysis | `analyze_updates()` | node, vars, guard | Update map per variable | — | `update_analysis.py` |
| 3.4 Legacy classify | `classify_while()` | guard, updates, mode | ClassifyResult | Exception → unknown | `classifier.py` |
| 3.5 Control variables | `detect_control_variables()` | guard, updates | ControlVariables | — | `control_variables.py` |
| 3.6 Progress proof | `prove_progress()` | guard, updates, control | ProgressProof | — | `progress_proofs.py` |
| 3.7 Pattern match | 12 patterns (ordered priority) | while_ctx | Pattern match result | No match → fallback classification | `engine.py:91-104`, `patterns/*` |
| 3.8 Cost block | `_build_cost_block()` | iterations, status | `WhileCostBlock` | — | `engine.py:133-167` |
| 3.9 Visitor integration | iterations expr → `add_row()` | count expression | LineCost row with while info | — | `while_repeat_visitor.py` |

**Patterns (12)**: gnome_sort_cursor, shrinking_window_bidirectional, sentinel_scan, gap_shrink_then_scan, phase_loop_composition, merge_two_pointers, linear_counter, geometric_growth, flag_kill, euclid_mod, binary_search_interval, interval_shrink.

**Status outcomes**: `available` (bounded + pattern matched), `partial` (some evidence), `unknown` (no pattern), `unbounded` (proven non-terminating).

---

### 4. Recursive analysis flow: AST → detect methods → step bundles → solution

| Paso | Componente | Entrada | Salida | Error posible | Evidencia |
|---|---|---|---|---|---|
| 4.1 Detection request | BFF `POST /api/analyze/detect-methods` | `{ source }` | `{ applicable_methods[], default_method }` | Not recursive → error | `analysis/router.py:55-71` |
| 4.2 Detect methods | `RecursiveAnalyzer.detect_applicable_methods()` | AST | `{ ok, applicable_methods[], default_method, recurrence_info }` | — | `recursive.py` |
| 4.3 Methods | 4 methods: master, iteration, recursion_tree, characteristic_equation | AST + recurrence | Per-method applicability | — | `recursive.py` |
| 4.4 Method analysis | Selected method analyzer (e.g. `master_steps.py`) | Recurrence params | Step bundle | Method not applicable → `unsupported` | `analyzers/*_steps.py` |
| 4.5 Step bundle | Each step builder | Recurrence + params | `RecursiveMethodStepBundle` with steps[] | SymPy fail → partial status | `analyzers/master_steps.py:261-` |
| 4.6 Asymptotic result | `RecursiveAnalyzer.analyze()` | Step bundle | T_open, recurrence, theta | — | `recursive.py` |
| 4.7 Recursive invariant | `generate_recursive_invariant()` | AST | RecursiveInvariant | — | `recursive_invariants/` |
| 4.8 Response | Nested totals | All results | `AnalyzeOpenResponse` with master/iteration/recursion_tree/characteristic_equation | — | `types/index.ts:662-720` |

**Step kinds per method**: Master (10), Iteration (11), Recursion Tree (11), Characteristic Equation (11), Iterative Walkthrough (12).

---

### 5. Trace flow: pseudocode + input → execution steps → structured trace

| Paso | Componente | Entrada | Salida | Error posible | Evidencia |
|---|---|---|---|---|---|
| 5.1 Envío | BFF `POST /api/analyze/trace` | `{ source, case, input_size, initial_variables }` | JSON | 502/503 | `analyze/trace/route.ts:19` |
| 5.2 Service | `trace_service.py → build_trace_result()` | source, case, input_size | Trace response | Parse error → early return | `trace_service.py:69-184` |
| 5.3 Parse + classify | `parse_source()` + `classify_algo()` | source | AST + kind | — | `trace_service.py:81-99` |
| 5.4 Execute | `CodeExecutor.execute()` | AST, input_size, case, variables | Raw trace (steps, recursionTree) | Runtime error → error response | `execution/executor.py` |
| 5.5 Enrich | Summary + diagnostics | Raw trace | `trace_enriched` | — | `trace_service.py:114-133` |
| 5.6 Structured trace | `build_structured_trace_result()` | trace_enriched, config | `{ patternKind, graph, classification }` | Failure → unknown + fallback graph | `trace_service.py:139-160` |
| 5.7 Response | Aggregated result | All artifacts | `{ ok, trace, algorithmKind, derived, metadata }` | — | `trace_service.py:162-173` |

**Trace artifacts**: `steps[]` (ExecutionStepCanonical), `summary` (totalSteps, totalCalls, maxRecursionDepth), `diagnostics` (truncated, warnings), `callTreeSource`, `derived.structuredTrace` (graph + classification).

---

### 6. Export flow: snapshot → document model → render → file

| Paso | Componente | Entrada | Salida | Error posible | Evidencia |
|---|---|---|---|---|---|
| 6.1 Envío | BFF/UI `POST /export/report` | `{ source, formats[ ] }` | Binary file | — | `export/router.py:22` |
| 6.2 Service | `ExportService.render_report()` | payload | report result | Source required (400) | `export/service.py:40-42` |
| 6.3 Build state | `build_export_state()` | payload | `ExportState` (parse + classify + analyze + trace) | — | `snapshot_builder.py` (1188 líneas) |
| 6.4 Build snapshot | `build_snapshot_result()` | ExportState | `AalieAnalysisSnapshotV1` | — | `engine.py` |
| 6.5 Document model | `build_document_model()` | snapshot | `DocumentModel` (sections, tables) | — | `document_model.py` (2459 líneas) |
| 6.6 Render | `MarkdownRenderer` / `LaTeXRenderer` | DocumentModel | String content | — | `markdown_renderer.py`, `latex_renderer.py` |
| 6.7 PDF compile | `LaTeXCompiler.compile()` | LaTeX string | PDF binary | `pdflatex` not found → error | `latex_compiler.py` |
| 6.8 ZIP bundle | `ZipBundle.build()` | report + snapshot.json + manifest.json | ZIP binary | — | `zip_bundle.py` |
| 6.9 Response | `router.py` | content, mimeType | Binary response with headers | — | `export/router.py:79-97` |

**Response headers**: `Content-Type`, `Content-Disposition`, `X-Snapshot-Id`, `X-Content-Hash`.

---

### 7. Quiz flow: student context → selection → attempt → grading → results

| Paso | Componente | Entrada | Salida | Error posible | Evidencia |
|---|---|---|---|---|---|
| 7.1 Dashboard | UI `/{locale}/quizzes` | — | Taxonomy, summary | — | UI route |
| 7.2 Session request | BFF `POST /api/quizzes/session` | `QuizSelectionRequest` | JSON proxy | — | `quizzes/session/route.ts:19` |
| 7.3 Create session | `service.create_session()` | QuizSelectionRequest | QuizSession | Invalid dataset → ValueError | `quizzes/service.py:77-100` |
| 7.4 Load dataset | `repository.load_dataset()` | locale key `es`/`en` | QuizDataset + ValidationReport | Cache miss → load from disk | `quizzes/repository.py:38-43` |
| 7.5 Select questions | `selector.select_questions()` | Questions + request + preferences | QuizSelectionResult | Insufficient questions → warning | `quizzes/selector.py:135-281` |
| 7.6 Sanitize + shuffle | `_sanitize_question()` + `_shuffle_question_for_session()` | Raw questions | Sanitized (answers removed) + shuffled | — | `quizzes/service.py:25-39` |
| 7.7 Attempt submit | UI → BFF `POST /api/quizzes/evaluate` | `QuizAnswerSubmission` | JSON proxy | — | `quizzes/evaluate/route.ts:19` |
| 7.8 Evaluate | `service.evaluate_session()` | QuizAnswerSubmission | QuizSessionResult | Missing question → ValueError | `quizzes/service.py:103-143` |
| 7.9 Grade each | `grading.grade_question()` | Question + answer | QuizQuestionResult | Shape mismatch → GradingError | `quizzes/grading.py:76-111` |
| 7.10 Mastery delta | `compute_mastery_delta()` | Question, result | Per-skill delta | — | `quizzes/grading.py:114-127` |
| 7.11 Strengths/weaknesses | `summarize_skill_outcomes()` | Results | Strengths + areas to improve | — | `quizzes/grading.py:130-148` |
| 7.12 Response | QuizSessionResult | All results | Score, accuracy, results[], masteryDeltaBySkill | — | `types/quiz.ts:204-213` |

**Selection algorithm** (deterministic adaptive):
1. Filter: status=active, match module/topic/skill filters, exclude seen questions
2. Priority: weak skills → failed topics → desired difficulty → avoid repetition → cover pending topics
3. Fallback: relax filters, reuse questions, or break
4. Deterministic tie-break: `sorted(alternatives, key=lambda q: q.questionId)[0]`

**Grading policies** (5):
- `all_or_nothing` / `exact_set`: correct set match → maxScore, else 0
- `partial_credit`: (correct/total) - (incorrect * penalty), bounded by minScore
- `ordered_exact`: exact ordered match → maxScore, else 0
- `pairwise`: ratio of correctly matched pairs

---

### 8. Content flow: catalog JSON → validate → load → render

| Paso | Componente | Entrada | Salida | Error posible | Evidencia |
|---|---|---|---|---|---|
| 8.1 Discovery | `content-catalog/src/discover.ts` | `catalog/spaces/` | Space manifest | — | `discover.ts` |
| 8.2 Load module | `load.ts` | Module JSON path | `LoadedModule` (CatalogModule) | JSON parse error | `load.ts` |
| 8.3 Validate | `validate.ts` | Module + JSON Schema | ValidationReport | Schema violation → errors | `validate.ts` |
| 8.4 Serve | `server.ts` / Next API | Module ID | Module data | 404 if not found | `server.ts` |
| 8.5 Render | React components | ContentBlock[] | Rendered UI | Unknown block type → skip | Frontend components |

**Block types (27)**: heading, paragraph, list, quote, note, callout, definition, theorem, proof, example, evidenceBlock, exercise, exerciseSolution, algorithm, code, table, image, figure, latex, equationBlock, latexSteps, mermaid, recursionTree, graph, complexityTable, formulaComparisonTable, methodCard, stepByStepMethod, proofSteps, warningTrap, exampleSolved, quizCheckpoint, cheatsheet, referenceList, buttonRow, divider.

**Inline types (14)**: text, strong, emphasis, underline, highlight, inlineCode, inlineMath, link, term, tooltip, color.

---

### 9. LLM flow: UI request → BFF → backend → provider → response

| Paso | Componente | Entrada | Salida | Error posible | Evidencia |
|---|---|---|---|---|---|
| 9.1 UI trigger | ChatBot / ComparisonModal / EmbeddedAssistant | Context + prompt | — | — | Componentes UI |
| 9.2 BFF proxy | `POST /api/llm` | `LLMRequest` with job + context | Fetch backend | 502/503 | `llm/route.ts:21` |
| 9.3 Route API | `llm/router.py → llm_execute()` | LLMRequest | LLMResponse | — | `llm/router.py:15-18` |
| 9.4 Service | `execute_llm_request()` | Request dict | Response with status | — | `llm/service.py` |
| 9.5 Provider call | `providers.py` | Prompt + model config | Raw LLM response | Provider error → normalized error | `llm/providers.py` |
| 9.6 Status check | `GET /api/llm/status` | — | `{ ok, status }` | — | `llm/status/route.ts:21` |
| 9.7 Normalize | Service layer | Raw response | `{ ok, response, status }` | — | `llm/service.py` |
| 9.8 UI render | ChatBot / ComparisonModal | LLM response | Rendered text/markdown | — | Componentes UI |

**Jobs (5)**: `general` (chat), `repair` (fix pseudocode), `compare` (contrast analysis), `explain` (pedagogical), `parser_assist` (syntax help).

**Providers**: Gemini (primary, configurable `GEMINI_ENDPOINT_BASE`), OpenAI-compatible (fallback).

**Assistant context** (POST /llm): `surface` (home/analyzer/examples/user-guide), page metadata, visible analysis results, source code, focused panel/modal, app features.

## Limitaciones

- No hay logs centralizados de flujo de datos entre componentes
- Algunos flujos (WHILE) dependen de heurísticas que pueden degradar a `unknown`
- El flujo de export recalcula análisis completo — no reusa estado de sesión anterior
- LLM flow depende de disponibilidad externa; no hay cola de reintentos

## Archivos relacionados

- `system-architecture.md`
- `backend-architecture.md`
- `execution-trace-architecture.md`
- `llm-integration.md`
