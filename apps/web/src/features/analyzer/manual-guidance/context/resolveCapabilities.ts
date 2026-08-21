import type { EditorContext, EditorLocation } from "./types";

export function resolveCapabilities(
  location: Pick<
    EditorContext["location"],
    "primary" | "insideProcedure" | "insideBlock"
  >,
  parse: Pick<EditorContext["parse"], "status" | "hasUsableAst">,
  selection: EditorContext["selection"],
): EditorContext["capabilities"] {
  const isStatementLocation = [
    "PROCEDURE_BODY",
    "IF_BODY",
    "LOOP_BODY",
  ].includes(location.primary);
  const isExpressionLocation = [
    "CONDITION",
    "EXPRESSION",
    "RETURN_EXPRESSION",
  ].includes(location.primary);
  const canWrapSelection =
    selection.active &&
    selection.text.trim().length > 0 &&
    (location.insideBlock || location.insideProcedure);

  return {
    canInsertStatement:
      isStatementLocation ||
      (location.primary === "TOP_LEVEL" && location.insideProcedure),
    canInsertExpression: isExpressionLocation,
    canInsertParameter: location.primary === "PARAMETER_LIST",
    canWrapSelection,
    canReturn: location.insideProcedure && isStatementLocation,
    canAnalyze: parse.status === "valid" && parse.hasUsableAst,
  };
}

export function isKnownLocation(location: EditorLocation): boolean {
  return location !== "UNKNOWN";
}
