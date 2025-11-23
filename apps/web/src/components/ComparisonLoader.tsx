"use client";

import React, { useEffect, useState } from "react";

/**
 * Propiedades del componente ComparisonLoader.
 */
interface ComparisonLoaderProps {
  /** Progreso de la comparación (0-100) */
  progress: number;
  /** Mensaje a mostrar durante la comparación */
  message: string;
  /** Indica si la comparación está completa */
  isComplete?: boolean;
  /** Mensaje de error si ocurrió algún problema */
  error?: string | null;
  /** Callback para cerrar el loader */
  onClose?: () => void;
}

/**
 * Componente de loader para mostrar el progreso de la comparación con LLM.
 * Muestra una barra de progreso y mensajes de estado específicos para la comparación.
 * 
 * @param props - Propiedades del loader
 * @returns Componente React del loader de comparación
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 * 
 * @example
 * ```tsx
 * <ComparisonLoader
 *   progress={75}
 *   message="Analizando algoritmo..."
 *   isComplete={false}
 *   error={null}
 *   onClose={() => setIsComparing(false)}
 * />
 * ```
 */
export const ComparisonLoader: React.FC<ComparisonLoaderProps> = ({
  progress,
  message,
  isComplete = false,
  error = null,
  onClose,
}) => {
  const hasError = !!error;
  const [isClosing, setIsClosing] = useState(false);
  
  // Iniciar animación de cierre cuando se completa
  useEffect(() => {
    if (isComplete && !hasError) {
      // Esperar un momento antes de iniciar el fade-out
      const timer = setTimeout(() => {
        setIsClosing(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isComplete, hasError]);
  
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      window.location.reload();
    }
  };
  
  return (
    <div className={`fixed inset-0 z-[60] flex items-center justify-center transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`} style={{ pointerEvents: isComplete || error ? 'auto' : 'none' }}>
      {/* Overlay con efecto glass */}
      <div className={`absolute inset-0 glass-modal-overlay transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`} style={{ pointerEvents: 'none' }} />

      {/* Contenedor del loader - tamaño fijo grande */}
      <div className={`relative z-10 glass-modal-container rounded-2xl p-8 w-[600px] h-[400px] mx-4 shadow-2xl flex flex-col justify-center transition-all duration-300 ${isClosing ? 'opacity-0 scale-95 translate-y-2' : 'opacity-100 scale-100 translate-y-0'}`}>
        {/* Icono de estado */}
        <div className="flex justify-center mb-6">
          {hasError ? (
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center border-2 border-red-500/30">
              <span className="material-symbols-outlined text-4xl text-red-400">
                error
              </span>
            </div>
          ) : isComplete ? (
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-500/30">
              <span className="material-symbols-outlined text-4xl text-green-400">
                check_circle
              </span>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center border-2 border-purple-500/30">
              <span className="material-symbols-outlined text-4xl text-purple-400 animate-spin">
                progress_activity
              </span>
            </div>
          )}
        </div>

        {/* Mensaje principal */}
        <div className="text-center mb-6">
          <h3 className={`text-xl font-semibold mb-2 ${hasError ? 'text-red-300' : 'text-white'}`}>
            {hasError ? "Error en la comparación" : message}
          </h3>
          
          {/* Mensaje de error */}
          {hasError && (
            <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-sm text-red-300 whitespace-pre-wrap">{error}</p>
            </div>
          )}
          
          {/* Badge de comparación */}
          {!hasError && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium bg-purple-500/20 text-purple-400 border-purple-500/30 animate-[pop_0.5s_ease-out]">
              <span className="material-symbols-outlined text-base">
                compare_arrows
              </span>
              <span>Comparando con LLM</span>
            </div>
          )}
        </div>

        {/* Barra de progreso - basada ÚNICAMENTE en el porcentaje mostrado */}
        {!hasError && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-300">Progreso</span>
              <span className="text-sm font-semibold text-white">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-3 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-300 ease-out"
                style={{ 
                  width: `${Math.min(100, Math.max(0, progress))}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Indicador de etapas */}
        {!isComplete && !hasError && (
          <div className="text-center">
            <p className="text-xs text-slate-400">
              Por favor, espera mientras se completa la comparación...
            </p>
          </div>
        )}
        
        {/* Botón para cerrar en caso de error */}
        {hasError && (
          <div className="text-center mt-4">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-colors text-sm font-semibold"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

