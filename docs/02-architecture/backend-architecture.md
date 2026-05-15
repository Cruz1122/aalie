# Arquitectura backend

**Tipo:** descriptiva
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/main.py`, `apps/api/app/modules/`, `apps/api/tests/`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** API, análisis, trace, export, quizzes, LLM

## Propósito

Explicar la organización del backend FastAPI por módulos, sus contratos internos y la estructura de tests.

## Alcance

Cubre los 6 routers, servicios, schemas, estructura de módulos de análisis, export, quizzes, LLM y organización de tests.

## Fuera de alcance

Detalle del analysis engine (ver `analysis-engine-overview.md`), LLM providers (ver `llm-integration.md`).

## Contenido

### Aplicación FastAPI

- Entry point: `apps/api/app/main.py`
- Factory function `create_app()` configura CORS por entorno, monta 6 routers
- Sin middleware de autenticación — todas las rutas públicas
- CORS: `allow_origins` configurable, expone headers `Content-Disposition`, `X-Snapshot-Id`, `X-Content-Hash`

### Módulos y routers

| Router | Prefijo | Endpoints | Propósito |
|---|---|---|---|
| `parsing/router.py` | `/grammar` | `POST /parse` | Parseo pseudocódigo → AST |
| `classification/router.py` | `/classify` | `POST /` | Clasificación del algoritmo |
| `analysis/router.py` | `/analyze` | `POST /open`, `POST /detect-methods`, `POST /trace` | Análisis, detección de métodos, trace |
| `export/router.py` | `/export` | `POST /report` | Export snapshot → MD/LaTeX/PDF/ZIP |
| `llm/router.py` | `/llm` | `POST /`, `GET /status` | LLM jobs y estado |
| `quizzes/router.py` | `/quizzes` | `GET /health`, `GET /taxonomy`, `GET /dataset/summary`, `POST /validate`, `POST /attempts`, `POST /attempts/evaluate`, `POST /session`, `POST /evaluate` | Quizzes |
| `main.py` | — | `GET /health` | Healthcheck |

Total: 17 endpoints (15 únicos + 2 alias backward-compat).

#### Endpoints detallados

| Endpoint | Método | Input | Output |
|---|---|---|---|
| `/health` | GET | — | `{"status":"ok"}` |
| `/grammar/parse` | POST | `{"input"\|"source": string}` | `{ok, available, runtime, ast?, errors?}` |
| `/classify` | POST | `{"source"\|"ast": ...}` | `{ok, kind, method?, errors?}` |
| `/analyze/open` | POST | `{source, mode?, avgModel?, algorithm_kind?, preferred_method?}` | AnalyzeOpenResponse |
| `/analyze/detect-methods` | POST | `{source, algorithm_kind?}` | `{applicable_methods[], default_method, recurrence_info}` |
| `/analyze/trace` | POST | `{source, case?, input_size?, initial_variables?}` | TraceResponse |
| `/export/report` | POST | `{source, formats?, ...}` | Binary (MD/LaTeX/PDF/ZIP) |
| `/llm` | POST | LLMRequest | LLMResponse |
| `/llm/status` | GET | — | `{ok, status}` |
| `/quizzes/health` | GET | — | `{ok, datasetId, activeQuestions, ...}` |
| `/quizzes/taxonomy` | GET | — | Taxonomy |
| `/quizzes/dataset/summary` | GET | — | `{byTopic, byDifficulty, byCognitiveLevel, byStatus}` |
| `/quizzes/validate` | POST | — | `{ok, errors[], warnings[]}` |
| `/quizzes/attempts` | POST | QuizSelectionRequest | QuizSession |
| `/quizzes/attempts/evaluate` | POST | QuizAnswerSubmission | QuizSessionResult |
| `/quizzes/session` | POST | QuizSelectionRequest | QuizSession (alias attempts) |
| `/quizzes/evaluate` | POST | QuizAnswerSubmission | QuizSessionResult (alias attempts/evaluate) |

### Análisis: estructura interna

`modules/analysis/` contiene 16 subdirectorios/archivos:

| Submódulo | Archivos clave | Propósito |
|---|---|---|
| `analyzers/` | `base.py`, `iterative.py`, `recursive.py`, `registry.py` | Clases de análisis + registry |
| `analyzers/` | `master_steps.py`, `iteration_steps.py`, `characteristic_steps.py`, `recursion_tree_steps.py` | Step builders por método |
| `analyzers/` | `iterative_walkthrough_steps.py`, `recursive_steps_core.py` | Walkthrough builders |
| `while_engine/` | `engine.py`, `classifier.py`, `control_variables.py`, `guard_analysis.py`, `patterns/` | Motor WHILE con 12 patrones |
| `visitors/` | `for_visitor.py`, `if_visitor.py`, `simple_visitor.py`, `while_repeat_visitor.py` | AST visitors por estructura |
| `invariants/` | — | Loop invariant generation |
| `recursive_invariants/` | — | Recursive invariant generation |
| `semantics/` | `scope_resolver.py`, `symbol_table.py`, `type_inference.py` | Análisis semántico |
| `ir/` | `expr_utils.py`, ... | Intermediate representation utils |
| `models/` | `avg_model.py` | Modelo probabilístico de caso promedio |
| `utils/` | `expr_converter.py`, `summation_closer.py`, `complexity_classes.py` | Utilidades SymPy |
| `service.py` | — | Facade: orquesta análisis completo |
| `trace_service.py` | — | Facade: orquesta trace |
| `translations.py` | — | Localización de etiquetas |
| `schemas.py` | — | Pydantic schemas de request |
| `router.py` | — | FastAPI router |

### Análisis: pipeline

1. `parse_source()` → AST
2. `detect_algorithm_kind()` → `iterative`/`recursive`/`hybrid`/`unknown`
3. `AnalyzerRegistry.get(kind)` → `IterativeAnalyzer` o `RecursiveAnalyzer`
4. Analyzer hereda de `BaseAnalyzer` + visitors (MRO múltiple)
5. Visitors recorren AST, acumulan `LineCost[]` en `self.rows`
6. `build_t_open()` → Σ C_k · count_k
7. `SummationCloser` evalúa sumatorias con SymPy
8. `ComplexityClasses` deriva O/Ω/Θ
9. `IterativeAnalyzer` usa MRO: `BaseAnalyzer, ForVisitor, IfVisitor, WhileRepeatVisitor, SimpleVisitor`
10. `RecursiveAnalyzer` separa por método: Master/Iteration/RecursionTree/CharacteristicEquation

### WHILE Engine

- `WhileEngine.analyze()` recibe nodo WHILE del AST
- Flujo: guard analysis → updates analysis → classify_while (legacy) → detect_control_variables → progress proof → pattern matching
- 12 patrones en orden de prioridad:
  1. `gnome_sort_cursor`
  2. `shrinking_window_bidirectional`
  3. `sentinel_scan`
  4. `gap_shrink_then_scan`
  5. `phase_loop_composition`
  6. `merge_two_pointers`
  7. `linear_counter`
  8. `geometric_growth`
  9. `flag_kill`
  10. `euclid_mod`
  11. `binary_search_interval`
  12. `interval_shrink`
- Cada patrón implementa `matches()` y `derive_iterations()`
- Resultado: `WhileAnalysisResult` con status (`bounded`/`unbounded`/`unknown`), iteraciones, clase asintótica

### Ejecución (trace)

`modules/execution/`:

| Archivo | Propósito |
|---|---|
| `executor.py` | `CodeExecutor` — ejecuta AST con input concreto, genera pasos |
| `environment.py` | Entorno de ejecución (variables, scope) |
| `trace_builder.py` | Construye secuencia de pasos canónicos |
| `schemas.py` | Modelos de trace |
| `metrics_aggregator.py` | Agregación de métricas |
| `explanation_templates.py` | Plantillas de explicación |
| `derivations/` | Procesamiento post-ejecución |
| `derivations/structured_trace_builder.py` | Construye grafo visual (React Flow) |
| `derivations/structural_trace_classifier.py` | Clasifica estructura del trace |
| `derivations/builder_factory.py` | Factory para builders por tipo |
| `derivations/builders/` | Builders específicos (iterativo, recursivo) |

### Export

`modules/export/` contiene 21 archivos:

| Archivo | Líneas | Propósito |
|---|---|---|
| `service.py` | 42 | Facade: build_snapshot, build_assets, render_report |
| `snapshot_builder.py` | 1188 | Construye `AalieAnalysisSnapshotV1` desde source |
| `document_model.py` | 2459 | Transforma snapshot → DocumentModel |
| `markdown_renderer.py` | — | Renderiza DocumentModel → Markdown |
| `latex_renderer.py` | — | Renderiza DocumentModel → LaTeX |
| `latex_compiler.py` | — | Compila LaTeX → PDF via pdflatex |
| `zip_bundle.py` | — | Empaqueta ZIP con artefactos |
| `engine.py` | — | Orquesta render_report_result |
| `asset_builder.py` | — | Construye manifiesto de assets |
| `asset_registry.py` | — | Registro de assets disponibles |
| `models.py` | — | Pydantic models del documento |
| `i18n.py` | — | Internacionalización del export |
| `format_utils.py` | — | Utilidades de formateo |
| `section_status.py` | — | Manejo de estados de sección |
| `constants.py` | — | Constantes (schema version, defaults) |
| `trace_diagram.py` | — | Genera diagramas de trace como assets |
| `trace_diagram_assets.py` | — | Assets de diagramas |

### Quizzes

`modules/quizzes/` contiene 11 archivos:

| Archivo | Propósito |
|---|---|
| `service.py` | Facade: health, create_session, evaluate_session, dataset_summary |
| `selector.py` | Selección adaptativa determinista de preguntas |
| `grading.py` | 5 políticas de calificación + mastery delta |
| `repository.py` | Carga y caché de bancos JSON |
| `validator.py` | Validación de datasets |
| `taxonomy.py` | Carga de taxonomía |
| `schemas.py` | Pydantic models |
| `content_refs.py` | Referencias a contenido |
| `router.py` | FastAPI router (8 endpoints) |

### LLM

`modules/llm/` contiene 7 archivos:

| Archivo | Propósito |
|---|---|
| `service.py` | Facade: execute_llm_request, get_status_payload |
| `providers.py` | Proveedores: Gemini, OpenAI-compatible |
| `config.py` | Configuración por entorno |
| `schemas.py` | Pydantic models |
| `router.py` | FastAPI router (2 endpoints) |

### Configuración

- Variables de entorno: `API_KEY`, `GEMINI_ENDPOINT_BASE`, `LLM_MODEL_*`, `AALIE_EXPORTER_ASSETS_DIR`, `QUIZ_DATA_DIR`
- CORS: `get_cors_allowed_origins()`, `get_cors_enabled()` desde `core/config.py`
- Python 3.11+, dependencias en `requirements.txt`

### Tests

`apps/api/tests/` contiene:

| Carpeta | Propósito |
|---|---|
| `unit/` | Tests unitarios por módulo |
| `component/` | Tests de componentes integrados |
| `contract/` | Tests de contrato (entrada/salida esperada) |
| `system/` | Tests de sistema (end-to-end) |
| `benchmark/` | Tests de rendimiento |
| `slow/` | Tests lentos (nightly) |
| `_shared/` | Fixtures y utilidades compartidas |
| `_support/` | Soporte para tests |

## Evidencia desde código

- Router mounts: `apps/api/app/main.py:60-65`
- Module structure: `apps/api/app/modules/` con 11 subdirectorios
- Analyzer MRO: `apps/api/app/modules/analysis/analyzers/iterative.py:21`
- While patterns: `apps/api/app/modules/analysis/while_engine/engine.py:91-104`
- Quiz grading: `apps/api/app/modules/quizzes/grading.py` — 5 funciones de grading
- Snapshot builder: `apps/api/app/modules/export/snapshot_builder.py` — 1188 líneas
- Document model: `apps/api/app/modules/export/document_model.py` — 2459 líneas
- Test structure: `apps/api/tests/` con 6 categorías + shared + support

## Limitaciones

- El backend no usa LLM como fuente de verdad para parse, classify ni analyze
- Export PDF requiere `pdflatex` en el sistema
- No hay autenticación ni rate limiting
- Caché de quizzes en memoria (`lru_cache` en repository.py)
- RAG module existe pero su estado es preliminar

## Archivos relacionados

- `system-architecture.md`
- `analysis-engine-overview.md`
- `execution-trace-architecture.md`
- `llm-integration.md`
- `data-flow.md`
