/**
 * Utilidades para interpretar y presentar notaciones asintóticas.
 */

/**
 * Extrae el contenido interno de una notación asintótica.
 * Ej: "O(n log n)" -> "n log n"
 */
function extractNotationContent(notation: string): string {
  // Remover prefijos O(, Θ(, Ω( y paréntesis finales
  return notation
    .replace(/^[OΘΩ]\s*\(/i, "")
    .replace(/\)\s*$/, "")
    .replace(/\s*\\text\{[^}]*\}\s*/g, "") // Remover texto LaTeX adicional
    .trim();
}

/**
 * Determina si una notación contiene hipótesis o condiciones.
 */
function hasHypothesis(notation: string): boolean {
  const lower = notation.toLowerCase();
  return (
    lower.includes("para") ||
    lower.includes("constante") ||
    lower.includes("hipótesis") ||
    lower.includes("modelo") ||
    lower.includes("\\text{")
  );
}

/**
 * Determina si una notación es condicional (depende de parámetros).
 */
function isConditional(notation: string): boolean {
  const lower = notation.toLowerCase();
  return (
    (lower.includes("p") || lower.includes("q")) &&
    (lower.includes("constante") || lower.includes("> 0"))
  );
}

/**
 * Tipo de resultado de notación asintótica
 */
export interface AsymptoticNotationResult {
  notation: string; // La notación a mostrar (puede ser Θ, intervalo, o cota única)
  type: "theta" | "interval" | "single-bound";
  boundType: "exact" | "upper" | "lower" | "both";
  hasHypothesis: boolean;
  isConditional: boolean;
  chips: Array<{
    label: string;
    type: "hypothesis" | "conditional" | "model" | "bound-only";
  }>;
  tooltip?: string;
}

/**
 * Determina la mejor notación asintótica según las reglas de priorización.
 */
export function getBestAsymptoticNotation(
  caseType: "worst" | "best" | "average",
  totals: {
    big_theta?: string;
    big_o?: string;
    big_omega?: string;
    avg_model_info?: { mode: string; note: string };
    hypotheses?: string[];
    symbols?: Record<string, string>;
  },
): AsymptoticNotationResult {
  const chips: Array<{
    label: string;
    type: "hypothesis" | "conditional" | "model" | "bound-only";
  }> = [];
  let hasHypothesisFlag = false;
  let isConditionalFlag = false;

  // Detectar hipótesis y condiciones
  if (totals.hypotheses && totals.hypotheses.length > 0) {
    hasHypothesisFlag = true;
    chips.push({ label: "Hipótesis", type: "hypothesis" });
  }

  if (totals.avg_model_info) {
    const modelNote = totals.avg_model_info.note;
    if (modelNote.includes("uniforme (éxito)")) {
      chips.push({ label: "Modelo: uniforme (éxito)", type: "model" });
    } else if (modelNote.includes("uniforme") && modelNote.includes("q")) {
      chips.push({ label: "Modelo: uniforme (+ q)", type: "model" });
      isConditionalFlag = true;
    } else if (modelNote.includes("uniforme")) {
      chips.push({ label: "Modelo: uniforme", type: "model" });
    }
  }

  // Verificar si hay símbolos libres
  if (totals.symbols && Object.keys(totals.symbols).length > 0) {
    const hasProbSymbols = Object.keys(totals.symbols).some((key) =>
      ["p", "q", "r", "s", "t"].includes(key.toLowerCase()),
    );
    if (hasProbSymbols) {
      isConditionalFlag = true;
      if (!chips.some((c) => c.type === "conditional")) {
        chips.push({ label: "Condicional", type: "conditional" });
      }
    }
  }

  // Prioridad 1: Theta (cota exacta)
  if (totals.big_theta) {
    const thetaHasHyp = hasHypothesis(totals.big_theta);
    if (thetaHasHyp && !hasHypothesisFlag) {
      hasHypothesisFlag = true;
      if (!chips.some((c) => c.type === "hypothesis")) {
        chips.push({ label: "Hipótesis", type: "hypothesis" });
      }
    }

    const thetaIsCond = isConditional(totals.big_theta);
    if (thetaIsCond && !isConditionalFlag) {
      isConditionalFlag = true;
      if (!chips.some((c) => c.type === "conditional")) {
        chips.push({ label: "Condicional", type: "conditional" });
      }
    }

    return {
      notation: totals.big_theta,
      type: "theta",
      boundType: "exact",
      hasHypothesis: hasHypothesisFlag,
      isConditional: isConditionalFlag,
      chips,
    };
  }

  // Prioridad 2: Intervalo (Ω y O disponibles)
  const bigO = totals.big_o;
  const bigOmega = totals.big_omega;

  if (bigO && bigOmega) {
    const omegaContent = extractNotationContent(bigOmega);
    const oContent = extractNotationContent(bigO);

    // Normalizar para comparación (remover espacios, normalizar log)
    const normalizeForCompare = (s: string) =>
      s.replace(/\s+/g, "").toLowerCase();
    const omegaNorm = normalizeForCompare(omegaContent);
    const oNorm = normalizeForCompare(oContent);

    // Si ambas son iguales (o muy similares), podríamos tener Theta implícito
    if (
      omegaNorm === oNorm ||
      (omegaNorm.includes("n") &&
        oNorm.includes("n") &&
        !omegaNorm.includes("log") &&
        !oNorm.includes("log") &&
        omegaNorm.match(/n\^?\d*/)?.[0] === oNorm.match(/n\^?\d*/)?.[0])
    ) {
      // Si son iguales, mostrar como Theta
      // Verificar si hay hipótesis o condiciones en las notaciones
      const omegaHasHyp = hasHypothesis(bigOmega);
      const oHasHyp = hasHypothesis(bigO);
      const omegaIsCond = isConditional(bigOmega);
      const oIsCond = isConditional(bigO);

      const finalHasHyp = hasHypothesisFlag || omegaHasHyp || oHasHyp;
      const finalIsCond = isConditionalFlag || omegaIsCond || oIsCond;

      return {
        notation: `Θ(${omegaContent})`,
        type: "theta",
        boundType: "exact",
        hasHypothesis: finalHasHyp,
        isConditional: finalIsCond,
        chips,
      };
    }

    // Mostrar intervalo con formato más compacto
    return {
      notation: `Ω(${omegaContent}) ≤ T(n) ≤ O(${oContent})`,
      type: "interval",
      boundType: "both",
      hasHypothesis: hasHypothesisFlag,
      isConditional: isConditionalFlag,
      chips,
      tooltip: "Cota más ajustada conocida",
    };
  }

  // Prioridad 3: Cota única
  if (caseType === "best") {
    // Mejor caso: preferir Omega (cota inferior)
    if (bigOmega) {
      chips.push({ label: "Solo inferior", type: "bound-only" });
      return {
        notation: bigOmega,
        type: "single-bound",
        boundType: "lower",
        hasHypothesis: hasHypothesisFlag,
        isConditional: isConditionalFlag,
        chips,
      };
    }
    if (bigO) {
      chips.push({ label: "Solo superior", type: "bound-only" });
      return {
        notation: bigO,
        type: "single-bound",
        boundType: "upper",
        hasHypothesis: hasHypothesisFlag,
        isConditional: isConditionalFlag,
        chips,
      };
    }
  } else if (caseType === "worst") {
    // Peor caso: preferir Big O (cota superior)
    if (bigO) {
      chips.push({ label: "Solo superior", type: "bound-only" });
      return {
        notation: bigO,
        type: "single-bound",
        boundType: "upper",
        hasHypothesis: hasHypothesisFlag,
        isConditional: isConditionalFlag,
        chips,
      };
    }
    if (bigOmega) {
      chips.push({ label: "Solo inferior", type: "bound-only" });
      return {
        notation: bigOmega,
        type: "single-bound",
        boundType: "lower",
        hasHypothesis: hasHypothesisFlag,
        isConditional: isConditionalFlag,
        chips,
      };
    }
  } else {
    // Caso promedio: preferir Big O
    if (bigO) {
      chips.push({ label: "Solo superior", type: "bound-only" });
      return {
        notation: bigO,
        type: "single-bound",
        boundType: "upper",
        hasHypothesis: hasHypothesisFlag,
        isConditional: isConditionalFlag,
        chips,
      };
    }
    if (bigOmega) {
      chips.push({ label: "Solo inferior", type: "bound-only" });
      return {
        notation: bigOmega,
        type: "single-bound",
        boundType: "lower",
        hasHypothesis: hasHypothesisFlag,
        isConditional: isConditionalFlag,
        chips,
      };
    }
  }

  // Fallback: placeholder
  const placeholder =
    caseType === "best" ? "Ω(—)" : caseType === "worst" ? "O(—)" : "Θ(—)";
  return {
    notation: placeholder,
    type: "single-bound",
    boundType:
      caseType === "best" ? "lower" : caseType === "worst" ? "upper" : "exact",
    hasHypothesis: false,
    isConditional: false,
    chips: [],
  };
}
