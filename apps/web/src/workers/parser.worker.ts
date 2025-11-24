/**
 * Web Worker para parsear código pseudocódigo en un hilo separado.
 * Usa el parser de gramática (@aa/grammar) para parsear el código y generar el AST.
 *
 * Author: Juan Camilo Cruz Parra (@Cruz1122)
 */
import {
  ASTBuilder,
  CharStreams,
  CollectingErrorListener,
  CommonTokenStream,
  LanguageLexer,
  LanguageParser,
} from "@aa/grammar";
import type { ParseError, Program } from "@aa/types";

/**
 * Interfaz para las solicitudes al worker.
 */
export interface ParseWorkerRequest {
  /** ID único de la solicitud para identificar respuestas */
  id: number;
  /** Código fuente a parsear */
  code: string;
}

/**
 * Interfaz para las respuestas del worker.
 */
export interface ParseWorkerResponse {
  /** ID único de la solicitud correspondiente */
  id: number;
  /** Indica si el parseo fue exitoso */
  ok: boolean;
  /** AST parseado (solo si ok es true) */
  ast?: Program;
  /** Lista de errores de parseo (solo si ok es false) */
  errors?: ParseError[];
}

/**
 * Escucha mensajes del hilo principal para parsear código.
 *
 * @param event - Evento de mensaje con ParseWorkerRequest
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
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
