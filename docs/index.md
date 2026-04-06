# Mapa de navegación de docs

**Tipo:** descriptiva

## Propósito

Ofrecer un mapa rápido para localizar la documentación correcta según la tarea que se quiera resolver.

## Alcance

Este archivo organiza la lectura por objetivo práctico, no por historia del proyecto.

## Fuente de verdad

- estructura actual de `/docs`;
- módulo real del sistema en `apps/` y `packages/`.

## Estructura

### Cómo leer este índice

- `Lectura conceptual`: ayuda a ubicar el sistema y entender responsabilidades.
- `Contrato obligatorio`: fuente de verdad que debe cambiar si cambia el comportamiento contractual.
- si ambos aparecen juntos, el contrato obligatorio prevalece.

### Entender el sistema

Lectura conceptual:

1. `01-product/vision.md`
2. `02-architecture/system-architecture.md`
3. `02-architecture/frontend-architecture.md`
4. `02-architecture/backend-architecture.md`

### Cambiar parser, AST o análisis

Contrato obligatorio:

1. `03-specs/pseudocode-grammar-spec.md`
2. `03-specs/ast-schema.md`
3. `03-specs/analysis-engine-spec.md`
4. `03-specs/while-heuristics-spec.md`
5. `03-specs/recurrence-methods-spec.md`

Contrato secundario:

6. `04-api/parse-api.md`
7. `04-api/analysis-api.md`

### Trazas, snapshot y export

Lectura conceptual:

1. `02-architecture/execution-trace-architecture.md`

Contrato obligatorio:

2. `03-specs/execution-trace-spec.md`
3. `03-specs/report-snapshot-spec.md`
4. `03-specs/export-engine-spec.md`

### Integración FE/BE

Contrato obligatorio:

1. `04-api/endpoints-overview.md`
2. `04-api/analysis-api.md`
3. `04-api/execution-api.md`
4. `04-api/llm-api.md`

### Validar comportamiento

Contrato obligatorio:

1. `05-quality/testing-strategy.md`
2. `05-quality/algorithm-oracles.md`
3. `05-quality/coverage-policy.md`
4. `05-quality/benchmarking.md`

### Levantar y operar el proyecto

1. `06-operations/local-development.md`
2. `06-operations/environment-variables.md`
3. `06-operations/deployment.md`
4. `06-operations/troubleshooting.md`

### Usar AALIE

1. `07-user/user-guide.md`
2. `07-user/analyzer-workflows.md`
3. `07-user/recursive-analysis-guide.md`
4. `07-user/exports-guide.md`
5. `07-user/examples-guide.md`

### Diseñar contenido y quizzes

1. `08-content/content-model.md`
2. `08-content/course-json-schema.md`
3. `08-content/block-json-schema.md`
4. `08-content/inline-rich-text-schema.md`
5. `08-content/content-validation.md`
6. `08-content/search-indexing.md`
7. `08-content/progress-model.md`
8. `08-content/quiz-json-schema.md`
9. `08-content/authoring-guide.md`

## Ejemplos

- Si una ruta HTTP cambia, actualizar primero `04-api/` y luego validar `scripts/check_docs_contracts.py`.
- Si una regla de WHILE cambia, actualizar `03-specs/while-heuristics-spec.md`, el ADR relevante si cambia una decisión, y los tests contract.
- Si cambia el contrato de contenido, actualizar `08-content/`, `packages/content-catalog/` y el ADR `09-decisions/adr-008-unified-content-spaces.md`.

## Límites conocidos

- Este mapa no sustituye los contratos normativos de `03-specs/` y `04-api/`.

## Archivos relacionados

- `README.md`
- `09-decisions/adr-001-docs-restructure.md`
