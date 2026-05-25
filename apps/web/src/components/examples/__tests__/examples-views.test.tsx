import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { ExamplesCategoryView } from "@/components/examples/ExamplesCategoryView";
import { ExamplesHomeView } from "@/components/examples/ExamplesHomeView";

const runAnalysisMock = vi.fn().mockResolvedValue(undefined);
const finishNavigationMock = vi.fn();
const pushMock = vi.fn();
const embeddedAssistantLauncherMock = vi.fn();

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
        "kind.recursive": "Recursivo",
        "kind.iterative": "Iterativo",
        "examples.kind.recursive": "Recursivo",
        "examples.kind.iterative": "Iterativo",
        "examples.categories.iterative.title": "Iterativos",
        "examples.categories.divideAndConquer.title": "Divide y vencerás",
        "examples.categories.decreaseAndConquer.title": "Resta y vencerás",
        "examples.categories.decreaseAndGetConquered.title":
          "Resta y serás vencido",
        "examples.categories.dpTopDown.title": "Programación dinámica top-down",
        "examples.categories.dpBottomUp.title":
          "Programación dinámica bottom-up",
        "examples.categories.greedy.title": "Voraces",
        "examples.categories.backtracking.title": "Backtracking",
        "examples.categories.branchAndBound.title": "Branch and Bound",
        "examples.categories.iterative.summary": "Iterativos desc",
        "examples.categories.divideAndConquer.summary": "Divide desc",
        "examples.categories.decreaseAndConquer.summary": "Resta desc",
        "examples.categories.decreaseAndGetConquered.summary":
          "Resta constante desc",
        "examples.categories.dpTopDown.summary": "DP TD desc",
        "examples.categories.dpBottomUp.summary": "DP BU desc",
        "examples.categories.greedy.summary": "Greedy desc",
        "examples.categories.backtracking.summary": "Backtracking desc",
        "examples.categories.branchAndBound.summary": "B&B desc",
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

vi.mock("@/components/assistant/EmbeddedAssistantLauncher", () => ({
  EmbeddedAssistantLauncher: (props: unknown) => {
    embeddedAssistantLauncherMock(props);
    return <div data-testid="assistant-launcher" />;
  },
}));

describe("Examples views", () => {
  beforeEach(() => {
    runAnalysisMock.mockReset().mockResolvedValue(undefined);
    finishNavigationMock.mockReset();
    pushMock.mockReset();
    embeddedAssistantLauncherMock.mockReset();
  });

  it("shows top results dropdown and redirects from home", () => {
    render(<ExamplesHomeView page={1} />);

    fireEvent.change(screen.getByLabelText("buscar ejemplos"), {
      target: { value: "fibonacci" },
    });

    const launcherProps = embeddedAssistantLauncherMock.mock.calls.at(
      -1,
    )?.[0] as {
      assistantContext: {
        exampleSections?: Array<{ title: string }>;
        visibleExamples?: Array<{ title: string; source?: string }>;
      };
    };
    expect(launcherProps.assistantContext.exampleSections).toHaveLength(9);
    expect(
      launcherProps.assistantContext.exampleSections?.some(
        (section) => section.title === "Divide y vencerás",
      ),
    ).toBe(true);
    expect(
      launcherProps.assistantContext.visibleExamples?.[0]?.source,
    ).toContain("BEGIN");

    const firstResult = screen.getAllByRole("button", {
      name: /fibonacci/i,
    })[0];
    fireEvent.click(firstResult);
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock.mock.calls[0][0]).toMatch(/^\/examples\/.+\?example=.+/);
    expect(finishNavigationMock).toHaveBeenCalled();
  });

  it("shows method filters for categories with recursive methods and calls analyze", () => {
    render(<ExamplesCategoryView category="divide_and_conquer" />);

    const toggleFilters = screen.getByRole("button", { name: /Filtros/i });
    fireEvent.click(toggleFilters);

    fireEvent.click(
      screen.getByRole("button", { name: /Árbol de Recursión/i }),
    );

    const analyzeButtons = screen.getAllByRole("button", { name: /Analizar/i });
    fireEvent.click(analyzeButtons[0]);
    expect(runAnalysisMock).toHaveBeenCalledTimes(1);

    const launcherProps = embeddedAssistantLauncherMock.mock.calls.at(
      -1,
    )?.[0] as {
      assistantContext: {
        visibleExamples?: Array<{ title: string; source?: string }>;
      };
    };
    expect(
      launcherProps.assistantContext.visibleExamples?.length,
    ).toBeGreaterThan(0);
    expect(
      launcherProps.assistantContext.visibleExamples?.every((example) =>
        example.source?.includes("BEGIN"),
      ),
    ).toBe(true);
  });

  it("hides recursive method filters for iterative category", () => {
    render(<ExamplesCategoryView category="iterative" />);
    expect(screen.queryByText("Filtros")).not.toBeInTheDocument();
  });
});
