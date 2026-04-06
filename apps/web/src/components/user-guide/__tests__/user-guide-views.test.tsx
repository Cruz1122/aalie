import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserGuideLandingView } from "@/components/user-guide/UserGuideLandingView";
import { UserGuideModuleView } from "@/components/user-guide/UserGuideModuleView";
import {
  getUserGuideLandingFixture,
  getUserGuideModuleFixture,
} from "@/test/user-guide-fixtures";

const pushMock = vi.fn();
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
};

vi.mock("next-intl", () => ({
  useLocale: () => "es",
  useTranslations: (namespace?: string) => (key: string) =>
    translations[`${namespace}.${key}`] ?? key,
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
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
    pushMock.mockReset();
    startNavigationMock.mockReset();
    finishNavigationMock.mockReset();
    runAnalysisMock.mockReset();
    embeddedAssistantLauncherMock.mockReset();
    useContentProgressMock.mockReset();
    useSectionCompletionTrackingMock.mockReset();

    useContentProgressMock.mockReturnValue({
      moduleProgressById: {
        "mod-introduccion": 50,
        "mod-uso-del-editor": 33,
        "mod-sintaxis-de-la-gramatica": 66,
        "mod-analisis-de-complejidad": 0,
        "mod-ejemplos-rapidos": 0,
        "mod-solucion-de-problemas": 20,
      },
      spaceProgress: 28,
    });

    useSectionCompletionTrackingMock.mockReturnValue({
      activeSectionId: "sec-procedimientos-y-call",
      completedSectionIds: [
        "sec-procedimientos-y-call",
        "sec-variables-y-asignacion",
      ],
      percentage: 33,
    });
  });

  it("renders six guide modules from catalog metadata and searches across the full guide", () => {
    render(<UserGuideLandingView data={getUserGuideLandingFixture("es")} />);

    expect(
      screen.getAllByRole("link", { name: "Entrar al módulo" }),
    ).toHaveLength(6);
    expect(screen.getAllByRole("progressbar")).toHaveLength(6);
    expect(screen.getByText("Sintaxis de la gramática")).toBeInTheDocument();
    expect(finishNavigationMock).toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("buscar guía"), {
      target: { value: "semicolon" },
    });

    expect(
      screen.getByRole("button", { name: /missing semicolon/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /missing semicolon/i }));

    expect(startNavigationMock).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith(
      "/user-guide/solucion-de-problemas#missing-semicolon",
    );

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

  it("renders a full module page with toc, blocks, navigation and module-local search", () => {
    render(
      <UserGuideModuleView
        data={getUserGuideModuleFixture("sintaxis-de-la-gramatica", "es")}
      />,
    );

    expect(
      screen.queryByText("Sintaxis de la gramática"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Tabla de contenidos")).toBeInTheDocument();
    expect(screen.getAllByText("Procedimientos y CALL").length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getAllByText("Variables y asignación").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/CALL procesar\(A, n\);/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Módulo anterior/ }),
    ).toHaveAttribute("href", "/user-guide/uso-del-editor");
    expect(
      screen.getByRole("link", { name: /Siguiente módulo/ }),
    ).toHaveAttribute("href", "/user-guide/analisis-de-complejidad");

    fireEvent.change(screen.getByLabelText("buscar en módulo"), {
      target: { value: "CALL" },
    });

    expect(
      screen.getByRole("button", { name: /Procedimientos y CALL/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /missing semicolon/i }),
    ).not.toBeInTheDocument();

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
      "sec-procedimientos-y-call",
    );
    expect(launcherProps.assistantContext.guideSection?.title).toBe(
      "Procedimientos y CALL",
    );
  });
});
