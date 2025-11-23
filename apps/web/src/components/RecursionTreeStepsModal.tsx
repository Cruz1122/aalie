"use client";

import type { AnalyzeOpenResponse } from "@aa/types";
import React from "react";

import Formula from "./Formula";

interface RecursionTreeStepsModalProps {
  open: boolean;
  onClose: () => void;
  proof: Array<{
    id: string;
    text: string;
  }> | null | undefined;
}

export default function RecursionTreeStepsModal({
  open,
  onClose,
  proof,
}: Readonly<RecursionTreeStepsModalProps>) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        role="button"
        tabIndex={0}
        aria-label="Cerrar modal"
      />
      <div className="absolute left-1/2 top-1/2 w-[min(95vw,1400px)] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-slate-900 ring-1 ring-white/10 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-white/10 p-4 flex-shrink-0">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-400">description</span>
            <span>Paso a Paso - Método de Árbol de Recursión</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 scrollbar-custom">
          {proof && proof.length > 0 ? (
            <div className="space-y-4">
              {proof.map((step, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                      <span className="text-purple-300 font-semibold text-sm">{idx + 1}</span>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                      <Formula latex={step.text} display />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <p>No hay pasos disponibles</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

