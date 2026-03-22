export const MAX_TXT_IMPORT_BYTES = 256 * 1024;

export type TxtImportValidationResult =
  | {
      ok: true;
      normalizedSource: string;
    }
  | {
      ok: false;
      reason:
        | "invalidExtension"
        | "empty"
        | "tooLarge"
        | "invalidFormat"
        | "readError";
    };

export function normalizeImportedAlgorithmSource(source: string): string {
  return source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
}

function hasStrangeFormat(source: string): boolean {
  if (source.includes("\u0000")) {
    return true;
  }

  // Allow line breaks and tabs, reject other control chars.
  if (/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(source)) {
    return true;
  }

  const replacementCharCount = (source.match(/\uFFFD/g) || []).length;
  if (replacementCharCount > Math.max(3, Math.floor(source.length * 0.01))) {
    return true;
  }

  return false;
}

export async function readAndValidateTxtFile(
  file: File,
): Promise<TxtImportValidationResult> {
  if (!file.name.toLowerCase().endsWith(".txt")) {
    return { ok: false, reason: "invalidExtension" };
  }

  if (file.size <= 0) {
    return { ok: false, reason: "empty" };
  }

  if (file.size > MAX_TXT_IMPORT_BYTES) {
    return { ok: false, reason: "tooLarge" };
  }

  let rawText = "";
  try {
    rawText = await file.text();
  } catch {
    return { ok: false, reason: "readError" };
  }

  const normalizedSource = normalizeImportedAlgorithmSource(rawText);
  if (!normalizedSource.trim()) {
    return { ok: false, reason: "empty" };
  }

  if (hasStrangeFormat(normalizedSource)) {
    return { ok: false, reason: "invalidFormat" };
  }

  return {
    ok: true,
    normalizedSource,
  };
}

function hasProcedureLikeNode(value: unknown): boolean {
  if (!value) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasProcedureLikeNode(item));
  }

  if (typeof value !== "object") {
    return false;
  }

  const node = value as Record<string, unknown>;
  const nodeType = typeof node.type === "string" ? node.type.toLowerCase() : "";
  if (
    nodeType === "procdef" ||
    nodeType === "procedure" ||
    nodeType === "function" ||
    nodeType === "functiondef"
  ) {
    return true;
  }

  return Object.values(node).some((child) => hasProcedureLikeNode(child));
}

export function looksLikeAlgorithmAst(ast: unknown): boolean {
  return hasProcedureLikeNode(ast);
}

export function looksLikeAlgorithmSourceText(source: string): boolean {
  const normalized = normalizeImportedAlgorithmSource(source).trim();
  if (!normalized) {
    return false;
  }

  const hasHeader =
    /\b[a-zA-Z_][\w]*\s*\([^)]*\)\s*BEGIN\b/i.test(normalized) ||
    /\b(PROCEDURE|FUNCION|FUNCTION)\b/i.test(normalized);
  const hasBodyMarkers =
    /\b(IF|FOR|WHILE|REPEAT|RETURN|PRINT|END)\b/i.test(normalized) ||
    /<-|←|⟵/.test(normalized);

  return hasHeader && hasBodyMarkers;
}
