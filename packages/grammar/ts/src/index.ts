// path: packages/grammar/ts/src/index.ts

// Re-exporta artefactos generados con rutas ESM válidas (extensión .js obligatoria)
export { ExprLexer } from "./generated/ExprLexer.js";
export { ExprParser } from "./generated/ExprParser.js";
export { ExprVisitor } from "./generated/ExprVisitor.js";

import { CharStreams, CommonTokenStream } from "antlr4ts";
import { ExprLexer } from "./generated/ExprLexer.js";
import { ExprParser } from "./generated/ExprParser.js";

/**
 * Devuelve true si el input es una expresión válida según la gramática.
 */
export function parseExpr(input: string): boolean {
  const chars = CharStreams.fromString(input);
  const lexer = new ExprLexer(chars);
  const tokens = new CommonTokenStream(lexer);
  const parser = new ExprParser(tokens);
  parser.removeErrorListeners();
  const tree = parser.prog();
  return !!tree;
}
