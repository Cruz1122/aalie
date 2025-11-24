"use client";

export default function CodePane({ code }: Readonly<{ code: string }>) {
  const lines = code.split("\n");
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/50 p-3 h-full overflow-auto">
      <table className="text-sm w-full">
        <tbody>
          {lines.map((ln, i) => (
            <tr key={i} className="align-top">
              <td className="pr-3 text-right text-slate-400 select-none w-8 py-1">
                {i + 1}
              </td>
              <td className="font-mono text-[12px] text-slate-100 whitespace-pre py-1">
                {ln || " "}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
