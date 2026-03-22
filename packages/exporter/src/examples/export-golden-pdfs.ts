import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { compileLatexToPdf, isPdflatexAvailable } from "../infrastructure/pdf/latex-compiler";
import { resolveLatexAssetRegistry } from "../infrastructure/assets/asset-registry";

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const GOLDEN_DIR = path.resolve(CURRENT_DIR, "../__tests__/fixtures/golden");
const REPO_ROOT = path.resolve(CURRENT_DIR, "../../../..");
const DEFAULT_TECTONIC_PATH = path.join(REPO_ROOT, ".tools", "tectonic", "tectonic");

function listGoldenTexFiles(): string[] {
  return readdirSync(GOLDEN_DIR)
    .filter((file) => file.endsWith(".golden.tex"))
    .sort();
}

function resolveTectonicPath(): string | null {
  const fromEnv = process.env.TECTONIC_BIN;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  if (existsSync(DEFAULT_TECTONIC_PATH)) return DEFAULT_TECTONIC_PATH;
  return null;
}

function isTectonicAvailable(tectonicPath: string | null): tectonicPath is string {
  if (!tectonicPath) return false;
  const result = spawnSync(tectonicPath, ["--version"], { encoding: "utf8" });
  return result.status === 0;
}

function compileWithTectonic(texContent: string, tectonicPath: string): Buffer {
  const assets = resolveLatexAssetRegistry();
  const workDir = mkdtempSync(path.join(tmpdir(), "aalie-golden-pdf-"));
  const texPath = path.join(workDir, "report.tex");
  const logosOutputDir = path.join(workDir, "logos");

  try {
    mkdirSync(logosOutputDir, { recursive: true });
    copyFileSync(assets.styleFilePath, path.join(workDir, "aalie-report.sty"));
    copyFileSync(assets.ucaldasLogoPath, path.join(logosOutputDir, "ucaldas.pdf"));
    copyFileSync(assets.aalieLogoPath, path.join(logosOutputDir, "aalie.pdf"));
    writeFileSync(texPath, texContent, "utf8");

    const run = spawnSync(
      tectonicPath,
      ["--outdir", workDir, texPath],
      {
        cwd: workDir,
        encoding: "utf8",
      },
    );

    if (run.status !== 0) {
      const logs = `${run.stdout || ""}\n${run.stderr || ""}`;
      throw new Error(`tectonic failed with status ${String(run.status)}.\n${logs}`);
    }

    const pdfPath = path.join(workDir, "report.pdf");
    if (!existsSync(pdfPath)) {
      throw new Error(`tectonic did not produce PDF output at ${pdfPath}`);
    }
    return readFileSync(pdfPath);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

function main(): void {
  const pdflatexAvailable = isPdflatexAvailable();
  const tectonicPath = resolveTectonicPath();
  const canUseTectonic = isTectonicAvailable(tectonicPath);

  if (!pdflatexAvailable && !canUseTectonic) {
    throw new Error(
      [
        "No PDF compiler found.",
        "Expected one of: pdflatex in PATH, or a tectonic binary in .tools/tectonic/tectonic",
        "(or set TECTONIC_BIN to its path).",
      ].join(" "),
    );
  }

  const files = listGoldenTexFiles();

  if (files.length === 0) {
    console.log(`No .golden.tex files found in ${GOLDEN_DIR}`);
    return;
  }

  for (const texFile of files) {
    const texPath = path.join(GOLDEN_DIR, texFile);
    const pdfPath = path.join(GOLDEN_DIR, texFile.replace(/\.golden\.tex$/, ".golden.pdf"));
    const texContent = readFileSync(texPath, "utf8");

    if (pdflatexAvailable) {
      const result = compileLatexToPdf({
        texContent,
        jobName: "golden-report",
        cleanup: true,
      });
      writeFileSync(pdfPath, result.pdfBuffer);
    } else if (canUseTectonic && tectonicPath) {
      const buffer = compileWithTectonic(texContent, tectonicPath);
      writeFileSync(pdfPath, buffer);
    }

    console.log(`Generated ${path.basename(pdfPath)}`);
  }

  console.log(`Exported ${files.length} golden PDF files in ${GOLDEN_DIR}`);
}

main();
