# ADR-002: Snapshot único para export y consistencia

**Tipo:** normativa

## Propósito

Dejar trazable la decisión de usar un snapshot versionado como única fuente de verdad para export e intercambio entre vistas.

## Alcance

Aplica a UI, export Markdown, LaTeX/PDF, ZIP y cualquier consumidor futuro del resultado de análisis.

## Fuente de verdad

- `packages/types/src/export-snapshot.ts`
- `apps/api/app/modules/export/`

## Estructura

### Decision

- Todo export se genera desde un snapshot inmutable y versionado.
- El export no recalcula parse, clasificación, análisis ni trace fuera del snapshot.

### Consecuencias

- cualquier drift entre UI y export se trata como bug;
- la versión del snapshot es contrato público;
- snapshot y export deben probarse juntos.

## Ejemplos

- Si `snapshotId` y `contentHash` no cambian, el artefacto base debe permanecer estable.

## Limites conocidos

- Un snapshot puede declarar secciones `not_implemented` o `missing_data`; eso no habilita recalculo fuera del contrato.

## Archivos relacionados

- `../03-specs/report-snapshot-spec.md`
- `../03-specs/export-engine-spec.md`
