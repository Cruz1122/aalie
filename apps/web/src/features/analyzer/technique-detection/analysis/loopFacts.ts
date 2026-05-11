import { getChildren, kindOf, type AstNode } from "../ast/astAdapter";
import { opOf } from "../ast/exprInspect";
import type { NodeIndex } from "../ast/nodeIdentity";

export type LoopFacts = {
  loopCount: number;
  loopNodeIds: string[];
  hasConditionalReturn: boolean;
  hasBoundLikeComparison: boolean;
};

export function collectLoopFacts(ast: AstNode, index: NodeIndex): LoopFacts {
  let loopCount = 0;
  let hasConditionalReturn = false;
  let hasBoundLikeComparison = false;
  const loopNodeIds: string[] = [];

  const stack = [ast];
  while (stack.length > 0) {
    const node = stack.pop()!;
    const kind = kindOf(node);

    if (kind === "for" || kind === "while" || kind === "repeat") {
      loopCount += 1;
      loopNodeIds.push(index.idOf(node));
    }

    if (kind === "if") {
      const children = getChildren(node);
      if (children.some((child) => kindOf(child) === "return")) {
        hasConditionalReturn = true;
      }

      const condition = node.condition ?? node.test;
      if (condition) {
        const op = opOf(condition);
        if (op === "<" || op === "<=" || op === ">" || op === ">=") {
          hasBoundLikeComparison = true;
        }
      }
    }

    stack.push(...getChildren(node));
  }

  return {
    loopCount,
    loopNodeIds,
    hasConditionalReturn,
    hasBoundLikeComparison,
  };
}
