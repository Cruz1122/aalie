// apps/web/src/lib/katex.ts
import katex from "katex";

/**
 * Renderiza LaTeX a HTML (SSR/CSR seguro).
 * - throwOnError: false → nunca rompe la UI si hay un error de sintaxis.
 * - trust: false → no ejecuta nada "activo" embebido.
 */
export function renderLatexToHtml(
  latex: string,
  opts?: Partial<katex.KatexOptions>
): string {
  return katex.renderToString(latex, {
    displayMode: !!opts?.displayMode,
    throwOnError: false,
    trust: false,
    output: "html", // html|mathml|htmlAndMathml
    ...opts,
  });
}