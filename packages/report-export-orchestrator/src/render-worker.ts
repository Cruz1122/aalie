import {
  LATEX_FILENAME,
  MARKDOWN_FILENAME,
  PDF_FILENAME,
  assertValidSnapshot,
  buildDocumentModel,
  buildSnapshot,
  buildTraceDiagramAssets,
  compileLatexToPdf,
  createZipBundle,
  LatexCompilationError,
  renderLatexReport,
  renderMarkdownReport,
  type BuildSnapshotInput,
  type ExportArtifact,
  type ExportFormat,
} from "@aa/report-export-engine";

import { buildGpuCpuComparative } from "./gpu-cpu-adapter";
import { normalizeLlmComparativePayload, requestLlmComparison } from "./llm-adapter";

interface RenderRequest {
  mode?: "snapshot" | "report";
  snapshotInput?: BuildSnapshotInput;
  render?: {
    formats?: ExportFormat[];
    includeSnapshotJson?: boolean;
    includeZipBundle?: boolean;
    pdfTimeoutMs?: number;
    debug?: boolean;
  };
  options?: {
    includeGpuCpu?: boolean;
    includeLlm?: boolean;
    llmPayload?: unknown;
    apiKey?: string;
    requestOrigin?: string;
  };
}

interface AssetManifestEntry {
  filename: string;
  mimeType: string;
  size: number;
}

function readStdinJson(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      raw += chunk;
    });
    process.stdin.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : null);
      } catch (error) {
        reject(error);
      }
    });
    process.stdin.on("error", (error) => reject(error));
  });
}

function normalizeLocale(locale: string | undefined): "es" | "en" {
  return String(locale || "en").toLowerCase().startsWith("es") ? "es" : "en";
}

function normalizeFormats(formats: unknown): ExportFormat[] {
  if (!Array.isArray(formats) || formats.length === 0) {
    return ["markdown", "latex"];
  }
  const normalized = formats.filter(
    (item): item is ExportFormat =>
      item === "markdown" || item === "latex" || item === "pdf",
  );
  return normalized.length > 0 ? Array.from(new Set(normalized)) : ["markdown", "latex"];
}

function toContentBytes(content: string | Buffer): Buffer {
  return Buffer.isBuffer(content) ? content : Buffer.from(content, "utf8");
}

function artifactMimeType(format: ExportFormat | "snapshot"): string {
  if (format === "markdown") return "text/markdown; charset=utf-8";
  if (format === "latex") return "application/x-tex; charset=utf-8";
  if (format === "pdf") return "application/pdf";
  return "application/json; charset=utf-8";
}

function buildAssetManifest(
  items: Array<{ filename: string; mimeType: string; content: string | Buffer }>,
): AssetManifestEntry[] {
  return [...items]
    .map((item) => ({
      filename: item.filename,
      mimeType: item.mimeType,
      size: toContentBytes(item.content).length,
    }))
    .sort((a, b) => a.filename.localeCompare(b.filename));
}

async function enrichSnapshotInput(
  payload: RenderRequest,
): Promise<BuildSnapshotInput> {
  const snapshotInput = payload.snapshotInput;
  if (!snapshotInput?.source?.trim()) {
    throw new Error("Field 'snapshotInput.source' is required.");
  }

  const locale = normalizeLocale(snapshotInput.locale);
  const llmSourcePayload =
    typeof payload.options?.llmPayload !== "undefined"
      ? payload.options.llmPayload
      : payload.options?.includeLlm
        ? await requestLlmComparison({
            source: snapshotInput.source,
            locale,
            apiKey: payload.options?.apiKey,
            requestOrigin: payload.options?.requestOrigin,
            analysis: snapshotInput.analyze || undefined,
          })
        : null;

  const llm = llmSourcePayload
    ? normalizeLlmComparativePayload(llmSourcePayload)
    : null;
  const parseAst = snapshotInput.parse?.ok ? snapshotInput.parse.ast : null;
  const gpuCpu =
    payload.options?.includeGpuCpu === false
      ? null
      : buildGpuCpuComparative(parseAst, locale);

  return {
    ...snapshotInput,
    locale,
    llm,
    gpuCpu,
  };
}

async function main() {
  const parsed = (await readStdinJson()) as RenderRequest | null;
  const payload = parsed || {};
  const mode = payload.mode || "report";
  let assetManifest: AssetManifestEntry[] = [];

  try {
    const snapshotInput = await enrichSnapshotInput(payload);
    const snapshot = buildSnapshot(snapshotInput);
    assertValidSnapshot(snapshot);

    if (mode === "snapshot") {
      process.stdout.write(JSON.stringify({ ok: true, snapshot }));
      process.exit(0);
    }

    const formats = normalizeFormats(payload.render?.formats);
    const includeSnapshotJson = payload.render?.includeSnapshotJson ?? true;
    const includeZipBundle = payload.render?.includeZipBundle ?? true;
    const documentModel = buildDocumentModel(snapshot);
    const traceDiagramAssets = await buildTraceDiagramAssets(documentModel);
    assetManifest = buildAssetManifest(traceDiagramAssets);
    const artifacts: ExportArtifact[] = [];

    let latexContent: string | null = null;

    if (formats.includes("markdown")) {
      const markdown = renderMarkdownReport({
        snapshot,
        documentModel,
      });
      artifacts.push({
        format: "markdown",
        filename: MARKDOWN_FILENAME,
        mimeType: artifactMimeType("markdown"),
        content: markdown,
      });
    }

    if (formats.includes("latex") || formats.includes("pdf")) {
      latexContent = renderLatexReport({
        snapshot,
        documentModel,
      });
      if (formats.includes("latex")) {
        artifacts.push({
          format: "latex",
          filename: LATEX_FILENAME,
          mimeType: artifactMimeType("latex"),
          content: latexContent,
        });
      }
    }

    if (formats.includes("pdf")) {
      if (!latexContent) {
        throw new Error("LaTeX content was not generated before PDF compilation.");
      }

      const compiled = compileLatexToPdf({
        texContent: latexContent,
        extraFiles: traceDiagramAssets.map((asset) => ({
          relativePath: asset.filename,
          content: asset.content,
        })),
        timeoutMs: payload.render?.pdfTimeoutMs,
        preserveWorkDirOnError: payload.render?.debug,
      });

      artifacts.push({
        format: "pdf",
        filename: PDF_FILENAME,
        mimeType: artifactMimeType("pdf"),
        content: compiled.pdfBuffer,
      });
    }

    if (includeSnapshotJson) {
      artifacts.push({
        format: "snapshot",
        filename: "snapshot.json",
        mimeType: artifactMimeType("snapshot"),
        content: JSON.stringify(snapshot, null, 2),
      });
    }

    for (const asset of traceDiagramAssets) {
      artifacts.push({
        format: "asset",
        filename: asset.filename,
        mimeType: asset.mimeType,
        content: asset.content,
      });
    }

    let filename = artifacts[0]?.filename;
    let mimeType = artifacts[0]?.mimeType;
    let content = artifacts[0]?.content;

    if (includeZipBundle) {
      const bundle = await createZipBundle(
        artifacts.map((artifact) => ({
          filename: artifact.filename,
          content: artifact.content,
        })),
        {
          snapshotId: snapshot.snapshotId,
          contentHash: snapshot.contentHash,
          createdAt: snapshot.createdAt,
          formats,
        },
      );
      filename = bundle.filename;
      mimeType = "application/zip";
      content = bundle.buffer;
    }

    if (!filename || !mimeType || typeof content === "undefined") {
      throw new Error("No artifacts were generated.");
    }

    process.stdout.write(
      JSON.stringify({
        ok: true,
        mimeType,
        filename,
        contentBase64: toContentBytes(content).toString("base64"),
        snapshotId: snapshot.snapshotId,
        contentHash: snapshot.contentHash,
        assetManifest,
      }),
    );
  } catch (error) {
    if (error instanceof LatexCompilationError) {
      process.stdout.write(
        JSON.stringify({
          ok: false,
          error: error.message,
          kind: error.kind,
          compilerLogs: error.logs,
          assetManifest,
          workDir: error.workDir,
          status: 500,
        }),
      );
      process.exit(0);
    }

    process.stdout.write(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        status: 500,
      }),
    );
    process.exit(0);
  }
}

main().catch((error) => {
  process.stdout.write(
    JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      status: 500,
    }),
  );
  process.exit(0);
});
