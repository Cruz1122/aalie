"use client";

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
 * Genera las razones por las que GPU es mejor o peor
 */
function getGPUReasons(score: number, metrics: GPUCPUMetrics): string[] {
  const reasons: string[] = [];
  
  if (score > 60) {
    // Razones por las que es bueno para GPU
    if (metrics.totalLoops > 0) {
      const branchingRatio = metrics.conditionalsInLoops / metrics.totalLoops;
      if (branchingRatio < 0.2) {
        reasons.push("✓ Los bucles presentan una estructura muy regular, con mínimas decisiones condicionales que permiten una ejecución uniforme en paralelo");
      } else if (branchingRatio < 0.3) {
        reasons.push("✓ Los bucles tienen poca lógica condicional, lo que facilita la paralelización masiva sin divergencia significativa entre threads");
      }
    }
    
    if (metrics.arrayAccessCount > metrics.totalLoops * 2 && metrics.totalLoops > 0) {
      reasons.push("✓ El algoritmo realiza múltiples accesos a estructuras de datos en bloque, un patrón ideal para kernels de GPU que procesan grandes volúmenes de datos simultáneamente");
    } else if (metrics.arrayAccessCount > 0) {
      reasons.push("✓ Se detectan accesos frecuentes a arrays, indicando procesamiento de datos que se beneficia del ancho de banda de memoria de las GPUs");
    }
    
    if (metrics.maxLoopDepth >= 2 && metrics.conditionalsInLoops / metrics.totalLoops < 0.4) {
      reasons.push("✓ La anidación de bucles con lógica simple crea oportunidades para paralelización en múltiples dimensiones, aprovechando la arquitectura masivamente paralela de las GPUs");
    }
    
    if (!metrics.isRecursive) {
      reasons.push("✓ La ausencia de recursión elimina la necesidad de manejar stacks complejos, permitiendo un flujo de ejecución predecible y paralelizable");
    }
    
    if (metrics.totalLoops > 0 && metrics.conditionalsInLoops === 0) {
      reasons.push("✓ Los bucles carecen completamente de decisiones condicionales, garantizando que todos los threads sigan el mismo camino de ejecución sin penalizaciones por divergencia");
    }
    
    if (metrics.totalLoops > 3 && metrics.conditionalsInLoops / metrics.totalLoops < 0.3) {
      reasons.push("✓ La presencia de múltiples bucles regulares sugiere un patrón de cálculo repetitivo que se puede distribuir eficientemente entre miles de cores de GPU");
    }
  } else if (score < 40) {
    // Razones por las que es malo para GPU
    if (metrics.isRecursive) {
      if (metrics.recursiveCallCount > 1) {
        reasons.push("✗ La recursión compleja introduce flujo de control irregular y dependencias entre llamadas que dificultan la paralelización masiva en GPU");
      } else {
        reasons.push("✗ La presencia de recursión crea un flujo de ejecución no lineal que no se adapta bien a la arquitectura de ejecución paralela de las GPUs");
      }
    }
    
    if (metrics.totalLoops > 0) {
      const branchingRatio = metrics.conditionalsInLoops / metrics.totalLoops;
      if (branchingRatio > 0.7) {
        reasons.push("✗ La alta densidad de decisiones condicionales dentro de los bucles causa divergencia masiva entre threads, reduciendo drásticamente la eficiencia de la GPU");
      } else if (branchingRatio > 0.5) {
        reasons.push("✗ Las múltiples decisiones dentro de los bucles generan caminos de ejecución divergentes que penalizan el rendimiento en arquitecturas SIMD como las GPUs");
      }
    }
    
    if (metrics.callsInsideLoops > metrics.totalLoops * 2) {
      reasons.push("✗ Las frecuentes llamadas a funciones dentro de los bucles introducen overhead y complejidad que dificultan la optimización y paralelización en GPU");
    }
    
    if (metrics.totalLoops === 0 && metrics.isRecursive) {
      reasons.push("✗ La ausencia de bucles junto con recursión indica un algoritmo basado en árboles o backtracking, típicamente más eficiente en CPU");
    }
  } else {
    // Score intermedio
    reasons.push("• El algoritmo presenta características mixtas que no favorecen claramente ni GPU ni CPU");
    
    if (metrics.totalLoops > 0) {
      const branchingRatio = metrics.conditionalsInLoops / metrics.totalLoops;
      if (branchingRatio > 0.3 && branchingRatio < 0.5) {
        reasons.push("• Los bucles tienen un nivel moderado de decisiones condicionales, creando un equilibrio entre paralelización y divergencia");
      }
    }
    
    if (metrics.isRecursive && metrics.recursiveCallCount === 1) {
      reasons.push("• La recursión limitada introduce cierta complejidad, pero no es suficientemente profunda como para descartar completamente la paralelización");
    }
    
    if (metrics.arrayAccessCount > 0 && metrics.arrayAccessCount < metrics.totalLoops * 2) {
      reasons.push("• Los accesos a arrays están presentes pero no en la densidad suficiente para aprovechar completamente el ancho de banda de memoria de GPU");
    }
  }
  
  return reasons.length > 0 ? reasons : ["• El análisis no muestra características claramente definidas hacia GPU o CPU"];
}

/**
 * Genera las razones por las que CPU es mejor o peor
 */
function getCPUReasons(score: number, metrics: GPUCPUMetrics): string[] {
  const reasons: string[] = [];
  
  if (score > 60) {
    // Razones por las que es bueno para CPU
    if (metrics.isRecursive) {
      if (metrics.recursiveCallCount > 2) {
        reasons.push("✓ La recursión profunda y múltiple crea un flujo de control que se maneja naturalmente en CPU, donde el stack y la gestión de llamadas están optimizados");
      } else {
        reasons.push("✓ La presencia de recursión indica un algoritmo que se beneficia del manejo eficiente de llamadas y contexto que ofrecen las CPUs modernas");
      }
    }
    
    if (metrics.totalLoops > 0) {
      const branchingRatio = metrics.conditionalsInLoops / metrics.totalLoops;
      if (branchingRatio > 0.7) {
        reasons.push("✓ La alta densidad de decisiones condicionales dentro de los bucles crea un flujo de control complejo que las CPUs manejan eficientemente con predicción de saltos y ejecución fuera de orden");
      } else if (branchingRatio > 0.5) {
        reasons.push("✓ Las múltiples decisiones dentro de los bucles generan caminos de ejecución variados que se optimizan mejor en CPU mediante técnicas de branch prediction");
      }
    }
    
    if (metrics.recursiveCallCount > 1) {
      reasons.push("✓ El patrón recursivo complejo con múltiples llamadas aprovecha la flexibilidad del modelo de ejecución de CPU, donde cada llamada puede tener su propio contexto y stack");
    }
    
    if (metrics.callsInsideLoops > metrics.totalLoops * 2) {
      reasons.push("✓ Las frecuentes llamadas a funciones dentro de los bucles se ejecutan eficientemente en CPU gracias a la optimización de llamadas y el cache de instrucciones");
    }
    
    if (metrics.totalLoops > 0 && metrics.conditionalsInLoops > metrics.totalLoops) {
      reasons.push("✓ La complejidad de las decisiones dentro de los bucles requiere evaluación condicional que las CPUs procesan eficientemente con unidades de ejecución especializadas");
    }
    
    if (metrics.isRecursive && metrics.totalLoops === 0) {
      reasons.push("✓ Un algoritmo puramente recursivo sin bucles se beneficia del modelo de ejecución secuencial y la gestión de memoria stack que caracteriza a las CPUs");
    }
  } else if (score < 40) {
    // Razones por las que es malo para CPU
    if (metrics.totalLoops > 0) {
      const branchingRatio = metrics.conditionalsInLoops / metrics.totalLoops;
      if (branchingRatio < 0.2) {
        reasons.push("✗ Los bucles extremadamente regulares con poca lógica condicional representan un patrón ideal para paralelización masiva en GPU, donde la CPU no puede aprovechar su flexibilidad");
      }
    }
    
    if (metrics.arrayAccessCount > metrics.totalLoops * 2 && metrics.totalLoops > 0) {
      reasons.push("✗ El procesamiento intensivo de arrays en bloque se beneficia más del ancho de banda de memoria y la paralelización masiva de GPU que de la ejecución secuencial de CPU");
    }
    
    if (!metrics.isRecursive && metrics.totalLoops > 3 && metrics.conditionalsInLoops / metrics.totalLoops < 0.3) {
      reasons.push("✗ El patrón iterativo simple y repetitivo con múltiples bucles es un candidato ideal para paralelización en GPU, donde miles de threads pueden ejecutar la misma operación simultáneamente");
    }
    
    if (metrics.maxLoopDepth >= 2 && metrics.conditionalsInLoops / metrics.totalLoops < 0.3) {
      reasons.push("✗ Los bucles anidados con lógica simple crean oportunidades de paralelización multidimensional que las GPUs explotan mejor que las CPUs");
    }
    
    if (metrics.totalLoops > 0 && metrics.conditionalsInLoops === 0) {
      reasons.push("✗ La ausencia total de decisiones condicionales en los bucles elimina las ventajas de la predicción de saltos de CPU, favoreciendo la ejecución masivamente paralela de GPU");
    }
  } else {
    // Score intermedio
    reasons.push("• El algoritmo presenta características mixtas que no favorecen claramente ni CPU ni GPU");
    
    if (metrics.totalLoops > 0) {
      const branchingRatio = metrics.conditionalsInLoops / metrics.totalLoops;
      if (branchingRatio > 0.3 && branchingRatio < 0.5) {
        reasons.push("• Los bucles tienen un nivel moderado de decisiones, creando un equilibrio donde ni la paralelización masiva ni la flexibilidad de CPU dominan claramente");
      }
    }
    
    if (metrics.isRecursive && metrics.recursiveCallCount === 1) {
      reasons.push("• La recursión limitada introduce cierta complejidad de flujo, pero no es suficientemente profunda como para descartar completamente otras estrategias de optimización");
    }
    
    if (metrics.arrayAccessCount > 0 && metrics.arrayAccessCount < metrics.totalLoops * 2) {
      reasons.push("• Los accesos a arrays están presentes pero no en la densidad suficiente para justificar completamente una migración a GPU");
    }
    
    if (metrics.totalLoops > 0 && metrics.callsInsideLoops > 0 && metrics.callsInsideLoops <= metrics.totalLoops) {
      reasons.push("• Las llamadas a funciones dentro de bucles añaden complejidad, pero en un nivel que puede manejarse tanto en CPU como en implementaciones híbridas");
    }
  }
  
  return reasons.length > 0 ? reasons : ["• El análisis no muestra características claramente definidas hacia CPU o GPU"];
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
}: Readonly<{ 
  score: number; 
  label: "GPU" | "CPU"; 
  animate?: boolean;
  metrics: GPUCPUMetrics;
  isFlipped: boolean;
  onFlip: () => void;
}>) {
  const style = getCardStyle(score);
  const icon = label === "GPU" ? "memory" : "developer_board";
  const reasons = label === "GPU" ? getGPUReasons(score, metrics) : getCPUReasons(score, metrics);
  
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
            {label} - Razones
          </h3>
          <div className="space-y-1 text-xs text-white/80 text-center">
            {reasons.map((reason, idx) => (
              <div key={idx}>{reason}</div>
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
}: Readonly<{
  analysis: GPUCPUAnalysisResult;
  gpuScore: number;
  cpuScore: number;
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
          />

          {/* Card CPU */}
          <GPUCard 
            score={cpuScore} 
            label="CPU" 
            animate={shouldAnimate}
            metrics={analysis.metrics}
            isFlipped={cpuFlipped}
            onFlip={() => setCpuFlipped(!cpuFlipped)}
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
              {isExpanded ? "Ocultar detalles" : "Ver análisis y recomendación"}
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
                  Análisis de la estructura:
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
                  Recomendación:
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
      <div className="relative z-10 glass-modal-container rounded-2xl p-6 w-[85vw] max-w-4xl h-[80vh] mx-4 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-400 text-xl">
              speed
            </span>
            Análisis GPU vs CPU
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Cerrar"
          >
            <span className="material-symbols-outlined text-white">close</span>
          </button>
        </div>

        {/* Contenido: dos cards lado a lado o sección expandida */}
        <GPUCPUContent
          analysis={analysis}
          gpuScore={analysis.gpuScore}
          cpuScore={analysis.cpuScore}
        />

        {/* Disclaimer - botón (?) */}
        <div className="mt-4 flex-shrink-0 flex justify-end">
          <div className="relative group">
            <button
              className="w-5 h-5 rounded-full bg-slate-500/20 border border-slate-500/30 text-slate-300 hover:bg-slate-500/30 flex items-center justify-center text-xs font-semibold transition-colors"
              title="Información sobre el análisis"
            >
              ?
            </button>
            <div className="absolute right-0 bottom-full mb-2 w-64 p-2 bg-slate-800 border border-slate-500/30 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-xs text-left">
              <div className="text-slate-300">
                Este análisis es cualitativo y basado únicamente en la estructura
                del algoritmo (su AST). No se promete que GPU sea siempre más rápida
                que CPU ni al revés. La recomendación es orientativa y sirve como guía
                conceptual, no como benchmark real.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

