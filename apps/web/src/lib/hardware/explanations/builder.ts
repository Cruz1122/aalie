import type { HardwareFeatures, DependencyProfile, PatternCandidate, HardwareSuitabilityReport, EvidenceItem } from "../types";
import type { EngineOutput } from "../scoring/engine";

type Locale = "en" | "es";

const T = {
  // Reasons positive
  independentIterations: {
    en: "Iterations appear independent and write to distinct array positions.",
    es: "Las iteraciones parecen independientes y escriben en posiciones distintas del arreglo.",
  },
  regularContiguous: {
    en: "Memory access is regular and contiguous, favorable for GPU.",
    es: "El acceso a memoria es regular y contiguo, favorable para GPU.",
  },
  stencilRegular: {
    en: "Regular stencil pattern detected; suitable for GPU parallelization.",
    es: "Se detectó un patrón stencil regular; apto para paralelización en GPU.",
  },
  noRecursion: {
    en: "No recursion detected; iterative structure facilitates parallelization.",
    es: "No se detectó recursión; la estructura iterativa facilita la paralelización.",
  },
  deepNested: {
    en: "Nested loops with homogeneous work are favorable for GPU.",
    es: "Ciclos anidados con trabajo homogéneo son favorables para GPU.",
  },
  reductionDetected: {
    en: "Scalar reduction detected; parallelizable with a parallel reduction scheme.",
    es: "Se detectó una reducción escalar; podría paralelizarse con un esquema de reducción.",
  },
  divideConquerBalanced: {
    en: "Balanced divide-and-conquer: independent branches can be parallelized as tasks.",
    es: "Divide-and-conquer balanceado: las ramas independientes pueden paralelizarse como tareas.",
  },
  // Reasons negative
  loopCarriedDep: {
    en: "The algorithm accumulates state between iterations, introducing sequential dependency.",
    es: "El algoritmo actualiza estado acumulado entre iteraciones, lo que introduce dependencia secuencial.",
  },
  highBranch: {
    en: "High branch density inside loops causes thread divergence, unfavorable for GPU.",
    es: "Alta densidad de condicionales dentro de ciclos genera divergencia de hilos, desfavorable para GPU.",
  },
  irregularMemory: {
    en: "Memory access appears indirect or irregular, reducing expected GPU efficiency.",
    es: "El acceso a memoria parece indirecto o irregular, lo que reduce la eficiencia esperada en GPU.",
  },
  recursionSerial: {
    en: "Recursion without balanced fan-out limits opportunities for data parallelism.",
    es: "La recursión sin fan-out balanceado limita las oportunidades de paralelismo de datos.",
  },
  // Blockers
  earlyReturnBlocker: {
    en: "Early return inside the main loop: incompatible with uniform SIMD execution.",
    es: "Retorno anticipado dentro del ciclo principal: incompatible con ejecución SIMD uniforme.",
  },
  whileDataDepBlocker: {
    en: "WHILE loop with data-dependent exit condition may generate unpredictable divergence.",
    es: "Ciclo WHILE con condición de salida dependiente de datos puede generar divergencia impredecible.",
  },
  loopCarriedBlocker: {
    en: "Loop-carried dependency: iteration N+1 depends on the result of iteration N.",
    es: "Dependencia arrastrada entre iteraciones: la iteración N+1 depende del resultado de la N.",
  },
  indirectIndexBlocker: {
    en: "Indirect indexing (A[B[i]]) prevents memory coalescing on GPU.",
    es: "Indexado indirecto (A[B[i]]) impide la coalescencia de memoria en GPU.",
  },
  graphTraversalBlocker: {
    en: "Graph or pointer traversal: irregular memory pattern not suitable for GPU kernels.",
    es: "Recorrido de grafos o cadena de punteros: patrón de memoria irregular no apto para kernels GPU.",
  },
  unbalancedRecBlocker: {
    en: "Unbalanced or pruning-heavy recursion: unsuitable for data-parallel GPU model.",
    es: "Recursión desbalanceada o con poda activa: no apta para el modelo de paralelismo de datos GPU.",
  },
  // Opportunities
  parallelReductionOpp: {
    en: "Reduction pattern could be parallelized with a tree-based parallel reduction.",
    es: "El patrón de reducción podría paralelizarse con una reducción paralela en árbol.",
  },
  divideConquerTaskOpp: {
    en: "Independent recursive branches could be dispatched as parallel tasks (task parallelism).",
    es: "Las ramas recursivas independientes podrían despacharse como tareas paralelas (paralelismo de tareas).",
  },
  prefixScanOpp: {
    en: "Sequential prefix sum could be replaced by a parallel scan algorithm.",
    es: "La suma de prefijos secuencial podría reemplazarse por un algoritmo de escaneo paralelo.",
  },
  // Summaries
  summaryGpu: {
    en: "The structure is well-suited for GPU execution: independent iterations, regular memory, and no sequential dependencies.",
    es: "La estructura es adecuada para ejecución en GPU: iteraciones independientes, memoria regular y sin dependencias secuenciales.",
  },
  summaryCpu: {
    en: "The structure is better suited for CPU execution due to sequential dependencies, irregular control flow, or recursion.",
    es: "La estructura es más adecuada para ejecución en CPU por dependencias secuenciales, control irregular o recursión.",
  },
  summaryHybrid: {
    en: "A hybrid approach (CPU for control, GPU for parallel sub-tasks) may be most effective.",
    es: "Un enfoque híbrido (CPU para el control, GPU para sub-tareas paralelas) puede ser el más efectivo.",
  },
  summaryInconclusive: {
    en: "The analysis could not determine a clear hardware preference; proceeding with CPU as a safe default.",
    es: "El análisis no pudo determinar una preferencia de hardware clara; se usa CPU como valor predeterminado seguro.",
  },
};

function t(key: keyof typeof T, locale: Locale): string {
  return T[key][locale];
}

export function buildExplanations(
  features: HardwareFeatures,
  deps: DependencyProfile,
  patterns: PatternCandidate[],
  engine: EngineOutput,
  locale: Locale
): Pick<HardwareSuitabilityReport, "summary" | "reasons" | "evidence" | "diagnostics"> {
  const positive: string[] = [];
  const negative: string[] = [];
  const blockers: string[] = [];
  const opportunities: string[] = [];

  // ── Blockers (from vetoes) ──
  for (const veto of engine.vetoes) {
    switch (veto.reason) {
      case "Early return inside loop": blockers.push(t("earlyReturnBlocker", locale)); break;
      case "While loop with data-dependent condition": blockers.push(t("whileDataDepBlocker", locale)); break;
      case "Loop-carried dependency": blockers.push(t("loopCarriedBlocker", locale)); break;
      case "Indirect indexed access dominates": blockers.push(t("indirectIndexBlocker", locale)); break;
      case "Graph/pointer traversal": blockers.push(t("graphTraversalBlocker", locale)); break;
      case "Unbalanced recursion with pruning": blockers.push(t("unbalancedRecBlocker", locale)); break;
    }
  }

  // ── Positive signals ──
  const topPattern = patterns[0]?.name ?? "";
  if (topPattern === "map element-wise") {
    positive.push(t("independentIterations", locale));
    if (features.memoryRegularity === "regular") positive.push(t("regularContiguous", locale));
    if (!features.hasRecursion) positive.push(t("noRecursion", locale));
  }
  if (topPattern === "stencil") positive.push(t("stencilRegular", locale));
  if (topPattern === "nested rectangular loops") positive.push(t("deepNested", locale));
  if (topPattern === "reduction") positive.push(t("reductionDetected", locale));
  if (topPattern === "divide and conquer balanced") positive.push(t("divideConquerBalanced", locale));
  if (!features.hasRecursion && features.loopCarriedDependencies === 0 && engine.primaryRecommendation === "gpu") {
    positive.push(t("noRecursion", locale));
  }

  // ── Negative signals ──
  if (features.loopCarriedDependencies > 0) negative.push(t("loopCarriedDep", locale));
  if (features.branchDensityInsideLoops > 0.5) negative.push(t("highBranch", locale));
  if (features.memoryRegularity === "irregular") negative.push(t("irregularMemory", locale));
  if (features.hasRecursion && !features.hasDivideAndConquerShape) negative.push(t("recursionSerial", locale));

  // ── Opportunities ──
  if (topPattern === "reduction" || features.scalarReductions > 0) opportunities.push(t("parallelReductionOpp", locale));
  if (features.hasDivideAndConquerShape && features.recursiveFanOut >= 2) opportunities.push(t("divideConquerTaskOpp", locale));
  if (features.scalarReductions > 0 && features.mapLikeWrites === 0 && features.loopCarriedDependencies > 0) {
    opportunities.push(t("prefixScanOpp", locale));
  }

  // ── Summary ──
  let summary: string;
  switch (engine.internalVerdict) {
    case "gpu": summary = t("summaryGpu", locale); break;
    case "cpu": summary = t("summaryCpu", locale); break;
    case "hybrid": summary = t("summaryHybrid", locale); break;
    default: summary = t("summaryInconclusive", locale);
  }

  // ── Pattern evidence items ──
  const patternEvidence: EvidenceItem[] = patterns.map((p) => ({
    kind: "pattern" as const,
    message: `Pattern '${p.name}' detected (confidence: ${(p.confidence * 100).toFixed(0)}%)`,
  }));

  const allEvidence: EvidenceItem[] = [...engine.evidence, ...patternEvidence];

  return {
    summary,
    reasons: { positive, negative, blockers, opportunities },
    evidence: allEvidence,
    diagnostics: {
      controlRegularity: features.controlRegularity,
      memoryRegularity: features.memoryRegularity,
      dependencyStrength: features.dependencyStrength,
      parallelismType:
        engine.primaryRecommendation === "gpu"
          ? "data"
          : engine.primaryRecommendation === "hybrid"
          ? "mixed"
          : features.hasDivideAndConquerShape
          ? "task"
          : "limited",
    },
  };
}
