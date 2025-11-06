"use client";

import React from "react";

interface AnalysisLoaderProps {
  progress: number;
  message: string;
  algorithmType?: "iterative" | "recursive" | "hybrid" | "unknown";
  isComplete?: boolean;
}

const getAlgorithmTypeLabel = (type?: string): string => {
  switch (type) {
    case "iterative":
      return "Iterativo";
    case "recursive":
      return "Recursivo";
    case "hybrid":
      return "Híbrido";
    case "unknown":
      return "Desconocido";
    default:
      return "";
  }
};

const getAlgorithmTypeColor = (type?: string): string => {
  switch (type) {
    case "iterative":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "recursive":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "hybrid":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "unknown":
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    default:
      return "";
  }
};

export const AnalysisLoader: React.FC<AnalysisLoaderProps> = ({
  progress,
  message,
  algorithmType,
  isComplete = false,
}) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Overlay con efecto glass */}
      <div className="absolute inset-0 glass-modal-overlay" />

      {/* Contenedor del loader - tamaño fijo grande */}
      <div className="relative z-10 glass-modal-container rounded-2xl p-8 w-[600px] h-[400px] mx-4 shadow-2xl modal-animate-in flex flex-col justify-center">
        {/* Icono de estado */}
        <div className="flex justify-center mb-6">
          {isComplete ? (
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-500/30">
              <span className="material-symbols-outlined text-4xl text-green-400">
                check_circle
              </span>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center border-2 border-blue-500/30">
              <span className="material-symbols-outlined text-4xl text-blue-400 animate-spin">
                progress_activity
              </span>
            </div>
          )}
        </div>

        {/* Mensaje principal */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-white mb-2">{message}</h3>
          
          {/* Badge del tipo de algoritmo con animación pop */}
          {algorithmType && (
            <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${getAlgorithmTypeColor(algorithmType)} animate-[pop_0.5s_ease-out]`}>
              <span className="material-symbols-outlined text-base">
                category
              </span>
              <span>Algoritmo: {getAlgorithmTypeLabel(algorithmType)}</span>
            </div>
          )}
        </div>

        {/* Barra de progreso - basada ÚNICAMENTE en el porcentaje mostrado */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-300">Progreso</span>
            <span className="text-sm font-semibold text-white">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-3 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
              style={{ 
                width: `${Math.min(100, Math.max(0, progress))}%`
              }}
            />
          </div>
        </div>

        {/* Indicador de etapas */}
        {!isComplete && (
          <div className="text-center">
            <p className="text-xs text-slate-400">
              Por favor, espera mientras se completa el análisis...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

