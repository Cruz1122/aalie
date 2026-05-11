import { describe, expect, it } from "vitest";

import { detectTechniqueFromAst } from "../index";
import { parseSourceToAst } from "./parseSourceToAst";

const original = `
alg(A[n], inicio, fin) BEGIN
    IF (inicio >= fin) THEN BEGIN
        RETURN 0;
    END
    corte <- (inicio + fin) DIV 2;
    x <- alg(A, inicio, corte);
    y <- alg(A, corte + 1, fin);
    RETURN x + y;
END
`;

const renamed = `
qwerty(Z[n], a, b) BEGIN
    IF (a >= b) THEN BEGIN
        RETURN 0;
    END
    c <- (a + b) DIV 2;
    u <- qwerty(Z, a, c);
    v <- qwerty(Z, c + 1, b);
    RETURN u + v;
END
`;

describe("technique detection rename invariance", () => {
  it("keeps technique after renaming identifiers", () => {
    const r1 = detectTechniqueFromAst(parseSourceToAst(original));
    const r2 = detectTechniqueFromAst(parseSourceToAst(renamed));

    expect(r1.technique).toBe("divide_and_conquer");
    expect(r2.technique).toBe("divide_and_conquer");
    expect(r1.technique).toBe(r2.technique);
  });
});
