"use client";
import { useMemo } from "react";

import { renderLatexToHtml } from "@/lib/katex";

/**
 * Propiedades del componente Formula.
 */
type Props = {
  /** Expresión LaTeX a renderizar */
  latex: string;
  /** Si es true, renderiza en modo bloque; si es false, renderiza inline */
  display?: boolean;
  /** Clases CSS adicionales */
  className?: string;
};

/**
 * Componente para renderizar fórmulas matemáticas en LaTeX usando KaTeX.
 * 
 * @param props - Propiedades del componente
 * @returns Componente React con la fórmula renderizada
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 * 
 * @example
 * ```tsx
 * // Fórmula inline
 * <Formula latex="T(n) = O(n^2)" />
 * 
 * // Fórmula en bloque
 * <Formula latex="T(n) = \sum_{i=1}^{n} i" display />
 * ```
 */
export default function Formula({ latex, display = false, className }: Props) {
  const html = useMemo(() => renderLatexToHtml(latex, { displayMode: display }), [latex, display]);
  const baseClassName = display ? 'block w-full' : 'inline';
  return (
    <span
      className={`${baseClassName} ${className || ''}`}
      // El HTML viene de KaTeX (determinista). No meter HTML del usuario aquí.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}