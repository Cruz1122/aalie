"use client";
import type { LineCost } from "@aa/types";

import Formula from "./Formula";

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
function Badge({ kind }: { readonly kind: LineCost["kind"] }) {
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

  const kindLabels = {
    assign: "Asignación",
    if: "Condicional",
    for: "Bucle For",
    while: "Bucle While",
    repeat: "Bucle Repeat",
    call: "Llamada",
    print: "Impresión",
    return: "Retorno",
    decl: "Declaración",
    other: "Otro",
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
  // Detectar si estamos en modo promedio (si alguna fila tiene expectedRuns)
  const isAvgMode = rows.some((row) => row.expectedRuns !== undefined);

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-white/5 backdrop-blur-sm">
          <tr>
            <th className="text-center p-2 font-semibold text-slate-300">#</th>
            <th className="text-center p-2 font-semibold text-slate-300">
              Tipo
            </th>
            <th className="text-center p-2 font-semibold text-slate-300">
              C<sub>k</sub>
            </th>
            <th className="text-center p-2 font-semibold text-slate-300">
              {isAvgMode ? (
                <Formula latex="E[\# \text{ ejecuciones}]" />
              ) : (
                "# ejecuciones"
              )}
            </th>
            {onViewProcedure && (
              <th className="text-center p-2 font-semibold text-slate-300">
                Acción
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={idx}
              className="border-t border-white/10 hover:bg-white/5 transition-colors"
            >
              <td className="p-2 text-center text-slate-200 font-mono">
                {row.line}
              </td>
              <td className="p-2 text-center">
                <Badge kind={row.kind} />
              </td>
              <td className="p-2 text-center whitespace-nowrap text-slate-200">
                <Formula latex={row.ck} />
              </td>
              <td className="p-2 text-center whitespace-nowrap text-slate-200">
                <Formula latex={row.expectedRuns || row.count} />
              </td>
              {onViewProcedure && (
                <td className="p-2 text-center">
                  <button
                    onClick={() => onViewProcedure(row.line)}
                    className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors"
                  >
                    Ver
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
