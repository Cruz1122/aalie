---
id: change-core-analysis
title: Cambiar núcleo de análisis
when_to_use:
  - cambios en parser
  - cambios en AST
  - cambios en classification
  - cambios en analysis engine
required_docs:
  - docs/03-specs/pseudocode-grammar-spec.md
  - docs/03-specs/ast-schema.md
  - docs/03-specs/analysis-engine-spec.md
  - docs/04-api/parse-api.md
  - docs/04-api/classification-api.md
  - docs/04-api/analysis-api.md
recommended_tools:
  - get_change_context
  - check_contract_impact
  - generate_test_oracle_stub
output_checklist:
  - contratos core identificados
  - impactos en API trace export y tests listados
  - expected changes definidos antes de editar
---

## Procedimiento

1. Llamar `get_change_context` para la ruta o feature exacta.
2. Leer primero `03-specs/` y solo después `04-api/`.
3. Listar qué cambia en parser, AST, clasificación o análisis y qué no cambia.
4. Revisar si el cambio altera `T_open`, clasificación, shape de `byLine`, snapshot o trace.
5. Generar stub de oráculo antes de tocar tests.

## Disciplina

- No introducir contratos nuevos en silencio.
- Separar exactitud simbólica de dominancia asintótica.
- Si el resultado correcto hoy es parcial o unsupported, no forzar una certeza falsa.
