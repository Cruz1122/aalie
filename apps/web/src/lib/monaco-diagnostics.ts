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

  // Los editores principales usan azul; los ejemplos conservan cyan. Ambos
  // comparten fondo y tipografía, pero no sus elementos de acento.
  const createPseudocodeTheme = (accent: {
    readonly token: string;
    readonly selection: string;
    readonly selectionInactive: string;
    readonly selectionHighlight: string;
    readonly lineNumber: string;
    readonly bracketBackground: string;
    readonly bracketBorder: string;
    readonly scrollbar: string;
    readonly scrollbarHover: string;
    readonly scrollbarActive: string;
    readonly indentGuide: string;
    readonly widgetBorder: string;
  }) => ({
    base: "vs-dark" as const,
    inherit: true,
    rules: [
      { token: "keyword", foreground: accent.token, fontStyle: "bold" },
      { token: "identifier", foreground: "ffffff" },
      { token: "number", foreground: "ffffff" },
      { token: "string", foreground: "ffffff" },
      { token: "string.quote", foreground: "ffffff" },
      { token: "string.escape", foreground: "ffffff" },
      { token: "operator", foreground: accent.token },
      { token: "delimiter", foreground: accent.token },
      { token: "comment", foreground: "64748b", fontStyle: "italic" },
      { token: "white", foreground: "ffffff" },
    ],
    colors: {
      "editor.foreground": "#ffffff",
      "editor.background": "#101a23",
      "editor.lineHighlightBackground": "transparent",

      "editor.selectionBackground": accent.selection,
      "editor.inactiveSelectionBackground": accent.selectionInactive,
      "editor.selectionHighlightBackground": accent.selectionHighlight,

      "editorLineNumber.foreground": accent.lineNumber,
      "editorLineNumber.activeForeground": `#${accent.token}`,
      "editorCursor.foreground": `#${accent.token}`,
      "editorGhostText.foreground": `#${accent.token}b3`,
      "editorGhostText.background": `#${accent.token}14`,

      "editorBracketMatch.background": accent.bracketBackground,
      "editorBracketMatch.border": accent.bracketBorder,

      "scrollbarSlider.background": accent.scrollbar,
      "scrollbarSlider.hoverBackground": accent.scrollbarHover,
      "scrollbarSlider.activeBackground": accent.scrollbarActive,
      "editorOverviewRuler.border": accent.widgetBorder,
      "editorOverviewRuler.errorForeground": accent.scrollbar,
      "editorOverviewRuler.warningForeground": accent.scrollbarHover,
      "editorOverviewRuler.infoForeground": accent.scrollbarActive,

      "editorIndentGuide.background": "#ffffff08",
      "editorIndentGuide.activeBackground": accent.indentGuide,

      "editorWidget.background": "#182431",
      "editorWidget.border": accent.widgetBorder,
      "editorSuggestWidget.background": "#182431",
      "editorSuggestWidget.border": accent.widgetBorder,
      "editorHoverWidget.background": "#182431",
      "editorHoverWidget.border": accent.widgetBorder,
    },
  });

  const blueTheme = createPseudocodeTheme({
    token: "60a5fa",
    selection: "#0d7ff250",
    selectionInactive: "#0d7ff235",
    selectionHighlight: "#0d7ff225",
    lineNumber: "#0d7ff2",
    bracketBackground: "#0d7ff225",
    bracketBorder: "#0d7ff280",
    scrollbar: "#0d7ff240",
    scrollbarHover: "#0d7ff270",
    scrollbarActive: "#0d7ff2a0",
    indentGuide: "#0d7ff250",
    widgetBorder: "#0d7ff250",
  });
  const cyanTheme = createPseudocodeTheme({
    token: "67e8f9",
    selection: "#06b6d450",
    selectionInactive: "#06b6d435",
    selectionHighlight: "#06b6d425",
    lineNumber: "#67e8f9",
    bracketBackground: "#06b6d425",
    bracketBorder: "#06b6d480",
    scrollbar: "#06b6d440",
    scrollbarHover: "#06b6d470",
    scrollbarActive: "#06b6d4a0",
    indentGuide: "#06b6d450",
    widgetBorder: "#06b6d450",
  });

  monaco.editor.defineTheme("pseudocode-theme", blueTheme);
  monaco.editor.defineTheme("pseudocode-example-theme", cyanTheme);
}
