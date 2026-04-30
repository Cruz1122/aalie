import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { MermaidDiagramBlock } from "../MermaidDiagramBlock";

const mermaidInitializeMock = vi.fn();
const mermaidRenderMock = vi.fn();

vi.mock("mermaid", () => ({
  default: {
    initialize: mermaidInitializeMock,
    render: mermaidRenderMock,
  },
}));

describe("MermaidDiagramBlock", () => {
  beforeEach(() => {
    mermaidInitializeMock.mockReset();
    mermaidRenderMock.mockReset();
  });

  it("renderiza diagrama Mermaid y muestra acciones", async () => {
    mermaidRenderMock.mockResolvedValue({
      svg: "<svg><text>Tree</text></svg>",
    });

    render(
      <MermaidDiagramBlock
        block={{
          id: "blk-mermaid-test",
          type: "mermaid",
          title: "Diagrama de prueba",
          code: "flowchart TD\nA-->B",
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Mermaid diagram")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Copiar Mermaid" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Ampliar" })).toBeVisible();
  });

  it("usa fallback cuando Mermaid falla", async () => {
    mermaidRenderMock.mockRejectedValue(new Error("invalid syntax"));

    render(
      <MermaidDiagramBlock
        block={{
          id: "blk-mermaid-invalid",
          type: "mermaid",
          title: "Diagrama inválido",
          code: "flowchart TD\nA--->",
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Mermaid inválido. Mostrando código fuente.")).toBeVisible();
    });
    expect(screen.getByText(/invalid syntax/i)).toBeVisible();
  });

  it("permite copiar código y ampliar", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });
    mermaidRenderMock.mockResolvedValue({
      svg: "<svg><text>Tree</text></svg>",
    });

    render(
      <MermaidDiagramBlock
        block={{
          id: "blk-mermaid-copy",
          type: "mermaid",
          title: "Diagrama",
          code: "flowchart TD\nA-->B",
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Copiar Mermaid" })).toBeVisible();
    });

    fireEvent.click(screen.getByRole("button", { name: "Copiar Mermaid" }));
    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith("flowchart TD\nA-->B");
    });

    fireEvent.click(screen.getByRole("button", { name: "Ampliar" }));
    expect(screen.getByRole("button", { name: "Cerrar" })).toBeVisible();
  });
});
