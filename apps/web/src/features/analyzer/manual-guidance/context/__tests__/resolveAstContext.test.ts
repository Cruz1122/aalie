import type { Program } from "@aa/types";

import { resolveAstContext } from "../resolveAstContext";
import { resolvePartialSyntaxContext } from "../resolvePartialSyntaxContext";

describe("resolveAstContext", () => {
  it("records control, expression, nearest-node and parent evidence", () => {
    const source =
      "demo(n) BEGIN\nIF (n > 0) THEN BEGIN\nFOR i <- 1 TO n DO BEGIN\nWHILE (n > 0) DO BEGIN\nREPEAT\nEND\nEND\nEND\nEND";
    const ast = {
      type: "Program",
      pos: { line: 1, column: 0 },
      body: [
        {
          type: "ProcDef",
          name: "demo",
          pos: { line: 1, column: 0 },
          params: [{ type: "Param", name: "n", pos: { line: 1, column: 5 } }],
          body: {
            type: "Block",
            pos: { line: 1, column: 9 },
            body: [
              {
                type: "If",
                pos: { line: 2, column: 0 },
                test: {
                  type: "Binary",
                  op: ">",
                  pos: { line: 2, column: 5 },
                  left: {
                    type: "Identifier",
                    name: "n",
                    pos: { line: 2, column: 5 },
                  },
                  right: {
                    type: "Literal",
                    value: 0,
                    pos: { line: 2, column: 9 },
                  },
                },
                consequent: {
                  type: "Block",
                  pos: { line: 2, column: 20 },
                  body: [],
                },
              },
              {
                type: "For",
                var: "i",
                start: {
                  type: "Literal",
                  value: 1,
                  pos: { line: 3, column: 0 },
                },
                end: {
                  type: "Identifier",
                  name: "n",
                  pos: { line: 3, column: 1 },
                },
                body: { type: "Block", pos: { line: 3, column: 2 }, body: [] },
                pos: { line: 3, column: 0 },
              },
              {
                type: "While",
                test: {
                  type: "Identifier",
                  name: "n",
                  pos: { line: 4, column: 0 },
                },
                body: { type: "Block", pos: { line: 4, column: 1 }, body: [] },
                pos: { line: 4, column: 0 },
              },
              {
                type: "Repeat",
                test: {
                  type: "Identifier",
                  name: "n",
                  pos: { line: 5, column: 0 },
                },
                body: { type: "Block", pos: { line: 5, column: 1 }, body: [] },
                pos: { line: 5, column: 0 },
              },
            ],
          },
        },
      ],
    } as unknown as Program;
    const cursorOffset = source.indexOf("REPEAT");
    const partial = resolvePartialSyntaxContext(source, cursorOffset);
    const result = resolveAstContext(ast, partial, source, cursorOffset);

    expect(result).toMatchObject({
      hasProcedure: true,
      procedureName: "demo",
      hasIf: true,
      hasFor: true,
      hasWhile: true,
      hasRepeat: true,
      hasExpression: true,
    });
    expect(result.nearestNodeType).toBe("Repeat");
    expect(result.parentNodeType).toBe("Block");
  });
});
