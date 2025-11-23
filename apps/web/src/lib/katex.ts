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
export function renderLatexToHtml(
  latex: string,
  opts?: Partial<katex.KatexOptions>
): string {
  return katex.renderToString(latex, {
    displayMode: !!opts?.displayMode,
    throwOnError: false,
    trust: false,
    strict: "ignore",
    output: "html", // html|mathml|htmlAndMathml
    ...opts,
  });
}