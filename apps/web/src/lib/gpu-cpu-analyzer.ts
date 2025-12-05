import type { Program, AstNode, ProcDef, Block, For, While, Repeat, If, Call, Index, Assign, Binary, Unary, Return, Print } from "@aa/types";

import type { GPUCPUMetrics, GPUCPUAnalysisResult, GPUCPUProfile } from "@/types/gpu-cpu";

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
function generateSummary(profile: GPUCPUProfile, _metrics: GPUCPUMetrics): string {
  if (profile === "GPU") {
    return "Por la cantidad de bucles y la poca lógica condicional dentro de ellos, este algoritmo presenta un patrón de ejecución bastante regular y repetitivo, típico de tareas que se pueden paralelizar sobre muchos datos.";
  } else if (profile === "CPU") {
    return "Este algoritmo combina recursión y decisiones dentro de los bucles, lo que produce un flujo de control más irregular y suele ajustarse mejor a una CPU.";
  } else {
    return "La estructura del algoritmo es intermedia: tiene bucles y algo de recursión o branching, por lo que podría beneficiarse tanto de una buena CPU como de cierto grado de paralelismo, según la implementación.";
  }
}

/**
 * Genera la explicación detallada de las métricas en formato de viñetas
 */
function generateExplanation(metrics: GPUCPUMetrics): string {
  const parts: string[] = [];

  // Análisis de bucles
  if (metrics.totalLoops > 0) {
    parts.push(`• Se detectaron ${metrics.totalLoops} bucle${metrics.totalLoops !== 1 ? 's' : ''} en total`);
    
    if (metrics.maxLoopDepth > 1) {
      parts.push(`• La profundidad máxima de anidación es ${metrics.maxLoopDepth}, lo que indica ${metrics.maxLoopDepth === 2 ? 'una estructura de bucles anidados' : 'una estructura profundamente anidada'}`);
    } else if (metrics.totalLoops > 0) {
      parts.push(`• Los bucles no están anidados (profundidad máxima: 1)`);
    }

    // Análisis de branching en bucles
    if (metrics.totalLoops > 0) {
      const branchingRatio = metrics.conditionalsInLoops / metrics.totalLoops;
      if (metrics.conditionalsInLoops > 0) {
        if (branchingRatio > 0.5) {
          parts.push(`• Se encontraron ${metrics.conditionalsInLoops} condicional${metrics.conditionalsInLoops !== 1 ? 'es' : ''} dentro de los bucles (ratio: ${(branchingRatio * 100).toFixed(1)}%), indicando un alto nivel de decisiones durante la ejecución`);
        } else if (branchingRatio > 0.2) {
          parts.push(`• Se encontraron ${metrics.conditionalsInLoops} condicional${metrics.conditionalsInLoops !== 1 ? 'es' : ''} dentro de los bucles (ratio: ${(branchingRatio * 100).toFixed(1)}%), con un nivel moderado de decisiones`);
        } else {
          parts.push(`• Se encontraron ${metrics.conditionalsInLoops} condicional${metrics.conditionalsInLoops !== 1 ? 'es' : ''} dentro de los bucles (ratio: ${(branchingRatio * 100).toFixed(1)}%), indicando bucles con lógica relativamente simple`);
        }
      } else {
        parts.push(`• No se detectaron condicionales dentro de los bucles, lo que sugiere un patrón de ejecución muy regular`);
      }
    }
  } else {
    parts.push(`• No se detectaron bucles en el algoritmo`);
  }

  // Análisis de recursión
  if (metrics.isRecursive) {
    if (metrics.recursiveCallCount === 1) {
      parts.push(`• El algoritmo es recursivo con una llamada recursiva detectada, lo que indica un patrón de auto-llamadas`);
    } else if (metrics.recursiveCallCount > 1) {
      parts.push(`• El algoritmo es recursivo con ${metrics.recursiveCallCount} llamadas recursivas detectadas, sugiriendo un patrón recursivo complejo`);
    } else {
      parts.push(`• El algoritmo presenta recursión, aunque no se pudieron contar todas las llamadas recursivas`);
    }
  } else {
    parts.push(`• No se detectó recursión en el algoritmo, lo que indica un patrón de ejecución iterativo`);
  }

  // Análisis de accesos a arrays
  if (metrics.arrayAccessCount > 0) {
    if (metrics.arrayAccessCount > metrics.totalLoops * 3 && metrics.totalLoops > 0) {
      parts.push(`• Se detectaron ${metrics.arrayAccessCount} acceso${metrics.arrayAccessCount !== 1 ? 's' : ''} a estructuras indexadas, lo que indica un procesamiento intensivo de datos en bloque`);
    } else if (metrics.arrayAccessCount > metrics.totalLoops && metrics.totalLoops > 0) {
      parts.push(`• Se detectaron ${metrics.arrayAccessCount} acceso${metrics.arrayAccessCount !== 1 ? 's' : ''} a estructuras indexadas, con múltiples accesos por iteración`);
    } else if (metrics.arrayAccessCount > 0) {
      parts.push(`• Se detectaron ${metrics.arrayAccessCount} acceso${metrics.arrayAccessCount !== 1 ? 's' : ''} a estructuras indexadas`);
    } else {
      parts.push(`• Se detectaron ${metrics.arrayAccessCount} acceso${metrics.arrayAccessCount !== 1 ? 's' : ''} a estructuras indexadas`);
    }
  } else {
    parts.push(`• No se detectaron accesos a estructuras indexadas (arrays o listas)`);
  }

  // Análisis de llamadas dentro de bucles
  if (metrics.callsInsideLoops > 0) {
    if (metrics.callsInsideLoops > metrics.totalLoops * 2) {
      parts.push(`• Se realizan ${metrics.callsInsideLoops} llamada${metrics.callsInsideLoops !== 1 ? 's' : ''} a funciones dentro de los bucles, lo que puede introducir overhead significativo`);
    } else if (metrics.callsInsideLoops > 0) {
      parts.push(`• Se realizan ${metrics.callsInsideLoops} llamada${metrics.callsInsideLoops !== 1 ? 's' : ''} a funciones dentro de los bucles`);
    }
  }

  return parts.join("\n");
}

/**
 * Pool de recomendaciones para perfil GPU
 */
const GPU_RECOMMENDATIONS = [
  "Recomendación: si necesitas escalar a volúmenes grandes de datos, este algoritmo es un buen candidato a una implementación basada en GPU o en librerías vectorizadas, ya que su patrón de cálculo es bastante uniforme. En CPU puede funcionar bien, pero el mayor potencial de mejora suele estar en el paralelismo masivo.",
  "Recomendación: la estructura regular de bucles y la poca lógica condicional hacen de este algoritmo un excelente candidato para paralelización masiva. Considera usar frameworks como CUDA, OpenCL o librerías vectorizadas (NumPy, TensorFlow) para aprovechar al máximo el hardware GPU.",
  "Recomendación: este algoritmo presenta características ideales para GPU: bucles regulares, procesamiento de datos en bloque y poca divergencia de control. Si trabajas con grandes volúmenes de datos, una implementación en GPU puede ofrecer mejoras significativas de rendimiento.",
  "Recomendación: el patrón de ejecución uniforme y repetitivo de este algoritmo se beneficia enormemente del paralelismo masivo que ofrecen las GPUs. Para datasets pequeños, una CPU puede ser suficiente, pero para escalar, considera migrar a GPU o usar procesamiento vectorizado.",
  "Recomendación: la naturaleza regular y predecible de los bucles en este algoritmo lo hace ideal para kernels de GPU. El procesamiento paralelo puede acelerar significativamente la ejecución, especialmente cuando se trabaja con arrays grandes o múltiples iteraciones sobre los mismos datos.",
];

/**
 * Pool de recomendaciones para perfil CPU
 */
const CPU_RECOMMENDATIONS = [
  "Recomendación: este algoritmo tiende a aprovechar mejor una CPU, debido a su recursión y/o a la cantidad de decisiones en los bucles. Si el rendimiento es un problema, suele ser más efectivo mejorar la complejidad del algoritmo, la poda de casos o la implementación en CPU, antes que intentar llevarlo a GPU.",
  "Recomendación: la presencia de recursión y múltiples decisiones condicionales hace que este algoritmo sea más adecuado para CPUs, donde el flujo de control irregular se maneja de forma más eficiente. Enfócate en optimizar la complejidad algorítmica y usar técnicas como memoización o poda antes que considerar GPU.",
  "Recomendación: el flujo de control irregular y la recursión en este algoritmo dificultan su paralelización efectiva en GPU. Una CPU moderna con múltiples núcleos suele ser la mejor opción. Considera optimizaciones como mejoras en la estructura de datos o algoritmos más eficientes.",
  "Recomendación: debido a la naturaleza recursiva y las decisiones frecuentes dentro de los bucles, este algoritmo se ejecuta mejor en CPU. Las GPUs no son ideales para este tipo de patrones debido a la divergencia de control. Mejora el algoritmo o usa técnicas de optimización en CPU.",
  "Recomendación: la combinación de recursión y branching intenso hace que este algoritmo sea un mal candidato para GPU. El overhead de transferencia de datos y la divergencia de control anularían cualquier beneficio. Optimiza en CPU usando técnicas como caché, memoización o algoritmos más eficientes.",
  "Recomendación: este algoritmo presenta un flujo de control complejo que se beneficia más de la flexibilidad de una CPU. La recursión y las decisiones condicionales frecuentes dificultan la paralelización efectiva. Enfócate en mejorar la complejidad algorítmica o usar optimizaciones específicas de CPU.",
];

/**
 * Pool de recomendaciones para perfil Mixto
 */
const MIXED_RECOMMENDATIONS = [
  "Recomendación: una CPU multicore suele ser suficiente en la mayoría de escenarios. Si más adelante te interesa una versión en GPU, lo más razonable sería extraer las partes más regulares del algoritmo (bucles simples sobre datos) y convertir solo esas secciones en kernels paralelos.",
  "Recomendación: este algoritmo tiene características tanto de GPU como de CPU. Para la mayoría de casos, una CPU multicore es la opción más práctica. Si necesitas más rendimiento, considera un enfoque híbrido: procesar las partes regulares en GPU y las recursivas/condicionales en CPU.",
  "Recomendación: la estructura mixta de este algoritmo sugiere que una CPU moderna con múltiples núcleos es la mejor opción inicial. Si más adelante necesitas escalar, identifica las secciones más regulares (bucles simples) y considera paralelizarlas, manteniendo la lógica compleja en CPU.",
  "Recomendación: dado que este algoritmo combina patrones regulares e irregulares, una CPU multicore ofrece el mejor equilibrio. Para optimizaciones futuras, podrías separar las partes paralelizables (bucles regulares) y ejecutarlas en GPU, mientras mantienes la lógica compleja en CPU.",
  "Recomendación: este algoritmo presenta una estructura intermedia que se beneficia mejor de una CPU con buen paralelismo a nivel de hilos. Si necesitas más rendimiento, considera optimizar las partes más regulares del código o usar un enfoque híbrido CPU-GPU para secciones específicas.",
  "Recomendación: la naturaleza mixta de este algoritmo hace que una CPU multicore sea la opción más versátil. Para mejoras adicionales, podrías identificar y paralelizar solo las secciones más regulares, manteniendo el resto del procesamiento en CPU donde el flujo de control es más eficiente.",
];

/**
 * Genera la recomendación final seleccionando aleatoriamente del pool
 */
function generateRecommendation(profile: GPUCPUProfile, metrics: GPUCPUMetrics): string {
  let pool: string[];
  
  if (profile === "GPU") {
    pool = GPU_RECOMMENDATIONS;
  } else if (profile === "CPU") {
    pool = CPU_RECOMMENDATIONS;
  } else {
    pool = MIXED_RECOMMENDATIONS;
  }
  
  // Usar una semilla basada en métricas para que sea determinístico pero variado
  const seed = metrics.totalLoops + metrics.recursiveCallCount + metrics.arrayAccessCount;
  const index = seed % pool.length;
  
  return pool[index];
}

/**
 * Analiza el AST del algoritmo para determinar si es más adecuado para GPU o CPU
 * 
 * @param ast - El AST del programa a analizar
 * @returns Resultado del análisis con perfil, scores, métricas y recomendaciones
 */
export function analyzeASTForGPUCPU(ast: Program): GPUCPUAnalysisResult {
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
  const summary = generateSummary(profile, metrics);
  const explanation = generateExplanation(metrics);
  const recommendation = generateRecommendation(profile, metrics);

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

