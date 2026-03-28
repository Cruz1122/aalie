---
id: add-recursive-method-support
title: Extender soporte recursivo
when_to_use:
  - bundles nuevos recursivos
  - fixes de default_method
  - mejoras en detect-methods
required_docs:
  - docs/03-specs/recurrence-methods-spec.md
  - docs/03-specs/analysis-engine-spec.md
  - docs/04-api/analysis-api.md
recommended_tools:
  - get_change_context
  - detect_recursive_family
  - check_contract_impact
  - generate_test_oracle_stub
output_checklist:
  - familia detectada antes del método
  - applicable_methods revisados
  - default_method coherente
  - partial y unsupported explícitos
---

## Procedimiento

1. Ejecutar `detect_recursive_family` con el source real.
2. Confirmar prioridad contractual entre métodos antes de editar bundles.
3. Si el método preferido no aplica, fallar explícitamente o degradar a parcial.
4. Ajustar tests sobre familia, método por defecto y estados de bundle.

## Disciplina

- `master` solo para divide and conquer canónico.
- `characteristic_equation` solo donde la familia lo soporte.
- Un método aplicable no puede contradecir la familia detectada.
