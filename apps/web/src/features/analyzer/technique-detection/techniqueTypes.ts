import type {
  Assign,
  Block,
  Call,
  For,
  If,
  Return,
  Repeat,
  While,
} from "@aa/types";

export type TechniqueId =
  | "iterative"
  | "divide_and_conquer"
  | "decrease_and_conquer"
  | "decrease_and_be_conquered"
  | "dp_top_down"
  | "dp_bottom_up"
  | "greedy"
  | "backtracking"
  | "branch_and_bound"
  | "unknown";

export type TechniqueTone = "positive" | "neutral" | "warning" | "critical";
export type TechniqueConfidence = "high" | "medium" | "low";

export type TechniqueEvidenceSnippet = {
  kind: "line" | "block" | "nested_block" | "multiple_lines" | "none";
  title?: string;
  code: string;
  startLine?: number;
  endLine?: number;
  omittedBody?: boolean;
};

export type LoopAstNode = For | While | Repeat;

export type AstEvidenceNode =
  | {
      kind: "loop";
      node: LoopAstNode;
      nestedNode?: LoopAstNode;
    }
  | {
      kind: "return";
      node: Return;
    }
  | {
      kind: "assign";
      node: Assign;
    }
  | {
      kind: "call";
      node: Call;
    }
  | {
      kind: "if";
      node: If;
      secondaryNode?: Assign | Return;
    }
  | {
      kind: "block";
      node: Block;
    };

export type AstEvidenceMap = {
  firstLoop: AstEvidenceNode | null;
  nestedLoop: AstEvidenceNode | null;
  singleRecursive: AstEvidenceNode | null;
  multipleRecursive: AstEvidenceNode | null;
  divideAndConquer: AstEvidenceNode | null;
  memoization: AstEvidenceNode | null;
  bottomUp: AstEvidenceNode | null;
  search: AstEvidenceNode | null;
  branchAndBound: AstEvidenceNode | null;
  greedy: AstEvidenceNode | null;
};

export type AstSignals = {
  totalNodes: number;
  loopCount: number;
  recursiveCallCount: number;

  hasSelfCall: boolean;
  hasMultipleSelfCalls: boolean;
  hasSingleSelfCall: boolean;

  hasDivideArgument: boolean;
  hasMinusArgument: boolean;
  hasRangeSplit: boolean;
  hasMidpointComputation: boolean;

  hasIndexedReadBeforeRecursiveCall: boolean;
  hasIndexedWriteAfterRecursiveCall: boolean;
  hasIterativeIndexedWrites: boolean;
  hasPreviousStateDependency: boolean;

  hasCandidateMutation: boolean;
  hasUndoAfterRecursiveCall: boolean;
  hasFeasibilityCondition: boolean;
  hasPruningReturn: boolean;
  hasBoundComparison: boolean;

  hasLocalSelection: boolean;
  hasCommittedSelection: boolean;
  evidence: AstEvidenceMap;
};

export type TechniqueDetectionResult = {
  technique: TechniqueId;
  confidence: TechniqueConfidence;
  signals: string[];
  explanation: string;
  evidenceSnippet: TechniqueEvidenceSnippet;
};
