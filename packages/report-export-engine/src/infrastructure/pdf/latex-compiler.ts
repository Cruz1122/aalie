import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { resolveLatexAssetRegistry, type LatexAssetRegistry } from "../assets/asset-registry";

export type LatexCompilationErrorKind = "compiler_missing" | "compilation_failed" | "output_missing";

export class LatexCompilationError extends Error {
  kind: LatexCompilationErrorKind;
  logs: string;
  workDir?: string;

  constructor(
    kind: LatexCompilationErrorKind,
    message: string,
    logs = "",
    workDir?: string,
  ) {
    super(message);
    this.name = "LatexCompilationError";
    this.kind = kind;
    this.logs = logs;
    this.workDir = workDir;
  }
}

export interface CompileLatexToPdfOptions {
  texContent: string;
  timeoutMs?: number;
  jobName?: string;
  cleanup?: boolean;
  preserveWorkDirOnError?: boolean;
  assets?: LatexAssetRegistry;
  extraFiles?: Array<{
    relativePath: string;
    content: string | Buffer;
  }>;
}

export interface CompileLatexToPdfResult {
  pdfBuffer: Buffer;
  logs: string;
}

export function isPdflatexAvailable(): boolean {
  const command = spawnSync("pdflatex", ["--version"], {
    encoding: "utf8",
  });
  return command.status === 0;
}

function runPdflatexPass(
  workDir: string,
  texFilePath: string,
  timeoutMs: number,
): { status: number | null; output: string } {
  const run = spawnSync(
    "pdflatex",
    [
      "-interaction=nonstopmode",
      "-halt-on-error",
      "-file-line-error",
      path.basename(texFilePath),
    ],
    {
      cwd: workDir,
      encoding: "utf8",
      timeout: timeoutMs,
    },
  );

  const output = `${run.stdout || ""}\n${run.stderr || ""}`;
  return { status: run.status, output };
}

export function compileLatexToPdf(options: CompileLatexToPdfOptions): CompileLatexToPdfResult {
  const timeoutMs = options.timeoutMs ?? 120_000;
  const jobName = options.jobName ?? "report";
  const cleanup = options.cleanup ?? true;

  if (!isPdflatexAvailable()) {
    throw new LatexCompilationError(
      "compiler_missing",
      "pdflatex is not available in the current environment.",
    );
  }

  const assets = options.assets ?? resolveLatexAssetRegistry();
  const workDir = mkdtempSync(path.join(tmpdir(), "aalie-export-"));
  const texFilePath = path.join(workDir, `${jobName}.tex`);
  const logosOutputDir = path.join(workDir, "logos");

  const logs: string[] = [];
  let shouldCleanup = cleanup;

  try {
    mkdirSync(logosOutputDir, { recursive: true });

    copyFileSync(assets.styleFilePath, path.join(workDir, "aalie-report.sty"));
    copyFileSync(assets.ucaldasLogoPath, path.join(logosOutputDir, "ucaldas.pdf"));
    copyFileSync(assets.aalieLogoPath, path.join(logosOutputDir, "aalie.pdf"));

    for (const file of options.extraFiles || []) {
      const rel = String(file.relativePath || "").trim().replace(/^\/+/, "");
      if (!rel) continue;
      const dest = path.join(workDir, rel);
      mkdirSync(path.dirname(dest), { recursive: true });
      writeFileSync(dest, file.content);
    }

    writeFileSync(texFilePath, options.texContent, "utf8");

    for (let pass = 1; pass <= 2; pass += 1) {
      const run = runPdflatexPass(workDir, texFilePath, timeoutMs);
      logs.push(`--- pdflatex pass ${pass} ---\n${run.output}`);

      if (run.status !== 0) {
        throw new LatexCompilationError(
          "compilation_failed",
          `pdflatex failed on pass ${pass} with status ${String(run.status)}.`,
          logs.join("\n"),
        );
      }
    }

    const pdfPath = path.join(workDir, `${jobName}.pdf`);
    if (!existsSync(pdfPath)) {
      throw new LatexCompilationError(
        "output_missing",
        `Expected PDF output was not generated at ${pdfPath}.`,
        logs.join("\n"),
      );
    }

    const pdfBuffer = readFileSync(pdfPath);
    return {
      pdfBuffer,
      logs: logs.join("\n"),
    };
  } catch (error) {
    if (error instanceof LatexCompilationError) {
      if (options.preserveWorkDirOnError) {
        error.workDir = workDir;
        shouldCleanup = false;
      }
      throw error;
    }
    throw error;
  } finally {
    if (shouldCleanup) {
      rmSync(workDir, { recursive: true, force: true });
    }
  }
}
