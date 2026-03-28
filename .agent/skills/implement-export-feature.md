---
id: implement-export-feature
title: Implementar export
when_to_use:
  - cambios en markdown
  - cambios en pdf
  - cambios en latex
  - cambios en zip
  - cambios en snapshot rendering
required_docs:
  - docs/03-specs/report-snapshot-spec.md
  - docs/03-specs/export-engine-spec.md
  - docs/04-api/execution-api.md
  - docs/09-decisions/adr-002-single-snapshot-for-exports.md
recommended_tools:
  - get_change_context
  - check_contract_impact
  - validate_snapshot_contract
  - generate_test_oracle_stub
output_checklist:
  - snapshot como fuente única verificado
  - renderer afectado identificado
  - contrato público preservado
  - tests de snapshot y export listados
---

## Procedimiento

1. Confirmar con `check_contract_impact` si tocas snapshot, types o renderer.
2. Validar cualquier snapshot real con `validate_snapshot_contract`.
3. Diseñar el cambio sobre renderer o template, no sobre recálculo analítico.
4. Verificar mínimos contractuales por formato antes de añadir presentación extra.
5. Probar estabilidad de snapshotId/contentHash cuando el input no cambia.

## Disciplina

- Export no recalcula.
- `internal` no se vuelve dependencia pública.
- UI y export deben leer el mismo snapshot.
