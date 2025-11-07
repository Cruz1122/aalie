/** Salud / health */
export interface Health { 
  status: "ok"; 
}

export interface HealthResponse {
  ok: boolean;
  service?: string;
  error?: string;
  status?: string;
}

/** ---- AST Nodes ---- */

/** Base para todos los nodos AST */
export interface BaseNode {
  type: string;
  pos: Position;
}

export interface Position {
  line: number;
  column: number;
}

/** Nodos literales e identificadores */
export interface Literal extends BaseNode {
  type: "Literal";
  value: number | boolean | string | null;
}

export interface Identifier extends BaseNode {
  type: "Identifier";
  name: string;
}

/** Nodos de expresión */
export interface Binary extends BaseNode {
  type: "Binary";
  op: "==" | "!=" | "<" | "<=" | ">" | ">=" | "+" | "-" | "*" | "/" | "div" | "mod" | "and" | "or";
  left: AstNode;
  right: AstNode;
}

export interface Unary extends BaseNode {
  type: "Unary";
  op: "not" | "-";
  arg: AstNode;
}

export interface Index extends BaseNode {
  type: "Index";
  target: AstNode;
  index?: AstNode;
  range?: { start: AstNode; end: AstNode };
}

export interface Field extends BaseNode {
  type: "Field";
  target: AstNode;
  name: string;
}

export interface Call extends BaseNode {
  type: "Call";
  callee: string;
  args: AstNode[];
  statement: boolean;
  builtIn?: boolean;
}

/** Nodos de statement */
export interface Block extends BaseNode {
  type: "Block";
  body: AstNode[];
}

export interface Assign extends BaseNode {
  type: "Assign";
  target: AstNode;
  value: AstNode;
}

export interface DeclVector extends BaseNode {
  type: "DeclVector";
  id: string;
  dims: AstNode[];
}

export interface If extends BaseNode {
  type: "If";
  test: AstNode;
  consequent: Block;
  alternate?: Block;
}

export interface While extends BaseNode {
  type: "While";
  test: AstNode;
  body: Block;
}

export interface For extends BaseNode {
  type: "For";
  var: string;
  start: AstNode;
  end: AstNode;
  body: Block;
}

export interface Repeat extends BaseNode {
  type: "Repeat";
  body: Block;
  test: AstNode;
}

export interface Return extends BaseNode {
  type: "Return";
  value: AstNode;
}

export interface Print extends BaseNode {
  type: "Print";
  args: AstNode[];
}

/** Nodos de parámetros */
export interface Param extends BaseNode {
  type: "Param";
  name: string;
}

export interface ArrayParam extends BaseNode {
  type: "ArrayParam";
  name: string;
  start: Identifier | Literal;
  end?: Identifier | Literal;
}

export interface ObjectParam extends BaseNode {
  type: "ObjectParam";
  className: string;
  name: string;
}

export type ParamNode = Param | ArrayParam | ObjectParam;

/** Nodos de nivel superior */
export interface ProcDef extends BaseNode {
  type: "ProcDef";
  name: string;
  params: ParamNode[];
  body: Block;
}

export interface Program extends BaseNode {
  type: "Program";
  body: (ProcDef | AstNode)[];
}

/** Tipo unión para todos los nodos AST */
export type AstNode =
  | Program
  | ProcDef
  | Block
  | Assign
  | DeclVector
  | If
  | While
  | For
  | Repeat
  | Return
  | Print
  | Call
  | Binary
  | Unary
  | Index
  | Field
  | Literal
  | Identifier
  | Param
  | ArrayParam
  | ObjectParam;

/** ---- PARSE ---- */
export interface ParseRequest { source: string; }
export interface GrammarParseRequest { input: string; }
export interface ParseError { line: number; column: number; message: string; }
export interface ParseResponse {
  ok: boolean;
  ast?: Program;          // AST canónico tipado
  errors?: ParseError[];  // Errores con línea/columna
}
export interface GrammarParseResponse extends ParseResponse {
  available?: boolean;
  runtime?: string;
  error?: string;
}

/** Type guard for GrammarParseResponse */
export function isGrammarParseResponse(obj: unknown): obj is GrammarParseResponse {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as any).ok === "boolean"
  );
}

/** ---- ANALYZE ---- */

/** Modo de análisis de complejidad */
export type AnalyzeMode = "worst" | "best" | "avg";

/** Tipos de operaciones por línea */
export type LineKind =
  | "assign" | "if" | "for" | "while" | "repeat"
  | "call" | "print" | "return" | "decl" | "other";

/** Costo de una línea específica */
export interface LineCost {
  line: number;         // 1-based
  kind: LineKind;       // tipo de operación (para badges)
  ck: string;           // costo(s) elemental(es), ej: "C_assign + C_index"
  count: string;        // # ejecuciones (simplificado), ej: "n", "n^2"
  count_raw?: string;   // # ejecuciones (con sumatorias sin simplificar), ej: "\sum_{i=1}^{n} 1"
  note?: string;        // aclaraciones (p. ej., "worst: max(then, else)")
  procedure?: string[]; // procedimiento completo por línea (desde count_raw hasta forma polinómica)
}

/** Request para análisis de algoritmo */
export interface AnalyzeRequest {
  source: string;
  mode?: AnalyzeMode;   // por defecto "worst" en S3
}

/** Response exitoso con análisis abierto */
export interface AnalyzeOpenResponse {
  ok: true;
  byLine: LineCost[];   // tabla por línea
  totals: {
    T_open: string;                 // Σ C_k · count_k (KaTeX)
    procedure: string[];            // pasos (KaTeX) para construir T_open
    symbols?: Record<string,string>;// p.ej.: { n: "length(A)" }
    notes?: string[];               // reglas usadas (for, while, if)
    T_polynomial?: string;          // forma polinómica T(n) = an² + bn + c (KaTeX)
    // S4 añadirá: T_closed, bigO/bigOmega/bigTheta, proofSteps
  };
}

/** Response de error en análisis */
export interface AnalyzeError {
  ok: false;
  errors: { message: string; line?: number; column?: number }[];
}

/** Union type para response de análisis */
export type AnalyzeResponse = AnalyzeOpenResponse | AnalyzeError;

// Tipos legacy mantenidos para compatibilidad
export type CaseMode = "best" | "avg" | "worst" | "all";

export interface AnalyzeOptions {
  mode?: CaseMode;
  ck?: Record<string, number>;     // constantes C_k por operación
  avgModel?: { assumptions?: string; params?: Record<string, unknown> };
}

export interface LineCostLegacy {
  no: number;              // Nº de línea del código
  code: string;            // Texto de la línea
  ck: string;              // Etiqueta de costo elemental (C1, C2, …)
  execs: string;           // # de ejecuciones (cerrado: "n+1", "n(n+1)/2", …)
  cost: string;            // costo total de la línea (ej. "C2*(n+1)")
}

export interface CaseResult {
  assumptions: string;     // Supuestos del caso
  stepsLatex: string[];    // Pasos/ecuaciones en LaTeX (con scroll en UI)
  Tlatex: string;          // T(n) en LaTeX
  Tclosed: string;         // T(n) en forma cerrada y simplificada
}

export interface AnalyzeResponseLegacy {
  lines: LineCostLegacy[];
  cases: {
    best?: CaseResult;
    avg?: CaseResult;
    worst?: CaseResult;
  };
}

/** ---- LLM ---- */
export interface LLMCompareRequest {
  source: string;          // pseudocódigo original
  astSummary?: string;     // opcional, resumen del AST
  ourResult: {
    best?: Pick<CaseResult, "Tlatex" | "Tclosed">;
    avg?: Pick<CaseResult, "Tlatex" | "Tclosed">;
    worst?: Pick<CaseResult, "Tlatex" | "Tclosed">;
  };
}

export interface LLMOpinion {
  explanation: string;
  T?: string;              // sugerencia de T(n) del LLM (texto/LaTeX)
}

export interface LLMCompareResponse {
  llmOpinion: {
    best?: LLMOpinion;
    avg?: LLMOpinion;
    worst?: LLMOpinion;
  };
  diffSummary: string;     // resumen de coincidencias/diferencias y causas
}

/** ---- Documentación ---- */
export interface DocumentationSection {
  id: string;
  title: string;
  description: string;
  image: {
    src: string;
    alt: string;
    width: number;
    height: number;
    caption?: string;
  };
}