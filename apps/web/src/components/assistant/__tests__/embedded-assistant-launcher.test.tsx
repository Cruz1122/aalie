import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EmbeddedAssistantLauncher } from "@/components/assistant/EmbeddedAssistantLauncher";

const mockUseAssistantAvailability = vi.fn();

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) =>
    (
      {
        launcherAriaLabel: "Open analysis assistant",
        embeddedFrameTitle: "Embedded analysis assistant",
      } as Record<string, string>
    )[key] ?? key,
}));

vi.mock("@/hooks/useAssistantAvailability", () => ({
  useAssistantAvailability: () => mockUseAssistantAvailability(),
}));

describe("EmbeddedAssistantLauncher", () => {
  beforeEach(() => {
    mockUseAssistantAvailability.mockReset();
  });

  it("stays hidden when there is no configured API key and the panel is closed", () => {
    mockUseAssistantAvailability.mockReturnValue({
      hasAny: false,
      hasLocalStorage: false,
      hasServer: false,
      isChecking: false,
    });

    const { container } = render(
      <EmbeddedAssistantLauncher
        surface="examples"
        assistantContext={{
          surface: "examples",
          locale: "en",
          pageContext: { route: "/examples" },
        }}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("opens the iframe panel when the launcher button is clicked", () => {
    mockUseAssistantAvailability.mockReturnValue({
      hasAny: true,
      hasLocalStorage: true,
      hasServer: false,
      isChecking: false,
    });

    render(
      <EmbeddedAssistantLauncher
        surface="analyzer"
        assistantContext={{
          surface: "analyzer",
          locale: "en",
          pageContext: { route: "/analyzer" },
        }}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Open analysis assistant" }),
    );

    expect(
      screen.getByTitle("Embedded analysis assistant"),
    ).toBeInTheDocument();
  });

  it("keeps the iframe mounted but hidden when the launcher is closed", () => {
    mockUseAssistantAvailability.mockReturnValue({
      hasAny: true,
      hasLocalStorage: true,
      hasServer: false,
      isChecking: false,
    });

    render(
      <EmbeddedAssistantLauncher
        surface="analyzer"
        assistantContext={{
          surface: "analyzer",
          locale: "en",
          pageContext: { route: "/analyzer" },
        }}
      />,
    );

    const launcher = screen.getByRole("button", {
      name: "Open analysis assistant",
    });

    fireEvent.click(launcher);
    expect(
      screen.getByTitle("Embedded analysis assistant"),
    ).toBeInTheDocument();

    fireEvent.click(launcher);
    expect(
      screen.getByTitle("Embedded analysis assistant"),
    ).toBeInTheDocument();
    expect(
      screen.getByTitle("Embedded analysis assistant").parentElement
        ?.parentElement,
    ).toHaveAttribute("hidden");
  });
});
