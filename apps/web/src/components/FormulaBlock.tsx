"use client";
import Formula from "./Formula";

export default function FormulaBlock({
  latex,
  className,
}: {
  latex: string;
  className?: string;
}) {
  return (
    <div
      className={`overflow-x-auto rounded-md border border-white/10 bg-slate-900/50 p-3 ${className ?? ""}`}
    >
      <div className="min-w-[48rem]">
        <Formula latex={latex} display />
      </div>
    </div>
  );
}
