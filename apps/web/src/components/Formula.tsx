"use client";
import { useMemo } from "react";

import { renderLatexToHtml } from "@/lib/katex";

type Props = {
  latex: string;
  display?: boolean;  // false: inline, true: block
  className?: string;
};

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