# ADR-014: Validación de contratos documentales en CI

**Tipo:** decisión
**Estado:** aceptada
**Fecha:** 2026-05-18
**Fuente de verdad:** `scripts/check_docs_contracts.py`, `.github/workflows/ci.yaml`, `.github/workflows/docs-contract.yml`

## Contexto

Los documentos en `/docs` son fuente de verdad contractual para el proyecto: specs de API, esquemas de snapshot, formatos de export, y ejemplos canónicos. Sin validación automatizada, estos documentos pueden divergir del código sin que nadie lo note hasta que un bug en producción o una integración fallida lo revela. Se necesitaba un mecanismo para garantizar que los cambios en código que afectan contratos documentales exijan la actualización correspondiente de la documentación.

## Decisión

Se implementa un sistema de validación de contratos documentales ejecutado en CI (GitHub Actions) que verifica automáticamente que los documentos contractuales estén actualizados y sean coherentes con el código.

- `scripts/check_docs_contracts.py` es el script central de validación. Verifica:
  - Que los archivos listados como "fuente de verdad" en los ADRs y specs existan realmente.
  - Que los schemas documentados (`report-snapshot-spec.md`, `export-engine-spec.md`, etc.) coincidan estructuralmente con sus implementaciones en TypeScript/Python.
  - Que los cambios en archivos de contrato crítico (`report-snapshot-spec.md`, `snapshot-builder.py`, `export-snapshot.ts`) exijan cambios documentales en el mismo PR.
- El workflow `docs-contract.yml` se ejecuta en cada PR que toca archivos de contrato.
- Si la validación falla, el PR queda marcado como `docs-contract-failed` y no puede mergearse sin aprobación explícita.

## Alternativas consideradas

- **Validación manual en code review**: Depende enteramente de la diligencia del revisor. Frágil y no escalable. Los contratos documentales suelen pasarse por alto en PRs grandes.
- **Generación de documentación desde código (OpenAPI/Swagger)**: Funciona para APIs REST pero no para documentación conceptual, specs de snapshot, o ejemplos pedagógicos. No cubre todo el espectro contractual.
- **Tests de integración que comparan doc vs código**: Similar a la decisión, pero sin un script dedicado. Se optó por un script independiente para tener lógica de validación explícita y reutilizable fuera de los tests de unidad.

## Consecuencias positivas

- Los contratos documentales se mantienen sincronizados con el código de forma automatizada.
- El equipo recibe feedback inmediato en el PR si un cambio contractual no tiene documentación correspondiente.
- Los ADRs y specs son verificables: las rutas de "fuente de verdad" se comprueban contra el sistema de archivos.
- Reducción de bugs por divergencia entre docs y código.

## Consecuencias negativas

- El script de validación debe mantenerse actualizado a medida que cambian los formatos y schemas documentales.
- Puede producir falsos positivos si la validación es demasiado estricta (ej: cambio cosmético en doc que no afecta contrato).
- Los PRs pequeños que tocan un archivo de contrato se ven forzados a incluir actualización documental, lo que añade fricción mínima pero real.

## Impacto en mantenimiento

- `check_docs_contracts.py` debe actualizarse si se agregan nuevos contratos documentales o cambia la estructura de `/docs`.
- Las reglas de validación (qué archivos son contractuales, qué cambios los activan) se definen en el script, no en configuración externa.
- El workflow de CI puede ampliarse para incluir validación de enlaces, formato, o consistencia cross-reference.

## Evidencia

- `scripts/check_docs_contracts.py`: implementa `validate_truth_sources()`, `validate_schema_consistency()`, `validate_pr_docs_requirement()`.
- `.github/workflows/docs-contract.yml`: se ejecuta en `pull_request` para paths que coinciden con `apps/api/app/modules/export/**`, `packages/types/src/export-snapshot.ts`, `docs/03-specs/**`, `docs/09-decisions/**`.
- `.github/workflows/ci.yaml`: incluye paso `check-docs-contracts` como parte del pipeline de CI general.
- Los ADRs existentes (001-008) ya listan `Fuente de verdad`; el script verifica que esas rutas existan.

## Archivos relacionados

- `adr-001-docs-restructure.md`
- `adr-007-versioned-schemas.md`
- `adr-002-single-snapshot-for-exports.md`
- `../README.md`
- `scripts/check_docs_contracts.py`
