import type { AstNode } from "./astAdapter";

export type NodeIndex = {
  idOf(node: AstNode): string;
  nodeOf(id: string): AstNode | undefined;
};

export function buildNodeIndex(root: AstNode): NodeIndex {
  const weak = new WeakMap<AstNode, string>();
  const byId = new Map<string, AstNode>();
  let counter = 0;

  const visit = (node: AstNode) => {
    if (!node || typeof node !== "object" || weak.has(node)) return;

    const id = `n${++counter}`;
    weak.set(node, id);
    byId.set(id, node);

    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item && typeof item === "object") visit(item as AstNode);
        }
      } else if (value && typeof value === "object") {
        visit(value as AstNode);
      }
    }
  };

  visit(root);

  return {
    idOf(node) {
      const id = weak.get(node);
      if (!id) throw new Error("Node was not indexed");
      return id;
    },
    nodeOf(id) {
      return byId.get(id);
    },
  };
}
