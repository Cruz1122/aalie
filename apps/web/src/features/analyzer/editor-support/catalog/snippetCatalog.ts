import { algorithmCompletionSnippets } from "./algorithmCompletionSnippets";
import {
  SNIPPET_CATEGORY_LABEL_KEYS,
  SNIPPET_CATEGORY_ORDER,
  type SnippetCategory,
} from "./snippetCategories";
import { snippetTemplates } from "./snippetTemplates";

export type SupportedLocale = "es" | "en";

export type SnippetInsertKind =
  | "inline"
  | "block"
  | "template"
  | "wrap-selection";

export type SnippetStatus = "active" | "experimental" | "hidden";

export interface SnippetDefinition {
  readonly id: string;
  readonly label: string;
  readonly shortLabel: string;
  readonly category: SnippetCategory;
  readonly priority: number;
  readonly aliases: readonly string[];
  readonly insertKind: SnippetInsertKind;
  readonly insertText: string;
  readonly placeholders: readonly string[];
  readonly documentationShort: string;
  readonly documentationPedagogical: string;
  readonly preview: string;
  readonly contextRules: readonly string[];
  readonly requiresSelection: boolean;
  readonly supportsSelectionWrap: boolean;
  readonly parserExpectation: string;
  readonly status: SnippetStatus;
  readonly exampleAlgorithmKind?: "iterative" | "recursive" | "hybrid";
  readonly supportsAnalyze?: boolean;
  readonly supportsDetectMethods?: boolean;
  readonly expectedUseCase?: string;
  readonly localizations?: Partial<
    Record<SupportedLocale, SnippetLocalizationOverrides>
  >;
}

export type LocalizedSnippetDefinition = Omit<
  SnippetDefinition,
  "localizations"
>;

export type SnippetLocalizationFields = Pick<
  LocalizedSnippetDefinition,
  | "aliases"
  | "insertText"
  | "label"
  | "shortLabel"
  | "documentationShort"
  | "documentationPedagogical"
  | "preview"
  | "expectedUseCase"
>;

export type SnippetLocalizationOverrides = Partial<SnippetLocalizationFields>;

const coreSnippets: SnippetDefinition[] = [
  {
    id: "assign",
    label: "Asignación",
    shortLabel: "Asignación",
    category: "recommended",
    priority: 1000,
    aliases: ["assign", "asig", "set"],
    insertKind: "inline",
    insertText: "${1:variable} <- ${2:valor};",
    placeholders: ["variable", "valor"],
    documentationShort: "Inserta una asignación con el operador oficial <-.",
    documentationPedagogical: "Úsalo para guardar un valor en una variable.",
    preview: "x <- valor;",
    contextRules: ["lineStart"],
    requiresSelection: false,
    supportsSelectionWrap: false,
    parserExpectation: "parseable",
    status: "active",
  },
  {
    id: "if",
    label: "IF",
    shortLabel: "IF",
    category: "recommended",
    priority: 995,
    aliases: ["if"],
    insertKind: "block",
    insertText: "IF (${1:condicion}) THEN BEGIN\n  ${2}\nEND",
    placeholders: ["condicion"],
    documentationShort: "Inserta un bloque IF completo.",
    documentationPedagogical:
      "Úsalo cuando una acción ocurre solo si se cumple una condición.",
    preview: "IF (condicion) THEN BEGIN ... END",
    contextRules: ["lineStart", "selectionWrap"],
    requiresSelection: false,
    supportsSelectionWrap: true,
    parserExpectation: "parseable",
    status: "active",
  },
  {
    id: "if-else",
    label: "IF / ELSE",
    shortLabel: "IF / ELSE",
    category: "recommended",
    priority: 994,
    aliases: ["ife", "ifelse"],
    insertKind: "block",
    insertText:
      "IF (${1:condicion}) THEN BEGIN\n  ${2}\nEND ELSE BEGIN\n  ${3}\nEND",
    placeholders: ["condicion"],
    documentationShort: "Inserta un bloque IF / ELSE completo.",
    documentationPedagogical:
      "Úsalo cuando necesitas una acción para el caso verdadero y otra para el falso.",
    preview: "IF (...) THEN BEGIN ... END ELSE BEGIN ... END",
    contextRules: ["lineStart", "selectionWrap"],
    requiresSelection: false,
    supportsSelectionWrap: true,
    parserExpectation: "parseable",
    status: "active",
  },
  {
    id: "while",
    label: "WHILE",
    shortLabel: "WHILE",
    category: "recommended",
    priority: 993,
    aliases: ["wh", "while"],
    insertKind: "block",
    insertText: "WHILE (${1:condicion}) DO BEGIN\n  ${2}\nEND",
    placeholders: ["condicion"],
    documentationShort: "Inserta un ciclo WHILE con bloque completo.",
    documentationPedagogical:
      "Úsalo cuando repites mientras la condición siga siendo verdadera.",
    preview: "WHILE (...) DO BEGIN ... END",
    contextRules: ["lineStart", "selectionWrap"],
    requiresSelection: false,
    supportsSelectionWrap: true,
    parserExpectation: "parseable",
    status: "active",
  },
  {
    id: "for",
    label: "FOR",
    shortLabel: "FOR",
    category: "recommended",
    priority: 992,
    aliases: ["for"],
    insertKind: "block",
    insertText: "FOR ${1:i} <- ${2:1} TO ${3:n} DO BEGIN\n  ${4}\nEND",
    placeholders: ["i", "1", "n"],
    documentationShort: "Inserta un ciclo FOR con contador y límite superior.",
    documentationPedagogical:
      "Úsalo cuando sabes desde el inicio cuántas repeticiones necesitas.",
    preview: "FOR i <- 1 TO n DO BEGIN ... END",
    contextRules: ["lineStart", "selectionWrap"],
    requiresSelection: false,
    supportsSelectionWrap: true,
    parserExpectation: "parseable",
    status: "active",
  },
  {
    id: "return-value",
    label: "RETURN",
    shortLabel: "RETURN",
    category: "recommended",
    priority: 991,
    aliases: ["ret", "return"],
    insertKind: "inline",
    insertText: "RETURN ${1:valor};",
    placeholders: ["valor"],
    documentationShort: "Inserta un retorno con expresión.",
    documentationPedagogical:
      "Úsalo cuando el algoritmo debe entregar un resultado.",
    preview: "RETURN valor;",
    contextRules: ["lineStart"],
    requiresSelection: false,
    supportsSelectionWrap: false,
    parserExpectation: "parseable",
    status: "active",
  },
  {
    id: "call",
    label: "CALL",
    shortLabel: "CALL",
    category: "recommended",
    priority: 990,
    aliases: ["call"],
    insertKind: "inline",
    insertText: "CALL ${1:subrutina}(${2:parametros});",
    placeholders: ["subrutina", "parametros"],
    documentationShort: "Inserta una llamada-sentencia con ; final.",
    documentationPedagogical:
      "Úsalo cuando llamas una subrutina como sentencia independiente.",
    preview: "CALL subrutina(parametros);",
    contextRules: ["lineStart"],
    requiresSelection: false,
    supportsSelectionWrap: false,
    parserExpectation: "parseable",
    status: "active",
  },
  {
    id: "array-index",
    label: "A[i]",
    shortLabel: "A[i]",
    category: "recommended",
    priority: 989,
    aliases: ["arr", "index", "a["],
    insertKind: "inline",
    insertText: "${1:A}[${2:i}]",
    placeholders: ["A", "i"],
    documentationShort: "Inserta acceso a una posición de arreglo.",
    documentationPedagogical:
      "Úsalo cuando necesitas leer o escribir un elemento concreto.",
    preview: "A[i]",
    contextRules: ["inline"],
    requiresSelection: false,
    supportsSelectionWrap: false,
    parserExpectation: "parseable",
    status: "active",
  },
  {
    id: "length",
    label: "length(A)",
    shortLabel: "length(A)",
    category: "recommended",
    priority: 988,
    aliases: ["len", "length"],
    insertKind: "inline",
    insertText: "length(${1:A})",
    placeholders: ["A"],
    documentationShort: "Inserta la función length sobre un arreglo.",
    documentationPedagogical:
      "Úsalo cuando necesitas el tamaño lógico de una estructura indexable.",
    preview: "length(A)",
    contextRules: ["inline"],
    requiresSelection: false,
    supportsSelectionWrap: false,
    parserExpectation: "parseable",
    status: "active",
  },
  {
    id: "base-case",
    label: "Caso base",
    shortLabel: "Caso base",
    category: "recommended",
    priority: 987,
    aliases: ["base", "basecase"],
    insertKind: "block",
    insertText:
      "IF (${1:n <= 1}) THEN BEGIN\n  RETURN ${2:resultado_base};\nEND",
    placeholders: ["n <= 1", "resultado_base"],
    documentationShort: "Inserta un caso base recursivo con RETURN.",
    documentationPedagogical:
      "Úsalo para detener la recursión cuando ya no debes seguir dividiendo el problema.",
    preview: "IF (n <= 1) THEN BEGIN RETURN ...; END",
    contextRules: ["lineStart"],
    requiresSelection: false,
    supportsSelectionWrap: false,
    parserExpectation: "parseable",
    status: "active",
  },
  {
    id: "recursive-call",
    label: "Llamada recursiva",
    shortLabel: "Recursiva",
    category: "recommended",
    priority: 986,
    aliases: ["rec", "recurse"],
    insertKind: "inline",
    insertText: "RETURN ${1:funcion}(${2:parametros});",
    placeholders: ["funcion", "parametros"],
    documentationShort: "Inserta un retorno con llamada recursiva.",
    documentationPedagogical:
      "Úsalo cuando el resultado sale de resolver un caso más pequeño.",
    preview: "RETURN f(...);",
    contextRules: ["lineStart"],
    requiresSelection: false,
    supportsSelectionWrap: false,
    parserExpectation: "parseable",
    status: "active",
  },
  {
    id: "comparison-ne",
    label: "Comparación !=",
    shortLabel: "!=",
    category: "conditions",
    priority: 900,
    aliases: ["!=", "neq"],
    insertKind: "inline",
    insertText: "${1:a} != ${2:b}",
    placeholders: ["a", "b"],
    documentationShort: "Inserta una comparación de diferencia con !=.",
    documentationPedagogical: "Úsalo cuando dos valores no deben ser iguales.",
    preview: "a != b",
    contextRules: ["inline"],
    requiresSelection: false,
    supportsSelectionWrap: false,
    parserExpectation: "parseable",
    status: "active",
  },
  {
    id: "comparison-le",
    label: "Comparación <=",
    shortLabel: "<=",
    category: "conditions",
    priority: 899,
    aliases: ["<=", "le"],
    insertKind: "inline",
    insertText: "${1:a} <= ${2:b}",
    placeholders: ["a", "b"],
    documentationShort: "Inserta una comparación menor o igual en ASCII.",
    documentationPedagogical:
      "Úsalo cuando el valor izquierdo puede ser menor o igual al derecho.",
    preview: "a <= b",
    contextRules: ["inline"],
    requiresSelection: false,
    supportsSelectionWrap: false,
    parserExpectation: "parseable",
    status: "active",
  },
  {
    id: "comparison-ge",
    label: "Comparación >=",
    shortLabel: ">=",
    category: "conditions",
    priority: 898,
    aliases: [">=", "ge"],
    insertKind: "inline",
    insertText: "${1:a} >= ${2:b}",
    placeholders: ["a", "b"],
    documentationShort: "Inserta una comparación mayor o igual en ASCII.",
    documentationPedagogical:
      "Úsalo cuando el valor izquierdo puede ser mayor o igual al derecho.",
    preview: "a >= b",
    contextRules: ["inline"],
    requiresSelection: false,
    supportsSelectionWrap: false,
    parserExpectation: "parseable",
    status: "active",
  },
  {
    id: "repeat-until",
    label: "REPEAT / UNTIL",
    shortLabel: "REPEAT",
    category: "loops",
    priority: 897,
    aliases: ["rep", "repeat"],
    insertKind: "block",
    insertText: "REPEAT\n  ${1}\nUNTIL (${2:condicion});",
    placeholders: ["", "condicion"],
    documentationShort: "Inserta un ciclo REPEAT / UNTIL.",
    documentationPedagogical:
      "Úsalo cuando el bloque corre una vez antes de validar la condición.",
    preview: "REPEAT ... UNTIL (...)",
    contextRules: ["lineStart"],
    requiresSelection: false,
    supportsSelectionWrap: false,
    parserExpectation: "parseable",
    status: "active",
  },
  {
    id: "begin-end",
    label: "BEGIN / END",
    shortLabel: "BEGIN / END",
    category: "loops",
    priority: 896,
    aliases: ["begin", "block"],
    insertKind: "wrap-selection",
    insertText: "BEGIN\n  ${1}\nEND",
    placeholders: [""],
    documentationShort: "Inserta o envuelve un bloque BEGIN / END.",
    documentationPedagogical:
      "Úsalo para agrupar varias sentencias dentro de una estructura de control.",
    preview: "BEGIN ... END",
    contextRules: ["selectionWrap", "lineStart"],
    requiresSelection: false,
    supportsSelectionWrap: true,
    parserExpectation: "parseable",
    status: "active",
  },
  {
    id: "algorithm-header",
    label: "Cabecera de algoritmo",
    shortLabel: "Cabecera",
    category: "other",
    priority: 895,
    aliases: ["header", "algo", "proc"],
    insertKind: "block",
    insertText: "${1:nombre}(${2:parametros}) BEGIN\n  ${3}\nEND",
    placeholders: ["nombre", "parametros"],
    documentationShort: "Inserta la firma base de un algoritmo.",
    documentationPedagogical:
      "Úsalo para empezar una solución completa con la forma oficial del parser.",
    preview: "nombre(parametros) BEGIN ... END",
    contextRules: ["lineStart"],
    requiresSelection: false,
    supportsSelectionWrap: false,
    parserExpectation: "parseable",
    status: "active",
  },
  {
    id: "comment",
    label: "Comentario",
    shortLabel: "Comentario",
    category: "other",
    priority: 894,
    aliases: ["comment", "//"],
    insertKind: "inline",
    insertText: "// ${1:comentario}",
    placeholders: ["comentario"],
    documentationShort:
      "Inserta un comentario de línea con la sintaxis oficial //.",
    documentationPedagogical:
      "Úsalo para notas breves sin afectar el parseo del algoritmo.",
    preview: "// comentario",
    contextRules: ["lineStart"],
    requiresSelection: false,
    supportsSelectionWrap: false,
    parserExpectation: "parseable",
    status: "active",
  },
  {
    id: "array-slice",
    label: "A[i..j]",
    shortLabel: "A[i..j]",
    category: "other",
    priority: 893,
    aliases: ["slice", "range"],
    insertKind: "inline",
    insertText: "${1:A}[${2:i}..${3:j}]",
    placeholders: ["A", "i", "j"],
    documentationShort: "Inserta una referencia por rango dentro de corchetes.",
    documentationPedagogical:
      "Úsalo cuando quieres expresar un tramo del arreglo con inicio y fin.",
    preview: "A[i..j]",
    contextRules: ["inline"],
    requiresSelection: false,
    supportsSelectionWrap: false,
    parserExpectation: "parseable",
    status: "active",
  },
  {
    id: "rec-linear",
    label: "Retorno recursivo lineal",
    shortLabel: "Recursión lineal",
    category: "other",
    priority: 892,
    aliases: ["recline", "tailrec"],
    insertKind: "inline",
    insertText: "RETURN ${1:n} * ${2:funcion}(${3:n - 1});",
    placeholders: ["n", "funcion", "n - 1"],
    documentationShort: "Inserta un patrón de retorno recursivo lineal.",
    documentationPedagogical:
      "Úsalo cuando el problema se reduce a una sola llamada más pequeña.",
    preview: "RETURN n * f(n - 1);",
    contextRules: ["lineStart"],
    requiresSelection: false,
    supportsSelectionWrap: false,
    parserExpectation: "parseable",
    status: "active",
  },
  {
    id: "dp-transition",
    label: "Transición simple",
    shortLabel: "Transición DP",
    category: "other",
    priority: 891,
    aliases: ["dptrans", "transition"],
    insertKind: "inline",
    insertText: "${1:dp}[${2:i}] <- ${1:dp}[${2:i} - 1] + ${1:dp}[${2:i} - 2];",
    placeholders: ["dp", "i"],
    documentationShort: "Inserta una transición simple sobre una tabla DP.",
    documentationPedagogical:
      "Úsalo cuando el estado actual depende de estados ya calculados.",
    preview: "dp[i] <- dp[i - 1] + dp[i - 2];",
    contextRules: ["lineStart"],
    requiresSelection: false,
    supportsSelectionWrap: false,
    parserExpectation: "parseable",
    status: "active",
  },
  {
    id: "class-definition",
    label: "Definición de clase",
    shortLabel: "Clase",
    category: "other",
    priority: 890,
    aliases: ["class", "obj"],
    insertKind: "inline",
    insertText: "Class ${1:Nombre} { ${2:atributo} }",
    placeholders: ["Nombre", "atributo"],
    documentationShort:
      "Inserta una definición compacta de clase soportada por la gramática.",
    documentationPedagogical:
      "Úsalo solo cuando realmente trabajas con objetos en pseudocódigo soportado.",
    preview: "Class Nombre { attr }",
    contextRules: ["lineStart"],
    requiresSelection: false,
    supportsSelectionWrap: false,
    parserExpectation: "parseable",
    status: "active",
  },
];

export const snippetCatalog: SnippetDefinition[] = [
  ...coreSnippets,
  ...snippetTemplates,
];

export const activeSnippetCatalog = snippetCatalog.filter(
  (snippet) => snippet.status === "active",
);

export const completionSnippetCatalog: SnippetDefinition[] = [
  ...activeSnippetCatalog,
  ...algorithmCompletionSnippets.filter(
    (snippet) => snippet.status === "active",
  ),
];

export const recommendedSnippetIds = [
  "algorithm-header",
  "assign",
  "if",
  "if-else",
  "for",
  "while",
  "return-value",
  "call",
  "array-index",
  "length",
  "base-case",
  "comment",
] as const;

const panelSectionSnippetIds: Record<SnippetCategory, readonly string[]> = {
  recommended: recommendedSnippetIds,
  conditions: [
    "if",
    "if-else",
    "base-case",
    "comparison-le",
    "comparison-ge",
    "comparison-ne",
  ],
  loops: [
    "for",
    "while",
    "repeat-until",
    "begin-end",
    "template-linear-traversal",
    "template-array-sum",
    "template-dp-table",
    "template-greedy-selection",
  ],
  functions: [
    "algorithm-header",
    "call",
    "return-value",
    "recursive-call",
    "rec-linear",
    "base-case",
    "length",
    "template-factorial",
    "template-fibonacci",
    "template-memoization-simple",
    "template-backtracking-choice",
    "template-branch-bound-prune",
  ],
  templates: [
    "template-linear-traversal",
    "template-array-sum",
    "template-factorial",
    "template-fibonacci",
    "template-binary-search",
    "template-memoization-simple",
    "template-dp-table",
    "template-greedy-selection",
    "template-backtracking-choice",
    "template-branch-bound-prune",
    "template-merge-sort",
    "template-quicksort",
  ],
  other: [
    "comment",
    "array-index",
    "array-slice",
    "dp-transition",
    "class-definition",
    "rec-linear",
  ],
};

export function getSnippetById(id: string): SnippetDefinition | undefined {
  return activeSnippetCatalog.find((snippet) => snippet.id === id);
}

export function getSnippetsForCategory(
  category: SnippetCategory,
): SnippetDefinition[] {
  if (category === "templates") {
    return completionSnippetCatalog
      .filter((snippet) => snippet.category === "templates")
      .sort((left, right) => right.priority - left.priority);
  }

  return panelSectionSnippetIds[category]
    .map((id) => getSnippetById(id))
    .filter((snippet): snippet is SnippetDefinition => Boolean(snippet));
}

export function getCategorizedSnippets() {
  return SNIPPET_CATEGORY_ORDER.map((category) => ({
    category,
    labelKey: SNIPPET_CATEGORY_LABEL_KEYS[category],
    snippets: getSnippetsForCategory(category),
  })).filter((section) => section.snippets.length > 0);
}

const EN_LOCALIZATION: Partial<Record<string, SnippetLocalizationOverrides>> = {
  assign: {
    label: "Assignment",
    shortLabel: "Assignment",
    aliases: ["assignment", "assign", "set"],
    insertText: "${1:variable} <- ${2:value};",
    documentationShort: "Inserts an assignment using the official <- operator.",
    documentationPedagogical: "Use it to store a value in a variable.",
    preview: "x <- value;",
  },
  if: {
    label: "IF",
    shortLabel: "IF",
    insertText: "IF (${1:condition}) THEN BEGIN\n  ${2}\nEND",
    documentationShort: "Inserts a complete IF block.",
    documentationPedagogical:
      "Use it when an action happens only if a condition is true.",
    preview: "IF (condition) THEN BEGIN ... END",
  },
  "if-else": {
    label: "IF / ELSE",
    shortLabel: "IF / ELSE",
    insertText:
      "IF (${1:condition}) THEN BEGIN\n  ${2}\nEND ELSE BEGIN\n  ${3}\nEND",
    documentationShort: "Inserts a complete IF / ELSE block.",
    documentationPedagogical:
      "Use it when you need one action for the true case and another for the false case.",
    preview: "IF (...) THEN BEGIN ... END ELSE BEGIN ... END",
  },
  while: {
    label: "WHILE",
    shortLabel: "WHILE",
    insertText: "WHILE (${1:condition}) DO BEGIN\n  ${2}\nEND",
    documentationShort: "Inserts a WHILE loop with a complete block.",
    documentationPedagogical:
      "Use it when you repeat while a condition stays true.",
    preview: "WHILE (...) DO BEGIN ... END",
  },
  for: {
    label: "FOR",
    shortLabel: "FOR",
    insertText: "FOR ${1:i} <- ${2:1} TO ${3:n} DO BEGIN\n  ${4}\nEND",
    documentationShort: "Inserts a FOR loop with counter and upper bound.",
    documentationPedagogical:
      "Use it when you already know how many repetitions you need.",
    preview: "FOR i <- 1 TO n DO BEGIN ... END",
  },
  "return-value": {
    label: "RETURN",
    shortLabel: "RETURN",
    aliases: ["return", "result"],
    insertText: "RETURN ${1:value};",
    documentationShort: "Inserts a return with an expression.",
    documentationPedagogical:
      "Use it when the algorithm must produce a result.",
    preview: "RETURN value;",
  },
  call: {
    label: "CALL",
    shortLabel: "CALL",
    insertText: "CALL ${1:subroutine}(${2:params});",
    documentationShort: "Inserts a statement call with a trailing semicolon.",
    documentationPedagogical:
      "Use it when you call a subroutine as an independent statement.",
    preview: "CALL subroutine(params);",
  },
  "array-index": {
    label: "A[i]",
    shortLabel: "A[i]",
    documentationShort: "Inserts access to an array position.",
    documentationPedagogical:
      "Use it when you need to read or write a concrete element.",
    preview: "A[i]",
  },
  length: {
    label: "length(A)",
    shortLabel: "length(A)",
    documentationShort: "Inserts the length function over an array.",
    documentationPedagogical:
      "Use it when you need the logical size of an indexable structure.",
    preview: "length(A)",
  },
  "base-case": {
    label: "Base case",
    shortLabel: "Base case",
    aliases: ["base", "basecase"],
    insertText: "IF (${1:n <= 1}) THEN BEGIN\n  RETURN ${2:base_result};\nEND",
    documentationShort: "Inserts a recursive base case with RETURN.",
    documentationPedagogical:
      "Use it to stop recursion when the problem should no longer be divided.",
    preview: "IF (n <= 1) THEN BEGIN RETURN ...; END",
  },
  "recursive-call": {
    label: "Recursive call",
    shortLabel: "Recursive",
    aliases: ["recursive", "recurse"],
    insertText: "RETURN ${1:function}(${2:params});",
    documentationShort: "Inserts a return with a recursive call.",
    documentationPedagogical:
      "Use it when the result depends on solving a smaller version of the problem.",
    preview: "RETURN f(...);",
  },
  "comparison-ne": {
    label: "Comparison !=",
    shortLabel: "!=",
    documentationShort: "Inserts an inequality comparison with !=.",
    documentationPedagogical: "Use it when two values must be different.",
    preview: "a != b",
  },
  "comparison-le": {
    label: "Comparison <=",
    shortLabel: "<=",
    documentationShort: "Inserts a less-than-or-equal comparison in ASCII.",
    documentationPedagogical:
      "Use it when the left value can be smaller than or equal to the right one.",
    preview: "a <= b",
  },
  "comparison-ge": {
    label: "Comparison >=",
    shortLabel: ">=",
    documentationShort: "Inserts a greater-than-or-equal comparison in ASCII.",
    documentationPedagogical:
      "Use it when the left value can be greater than or equal to the right one.",
    preview: "a >= b",
  },
  "repeat-until": {
    label: "REPEAT / UNTIL",
    shortLabel: "REPEAT",
    insertText: "REPEAT\n  ${1}\nUNTIL (${2:condition});",
    documentationShort: "Inserts a REPEAT / UNTIL loop.",
    documentationPedagogical:
      "Use it when the body must run at least once before checking the condition.",
    preview: "REPEAT ... UNTIL (...)",
  },
  "begin-end": {
    label: "BEGIN / END",
    shortLabel: "BEGIN / END",
    documentationShort: "Inserts or wraps a BEGIN / END block.",
    documentationPedagogical:
      "Use it to group several statements inside a control structure.",
    preview: "BEGIN ... END",
  },
  "algorithm-header": {
    label: "Algorithm header",
    shortLabel: "Header",
    aliases: ["header", "algorithm", "procedure"],
    insertText: "${1:name}(${2:params}) BEGIN\n  ${3}\nEND",
    documentationShort: "Inserts the base signature of an algorithm.",
    documentationPedagogical:
      "Use it to start a complete solution with the official parser shape.",
    preview: "name(params) BEGIN ... END",
  },
  comment: {
    label: "Comment",
    shortLabel: "Comment",
    insertText: "// ${1:comment}",
    documentationShort: "Inserts a line comment with the official // syntax.",
    documentationPedagogical:
      "Use it for short notes without affecting algorithm parsing.",
    preview: "// comment",
  },
  "array-slice": {
    label: "A[i..j]",
    shortLabel: "A[i..j]",
    documentationShort: "Inserts a ranged reference inside brackets.",
    documentationPedagogical:
      "Use it when you want to express a slice with start and end.",
    preview: "A[i..j]",
  },
  "rec-linear": {
    label: "Linear recursive return",
    shortLabel: "Linear recursion",
    insertText: "RETURN ${1:n} * ${2:function}(${3:n - 1});",
    documentationShort: "Inserts a linear recursive return pattern.",
    documentationPedagogical:
      "Use it when the problem is reduced to a single smaller call.",
    preview: "RETURN n * f(n - 1);",
  },
  "dp-transition": {
    label: "Simple transition",
    shortLabel: "DP transition",
    documentationShort: "Inserts a simple transition over a DP table.",
    documentationPedagogical:
      "Use it when the current state depends on already computed states.",
    preview: "dp[i] <- dp[i - 1] + dp[i - 2];",
  },
  "class-definition": {
    label: "Class definition",
    shortLabel: "Class",
    insertText: "Class ${1:Name} { ${2:attribute} }",
    documentationShort:
      "Inserts a compact class definition supported by the grammar.",
    documentationPedagogical:
      "Use it only when you are really working with objects in supported pseudocode.",
    preview: "Class Name { attr }",
  },
  "template-binary-search": {
    label: "Binary search",
    shortLabel: "Binary search",
    aliases: ["binary", "binarysearch", "search"],
    insertText: [
      "binarySearch(A[n], x, start, end) BEGIN",
      "  IF (start > end) THEN BEGIN",
      "    RETURN -1;",
      "  END",
      "  mid <- (start + end) DIV 2;",
      "  IF (A[mid] = x) THEN BEGIN",
      "    RETURN mid;",
      "  END",
      "  ELSE BEGIN",
      "    IF (x < A[mid]) THEN BEGIN",
      "      RETURN binarySearch(A, x, start, mid - 1);",
      "    END",
      "    ELSE BEGIN",
      "      RETURN binarySearch(A, x, mid + 1, end);",
      "    END",
      "  END",
      "END",
    ].join("\n"),
    documentationShort: "Inserts a recursive binary search template.",
    documentationPedagogical:
      "Use it when the range is split in half at each step.",
    preview: "Signature + base case + midpoint + recursive calls",
    expectedUseCase: "Practice divide and conquer over a sorted array.",
  },
  "template-factorial": {
    label: "Factorial",
    shortLabel: "Factorial",
    documentationShort: "Inserts a linear recursive factorial template.",
    documentationPedagogical:
      "Use it to practice base case and simple recursive return.",
    preview: "Base case + return n * factorial(n - 1)",
    expectedUseCase: "Introduction to linear recursion.",
  },
  "template-fibonacci": {
    label: "Fibonacci",
    shortLabel: "Fibonacci",
    documentationShort: "Inserts the classic recursive Fibonacci version.",
    documentationPedagogical:
      "Use it to practice double-branch recursion and compare it with DP.",
    preview: "Base case + two recursive calls",
    expectedUseCase: "Practice branching recursion and DP discussion.",
  },
  "template-merge-sort": {
    label: "Merge sort",
    shortLabel: "Merge sort",
    insertText: [
      "mergeSort(A[n], left, right) BEGIN",
      "  IF (left >= right) THEN BEGIN",
      "    RETURN left;",
      "  END",
      "  middle <- (left + right) DIV 2;",
      "  CALL mergeSort(A, left, middle);",
      "  CALL mergeSort(A, middle + 1, right);",
      "  CALL merge(A, left, middle, right);",
      "  RETURN middle;",
      "END",
    ].join("\n"),
    documentationShort: "Inserts a base merge sort template.",
    documentationPedagogical:
      "Use it to practice divide and conquer with explicit combine step.",
    preview: "Split + two CALLs + merge",
    expectedUseCase:
      "Practice divide-and-conquer recursion with combine phase.",
  },
  "template-quicksort": {
    label: "Quicksort",
    shortLabel: "Quicksort",
    insertText: [
      "quickSort(A[n], left, right) BEGIN",
      "  IF (left >= right) THEN BEGIN",
      "    RETURN left;",
      "  END",
      "  pivot <- partition(A, left, right);",
      "  CALL quickSort(A, left, pivot - 1);",
      "  CALL quickSort(A, pivot + 1, right);",
      "  RETURN pivot;",
      "END",
    ].join("\n"),
    documentationShort: "Inserts a base quicksort template.",
    documentationPedagogical:
      "Use it to practice writing and partially analyzing recursive partitioning.",
    preview: "partition + two recursive CALLs",
    expectedUseCase:
      "Writing practice and guided analysis with partial engine coverage.",
  },
  "template-linear-traversal": {
    label: "Linear traversal",
    shortLabel: "Traversal",
    aliases: ["linear", "traversal", "scan"],
    insertText: [
      "linearTraversal(A[n], n) BEGIN",
      "  FOR i <- 1 TO n DO BEGIN",
      "    current <- A[i];",
      "  END",
      "  RETURN n;",
      "END",
    ].join("\n"),
    documentationShort: "Inserts a base template to traverse an array.",
    documentationPedagogical:
      "Use it when the algorithm visits each position once.",
    preview: "FOR i <- 1 TO n",
    expectedUseCase: "Skeleton for linear algorithms over arrays.",
  },
  "template-array-sum": {
    label: "Array sum",
    shortLabel: "Array sum",
    aliases: ["sumarray", "sum", "arraysum"],
    insertText: [
      "arraySum(A[n], n) BEGIN",
      "  sum <- 0;",
      "  FOR i <- 1 TO n DO BEGIN",
      "    sum <- sum + A[i];",
      "  END",
      "  RETURN sum;",
      "END",
    ].join("\n"),
    documentationShort: "Inserts an accumulated-sum template over an array.",
    documentationPedagogical:
      "Use it to practice accumulators and full traversals.",
    preview: "sum <- sum + A[i]",
    expectedUseCase: "Iterative algorithms with accumulator.",
  },
  "template-memoization-simple": {
    label: "Simple memoization",
    shortLabel: "Memo",
    documentationShort: "Inserts a recursive template with memoization.",
    documentationPedagogical:
      "Use it when you want to remember already computed results.",
    preview: "Memo check + save + return",
    expectedUseCase: "Practice recursion optimization with cache.",
  },
  "template-dp-table": {
    label: "DP table fill",
    shortLabel: "DP table",
    aliases: ["dp", "table", "tabulation"],
    insertText: [
      "simpleDp(n, dp[n]) BEGIN",
      "  dp[0] <- 0;",
      "  dp[1] <- 1;",
      "  FOR i <- 2 TO n DO BEGIN",
      "    dp[i] <- dp[i - 1] + dp[i - 2];",
      "  END",
      "  RETURN dp[n];",
      "END",
    ].join("\n"),
    documentationShort:
      "Inserts a base tabulated dynamic-programming template.",
    documentationPedagogical:
      "Use it when the result is built from base cases upward.",
    preview: "Base cases + FOR + dp[i]",
    expectedUseCase: "Practice bottom-up tabulation.",
  },
  "template-greedy-selection": {
    label: "Greedy selection",
    shortLabel: "Greedy",
    aliases: ["greedy", "selection", "fractional", "local-choice"],
    insertText: [
      "greedySelection(W[n], V[n], n, capacity) BEGIN",
      "  CALL sortByRatioDescending(W, V, n);",
      "  total <- 0;",
      "  remaining <- capacity;",
      "  FOR i <- 1 TO n DO BEGIN",
      "    IF (W[i] <= remaining) THEN BEGIN",
      "      total <- total + V[i];",
      "      remaining <- remaining - W[i];",
      "    END",
      "  END",
      "  RETURN total;",
      "END",
    ].join("\n"),
    documentationShort: "Inserts a base greedy-selection template.",
    documentationPedagogical:
      "Use it when you keep the best local option without backtracking.",
    preview: "Sort + choose + update remaining",
    expectedUseCase: "Practice greedy algorithms with local decisions.",
  },
  "template-backtracking-choice": {
    label: "Backtracking with undo",
    shortLabel: "Backtracking",
    aliases: ["backtracking", "undo", "choice", "nqueens"],
    insertText: [
      "backtrackingChoice(state[n], pos, n) BEGIN",
      "  IF (pos > n) THEN BEGIN",
      "    RETURN 1;",
      "  END",
      "  total <- 0;",
      "  FOR option <- 1 TO n DO BEGIN",
      "    IF (isValidChoice(state, pos, option) = true) THEN BEGIN",
      "      state[pos] <- option;",
      "      total <- total + backtrackingChoice(state, pos + 1, n);",
      "      state[pos] <- 0;",
      "    END",
      "  END",
      "  RETURN total;",
      "END",
    ].join("\n"),
    documentationShort:
      "Inserts a backtracking template with choose, recurse, and undo.",
    documentationPedagogical:
      "Use it when you explore options recursively and undo each tentative move.",
    preview: "Choose + recurse + undo",
    expectedUseCase: "Practice decision-tree search with explicit undo.",
  },
  "template-branch-bound-prune": {
    label: "Branch and Bound",
    shortLabel: "B&B",
    aliases: ["branchandbound", "bnb", "bound", "prune"],
    insertText: [
      "branchBound(V[n], W[n], i, n, weight, value, capacity, best) BEGIN",
      "  IF (weight > capacity) THEN BEGIN",
      "    RETURN best;",
      "  END",
      "  IF (value > best) THEN BEGIN",
      "    best <- value;",
      "  END",
      "  bound <- estimateBound(V, W, i, n, weight, value, capacity);",
      "  IF (bound <= best) THEN BEGIN",
      "    RETURN best;",
      "  END",
      "  IF (i > n) THEN BEGIN",
      "    RETURN best;",
      "  END",
      "  best <- branchBound(V, W, i + 1, n, weight + W[i], value + V[i], capacity, best);",
      "  best <- branchBound(V, W, i + 1, n, weight, value, capacity, best);",
      "  RETURN best;",
      "END",
    ].join("\n"),
    documentationShort:
      "Inserts a Branch and Bound template with explicit bound and prune.",
    documentationPedagogical:
      "Use it when you search an optimization tree and cut branches that cannot beat the current best.",
    preview: "Update best + compute bound + prune",
    expectedUseCase: "Practice optimization search with explicit bounds.",
  },
};

function normalizeSnippetSearchValue(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function expandSnippetSearchValues(values: readonly string[]): string[] {
  const expanded = new Set<string>();

  for (const value of values) {
    const normalized = normalizeSnippetSearchValue(value);
    if (!normalized) {
      continue;
    }

    expanded.add(normalized);
    const words = normalized.split(/[^a-z0-9]+/).filter(Boolean);
    for (const word of words) {
      expanded.add(word);
    }
    if (words.length > 1) {
      expanded.add(words.join(""));
    }
  }

  return [...expanded];
}

export function getSnippetSearchTerms(
  snippet: SnippetDefinition,
  locale: string,
): string[] {
  const localizedSnippet = localizeSnippet(snippet, locale);
  return expandSnippetSearchValues([
    localizedSnippet.id,
    localizedSnippet.label,
    localizedSnippet.shortLabel,
    ...localizedSnippet.aliases,
  ]);
}

export function localizeSnippet(
  snippet: SnippetDefinition,
  locale: string,
): LocalizedSnippetDefinition {
  const { localizations, ...baseSnippet } = snippet;
  const normalizedLocale: SupportedLocale = locale === "en" ? "en" : "es";
  if (normalizedLocale === "es") {
    return baseSnippet;
  }

  const localized = {
    ...(EN_LOCALIZATION[snippet.id] ?? {}),
    ...(localizations?.[normalizedLocale] ?? {}),
  };
  if (Object.keys(localized).length === 0) {
    return baseSnippet;
  }

  return {
    ...baseSnippet,
    ...localized,
    aliases: localized.aliases ?? baseSnippet.aliases,
    insertText: localized.insertText ?? baseSnippet.insertText,
  };
}
