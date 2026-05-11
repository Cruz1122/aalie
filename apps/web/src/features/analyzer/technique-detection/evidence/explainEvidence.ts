import type { RuleMatch } from "../rules/ruleTypes";

type TranslationValues = Record<
  string,
  string | number | boolean | Date | null | undefined
>;

type TechniqueTranslator = (key: string, values?: TranslationValues) => string;

/** Fallback when `t` is absent (e.g. tests). Mirrors `en.json` analyzer.techniques.evidenceFacts. */
const EVIDENCE_FACTS_FALLBACK_EN: Record<string, string> = {
  co_executed_recursive_calls:
    "The block contains several co-executed recursive calls.",
  structural_decomposition:
    "The structure shows a real decomposition of the problem into subproblems.",
  partition_like_split:
    "A structural partition appears that separates the problem before recursing.",
  exclusive_interval_partition:
    "The interval is split by a fractional cut and then only one recursive branch is explored.",
  single_branch_after_interval_split:
    "After splitting the interval, the algorithm continues only through the branch that contains the relevant subproblem.",
  subproblem_shrink: "Each call works on a smaller subproblem expression.",
  post_recursive_combine:
    "After solving subproblems, a combination phase appears.",
  single_dominant_recursive_call:
    "On each path, a single recursive call dominates.",
  recursive_argument_shrink: "The recursive call reduces the problem size.",
  multiple_co_executed_recursive_calls:
    "Several recursive branches expand within the same execution path.",
  branching_recursion_tree: "The shape yields a branching recursion tree.",
  additive_shrink: "The reduction is by subtraction or additive shift.",
  indexed_read_before_recursion:
    "An indexed structure is consulted before recomputing.",
  early_return_from_stored_state:
    "Execution can return directly from an already stored state.",
  indexed_write_after_recursive_computation:
    "The result is written to an indexed structure after the recursive computation.",
  same_storage_read_write_shape:
    "Reads and writes target the same stored-state shape.",
  indexed_writes_inside_loop: "Indexed states are filled inside loops.",
  previous_state_dependency: "Current states depend on earlier values.",
  multi_previous_state_transition:
    "The transition uses several previous states, not one simple accumulation.",
  prune_like_return:
    "There is structural pruning that cuts branches before continuing exploration.",
  bound_like_comparison:
    "Comparisons with a bound-like or threshold form are detected.",
  external_partition_call:
    "A non-recursive call partitions the problem while recursive self-calls solve subproblems.",
};

const INSUFFICIENT_EVIDENCE_FALLBACK_EN =
  "There is not enough clear pedagogical evidence yet.";

export function explainEvidence(
  match: RuleMatch,
  t?: TechniqueTranslator,
): string[] {
  const facts = match.secondarySignals
    .map((signal) => translateFact(signal, t))
    .filter((fact): fact is string => Boolean(fact));

  if (facts.length > 0) {
    return facts.slice(0, 4);
  }

  if (match.diagnostics.length > 0) {
    return [match.diagnostics[0]];
  }

  return [
    t?.("insufficientPedagogicEvidence") ?? INSUFFICIENT_EVIDENCE_FALLBACK_EN,
  ];
}

function translateFact(signal: string, t?: TechniqueTranslator): string | null {
  if (signal.startsWith("k_way_branch_count_")) {
    const branchCount = signal.replace("k_way_branch_count_", "");
    if (t) {
      try {
        return t("evidenceFacts.kWayBranchCount", { branchCount });
      } catch {
        /* fall through */
      }
    }
    return `The decomposition opens ${branchCount} subproblems at the same level.`;
  }

  if (t) {
    try {
      return t(`evidenceFacts.${signal}`);
    } catch {
      /* fall through */
    }
  }

  return EVIDENCE_FACTS_FALLBACK_EN[signal] ?? null;
}
