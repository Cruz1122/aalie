// Monaco Diagnostics Adapter
import type { ParseError } from "@aa/types";
import type * as Monaco from "monaco-editor";

/**
 * Convierte errores del parser a markers de Monaco.
 * @param errors - Array de errores de parseo
 * @returns Array de markers de Monaco para mostrar errores en el editor
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
export function errorsToMarkers(
  errors: ParseError[],
): Monaco.editor.IMarkerData[] {
  return errors.map((error) => ({
    severity: 8, // MarkerSeverity.Error
    startLineNumber: error.line,
    startColumn: error.column + 1, // Monaco es base-1, nuestro parser es base-0
    endLineNumber: error.line,
    endColumn: error.column + 100, // Extender para marcar toda la línea visualmente
    message: error.message,
    source: "pseudocode-parser",
  }));
}

/**
 * Registra el lenguaje pseudocódigo en Monaco Editor.
 * Configura keywords, operadores, tokenizer y tema personalizado.
 * @param monaco - Instancia de Monaco Editor
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
export function registerPseudocodeLanguage(monaco: typeof Monaco): void {
  // Registrar lenguaje
  if (
    !monaco.languages
      .getLanguages()
      .some((language) => language.id === "pseudocode")
  ) {
    monaco.languages.register({ id: "pseudocode" });
  }

  // Configurar tokens
  monaco.languages.setMonarchTokensProvider("pseudocode", {
    // Hace que @keywords compare sin distinguir mayúsculas/minúsculas.
    ignoreCase: true,
    keywords: [
      "BEGIN",
      "END",
      "CLASS",
      "IF",
      "THEN",
      "ELSE",
      "FOR",
      "TO",
      "DO",
      "WHILE",
      "REPEAT",
      "UNTIL",
      "RETURN",
      "CALL",
      "PRINT",
      "AND",
      "OR",
      "NOT",
      "DIV",
      "MOD",
      "TRUE",
      "FALSE",
      "NULL",
      "LENGTH",
    ],

    operators: [
      "<-",
      "←",
      ":=",
      "=",
      "!=",
      "<>",
      "≠",
      "<",
      ">",
      "<=",
      "≤",
      ">=",
      "≥",
      "+",
      "-",
      "*",
      "/",
    ],

    tokenizer: {
      root: [
        // Comments - debe ir primero para que tenga prioridad
        [/\/\/.*$/, "comment"], // Comentarios de una línea con //

        // Strings - usar estado stringState para manejar correctamente
        [/"/, { token: "string.quote", next: "@stringState" }],

        // Numbers
        [/\d+/, "number"],

        // Operators
        [/<-|←|:=|==|!=|<>|≠|<=|≤|>=|≥|<|>/, "operator"],
        [/[+\-*/]/, "operator"],

        // Delimiters
        [/[(){}[\];,.]/, "delimiter"],

        // Identifiers / keywords. @keywords respeta ignoreCase.
        [
          /[a-zA-Z_]\w*/,
          { cases: { "@keywords": "keyword", "@default": "identifier" } },
        ],

        // Whitespace
        [/\s+/, "white"],
      ],
      stringState: [
        [/[^"\\]+/, "string"],
        [/\\./, "string.escape"],
        [/"/, { token: "string.quote", next: "@pop" }],
      ],
    },
  });

  // Configurar tema oscuro consistente con la paleta del sitio (primary #0d7ff2, dark.bg #101a23)
  const pseudocodeTheme = {
    base: "vs-dark" as const,
    inherit: true,
    rules: [
      { token: "keyword", foreground: "67e8f9", fontStyle: "bold" }, // cyan - palabras clave
      { token: "identifier", foreground: "ffffff" }, // identificadores en blanco
      { token: "number", foreground: "ffffff" }, // valores en blanco
      { token: "string", foreground: "ffffff" }, // strings en blanco
      { token: "string.quote", foreground: "ffffff" },
      { token: "string.escape", foreground: "ffffff" },
      { token: "operator", foreground: "67e8f9" }, // cyan - operadores
      { token: "delimiter", foreground: "67e8f9" }, // cyan - delimitadores
      { token: "comment", foreground: "64748b", fontStyle: "italic" },
      { token: "white", foreground: "ffffff" },
    ],
    colors: {
      "editor.foreground": "#ffffff",
      "editor.background": "#101a23", // dark.bg
      "editor.lineHighlightBackground": "transparent", // sin resaltado al hover/focus

      "editor.selectionBackground": "#0d7ff230",
      "editor.inactiveSelectionBackground": "#0d7ff220",
      "editor.selectionHighlightBackground": "#0d7ff215",

      "editorLineNumber.foreground": "#475569",
      "editorLineNumber.activeForeground": "#0d7ff2", // primary

      "editorCursor.foreground": "#0d7ff2",

      "editorBracketMatch.background": "#0d7ff220",
      "editorBracketMatch.border": "#0d7ff260",

      "scrollbarSlider.background": "#ffffff15",
      "scrollbarSlider.hoverBackground": "#ffffff20",
      "scrollbarSlider.activeBackground": "#ffffff25",

      "editorIndentGuide.background": "#ffffff08",
      "editorIndentGuide.activeBackground": "#0d7ff230",

      "editorWidget.background": "#182431",
      "editorWidget.border": "#ffffff10",
      "editorSuggestWidget.background": "#182431",
      "editorSuggestWidget.border": "#ffffff10",
      "editorHoverWidget.background": "#182431",
      "editorHoverWidget.border": "#0d7ff240",
    },
  };
  monaco.editor.defineTheme("pseudocode-theme", pseudocodeTheme);
  monaco.editor.defineTheme("pseudocode-example-theme", pseudocodeTheme);
}
