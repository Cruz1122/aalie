import { getChildren, type AstNode } from "../ast/astAdapter";

export type SemanticFacts = {
  identifiers: string[];
  hasGreedyCue: boolean;
  hasBranchAndBoundCue: boolean;
};

const GREEDY_CUES = [
  "sortByFinishTime",
  "fractionalKnapsack",
  "ratio",
  "huffman",
  "extractMin",
  "insertMin",
  "kruskal",
  "findSet",
  "unionSet",
  "prim",
  "minKey",
  "dijkstra",
  "relax",
];

const BRANCH_AND_BOUND_CUES = [
  "bound",
  "lowerBound",
  "upperBound",
  "cota",
  "cotaInferior",
  "cotaSuperior",
  "best",
  "mejor",
  "incumbent",
  "prune",
  "poda",
  "priorityQueue",
  "colaPrioridad",
  "pendientes",
  "extraerMejor",
  "insertar",
];

export function collectSemanticFacts(ast: AstNode): SemanticFacts {
  const identifiers = collectIdentifierLikeStrings(ast);

  const hasGreedyCue = hasAnyCue(identifiers, GREEDY_CUES);
  const hasBranchAndBoundCue = hasAnyCue(identifiers, BRANCH_AND_BOUND_CUES);

  return {
    identifiers,
    hasGreedyCue,
    hasBranchAndBoundCue,
  };
}

function hasAnyCue(values: string[], cues: string[]): boolean {
  const lowerCues = cues.map((c) => c.toLowerCase());

  return values.some((value) => {
    const lowerValue = value.toLowerCase();
    return lowerCues.some((cue) => {
      let idx = 0;
      while ((idx = lowerValue.indexOf(cue, idx)) !== -1) {
        const beforeOk =
          idx === 0 ||
          (value[idx] >= "A" &&
            value[idx] <= "Z" &&
            value[idx - 1] >= "a" &&
            value[idx - 1] <= "z");
        const afterPos = idx + cue.length;
        const afterOk =
          afterPos >= value.length ||
          (value[afterPos] >= "A" && value[afterPos] <= "Z");
        if (beforeOk && afterOk) return true;
        idx++;
      }
      return false;
    });
  });
}

function collectIdentifierLikeStrings(ast: AstNode): string[] {
  const out = new Set<string>();
  const stack: unknown[] = [ast];

  while (stack.length > 0) {
    const current = stack.pop();

    if (!current) continue;

    if (typeof current === "string") {
      if (looksIdentifierLike(current)) {
        out.add(current);
      }
      continue;
    }

    if (Array.isArray(current)) {
      for (const item of current) stack.push(item);
      continue;
    }

    if (typeof current === "object") {
      const node = current as AstNode;
      for (const child of getChildren(node)) {
        stack.push(child);
      }

      for (const [key, value] of Object.entries(current)) {
        if (isIdentifierKey(key)) {
          if (typeof value === "string") {
            out.add(value);
          }
        }

        if (value && typeof value === "object") {
          stack.push(value);
        }
      }
    }
  }

  return [...out];
}

function isIdentifierKey(key: string): boolean {
  const normalized = key.toLowerCase();

  return (
    normalized === "name" ||
    normalized === "id" ||
    normalized === "identifier" ||
    normalized === "callee" ||
    normalized === "procedure" ||
    normalized === "functionname" ||
    normalized === "target"
  );
}

function looksIdentifierLike(value: string): boolean {
  return /^[A-Za-z_ÁÉÍÓÚáéíóúÑñ][A-Za-z0-9_ÁÉÍÓÚáéíóúÑñ]*$/.test(value);
}
