import {
  ASTBuilder,
  CharStreams,
  CollectingErrorListener,
  CommonTokenStream,
  LanguageLexer,
  LanguageParser,
} from "@aa/grammar";
import type { ParseError, Program } from "@aa/types";

export interface ParseWorkerRequest {
  id: number;
  code: string;
}

export interface ParseWorkerResponse {
  id: number;
  ok: boolean;
  ast?: Program;
  errors?: ParseError[];
}

self.addEventListener("message", (event: MessageEvent<ParseWorkerRequest>) => {
  const { id, code } = event.data;

  try {
    // Create input stream
    const inputStream = CharStreams.fromString(code);

    // Create lexer
    const lexer = new LanguageLexer(inputStream);
    const lexerErrors = new CollectingErrorListener();
    lexer.removeErrorListeners();
    lexer.addErrorListener(lexerErrors);

    // Create token stream
    const tokenStream = new CommonTokenStream(lexer);

    // Create parser
    const parser = new LanguageParser(tokenStream);
    const parserErrors = new CollectingErrorListener();
    parser.removeErrorListeners();
    parser.addErrorListener(parserErrors);

    // Parse
    const tree = parser.program();
    
    // Collect all errors
    const allErrors = [...lexerErrors.errors, ...parserErrors.errors];

    // Build AST if no errors
    let ast: Program | undefined;
    if (allErrors.length === 0) {
      try {
        const builder = new ASTBuilder();
        ast = builder.visit(tree) as Program;
      } catch (astError) {
        allErrors.push({
          line: 1,
          column: 0,
          message: `AST error: ${astError instanceof Error ? astError.message : String(astError)}`,
        });
      }
    }

    const response: ParseWorkerResponse = {
      id,
      ok: allErrors.length === 0,
      ast: allErrors.length === 0 ? ast : undefined,
      errors: allErrors,
    };

    self.postMessage(response);
  } catch (error) {
    const response: ParseWorkerResponse = {
      id,
      ok: false,
      errors: [
        {
          line: 1,
          column: 0,
          message: `Parser crashed: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };

    self.postMessage(response);
  }
});

// Export empty object to make TypeScript happy
export {};

