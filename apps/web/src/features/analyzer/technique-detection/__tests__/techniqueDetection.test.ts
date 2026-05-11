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

  it("does not classify dutch flag as strong greedy", () => {
    const ast = parseSourceToAst(`
dutchFlag(A[n], n, pivot) BEGIN
    low <- 1;
    mid <- 1;
    high <- n;
    WHILE (mid <= high) DO BEGIN
        IF (A[mid] < pivot) THEN BEGIN
            temp <- A[low];
            A[low] <- A[mid];
            A[mid] <- temp;
            low <- low + 1;
            mid <- mid + 1;
        END
        ELSE BEGIN
            IF (A[mid] > pivot) THEN BEGIN
                temp <- A[mid];
                A[mid] <- A[high];
                A[high] <- temp;
                high <- high - 1;
            END
            ELSE BEGIN
                mid <- mid + 1;
            END
        END
    END
    RETURN 0;
END
`);
    const result = detectTechniqueFromAst(ast);
    expect(result.technique).not.toBe("greedy");
  });
});
