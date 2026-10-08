import type { Program } from "@aa/types";

import { resolveEditorContext } from "../resolveEditorContext";

function cursorAt(source: string, marker: string, fromIndex = 0) {
  const offset = source.indexOf(marker, fromIndex);
  if (offset < 0) throw new Error(`Marker not found: ${marker}`);
  const before = source.slice(0, offset);
  return {
    line: before.split("\n").length,
    column: offset - (before.lastIndexOf("\n") + 1),
    offset,
  };
}

function procedureAst(withStatements = true): Program {
  return {
    type: "Program",
    pos: { line: 1, column: 0 },
    body: [
      {
        type: "ProcDef",
        name: "suma",
        pos: { line: 1, column: 0 },
        params: [{ type: "Param", name: "n", pos: { line: 1, column: 5 } }],
        body: {
          type: "Block",
          pos: { line: 1, column: 9 },
          body: withStatements
            ? [
                {
                  type: "Assign",
                  pos: { line: 2, column: 2 },
                  target: {
                    type: "Identifier",
                    name: "resultado",
                    pos: { line: 2, column: 2 },
                  },
                  value: {
                    type: "Identifier",
                    name: "n",
                    pos: { line: 2, column: 15 },
                  },
                },
                {
                  type: "Return",
                  pos: { line: 3, column: 2 },
                  value: {
                    type: "Identifier",
                    name: "resultado",
                    pos: { line: 3, column: 9 },
                  },
                },
              ]
            : [],
        },
      },
    ],
  };
}

describe("resolveEditorContext", () => {
  it("resolves an empty document exactly", () => {
    const context = resolveEditorContext({
      source: "",
      cursor: { line: 1, column: 0, offset: 0 },
    });

    expect(context.location.primary).toBe("EMPTY_DOCUMENT");
    expect(context.structure.hasProcedure).toBe(false);
    expect(context.capabilities.canAnalyze).toBe(false);
  });

  it("resolves a complete procedure body and AST structure", () => {
    const source =
      "suma(n) BEGIN\n    resultado <- n;\n    RETURN resultado;\nEND";
    const context = resolveEditorContext({
      source,
      cursor: cursorAt(source, "resultado <-"),
      ast: procedureAst(),
      parseResult: { status: "valid", errors: [] },
    });

    expect(context.location.primary).toBe("PROCEDURE_BODY");
    expect(context.location.insideProcedure).toBe(true);
    expect(context.structure).toMatchObject({
      hasProcedure: true,
      procedureName: "suma",
      hasStatements: true,
      hasReturn: true,
    });
    expect(context.symbols.parameters.map((symbol) => symbol.name)).toEqual([
      "n",
    ]);
    expect(context.symbols.variables.map((symbol) => symbol.name)).toEqual([
      "resultado",
    ]);
    expect(context.capabilities).toMatchObject({
      canInsertStatement: true,
      canReturn: true,
      canAnalyze: true,
    });
  });

  it("keeps parameter context while the signature is incomplete", () => {
    const source = "buscar(n, ";
    const context = resolveEditorContext({
      source,
      cursor: { line: 1, column: source.length, offset: source.length },
      parseResult: {
        status: "invalid",
        errors: [{ line: 1, column: 9, message: "missing parameter" }],
      },
    });

    expect(context.location.primary).toBe("PARAMETER_LIST");
    expect(context.capabilities.canInsertParameter).toBe(true);
    expect(context.parse.status).toBe("invalid");
  });

  it("keeps condition and loop evidence during incomplete input", () => {
    const ifSource = "IF (n ";
    const ifContext = resolveEditorContext({
      source: ifSource,
      cursor: { line: 1, column: ifSource.length, offset: ifSource.length },
      parseResult: { status: "invalid", errors: [] },
    });
    const whileSource = "WHILE (i < ";
    const whileContext = resolveEditorContext({
      source: whileSource,
      cursor: {
        line: 1,
        column: whileSource.length,
        offset: whileSource.length,
      },
      parseResult: { status: "invalid", errors: [] },
    });

    expect(ifContext.location.primary).toBe("CONDITION");
    expect(ifContext.location.insideConditional).toBe(true);
    expect(whileContext.location.primary).toBe("CONDITION");
    expect(whileContext.location.insideLoop).toBe(true);
    expect(whileContext.capabilities.canInsertExpression).toBe(true);
  });

  it("keeps loop evidence for incomplete FOR and REPEAT headers", () => {
    const forSource = "suma(n) BEGIN\nFOR i <- 1 TO ";
    const forContext = resolveEditorContext({
      source: forSource,
      cursor: { line: 2, column: 14, offset: forSource.length },
      parseResult: { status: "invalid", errors: [] },
    });
    const repeatSource = "suma(n) BEGIN\nREPEAT\n  x <- 1;\nUNTIL (";
    const repeatContext = resolveEditorContext({
      source: repeatSource,
      cursor: { line: 4, column: 7, offset: repeatSource.length },
      parseResult: { status: "invalid", errors: [] },
    });

    expect(forContext.location.insideLoop).toBe(true);
    expect(forContext.location.primary).toBe("EXPRESSION");
    expect(repeatContext.location.primary).toBe("CONDITION");
    expect(repeatContext.location.insideLoop).toBe(true);
  });

  it("returns to top-level after a procedure closes", () => {
    const source = "suma(n) BEGIN\nEND\n";
    const context = resolveEditorContext({
      source,
      cursor: { line: 3, column: 0, offset: source.length },
      parseResult: { status: "invalid", errors: [] },
    });

    expect(context.location.primary).toBe("TOP_LEVEL");
    expect(context.location.insideProcedure).toBe(false);
  });

  it("extracts symbols in a return expression", () => {
    const source = "suma(n) BEGIN\n    resultado <- n;\n    RETURN ";
    const context = resolveEditorContext({
      source,
      cursor: { line: 3, column: 11, offset: source.length },
      parseResult: { status: "invalid", errors: [] },
    });

    expect(context.location.primary).toBe("RETURN_EXPRESSION");
    expect(context.symbols.parameters.map((symbol) => symbol.name)).toEqual([
      "n",
    ]);
    expect(context.symbols.variables.map((symbol) => symbol.name)).toEqual([
      "resultado",
    ]);
  });

  it("uses selection as an overlay without losing block evidence", () => {
    const source = "suma(n) BEGIN\n    x <- 0;\n    y <- 1;\nEND";
    const startOffset = source.indexOf("x <-");
    const endOffset = source.indexOf(";", source.indexOf("y <-")) + 1;
    const context = resolveEditorContext({
      source,
      cursor: cursorAt(source, "END"),
      selection: {
        active: true,
        text: source.slice(startOffset, endOffset),
        startOffset,
        endOffset,
      },
      ast: procedureAst(false),
      parseResult: { status: "valid", errors: [] },
    });

    expect(context.location.primary).toBe("SELECTION");
    expect(context.location.insideProcedure).toBe(true);
    expect(context.capabilities.canWrapSelection).toBe(true);
  });

  it("preserves procedure and conditional flags for invalid writing", () => {
    const source = "suma(n) BEGIN\n    IF (n > 0) TH";
    const context = resolveEditorContext({
      source,
      cursor: { line: 2, column: 17, offset: source.length },
      parseResult: {
        status: "invalid",
        errors: [{ line: 2, column: 16, message: "expected BEGIN" }],
      },
    });

    expect(context.location.insideProcedure).toBe(true);
    expect(context.location.insideConditional).toBe(true);
    expect(context.parse.status).toBe("invalid");
  });

  it("marks a valid algorithm as analyzable", () => {
    const source =
      "suma(n) BEGIN\n    resultado <- n + 1;\n    RETURN resultado;\nEND";
    const context = resolveEditorContext({
      source,
      cursor: cursorAt(source, "RETURN"),
      ast: procedureAst(),
      parseResult: { status: "valid", errors: [] },
    });

    expect(context.parse.status).toBe("valid");
    expect(context.structure.hasProcedure).toBe(true);
    expect(context.structure.hasStatements).toBe(true);
    expect(context.structure.hasReturn).toBe(true);
    expect(context.capabilities.canAnalyze).toBe(true);
  });
});
