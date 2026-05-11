import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { QuizDashboardView } from "../QuizDashboardView";

vi.mock("next-intl", () => ({
  useLocale: () => "es",
  useTranslations:
    () => (key: string, values?: Record<string, string | number>) => {
      if (key === "title") return "My Quizzes";
      if (key === "subtitle") return "Review progress.";
      if (key === "emptyCentered.message")
        return "Tu primer quiz te va a encantar. Comencemos ahora.";
      if (key === "emptyCentered.cta") return "Hacer mi primer quiz";
      if (key === "historyCard.completedWithScore") {
        return `Quiz completado con ${values?.correct}/${values?.total} respuestas correctas.`;
      }
      if (key === "historyCard.moduleLabel")
        return `Modulo: ${values?.moduleId}.`;
      if (key === "cards.practiceAreaTitle") return `Practicar ${values?.area}`;
      if (key === "cards.averageTitle") return `${values?.percent}% general`;
      if (key === "cards.latestTitle")
        return `${values?.percent}% en el ultimo quiz`;
      if (key === "cards.latestDescription")
        return `Respondiste ${values?.correct}/${values?.total} correctamente.`;
      return key;
    },
}));

const mockSearchParamsGet = vi.fn<(key: string) => string | null>(() => null);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({
    get: (key: string) => mockSearchParamsGet(key),
  }),
}));

vi.mock("../useQuizDashboard", () => ({
  useQuizDashboard: () => ({
    isLoaded: true,
    metrics: {
      totalAttempts: 0,
      averageAccuracy: 0,
      recentAttempts: [],
      topStrengths: [],
      topAreasToImprove: [],
    },
    attempts: [],
    progress: {
      masteryBySkill: {},
      recentQuestionIds: [],
      weakSkillIds: [],
      lastFailedSkillIds: [],
      lastFailedTopicIds: [],
      updatedAt: Date.now(),
    },
    reload: vi.fn(),
  }),
}));

vi.mock("@/components/Header", () => ({
  default: () => <header data-testid="header" />,
}));

vi.mock("@/components/Footer", () => ({
  default: () => <footer data-testid="footer" />,
}));

vi.mock("@/components/assistant/EmbeddedAssistantLauncher", () => ({
  EmbeddedAssistantLauncher: () => (
    <div data-testid="embedded-assistant-launcher" />
  ),
}));

vi.mock("@/hooks/useAssistantAvailability", () => ({
  useAssistantAvailability: () => ({
    hasAny: true,
    hasLocalStorage: true,
    hasServer: false,
    isChecking: false,
  }),
}));

vi.mock("@/hooks/useRunAnalysis", () => ({
  useRunAnalysis: () => ({ runAnalysis: vi.fn() }),
}));

vi.mock("@/features/quizzes/session/QuizSessionView", () => ({
  QuizSessionView: () => <div data-testid="quiz-session-view" />,
}));

vi.mock("../StartQuizModal", () => ({
  StartQuizModal: () => <div data-testid="start-modal" />,
}));

describe("QuizDashboardView", () => {
  beforeEach(() => {
    mockSearchParamsGet.mockReset();
    mockSearchParamsGet.mockImplementation(() => null);
  });

  it("renders the institutional shell", () => {
    render(<QuizDashboardView locale="es" />);

    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  it("renders empty quiz state as a centered message", () => {
    const { container } = render(<QuizDashboardView locale="es" />);

    expect(
      container.querySelector(".documentation-grid"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/primer quiz te va a encantar/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /hacer mi primer quiz/i }),
    ).toBeInTheDocument();
  });

  it("does not render a dashboard hero block", () => {
    const { container } = render(<QuizDashboardView locale="es" />);

    const hero = container.querySelector("header.glass-card");
    expect(hero).not.toBeInTheDocument();
  });

  it("mounts embedded assistant on dashboard", () => {
    render(<QuizDashboardView locale="es" />);

    expect(
      screen.getByTestId("embedded-assistant-launcher"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("quiz-session-view")).not.toBeInTheDocument();
  });

  it("hides embedded assistant while quiz session is active", async () => {
    mockSearchParamsGet.mockImplementation((key) =>
      key === "start" ? "1" : null,
    );

    render(<QuizDashboardView locale="es" />);

    await waitFor(() => {
      expect(screen.getByTestId("quiz-session-view")).toBeInTheDocument();
    });
    expect(
      screen.queryByTestId("embedded-assistant-launcher"),
    ).not.toBeInTheDocument();
  });
});
