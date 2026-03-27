"use client";

import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

export type ProgressLoaderMode =
  | "analysis"
  | "comparison"
  | "export"
  | "repair";
export type AlgorithmType = "iterative" | "recursive" | "hybrid" | "unknown";
export type BlurScope = "full" | "container";

/**
 * Propiedades del componente AAProgressLoader.
 */
interface AAProgressLoaderProps {
  /** Modo: análisis de complejidad o comparación con LLM */
  mode: ProgressLoaderMode;
  /** Progreso (0-100) */
  progress: number;
  /** Mensaje a mostrar */
  message: string;
  /** Tipo de algoritmo (solo para mode="analysis") */
  algorithmType?: AlgorithmType;
  /** Indica si está completo */
  isComplete?: boolean;
  /** Mensaje de error */
  error?: string | null;
  /** Callback para cerrar */
  onClose?: () => void;
  /** Renderiza un botón "X" para cerrar (útil en overlays tipo modal). */
  showCloseButton?: boolean;
  /** Alcance del blur: full (todo el fondo) o container (solo el contenedor) */
  blurScope?: BlurScope;
  /** Contenido opcional a renderizar encima del loader (ej. selector de método). */
  overlayContent?: React.ReactNode;
  /** Habilita interacciones aunque el loader siga en progreso. */
  allowPointerEvents?: boolean;
  /** Formatos de exportación seleccionados (solo de uso cuando mode="export") */
  exportFormats?: string[];
}

/**
 * Obtiene las clases CSS para el badge de un tipo de algoritmo.
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
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

const COMPLETE_DISPLAY_MS = 1800;

/**
 * Loader unificado para análisis de complejidad y comparación con LLM.
 * Barra de progreso fija abajo, espacio reservado para badge, timer post-completado.
 *
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 * Version: 0.1.0
 */
export const AAProgressLoader: React.FC<AAProgressLoaderProps> = ({
  mode,
  progress,
  message,
  algorithmType,
  isComplete = false,
  error = null,
  onClose,
  blurScope = "full",
  overlayContent,
  allowPointerEvents = false,
  exportFormats,
  showCloseButton = false,
}) => {
  const t = useTranslations("analyzer");
  const tLoader = useTranslations("analyzer.loader");
  const tComparison = useTranslations("analyzer.comparisonLoader");
  const tRepair = useTranslations("analyzer.repairModal");
  const tCommon = useTranslations("common");
  const hasError = !!error;
  const [isClosing, setIsClosing] = useState(false);

  const getAlgorithmTypeLabel = (type?: string): string => {
    if (!type) return "";
    return t(`algorithmType.${type}`);
  };

  const progressLabel =
    mode === "analysis"
      ? tLoader("progress")
      : mode === "comparison"
        ? tComparison("progress")
        : mode === "repair"
          ? tLoader("progress")
          : t("exportSelector.progress");
  const errorTitle =
    mode === "analysis"
      ? tLoader("errorTitle")
      : mode === "comparison"
        ? tComparison("errorTitle")
        : "Error";
  const closeLabel =
    mode === "analysis"
      ? tCommon("close")
      : mode === "comparison"
        ? tComparison("close")
        : tCommon("close");

  const tooltipText =
    !isComplete && !hasError
      ? mode === "analysis" &&
        (algorithmType === "recursive" || algorithmType === "hybrid")
        ? tLoader("analyzingRecurrence")
        : mode === "analysis"
          ? tLoader("pleaseWait")
          : mode === "comparison"
            ? tComparison("pleaseWait")
            : mode === "repair"
              ? tRepair("mayTakeSeconds")
              : t("exportSelector.pleaseWait")
      : "";

  const isExportGroup =
    mode === "export" && exportFormats && exportFormats.length > 1;
  const isExportPdf =
    mode === "export" &&
    exportFormats?.includes("pdf") &&
    (!exportFormats || exportFormats.length === 1);
  const isExportMarkdown =
    mode === "export" &&
    exportFormats?.includes("markdown") &&
    (!exportFormats || exportFormats.length === 1);

  const barGradient =
    mode === "comparison"
      ? "from-purple-500 to-purple-400"
      : mode === "repair"
        ? "from-purple-500 to-purple-400"
        : isExportMarkdown
          ? "from-blue-500 to-blue-400"
          : isExportPdf
            ? "from-red-500 to-red-400"
            : isExportGroup
              ? "from-slate-300 to-slate-100"
              : "from-blue-500 to-blue-400";

  const iconColor =
    mode === "comparison"
      ? "bg-purple-500/20 border-purple-500/30 text-purple-400"
      : mode === "repair"
        ? "bg-purple-500/20 border-purple-500/30 text-purple-400"
        : isExportMarkdown
          ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
          : isExportPdf
            ? "bg-red-500/20 border-red-500/30 text-red-400"
            : isExportGroup
              ? "bg-slate-500/20 border-slate-500/30 text-slate-300"
              : "bg-blue-500/20 border-blue-500/30 text-blue-400";

  // Timer post-completado: 1.5-2s mostrando mensaje final antes de cerrar
  useEffect(() => {
    if (isComplete && !hasError) {
      const timer = setTimeout(() => {
        setIsClosing(true);
      }, COMPLETE_DISPLAY_MS);
      return () => clearTimeout(timer);
    }
  }, [isComplete, hasError]);

  // Llamar onClose cuando el fade-out termine (para que el contexto resetee)
  useEffect(() => {
    if (isClosing && onClose) {
      const timer = setTimeout(onClose, 350);
      return () => clearTimeout(timer);
    }
  }, [isClosing, onClose]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      globalThis.window.location.reload();
    }
  };

  const overlayClass = overlayContent
    ? "absolute inset-0 glass-modal-overlay transition-opacity duration-300"
    : blurScope === "container"
      ? "absolute inset-0 glass-modal-overlay-container-only transition-opacity duration-300"
      : "absolute inset-0 glass-modal-overlay transition-opacity duration-300";
  const isOverlayMode = Boolean(overlayContent);

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center transition-opacity duration-300 ${isClosing ? "opacity-0" : "opacity-100"}`}
      style={{
        pointerEvents:
          isComplete || hasError || allowPointerEvents || showCloseButton
            ? "auto"
            : "none",
      }}
    >
      <div
        className={`${overlayClass} ${isClosing ? "opacity-0" : "opacity-100"}`}
        style={{ pointerEvents: "none" }}
      />

      {/* Modal único: icono, mensaje, badge y barra. Contenido arriba; barra más alta al inicio, fixed abajo al clasificar. */}
      {!isOverlayMode && (
        <div
          className={`relative z-10 glass-modal-container rounded-2xl px-8 py-10 w-[600px] h-[400px] mx-4 shadow-2xl flex flex-col justify-start transition-opacity duration-300 ${mode === "comparison" ? "shadow-[0_0_60px_-15px_rgba(168,85,247,0.4)]" : ""} ${isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
        >
          {showCloseButton && onClose && (
            <button
              type="button"
              onClick={handleClose}
              aria-label={closeLabel}
              className="absolute right-4 top-4 text-slate-400 hover:text-white text-3xl leading-none transition-colors hover:rotate-90 transform duration-200"
            >
              ×
            </button>
          )}
          {/* Contenido: icono, mensaje, badge */}
          <div className="flex flex-col items-center shrink-0 pt-8">
            {/* Icono de estado */}
            <div className="flex justify-center mb-6 shrink-0">
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
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${iconColor}`}
                >
                  <span
                    className={`material-symbols-outlined text-4xl animate-spin ${
                      mode === "comparison"
                        ? "text-purple-400"
                        : mode === "repair"
                          ? "text-purple-400"
                          : isExportMarkdown
                            ? "text-blue-400"
                            : isExportPdf
                              ? "text-red-400"
                              : isExportGroup
                                ? "text-slate-300"
                                : "text-blue-400"
                    }`}
                  >
                    progress_activity
                  </span>
                </div>
              )}
            </div>

            {/* Mensaje principal */}
            <div className="text-center mb-6">
              <h3
                className={`text-xl font-semibold mb-2 ${hasError ? "text-red-300" : "text-white"}`}
              >
                {hasError ? errorTitle : message}
              </h3>

              {hasError && (
                <>
                  <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-sm text-red-300 whitespace-pre-wrap">
                      {error}
                    </p>
                  </div>
                  <div className="text-center mt-4">
                    <button
                      onClick={handleClose}
                      className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-colors text-sm font-semibold"
                    >
                      {closeLabel}
                    </button>
                  </div>
                </>
              )}

              {/* Badge: espacio reservado solo cuando no hay error para no empujar el botón abajo */}
              {!hasError && (
                <div className="min-h-[40px] flex items-center justify-center mt-6">
                  {mode === "analysis" && algorithmType && (
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${getAlgorithmTypeColor(algorithmType)} animate-[pop_0.5s_ease-out]`}
                    >
                      <span className="material-symbols-outlined text-base">
                        category
                      </span>
                      <span>
                        {tLoader("algorithmLabel")}:{" "}
                        {getAlgorithmTypeLabel(algorithmType)}
                      </span>
                    </div>
                  )}
                  {mode === "repair" && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium bg-purple-500/20 text-purple-400 border-purple-500/30 animate-[pop_0.5s_ease-out]">
                      <span className="material-symbols-outlined text-base">
                        auto_awesome
                      </span>
                      <span>{tRepair("repairing")}</span>
                    </div>
                  )}
                  {mode === "comparison" && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium bg-purple-500/20 text-purple-400 border-purple-500/30 animate-[pop_0.5s_ease-out]">
                      <span className="material-symbols-outlined text-base">
                        compare_arrows
                      </span>
                      <span>{tComparison("comparingWithLlm")}</span>
                    </div>
                  )}
                  {isExportMarkdown && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium bg-blue-500/20 text-blue-400 border-blue-500/30 animate-[pop_0.5s_ease-out]">
                      <span className="material-symbols-outlined text-base">
                        markdown
                      </span>
                      <span>Markdown (MD)</span>
                    </div>
                  )}
                  {isExportPdf && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium bg-red-500/20 text-red-400 border-red-500/30 animate-[pop_0.5s_ease-out]">
                      <span className="material-symbols-outlined text-base">
                        picture_as_pdf
                      </span>
                      <span>{t("exportSelector.formats.pdf")}</span>
                    </div>
                  )}
                  {isExportGroup && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium bg-slate-500/20 text-slate-300 border-slate-500/30 animate-[pop_0.5s_ease-out]">
                      <span className="material-symbols-outlined text-base">
                        folder_zip
                      </span>
                      <span>Markdown & PDF (ZIP)</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Barra de progreso: absoluta; más alta al inicio (!algorithmType), fixed abajo al clasificar */}
          {!hasError && (
            <div
              className={`absolute left-8 right-8 transition-[bottom] duration-300 ${
                algorithmType ||
                mode === "comparison" ||
                mode === "export" ||
                mode === "repair"
                  ? "bottom-10"
                  : "bottom-24"
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-300">{progressLabel}</span>
                <span className="text-sm font-semibold text-white">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="w-full h-3 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  className={`h-full w-full bg-gradient-to-r ${barGradient} rounded-full origin-left`}
                  style={{
                    transform: `scaleX(${Math.min(1, Math.max(0, progress / 100))})`,
                    transition: "transform 150ms ease-out",
                  }}
                />
              </div>
              <p
                className="text-xs text-slate-400 mt-2 text-center min-h-[1.25rem]"
                title={tooltipText}
              >
                {tooltipText}
              </p>
            </div>
          )}
        </div>
      )}
      {overlayContent}
    </div>
  );
};
