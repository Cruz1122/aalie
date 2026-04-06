---
id: debug-while-analysis
title: Depurar análisis WHILE
when_to_use:
  - cambios en while_engine
  - bugs de conteo en WHILE
  - heurísticas nuevas de WHILE
required_docs:
  - docs/03-specs/analysis-engine-spec.md
  - docs/03-specs/while-heuristics-spec.md
  - docs/09-decisions/adr-003-conservative-while-heuristics.md
recommended_tools:
  - get_change_context
  - evaluate_while_case
  - check_contract_impact
output_checklist:
  - patrón identificado
  - evidence level justificado
  - ambigüedad o contradicción explícita
  - tests contract a tocar listados
---

## Procedimiento

1. Correr `evaluate_while_case` sobre el source mínimo que reproduce el problema.
2. Confirmar patrón, reason code, controlador dominante y evidencia.
3. Si hay empate fuerte o ambigüedad, degradar la conclusión; no elegir por orden incidental.
4. Revisar si el cambio amplía cobertura real o solo cambia diagnóstico.
5. Actualizar oráculos WHILE auténticos, no solo status code.

## Disciplina

- Conclusión fuerte solo con evidencia `strong`.
- En caso no cubierto, preferir `unknown` o salida parcial.
- El ADR conservador manda sobre atajos de implementación.
