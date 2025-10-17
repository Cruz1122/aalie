// Monaco Diagnostics Adapter
import type * as Monaco from "monaco-editor";
import type { ParseError } from "@aa/types";

/**
 * Convierte errores del parser a markers de Monaco
 */
export function errorsToMarkers(errors: ParseError[]): Monaco.editor.IMarkerData[] {
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
 * Proveedor de hover para mostrar información de errores
 */
export function createHoverProvider(
  errors: ParseError[]
): Monaco.languages.HoverProvider {
  return {
    provideHover: (model, position) => {
      // Buscar error en esta posición
      const error = errors.find(
        (e) =>
          e.line === position.lineNumber &&
          e.column >= position.column - 1 &&
          e.column <= position.column + 1
      );

      if (error) {
        return {
          contents: [
            { value: "**Error de sintaxis**" },
            { value: error.message },
          ],
        };
      }

      return null;
    },
  };
}

/**
 * Configuración del lenguaje para Monaco
 */
export function registerPseudocodeLanguage(monaco: typeof Monaco): void {
  // Registrar lenguaje
  monaco.languages.register({ id: "pseudocode" });

  // Configurar tokens
  monaco.languages.setMonarchTokensProvider("pseudocode", {
    keywords: [
      "BEGIN",
      "END",
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
      "AND",
      "OR",
      "NOT",
      "DIV",
      "MOD",
      "TRUE",
      "FALSE",
      "NULL",
      "length",
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
        // Keywords
        [/\b(?:BEGIN|END|IF|THEN|ELSE|FOR|TO|DO|WHILE|REPEAT|UNTIL|RETURN|CALL|AND|OR|NOT|DIV|MOD|TRUE|FALSE|NULL|length)\b/, "keyword"],

        // Identifiers
        [/[a-zA-Z_]\w*/, "identifier"],

        // Numbers
        [/\d+/, "number"],

        // Operators
        [/<-|←|:=|==|!=|<>|≠|<=|≤|>=|≥|<|>/, "operator"],
        [/[+\-*/]/, "operator"],

        // Delimiters
        [/[(){}[\];,.]/, "delimiter"],

        // Whitespace
        [/\s+/, "white"],
      ],
    },
  });

  // Configurar tema oscuro consistente con la paleta del sitio (tema azul)
  monaco.editor.defineTheme("pseudocode-theme", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "60a5fa", fontStyle: "bold" }, // Blue-400
      { token: "identifier", foreground: "e2e8f0" }, // Slate-200
      { token: "number", foreground: "34d399" }, // Emerald-400
      { token: "operator", foreground: "3b82f6" }, // Blue-500
      { token: "delimiter", foreground: "94a3b8" }, // Slate-400
      { token: "comment", foreground: "64748b", fontStyle: "italic" }, // Slate-500
    ],
    colors: {
      // Fondo y colores base más suaves
      "editor.foreground": "#e2e8f0",
      "editor.background": "#0f172a", // Slate-900
      "editor.lineHighlightBackground": "#1e293b", // Slate-800
      
      // Selección con tono azul suave
      "editor.selectionBackground": "#3b82f630",
      "editor.inactiveSelectionBackground": "#3b82f620",
      "editor.selectionHighlightBackground": "#3b82f615",
      
      // Números de línea más suaves
      "editorLineNumber.foreground": "#475569", // Slate-600
      "editorLineNumber.activeForeground": "#60a5fa", // Blue-400
      
      // Cursor azul para combinar
      "editorCursor.foreground": "#60a5fa",
      
      // Brackets matching suave
      "editorBracketMatch.background": "#3b82f620",
      "editorBracketMatch.border": "#60a5fa60",
      
      // Scrollbar suave
      "scrollbarSlider.background": "#ffffff15",
      "scrollbarSlider.hoverBackground": "#ffffff20",
      "scrollbarSlider.activeBackground": "#ffffff25",
      
      // Indentación suave
      "editorIndentGuide.background": "#ffffff08",
      "editorIndentGuide.activeBackground": "#3b82f630",
      
      // Otros colores para consistencia
      "editorWidget.background": "#1e293b",
      "editorWidget.border": "#ffffff10",
      "editorSuggestWidget.background": "#1e293b",
      "editorSuggestWidget.border": "#ffffff10",
      "editorHoverWidget.background": "#1e293b",
      "editorHoverWidget.border": "#60a5fa40",
    },
  });
}

