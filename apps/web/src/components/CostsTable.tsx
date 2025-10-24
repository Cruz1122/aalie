"use client";

import type { LineCost } from "@aa/types";
import Formula from "./Formula";

// Helper para renderizar variables con KaTeX
function renderVariable(variable: string) {
  // Renderizar todo con KaTeX para consistencia visual
  return <Formula latex={variable} />
}

interface CostsTableProps {
  rows: LineCost[];
  onViewProcedure?: (lineNo: number) => void;
}

export default function CostsTable({ rows, onViewProcedure }: Readonly<CostsTableProps>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-white/10 flex-1">
      <table className="w-full text-sm">
        <thead className="bg-slate-800 text-slate-100">
          <tr>
            <th className="px-2 py-2 text-left w-12">#</th>
            <th className="px-2 py-2 text-left w-20">Tipo</th>
            <th className="px-2 py-2 text-left w-24">
              <Formula latex="C_k" />
            </th>
            <th className="px-2 py-2 text-left w-32">Número de ejecuciones</th>
            <th className="px-2 py-2 text-center w-16">Ver</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {rows.map((r) => (
            <tr key={r.line} className="bg-slate-900/40 hover:bg-slate-800/50 transition-colors">
              <td className="px-2 py-2 text-slate-200 text-xs">{r.line}</td>
              <td className="px-2 py-2">
                {(() => {
                  const getBadgeStyle = (kind: string) => {
                    switch (kind) {
                      case 'assign': return 'bg-blue-500/20 text-blue-300';
                      case 'for': return 'bg-purple-500/20 text-purple-300';
                      case 'while': return 'bg-orange-500/20 text-orange-300';
                      case 'if': return 'bg-green-500/20 text-green-300';
                      case 'call': return 'bg-cyan-500/20 text-cyan-300';
                      case 'return': return 'bg-pink-500/20 text-pink-300';
                      case 'decl': return 'bg-yellow-500/20 text-yellow-300';
                      default: return 'bg-gray-500/20 text-gray-300';
                    }
                  };
                  
                  return (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBadgeStyle(r.kind)}`}>
                      {r.kind}
                    </span>
                  );
                })()}
              </td>
              <td className="px-2 py-2">
                {renderVariable(r.ck)}
              </td>
              <td className="px-2 py-2">
                {renderVariable(r.count)}
              </td>
              <td className="px-2 py-2 text-center">
                {r.ck === "—" ? (
                  <span className="text-slate-600 text-xs">—</span>
                ) : (
                  <button
                    onClick={() => onViewProcedure?.(r.line)}
                    className="p-1 rounded-md hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                    title={`Ver procedimiento para línea ${r.line}`}
                    aria-label={`Ver procedimiento para línea ${r.line}`}
                  >
                    <span className="material-symbols-outlined text-xs">visibility</span>
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}