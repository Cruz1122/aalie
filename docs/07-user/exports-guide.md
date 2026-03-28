# Guía de exports

**Tipo:** descriptiva

## Propósito

Explicar cómo exportar resultados y qué garantiza cada formato.

## Alcance

Cubre Markdown, PDF, ZIP y advertencias institucionales.

## Fuente de verdad

- selector de export del frontend
- `/export/report`

## Estructura

### Formatos

- Markdown: rápido y versionable
- PDF: institucional, dependiente de LaTeX
- ZIP: bundle con artefactos y snapshot

### Garantias

- el contenido base sale del mismo snapshot;
- el export no recalcula el análisis;
- las advertencias del sistema se preservan.

## Ejemplos

- si necesitas revisar o compartir el resultado exacto, usa ZIP.

## Límites conocidos

- PDF puede fallar por toolchain TeX aunque el resto del flujo funcione.

## Archivos relacionados

- `user-guide.md`
- `../03-specs/export-engine-spec.md`
- `../03-specs/report-snapshot-spec.md`
