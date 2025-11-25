"use client";

import React from "react";

import { useLoaderExamples } from "@/hooks/useLoaderExamples";

export const LoaderDemo: React.FC = () => {
  const { showSimpleLoader, analyzeAlgorithm, quickOperation, waitingLoader } =
    useLoaderExamples();

  return (
    <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-600/30 p-6 space-y-6">
      <header className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">
          Demo del Loader Global
        </h3>
        <p className="text-slate-300 text-sm">
          Prueba las diferentes variantes del loader integrado
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Loader simple */}
        <button
          onClick={showSimpleLoader}
          className="glass-secondary hover:glass-button p-4 rounded-lg transition-all duration-300 text-left group focus:outline-none focus:ring-2 focus:ring-blue-400/50"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full group-hover:animate-spin" />
            <h4 className="font-semibold text-white">Spinner</h4>
          </div>
          <p className="text-xs text-slate-400">
            Loader básico para cargas simples como imágenes
          </p>
        </button>

        {/* Loader de progreso */}
        <button
          onClick={analyzeAlgorithm}
          className="glass-secondary hover:glass-button p-4 rounded-lg transition-all duration-300 text-left group focus:outline-none focus:ring-2 focus:ring-blue-400/50"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-6 h-2 bg-slate-600 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 w-3/4 group-hover:w-full transition-all duration-300" />
            </div>
            <h4 className="font-semibold text-white">Progreso</h4>
          </div>
          <p className="text-xs text-slate-400">
            Para análisis de algoritmos con pasos detallados
          </p>
        </button>

        {/* Loader dots */}
        <button
          onClick={quickOperation}
          className="glass-secondary hover:glass-button p-4 rounded-lg transition-all duration-300 text-left group focus:outline-none focus:ring-2 focus:ring-blue-400/50"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-blue-500 rounded-full group-hover:animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
            <h4 className="font-semibold text-white">Dots</h4>
          </div>
          <p className="text-xs text-slate-400">
            Para operaciones rápidas como guardar configuración
          </p>
        </button>

        {/* Loader pulse */}
        <button
          onClick={waitingLoader}
          className="glass-secondary hover:glass-button p-4 rounded-lg transition-all duration-300 text-left group focus:outline-none focus:ring-2 focus:ring-blue-400/50"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="relative flex items-center justify-center">
              <div className="w-6 h-6 bg-blue-500/20 rounded-full group-hover:animate-ping" />
              <div className="absolute w-3 h-3 bg-blue-500 rounded-full" />
            </div>
            <h4 className="font-semibold text-white">Pulse</h4>
          </div>
          <p className="text-xs text-slate-400">
            Para esperas prolongadas como conexiones
          </p>
        </button>
      </div>

      {/* Código de ejemplo */}
      <details className="mt-6">
        <summary className="cursor-pointer text-sm font-medium text-slate-300 hover:text-white transition-colors">
          Ver código de ejemplo
        </summary>
        <div className="mt-4 bg-slate-900/50 rounded-lg p-4 text-xs font-mono text-slate-300 overflow-x-auto">
          <pre>{`// Importar el hook
import { useGlobalLoader } from '@/contexts/GlobalLoaderContext';

const Component = () => {
  const { show, hide, updateProgress, updateMessage } = useGlobalLoader();
  
  const handleAnalysis = async () => {
    // Mostrar loader de progreso
    show({
      variant: 'progress',
      size: 'lg',
      message: 'Analizando algoritmo...',
      progress: 0,
      persistent: true
    });
    
    // Actualizar progreso
    for (let i = 0; i <= 100; i += 20) {
      updateProgress(i);
      updateMessage(\`Paso \${i/20 + 1} de 5...\`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    hide();
  };
};`}</pre>
        </div>
      </details>
    </div>
  );
};
