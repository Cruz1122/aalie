import { backtrackingRule } from "./backtracking";
import { branchAndBoundRule } from "./branchAndBound";
import { decreaseAndConquerRule } from "./decreaseAndConquer";
import { divideAndConquerRule } from "./divideAndConquer";
import { dpBottomUpRule } from "./dpBottomUp";
import { dpTopDownRule } from "./dpTopDown";
import { greedyRule } from "./greedy";
import { iterativeRule } from "./iterative";
import { recursiveExpansionRule } from "./recursiveExpansion";
import type { RuleMatch, TechniqueRule } from "./ruleTypes";
import { unknownRule } from "./unknown";
import type { TechniqueFacts } from "../analysis/collectFacts";

const RULES: TechniqueRule[] = [
  branchAndBoundRule,
  dpTopDownRule,
  backtrackingRule,
  divideAndConquerRule,
  recursiveExpansionRule,
  decreaseAndConquerRule,
  dpBottomUpRule,
  greedyRule,
  iterativeRule,
  unknownRule,
];

export function evaluateTechniqueRules(facts: TechniqueFacts): RuleMatch {
  const matches = RULES.map((rule) => ({
    rule,
    result: rule.evaluate(facts),
  })).filter(({ result }) => result.matched);

  matches.sort((a, b) => {
    if (b.result.score !== a.result.score)
      return b.result.score - a.result.score;
    return b.rule.priority - a.rule.priority;
  });

  const winner = matches[0]?.result ?? unknownRule.evaluate(facts);
  const runnerUp = matches[1]?.result;

  if (runnerUp && winner.technique !== "unknown") {
    const gap = winner.score - runnerUp.score;
    if (gap < 10 && runnerUp.score >= 65) {
      return {
        ...winner,
        confidence: winner.confidence === "high" ? "medium" : winner.confidence,
        diagnostics: [
          ...winner.diagnostics,
          `Ambigüedad: ${runnerUp.technique} obtuvo score cercano (${runnerUp.score}).`,
        ],
      };
    }
  }

  return winner;
}
