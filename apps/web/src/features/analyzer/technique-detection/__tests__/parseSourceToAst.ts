import {
  ASTBuilder,
  CharStreams,
  CollectingErrorListener,
  CommonTokenStream,
  LanguageLexer,
  LanguageParser,
} from "@aa/grammar";
import type { Program } from "@aa/types";

export function parseSourceToAst(source: string): Program {
  const inputStream = CharStreams.fromString(source.trim());
  const lexer = new LanguageLexer(inputStream);
  const lexerErrors = new CollectingErrorListener();
  lexer.removeErrorListeners();
  lexer.addErrorListener(lexerErrors);

  const tokenStream = new CommonTokenStream(lexer);
  const parser = new LanguageParser(tokenStream);
  const parserErrors = new CollectingErrorListener();
  parser.removeErrorListeners();
  parser.addErrorListener(parserErrors);

  const tree = parser.program();
  const allErrors = [...lexerErrors.errors, ...parserErrors.errors];
  if (allErrors.length > 0) {
    throw new Error(
      `Parse failed: ${allErrors.map((error) => error.message).join("; ")}`,
    );
  }

  const builder = new ASTBuilder();
  return builder.visit(tree) as Program;
}
