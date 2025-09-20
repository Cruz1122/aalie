// @aa/grammar - Main exports
import { CharStreams, CommonTokenStream } from "antlr4ts";
import { LanguageLexer } from "./src/ts/LanguageLexer";
import { LanguageParser } from "./src/ts/LanguageParser";

/**
 * Parse a mathematical expression string
 * @param input The expression to parse (e.g., "(1+2)*3")
 * @returns true if parsing succeeds, false otherwise
 */
export function parseExpr(input: string): boolean {
  try {
    // Create input stream
    const inputStream = CharStreams.fromString(input);
    
    // Create lexer
    const lexer = new LanguageLexer(inputStream);
    
    // Create token stream
    const tokenStream = new CommonTokenStream(lexer);
    
    // Create parser
    const parser = new LanguageParser(tokenStream);
    
    // Remove default error listeners to avoid console spam
    parser.removeErrorListeners();
    
    // Track if parsing succeeded
    let hasErrors = false;
    parser.addErrorListener({
      syntaxError: () => {
        hasErrors = true;
      }
    });
    
    // Try to parse an expression
    parser.expr();
    
    return !hasErrors;
  } catch (error) {
    // Handle parsing errors
    console.warn("Parse error:", error instanceof Error ? error.message : String(error));
    return false;
  }
}

// Re-export the generated classes for advanced usage
export { LanguageLexer } from "./src/ts/LanguageLexer";
export { LanguageParser } from "./src/ts/LanguageParser";
export type { LanguageListener } from "./src/ts/LanguageListener";
export type { LanguageVisitor } from "./src/ts/LanguageVisitor";