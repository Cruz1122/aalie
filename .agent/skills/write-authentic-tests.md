---
id: write-authentic-tests
title: Escribir tests auténticos
when_to_use:
  - cualquier cambio no trivial
  - regresiones contractuales
  - nuevos oráculos algorítmicos
required_docs:
  - docs/05-quality/testing-strategy.md
  - docs/05-quality/algorithm-oracles.md
  - docs/09-decisions/adr-004-tests-as-oracles.md
recommended_tools:
  - check_contract_impact
  - generate_test_oracle_stub
  - evaluate_while_case
  - detect_recursive_family
output_checklist:
  - comparación exacta simbólica o contractual declarada
  - expected estructurado definido
  - partial o unsupported aceptados cuando corresponda
  - suites mínimas a ejecutar listadas
---

## Procedimiento

1. Sacar el `generate_test_oracle_stub` antes de redactar el expected.
2. Elegir explícitamente `exact`, `symbolic` o `contractual`.
3. Reusar oráculos existentes cuando el caso ya esté catalogado.
4. Si el resultado correcto es inconcluso, escribirlo así en el expected.

## Disciplina

- No escribir tests que solo validen “no explota”.
- La equivalencia simbólica debe apoyarse en SymPy cuando aplique.
- Un expected narrativo no sustituye un expected estructurado.
