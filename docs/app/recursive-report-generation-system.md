# Sistema de Generación de Reportes para Algoritmos Recursivos

## Objetivo
Este documento explica, de extremo a extremo, cómo se construyen los reportes de algoritmos recursivos (y también híbridos) en el sistema actual:

1. Recepción de la solicitud de export.
2. Recolección de artefactos analíticos (`parse`, `classify`, `analyze`, `trace`).
3. Construcción del snapshot canónico.
4. Transformación a `DocumentModel`.
5. Render de artefactos (`markdown`, `latex`, `pdf`, `zip`).

> Estado actual: la generación de reportes es determinista y se basa en artefactos de análisis ya estructurados.

---

## Vista General del Flujo

```mermaid
flowchart LR
  A[Cliente export] --> B[/export/report FastAPI]
  B --> C[worker.ts Node/TSX]
  C --> D[createReportFromSource]
  D --> E[collectArtifactsForSnapshot]
  E --> F[/grammar/parse]
  E --> G[/classify]
  E --> H[/analyze/open]
  E --> I[/analyze/detect-methods]
  E --> J[/analyze/trace por caso]
  D --> K[buildSnapshot]
  D --> L[buildExportReport]
  L --> M[buildDocumentModel]
  L --> N[renderMarkdownReport]
  L --> O[renderLatexReport]
  O --> P[compileLatexToPdf]
  L --> Q[createZipBundle]
  Q --> R[Archivo final]
```

---

## 1) Entrada del Proceso de Export

### FastAPI `/export/report`
El endpoint valida `source`, ejecuta el worker Node y responde archivo binario (`Content-Disposition: attachment`).

Código real:

```py
@router.post("/report")
def export_report(request: Request, payload: Dict[str, Any] = Body(...)) -> Response:
    source = str(payload.get("source") or "")
    if not source.strip():
        return Response(
            content=json.dumps({"ok": False, "error": "Field 'source' is required."}),
            status_code=400,
            media_type="application/json",
        )

    origin = request.headers.get("origin") or request.headers.get("referer")
    if origin and not payload.get("requestOrigin"):
        payload["requestOrigin"] = origin

    result = _run_export_worker(payload)
    ...
    content_bytes = base64.b64decode(result["contentBase64"])
    headers = {
        "Content-Type": str(result["mimeType"]),
        "Content-Disposition": f'attachment; filename="{result["filename"]}"',
    }
    return Response(content=content_bytes, status_code=200, headers=headers)
```

### Bridge Python -> Node (`worker.ts`)
El backend Python no renderiza directamente; delega al worker TypeScript.

Código real:

```ts
const result = await createReportFromSource({
  ...(payload as ExportReportRequest),
  source,
});

const outputMatch = result.bundle || result.artifacts[0];
const response = {
  ok: true,
  mimeType,
  filename,
  contentBase64: content.toString("base64"),
  snapshotId: result.snapshot.snapshotId,
  contentHash: result.snapshot.contentHash,
};
process.stdout.write(JSON.stringify(response));
```

---

## 2) Recolección de Artefactos para Snapshot

La orquestación de análisis está en `collect-artifacts.ts`.

Pipeline:
1. `POST /grammar/parse`
2. `POST /classify`
3. `POST /analyze/open`
4. Si es recursivo/híbrido: `POST /analyze/detect-methods`
5. `POST /analyze/trace` por caso (`worst`, `best`, `avg` según tipo)

Código real:

```ts
const analyze =
  await postJson(apiBase, "/analyze/open", {
    source: input.source,
    mode: "all",
    avgModel: { mode: "uniform", predicates: {} },
    algorithm_kind: algorithmKind,
    preferred_method: input.preferredMethod,
    locale: input.locale,
  });

if (algorithmKind === "recursive" || algorithmKind === "hybrid") {
  detectMethods = await postJson(apiBase, "/analyze/detect-methods", {
    source: input.source,
    algorithm_kind: algorithmKind,
  });
}

await Promise.all(
  traceCases.map(async (caseName) => {
    const traceInput = buildTraceInputs(input.source, caseName);
    traceByCase[caseName] = await postJson(apiBase, "/analyze/trace", {
      source: input.source,
      case: caseName,
      input_size: traceInput.inputSize,
      initial_variables: traceInput.initialVariables,
      locale: input.locale,
    });
  }),
);
```

### Nota importante para recursivos
`buildTraceInputs` define entradas automáticas por caso y detecta patrones (arrays, `x`, sorting-like) para construir `initial_variables` coherentes.

---

## 3) Construcción del Snapshot Canónico

`buildSnapshot` consolida todo en `AalieAnalysisSnapshotV1`.

Responsabilidades clave para recursivos:
1. Normalizar recurrencia seleccionada.
2. Resolver `stepByStep` por método (master/iteration/recursion_tree/characteristic_equation).
3. Poblar sección `recursive` con `recurrence`, `methodsAvailable`, `methodDetails`, `closedForm`, `callTrace`.
4. Integrar `traceByCase` y diagnósticos (`truncated`, warnings).

Código real:

```ts
const selectedStepByStep =
  normalizedRecurrence?.method === "iteration"
    ? selectedCase?.totals?.iteration?.step_by_step ||
      selectedCase?.totals?.characteristic_equation?.step_by_step
    : normalizedRecurrence?.method === "recursion_tree"
      ? selectedCase?.totals?.recursion_tree?.step_by_step ||
        selectedCase?.totals?.master?.step_by_step
      : ...;

recursive: normalizedRecurrence
  ? createSection("available", {
      recurrence: createSection("available", normalizedRecurrence),
      methodsAvailable: createSection("available", methodsAvailable),
      stepByStep: selectedStepByStep
        ? createSection("available", selectedStepByStep)
        : createSection("not_supported"),
      callTrace: createSection("available", {
        worst: input.traceByCase?.worst?.trace
          ? {
              steps: input.traceByCase.worst.trace.steps || [],
              callTreeSource:
                input.traceByCase.worst.trace.callTreeSource ||
                input.traceByCase.worst.trace.recursionTree,
              summary: input.traceByCase.worst.trace.summary,
              diagnostics: input.traceByCase.worst.trace.diagnostics,
            }
          : null,
      }),
    })
  : createSection("not_supported"),
```

Además, calcula hash determinista:

```ts
const contentHash = createHash("sha256")
  .update(stableStringify(normalized))
  .digest("hex");
```

---

## 4) Transformación a Document Model

`buildDocumentModel` transforma el snapshot en bloques listos para render.

Para recursivos/híbridos:
- Incluye sección recursiva solo si aplica (`shouldIncludeRecursive`).
- Construye subsecciones: recurrencia, método, métodos disponibles, desarrollo paso a paso, raíces, forma cerrada, traza de llamadas, advertencias, conclusión.

Código real:

```ts
function shouldIncludeRecursive(snapshot: AalieAnalysisSnapshotV1): boolean {
  return snapshot.algorithmType === "recursive" || snapshot.algorithmType === "hybrid";
}

function buildRecursiveSection(snapshot: AalieAnalysisSnapshotV1, i18n: ExportI18nBundle): DocumentSection | null {
  if (!isSectionAvailable(snapshot.recursive)) return null;
  const data = snapshot.recursive.data;
  const blocks: DocumentBlock[] = [];

  if (isSectionAvailable(data.recurrence)) {
    blocks.push({ kind: "subsection", title: i18n.recurrenceLabel });
    blocks.push({ kind: "formula", formula: data.recurrence.data.form });
  }

  if (isSectionAvailable(data.stepByStep)) {
    for (const step of data.stepByStep.data.steps) {
      blocks.push({
        kind: "pedagogicalStep",
        step: {
          index: step.index,
          title: step.title,
          formula: step.math.primaryLatex,
          explanation: buildRecursiveStepExplanation(step.summary, step.conceptNote, i18n),
        },
      });
    }
  }

  return { id: "recursive", title: i18n.recursiveTitle, blocks };
}
```

---

## 5) Render de Reportes

## Markdown
`renderMarkdownReport` usa `DocumentModel.sections` y renderiza por sección (`iterative`, `recursive`, `comparative`, común).

Código real:

```ts
export function renderMarkdownReport(options: RenderMarkdownOptions): string {
  const model = options.documentModel || buildDocumentModel(options.snapshot);
  const sections = model.sections
    .map((section) => renderSection(section, model.locale))
    .join("\n\n");
  return `${renderFrontMatter(model)}\n\n${sections}\n`;
}
```

## LaTeX
`renderLatexReport` hace reemplazo de tokens sobre template.

Código real:

```ts
const replacements: Record<string, string> = {
  "%%__LANGUAGE_PACKAGE__%%": languagePackage(model.locale),
  "%%__REPORT_CODE__%%": escapeLatexText(model.institution.reportCode),
  "%%__REPORT_VERSION__%%": escapeLatexText(model.institution.reportVersion),
  "%%__REPORT_DATE__%%": escapeLatexText(model.institution.reportDate),
  "%%__EXECUTIVE_SUMMARY_BODY__%%": renderExecutiveSummary(model),
  "%%__CONTENT_SECTIONS__%%": renderContentSections(model),
};
```

## PDF
Si se solicita `pdf`, primero genera LaTeX y luego compila con `pdflatex` (2 pasadas).

Código real:

```ts
for (let pass = 1; pass <= 2; pass += 1) {
  const run = runPdflatexPass(workDir, texFilePath, timeoutMs);
  logs.push(`--- pdflatex pass ${pass} ---\n${run.output}`);
  if (run.status !== 0) {
    throw new LatexCompilationError("compilation_failed", ...);
  }
}
```

---

## 6) Orquestación Final de Artefactos

`buildExportReport` decide qué artefactos incluir (`markdown`, `latex`, `pdf`, `snapshot.json`) y opcionalmente empaca ZIP.

Código real:

```ts
if (formats.includes("markdown")) {
  artifacts.push({ format: "markdown", filename: MARKDOWN_FILENAME, ... });
}

if (formats.includes("latex") || formats.includes("pdf")) {
  latexContent = renderLatexReport({ snapshot: options.snapshot, documentModel: model });
}

if (formats.includes("pdf")) {
  const compiled = compileLatexToPdf({ texContent: latexContent!, ...options.pdf });
  artifacts.push({ format: "pdf", filename: PDF_FILENAME, content: compiled.pdfBuffer, ... });
}

if (options.includeZipBundle) {
  const bundle = await createZipBundle(...);
  return { snapshot: options.snapshot, documentModel: model, artifacts, bundle: {...} };
}
```

---

## 7) Locale e i18n

La locale atraviesa todo el pipeline:
1. Se normaliza en orchestrator (`es`/`en`).
2. Se envía a endpoints de análisis y trace.
3. Se persiste en snapshot.
4. Se usa en `buildDocumentModel` y en render Markdown/LaTeX.

Código real:

```ts
function normalizeLocale(locale: string | undefined): "es" | "en" {
  return String(locale || "en").toLowerCase().startsWith("es") ? "es" : "en";
}
```

---

## 8) Checklist de Depuración (Recursivos)

Cuando un reporte recursivo “sale raro”:
1. Verifica que `traceByCase.worst.trace.summary` y `callTreeSource` existan.
2. Revisa si `diagnostics.truncated=true`.
3. Confirma `normalizedRecurrence.method` y `selectedStepByStep`.
4. Asegura que `snapshot.recursive.status === "available"`.
5. Verifica que `buildRecursiveSection` haya generado bloques.
6. Si falla PDF, inspecciona logs de `LatexCompilationError`.

---

## 9) Archivos Clave

### API / Orquestación
- `apps/api/app/modules/export/router.py`
- `apps/api/app/exporter/worker.ts`
- `packages/report-export-orchestrator/src/export-service.ts`
- `packages/report-export-orchestrator/src/collect-artifacts.ts`

### Snapshot / Modelo
- `packages/report-export-engine/src/domain/snapshot-builder.ts`
- `packages/report-export-engine/src/renderers/document-model-builder.ts`

### Render / Compilación
- `packages/report-export-engine/src/renderers/markdown/index.ts`
- `packages/report-export-engine/src/renderers/latex/index.ts`
- `packages/report-export-engine/src/infrastructure/pdf/latex-compiler.ts`
- `packages/report-export-engine/src/application/export-orchestrator.ts`

