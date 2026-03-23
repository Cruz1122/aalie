import { ExportArtifact, LatexCompilationError } from "@aa/report-export-engine";
import {
  createReportFromSource,
  type ExportReportRequest,
} from "@aa/report-export-orchestrator";

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
      } catch (e) {
        reject(e);
      }
    });
    process.stdin.on("error", (e) => reject(e));
  });
}

function toContentBytes(content: string | Buffer): Buffer {
  return Buffer.isBuffer(content) ? content : Buffer.from(content, "utf8");
}

async function main() {
  const parsed = await readStdinJson();
  const payload = (parsed || {}) as Partial<ExportReportRequest>;

  const source = String(payload.source || "");
  if (!source.trim()) {
    process.stdout.write(
      JSON.stringify({ ok: false, error: "Field 'source' is required." }),
    );
    process.exit(0);
  }

  try {
    const result = await createReportFromSource({
      ...(payload as ExportReportRequest),
      source,
    });

    const isBundle = !!result.bundle;
    const outputMatch = result.bundle || result.artifacts[0];
    if (!outputMatch) {
      throw new Error("No artifacts were generated.");
    }

    const mimeType = isBundle ? "application/zip" : (outputMatch as ExportArtifact).mimeType;
    const filename = outputMatch.filename;
    const content = toContentBytes(outputMatch.content);

    const response = {
      ok: true,
      mimeType,
      filename,
      contentBase64: content.toString("base64"),
      snapshotId: result.snapshot.snapshotId,
      contentHash: result.snapshot.contentHash,
    };

    process.stdout.write(JSON.stringify(response));
  } catch (error) {
    if (error instanceof LatexCompilationError) {
      process.stdout.write(
        JSON.stringify({
          ok: false,
          error: error.message,
          kind: error.kind,
          logs: error.logs,
        }),
      );
      process.exit(0);
    }

    process.stdout.write(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    process.exit(0);
  }
}

main().catch((e) => {
  process.stdout.write(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }));
  process.exit(0);
});

