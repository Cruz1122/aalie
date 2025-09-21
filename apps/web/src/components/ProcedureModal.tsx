"use client";
import { useEffect } from "react";

export default function ProcedureModal({
  open,
  onClose,
  selectedLine,
}: Readonly<{
  open: boolean;
  onClose: () => void;
  selectedLine?: number | null;
}>) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isLineProcedure = selectedLine !== null && selectedLine !== undefined;
  const modalTitle = isLineProcedure 
    ? `Procedimiento - Línea ${selectedLine}`
    : "Procedimiento Completo";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="absolute left-1/2 top-1/2 w-[min(92vw,960px)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-slate-900 p-4 ring-1 ring-white/10 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-base font-semibold text-white">{modalTitle}</h3>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {isLineProcedure ? (
            // Contenido específico para una línea
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
                <h4 className="font-semibold text-white mb-2">Análisis de Línea {selectedLine}</h4>
                <div className="space-y-3">
                  <div className="p-3 rounded bg-slate-900/50 border border-blue-500/20">
                    <span className="text-sm font-medium text-blue-300">Costo Individual</span>
                    <p className="text-slate-300 mt-1 text-sm">
                      Análisis detallado del costo computacional para esta línea específica.
                    </p>
                  </div>
                  <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20">
                    <span className="text-sm font-medium text-amber-300">Ejecuciones</span>
                    <p className="text-slate-300 mt-1 text-sm">
                      Número de veces que se ejecuta esta instrucción.
                    </p>
                  </div>
                  <div className="p-3 rounded bg-green-500/10 border border-green-500/20">
                    <span className="text-sm font-medium text-green-300">Fórmula Resultante</span>
                    <p className="text-slate-300 mt-1 text-sm">
                      Expresión matemática del costo para esta línea.
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-sm text-slate-300 text-center py-4 border-2 border-dashed border-slate-600 rounded-lg">
                <p className="text-sm">🔍 Procedimiento específico para línea {selectedLine}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Sprint 3/4: detalles matemáticos y pasos de cálculo
                </p>
              </div>
            </div>
          ) : (
            // Contenido general (análisis completo)
            <>
              <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
                <h4 className="font-semibold text-white mb-2">Casos de Análisis</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="p-3 rounded bg-green-500/10 border border-green-500/20">
                    <span className="font-medium text-green-300">Best Case</span>
                    <p className="text-slate-400 mt-1">Escenario óptimo</p>
                  </div>
                  <div className="p-3 rounded bg-yellow-500/10 border border-yellow-500/20">
                    <span className="font-medium text-yellow-300">Average Case</span>
                    <p className="text-slate-400 mt-1">Escenario promedio</p>
                  </div>
                  <div className="p-3 rounded bg-red-500/10 border border-red-500/20">
                    <span className="font-medium text-red-300">Worst Case</span>
                    <p className="text-slate-400 mt-1">Escenario pesimista</p>
                  </div>
                </div>
              </div>
              <div className="text-sm text-slate-300 text-center py-8 border-2 border-dashed border-slate-600 rounded-lg">
                <div className="space-y-2">
                  <p className="text-lg">🚧 Contenido en desarrollo</p>
                  <p>Aquí aparecerán los pasos detallados del análisis con KaTeX</p>
                  <p className="text-xs text-slate-400">Sprint 3/4: integración con backend y procedimientos matemáticos</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}