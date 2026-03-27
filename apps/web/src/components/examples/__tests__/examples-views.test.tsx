import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { ExamplesCategoryView } from "@/components/examples/ExamplesCategoryView";
import { ExamplesHomeView } from "@/components/examples/ExamplesHomeView";

const runAnalysisMock = vi.fn();
const finishNavigationMock = vi.fn();
const pushMock = vi.fn();

vi.mock("next-intl", () => ({
  useLocale: () => "es",
  useTranslations: (namespace?: string) => {
    const translator = (key: string) => {
      const labels: Record<string, string> = {
        title: "Catalogo",
        subtitle: "Subtitulo",
        viewFamily: "Ver familia",
        searchPlaceholder: "buscar",
        searchAriaLabel: "buscar ejemplos",
        emptyTitle: "Sin resultados",
        emptyDescription: "Sin coincidencias",
        viewAlgorithm: "Ver algoritmo",
        hideAlgorithm: "Ocultar algoritmo",
        analyze: "Analizar",
        analyzing: "Analizando...",
        filtersTitle: "Filtros",
        "examples.kind.recursive": "Recursivo",
        "examples.kind.iterative": "Iterativo",
        "examples.categories.iterativos.label": "Iterativos",
        "examples.categories.divide-y-venceras.label": "Divide y vencerás",
        "examples.categories.resta-y-venceras.label": "Resta y vencerás",
        "examples.categories.resta-y-seras-vencido.label":
          "Resta y serás vencido",
        "examples.categories.iterativos.offText": "Iterativos desc",
        "examples.categories.divide-y-venceras.offText": "Divide desc",
        "examples.categories.resta-y-venceras.offText": "Resta desc",
        "examples.categories.resta-y-seras-vencido.offText":
          "Resta constante desc",
        "examples.families.busqueda": "Búsqueda",
        "examples.families.ordenamiento": "Ordenamiento",
        "examples.families.matrices": "Matrices",
        "examples.families.numerico": "Numérico",
        "examples.families.geometria": "Geometría",
        "examples.families.secuencias": "Secuencias",
        "examples.families.estructuras": "Estructuras",
        "examples.families.clasicos": "Clásicos",
        "analyzer.methods.masterTheorem": "Teorema Maestro",
        "analyzer.methods.iterationMethod": "Método de iteración",
        "analyzer.methods.recursionTree": "Árbol de Recursión",
        "analyzer.methods.characteristicEquation": "Ecuación Característica",
      };
      return labels[key] ?? key;
    };

    translator.raw = (key: string) => {
      if (namespace === "examples" && key === "catalogItems") {
        return {
          "fibonacci-recursivo": {
            title: "Fibonacci recursivo",
            summary: "Resumen de fibonacci",
            tags: ["fibonacci", "recursivo"],
          },
          "quick-sort": {
            title: "Ordenamiento rápido",
            summary: "Resumen quicksort",
            tags: ["ordenamiento", "divide y vencerás"],
          },
        };
      }
      return {};
    };

    return translator;
  },
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/contexts/NavigationContext", () => ({
  useNavigation: () => ({ finishNavigation: finishNavigationMock }),
}));

vi.mock("@/hooks/useRunAnalysis", () => ({
  useRunAnalysis: () => ({ runAnalysis: runAnalysisMock }),
}));

vi.mock("@/components/Header", () => ({
  default: () => <div data-testid="header" />,
}));

vi.mock("@/components/Footer", () => ({
  default: () => <div data-testid="footer" />,
}));

vi.mock("@/components/PageHeader", () => ({
  PageHeader: ({ children }: { children?: ReactNode }) => (
    <div data-testid="page-header">{children}</div>
  ),
}));

vi.mock("@/components/NavigationFooter", () => ({
  NavigationFooter: () => <div data-testid="nav-footer" />,
}));

vi.mock("@/components/NavigationLink", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("Examples views", () => {
  beforeEach(() => {
    runAnalysisMock.mockReset();
    finishNavigationMock.mockReset();
    pushMock.mockReset();
  });

  it("shows top results dropdown and redirects from home", () => {
    render(<ExamplesHomeView />);

    fireEvent.change(screen.getByLabelText("buscar ejemplos"), {
      target: { value: "fibonacci" },
    });

    const firstResult = screen.getByRole("button", { name: /fibonacci/i });
    fireEvent.click(firstResult);
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock.mock.calls[0][0]).toMatch(/^\/examples\/.+\?example=.+/);
    expect(finishNavigationMock).toHaveBeenCalled();
  });

  it("shows method filters for recursive category and calls analyze", () => {
    render(<ExamplesCategoryView category="divide-y-venceras" />);

    const toggleFilters = screen.getByRole("button", { name: /Filtros/i });
    fireEvent.click(toggleFilters);

    fireEvent.click(
      screen.getByRole("button", { name: /Árbol de Recursión/i }),
    );

    const analyzeButtons = screen.getAllByRole("button", { name: /Analizar/i });
    fireEvent.click(analyzeButtons[0]);
    expect(runAnalysisMock).toHaveBeenCalledTimes(1);
  });

  it("hides recursive method filters for iterative category", () => {
    render(<ExamplesCategoryView category="iterativos" />);
    expect(screen.queryByText("Filtros")).not.toBeInTheDocument();
  });
});
