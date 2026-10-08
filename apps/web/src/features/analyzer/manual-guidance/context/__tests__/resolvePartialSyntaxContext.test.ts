import { resolvePartialSyntaxContext } from "../resolvePartialSyntaxContext";

describe("resolvePartialSyntaxContext", () => {
  it("recognizes an incomplete signature", () => {
    expect(resolvePartialSyntaxContext("buscar(", 7).primary).toBe(
      "PARAMETER_LIST",
    );
  });

  it("recognizes incomplete assignment expressions inside a procedure", () => {
    const source = "buscar(n) BEGIN\n  resultado <- ";
    const result = resolvePartialSyntaxContext(source, source.length);

    expect(result.primary).toBe("EXPRESSION");
    expect(result.insideProcedure).toBe(true);
    expect(result.insideBlock).toBe(true);
  });
});
