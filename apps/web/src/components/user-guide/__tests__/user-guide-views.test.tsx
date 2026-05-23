import { fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserGuideLandingView } from "@/components/user-guide/UserGuideLandingView";
import { UserGuideModuleView } from "@/components/user-guide/UserGuideModuleView";
import {
  getUserGuideLandingFixture,
  getUserGuideModuleFixture,
} from "@/test/user-guide-fixtures";

const startNavigationMock = vi.fn();
const finishNavigationMock = vi.fn();
const runAnalysisMock = vi.fn();
const embeddedAssistantLauncherMock = vi.fn();
const useContentProgressMock = vi.fn();
const useSectionCompletionTrackingMock = vi.fn();

const translations: Record<string, string> = {
  "contentUi.progress": "Progreso",
  "contentUi.globalProgress": "Progreso global",
  "contentUi.estimatedTime": "Tiempo estimado",
  "contentUi.openModule": "Entrar al módulo",
  "contentUi.moduleGrid": "Módulos de la guía",
  "contentUi.tableOfContents": "Tabla de contenidos",
  "contentUi.searchPlaceholder": "Buscar en la guía",
  "contentUi.searchAriaLabel": "buscar guía",
  "contentUi.searchWithinModulePlaceholder": "Buscar en este módulo",
  "contentUi.searchWithinModuleAriaLabel": "buscar en módulo",
  "contentUi.emptySearchTitle": "Sin resultados",
  "contentUi.emptySearchDescription": "No hay coincidencias",
  "contentUi.backToGuide": "Volver a la guía",
  "contentUi.previousModule": "Módulo anterior",
  "contentUi.nextModule": "Siguiente módulo",
  "contentUi.completed": "Completado",
  "contentUi.references": "Referencias",
  "contentUi.viewSolution": "Ver solución",
  "contentUi.brokenLinkTooltip": "Contenido no disponible",
};

vi.mock("next-intl", () => ({
  useLocale: () => "es",
  useTranslations: (namespace?: string) => (key: string) =>
    translations[`${namespace}.${key}`] ?? key,
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  Link: ({
    href,
    children,
    className,
    title,
    onClick,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
    title?: string;
    onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  }) => (
    <a href={href} className={className} title={title} onClick={onClick}>
      {children}
    </a>
  ),
}));

vi.mock("@/contexts/NavigationContext", () => ({
  useNavigation: () => ({
    startNavigation: startNavigationMock,
    finishNavigation: finishNavigationMock,
  }),
}));

vi.mock("@/hooks/useRunAnalysis", () => ({
  useRunAnalysis: () => ({ runAnalysis: runAnalysisMock }),
}));

vi.mock("@/hooks/useContentProgress", () => ({
  useContentProgress: (...args: unknown[]) => useContentProgressMock(...args),
  useSectionCompletionTracking: (...args: unknown[]) =>
    useSectionCompletionTrackingMock(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/Header", () => ({
  default: () => <div data-testid="header" />,
}));

vi.mock("@/components/Footer", () => ({
  default: () => <div data-testid="footer" />,
}));

vi.mock("@/components/PageHeader", () => ({
  PageHeader: ({
    title,
    description,
    children,
  }: {
    title: string;
    description?: string;
    children?: ReactNode;
  }) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
      {children}
    </div>
  ),
}));

vi.mock("@/components/assistant/EmbeddedAssistantLauncher", () => ({
  EmbeddedAssistantLauncher: (props: unknown) => {
    embeddedAssistantLauncherMock(props);
    return <div data-testid="assistant-launcher" />;
  },
}));

describe("User guide views", () => {
  beforeEach(() => {
    startNavigationMock.mockReset();
    finishNavigationMock.mockReset();
    runAnalysisMock.mockReset();
    embeddedAssistantLauncherMock.mockReset();
    useContentProgressMock.mockReset();
    useSectionCompletionTrackingMock.mockReset();

    useContentProgressMock.mockReturnValue({
      moduleProgressById: {
        "mod-user-guide-getting-started": 40,
        "mod-user-guide-linear-search-analyzer": 50,
        "mod-user-guide-examples-bubble-sort": 33,
        "mod-user-guide-recursive-fibonacci": 0,
        "mod-user-guide-loop-and-recursive-invariants": 0,
        "mod-user-guide-export-pdf": 20,
        "mod-user-guide-ai-assistant": 0,
        "mod-user-guide-courses-progress": 10,
        "mod-user-guide-quizzes": 0,
      },
      spaceProgress: 20,
    });

    useSectionCompletionTrackingMock.mockReturnValue({
      activeSectionId: "sec-escribir-importar",
      completedSectionIds: ["sec-escribir-importar"],
      percentage: 33,
    });
  });

  it("renders nine guide modules from catalog metadata and navigates from the grid", () => {
    render(<UserGuideLandingView data={getUserGuideLandingFixture("es")} />);

    expect(
      screen.getAllByRole("link", { name: "Entrar al módulo" }),
    ).toHaveLength(9);
    expect(screen.getAllByRole("progressbar")).toHaveLength(9);
    expect(screen.getByText("Primer recorrido por AALIE")).toBeInTheDocument();
    expect(finishNavigationMock).toHaveBeenCalled();

    const firstArticle = screen
      .getByRole("heading", {
        name: /Primer recorrido por AALIE/i,
      })
      .closest("article");
    expect(firstArticle).toBeTruthy();
    const enterLink = within(firstArticle as HTMLElement).getByRole("link", {
      name: "Entrar al módulo",
    });
    expect(enterLink).toHaveAttribute("href", "/user-guide/getting-started");

    fireEvent.click(enterLink);

    expect(startNavigationMock).toHaveBeenCalled();

    const launcherProps = embeddedAssistantLauncherMock.mock.calls.at(
      -1,
    )?.[0] as {
      assistantContext: { pageContext?: { view?: string; route?: string } };
    };
    expect(launcherProps.assistantContext.pageContext?.view).toBe("guide-grid");
    expect(launcherProps.assistantContext.pageContext?.route).toBe(
      "/user-guide",
    );
  });

  it("renders a full module page with sections, blocks and prev/next navigation", () => {
    render(
      <UserGuideModuleView
        data={getUserGuideModuleFixture("linear-search-analyzer", "es")}
      />,
    );

    expect(
      screen.queryByText("Analiza un algoritmo paso a paso"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Tabla de contenidos")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("buscar en módulo")).not.toBeInTheDocument();
    expect(screen.getAllByText(/Búsqueda lineal/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/escribir|autocompletar|importar/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/tabla de costos por línea/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("heading", {
        name: /AST y seguimiento paso a paso/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Módulo anterior/ }),
    ).toHaveAttribute("href", "/user-guide/getting-started");
    expect(
      screen.getByRole("link", { name: /Siguiente módulo/ }),
    ).toHaveAttribute("href", "/user-guide/examples-bubble-sort");

    const launcherProps = embeddedAssistantLauncherMock.mock.calls.at(
      -1,
    )?.[0] as {
      assistantContext: {
        guideSection?: { id?: string; title?: string };
        pageContext?: { view?: string };
      };
    };
    expect(launcherProps.assistantContext.pageContext?.view).toBe(
      "module-page",
    );
    expect(launcherProps.assistantContext.guideSection?.id).toBe(
      "sec-escribir-importar",
    );
    expect(launcherProps.assistantContext.guideSection?.title).toBe(
      "Escribir, autocompletar e importar código",
    );

    // Embedded content links
    const analyzerLink = screen.getByRole("link", {
      name: "Analizador General",
    });
    expect(analyzerLink).toHaveAttribute("href", "/analyzer");
  });

  it("renders embedded content links in English module", () => {
    render(
      <UserGuideModuleView
        data={getUserGuideModuleFixture("linear-search-analyzer", "en")}
      />,
    );

    // ES link should NOT be present
    expect(
      screen.queryByRole("link", { name: "Analizador General" }),
    ).not.toBeInTheDocument();

    // EN embedded link: "analyzer" points to /analyzer
    const analyzerLink = screen.getByRole("link", { name: "analyzer" });
    expect(analyzerLink).toHaveAttribute("href", "/analyzer");
  });
});
