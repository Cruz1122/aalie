import type { Program, AstNode, ProcDef, Block, For, While, Repeat, If, Call, Index, Assign, Binary, Unary, Return, Print } from "@aa/types";

import type { GPUCPUMetrics, GPUCPUAnalysisResult, GPUCPUProfile } from "@/types/gpu-cpu";
import { GPU_CPU_TEXTS, type GpuCpuLocale } from "./gpu-cpu-texts";

/**
 * Contexto para el recorrido del AST
 */
interface AnalysisContext {
  currentLoopDepth: number;
  insideLoop: boolean;
  functionName?: string;
  metrics: GPUCPUMetrics;
}

/**
 * Inicializa las métricas en cero
 */
function createInitialMetrics(): GPUCPUMetrics {
  return {
    totalLoops: 0,
    maxLoopDepth: 0,
    conditionalsInLoops: 0,
    isRecursive: false,
    recursiveCallCount: 0,
    arrayAccessCount: 0,
    callsInsideLoops: 0,
  };
}

/**
 * Recorre recursivamente el AST para extraer métricas
 */
function analyzeNode(node: AstNode, context: AnalysisContext): void {
  switch (node.type) {
    case "For":
    case "While":
    case "Repeat": {
      // Es un bucle
      context.metrics.totalLoops++;
      const wasInsideLoop = context.insideLoop;
      const previousDepth = context.currentLoopDepth;
      
      context.insideLoop = true;
      context.currentLoopDepth++;
      context.metrics.maxLoopDepth = Math.max(
        context.metrics.maxLoopDepth,
        context.currentLoopDepth
      );

      // Recorrer el cuerpo del bucle
      const loopNode = node as For | While | Repeat;
      const body = loopNode.type === "Repeat" 
        ? (loopNode as Repeat).body 
        : (loopNode as For | While).body;
      
      if (body && body.type === "Block") {
        for (const stmt of body.body) {
          analyzeNode(stmt, context);
        }
      }

      // Restaurar contexto
      context.insideLoop = wasInsideLoop;
      context.currentLoopDepth = previousDepth;
      break;
    }

    case "If": {
      const ifNode = node as If;
      
      // Si estamos dentro de un bucle, contar este condicional
      if (context.insideLoop) {
        context.metrics.conditionalsInLoops++;
      }

      // Recorrer el bloque then
      if (ifNode.consequent) {
        for (const stmt of ifNode.consequent.body) {
          analyzeNode(stmt, context);
        }
      }

      // Recorrer el bloque else si existe
      if (ifNode.alternate) {
        for (const stmt of ifNode.alternate.body) {
          analyzeNode(stmt, context);
        }
      }
      break;
    }

    case "Call": {
      const callNode = node as Call;
      
      // Si estamos dentro de un bucle, contar la llamada
      if (context.insideLoop) {
        context.metrics.callsInsideLoops++;
      }

      // Verificar si es una llamada recursiva
      if (callNode.callee === context.functionName) {
        context.metrics.isRecursive = true;
        context.metrics.recursiveCallCount++;
      }

      // Recorrer argumentos
      for (const arg of callNode.args) {
        analyzeNode(arg, context);
      }
      break;
    }

    case "Index": {
      const indexNode = node as Index;
      context.metrics.arrayAccessCount++;
      
      // Recorrer el target y el index
      analyzeNode(indexNode.target, context);
      if (indexNode.index) {
        analyzeNode(indexNode.index, context);
      }
      break;
    }

    case "Block": {
      const blockNode = node as Block;
      for (const stmt of blockNode.body) {
        analyzeNode(stmt, context);
      }
      break;
    }

    case "Assign": {
      const assignNode = node as Assign;
      analyzeNode(assignNode.target, context);
      analyzeNode(assignNode.value, context);
      break;
    }

    case "Binary":
    case "Unary": {
      // Recorrer operandos
      if (node.type === "Binary") {
        const binaryNode = node as Binary;
        analyzeNode(binaryNode.left, context);
        analyzeNode(binaryNode.right, context);
      } else {
        const unaryNode = node as Unary;
        analyzeNode(unaryNode.arg, context);
      }
      break;
    }

    case "Return": {
      const returnNode = node as Return;
      if (returnNode.value) {
        analyzeNode(returnNode.value, context);
      }
      break;
    }

    case "Print": {
      const printNode = node as Print;
      for (const arg of printNode.args) {
        analyzeNode(arg, context);
      }
      break;
    }

    // Casos que no requieren recorrido adicional
    case "Literal":
    case "Identifier":
    case "Field":
    case "Param":
    case "ArrayParam":
    case "ObjectParam":
    case "DeclVector":
      break;

    default:
      // Para cualquier otro tipo, intentar recorrer si tiene propiedades conocidas
      break;
  }
}

/**
 * Analiza un procedimiento completo
 */
function analyzeProcedure(procDef: ProcDef, context: AnalysisContext): void {
  context.functionName = procDef.name;
  
  if (procDef.body && procDef.body.type === "Block") {
    for (const stmt of procDef.body.body) {
      analyzeNode(stmt, context);
    }
  }
}

/**
 * Calcula los scores GPU y CPU basados en las métricas
 */
function calculateScores(metrics: GPUCPUMetrics): { gpuScore: number; cpuScore: number } {
  let gpuScore = 50; // Base neutral
  let cpuScore = 50; // Base neutral

  // Factor 1: Recursión → favorece CPU
  if (metrics.isRecursive) {
    cpuScore += 30;
    gpuScore -= 20;
  }
  if (metrics.recursiveCallCount > 0) {
    cpuScore += Math.min(metrics.recursiveCallCount * 5, 20);
    gpuScore -= Math.min(metrics.recursiveCallCount * 3, 15);
  }

  // Factor 2: Branching en bucles → favorece CPU
  if (metrics.totalLoops > 0) {
    const branchingRatio = metrics.conditionalsInLoops / metrics.totalLoops;
    if (branchingRatio > 0.5) {
      cpuScore += 25;
      gpuScore -= 20;
    } else if (branchingRatio < 0.3) {
      // Poco branching → favorece GPU
      gpuScore += 20;
      cpuScore -= 10;
    }
  }

  // Factor 3: Bucles regulares → favorece GPU
  if (metrics.totalLoops > 0) {
    if (metrics.conditionalsInLoops / metrics.totalLoops < 0.3 && !metrics.isRecursive) {
      gpuScore += 25;
      cpuScore -= 15;
    }
  }

  // Factor 4: Accesos a arrays → favorece GPU
  if (metrics.arrayAccessCount > metrics.totalLoops * 2 && metrics.totalLoops > 0) {
    gpuScore += 20;
    cpuScore -= 10;
  } else if (metrics.arrayAccessCount > 0) {
    gpuScore += Math.min(metrics.arrayAccessCount * 2, 15);
  }

  // Factor 5: Anidación profunda con poco branching → favorece GPU
  if (metrics.maxLoopDepth >= 2 && metrics.conditionalsInLoops / metrics.totalLoops < 0.4) {
    gpuScore += 15;
    cpuScore -= 10;
  }

  // Factor 6: Llamadas dentro de bucles → puede favorecer CPU si son muchas
  if (metrics.callsInsideLoops > metrics.totalLoops * 2) {
    cpuScore += 10;
    gpuScore -= 5;
  }

  // Normalizar scores entre 0 y 100
  gpuScore = Math.max(0, Math.min(100, gpuScore));
  cpuScore = Math.max(0, Math.min(100, cpuScore));

  return { gpuScore, cpuScore };
}

/**
 * Determina el perfil basado en los scores
 */
function determineProfile(gpuScore: number, cpuScore: number): GPUCPUProfile {
  const difference = Math.abs(gpuScore - cpuScore);
  
  if (difference < 15) {
    return "Mixto";
  }
  
  return gpuScore > cpuScore ? "GPU" : "CPU";
}

/**
 * Genera el resumen breve del análisis
 */
function generateSummary(
  profile: GPUCPUProfile,
  _metrics: GPUCPUMetrics,
  locale: GpuCpuLocale
): string {
  const texts = GPU_CPU_TEXTS[locale].summary;
  if (profile === "GPU") return texts.gpu;
  if (profile === "CPU") return texts.cpu;
  return texts.mixed;
}

/**
 * Genera la explicación detallada de las métricas en formato de viñetas
 */
function generateExplanation(
  metrics: GPUCPUMetrics,
  locale: GpuCpuLocale
): string {
  const ex = GPU_CPU_TEXTS[locale].explanation;
  const parts: string[] = [];
  const ratio = (n: number) => (n * 100).toFixed(1);

  if (metrics.totalLoops > 0) {
    parts.push(ex.loopsDetected(metrics.totalLoops));
    if (metrics.maxLoopDepth > 1) {
      parts.push(ex.depthNested(metrics.maxLoopDepth));
    } else if (metrics.totalLoops > 0) {
      parts.push(ex.loopsNotNested);
    }
    if (metrics.totalLoops > 0) {
      const branchingRatio = metrics.conditionalsInLoops / metrics.totalLoops;
      if (metrics.conditionalsInLoops > 0) {
        const r = ratio(branchingRatio);
        if (branchingRatio > 0.5) {
          parts.push(ex.conditionalsHigh(metrics.conditionalsInLoops, r));
        } else if (branchingRatio > 0.2) {
          parts.push(ex.conditionalsModerate(metrics.conditionalsInLoops, r));
        } else {
          parts.push(ex.conditionalsLow(metrics.conditionalsInLoops, r));
        }
      } else {
        parts.push(ex.noConditionals);
      }
    }
  } else {
    parts.push(ex.noLoops);
  }

  if (metrics.isRecursive) {
    if (metrics.recursiveCallCount === 1) parts.push(ex.recursiveOne);
    else if (metrics.recursiveCallCount > 1)
      parts.push(ex.recursiveMany(metrics.recursiveCallCount));
    else parts.push(ex.recursiveUnknown);
  } else {
    parts.push(ex.noRecursion);
  }

  if (metrics.arrayAccessCount > 0) {
    if (
      metrics.arrayAccessCount > metrics.totalLoops * 3 &&
      metrics.totalLoops > 0
    ) {
      parts.push(ex.arrayIntensive(metrics.arrayAccessCount));
    } else if (
      metrics.arrayAccessCount > metrics.totalLoops &&
      metrics.totalLoops > 0
    ) {
      parts.push(ex.arrayMultiple(metrics.arrayAccessCount));
    } else {
      parts.push(ex.arrayDetected(metrics.arrayAccessCount));
    }
  } else {
    parts.push(ex.noArrayAccess);
  }

  if (metrics.callsInsideLoops > 0) {
    if (metrics.callsInsideLoops > metrics.totalLoops * 2) {
      parts.push(ex.callsHigh(metrics.callsInsideLoops));
    } else {
      parts.push(ex.callsDetected(metrics.callsInsideLoops));
    }
  }

  return parts.join("\n");
}

/**
 * Genera la recomendación final seleccionando del pool según métricas
 */
function generateRecommendation(
  profile: GPUCPUProfile,
  metrics: GPUCPUMetrics,
  locale: GpuCpuLocale
): string {
  const pool = GPU_CPU_TEXTS[locale].recommendations[profile.toLowerCase() as "gpu" | "cpu" | "mixed"];
  const seed = metrics.totalLoops + metrics.recursiveCallCount + metrics.arrayAccessCount;
  const index = seed % pool.length;
  return pool[index];
}

/**
 * Analiza el AST del algoritmo para determinar si es más adecuado para GPU o CPU
 *
 * @param ast - El AST del programa a analizar
 * @param locale - Idioma para los textos ("en" | "es")
 * @returns Resultado del análisis con perfil, scores, métricas y recomendaciones
 */
export function analyzeASTForGPUCPU(
  ast: Program,
  locale: GpuCpuLocale = "en"
): GPUCPUAnalysisResult {
  const metrics = createInitialMetrics();
  const context: AnalysisContext = {
    currentLoopDepth: 0,
    insideLoop: false,
    metrics,
  };

  // Recorrer todos los procedimientos en el programa
  for (const node of ast.body) {
    if (node.type === "ProcDef") {
      analyzeProcedure(node as ProcDef, context);
    } else {
      analyzeNode(node as AstNode, context);
    }
  }

  // Calcular scores
  const { gpuScore, cpuScore } = calculateScores(metrics);

  // Determinar perfil
  const profile = determineProfile(gpuScore, cpuScore);

  // Generar textos
  const summary = generateSummary(profile, metrics, locale);
  const explanation = generateExplanation(metrics, locale);
  const recommendation = generateRecommendation(profile, metrics, locale);

  return {
    profile,
    summary,
    explanation,
    recommendation,
    metrics,
    gpuScore: Math.round(gpuScore),
    cpuScore: Math.round(cpuScore),
  };
}

