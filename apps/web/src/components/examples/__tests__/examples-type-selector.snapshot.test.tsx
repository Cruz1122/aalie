import { render } from "@testing-library/react";
import React from "react";
import { vi } from "vitest";

import { ExamplesTypeSelector } from "@/components/examples/ExamplesTypeSelector";

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
        locale="es"
        ctaLabel="Ver familia"
      />,
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
