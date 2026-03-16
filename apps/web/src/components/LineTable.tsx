"use client";

import type { LineCost } from "@aa/types";
import { useTranslations } from "next-intl";

import Formula from "./Formula";

/** Detecta si el count contiene símbolos iterativos unbounded (t_while, t_repeat). */
function hasUnboundedIterativeSymbol(count: string): boolean {
  if (!count || typeof count !== "string") return false;
  return (
    /t_\{?while[\d_]*\}?|t_\{?repeat[\d_]*\}?|t_while|t_repeat/i.test(count) ||
    count.includes("t_{while") ||
    count.includes("t_{repeat")
  );
}

/** Devuelve LaTeX para mostrar: ∞ cuando es unbounded con t_while/t_repeat, sino el count original. */
function getDisplayCountLatex(
  row: LineCost,
  hasUnboundedInData: boolean,
): string {
  const count = row.expectedRuns ?? row.count ?? "";
  if (
    hasUnboundedInData &&
    hasUnboundedIterativeSymbol(count)
  ) {
    return "\\infty";
  }
  return count;
}

/**
 * Propiedades del componente LineTable.
 */
interface LineTableProps {
  /** Filas de costos por línea */
  rows: LineCost[];
  /** Callback opcional para ver el procedimiento de una línea */
  onViewProcedure?: (lineNo: number) => void;
}

/**
 * Componente Badge para mostrar el tipo de línea de código.
 * @param kind - Tipo de línea de código
 * @returns Componente React del badge
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
function Badge({ kind, t }: { readonly kind: LineCost["kind"]; readonly t: (k: string) => string }) {
  const badgeStyles = {
    assign: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    if: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    for: "bg-green-500/20 text-green-300 border-green-500/30",
    while: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    repeat: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    call: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    print: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    return: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    decl: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    other: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  };

  const kindLabels: Record<LineCost["kind"], string> = {
    assign: t("assign"),
    if: t("if"),
    for: t("for"),
    while: t("while"),
    repeat: t("repeat"),
    call: t("call"),
    print: t("print"),
    return: t("return"),
    decl: t("decl"),
    other: t("other"),
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${badgeStyles[kind]}`}
    >
      {kindLabels[kind]}
    </span>
  );
}

/**
 * Componente de tabla para mostrar costos por línea de código.
 * Similar a CostsTable pero con un diseño diferente y soporte para modo promedio
 * (muestra E[# ejecuciones] en lugar de # ejecuciones).
 *
 * @param props - Propiedades de la tabla
 * @returns Componente React de la tabla de líneas
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 *
 * @example
 * ```tsx
 * <LineTable
 *   rows={costRows}
 *   onViewProcedure={(line) => handleViewProcedure(line)}
 * />
 * ```
 */
export default function LineTable({
  rows,
  onViewProcedure,
}: Readonly<LineTableProps>) {
  const t = useTranslations("analyzer.lineTable");
  const isAvgMode = rows.some((row) => row.expectedRuns !== undefined);
  const hasUnboundedInData = rows.some((row) => row.unbounded === true);

  return (
    <div className="overflow-auto min-w-0" style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
      <table className="w-full text-sm min-w-[320px]">
        <thead className="sticky top-0 bg-white/5 backdrop-blur-sm">
          <tr>
            <th className="text-center p-2 font-semibold text-slate-300 w-10">#</th>
            <th className="text-center p-2 font-semibold text-slate-300 w-24">
              {t("type")}
            </th>
            <th className="text-center p-2 font-semibold text-slate-300 w-14">
              C<sub>k</sub>
            </th>
            <th className="text-center p-2 font-semibold text-slate-300 w-12">
              {t("elementaryOps")}
            </th>
            <th className="text-center p-2 font-semibold text-slate-300 min-w-[100px]">
              {isAvgMode ? (
                <Formula latex="E[\# \text{ ejecuciones}]" />
              ) : (
                t("executions")
              )}
            </th>
            {onViewProcedure && (
              <th className="text-center p-2 font-semibold text-slate-300">
                {t("action")}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={idx}
              className="border-t border-white/10 hover:bg-white/5 transition-colors min-w-0"
            >
              <td className="p-2 text-center text-slate-200 font-mono">
                {row.line}
              </td>
              <td className="p-2 text-center min-w-0">
                <span className="inline-flex items-center gap-1.5 flex-wrap justify-center max-w-full">
                  <Badge kind={row.kind} t={t} />
                  {row.unbounded === true && (
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      title={t("whileUnboundedWarning")}
                    >
                      {t("whileUnboundedWarning")}
                    </span>
                  )}
                </span>
              </td>
              <td className="p-2 text-center whitespace-nowrap text-slate-200">
                <Formula latex={row.ck} />
              </td>
              <td className="p-2 text-center whitespace-nowrap text-slate-200">
                <Formula
                  latex={
                    row.ops != null ? String(row.ops) : "\\text{—}"
                  }
                />
              </td>
              <td className="p-2 text-center whitespace-nowrap text-slate-200">
                <Formula
                  latex={getDisplayCountLatex(row, hasUnboundedInData)}
                />
              </td>
              {onViewProcedure && (
                <td className="p-2 text-center">
                  <button
                    onClick={() => onViewProcedure(row.line)}
                    className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors"
                  >
                    {t("view")}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
