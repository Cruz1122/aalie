import { describe, expect, it } from "vitest";

import { translateLlmError } from "@/lib/llm-error-translator";

describe("translateLlmError", () => {
  it("recognizes truncated structured output", () => {
    expect(
      translateLlmError(
        "La respuesta del proveedor LLM fue truncada por el límite de tokens",
      ),
    ).toBe("llmErrorOutputTruncated");
  });

  it("recognizes invalid model IDs", () => {
    expect(
      translateLlmError("model debe ser un identificador de modelo válido"),
    ).toBe("llmErrorModel");
  });
});
