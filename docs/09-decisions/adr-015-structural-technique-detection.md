# ADR-015: Structural Technique Detection from AST

## Decision

The technique detector uses structural AST evidence, not common names, slugs, or example-catalog families.

## Consequences

- Techniques are detected through evidence roles and fact summaries.
- Divide and Conquer is modeled as k-ary decomposition.
- Recursive calls are analyzed through execution-path summaries.
- Visual evidence is built from an `EvidenceBundle`.
- When ambiguity is strong, confidence is degraded or `unknown` is returned.

## Allowed Exceptions

### Greedy semantic cues

Iterative greedy algorithms (activity-selection, fractional-knapsack, huffman, kruskal, prim, dijkstra) are structurally identical to generic iterative code: they have FOR loops, IF conditions, and simple assignments. They cannot be distinguished from bubble sort or insertion sort by structure alone.

For **greedy only**, identifier-based semantic cues (`sortByFinishTime`, `extractMin`, `prim`, `dijkstra`, `kruskal`, `relax`) are used as a tiebreaker. The matching uses camelCase word-boundary analysis (e.g. `primo` does not activate `prim`). Cues are defined in `semanticFacts.ts`.

This is a narrow, scoped exception. No other technique uses name-based cues.

## Prohibited

- Inferring technique from names in non-greedy rules (e.g. `merge`, `quick`, `memo`, `dp`, or `pivot`)
- Inferring technique from the examples catalog
- Classifying from raw recursive-call counts without execution-path structure
