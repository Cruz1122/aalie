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
  useTranslations: () =>
    (key: string) => {
      const labels: Record<string, string> = {
        title: "Catalogo",
        subtitle: "Subtitulo",
        typeSelectorTitle: "Tipo",
        typeSelectorSubtitle: "Tipo subtitulo",
        viewFamily: "Ver familia",
        globalSearchTitle: "Busqueda global",
        globalSearchSubtitle: "Busqueda subtitulo",
        searchPlaceholder: "buscar",
        searchAriaLabel: "buscar ejemplos",
        emptyTitle: "Sin resultados",
        emptyDescription: "Sin coincidencias",
        viewAlgorithm: "Ver algoritmo",
        hideAlgorithm: "Ocultar algoritmo",
        analyze: "Analizar",
        analyzing: "Analizando...",
        categoryPanelTitle: "Panel",
        filtersTitle: "Filtros",
        categorySummary: "Resumen categoria",
        catalogSummary: "Resumen catalogo",
      };
      return labels[key] ?? key;
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
  default: ({ href, children, className }: { href: string; children: ReactNode; className?: string }) => (
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

    fireEvent.click(screen.getByRole("button", { name: /Árbol de Recursión/i }));

    const analyzeButtons = screen.getAllByRole("button", { name: /Analizar/i });
    fireEvent.click(analyzeButtons[0]);
    expect(runAnalysisMock).toHaveBeenCalledTimes(1);
  });

  it("hides recursive method filters for iterative category", () => {
    render(<ExamplesCategoryView category="iterativos" />);
    expect(screen.queryByText("Filtros")).not.toBeInTheDocument();
  });
});
