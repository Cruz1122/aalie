# Especificación del motor de export

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/export/engine.py`, `apps/api/app/modules/export/document_model.py`, `apps/api/app/modules/export/markdown_renderer.py`, `apps/api/app/modules/export/latex_renderer.py`, `apps/api/app/modules/export/latex_compiler.py`, `apps/api/app/modules/export/zip_bundle.py`, `apps/api/app/modules/export/constants.py`, `apps/api/app/modules/export/models.py`, `apps/api/app/modules/export/snapshot_builder.py`, `apps/api/app/modules/export/trace_diagram.py`, `apps/api/app/modules/export/trace_diagram_assets.py`, `apps/api/app/modules/export/format_utils.py`, `apps/api/app/modules/export/i18n.py`, `apps/api/app/modules/export/service.py`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** Sección 5.2 — Motor de exportación

## Propósito

Documentar el pipeline de exportación completo: desde el snapshot hasta el/los artefactos finales (Markdown, LaTeX, PDF, ZIP). Establece la regla fundamental de no recálculo fuera del snapshot, el contrato de cada renderizador, el formato del manifiesto, y el manejo de errores.

## Alcance

Aplica a `/export/report`, a `render_report_result()` en `engine.py`, a todos los renderizadores (Markdown, LaTeX), al compilador PDF, al generador ZIP, y al builders de assets de diagramas. Aplica también a la internacionalización, los headers institucionales, y los disclaimers.

## Fuera de alcance

No cubre: endpoints de análisis (parse/classify/analyze/trace), rutas de frontend para visualización de reportes, despliegue del toolchain TeX.

## Contenido

### 1. Pipeline contractual

```
snapshot_input
    → build_snapshot()
    → build_document_model(snapshot)
    → build_trace_diagram_assets(document_model)
    → render_markdown_report() / render_latex_report()
    → compile_latex_to_pdf() (opcional)
    → create_zip_bundle() (opcional)
```

**Regla fundamental**: el export **no recalcula** análisis por fuera del snapshot. Cualquier transformación parte del snapshot como única fuente de verdad.

### 2. Formato de los artefactos

| Formato | Archivo | MIME type | Dependencias |
|---------|---------|-----------|--------------|
| `markdown` | `report.md` | `text/markdown; charset=utf-8` | Ninguna |
| `latex` | `report.tex` | `application/x-tex; charset=utf-8` | Ninguna |
| `pdf` | `report.pdf` | `application/pdf` | pdflatex en runtime |
| `zip` | `aalie-export-{snapshotId}.zip` | `application/zip` | Ninguna |

### 3. Markdown renderer

`render_markdown_report()` en `markdown_renderer.py`:

- Genera reporte completo con todas las secciones del `DocumentModel`.
- Tablas con alineación y pipes escapados.
- Fórmulas matemáticas en bloques `$$...$$` e inline `$...$`.
- Código en bloques `` ```text ... ``` ``.
- Listas, párrafos, énfasis, headings.
- Diagramas Mermaid (trace de ejecución recursiva).
- Metadatos ocultos en comentarios HTML (`<!-- snapshotId: ... -->`).
- Disclaimer al inicio del documento.
- Sección de resumen ejecutivo con tabla de complejidad por caso.
- Sección de análisis paso a paso (pedagogical steps).
- Tabla de trace de ejecución (si disponible).

### 4. LaTeX renderer

`render_latex_report()` en `latex_renderer.py`:

- Usa template LaTeX institucional (`%%__TOKENS__%%` reemplazados):
  - `%%__LANGUAGE_PACKAGE__%%`: `spanish,es-tabla` o `english`
  - `%%__INSTITUTION_A/B/C__%%`: líneas institucionales
  - `%%__REPORT_CODE__%%`, `%%__REPORT_VERSION__%%`, `%%__REPORT_DATE__%%`
  - `%%__VERSION_LABEL__%%`, `%%__DATE_LABEL__%%`
  - `%%__DISCLAIMER__%%`
  - `%%__EXECUTIVE_SUMMARY_TITLE__%%`, `%%__EXECUTIVE_SUMMARY_BODY__%%`
  - `%%__CONTENT_SECTIONS__%%`
- Tablas con `tabularx` y `longtable` para trazas.
- Código institucional con `\fcolorbox` y `\ttfamily`.
- Pedagogical steps con `\AALIEDisplayMath`.
- Diagramas de trace como `\includegraphics` (PDF generado por trace_diagram).
- Metadatos en comentarios LaTeX (`% snapshotId: ...`).
- Localización completa de textos de análisis (Master Theorem, case labels, etc.).
- `\FloatBarrier` antes/después de figuras.

### 5. PDF (pdflatex)

`compile_latex_to_pdf()` en `latex_compiler.py`:

- **Requiere** `pdflatex` en el PATH del runtime.
- Dos pasadas de compilación para resolver referencias.
- Timeout configurable (default 120s).
- Assets copiados: `.sty`, logos PDF, assets de diagramas.
- Si `pdflatex` no está disponible → `LatexCompilationError("compiler_missing")`.
- Si la compilación falla → `LatexCompilationError("compilation_failed")` con logs y `assetManifest`.
- Si el PDF no se genera → `LatexCompilationError("output_missing")`.
- Modo debug: `preserve_workdir_on_error` conserva el directorio de trabajo.
- Cleanup automático del directorio temporal (excepto en debug).

**Fallback**: si PDF falla, el engine retorna error con `kind`, `compilerLogs`, y `assetManifest`. El llamante puede degradar a Markdown/LaTeX.

### 6. ZIP bundle

`create_zip_bundle()` en `zip_bundle.py`:

- Contenido: `report.md` (o `report.tex`/`report.pdf`) + `snapshot.json` + `manifest.json` + assets de diagramas.
- Orden determinista: report.md → report.tex → report.pdf → snapshot.json → (otros, por nombre).
- ZIP con timestamps fijos (`2000-01-01 00:00:00`) para reproducibilidad.
- Compresión `ZIP_DEFLATED`.
- Nombre del archivo: `aalie-export-{snapshotId}.zip`.
- Metadatos en `manifest.json`: `snapshotId`, `contentHash`, `createdAt`, `formats`.

### 7. Manifest

`build_asset_manifest()` en `asset_builder.py`:

```json
[
  {
    "filename": "report.md",
    "mimeType": "text/markdown; charset=utf-8",
    "size": 12345
  },
  {
    "filename": "snapshot.json",
    "mimeType": "application/json; charset=utf-8",
    "size": 67890
  }
]
```

Incluido en la respuesta del endpoint y dentro del ZIP como `manifest.json`.

### 8. Headers y disclaimers institucionales

- **Disclaimer**: definido en `constants.py` como `INSTITUTIONAL_DISCLAIMER_TEXT` (localizado ES/EN). Texto: "Este documento fue generado automáticamente como apoyo al análisis y puede contener omisiones o imprecisiones..."
- **Headers de respuesta HTTP**: `Content-Disposition`, `X-Snapshot-Id`, `X-Content-Hash`.
- **Encabezado institucional**: 3 líneas (`institutionLineA/B/C`) + código de reporte + versión + fecha.
- **Limitaciones generales**: localizadas, 3 ítems por defecto.

### 9. Document Model

`build_document_model()` en `document_model.py` transforma el snapshot en un `DocumentModel`:

```json
{
  "title": "Reporte de Análisis Algorítmico",
  "locale": "es",
  "snapshotId": "...",
  "contentHash": "...",
  "analysisId": "...",
  "createdAt": "...",
  "disclaimer": "...",
  "institution": { "institutionLineA": "...", ... },
  "sections": [
    { "id": "executive-summary", "title": "...", "blocks": [...] },
    { "id": "pseudocode", "title": "...", "blocks": [...] },
    ...
  ]
}
```

El modelo desacopla el snapshot (datos) del render (presentación). Cada sección es una lista de `blocks` con un `kind` tipado que cada renderizador interpreta.

### 10. Snapshot como única fuente de verdad

- El snapshot se construye una vez en `build_snapshot()`.
- `build_document_model()` solo lee el snapshot; **no invoca** análisis, parse, trace ni ningún servicio de análisis.
- `render_report_result()` pasa el snapshot → document model → renderer.
- Dos renderizadores distintos producen la misma base de afirmaciones contractuales derivadas del snapshot.
- La regla aplica incluso si el snapshot tiene `missing_data` o `not_implemented`.

### 11. Dependencias del sistema

| Dependencia | Uso | Obligatoria | Fallback |
|-------------|-----|-------------|----------|
| `pdflatex` | Compilación PDF | No (solo para PDF) | Error con `kind=compiler_missing` |
| `reportlab` | Generación de assets PDF de diagramas | No (solo para PDF con diagramas) | Trace diagrama omitido |
| Plantillas LaTeX (`.sty`, logos) | Render LaTeX/PDF | Sí (incluidas en el repo) | AssetRegistryException si faltan |

### 12. Error states

| Condición | Comportamiento | Código de error |
|-----------|---------------|-----------------|
| `source` vacío | `ValueError: Field 'source' is required.` | HTTP 400 |
| `snapshot_builder` falla | Error propagado del builder interno | HTTP 500 |
| `pdflatex` no disponible | `LatexCompilationError("compiler_missing")` | HTTP 500 con `kind: "compiler_missing"` |
| Compilación LaTeX falla | `LatexCompilationError("compilation_failed")` con logs | HTTP 500 con `kind: "compilation_failed"` |
| PDF no generado | `LatexCompilationError("output_missing")` | HTTP 500 con `kind: "output_missing"` |
| Assets faltantes | Error del `asset_registry` | HTTP 500 |
| Disco lleno / escritura falla | Error del sistema de archivos | HTTP 500 |
| Ningún artifact generado | `RuntimeError: No artifacts were generated.` | HTTP 500 |

### 13. Invariantes

1. El export **no recalcula** análisis por fuera del snapshot resultante.
2. El mismo snapshot produce la misma base de contenido en UI, MD y PDF.
3. El ZIP conserva orden estable de artefactos.
4. Dos plantillas distintas pueden variar en presentación, pero no en el conjunto base de afirmaciones contractuales derivadas del snapshot.
5. `snapshotId` y `contentHash` se preservan en todos los formatos.
6. Las advertencias y estados faltantes se reportan, no se esconden ni se recalculan.
7. Si una subsección falta, la plantilla debe mostrar `not_available`/`not_supported`/`missing_data`; no puede omitir silenciosamente un bloque contractual esperado.

### 14. Casos soportados

1. **Export Markdown simple**: `formats=["markdown"]` → `report.md`.
2. **Export Markdown + LaTeX + PDF con bundle**: `formats=["markdown","latex","pdf"]` → ZIP con `report.md`, `report.tex`, `report.pdf`, `snapshot.json`, `manifest.json`.
3. **Export con trace diagramas**: automatic incluye assets SVG/PDF de diagramas cuando hay trace disponible.
4. **Export con snapshot JSON**: automático si `includeSnapshotJson = true`.
5. **Export con LLM comparativo**: si `includeLlm = true` y se provee `llmPayload`.

### 15. Casos no soportados

1. Export que calcule otra `Theta` distinta a la del snapshot.
2. PDF sin `pdflatex` disponible en el runtime (error explícito, no fallback silencioso).
3. Export sin snapshot builder (no se puede omitir el paso de construcción).
4. Modificación del `DocumentModel` después de creado (es frozen por contrato).

### 16. Evidencia

- `engine.py::render_report_result()` implementa el pipeline completo con manejo de errores.
- `latex_compiler.py::compile_latex_to_pdf()` maneja 3 estados de error distintos.
- `zip_bundle.py::create_zip_bundle()` produce ZIP determinista con orden fijo.
- `document_model.py::build_document_model()` construye el modelo de documento desde el snapshot.
- `constants.py` define `SNAPSHOT_SCHEMA_VERSION`, filenames, disclaimers, limitaciones.
- `format_utils.py` proporciona utilidades de localización y formato compartidas.

### 17. Limitaciones

- PDF depende del entorno de sistema y del toolchain TeX instalado.
- La generación de diagramas de trace puede omitirse si `reportlab` no está disponible.
- La localización de textos de análisis (Master Theorem, etc.) es un reemplazo de strings, no una traducción completa.
- El ZIP usa compresión `DEFLATED` estándar; no se soportan otros algoritmos de compresión.
- Los timestamps fijos en ZIP (`2000-01-01`) son intencionales para reproducibilidad pero pueden no coincidir con expectativas de sistemas de archivos.

## Archivos relacionados

- `report-snapshot-spec.md`
- `execution-trace-spec.md`
- `../02-architecture/report-architecture.md`
- `../04-api/export-api.md`
- `../06-operations/deployment.md`
