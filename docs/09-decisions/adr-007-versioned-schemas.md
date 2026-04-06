# ADR-007: Schemas versionados para contratos críticos

**Tipo:** normativa

## Propósito

Hacer trazable que snapshot y schemas documentados deben versionarse y mantenerse alineados con el código.

## Alcance

Aplica a snapshot, payloads de export y cualquier schema documental que se convierta en contrato estable.

## Fuente de verdad

- `packages/types/src/export-snapshot.ts`
- `apps/api/app/modules/export/constants.py`

## Estructura

### Decision

- Los schemas críticos públicos llevan versión.
- Un cambio incompatible exige actualizar versión, documentación y checks.

## Ejemplos

- Si cambia `SNAPSHOT_SCHEMA_VERSION`, deben cambiar código, spec y validación documental.

## Limites conocidos

- No todos los payloads internos requieren versión pública, pero los contratos críticos sí.

## Archivos relacionados

- `../03-specs/report-snapshot-spec.md`
- `../04-api/schemas/`
