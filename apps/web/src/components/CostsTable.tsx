"use client";

type Row = { no: number; code: string; ck: string; execs: string; cost: string };

interface CostsTableProps {
  rows: Row[];
  onViewProcedure?: (rowNo: number) => void;
}

export default function CostsTable({ rows, onViewProcedure }: Readonly<CostsTableProps>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-white/10 flex-1">
      <table className="w-full text-sm">
        <thead className="bg-slate-800 text-slate-100">
          <tr>
            <th className="px-2 py-2 text-left w-8">#</th>
            <th className="px-2 py-2 text-left">Código</th>
            <th className="px-2 py-2 text-left w-12">C_k</th>
            <th className="px-2 py-2 text-left w-16">#ejec</th>
            <th className="px-2 py-2 text-left">Costo</th>
            <th className="px-2 py-2 text-center w-10">Ver</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {rows.map((r) => (
            <tr key={r.no} className="bg-slate-900/40 hover:bg-slate-800/50 transition-colors">
              <td className="px-2 py-2 text-slate-200 text-xs">{r.no}</td>
              <td className="px-2 py-2 font-mono text-[10px] text-slate-100 max-w-[120px] xl:max-w-[140px] truncate" title={r.code}>
                {r.code}
              </td>
              <td className="px-2 py-2 text-sky-300 text-xs">{r.ck}</td>
              <td className="px-2 py-2 text-emerald-300 text-xs">{r.execs}</td>
              <td className="px-2 py-2 text-amber-300 text-xs">{r.cost}</td>
              <td className="px-2 py-2 text-center">
                {r.ck !== "—" ? (
                  <button
                    onClick={() => onViewProcedure?.(r.no)}
                    className="p-1 rounded-md hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                    title={`Ver procedimiento para línea ${r.no}`}
                    aria-label={`Ver procedimiento para línea ${r.no}`}
                  >
                    <span className="material-symbols-outlined text-xs">visibility</span>
                  </button>
                ) : (
                  <span className="text-slate-600 text-xs">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}