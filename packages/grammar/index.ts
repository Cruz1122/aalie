// @aa/grammar - Main exports

// Re-export ANTLR4 utilities
export { CharStreams, CommonTokenStream } from "antlr4ts";
export type { ANTLRErrorListener, RecognitionException, Recognizer } from "antlr4ts";

// Re-export generated parser classes
export { LanguageLexer } from "./src/ts/LanguageLexer";
export { LanguageParser } from "./src/ts/LanguageParser";
export type { LanguageListener } from "./src/ts/LanguageListener";
export type { LanguageVisitor } from "./src/ts/LanguageVisitor";

// Export AST builder and helpers
export { ASTBuilder, getPos, normalizeOp, lit, ident, unary, binary } from "./src/ts/ast-builder";
export { CollectingErrorListener } from "./src/ts/error-listener";

// Re-export contexts for AST building
export type {
  ProgramContext,
  ProcDefContext,
  ParamContext,
  ParamListContext,
  ArrayParamContext,
  ObjectParamContext,
  BlockContext,
  StmtContext,
  AssignmentStmtContext,
  DeclVectorStmtContext,
  CallStmtContext,
  IfStmtContext,
  WhileStmtContext,
  ForStmtContext,
  RepeatStmtContext,
  ReturnStmtContext,
  LvalueContext,
  IndexSuffixContext,
  ExprContext,
  OrExprContext,
  AndExprContext,
  RelExprContext,
  AddExprContext,
  MulExprContext,
  UnaryExprContext,
  PrimaryContext,
  CallExprContext,
  LengthCallContext,
  ArrayIndexContext,
  ArgListContext,
} from "./src/ts/LanguageParser";