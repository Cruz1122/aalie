# ADR-XXX: Structural Technique Detection from AST

## Decision

The technique detector uses structural AST evidence, not common names, slugs, or example-catalog families.

## Consequences

- Techniques are detected through evidence roles and fact summaries.
- Divide and Conquer is modeled as k-ary decomposition.
- Recursive calls are analyzed through execution-path summaries.
- Visual evidence is built from an `EvidenceBundle`.
- When ambiguity is strong, confidence is degraded or `unknown` is returned.

## Prohibited

- Inferring technique from names like `merge`, `quick`, `memo`, `dp`, or `pivot`
- Inferring technique from the examples catalog
- Classifying from raw recursive-call counts without execution-path structure
