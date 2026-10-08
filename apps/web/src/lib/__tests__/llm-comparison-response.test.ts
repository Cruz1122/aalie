import { describe, expect, it } from "vitest";

import { normalizeLlmComparisonResponse } from "@/lib/llm-comparison-response";

describe("normalizeLlmComparisonResponse", () => {
  it("keeps the canonical comparison contract intact", () => {
    const response = normalizeLlmComparisonResponse({
      analysis: {
        worst: { T_open: "n²", big_theta: "Θ(n²)" },
        best: { T_open: "n", big_theta: "Θ(n)" },
        avg: { T_open: "n", big_theta: "Θ(n)" },
      },
      note: "😊 Coincide",
    });

    expect(response).toMatchObject({
      analysis: {
        worst: { T_open: "n²", big_theta: "Θ(n²)" },
        best: { T_open: "n", big_theta: "Θ(n)" },
        avg: { T_open: "n", big_theta: "Θ(n)" },
      },
      note: "😊 Coincide",
    });
  });

  it("unwraps provider nesting and common case/field aliases", () => {
    const response = normalizeLlmComparisonResponse({
      analysis: {
        worst_case: {
          timeComplexity: {
            tOpen: "7n^2 - n - 2",
            polynomialForm: "7n^2 - n - 2",
            bigO: "O(n^2)",
            bigOmega: "Ω(n^2)",
            bigTheta: "Θ(n^2)",
          },
        },
        bestCase: {
          time_complexity: {
            efficiency_equation: "(2/7)n^2 + (2/5)n - 2",
            bigO: "O(n^2)",
            bigOmega: "Ω(n^2)",
            bigTheta: "Θ(n^2)",
          },
        },
        average_case: {
          time_complexity: {
            tPolynomial: "(4/21)n^2 + (4/3)n - 2",
            bigO: "O(n^2)",
            bigOmega: "Ω(n^2)",
            bigTheta: "Θ(n^2)",
          },
        },
      },
      observation: "😊 El análisis coincide",
    });

    expect(response).toMatchObject({
      analysis: {
        worst: {
          T_open: "7n^2 - n - 2",
          T_polynomial: "7n^2 - n - 2",
          big_o: "O(n^2)",
          big_omega: "Ω(n^2)",
          big_theta: "Θ(n^2)",
        },
        best: {
          T_open: "(2/7)n^2 + (2/5)n - 2",
          big_o: "O(n^2)",
          big_omega: "Ω(n^2)",
          big_theta: "Θ(n^2)",
        },
        avg: {
          T_polynomial: "(4/21)n^2 + (4/3)n - 2",
          big_o: "O(n^2)",
          big_omega: "Ω(n^2)",
          big_theta: "Θ(n^2)",
        },
      },
      note: "😊 El análisis coincide",
    });
  });

  it("supports time_complexity.analysis as the response container", () => {
    const response = normalizeLlmComparisonResponse({
      time_complexity: {
        analysis: {
          worst_case: {
            T_open: "n²",
            bigTheta: "Θ(n²)",
          },
        },
        comment: "😐 Falta el caso promedio",
      },
    });

    expect(response).toMatchObject({
      analysis: {
        worst: { T_open: "n²", big_theta: "Θ(n²)" },
      },
      note: "😐 Falta el caso promedio",
    });
  });
});
