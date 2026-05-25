import { describe, expect, it } from "vitest";

import { detectTechniqueFromAst } from "../index";
import { parseSourceToAst } from "./parseSourceToAst";
import { TECHNIQUE_ORACLES } from "./techniqueDetection.oracles";

describe("technique detection oracles", () => {
  it.each(TECHNIQUE_ORACLES)("$id", (oracle) => {
    const ast = parseSourceToAst(oracle.source);
    const result = detectTechniqueFromAst(ast);

    expect(result.technique).toBe(oracle.expectedTechnique);

    if (oracle.requiredRoles) {
      const roles = result.evidence.items.map((item) => item.role);
      for (const role of oracle.requiredRoles) {
        expect(roles).toContain(role);
      }
    }

    if (oracle.forbiddenTechniques) {
      expect(oracle.forbiddenTechniques).not.toContain(result.technique);
    }
  });

  it("does not classify prefix sum as strong bottom-up DP", () => {
    const ast = parseSourceToAst(`
prefixSum(A[n], n) BEGIN
    P[1] <- A[1];
    FOR i <- 2 TO n DO BEGIN
        P[i] <- P[i - 1] + A[i];
    END
    RETURN P[n];
END
`);
    const result = detectTechniqueFromAst(ast);
    expect(result.technique).not.toBe("dp_bottom_up");
  });

  it("does not classify counting sort as strong bottom-up DP", () => {
    const ast = parseSourceToAst(`
countingSort(A[n], n, k) BEGIN
    FOR i <- 0 TO k DO BEGIN
        C[i] <- 0;
    END
    FOR i <- 1 TO n DO BEGIN
        C[A[i]] <- C[A[i]] + 1;
    END
    RETURN 0;
END
`);
    const result = detectTechniqueFromAst(ast);
    expect(result.technique).not.toBe("dp_bottom_up");
  });

  it("does not classify quicksort as backtracking", () => {
    const ast = parseSourceToAst(`
quickSort(A[n], izq, der) BEGIN
    IF (izq < der) THEN BEGIN
        pivote <- A[der];
        i <- izq - 1;
        FOR j <- izq TO der - 1 DO BEGIN
            IF (A[j] <= pivote) THEN BEGIN
                i <- i + 1;
                temp <- A[i];
                A[i] <- A[j];
                A[j] <- temp;
            END
        END
        pi <- i + 1;
        CALL quickSort(A, izq, pi - 1);
        CALL quickSort(A, pi + 1, der);
    END
    RETURN 0;
END
`);
    const result = detectTechniqueFromAst(ast);
    expect(result.technique).toBe("divide_and_conquer");
    expect(result.technique).not.toBe("backtracking");
  });

  it("does not classify memoized fibonacci as backtracking", () => {
    const ast = parseSourceToAst(`
fibMemo(n, memo[n]) BEGIN
    IF (memo[n] != -1) THEN BEGIN
        RETURN memo[n];
    END
    IF (n <= 1) THEN BEGIN
        RETURN n;
    END
    memo[n] <- fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
    RETURN memo[n];
END
`);
    const result = detectTechniqueFromAst(ast);
    expect(result.technique).toBe("dp_top_down");
    expect(result.technique).not.toBe("backtracking");
  });

  it("classifies recursive binary search as divide and conquer", () => {
    const ast = parseSourceToAst(`
binarySearchRec(A[n], x, inicio, fin) BEGIN
    IF (inicio > fin) THEN BEGIN
        RETURN -1;
    END
    mitad <- (inicio + fin) DIV 2;
    IF (A[mitad] = x) THEN BEGIN
        RETURN mitad;
    END
    IF (x < A[mitad]) THEN BEGIN
        RETURN binarySearchRec(A, x, inicio, mitad - 1);
    END
    RETURN binarySearchRec(A, x, mitad + 1, fin);
END
`);
    const result = detectTechniqueFromAst(ast);
    expect(result.technique).toBe("divide_and_conquer");
    expect(result.technique).not.toBe("branch_and_bound");
  });

  it("classifies n-queens as backtracking", () => {
    const ast = parseSourceToAst(`
nQueens(Q[n], row, n) BEGIN
    IF (row > n) THEN BEGIN
        RETURN 1;
    END
    total <- 0;
    FOR col <- 1 TO n DO BEGIN
        IF (isSafeQueen(Q, row, col) = true) THEN BEGIN
            Q[row] <- col;
            total <- total + nQueens(Q, row + 1, n);
            Q[row] <- 0;
        END
    END
    RETURN total;
END
`);
    const result = detectTechniqueFromAst(ast);
    expect(result.technique).toBe("backtracking");
    expect(result.technique).not.toBe("branch_and_bound");
  });
});
