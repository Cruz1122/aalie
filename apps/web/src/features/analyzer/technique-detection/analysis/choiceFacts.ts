import type { MutationFacts } from "./mutationFacts";
import { getChildren, kindOf, type AstNode } from "../ast/astAdapter";
import type { NodeIndex } from "../ast/nodeIdentity";

export type ChoiceFacts = {
  hasChoiceEnumeration: boolean;
  hasLocalChoice: boolean;
  hasIrreversibleCommit: boolean;
  choiceNodeIds: string[];
};

export function collectChoiceFacts(
  ast: AstNode,
  index: NodeIndex,
  mutation: MutationFacts,
): ChoiceFacts {
  const choiceNodeIds: string[] = [];
  const stack = [ast];

  while (stack.length > 0) {
    const node = stack.pop()!;
    const kind = kindOf(node);

    if (kind === "for" || kind === "while") {
      const hasIfInside = getChildren(node).some(
        (child) => kindOf(child) === "if",
      );
      if (hasIfInside) {
        choiceNodeIds.push(index.idOf(node));
      }
    }

    stack.push(...getChildren(node));
  }

  return {
    hasChoiceEnumeration: choiceNodeIds.length > 0,
    hasLocalChoice: choiceNodeIds.length > 0,
    hasIrreversibleCommit:
      mutation.hasMutationBeforeRecursiveCall &&
      !mutation.hasUndoAfterRecursiveCall,
    choiceNodeIds,
  };
}
