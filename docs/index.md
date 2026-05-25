# Mapa de navegación de docs

**Tipo:** descriptiva
**Estado:** final
**Audiencia:** dev | docente | evaluador | operador | autor-contenido
**Fuente de verdad:** estructura actual de `/docs`, módulos del sistema en `apps/` y `packages/`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** sección de documentación, mapa de referencias cruzadas

## Propósito

Ofrecer un mapa rápido para localizar la documentación correcta según la tarea que se quiera resolver. Organiza la lectura por objetivo práctico, no por historia del proyecto ni por estructura de carpetas. Cada fila indica qué leer primero, qué leer después y cómo validar que el cambio sea correcto.

## Navegación por tarea

| Quiero... | Leer primero | Luego leer | Validar con |
|---|---|---|---|
| Entender el producto | `01-product/vision.md` + `01-product/final-scope.md` | `01-product/capability-map.md` | `README.md` (raíz) |
| Presentar AALIE | `01-product/presentation-brief.md` | `01-product/generative-ai-usage.md` | — |
| Cambiar parser / AST | `03-specs/pseudocode-grammar-spec.md` + `03-specs/ast-schema.md` | `04-api/parse-api.md` + `04-api/schemas/parse-schema.md` | `apps/api/tests/contract/oracles/` |
| Cambiar análisis iterativo | `03-specs/analysis-engine-spec.md` + `03-specs/iterative-analysis-spec.md` | `04-api/analysis-api.md` + `04-api/schemas/analysis-schema.md` | `apps/api/tests/contract/oracles/test_iterative_*.py` |
| Cambiar WHILE | `03-specs/while-heuristics-spec.md` | `03-specs/analysis-engine-spec.md` | `apps/api/tests/contract/oracles/test_while_*.py` |
| Cambiar recurrencias | `03-specs/recurrence-methods-spec.md` | `03-specs/analysis-engine-spec.md` | `apps/api/tests/contract/oracles/test_recursive_*.py` |
| Cambiar trace | `03-specs/execution-trace-spec.md` | `02-architecture/data-flow.md` + `02-architecture/execution-trace-architecture.md` | `apps/api/tests/contract/trace_contracts/` |
| Cambiar export | `03-specs/report-snapshot-spec.md` + `03-specs/export-engine-spec.md` | `04-api/execution-api.md` + `04-api/schemas/export-report-schema.md` | `apps/api/tests/contract/export/` + `apps/api/tests/unit/export/` |
| Cambiar LLM | `03-specs/llm-assistance-spec.md` | `04-api/llm-api.md` + `04-api/schemas/llm-schema.md` | `apps/api/tests/system/llm/` |
| Cambiar contenido | `08-content/content-model.md` + `08-content/course-json-schema.md` | `08-content/authoring-guide.md` + `08-content/block-json-schema.md` + `08-content/inline-rich-text-schema.md` | `pnpm validate:content-catalog` |
| Cambiar quizzes | `03-specs/quizzes-spec.md` + `08-content/quiz-json-schema.md` | `04-api/quizzes-api.md` | `python apps/api/scripts/validate_quiz_bank.py` |
| Validar comportamiento | `05-quality/testing-strategy.md` + `05-quality/algorithm-oracles.md` | `05-quality/coverage-policy.md` + `05-quality/benchmarking.md` | `pnpm test:api:cov` (gate 70%) |
| Comparar AALIE vs LLM | `05-quality/benchmarking.md` | `apps/api/tests/llm_comparison/README.md` + `apps/api/tests/llm_comparison/out/llm40_aalie_vs_llm_report.md` | `python apps/api/tests/llm_comparison/score_llm40_outputs.py ...` |
| Operar localmente | `06-operations/local-development.md` | `06-operations/environment-variables.md` + `06-operations/deployment.md` | `pnpm -r build` |
| Preparar Manual Técnico | `01-product/manual-tecnico-coverage-map.md` | Todos los CORE CONTRACTS (`03-specs/`) | `pnpm test:docs-contracts` |
| Usar AALIE como estudiante | `07-user/user-guide.md` + `07-user/analyzer-workflows.md` | `07-user/recursive-analysis-guide.md` + `07-user/exports-guide.md` + `07-user/course-guide.md` | — |
| Usar AALIE como docente | `07-user/user-guide.md` + `07-user/examples-guide.md` | `08-content/authoring-guide.md` + `07-user/faq.md` | — |
| Revisar decisión arquitectónica | `09-decisions/` (ADR por tema) | `03-specs/` (especificación afectada) | ADR vinculante + tests contract asociados |
| Integrar FE/BE | `04-api/endpoints-overview.md` | `04-api/analysis-api.md` + `04-api/execution-api.md` + `04-api/llm-api.md` | `apps/api/tests/system/` |
| Diagnosticar problema en producción | `06-operations/troubleshooting.md` | `06-operations/environment-variables.md` + `05-quality/performance.md` | `apps/api/tests/contract/regression/` |

## Tareas específicas

- **Si una ruta HTTP cambia:** actualizar primero `04-api/` (endpoint + schema), luego validar con `scripts/check_docs_contracts.py` y correr `apps/api/tests/system/` para verificar el contrato contra el router real.
- **Si una regla de WHILE cambia:** actualizar `03-specs/while-heuristics-spec.md`, el ADR relevante (`09-decisions/adr-003-conservative-while-heuristics.md`), y los tests contract en `apps/api/tests/contract/oracles/test_while_*.py`.
- **Si cambia el contrato de contenido:** actualizar `08-content/` (modelo, schemas), `packages/content-catalog/` (validación e implementación), y el ADR `09-decisions/adr-008-unified-content-spaces.md`.
- **Si cambia el snapshot de export:** actualizar `03-specs/report-snapshot-spec.md`, `04-api/schemas/snapshot-schema.md`, y verificar sincronización de versiones con `pnpm test:docs-contracts`.
- **Si se agrega un módulo al monorepo:** actualizar `02-architecture/system-architecture.md`, agregar la entrada en `README.md` raíz, y verificar que `scripts/check_docs_contracts.py` no falle por estructura faltante.
- **Si se añade un endpoint de quizzes:** actualizar `04-api/quizzes-api.md`, agregar el proxy BFF en `apps/web/src/app/api/` y verificar contra `python apps/api/scripts/validate_quiz_bank.py`.

## Límites conocidos

- Este mapa no sustituye los contratos normativos de `03-specs/` y `04-api/`.
- Varios archivos referenciados en las tablas son planificados pero aún no existen en el repositorio (ver informe de entrega).
- Las rutas de validación que apuntan a `tests/contract/export/` asumen la creación de ese directorio; actualmente los tests de export residen en `apps/api/tests/unit/export/` y `apps/api/tests/benchmark/test_export_benchmark.py`.

## Archivos relacionados

- `README.md` — gateway principal de documentación
- `01-product/vision.md` — visión del producto
- `09-decisions/adr-001-docs-restructure.md` — ADR que define la estructura actual de documentación
- `scripts/check_docs_contracts.py` — script de validación de estructura documental
