---
id: add-content-module
title: Añadir módulo de contenido
when_to_use:
  - contenido modular
  - nuevos cursos
  - nuevos quizzes
required_docs:
  - docs/03-specs/content-modules-spec.md
  - docs/03-specs/quizzes-spec.md
  - docs/08-content/content-model.md
  - docs/08-content/course-json-schema.md
  - docs/08-content/quiz-json-schema.md
recommended_tools:
  - get_change_context
  - check_contract_impact
  - generate_test_oracle_stub
output_checklist:
  - schema de curso respetado
  - schema de quiz respetado
  - validación y render sin lógica ad hoc
---

## Procedimiento

1. Leer primero el modelado de contenido y luego los schemas JSON.
2. Mantener separado el contenido declarativo de la lógica de render.
3. Si cambias catálogo o vistas, revisar tests del examples catalog.

## Disciplina

- No meter convenciones implícitas solo en frontend.
- Los campos opcionales siguen siendo opcionales; no convertirlos en requeridos sin contrato.
