# Especificación del motor de export

**Tipo:** normativa

## Propósito

Documentar el pipeline de export y la regla de no recálculo fuera del snapshot.

## Alcance

Aplica a `/export/report`, render Markdown, LaTeX/PDF, ZIP y manifiesto.

## Fuente de verdad

- `apps/api/app/modules/export/engine.py`
- `apps/api/app/modules/export/document_model.py`
- `apps/api/app/modules/export/markdown_renderer.py`
- `apps/api/app/modules/export/latex_renderer.py`

## Estructura

### Pipeline contractual

- `snapshot -> document model -> markdown/latex -> pdf/zip`

### Formatos soportados

- `markdown`
- `latex`
- `pdf`
- `zip` cuando se piden múltiples artefactos o snapshot adjunto

### Reglas institucionales

- incluir disclaimer institucional;
- preservar `snapshotId` y `contentHash`;
- reportar advertencias y estados faltantes en vez de recalcular o esconderlos.

### Contrato mínimo de plantillas

- toda plantilla debe renderizar: metadatos básicos, pseudocódigo fuente, tipo de algoritmo, resultado principal, advertencias y `snapshotId`.
- si el algoritmo es iterativo, la plantilla debe incluir al menos costos por línea o resumen equivalente, `T_open`/forma principal disponible y notaciones.
- si el algoritmo es recursivo, la plantilla debe incluir recurrencia, método seleccionado o estado inconcluso explícito, y detalle paso a paso cuando exista.
- si hay trace disponible, la plantilla puede resumirlo o adjuntarlo, pero nunca inventarlo si falta.
- si falta una subsección, la plantilla debe mostrar estado `not_available`, `not_supported`, `missing_data` o equivalente textual; no puede omitir silenciosamente un bloque contractual esperado.

## Inputs

- payload de export con `source`, `formats`, locale y caches opcionales;
- snapshot builder interno;
- toolchain TeX si se genera PDF.

## Outputs

- artefacto principal;
- headers `Content-Disposition`, `X-Snapshot-Id`, `X-Content-Hash`;
- ZIP con orden determinista cuando aplica.

## Invariantes

- el export no recalcula análisis por fuera del snapshot resultante;
- el mismo snapshot produce la misma base de contenido en UI, MD y PDF;
- el ZIP conserva orden estable de artefactos.
- dos plantillas distintas pueden variar en presentación, pero no en el conjunto base de afirmaciones contractuales derivadas del snapshot.

## Errores esperables

- `source` faltante;
- error del snapshot builder;
- fallo de compilación LaTeX;
- origen CORS no permitido.

## Ejemplos

### Ejemplos validos

- `formats=["markdown"]`: devuelve `report.md`.
- `formats=["markdown","pdf"]` con bundle: devuelve ZIP con `report.md`, `report.pdf`, `snapshot.json`, `manifest.json`.

### Ejemplos no soportados

- export que calcule otra `Theta` distinta a la del snapshot;
- PDF sin `pdflatex` disponible en el runtime.

## Limites conocidos

- PDF depende del entorno de sistema y del toolchain TeX instalado.

## Archivos relacionados

- `report-snapshot-spec.md`
- `../04-api/execution-api.md`
- `../06-operations/deployment.md`
