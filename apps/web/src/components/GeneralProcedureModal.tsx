"use client";

import type { AnalyzeOpenResponse } from "@aa/types";
import React, { useMemo } from "react";


import Formula from "./Formula";

interface GeneralProcedureModalProps {
  open: boolean;
  onClose: () => void;
  data: AnalyzeOpenResponse | undefined;
}

const normalizePolynomial = (poly?: string): string => {
  if (!poly) return "";
  // Reemplazar \\cdot por espacio y limpiar espacios
  const p = poly.replace(/\\cdot/g, " ").replace(/\s+/g, " ").trim();
  // Separar por + y filtrar términos con "0 *"
  const parts = p.split("+").map(s => s.trim()).filter(term => !/^0\s/.test(term));
  // Volver a unir respetando espacios alrededor de +
  return parts.join(" + ") || "0";
};

const deriveBigO = (base: string): string => {
  if (!base) return "O(1)";
  if (base.includes("n^3") || base.includes("n³")) return "O(n^3)";
  if (base.includes("n^2") || base.includes("n²")) return "O(n^2)";
  if (/([^\^]|^)n(?![\w^])/.test(base)) return "O(n)";
  if (base.includes("\\log(n)")) return "O(\\log n)";
  return "O(1)";
};

export default function GeneralProcedureModal({ open, onClose, data }: Readonly<GeneralProcedureModalProps>) {
  const tOpen = data?.totals?.T_open || "";
  const rawPoly = (data?.totals as { T_polynomial?: string })?.T_polynomial;
  const normPoly = normalizePolynomial(rawPoly);
  
  // Usar notaciones asintóticas del backend (calculadas con SymPy) si están disponibles
  const totals = data?.totals as { 
    T_polynomial?: string;
    big_o?: string;
    big_omega?: string;
    big_theta?: string;
  } | undefined;
  
  const bigO = totals?.big_o || deriveBigO(normPoly && normPoly !== "0" ? normPoly : tOpen);
  const bigOmega = totals?.big_omega || "\\Omega(1)";
  const bigTheta = totals?.big_theta || "\\Theta(1)";

  const grouped = useMemo(() => {
    if (!data?.byLine) return "";
    return data.byLine.map(line => `${line.ck} \\cdot (${line.count})`).join(" + ");
  }, [data?.byLine]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[min(95vw,1000px)] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-slate-900 ring-1 ring-white/10 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-white/10 p-4 flex-shrink-0">
          <h3 className="text-lg font-semibold text-white">Procedimiento General</h3>
          <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors p-1 hover:bg-white/10 rounded" aria-label="Cerrar modal">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-custom">
          {/* T_open */}
          <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
            <h4 className="text-white font-semibold mb-2">Ecuación de Eficiencia T(n)</h4>
            <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto">
              <Formula latex={tOpen} display />
            </div>
          </div>

          {/* Forma polinómica */}
          <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
            <h4 className="text-white font-semibold mb-2">Forma polinómica T(n)</h4>
            <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto">
              <Formula latex={(normPoly && normPoly !== "0") ? normPoly : grouped} display />
            </div>
          </div>

          {/* Notación asintótica */}
          <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
            <h4 className="text-white font-semibold mb-2">Notación asintótica</h4>
            <div className="space-y-3">
              <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto">
                <div className="text-sm text-slate-400 mb-1">Big-O (cota superior):</div>
                <Formula latex={bigO} display />
              </div>
              <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto">
                <div className="text-sm text-slate-400 mb-1">Big-Omega (cota inferior):</div>
                <Formula latex={bigOmega} display />
              </div>
              <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto">
                <div className="text-sm text-slate-400 mb-1">Big-Theta (cota ajustada):</div>
                <Formula latex={bigTheta} display />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
