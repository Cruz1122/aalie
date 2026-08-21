import { extractSymbols } from "../extractSymbols";

describe("extractSymbols", () => {
  it("normalizes scalar, array, matrix, range and object parameters", () => {
    const source = "buscar(n, A[n][m], B[1]..[n], Clase objeto) BEGIN\nEND";
    const result = extractSymbols(source, source.length);

    expect(result.parameters.map((symbol) => symbol.name)).toEqual([
      "n",
      "A",
      "B",
      "objeto",
    ]);
  });

  it("extracts assignment and FOR targets without duplicates", () => {
    const source =
      "buscar(n) BEGIN\n  resultado <- 0;\n  FOR i <- 1 TO n DO BEGIN\n    resultado <- resultado + i;\n  END\nEND";
    const result = extractSymbols(source, source.length);

    expect(result.variables.map((symbol) => symbol.name)).toEqual([
      "resultado",
      "i",
    ]);
  });
});
