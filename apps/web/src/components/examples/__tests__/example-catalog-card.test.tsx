import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { vi } from "vitest";

import { ExampleCatalogCard } from "@/components/examples/ExampleCatalogCard";
import { findExampleBySlug } from "@/lib/examples/catalog";

vi.mock("next-intl", () => ({
  useTranslations: () => {
    const translator = (key: string) => {
      const labels: Record<string, string> = {
        "examples.kind.recursive": "Recursivo",
        "examples.kind.iterative": "Iterativo",
        "examples.families.busqueda": "Búsqueda",
        "examples.families.ordenamiento": "Ordenamiento",
        "examples.families.matrices": "Matrices",
        "examples.families.numerico": "Numérico",
        "examples.families.geometria": "Geometría",
        "examples.families.secuencias": "Secuencias",
        "examples.families.estructuras": "Estructuras",
        "examples.families.clasicos": "Clásicos",
        "examples.categories.resta-y-seras-vencido.label":
          "Resta y serás vencido",
        "analyzer.methods.masterTheorem": "Teorema Maestro",
        "analyzer.methods.iterationMethod": "Método de iteración",
        "analyzer.methods.recursionTree": "Árbol de Recursión",
        "analyzer.methods.characteristicEquation": "Ecuación Característica",
      };
      return labels[key] ?? key;
    };

    translator.raw = (key: string) => {
      if (key === "examples.catalogItems") {
        return {
          "fibonacci-recursivo": {
            title: "Fibonacci recursivo",
            summary: "Resumen de fibonacci",
            tags: ["fibonacci", "recursivo"],
          },
        };
      }
      return {};
    };

    return translator;
  },
}));

const example = findExampleBySlug("fibonacci-recursivo");
if (!example) {
  throw new Error("missing fixture example");
}

const binaryExample = findExampleBySlug("binary-search-iterativa");
if (!binaryExample) {
  throw new Error("missing binary search fixture example");
}

describe("ExampleCatalogCard", () => {
  it("expands and collapses source code", () => {
    render(
      <ExampleCatalogCard
        example={example}
        locale="es"
        analyzingExampleId={null}
        onAnalyze={vi.fn()}
        viewLabel="Ver algoritmo"
        hideLabel="Ocultar algoritmo"
        analyzeLabel="Analizar"
        analyzingLabel="Analizando..."
      />,
    );

    expect(screen.queryByText("Pseudocode")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Ver algoritmo/i }));
    expect(screen.getByText("Pseudocode")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Ocultar algoritmo/i }));
    expect(screen.queryByText("Pseudocode")).not.toBeInTheDocument();
  });

  it("triggers analyze callback with the selected algorithm", () => {
    const onAnalyze = vi.fn();

    render(
      <ExampleCatalogCard
        example={example}
        locale="es"
        analyzingExampleId={null}
        onAnalyze={onAnalyze}
        viewLabel="Ver algoritmo"
        hideLabel="Ocultar algoritmo"
        analyzeLabel="Analizar"
        analyzingLabel="Analizando..."
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Analizar/i }));
    expect(onAnalyze).toHaveBeenCalledTimes(1);
    expect(onAnalyze.mock.calls[0][0].id).toBe(example.id);
  });

  it("renders english source code when the card locale is english", () => {
    render(
      <ExampleCatalogCard
        example={binaryExample}
        locale="en"
        analyzingExampleId={null}
        onAnalyze={vi.fn()}
        viewLabel="View algorithm"
        hideLabel="Hide algorithm"
        analyzeLabel="Analyze"
        analyzingLabel="Analyzing..."
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /View algorithm/i }));
    expect(
      screen.getByText(
        (_, node) =>
          node?.tagName === "CODE" &&
          (node.textContent?.includes("left <- 1;") ?? false),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, node) =>
          node?.tagName === "CODE" &&
          (node.textContent?.includes("WHILE (left <= right) DO BEGIN") ??
            false),
      ),
    ).toBeInTheDocument();
  });

  it("shows a tier chip when catalogTier is not contractual", () => {
    render(
      <ExampleCatalogCard
        example={{ ...example, catalogTier: "experimental" }}
        locale="es"
        analyzingExampleId={null}
        onAnalyze={vi.fn()}
        viewLabel="Ver algoritmo"
        hideLabel="Ocultar algoritmo"
        analyzeLabel="Analizar"
        analyzingLabel="Analizando..."
      />,
    );

    expect(screen.getByText(/Experimental/i)).toBeInTheDocument();
  });

  it("disables analyze button when catalogTier is blocked", () => {
    render(
      <ExampleCatalogCard
        example={{ ...example, catalogTier: "blocked" }}
        locale="es"
        analyzingExampleId={null}
        onAnalyze={vi.fn()}
        viewLabel="Ver algoritmo"
        hideLabel="Ocultar algoritmo"
        analyzeLabel="Analizar"
        analyzingLabel="Analizando..."
      />,
    );

    expect(screen.getByRole("button", { name: /Analizar/i })).toBeDisabled();
  });
});
