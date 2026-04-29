import { render, screen } from "@testing-library/react";
import React from "react";
import { vi } from "vitest";

import { ExamplesTypeSelector } from "@/components/examples/ExamplesTypeSelector";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const labels: Record<string, string> = {
      "examples.categories.iterative.title": "Iterativos",
      "examples.categories.divideAndConquer.title": "Divide y vencerás",
      "examples.categories.decreaseAndConquer.title": "Resta y vencerás",
      "examples.categories.decreaseAndGetConquered.title":
        "Resta y serás vencido",
      "examples.categories.iterative.summary":
        "Resuelven el problema con ciclos y actualizaciones paso a paso.",
      "examples.categories.divideAndConquer.summary":
        "Parten el problema en varias partes más pequeñas, las resuelven y luego combinan el resultado.",
      "examples.categories.decreaseAndConquer.summary":
        "Reducen el problema con una sola llamada dominante y reducción aditiva.",
      "examples.categories.decreaseAndGetConquered.summary":
        "Abren varias ramas recursivas con reducción aditiva.",
    };
    return labels[key] ?? key;
  },
}));

vi.mock("@/components/NavigationLink", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("ExamplesTypeSelector", () => {
  it("renders selected technique cards with the new public slugs", () => {
    render(
      <ExamplesTypeSelector
        ctaLabel="Ver familia"
        categories={[
          "iterative",
          "divide_and_conquer",
          "decrease_and_conquer",
        ]}
      />,
    );

    expect(screen.getByText("Iterativos")).toBeInTheDocument();
    expect(screen.getByText("Divide y vencerás")).toBeInTheDocument();
    expect(screen.getByText("Resta y vencerás")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Ver familia/i })[0]).toHaveAttribute(
      "href",
      "/examples/iterative",
    );
  });
});
