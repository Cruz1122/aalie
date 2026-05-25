# Exports Guide

**Tipo:** guía
**Estado:** final
**Audiencia:** estudiante
**Fuente de verdad:** `apps/api/app/export/`, `apps/web/src/components/ExportFormatSelector.tsx`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** sección 3.5 (exportación)

## Overview

AALIE can export analysis results as downloadable reports. All exports are generated from a single **snapshot** — a frozen copy of the analysis results. This guarantees that the screen view and the exported file are consistent.

**To export:**
1. Run an analysis (results must be available).
2. Click the **Export** button or choose **Export Report**.
3. Select a format.
4. Click **Generate**.
5. The file downloads automatically.

## Available Formats

### Markdown (.md)

- **Best for**: quick sharing, version control, pasting into documents.
- **Speed**: instant (no external dependencies).
- **Content**: full analysis report including pseudocode, classification, by-line cost table, efficiency equation, asymptotic notation, procedure steps, and warnings.
- **Requires**: nothing.
- **Output**: a single `.md` file.

### LaTeX (.tex)

- **Best for**: academic papers, theses, formal reports.
- **Speed**: fast (no external compilation needed for the `.tex` file itself).
- **Content**: same content as Markdown, formatted in LaTeX with proper math environments.
- **Requires**: nothing to generate; requires `pdflatex` to compile to PDF.
- **Output**: a single `.tex` file ready for compilation.

### PDF (.pdf)

- **Best for**: submitting to instructors, printing, institutional records.
- **Speed**: depends on `pdflatex` availability.
- **Content**: same as LaTeX, pre-compiled to PDF.
- **Requires**: `pdflatex` must be installed and available in the runtime environment (backend server).
- **Output**: a single `.pdf` file.
- **⚠️ Warning**: PDF generation may fail if `pdflatex` is not installed, is misconfigured, or if the LaTeX file has complex rendering. In that case, try Markdown or ZIP instead.

### ZIP (.zip)

- **Best for**: archiving the complete analysis with all artifacts.
- **Speed**: fast (bundling, no compilation).
- **Content**: a compressed archive containing:
  - `report.md` — the Markdown report
  - `snapshot.json` — the complete analysis data in JSON (machine-readable, can be re-imported)
  - `manifest.json` — metadata about the export (version, timestamp, algorithm name)
- **Requires**: nothing.
- **Output**: a single `.zip` file.
- **Use case**: "Save your work" — the ZIP bundle can be archived, shared, or used to reproduce results later.

## Report Contents (All Formats)

Every report includes:

1. **Header**: algorithm name, analysis timestamp, classification.
2. **Pseudocode**: the original source code.
3. **Analysis Results**:
   - By-line cost table (line number, cost, count, operations)
   - Efficiency equation T(n)
   - Grouped polynomial expression T_polynomial
   - Asymptotic notation O/Ω/Θ for each case (worst, best, average)
4. **Procedure**: step-by-step derivation (iterative sums or recurrence method steps).
5. **Warnings**: any warnings produced during analysis.
6. **Loop/Recursive Invariant**: if available.

## When to Use Each Format

| Scenario | Recommended Format |
|----------|-------------------|
| Quick check / version control | Markdown |
| Academic paper / thesis | LaTeX (compile to PDF yourself) |
| Submit to instructor | PDF |
| Archive complete analysis | ZIP |
| Re-import or process data | ZIP (contains snapshot.json) |
| Pasting into a document | Markdown |

## Limitations

- **PDF may fail** if the backend does not have `pdflatex` installed or if the LaTeX template encounters errors with special characters.
- **The export does not recalculate analysis** — it uses the stored snapshot. If you re-run analysis, you must export again to get updated results.
- **Warnings are preserved** in exports. A partial result exports as-is, including any warnings.
- **Large reports** with many by-line entries or deep recursion trees may produce verbose output. ZIP format includes the raw data for programmatic processing.

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| PDF download stuck or empty | `pdflatex` not installed on backend | Use Markdown or ZIP instead. |
| LaTeX file doesn't compile | Missing packages or syntax error in template | Try the Markdown version. Report the issue if the template has a bug. |
| ZIP doesn't contain snapshot.json | Export error | Re-run analysis and export again. |
| Report shows "N/A" for some fields | Those fields were not produced by the analysis | This is expected for partial results. The report reflects the available data. |

## Related

- `docs/03-specs/export-engine-spec.md` — technical specification of the export pipeline
- `docs/03-specs/report-snapshot-spec.md` — snapshot JSON format
