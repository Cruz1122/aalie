import { getChildren, type AstNode } from "./astAdapter";

export type VisitContext = {
  parent?: AstNode;
  ancestors: AstNode[];
};

export function walkAst(
  root: AstNode,
  visit: (node: AstNode, ctx: VisitContext) => void,
): void {
  const stack: Array<{
    node: AstNode;
    parent?: AstNode;
    ancestors: AstNode[];
  }> = [{ node: root, ancestors: [] }];

  while (stack.length > 0) {
    const current = stack.pop()!;
    visit(current.node, {
      parent: current.parent,
      ancestors: current.ancestors,
    });

    const children = getChildren(current.node);
    for (let i = children.length - 1; i >= 0; i--) {
      stack.push({
        node: children[i],
        parent: current.node,
        ancestors: [...current.ancestors, current.node],
      });
    }
  }
}
