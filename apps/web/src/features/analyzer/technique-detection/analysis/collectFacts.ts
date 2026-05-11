import { collectChoiceFacts, type ChoiceFacts } from "./choiceFacts";
import {
  collectDecompositionFacts,
  type DecompositionFacts,
} from "./decompositionFacts";
import { collectLoopFacts, type LoopFacts } from "./loopFacts";
import { collectMutationFacts, type MutationFacts } from "./mutationFacts";
import { collectPartitionFacts, type PartitionFacts } from "./partitionFacts";
import { collectRecursionFacts, type RecursionFacts } from "./recursionFacts";
import { collectShrinkFacts, type ShrinkFacts } from "./shrinkFacts";
import { collectTableFacts, type TableFacts } from "./tableFacts";
import type { AstNode } from "../ast/astAdapter";
import { buildNodeIndex, type NodeIndex } from "../ast/nodeIdentity";

export type TechniqueFacts = {
  ast: AstNode;
  index: NodeIndex;
  recursion: RecursionFacts;
  loops: LoopFacts;
  shrink: ShrinkFacts;
  decomposition: DecompositionFacts;
  partition: PartitionFacts;
  table: TableFacts;
  mutation: MutationFacts;
  choice: ChoiceFacts;
};

export function collectTechniqueFacts(ast: AstNode): TechniqueFacts {
  const index = buildNodeIndex(ast);

  const recursion = collectRecursionFacts(ast, index);
  const loops = collectLoopFacts(ast, index);
  const shrink = collectShrinkFacts(ast, index, recursion);
  const partition = collectPartitionFacts(ast, index, recursion);
  const decomposition = collectDecompositionFacts(
    ast,
    index,
    recursion,
    shrink,
    partition,
  );
  const table = collectTableFacts(ast, index, recursion);
  const mutation = collectMutationFacts(ast, index, recursion);
  const choice = collectChoiceFacts(ast, index, mutation);

  return {
    ast,
    index,
    recursion,
    loops,
    shrink,
    decomposition,
    partition,
    table,
    mutation,
    choice,
  };
}
