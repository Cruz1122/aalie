import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { vi } from "vitest";

import { ExampleCatalogCard } from "@/components/examples/ExampleCatalogCard";
import { findExampleBySlug } from "@/lib/examples/catalog";

const example = findExampleBySlug("fibonacci-recursivo");
if (!example) {
  throw new Error("missing fixture example");
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
});
