import { render } from "@testing-library/react";
import React from "react";
import { vi } from "vitest";

import { ExamplesTypeSelector } from "@/components/examples/ExamplesTypeSelector";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const labels: Record<string, string> = {
      "examples.categories.iterativos.label": "Iterativos",
      "examples.categories.divide-y-venceras.label": "Divide y vencerás",
      "examples.categories.resta-y-venceras.label": "Resta y vencerás",
      "examples.categories.resta-y-seras-vencido.label": "Resta y serás vencido",
      "examples.categories.iterativos.offText":
        "Resuelven el problema con ciclos y actualizaciones paso a paso.",
      "examples.categories.divide-y-venceras.offText":
        "Parten el problema en varias partes más pequeñas, las resuelven y luego combinan el resultado.",
      "examples.categories.resta-y-venceras.offText":
        "Reducen el problema a una versión más pequeña del mismo y repiten hasta llegar al caso base.",
      "examples.categories.resta-y-seras-vencido.offText":
        "Avanzan restando una parte pequeña del problema en cada llamada, normalmente en recurrencias lineales.",
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

describe("ExamplesTypeSelector snapshot", () => {
  it("renders base selector layout", () => {
    const { container } = render(
      <ExamplesTypeSelector
        ctaLabel="Ver familia"
      />,
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
