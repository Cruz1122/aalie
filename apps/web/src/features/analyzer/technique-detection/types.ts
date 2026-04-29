export type TechniqueId =
  | "branch_and_bound"
  | "dp_top_down"
  | "dp_bottom_up"
  | "backtracking"
  | "divide_and_conquer"
  | "decrease_and_conquer"
  | "recursive_expansion"
  | "greedy"
  | "iterative"
  | "unknown";

export type Confidence = "high" | "medium" | "low";
export type TechniqueTone = "positive" | "neutral" | "warning" | "critical";

export type EvidenceLevel = "strong" | "medium" | "weak" | "contradictory";

export type EvidenceRole =
  | "base_case"
  | "split"
  | "partition"
  | "recursive_call"
  | "combine"
  | "memo_read"
  | "memo_write"
  | "state_init"
  | "transition"
  | "choice"
  | "mutation"
  | "undo"
  | "bound"
  | "prune"
  | "commit"
  | "loop";

export type SourceRange = {
  startLine: number;
  endLine: number;
};

export type EvidenceItem = {
  role: EvidenceRole;
  nodeId: string;
  range?: SourceRange;
  importance: "primary" | "secondary";
  note?: string;
};

export type TechniqueEvidenceBundle = {
  compactSnippet: string;
  items: EvidenceItem[];
  explanationFacts: string[];
};

export type TechniqueDetectionResult = {
  technique: TechniqueId;
  confidence: Confidence;
  score: number;
  secondarySignals: string[];
  evidence: TechniqueEvidenceBundle;
  diagnostics: string[];
};
