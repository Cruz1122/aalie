"use client";

import Formula from "@/components/Formula";
import { complexityToLatex } from "@/lib/katex";

export type ExampleCategory =
  | "simple"
  | "iterative"
  | "recursive_iteration"
  | "recursive_master"
  | "recursive_tree"
  | "recursive_characteristic";

export interface Example {
  id: number;
  name: string;
  description: string;
  complexity: string;
  code: string;
  category: ExampleCategory;
  note?: string;
  isHomogeneous?: boolean;
}

const CATEGORY_ACCENT: Record<ExampleCategory, string> = {
  simple: "border-l-gray-500/50",
  iterative: "border-l-blue-500/50",
  recursive_iteration: "border-l-purple-500/50",
  recursive_master: "border-l-orange-500/50",
  recursive_tree: "border-l-cyan-500/50",
  recursive_characteristic: "border-l-indigo-500/50",
};

const CATEGORY_ICON: Record<ExampleCategory, string> = {
  simple: "code",
  iterative: "loop",
  recursive_iteration: "replay",
  recursive_master: "calculate",
  recursive_tree: "account_tree",
  recursive_characteristic: "functions",
};

const COMPLEXITY_CASE_STYLES = {
  best: "bg-green-500/20 text-green-300 border border-green-500/30",
  worst: "bg-red-500/20 text-red-300 border border-red-500/30",
  avg: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
  single: "bg-slate-700/50 text-cyan-300/90 border border-slate-600/50",
} as const;

/** Parsea la complejidad: si tiene Best/Worst/Avg (o Mejor/Peor/Prom), separa en badges con colores */
function ComplexityBadges({
  complexity,
  className,
}: {
  complexity: string;
  className?: string;
}) {
  const caseRegex =
    /(?:Mejor|Best):\s*(O\([^)]*(?:\([^)]*\)[^)]*)*\))|(?:Peor|Worst):\s*(O\([^)]*(?:\([^)]*\)[^)]*)*\))|(?:Prom|Avg):\s*(O\([^)]*(?:\([^)]*\)[^)]*)*\))/gi;
  const cases: { type: "best" | "worst" | "avg"; expr: string }[] = [];
  let match;
  while ((match = caseRegex.exec(complexity)) !== null) {
    const expr = match[1] || match[2] || match[3];
    if (match[1]) cases.push({ type: "best", expr });
    else if (match[2]) cases.push({ type: "worst", expr });
    else if (match[3]) cases.push({ type: "avg", expr });
  }

  if (cases.length > 0) {
    return (
      <div className={`flex flex-wrap justify-center gap-1.5 ${className || ""}`}>
        {cases.map((c, i) => {
          const inner = c.expr.slice(2, -1); // quitar O( y )
          const latex = complexityToLatex(inner);
          return (
            <span
              key={i}
              className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-mono [&_.katex]:text-sm ${COMPLEXITY_CASE_STYLES[c.type]}`}
            >
              <Formula latex={`O(${latex})`} className="align-baseline" />
            </span>
          );
        })}
      </div>
    );
  }

  /* Un solo coste: badge neutro */
  const singleRegex = /O\(((?:[^()]|\([^)]*\))*)\)/;
  const singleMatch = complexity.match(singleRegex);
  if (singleMatch) {
    const latexContent = complexityToLatex(singleMatch[1]);
    const rest = complexity.slice(singleMatch.index! + singleMatch[0].length).trim();
    return (
      <div className={`flex flex-wrap justify-center gap-1.5 items-center ${className || ""}`}>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-mono [&_.katex]:text-sm ${COMPLEXITY_CASE_STYLES.single}`}
        >
          <Formula latex={`O(${latexContent})`} className="align-baseline" />
        </span>
        {rest && <span className="text-[10px] text-dark-text">{rest}</span>}
      </div>
    );
  }

  /* Fallback: texto plano */
  return (
    <span className={`text-xs text-cyan-300/90 ${className || ""}`}>
      {complexity}
    </span>
  );
}

interface ExampleCardProps {
  example: Example;
  category: ExampleCategory;
  copiedId: number | null;
  viewingCodeId: number | null;
  analyzingExampleId: number | null;
  onCopy: (code: string, id: number) => void;
  onViewCode: (id: number | null) => void;
  onAnalyze: (code: string, id: number) => void;
  t: (key: string) => string;
}

export function ExampleCard({
  example,
  category,
  copiedId,
  viewingCodeId,
  analyzingExampleId,
  onCopy,
  onViewCode,
  onAnalyze,
  t,
}: ExampleCardProps) {
  const isViewing = viewingCodeId === example.id;
  const isCopied = copiedId === example.id;
  const isAnalyzing = analyzingExampleId === example.id;
  const isDisabled = analyzingExampleId !== null;

  return (
    <div
      id={`example-${example.id}`}
      className={`glass-card p-4 flex flex-col h-[380px] overflow-hidden border border-white/10 rounded-xl border-l-4 ${CATEGORY_ACCENT[category]} transition-all duration-200 hover:border-white/20 hover:shadow-lg hover:shadow-primary/5 scroll-mt-24 relative`}
    >
      {/* Homogeneous/Non-homogeneous: tooltip en esquina (como card de caso promedio) */}
      {example.category === "recursive_characteristic" &&
        example.isHomogeneous !== undefined &&
        !isViewing && (
          <div className="absolute top-2 right-2 group z-10">
            <button
              type="button"
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                example.isHomogeneous
                  ? "bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:bg-blue-500/30"
                  : "bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30"
              }`}
              title={
                example.isHomogeneous ? t("homogeneous") : t("nonHomogeneous")
              }
            >
              ?
            </button>
            <div
              className={`absolute right-0 top-6 w-40 p-2 bg-slate-800 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-xs text-left border ${
                example.isHomogeneous
                  ? "border-blue-500/30"
                  : "border-amber-500/30"
              }`}
            >
              <div
                className={
                  example.isHomogeneous ? "text-blue-300" : "text-amber-300"
                }
              >
                {example.isHomogeneous
                  ? t("homogeneous")
                  : t("nonHomogeneous")}
              </div>
            </div>
          </div>
        )}

      {/* Área de contenido: info o código (reemplaza el frame, no muta tamaño) */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {isViewing ? (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-lg border border-white/10 bg-slate-900/80">
            <div className="px-2 py-1 bg-slate-800/80 border-b border-white/5 flex items-center gap-2 shrink-0">
              <span className="material-symbols-outlined text-slate-400 text-xs">
                code
              </span>
              <span className="text-[10px] text-slate-400">
                {t("pseudocode")}
              </span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto p-3 scrollbar-custom overscroll-contain">
              <pre className="text-emerald-300/95 font-mono text-[11px] leading-relaxed whitespace-pre min-w-min">
                {example.code}
              </pre>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            {/* Icono centrado */}
            <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-2xl">
                {CATEGORY_ICON[category]}
              </span>
            </div>

            {/* Nombre debajo del icono */}
            <h3 className="text-base font-semibold text-white leading-tight mt-2">
              {t(`items.${example.id}.name`)}
            </h3>

            {/* Coste teórico (KaTeX) debajo del nombre */}
            <div className="mt-1.5 flex flex-wrap justify-center gap-1.5 items-center">
              <ComplexityBadges complexity={t(`items.${example.id}.complexity`)} />
            </div>

            {/* Descripción debajo del coste teórico */}
            <p className="text-dark-text text-xs leading-relaxed line-clamp-2 mt-2 text-left w-full">
              {t(`items.${example.id}.description`)}
            </p>
          </div>
        )}
      </div>

      {/* Notas amarillas: fijas abajo, encima de los botones */}
      {example.note && !isViewing && (
        <div className="shrink-0 flex items-center gap-2 py-1.5 px-2 rounded-lg bg-amber-500/10 border border-amber-500/20 mt-2">
          <span className="material-symbols-outlined text-amber-400 text-sm shrink-0">
            info
          </span>
          <p className="text-[11px] text-amber-200/90 leading-snug">
            {t("note")}: {t(`items.${example.id}.note`)}
          </p>
        </div>
      )}

      {/* Botones siempre fijos abajo */}
      <div className="shrink-0 flex flex-col gap-2 pt-3">
        <button
          onClick={() => onViewCode(isViewing ? null : example.id)}
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium border border-white/10 hover:bg-white/5 hover:border-white/20 text-slate-300 transition-colors"
          disabled={isDisabled}
        >
          <span className="material-symbols-outlined text-sm">
            {isViewing ? "visibility_off" : "visibility"}
          </span>
          {isViewing ? t("hideCode") : t("viewCode")}
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => onCopy(example.code, example.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium border border-white/10 hover:bg-white/5 hover:border-white/20 text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isDisabled}
          >
            <span
              className={`material-symbols-outlined text-sm transition-transform ${
                isCopied ? "scale-110 text-green-400" : ""
              }`}
            >
              {isCopied ? "check_circle" : "content_copy"}
            </span>
            {isCopied ? t("copied") : t("copy")}
          </button>
          <button
            onClick={() => onAnalyze(example.code, example.id)}
            disabled={isDisabled}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium bg-primary/25 border border-primary/40 hover:bg-primary/35 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span
              className={`material-symbols-outlined text-sm ${
                isAnalyzing ? "animate-spin" : ""
              }`}
            >
              {isAnalyzing ? "progress_activity" : "play_arrow"}
            </span>
            {isAnalyzing ? t("analyzing") : t("analyze")}
          </button>
        </div>
      </div>
    </div>
  );
}
