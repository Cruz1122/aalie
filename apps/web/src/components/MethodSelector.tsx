"use client";

/**
 * Componente selector de métodos de análisis para algoritmos recursivos.
 * Permite al usuario elegir entre diferentes métodos aplicables para resolver recurrencias.
 * 
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
import React from "react";

/**
 * Tipos de métodos de análisis disponibles.
 */
export type MethodType = "characteristic_equation" | "iteration" | "recursion_tree" | "master";

interface MethodInfo {
  id: MethodType;
  name: string;
  description: string;
  icon: string;
  color: string;
  borderColor: string;
  bgColor: string;
}

const methods: Record<MethodType, MethodInfo> = {
  characteristic_equation: {
    id: "characteristic_equation",
    name: "Ecuación Característica",
    description: "Para recurrencias lineales con desplazamientos constantes. Detecta automáticamente DP lineal.",
    icon: "calculate",
    color: "text-blue-300",
    borderColor: "border-blue-500/30",
    bgColor: "bg-blue-500/20"
  },
  iteration: {
    id: "iteration",
    name: "Método de Iteración",
    description: "Para recurrencias decrease-and-conquer (n-1, n-k) desplegando la recurrencia.",
    icon: "unfold_more",
    color: "text-purple-300",
    borderColor: "border-purple-500/30",
    bgColor: "bg-purple-500/20"
  },
  recursion_tree: {
    id: "recursion_tree",
    name: "Árbol de Recursión",
    description: "Visualiza el árbol de llamadas recursivas para divide-and-conquer con múltiples subproblemas.",
    icon: "account_tree",
    color: "text-cyan-300",
    borderColor: "border-cyan-500/30",
    bgColor: "bg-cyan-500/20"
  },
  master: {
    id: "master",
    name: "Teorema Maestro",
    description: "Para recurrencias divide-and-conquer estándar T(n) = a·T(n/b) + f(n).",
    icon: "science",
    color: "text-orange-300",
    borderColor: "border-orange-500/30",
    bgColor: "bg-orange-500/20"
  }
};

/**
 * Propiedades del componente MethodSelector.
 */
interface MethodSelectorProps {
  /** Lista de métodos aplicables para el algoritmo */
  applicableMethods: MethodType[];
  /** Método seleccionado por defecto */
  defaultMethod: MethodType;
  /** Callback cuando se confirma la selección */
  onSelect: (method: MethodType) => void;
  /** Callback opcional para cancelar la selección */
  onCancel?: () => void;
}

/**
 * Componente selector de métodos de análisis.
 * Muestra una lista de métodos aplicables y permite al usuario seleccionar uno.
 * 
 * @param props - Propiedades del componente
 * @returns Modal con selector de métodos
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 * 
 * @example
 * ```tsx
 * <MethodSelector
 *   applicableMethods={["master", "iteration", "recursion_tree"]}
 *   defaultMethod="master"
 *   onSelect={(method) => handleMethodSelect(method)}
 *   onCancel={() => setShowSelector(false)}
 * />
 * ```
 */
export default function MethodSelector({
  applicableMethods,
  defaultMethod,
  onSelect,
  onCancel
}: MethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = React.useState<MethodType>(defaultMethod);

  const handleConfirm = () => {
    onSelect(selectedMethod);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center" style={{ pointerEvents: 'auto' }}>
      {/* Overlay con z-index más alto que el loader */}
      <div className="absolute inset-0 glass-modal-overlay" onClick={onCancel} style={{ pointerEvents: 'auto' }} />

      {/* Contenedor del selector con z-index más alto */}
      <div className="relative z-10 glass-modal-container rounded-2xl p-6 w-[700px] max-w-[90vw] max-h-[90vh] overflow-y-auto mx-4 shadow-2xl" style={{ pointerEvents: 'auto' }}>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-blue-400">
              settings
            </span>
            Seleccionar Método de Análisis
          </h2>
          <p className="text-sm text-slate-400">
            Este algoritmo puede resolverse con múltiples métodos. Selecciona el método que deseas usar:
          </p>
        </div>

        {/* Lista de métodos */}
        <div className="space-y-3 mb-6">
          {applicableMethods.map((methodId) => {
            const method = methods[methodId];
            const isSelected = selectedMethod === methodId;
            const isDefault = defaultMethod === methodId;

            return (
              <button
                key={methodId}
                onClick={() => setSelectedMethod(methodId)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? `${method.borderColor} ${method.bgColor} border-2`
                    : "border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Radio button visual */}
                  <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? `${method.borderColor} ${method.bgColor}`
                      : "border-slate-600"
                  }`}>
                    {isSelected && (
                      <div className={`w-3 h-3 rounded-full ${method.color.replace('text-', 'bg-')}`} />
                    )}
                  </div>

                  {/* Icono */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                    isSelected ? method.bgColor : "bg-slate-700/50"
                  }`}>
                    <span className={`material-symbols-outlined ${isSelected ? method.color : "text-slate-400"}`}>
                      {method.icon}
                    </span>
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${isSelected ? method.color : "text-white"}`}>
                        {method.name}
                      </h3>
                      {isDefault && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-slate-700/50 text-slate-300 border border-slate-600">
                          Por defecto
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                      {method.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 justify-end">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700/70 transition-colors text-sm font-semibold"
            >
              Cancelar
            </button>
          )}
          <button
            onClick={handleConfirm}
            className="px-6 py-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-colors text-sm font-semibold flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">
              check
            </span>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

