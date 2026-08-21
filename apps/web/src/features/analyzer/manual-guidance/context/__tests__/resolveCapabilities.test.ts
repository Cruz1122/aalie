import { resolveCapabilities } from "../resolveCapabilities";

const parse = { status: "valid" as const, hasUsableAst: true };
const noSelection = {
  active: false,
  text: "",
  startOffset: 0,
  endOffset: 0,
};

describe("resolveCapabilities", () => {
  it("matches the capability matrix for empty, parameter, body and condition locations", () => {
    expect(
      resolveCapabilities(
        {
          primary: "EMPTY_DOCUMENT",
          insideProcedure: false,
          insideBlock: false,
        },
        { status: "idle", hasUsableAst: false },
        noSelection,
      ),
    ).toMatchObject({
      canInsertStatement: false,
      canInsertExpression: false,
      canAnalyze: false,
    });

    expect(
      resolveCapabilities(
        {
          primary: "PARAMETER_LIST",
          insideProcedure: false,
          insideBlock: false,
        },
        { status: "invalid", hasUsableAst: false },
        noSelection,
      ).canInsertParameter,
    ).toBe(true);
    expect(
      resolveCapabilities(
        { primary: "PROCEDURE_BODY", insideProcedure: true, insideBlock: true },
        parse,
        noSelection,
      ),
    ).toMatchObject({
      canInsertStatement: true,
      canReturn: true,
      canAnalyze: true,
    });
    expect(
      resolveCapabilities(
        { primary: "CONDITION", insideProcedure: true, insideBlock: true },
        { status: "invalid", hasUsableAst: false },
        noSelection,
      ),
    ).toMatchObject({ canInsertExpression: true, canInsertStatement: false });
  });

  it("allows wrapping only active non-empty selections in code", () => {
    expect(
      resolveCapabilities(
        { primary: "SELECTION", insideProcedure: true, insideBlock: true },
        { status: "invalid", hasUsableAst: false },
        { active: true, text: "x <- 1;", startOffset: 0, endOffset: 7 },
      ).canWrapSelection,
    ).toBe(true);
  });
});
