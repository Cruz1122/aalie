# Technique Detection Spec

## Decision Surface

The technique detector classifies algorithms from structural AST evidence, not from names, slugs, or catalog metadata.

## Main Pipeline

1. Normalize and index AST nodes.
2. Collect global structural facts once.
3. Evaluate scoring rules over the collected facts.
4. Pick the strongest rule, degrade confidence on strong ambiguity.
5. Build a pedagogical evidence bundle for UI consumption.

## Required Output

`detectTechniqueFromAst(ast)` returns:

- `technique`
- `confidence`
- `score`
- `secondarySignals`
- `evidence.compactSnippet`
- `evidence.items`
- `evidence.explanationFacts`
- `diagnostics`

## Structural Constraints

- Divide and Conquer is modeled as k-way decomposition.
- Recursive classification distinguishes co-executed calls from mutually exclusive calls.
- Dynamic programming requires storage-shape evidence, not just any array access.
- Greedy stays conservative and should not win on partition-like or stateful transitions.
- Backtracking requires mutation plus recursive exploration plus undo.
- Branch and Bound requires the above plus bound/prune evidence.

## Performance Goals

- One node index build per AST.
- One global fact collection pass per AST.
- Rules operate over facts, not over full AST traversals.
- Evidence rendering is capped to a small, UI-friendly payload.
