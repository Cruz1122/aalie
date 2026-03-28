"use client";

/**
 * Componente selector de métodos de análisis para algoritmos recursivos.
 * Permite al usuario elegir entre diferentes métodos aplicables para resolver recurrencias.
 *
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
import { useTranslations } from "next-intl";
import React, { useEffect, useMemo } from "react";

/**
 * Tipos de métodos de análisis disponibles.
 */
export type MethodType =
  | "characteristic_equation"
  | "iteration"
  | "recursion_tree"
  | "master";

export type MethodPrecision = "high" | "medium" | "low";

export interface MethodMetadata {
  applicable: boolean;
  recommended: boolean;
  precision: MethodPrecision;
  reason: string;
}

export type MethodMetadataMap = Record<MethodType, MethodMetadata>;

const ALL_METHODS: MethodType[] = [
  "characteristic_equation",
  "iteration",
  "recursion_tree",
  "master",
];

interface MethodInfo {
  id: MethodType;
  icon: string;
  color: string;
  borderColor: string;
  bgColor: string;
}

const methods: Record<MethodType, MethodInfo> = {
  characteristic_equation: {
    id: "characteristic_equation",
    icon: "calculate",
    color: "text-blue-300",
    borderColor: "border-blue-500/30",
    bgColor: "bg-blue-500/20",
  },
  iteration: {
    id: "iteration",
    icon: "unfold_more",
    color: "text-purple-300",
    borderColor: "border-purple-500/30",
    bgColor: "bg-purple-500/20",
  },
  recursion_tree: {
    id: "recursion_tree",
    icon: "account_tree",
    color: "text-cyan-300",
    borderColor: "border-cyan-500/30",
    bgColor: "bg-cyan-500/20",
  },
  master: {
    id: "master",
    icon: "science",
    color: "text-orange-300",
    borderColor: "border-orange-500/30",
    bgColor: "bg-orange-500/20",
  },
};

/**
 * Propiedades del componente MethodSelector.
 */
interface MethodSelectorProps {
  /** Lista de métodos aplicables para el algoritmo */
  applicableMethods: MethodType[];
  /** Método seleccionado por defecto */
  defaultMethod: MethodType;
  /** Metadatos por método para renderizado completo de la cuadrícula */
  methodMetadata?: MethodMetadataMap | null;
  /** Callback cuando se confirma la selección */
  onSelect: (method: MethodType) => void;
  /** Callback opcional para cancelar la selección */
  onCancel?: () => void;
  /** Render embebido dentro del loader (sin overlay exterior propio). */
  embeddedInLoader?: boolean;
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
  methodMetadata,
  onSelect,
  onCancel,
  embeddedInLoader = false,
}: MethodSelectorProps) {
  const t = useTranslations("analyzer.methodSelector");
  const [selectedMethod, setSelectedMethod] =
    React.useState<MethodType>(defaultMethod);

  const normalizedMetadata = useMemo<MethodMetadataMap>(() => {
    return ALL_METHODS.reduce((acc, methodId) => {
      const fallbackReason = t("reasons.fallback");
      const fallbackItem: MethodMetadata = {
        applicable: applicableMethods.includes(methodId),
        recommended: methodId === defaultMethod,
        precision: methodId === defaultMethod ? "high" : "medium",
        reason: fallbackReason,
      };
      acc[methodId] = methodMetadata?.[methodId] ?? fallbackItem;
      return acc;
    }, {} as MethodMetadataMap);
  }, [applicableMethods, defaultMethod, methodMetadata, t]);

  useEffect(() => {
    if (normalizedMetadata[selectedMethod]?.applicable) return;
    const firstApplicable = ALL_METHODS.find(
      (methodId) => normalizedMetadata[methodId]?.applicable,
    );
    if (firstApplicable) {
      setSelectedMethod(firstApplicable);
    }
  }, [normalizedMetadata, selectedMethod]);

  const handleConfirm = () => {
    onSelect(selectedMethod);
  };

  const selectedMethodData =
    normalizedMetadata[selectedMethod] ??
    ({
      applicable: false,
      recommended: false,
      precision: "low",
      reason: t("reasons.fallback"),
    } as MethodMetadata);
  const isSelectionApplicable = selectedMethodData?.applicable ?? false;

  const precisionTextColor = (precision: MethodPrecision) => {
    if (precision === "high") return "text-blue-300";
    if (precision === "medium") return "text-slate-300";
    return "text-slate-400";
  };
  const rootClass = embeddedInLoader
    ? "absolute inset-0 z-20 flex items-center justify-center transition-opacity duration-300 opacity-100"
    : "fixed inset-0 z-[70] flex items-center justify-center transition-opacity duration-300 opacity-100";

  return (
    <div className={rootClass} style={{ pointerEvents: "none" }}>
      {/* Contenedor del selector con z-index más alto */}
      <div
        className="relative z-10 glass-modal-container rounded-2xl px-8 py-10 w-[600px] h-[400px] mx-4 shadow-2xl flex flex-col justify-start"
        style={{
          pointerEvents: "auto",
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
        }}
      >
        <div className="flex-1 flex flex-col justify-center">
          <div className="mb-5">
            <p className="text-[11px] text-slate-400/70 tracking-wide uppercase text-center">
              {t("title")}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white text-center">
              {t(`methods.${selectedMethod}.name`)}
            </h2>
            <p className="mt-2 text-xs text-slate-300 text-center">
              {t(`methods.${selectedMethod}.description`)}
            </p>
            <p
              className={`mt-1 text-xs text-center ${precisionTextColor(selectedMethodData.precision)}`}
            >
              {t(`precisionExplanation.${selectedMethodData.precision}`)}
            </p>
          </div>

          {/* Cuadrícula fija de métodos */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {ALL_METHODS.map((methodId) => {
              const method = methods[methodId];
              const metadata = normalizedMetadata[methodId];
              const isSelected = selectedMethod === methodId;
              const isApplicable = metadata.applicable;

              return (
                <button
                  key={methodId}
                  onClick={() => {
                    if (isApplicable) {
                      setSelectedMethod(methodId);
                    }
                  }}
                  className={`relative w-full p-2 rounded-lg border-2 transition-all text-left h-full ${
                    isSelected
                      ? `${method.borderColor} ${method.bgColor} border-2`
                      : isApplicable
                        ? "border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50"
                        : "border-slate-700/60 bg-slate-900/40"
                  } hover:z-40 focus-within:z-40`}
                  aria-disabled={!isApplicable}
                  aria-label={t(`methods.${methodId}.name`)}
                >
                  <div className="flex flex-col items-center justify-center h-full min-h-[64px] gap-1">
                    {/* Icono */}
                    <div
                      className={`relative z-20 flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                        isSelected
                          ? `${method.bgColor} border ${method.borderColor}`
                          : isApplicable
                            ? "bg-slate-700/50 border border-slate-600/50"
                            : "bg-slate-700/30 border border-slate-700/50"
                      }`}
                    >
                      {metadata.recommended && (
                        <div className="absolute -left-2 -top-2 group/star">
                          <div className="relative h-5 w-5">
                            <div className="absolute inset-0 rounded-full bg-[#182431]" />
                            <div className="absolute inset-0 rounded-full border border-white/50 bg-white/15 flex items-center justify-center">
                              <span className="text-[10px] leading-none text-white">
                                ★
                              </span>
                            </div>
                          </div>
                          <div className="absolute left-0 top-6 z-[9999] w-44 rounded-lg border border-white bg-slate-950 p-2 text-xs text-slate-100 shadow-xl opacity-0 invisible transition-opacity pointer-events-none group-hover/star:opacity-100 group-hover/star:visible">
                            {t("recommendedTooltip")}
                          </div>
                        </div>
                      )}
                      {isApplicable && !metadata.recommended && (
                        <div className="absolute -right-2 -top-2 group/warn">
                          <div className="relative h-5 w-5">
                            <div className="absolute inset-0 rounded-full bg-[#182431]" />
                            <div className="absolute inset-0 rounded-full border border-amber-500/40 bg-amber-500/20 text-white text-[10px] font-bold flex items-center justify-center">
                              !
                            </div>
                          </div>
                          <div className="absolute right-0 top-6 z-[9999] w-56 rounded-lg border border-amber-500/30 bg-slate-950 p-2 text-xs text-amber-100 shadow-xl opacity-0 invisible transition-opacity pointer-events-none group-hover/warn:opacity-100 group-hover/warn:visible">
                            {metadata.reason}
                          </div>
                        </div>
                      )}
                      <span
                        className={`material-symbols-outlined ${isSelected ? method.color : isApplicable ? "text-slate-400" : "text-slate-500"}`}
                      >
                        {method.icon}
                      </span>
                      {!isApplicable && (
                        <div className="absolute -right-2 -top-2 group/help">
                          <div className="relative h-5 w-5">
                            <div className="absolute inset-0 rounded-full bg-[#182431]" />
                            <div className="absolute inset-0 rounded-full border border-amber-500/40 bg-amber-500/20 text-white text-xs font-bold flex items-center justify-center">
                              ?
                            </div>
                          </div>
                          <div className="absolute right-0 top-6 z-[9999] w-56 rounded-lg border border-amber-500/30 bg-slate-950 p-2 text-xs text-amber-100 shadow-xl opacity-0 invisible transition-opacity pointer-events-none group-hover/help:opacity-100 group-hover/help:visible">
                            {metadata.reason}
                          </div>
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-[11px] leading-tight text-center ${
                        isSelected
                          ? method.color
                          : isApplicable
                            ? "text-slate-300/90"
                            : "text-slate-500/90"
                      }`}
                    >
                      {t(`methods.${methodId}.name`)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="absolute z-10 left-8 right-8 bottom-10 flex gap-3 justify-end">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700/70 transition-colors text-sm font-semibold"
            >
              {t("cancel")}
            </button>
          )}
          <button
            onClick={handleConfirm}
            disabled={!isSelectionApplicable}
            className="px-6 py-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-colors text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500/20"
          >
            <span className="material-symbols-outlined text-base">check</span>
            {t("confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
