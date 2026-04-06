import type { ParseError } from "@aa/types";

export interface SyntaxHint {
  readonly status: "valid" | "invalid";
  readonly code: string;
  readonly message: string;
  readonly suggestion: string;
  readonly line: number;
  readonly column: number;
}

export function mapParseErrorsToSyntaxHints(
  errors: ParseError[] | undefined,
): SyntaxHint[] {
  if (!errors || errors.length === 0) {
    return [];
  }

  return errors.map((error) => {
    const message = error.message.toLowerCase();

    if (message.includes("end")) {
      return {
        status: "invalid",
        code: "missing-end",
        message: "Falta END para cerrar este bloque.",
        suggestion: "Cierra el bloque abierto con END.",
        line: error.line,
        column: error.column,
      };
    }

    if (message.includes("else")) {
      return {
        status: "invalid",
        code: "dangling-else",
        message: "Este ELSE necesita un IF anterior.",
        suggestion:
          "Revisa que el ELSE esté unido a un IF completo con BEGIN y END.",
        line: error.line,
        column: error.column,
      };
    }

    if (
      message.includes(":=") ||
      message.includes("🡨") ||
      message.includes("←")
    ) {
      return {
        status: "invalid",
        code: "assign-ascii",
        message: "Usa <- para asignación.",
        suggestion: "Reemplaza la asignación por <-.",
        line: error.line,
        column: error.column,
      };
    }

    if (message.includes("for")) {
      return {
        status: "invalid",
        code: "for-to",
        message: "Este FOR soporta TO.",
        suggestion: "Usa la forma FOR i <- inicio TO fin DO BEGIN ... END.",
        line: error.line,
        column: error.column,
      };
    }

    if (message.includes("comment") || message.includes("►")) {
      return {
        status: "invalid",
        code: "comment-ascii",
        message: "Este comentario debe empezar con //.",
        suggestion: "Reemplaza el comentario por // comentario.",
        line: error.line,
        column: error.column,
      };
    }

    return {
      status: "invalid",
      code: "parser-error",
      message: error.message,
      suggestion: "Corrige la estructura usando la sintaxis oficial ASCII.",
      line: error.line,
      column: error.column,
    };
  });
}
