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
  expectedRuns?: string; // E[# ejecuciones] para caso promedio (KaTeX)
}

/** Modelo probabilístico para caso promedio */
export interface AvgModelConfig {
  mode: "uniform" | "symbolic";  // modo del modelo
  predicates?: Record<string, string>;  // predicados a probabilidades, ej: {"A[j] > A[j+1]": "1/2"}
}

/** Request para análisis de algoritmo */
export interface AnalyzeRequest {
  source: string;
  mode?: AnalyzeMode;   // por defecto "worst" en S3
  avgModel?: AvgModelConfig;  // modelo probabilístico para caso promedio
  algorithm_kind?: "iterative" | "recursive" | "hybrid" | "unknown";  // tipo de algoritmo (se detecta automáticamente si no se proporciona)
}

/** Response exitoso con análisis abierto */
export interface AnalyzeOpenResponse {
  ok: true;
  byLine: LineCost[];   // tabla por línea
  totals: {
    T_open: string;                 // Σ C_k · count_k (KaTeX) - simplificado con SymPy (o A(n) para promedio)
    procedure?: string[];            // pasos (KaTeX) para construir T_open (legacy, puede estar vacío)
    symbols?: Record<string,string>;// p.ej.: { n: "length(A)" }
    notes?: string[];               // reglas usadas (for, while, if) o pasos de procedimiento para promedio
    T_polynomial?: string;          // forma polinómica T(n) = an² + bn + c (KaTeX) - simplificado con SymPy
    big_o?: string;                 // Notación Big-O calculada con SymPy (ej: "O(n^2)")
    big_omega?: string;             // Notación Big-Omega calculada con SymPy (ej: "Ω(n^2)")
    big_theta?: string;             // Notación Big-Theta calculada con SymPy (ej: "Θ(n^2)")
    A_of_n?: string;                // A(n) para caso promedio (alias de T_open)
    avg_model_info?: {              // información del modelo probabilístico usado
      mode: string;                 // "uniform" | "symbolic"
      note: string;                 // badge del modelo, ej: "uniforme (p=1/2)"
    };
    hypotheses?: string[];          // hipótesis cuando hay símbolos probabilísticos
    // Análisis recursivo (Teorema Maestro, Método de Iteración, Árbol de Recursión o Ecuación Característica)
    recurrence?: (
      | {                      // Recurrencia divide-and-conquer: T(n) = a·T(n/b) + f(n)
          type: "divide_conquer";
          form: string;         // forma LaTeX: "T(n) = a T(n/b) + f(n)"
          a: number;            // número de subproblemas
          b: number;            // factor de reducción (> 1)
          f: string;            // trabajo no recursivo f(n) (LaTeX)
          n0: number;           // umbral base
          applicable: boolean;
          notes: string[];
          method?: "master" | "iteration" | "recursion_tree";
        }
      | {                      // Recurrencia lineal por desplazamiento: T(n) = c₁T(n-1) + c₂T(n-2) + ... + cₖT(n-k) + g(n)
          type: "linear_shift";
          form: string;         // forma LaTeX: "T(n) = T(n-1) + T(n-2) + g(n)"
          order: number;        // orden de la recurrencia (k)
          shifts: number[];     // desplazamientos [1, 2] para Fibonacci
          coefficients: number[]; // coeficientes [1, 1] para Fibonacci
          "g(n)"?: string;      // término no homogéneo g(n) (LaTeX), None si es homogénea
          n0: number;           // umbral base
          applicable: boolean;
          notes: string[];
          method?: "characteristic_equation";
        }
    );
    characteristic_equation?: {              // resultado del Método de Ecuación Característica
      method: "characteristic_equation";     // identificador del método
      is_dp_linear: boolean;                 // si corresponde a Programación Dinámica lineal
      equation: string;                      // ecuación característica en LaTeX
      roots: Array<{                        // raíces de la ecuación característica
        root: string;                       // raíz en LaTeX
        multiplicity: number;             // multiplicidad de la raíz
      }>;
      dominant_root?: string;                // raíz dominante (mayor valor absoluto) en LaTeX
      growth_rate?: number;                  // tasa de crecimiento numérica (valor de la raíz dominante)
      solved_by: "characteristic_equation";  // método usado para resolver
      homogeneous_solution: string;         // solución homogénea en LaTeX
      particular_solution?: string;         // solución particular en LaTeX (si hay g(n))
      general_solution?: string;            // solución general completa (homogénea + particular) en LaTeX
      base_cases?: Record<string, number>;  // casos base detectados (ej: {"T(0)": 0, "T(1)": 1})
      closed_form: string;                  // forma cerrada simplificada en LaTeX
      dp_version?: {                        // versión DP básica si aplica
        code: string;                       // pseudocódigo DP
        time_complexity: string;             // complejidad temporal DP (ej: "O(n)")
        space_complexity: string;            // complejidad espacial DP (ej: "O(n)")
        recursive_complexity: string;        // complejidad versión recursiva (ej: "O(2^n)")
      };
      dp_optimized_version?: {              // versión DP optimizada O(1) espacio si aplica
        code: string;                       // pseudocódigo DP optimizado
        time_complexity: string;             // complejidad temporal DP (ej: "O(n)")
        space_complexity: string;            // complejidad espacial DP optimizada (ej: "O(1)" o "O(k)")
      };
      dp_equivalence: string;               // explicación de equivalencia entre ecuación característica y DP
      theta: string;                        // resultado final Θ(...) en LaTeX
    };
    master?: {                      // resultado del Teorema Maestro
      case: 1 | 2 | 3 | null;      // caso aplicado (1, 2, 3) o null si no aplicable
      nlogba: string;               // expresión LaTeX de n^(log_b a)
      comparison: "smaller" | "equal" | "larger" | null;  // comparación f(n) vs g(n)
      regularity: {                 // condición de regularidad (Caso 3)
        checked: boolean;           // si se verificó o se asumió
        note: string;               // nota sobre la verificación
      };
      theta: string | null;         // resultado Θ(...) en LaTeX
    };
    iteration?: {                   // resultado del Método de Iteración (Unrolling)
      method: "iteration";          // identificador del método
      g_function: string;           // función g(n): "n-1", "n/2", etc. (LaTeX)
      expansions: string[];         // lista de expansiones simbólicas (LaTeX)
      general_form: string;         // forma general T(n) = T(g^k(n)) + Σ... (LaTeX)
      base_case: {                  // determinación del caso base
        condition: string;          // condición g^k(n) = n0 (LaTeX)
        k: string;                  // expresión para k (LaTeX)
      };
      summation: {                  // evaluación de la sumatoria
        expression: string;         // expresión de la sumatoria (LaTeX)
        evaluated: string;          // resultado evaluado (LaTeX)
      };
      theta: string;                // resultado final Θ(...) en LaTeX
    };
    recursion_tree?: {              // resultado del Método de Árbol de Recursión
      method: "recursion_tree";     // identificador del método
      levels: Array<{               // información de cada nivel del árbol
        level: number;              // índice del nivel (0 = raíz)
        num_nodes: number;          // número de nodos en el nivel (a^i)
        num_nodes_latex: string;    // número de nodos en LaTeX
        subproblem_size_latex: string;  // tamaño del subproblema en LaTeX (n/b^i)
        cost_per_node_latex: string;    // costo por nodo en LaTeX (f(n/b^i))
        total_cost_latex: string;       // costo total del nivel en LaTeX (a^i · f(n/b^i))
      }>;
      height: string;               // altura del árbol en LaTeX (log_b(n))
      summation: {                  // evaluación de la sumatoria
        expression: string;         // expresión de la sumatoria (LaTeX)
        evaluated: string;          // resultado evaluado (LaTeX)
        theta: string;              // resultado final en notación Θ
      };
      dominating_level: {           // nivel dominante
        level: string | number;     // nivel que domina ("root", "leaves", "all", o número)
        reason: string;             // razón de por qué ese nivel domina
      };
      table_by_levels: Array<{      // tabla para UI
        level: number;              // índice del nivel
        num_nodes: string;          // número de nodos en LaTeX
        subproblem_size: string;    // tamaño del subproblema en LaTeX
        cost_per_node: string;      // costo por nodo en LaTeX
        total_cost: string;         // costo total del nivel en LaTeX
      }>;
      theta: string;                // resultado final Θ(...) en LaTeX
    };
    proof?: Array<{                 // pasos de prueba del análisis
      id: string;                   // identificador del paso (extract, critical, compare, iteration_start, etc.)
      text: string;                 // texto del paso en LaTeX
    }>;
    // S4 añadirá: T_closed, proofSteps
  };
}

/** Response de error en análisis */
export interface AnalyzeError {
  ok: false;
  errors: { message: string; line?: number; column?: number }[];
}

/** Union type para response de análisis */
export type AnalyzeResponse = AnalyzeOpenResponse | AnalyzeError;

/** Response con todos los casos (worst, best, avg) */
export interface AnalyzeAllCasesResponse {
  ok: true;
  has_case_variability?: boolean;  // si worst/best/avg difieren (false si son idénticos)
  worst: AnalyzeOpenResponse;
  best: AnalyzeOpenResponse;
  avg?: AnalyzeOpenResponse;
}

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