# ADR-009: Export LaTeX institucional

**Tipo:** decisión
**Estado:** aceptada
**Fecha:** 2026-05-18
**Fuente de verdad:** `apps/api/app/modules/export/latex_renderer.py`, `apps/api/app/modules/export/latex_compiler.py`, `apps/api/app/modules/export/constants.py`

## Contexto

El proyecto requiere generar reportes PDF de calidad institucional para entregas académicas. Se exploraron tres caminos: (a) render HTML directo a PDF via headless browser, (b) pipeline Markdown → PDF via WeasyPrint/Pandoc, (c) pipeline LaTeX con cabeceras institucionales. La salida debe incluir carátula, descargos, análisis completo, gráficos de trace, y referencias cruzadas. El PDF debe ser autocontenido (no dependiente de red) y reproducible.

## Decisión

Se adopta un pipeline LaTeX como engine de exportación institucional:

- El `latex_renderer.py` transforma el snapshot en un documento `.tex` con `aalie-report.cls` como clase institucional.
- El `latex_compiler.py` ejecuta `pdflatex` (dos pasadas para referencias cruzadas) y produce PDF.
- El snapshot es la única fuente de entrada; no hay recalculo de análisis durante la compilación LaTeX.
- Las cabeceras institucionales (logo, facultad, curso, descargo) se inyectan desde configuración, no desde el snapshot.
- La compilación falla explícitamente si `pdflatex` no está disponible en el entorno.

## Alternativas consideradas

- **HTML + headless browser**: Mayor flexibilidad visual, pero introduce dependencia pesada (Chromium/Puppeteer), incoherencia entre renders según versión del browser, y dificultad para mantener paginación y referencias cruzadas institucionales.
- **Markdown + Pandoc**: Menor costo de implementación inicial, pero pérdida de control fino sobre tipografía, espaciado, y plantilla institucional. Las referencias cruzadas y el manejo de gráficos vectoriales se vuelven frágiles.
- **LaTeX con clase personalizada**: Mayor curva de aprendizaje y dependencia de `pdflatex`, pero produce PDF reproducible, autocontenido, y con calidad editorial aceptable en entornos académicos.

## Consecuencias positivas

- PDF reproducible y autocontenido: mismo snapshot produce exactamente el mismo PDF.
- Calidad tipográfica institucional: carátula, descargos, numeración, tablas de contenido, referencias cruzadas.
- Separación clara entre datos (snapshot) y presentación (plantilla `.cls` + renderer).
- El snapshot JSON se incluye en el bundle ZIP junto al PDF, permitiendo verificación posterior.

## Consecuencias negativas

- `pdflatex` debe estar instalado en el entorno de producción o ejecutarse solo bajo demanda (no en cada request de análisis).
- El pipeline requiere dos pasadas de compilación para referencias cruzadas, añadiendo latencia.
- Los gráficos de trace deben renderizarse a vectores (TikZ o SVG convertido) antes de la compilación LaTeX.
- No todos los entornos serverless soportan la instalación de TeX Live completa; se requiere un worker dedicado o compilación diferida.

## Impacto en mantenimiento

- La clase `aalie-report.cls` debe mantenerse sincronizada con la identidad institucional (logo, colores, texto de descargo).
- Nuevos bloques de snapshot requieren actualizar `latex_renderer.py` para incluirlos en el documento `.tex`.
- La compilación LaTeX es el único export que puede fallar por entorno (falta de `pdflatex`) además de por datos.

## Evidencia

- `latex_renderer.py`: transforma `DocumentModel` → string `.tex` con secciones, tablas, y gráficos.
- `latex_compiler.py`: ejecuta `pdflatex -interaction=nonstopmode` en dos pasadas, captura logs, y retorna PDF o error.
- `constants.py`: `LATEX_DISCLAIMER`, `INSTITUTIONAL_HEADER_TEMPLATE`, rutas de assets.
- El snapshot no contiene campos específicos de LaTeX; todo el formateo vive en el renderizador.

## Archivos relacionados

- `../03-specs/export-engine-spec.md`
- `../03-specs/report-snapshot-spec.md`
- `adr-002-single-snapshot-for-exports.md`
- `adr-007-versioned-schemas.md`
