# Documentación de AALIE

**Tipo:** descriptiva
**Estado:** final
**Audiencia:** dev | docente | evaluador | operador
**Fuente de verdad:** apps/, packages/, tests/, .github/workflows/
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** sección de documentación y referencias

## Propósito

Una única puerta de entrada para entender, cambiar, validar y operar AALIE sin depender de informes viejos, capturas de pantalla, README desactualizados o conocimiento oral del equipo. Este directorio organiza la verdad documental del proyecto en tres capas jerárquicas — contratos del núcleo, contratos secundarios y guías terciarias — cada una con su fuente de verdad en código, tests y configuración. Ningún cambio al motor de análisis, parser, export, contenido o API debe empezar sin pasar por el archivo adecuado de esta carpeta.

## Alcance

Cuatro capas de documentación:

- **Producto y arquitectura** (01-product, 02-architecture): visión, glosario, limitaciones, mapas de capacidades y diagramas de la organización real del sistema.
- **Contratos técnicos del núcleo** (03-specs, 09-decisions): especificaciones normativas del motor de análisis, parser, WHILE, recurrencias, trace, snapshot, export, quizzes, contenido y LLM. Los ADRs registran decisiones arquitectónicas vigentes.
- **Calidad y operación** (05-quality, 06-operations): estrategia de pruebas, dataset de oráculos, benchmark balanceado `LLM40`, comparación AALIE vs Direct LLM, cobertura, CI/CD, desarrollo local, despliegue, variables de entorno y troubleshooting.
- **Uso del sistema y contenido pedagógico** (07-user, 08-content): guías de usuario, flujos de trabajo en el analyzer, guías de exportación, FAQ, modelo de contenido, esquemas JSON, guía de autoría y sistema de quizzes.

No incluye: informes académicos, actas de reunión, historiales de sprint, ni documentación de terceros no integrada al repositorio.

## Capas de documentación

### CORE CONTRACTS

`03-specs/` + ADRs (`09-decisions/`). Fijan las reglas del motor. Nadie debe tocar parser, análisis, WHILE, recurrencias, trace, snapshot, export, quizzes o LLM sin leer primero estos documentos.

- **Fuente de verdad:** `apps/api/app/modules/` (análisis, export, ejecución, quizzes, LLM), `packages/grammar/` (gramática ANTLR y codegen), `packages/types/` (contratos compartidos)
- **Validación:** `apps/api/tests/contract/` (oráculos, análisis, trace, recursión), `apps/api/tests/system/` (end-to-end), `apps/api/tests/benchmark/` (rendimiento)
- **ADRs vinculantes:** `09-decisions/adr-001-docs-restructure.md`, `09-decisions/adr-002-single-snapshot-for-exports.md`, `09-decisions/adr-003-conservative-while-heuristics.md`, `09-decisions/adr-004-tests-as-oracles.md`, `09-decisions/adr-005-frontend-llm-configuration.md`, `09-decisions/adr-006-no-fallback-ui-for-inconclusive-main-path.md`, `09-decisions/adr-007-versioned-schemas.md`, `09-decisions/adr-008-unified-content-spaces.md`

### SECONDARY CONTRACTS

`04-api/`, `05-quality/`, `06-operations/`. Traducen el núcleo a interfaces externas (REST API, BFF), validación contractual, cobertura, CI/CD y operación reproducible.

- **Fuente de verdad:** routers en `apps/api/app/modules/*/router.py`, BFF routes en `apps/web/src/app/api/`, configuraciones de CI en `.github/workflows/ci.yaml`
- **Validación:** `scripts/check_docs_contracts.py`, `apps/api/tests/contract/` (contratos de API), `apps/api/tests/system/` (endpoints)

### TERTIARY GUIDES

`01-product/`, `02-architecture/`, `07-user/`, `08-content/`. Contexto del producto, visión, limitaciones, mapas de arquitectura, guías de usuario final y documentación de autoría de contenido. No reemplazan contratos normativos.

- **Fuente de verdad:** `packages/content-catalog/` (catálogo JSON versionado), `apps/web/src/app/[locale]/` (páginas de curso, quizzes, ejemplos), `apps/api/app/modules/quizzes/` (backend de quizzes)

## Perfil de lectura recomendada

| Rol | Entrada recomendada | Luego leer | Valida con |
|---|---|---|---|
| Dev backend | `02-architecture/backend-architecture.md` | `03-specs/` (ruta crítica) + `04-api/` endpoints | `pnpm test:api:contract` |
| Dev frontend | `02-architecture/frontend-architecture.md` | `04-api/` (contratos BFF) + `08-content/` schemas | `pnpm --filter web test` + `pnpm validate:content-catalog` |
| QA / evaluador | `05-quality/testing-strategy.md` | `05-quality/algorithm-oracles.md` + `05-quality/benchmarking.md` + `05-quality/coverage-policy.md` | `pnpm test:api:cov` (gate 70%) |
| Operador / DevOps | `06-operations/local-development.md` | `06-operations/environment-variables.md` + `06-operations/deployment.md` | `pnpm -r build` |
| Usuario / docente | `07-user/user-guide.md` | `07-user/analyzer-workflows.md` + `07-user/quizzes-guide.md` | — |
| Autor de contenido | `08-content/content-model.md` | `08-content/authoring-guide.md` + `08-content/course-json-schema.md` | `pnpm validate:content-catalog` |
| Implementación canónica | `packages/content-catalog/` (código) | `08-content/` (contratos) | `python apps/api/scripts/validate_quiz_bank.py` |

## Ruta crítica obligatoria

Si vas a tocar el sistema base, lee estos 8 documentos **antes** de cambiar código:

1. `03-specs/pseudocode-grammar-spec.md` — gramática ANTLR del lenguaje
2. `03-specs/ast-schema.md` — estructura del AST
3. `03-specs/analysis-engine-spec.md` — motor de análisis (clasificación, costeo, notación asintótica)
4. `03-specs/while-heuristics-spec.md` — heurísticas conservadoras para ciclos WHILE
5. `03-specs/recurrence-methods-spec.md` — métodos de resolución de recurrencias
6. `03-specs/execution-trace-spec.md` — formato y generación de trazas de ejecución
7. `03-specs/report-snapshot-spec.md` — schema del snapshot de reporte
8. `03-specs/export-engine-spec.md` — motor de exportación (Markdown, LaTeX, PDF, ZIP)

Si el cambio afecta interfaces externas, añade además la sección correspondiente de `04-api/` y `05-quality/testing-strategy.md`.

## Validación de documentación

La consistencia entre la documentación y el código se valida automáticamente:

| Comando | Qué valida |
|---|---|
| `pnpm test:docs-contracts` | Estructura de directorios de `docs/` y sincronización de versiones de schema de snapshot |
| `python scripts/check_docs_contracts.py` | Mismo script, ejecución directa |
| `.github/workflows/ci.yaml` (job `docs-contracts`) | Se ejecuta en cada PR contra main |

El script `scripts/check_docs_contracts.py` verifica que:
- Todos los directorios esperados existan (`01-product/` a `09-decisions/`)
- Los archivos críticos no hayan sido eliminados accidentalmente
- La versión del schema de snapshot en `03-specs/report-snapshot-spec.md` coincida con la versión en `04-api/schemas/snapshot-schema.md` y en `packages/types/`

## Archivos relacionados

- `index.md` — mapa de navegación por tarea
- `01-product/vision.md` — visión del producto
- `01-product/glossary.md` — glosario de términos
- `01-product/known-limitations.md` — limitaciones conocidas
- `02-architecture/system-architecture.md` — arquitectura general
- `06-operations/local-development.md` — guía de desarrollo local
- `09-decisions/adr-001-docs-restructure.md` — ADR que define esta estructura de docs
