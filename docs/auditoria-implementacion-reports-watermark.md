# Auditoría de implementación de Reports y marca de agua

Este documento consolida la implementación de exportación de reportes (`markdown`, `latex`, `pdf`) y detalla la ruta de la marca de agua para auditar el problema: **"la marca de agua sale negra full"**.

## 1) Mapa de archivos (implementación de reports)

- `apps/web/src/app/api/export/report/route.ts`
- `apps/web/src/server/export/export-service.ts`
- `packages/exporter/src/application/export-orchestrator.ts`
- `packages/exporter/src/renderers/document-model-builder.ts`
- `packages/exporter/src/renderers/markdown/index.ts`
- `packages/exporter/src/renderers/latex/index.ts`
- `packages/exporter/assets/latex/templates/main.template.tex`
- `packages/exporter/assets/latex/aalie-report.sty`
- `packages/exporter/src/infrastructure/assets/asset-registry.ts`
- `packages/exporter/src/infrastructure/pdf/latex-compiler.ts`

## 2) Flujo end-to-end de generación de reportes

1. API HTTP recibe `source` y opciones.
2. Service arma `snapshot` y llama a `buildExportReport`.
3. Orchestrator renderiza `markdown`/`latex` y opcionalmente compila `pdf`.
4. Renderer LaTeX inyecta tokens en plantilla.
5. Plantilla activa watermark con `\AALIEEnableWatermark{0.10}{0.42\paperwidth}`.
6. Estilo `.sty` dibuja watermark con TikZ en `shipout/background` usando `opacity=\aalie@wmOpacity`.
7. Compilador copia assets (`.sty`, logos) y ejecuta `pdflatex`.

## 3) Código fuente por capa

### 3.1 API de export (`route.ts`)

```ts
// apps/web/src/app/api/export/report/route.ts
const result = await createReportFromSource({
  ...body,
  source,
  requestOrigin: request.nextUrl.origin,
});

return NextResponse.json({
  ok: true,
  snapshotMeta: { ... },
  files: result.artifacts.map((artifact) => ({
    format: artifact.format,
    filename: artifact.filename,
    mimeType: artifact.mimeType,
    ...encodeContent(artifact.content),
  })),
  bundle: result.bundle ? { ... } : null,
});
```

### 3.2 Service de export (`export-service.ts`)

```ts
// apps/web/src/server/export/export-service.ts
export async function createReportFromSource(
  input: ExportReportRequest,
): Promise<BuildExportReportResult> {
  const snapshot = await createSnapshotFromSource(input);

  return buildExportReport({
    snapshot,
    formats: normalizeFormats(input.formats),
    includeSnapshotJson: input.includeSnapshotJson ?? true,
    includeZipBundle: input.includeZipBundle ?? true,
    pdf: input.pdfTimeoutMs ? { timeoutMs: input.pdfTimeoutMs } : undefined,
  });
}
```

### 3.3 Orquestador (`export-orchestrator.ts`)

```ts
// packages/exporter/src/application/export-orchestrator.ts
if (formats.includes("markdown")) {
  const markdown = renderMarkdownReport({ snapshot: options.snapshot, documentModel: model });
  artifacts.push({ format: "markdown", filename: MARKDOWN_FILENAME, mimeType: artifactMimeType("markdown"), content: markdown });
}

if (formats.includes("latex") || formats.includes("pdf")) {
  latexContent = renderLatexReport({ snapshot: options.snapshot, documentModel: model });

  if (formats.includes("latex")) {
    artifacts.push({ format: "latex", filename: LATEX_FILENAME, mimeType: artifactMimeType("latex"), content: latexContent });
  }
}

if (formats.includes("pdf")) {
  const compiled = compileLatexToPdf({ texContent: latexContent!, ...options.pdf });
  artifacts.push({ format: "pdf", filename: PDF_FILENAME, mimeType: artifactMimeType("pdf"), content: compiled.pdfBuffer });
}
```

### 3.4 Modelo del documento (`document-model-builder.ts`)

```ts
// packages/exporter/src/renderers/document-model-builder.ts
const institution: DocumentInstitutionInfo = {
  institutionLineA: i18n.institutionLineA,
  institutionLineB: i18n.institutionLineB,
  institutionLineC: i18n.institutionLineC,
  reportCode: `AALIE-EXP-${snapshot.snapshotId.slice(0, 8).toUpperCase()}`,
  reportVersion: `snapshot-${snapshot.schemaVersion}`,
  reportDate: parseDateForReport(snapshot.locale, snapshot.createdAt),
};
```

### 3.5 Renderer Markdown (`renderers/markdown/index.ts`)

```ts
// packages/exporter/src/renderers/markdown/index.ts
export function renderMarkdownReport(options: RenderMarkdownOptions): string {
  const model = options.documentModel || buildDocumentModel(options.snapshot);
  const sections = model.sections
    .map((section) => renderSection(section, model.locale))
    .join("\n\n");
  return `${renderFrontMatter(model)}\n\n${sections}\n`;
}
```

### 3.6 Renderer LaTeX (`renderers/latex/index.ts`)

```ts
// packages/exporter/src/renderers/latex/index.ts
const replacements: Record<string, string> = {
  "%%__LANGUAGE_PACKAGE__%%": languagePackage(model.locale),
  "%%__REPORT_CODE__%%": escapeLatexText(model.institution.reportCode),
  "%%__REPORT_VERSION__%%": escapeLatexText(model.institution.reportVersion),
  "%%__REPORT_DATE__%%": escapeLatexText(model.institution.reportDate),
  "%%__DISCLAIMER__%%": escapeLatexText(model.disclaimer),
  "%%__CONTENT_SECTIONS__%%": renderContentSections(model),
};

for (const [token, value] of Object.entries(replacements)) {
  template = replaceToken(template, token, value);
}
```

### 3.7 Plantilla LaTeX (`main.template.tex`) - activación watermark

```tex
% packages/exporter/assets/latex/templates/main.template.tex
\AALIESetLogos{logos/ucaldas.pdf}{logos/aalie.pdf}{logos/aalie.pdf}
...
\AALIEEnableWatermark{0.10}{0.42\paperwidth}
```

### 3.8 Estilo LaTeX (`aalie-report.sty`) - definición watermark

```tex
% packages/exporter/assets/latex/aalie-report.sty
\newcommand{\aalie@wmOpacity}{0.10}
\newcommand{\aalie@wmWidth}{0.42\paperwidth}
\newcommand{\aalie@wmGraphic}{%
  \includegraphics[width=\aalie@wmWidth,keepaspectratio]{\aalie@wmLogo}%
}

\newif\ifaalie@watermark
\aalie@watermarkfalse

\newcommand{\AALIEEnableWatermark}[2]{%
  \aalie@watermarktrue
  \renewcommand{\aalie@wmOpacity}{#1}
  \renewcommand{\aalie@wmWidth}{#2}
}

\AddToHook{shipout/background}{%
  \ifaalie@watermark
    \begin{tikzpicture}[remember picture,overlay]
      \node[opacity=\aalie@wmOpacity,inner sep=0pt] at (current page.center)
        {\aalie@wmGraphic};
    \end{tikzpicture}%
  \fi
}
```

### 3.9 Resolución de assets (`asset-registry.ts`)

```ts
// packages/exporter/src/infrastructure/assets/asset-registry.ts
return {
  assetRoot: candidate,
  styleFilePath: path.join(candidate, "aalie-report.sty"),
  templatePath: path.join(candidate, "templates", "main.template.tex"),
  logosDir: path.join(candidate, "logos"),
  ucaldasLogoPath: path.join(candidate, "logos", "ucaldas.pdf"),
  aalieLogoPath: path.join(candidate, "logos", "aalie.pdf"),
};
```

### 3.10 Compilación PDF (`latex-compiler.ts`)

```ts
// packages/exporter/src/infrastructure/pdf/latex-compiler.ts
copyFileSync(assets.styleFilePath, path.join(workDir, "aalie-report.sty"));
copyFileSync(assets.ucaldasLogoPath, path.join(logosOutputDir, "ucaldas.pdf"));
copyFileSync(assets.aalieLogoPath, path.join(logosOutputDir, "aalie.pdf"));

for (let pass = 1; pass <= 2; pass += 1) {
  const run = runPdflatexPass(workDir, texFilePath, timeoutMs);
  if (run.status !== 0) throw new LatexCompilationError(...);
}
```

## 4) Punto exacto del problema de opacidad

El valor de opacidad **sí está parametrizado** y se inyecta en el nodo TikZ:

```tex
\node[opacity=\aalie@wmOpacity,...] ... {\aalie@wmGraphic};
```

Si visualmente sale negro sólido, los puntos de auditoría son:

1. `logos/aalie.pdf` (asset usado como watermark) podría tener fondo/forma opaca en negro.
2. El `PDF` del logo puede venir con transparencias incompatibles con el flujo `pdflatex`.
3. El visor PDF puede estar renderizando mal transparencias de imágenes PDF embebidas.
4. Alguna sustitución de assets podría estar metiendo otro `aalie.pdf` distinto al esperado.

## 5) Checklist de auditoría rápida

- Verificar hash y tamaño de `packages/exporter/assets/latex/logos/aalie.pdf`.
- Exportar solo `.tex` y revisar que exista `\AALIEEnableWatermark{0.10}{0.42\paperwidth}`.
- En el `.tex` final, buscar `opacity=\aalie@wmOpacity` (debe mantenerse).
- Compilar el mismo `.tex` con otro motor/entorno para descartar problema de renderer.
- Probar watermark con PNG transparente como control A/B.

## 6) Conclusión técnica

La implementación de reportes **sí define y aplica opacidad** (0.10) en la marca de agua a nivel de estilo (`aalie-report.sty`). El síntoma de “negra full” es más probable por **asset/logo** o por **renderizado/transparencia del PDF embebido**, no por ausencia de parámetro de opacidad en el código.
