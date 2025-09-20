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

/** ---- PARSE ---- */
export interface ParseRequest { source: string; }
export interface GrammarParseRequest { input: string; }
export interface ParseError { line: number; column: number; message: string; }
export interface ParseResponse {
  ok: boolean;
  ast?: unknown;          // AST canónico (forma interna)
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
export type CaseMode = "best" | "avg" | "worst" | "all";

export interface AnalyzeOptions {
  mode?: CaseMode;
  ck?: Record<string, number>;     // constantes C_k por operación
  avgModel?: { assumptions?: string; params?: Record<string, unknown> };
}

export interface LineCost {
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

export interface AnalyzeResponse {
  lines: LineCost[];
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