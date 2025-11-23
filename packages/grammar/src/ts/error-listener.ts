// Error listener for collecting parsing errors
import type { ANTLRErrorListener, RecognitionException, Recognizer } from "antlr4ts";
import type { ParseError } from "@aa/types";

export class CollectingErrorListener implements ANTLRErrorListener<any> {
  public errors: ParseError[] = [];

  syntaxError(
    recognizer: Recognizer<any, any>,
    offendingSymbol: any,
    line: number,
    charPositionInLine: number,
    msg: string,
    e: RecognitionException | undefined
  ): void {
    this.errors.push({
      line,
      column: charPositionInLine,
      message: msg,
    });
  }
}

