import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import MarkdownRenderer from "@/components/MarkdownRenderer";

describe("MarkdownRenderer", () => {
  it("renders highlighted inline math as code-styled text with real subscripts/superscripts", () => {
    const { container } = render(<MarkdownRenderer content={"`C_x`"} />);

    expect(container.querySelector("code")).not.toBeNull();
    expect(container.querySelector("sub")).not.toBeNull();
    expect(container.textContent).toContain("Cx");
  });

  it("renders inline markdown math as a code-styled token", () => {
    const { container } = render(<MarkdownRenderer content={"$C_x$"} />);

    expect(container.querySelector("code")).not.toBeNull();
    expect(container.querySelector("sub")).not.toBeNull();
    expect(container.textContent).toContain("Cx");
  });

  it("keeps richer inline math as latex in auto mode", () => {
    const { container } = render(
      <MarkdownRenderer content={"$T(n) = 3n + 4$"} />,
    );

    expect(container.querySelector("code")).toBeNull();
    expect(container.querySelector(".katex")).not.toBeNull();
  });

  it("keeps non-latex highlighted inline terms as inline code", () => {
    const { container, getByText } = render(
      <MarkdownRenderer content={"`A[i]`"} />,
    );

    expect(getByText("A[i]")).toBeInTheDocument();
    expect(container.querySelector("code")).not.toBeNull();
  });

  it("keeps regular underscored identifiers as inline code", () => {
    const { container, getByText } = render(
      <MarkdownRenderer content={"`foo_bar`"} />,
    );

    expect(getByText("foo_bar")).toBeInTheDocument();
    expect(container.querySelector("sub")).toBeNull();
  });

  it("can force latex for compact inline math", () => {
    const { container } = render(
      <MarkdownRenderer content={"$C_x$"} inlineMathMode="latex" />,
    );

    expect(container.querySelector("code")).toBeNull();
    expect(container.querySelector(".katex")).not.toBeNull();
  });

  it("can force plain inline code for math-looking backticks", () => {
    const { container, getByText } = render(
      <MarkdownRenderer content={"`C_x`"} inlineCodeMathMode="inline" />,
    );

    expect(getByText("C_x")).toBeInTheDocument();
    expect(container.querySelector("sub")).toBeNull();
  });

  it("renders display math as a KaTeX block instead of a code block", () => {
    const { container } = render(
      <MarkdownRenderer
        content={String.raw`$$
n^2
$$`}
      />,
    );

    expect(container.querySelector("pre")).toBeNull();
    expect(container.querySelector(".katex-display")).not.toBeNull();
  });
});
