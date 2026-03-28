// apps/web/src/lib/katex.ts
import katex from "katex";

/**
 * Renderiza LaTeX a HTML (SSR/CSR seguro).
 * - throwOnError: false → nunca rompe la UI si hay un error de sintaxis.
 * - trust: false → no ejecuta nada "activo" embebido.
 * - strict: "ignore" → ignora warnings de LaTeX no estándar.
 *
 * @param latex - Expresión LaTeX a renderizar
 * @param opts - Opciones opcionales de KaTeX (displayMode, etc.)
 * @returns String HTML con la expresión renderizada
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 *
 * @example
 * ```ts
 * const html = renderLatexToHtml("T(n) = O(n^2)", { displayMode: true });
 * ```
 */
/**
 * Convierte el contenido dentro de O(...) a LaTeX para KaTeX.
 * Ej: "n²" -> "n^2", "log n" -> "\\log n", "2ⁿ" -> "2^n"
 */
function complexityToLatex(content: string): string {
  return content
    .replace(/²/g, "^2")
    .replace(/ⁿ/g, "^n")
    .replace(/φ/g, "\\phi")
    .replace(/√(\d+)/g, "\\sqrt{$1}")
    .replace(/√(\w+)/g, "\\sqrt{$1}")
    .replace(/\blog\s+/g, "\\log ")
    .replace(/\bmin\s*\(/g, "\\min(");
}

/**
 * Extrae el contenido LaTeX de delimitadores $...$ o $$...$$.
 * El LLM y otros orígenes pueden devolver "$\Theta(n)$" en lugar de "\Theta(n)".
 *
 * @param latex - Cadena que puede contener delimitadores $ o $$
 * @returns Contenido interno listo para KaTeX
 * @author Plan corrección bugs trace
 */
function extractLatexFromDelimiters(latex: string): string {
  if (!latex || typeof latex !== "string") return latex;
  const s = latex.trim();
  if (s.startsWith("$$") && s.endsWith("$$") && s.length > 4) {
    return s.slice(2, -2).trim();
  }
  if (s.startsWith("$") && s.endsWith("$") && s.length > 2) {
    return s.slice(1, -1).trim();
  }
  return s;
}

export function renderLatexToHtml(
  latex: string,
  opts?: Partial<katex.KatexOptions>,
): string {
  const cleaned = extractLatexFromDelimiters(latex);
  return katex.renderToString(cleaned, {
    displayMode: !!opts?.displayMode,
    throwOnError: false,
    trust: false,
    strict: "ignore",
    output: "html", // html|mathml|htmlAndMathml
    ...opts,
  });
}
