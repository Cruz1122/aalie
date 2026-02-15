"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";

import type { GPUCPUAnalysisResult, GPUCPUMetrics } from "@/types/gpu-cpu";

interface GPUCPUModalProps {
  open: boolean;
  onClose: () => void;
  analysis: GPUCPUAnalysisResult | null;
}

/**
 * Obtiene el color y estilo de la card basado en el score
 */
function getCardStyle(score: number): {
  bgColor: string;
  borderColor: string;
  iconColor: string;
  arrowIcon: string;
  arrowColor: string;
  shadowColor: string;
} {
  if (score > 60) {
    return {
      bgColor: "bg-green-500/20",
      borderColor: "border-green-500/40",
      iconColor: "text-white",
      arrowIcon: "trending_up",
      arrowColor: "text-green-400",
      shadowColor: "shadow-[0_8px_32px_0_rgba(34,197,94,0.3)] hover:shadow-[0_12px_40px_0_rgba(34,197,94,0.4)]",
    };
  } else if (score >= 40) {
    return {
      bgColor: "bg-yellow-500/20",
      borderColor: "border-yellow-500/40",
      iconColor: "text-white",
      arrowIcon: "trending_flat",
      arrowColor: "text-yellow-400",
      shadowColor: "shadow-[0_8px_32px_0_rgba(234,179,8,0.3)] hover:shadow-[0_12px_40px_0_rgba(234,179,8,0.4)]",
    };
  } else {
    return {
      bgColor: "bg-red-500/20",
      borderColor: "border-red-500/40",
      iconColor: "text-white",
      arrowIcon: "trending_down",
      arrowColor: "text-red-400",
      shadowColor: "shadow-[0_8px_32px_0_rgba(239,68,68,0.3)] hover:shadow-[0_12px_40px_0_rgba(239,68,68,0.4)]",
    };
  }
}

/**
 * Genera las claves de razones por las que GPU es mejor o peor (para traducción)
 */
function getGPUReasons(score: number, metrics: GPUCPUMetrics): string[] {
  const reasons: string[] = [];
  const br = metrics.totalLoops > 0 ? metrics.conditionalsInLoops / metrics.totalLoops : 0;

  if (score > 60) {
    if (metrics.totalLoops > 0) {
      if (br < 0.2) reasons.push("regular_loops_very");
      else if (br < 0.3) reasons.push("regular_loops_little");
    }
    if (metrics.arrayAccessCount > metrics.totalLoops * 2 && metrics.totalLoops > 0) {
      reasons.push("array_block");
    } else if (metrics.arrayAccessCount > 0) {
      reasons.push("array_frequent");
    }
    if (metrics.maxLoopDepth >= 2 && br < 0.4) reasons.push("nested_simple");
    if (!metrics.isRecursive) reasons.push("no_recursion");
    if (metrics.totalLoops > 0 && metrics.conditionalsInLoops === 0) reasons.push("no_conditionals");
    if (metrics.totalLoops > 3 && br < 0.3) reasons.push("multiple_loops");
  } else if (score < 40) {
    if (metrics.isRecursive) {
      reasons.push(metrics.recursiveCallCount > 1 ? "complex_recursion" : "recursion");
    }
    if (metrics.totalLoops > 0) {
      if (br > 0.7) reasons.push("high_branching");
      else if (br > 0.5) reasons.push("moderate_branching");
    }
    if (metrics.callsInsideLoops > metrics.totalLoops * 2) reasons.push("calls_in_loops");
    if (metrics.totalLoops === 0 && metrics.isRecursive) reasons.push("no_loops_recursive");
  } else {
    reasons.push("mixed");
    if (metrics.totalLoops > 0 && br > 0.3 && br < 0.5) reasons.push("mixed_moderate");
    if (metrics.isRecursive && metrics.recursiveCallCount === 1) reasons.push("mixed_limited_recursion");
    if (metrics.arrayAccessCount > 0 && metrics.arrayAccessCount < metrics.totalLoops * 2) {
      reasons.push("mixed_array");
    }
  }
  return reasons.length > 0 ? reasons : ["fallback"];
}

/**
 * Genera las claves de razones por las que CPU es mejor o peor (para traducción)
 */
function getCPUReasons(score: number, metrics: GPUCPUMetrics): string[] {
  const reasons: string[] = [];
  const br = metrics.totalLoops > 0 ? metrics.conditionalsInLoops / metrics.totalLoops : 0;

  if (score > 60) {
    if (metrics.isRecursive) {
      reasons.push(metrics.recursiveCallCount > 2 ? "deep_recursion" : "recursion");
    }
    if (metrics.totalLoops > 0) {
      if (br > 0.7) reasons.push("high_branching");
      else if (br > 0.5) reasons.push("moderate_branching");
    }
    if (metrics.recursiveCallCount > 1) reasons.push("complex_recursion");
    if (metrics.callsInsideLoops > metrics.totalLoops * 2) reasons.push("calls_in_loops");
    if (metrics.totalLoops > 0 && metrics.conditionalsInLoops > metrics.totalLoops) {
      reasons.push("complex_decisions");
    }
    if (metrics.isRecursive && metrics.totalLoops === 0) reasons.push("pure_recursion");
  } else if (score < 40) {
    if (metrics.totalLoops > 0 && br < 0.2) reasons.push("regular_loops");
    if (metrics.arrayAccessCount > metrics.totalLoops * 2 && metrics.totalLoops > 0) {
      reasons.push("array_block");
    }
    if (!metrics.isRecursive && metrics.totalLoops > 3 && br < 0.3) reasons.push("iterative_simple");
    if (metrics.maxLoopDepth >= 2 && br < 0.3) reasons.push("nested_simple");
    if (metrics.totalLoops > 0 && metrics.conditionalsInLoops === 0) reasons.push("no_conditionals");
  } else {
    reasons.push("mixed");
    if (metrics.totalLoops > 0 && br > 0.3 && br < 0.5) reasons.push("mixed_moderate");
    if (metrics.isRecursive && metrics.recursiveCallCount === 1) reasons.push("mixed_limited_recursion");
    if (metrics.arrayAccessCount > 0 && metrics.arrayAccessCount < metrics.totalLoops * 2) {
      reasons.push("mixed_array");
    }
    if (metrics.totalLoops > 0 && metrics.callsInsideLoops > 0 && metrics.callsInsideLoops <= metrics.totalLoops) {
      reasons.push("mixed_calls");
    }
  }
  return reasons.length > 0 ? reasons : ["fallback"];
}

/**
 * Componente de card para GPU o CPU con flip
 */
function GPUCard({
  score,
  label,
  animate,
  metrics,
  isFlipped,
  onFlip,
  t,
}: Readonly<{ 
  score: number; 
  label: "GPU" | "CPU"; 
  animate?: boolean;
  metrics: GPUCPUMetrics;
  isFlipped: boolean;
  onFlip: () => void;
  t: (key: string) => string;
}>) {
  const style = getCardStyle(score);
  const icon = label === "GPU" ? "memory" : "developer_board";
  const reasonKeys = label === "GPU" ? getGPUReasons(score, metrics) : getCPUReasons(score, metrics);
  const reasonsPrefix = label === "GPU" ? "gpuReasons" : "cpuReasons";
  
  // Color invertido para el reverso (más oscuro pero manteniendo el tono)
  let flippedBgColor: string;
  if (score > 60) {
    flippedBgColor = "bg-green-600/30";
  } else if (score >= 40) {
    flippedBgColor = "bg-yellow-600/30";
  } else {
    flippedBgColor = "bg-red-600/30";
  }

  return (
    <div
      className="relative h-full min-h-[200px] cursor-pointer"
      onClick={onFlip}
      style={{ perspective: "1000px" }}
    >
      <div
        className="relative w-full h-full transition-transform duration-700"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Frente de la card */}
        <div
          className={`rounded-lg border ${style.bgColor} ${style.borderColor} ${style.shadowColor} absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ${
            animate ? "animate-pulse-scale" : ""
          }`}
          style={{
            animation: animate ? "pulseScale 0.6s ease-out" : undefined,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(0deg)",
          }}
        >
          {/* Label arriba del icono */}
          <h3 className="text-lg font-semibold mb-2 text-white/90">
            {label}
          </h3>

          {/* Icono principal con flecha en esquina - proporcional a la card */}
          <div className="relative flex items-center justify-center">
            <span
              className={`material-symbols-outlined ${style.iconColor}`}
              style={{ 
                fontSize: 'clamp(9rem, 12vw, 18rem)', 
                lineHeight: '1',
                display: 'block'
              }}
            >
              {icon}
            </span>
            {/* Flecha zig-zag en esquina inferior derecha del icono */}
            <div className="absolute bottom-0 right-0">
              <span
                className={`material-symbols-outlined text-sm ${style.arrowColor} bg-slate-900/80 rounded-full p-0.5`}
              >
                {style.arrowIcon}
              </span>
            </div>
          </div>
        </div>

        {/* Reverso de la card */}
        <div
          className={`rounded-lg border ${flippedBgColor} ${style.borderColor} ${style.shadowColor} absolute inset-0 flex flex-col items-center justify-center p-4`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <h3 className="text-base font-semibold mb-2 text-white/90">
            {label} — {t("reasonsLabel")}
          </h3>
          <div className="space-y-1 text-xs text-white/80 text-center">
            {reasonKeys.map((key, idx) => (
              <div key={idx}>{t(`${reasonsPrefix}.${key}`)}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Componente principal que muestra cards o sección expandida
 */
function GPUCPUContent({
  analysis,
  gpuScore,
  cpuScore,
  t,
}: Readonly<{
  analysis: GPUCPUAnalysisResult;
  gpuScore: number;
  cpuScore: number;
  t: (key: string) => string;
}>) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const [gpuFlipped, setGpuFlipped] = useState(false);
  const [cpuFlipped, setCpuFlipped] = useState(false);

  // Activar animación cuando se abre el modal o cuando se colapsa
  useEffect(() => {
    if (!isExpanded) {
      setShouldAnimate(true);
      const timer = setTimeout(() => setShouldAnimate(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  return (
    <>
      {/* Cards - se ocultan cuando está expandido */}
      {!isExpanded && (
        <div className="flex-1 grid grid-cols-2 gap-4 mb-4 min-h-0">
          {/* Card GPU */}
          <GPUCard 
            score={gpuScore} 
            label="GPU" 
            animate={shouldAnimate}
            metrics={analysis.metrics}
            isFlipped={gpuFlipped}
            onFlip={() => setGpuFlipped(!gpuFlipped)}
            t={t}
          />

          {/* Card CPU */}
          <GPUCard 
            score={cpuScore} 
            label="CPU" 
            animate={shouldAnimate}
            metrics={analysis.metrics}
            isFlipped={cpuFlipped}
            onFlip={() => setCpuFlipped(!cpuFlipped)}
            t={t}
          />
        </div>
      )}

      {/* Perfil - solo icono y conclusión */}
      {!isExpanded && (
        <div className="mb-4 flex-shrink-0">
          <div className="glass-card p-3 rounded-lg border border-blue-500/30 bg-blue-500/10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-400 text-lg">
                info
              </span>
              <div className="text-sm text-slate-300">{analysis.summary}</div>
            </div>
          </div>
        </div>
      )}

      {/* Sección expandible hacia arriba con análisis y recomendación */}
      <div className="mb-4 flex-shrink-0">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full glass-card p-3 rounded-lg border border-slate-500/30 bg-slate-500/5 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-lg">
              description
            </span>
            <div className="text-sm font-semibold text-slate-300">
              {isExpanded ? t("hideDetails") : t("showDetails")}
            </div>
          </div>
          <span
            className={`material-symbols-outlined text-lg text-slate-400 transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
          >
            expand_less
          </span>
        </button>
        {isExpanded && (
          <div className="glass-card p-4 rounded-lg border border-slate-500/30 bg-slate-500/5 mt-2 space-y-4">
            {/* Análisis de la estructura */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-slate-400 text-lg">
                  description
                </span>
                <div className="text-sm font-semibold text-slate-300">
                  {t("structureAnalysis")}
                </div>
              </div>
              <div className="text-sm text-slate-300 pl-7 whitespace-pre-line">
                {analysis.explanation}
              </div>
            </div>

            {/* Recomendación */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-purple-400 text-lg">
                  lightbulb
                </span>
                <div className="text-sm font-semibold text-purple-300">
                  {t("recommendation")}
                </div>
              </div>
              <div className="text-sm text-purple-200 pl-7">
                {analysis.recommendation}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Modal para mostrar el análisis GPU vs CPU
 */
export default function GPUCPUModal({
  open,
  onClose,
  analysis,
}: Readonly<GPUCPUModalProps>) {
  const t = useTranslations("analyzer.gpuCpuModal");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", onKey);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !analysis) return null;

  return (
    <>
      <style>{`
        @keyframes pulseScale {
          0% {
            transform: scale(0.95);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.02);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
      <div className="fixed inset-0 z-[70] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 glass-modal-overlay"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 glass-modal-container rounded-2xl w-[85vw] max-w-4xl h-[80vh] mx-4 shadow-2xl flex flex-col overflow-hidden">
        {/* Header con estilo glass */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 flex-shrink-0 glass-modal-header">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-400 text-xl">
              speed
            </span>
            {t("title")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
            aria-label={t("closeModal")}
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col min-h-0 scrollbar-custom">
          <GPUCPUContent
            analysis={analysis}
            gpuScore={analysis.gpuScore}
            cpuScore={analysis.cpuScore}
            t={t}
          />

          {/* Disclaimer - botón (?) */}
          <div className="mt-4 flex-shrink-0 flex justify-end">
            <div className="relative group">
              <button
                className="w-5 h-5 rounded-full bg-slate-500/20 border border-slate-500/30 text-slate-300 hover:bg-slate-500/30 flex items-center justify-center text-xs font-semibold transition-colors"
                title={t("disclaimerTitle")}
              >
                ?
              </button>
              <div className="absolute right-0 bottom-full mb-2 w-64 p-2 bg-slate-800 border border-slate-500/30 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-xs text-left">
                <div className="text-slate-300">{t("disclaimer")}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

