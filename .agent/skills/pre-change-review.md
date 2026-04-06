---
id: pre-change-review
title: Revisión previa al cambio
when_to_use:
  - antes de tocar cualquier parte core
  - cuando el alcance no está claro
  - cuando una edición toca contratos públicos
required_docs:
  - docs/index.md
  - docs/03-specs/analysis-engine-spec.md
  - docs/03-specs/report-snapshot-spec.md
  - docs/05-quality/testing-strategy.md
recommended_tools:
  - get_change_context
  - check_contract_impact
output_checklist:
  - área primaria del cambio
  - docs obligatorias
  - nivel de riesgo
  - tests mínimos a revisar
---

## Procedimiento

1. Ejecutar `get_change_context` con la ruta o feature exacta.
2. Si hay varios archivos tocados, ejecutar `check_contract_impact`.
3. Anotar contratos afectados, decisiones ADR relevantes y tests mínimos.
4. Solo después pasar a implementación.

## Disciplina

- Esta revisión es obligatoria para evitar cambios improvisados.
- Si el riesgo es alto y el contrato no está claro, se re-lee spec antes de editar.
