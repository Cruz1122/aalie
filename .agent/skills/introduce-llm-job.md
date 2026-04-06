---
id: introduce-llm-job
title: Introducir job LLM
when_to_use:
  - parser assist
  - compare
  - explain
  - repair
  - diagrams
required_docs:
  - docs/02-architecture/llm-integration.md
  - docs/04-api/llm-api.md
  - docs/06-operations/environment-variables.md
  - docs/09-decisions/adr-005-frontend-llm-configuration.md
recommended_tools:
  - get_change_context
  - check_contract_impact
output_checklist:
  - job opcional y aislado
  - env vars centralizadas
  - prompts y modelo definidos en configuración central
  - backend determinista no redefinido
---

## Procedimiento

1. Verificar que el job vive en `apps/web/src/app/api/llm/`.
2. Añadir modelo, prompt y flags en la configuración centralizada.
3. Mantener fallback claro cuando no haya API key o el job esté deshabilitado.
4. Confirmar que el job no cambia el contrato del backend determinista.

## Disciplina

- El LLM complementa; no sustituye el motor determinista.
- No dispersar prompts o modelos por componentes.
