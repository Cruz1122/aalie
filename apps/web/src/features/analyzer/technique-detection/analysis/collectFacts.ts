import { collectChoiceFacts, type ChoiceFacts } from "./choiceFacts";
import {
  collectDecompositionFacts,
  type DecompositionFacts,
} from "./decompositionFacts";
import { collectLoopFacts, type LoopFacts } from "./loopFacts";
import { collectMutationFacts, type MutationFacts } from "./mutationFacts";
import { collectPartitionFacts, type PartitionFacts } from "./partitionFacts";
import {
  collectRecursionFacts,
  findMainProcedure,
  type RecursionFacts,
} from "./recursionFacts";
import { collectSemanticFacts, type SemanticFacts } from "./semanticFacts";
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
  semantic: SemanticFacts;
};

export function collectTechniqueFacts(ast: AstNode): TechniqueFacts {
  const index = buildNodeIndex(ast);

  // Scope all fact collectors to the main procedure only.
  // Helper procedures (like maxSubarrayCruzando) should not influence
  // the main algorithm's technique classification.
  const mainProc = findMainProcedure(ast);
  const scopedAst = mainProc || ast;

  const recursion = collectRecursionFacts(scopedAst, index);
  const loops = collectLoopFacts(scopedAst, index);
  const semantic = collectSemanticFacts(scopedAst);
  const shrink = collectShrinkFacts(scopedAst, index, recursion);
  const partition = collectPartitionFacts(scopedAst, index, recursion);
  const mutation = collectMutationFacts(scopedAst, index, recursion);
  const decomposition = collectDecompositionFacts(
    scopedAst,
    index,
    recursion,
    shrink,
    partition,
    mutation,
  );
  const table = collectTableFacts(scopedAst, index, recursion);
  const choice = collectChoiceFacts(scopedAst, index, mutation);

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
    semantic,
  };
}
