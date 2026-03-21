import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface LatexAssetRegistry {
  assetRoot: string;
  styleFilePath: string;
  templatePath: string;
  logosDir: string;
  ucaldasLogoPath: string;
  aalieLogoPath: string;
}

function isValidAssetRoot(assetRoot: string): boolean {
  const stylePath = path.join(assetRoot, "aalie-report.sty");
  const templatePath = path.join(assetRoot, "templates", "main.template.tex");
  const ucaldasLogoPath = path.join(assetRoot, "logos", "ucaldas.pdf");
  const aalieLogoPath = path.join(assetRoot, "logos", "aalie.pdf");

  return (
    existsSync(stylePath) &&
    existsSync(templatePath) &&
    existsSync(ucaldasLogoPath) &&
    existsSync(aalieLogoPath)
  );
}

function collectCandidateRoots(): string[] {
  const candidates: string[] = [];
  const envRoot = process.env.AALIE_EXPORTER_ASSETS_DIR;
  if (envRoot) {
    candidates.push(path.resolve(envRoot));
  }

  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  candidates.push(path.resolve(moduleDir, "../../../assets/latex"));

  const cwd = process.cwd();
  candidates.push(path.resolve(cwd, "packages/exporter/assets/latex"));
  candidates.push(path.resolve(cwd, "../packages/exporter/assets/latex"));
  candidates.push(path.resolve(cwd, "../../packages/exporter/assets/latex"));

  let current = cwd;
  for (let depth = 0; depth < 8; depth += 1) {
    candidates.push(path.resolve(current, "packages/exporter/assets/latex"));
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  return Array.from(new Set(candidates));
}

export function resolveLatexAssetRegistry(): LatexAssetRegistry {
  const candidates = collectCandidateRoots();

  for (const candidate of candidates) {
    if (!isValidAssetRoot(candidate)) {
      continue;
    }

    return {
      assetRoot: candidate,
      styleFilePath: path.join(candidate, "aalie-report.sty"),
      templatePath: path.join(candidate, "templates", "main.template.tex"),
      logosDir: path.join(candidate, "logos"),
      ucaldasLogoPath: path.join(candidate, "logos", "ucaldas.pdf"),
      aalieLogoPath: path.join(candidate, "logos", "aalie.pdf"),
    };
  }

  throw new Error(
    [
      "Unable to resolve LaTeX assets for exporter.",
      "Expected files: aalie-report.sty, templates/main.template.tex, logos/ucaldas.pdf, logos/aalie.pdf.",
      `Checked candidates: ${candidates.join(", ")}`,
    ].join(" "),
  );
}

export function readLatexTemplate(registry: LatexAssetRegistry = resolveLatexAssetRegistry()): string {
  return readFileSync(registry.templatePath, "utf8");
}
