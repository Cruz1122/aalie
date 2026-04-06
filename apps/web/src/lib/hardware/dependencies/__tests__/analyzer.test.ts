import type { Program } from "@aa/types";
import { describe, expect, it } from "vitest";

import { analyzeDependencies } from "@/lib/hardware/dependencies/analyzer";

describe("analyzeDependencies", () => {
  it("does not crash when recursion scanning encounters primitive return values", () => {
    const ast = {
      type: "Program",
      body: [
        {
          type: "ProcDef",
          name: "foo",
          params: [],
          body: {
            type: "Block",
            body: [
              {
                type: "Return",
                value: 1,
              },
            ],
          },
        },
      ],
    } as unknown as Program;

    expect(() => analyzeDependencies(ast)).not.toThrow();
  });
});
