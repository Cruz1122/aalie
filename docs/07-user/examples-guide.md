# Examples Guide

**Tipo:** guía
**Estado:** final
**Audiencia:** estudiante
**Fuente de verdad:** `apps/web/src/app/[locale]/examples/`, `apps/web/src/lib/examples/catalog.ts`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** sección 4.3 (catálogo de ejemplos)

## What is the Examples Catalog

The examples catalog is a curated collection of algorithm pseudocodes organized by algorithmic technique. It serves as:

- A **study resource**: browse algorithms by category to understand patterns.
- A **quick-start**: load an example into the analyzer to see its complexity immediately.
- A **validation tool**: compare your own analysis against the catalog's expected results.

## Accessing Examples

| Route | Purpose |
|-------|---------|
| `/{locale}/examples` | Landing page with paginated example cards |
| `/{locale}/examples/{category}` | Filtered view by category |

### Categories

| Category | Slug | Description |
|----------|------|-------------|
| Iterative | `iterative` | Algorithms using only loops (FOR, WHILE, REPEAT) |
| Divide and Conquer | `divide-and-conquer` | Recursive splitting into subproblems, combining results |
| Decrease and Conquer | `decrease-and-conquer` | Single recursive call reducing size by a constant |
| Decrease and Get Conquered | `decrease-and-get-conquered` | Multiple recursive calls reducing by subtraction |
| DP Top-Down | `dp-top-down` | Memoized recursion with table lookups |
| DP Bottom-Up | `dp-bottom-up` | Iterative table filling with state dependencies |
| Greedy | `greedy` | Local selection without backtracking |
| Backtracking | `backtracking` | Recursive search with candidate mutation and undo |
| Branch and Bound | `branch-and-bound` | Recursive search with pruning by bounds |

The total catalog contains **100 examples** across these categories.

## Browsing Examples

1. Go to `/{locale}/examples`.
2. Browse cards on the landing page. Use pagination (`?page=1`, `?page=2`, etc.) to see more.
3. Each card shows:
   - **Title** and **slug**
   - **Family** (search, sorting, numeric, sequences, structures, classic, matrices)
   - **Difficulty**: basic, intermediate, advanced
   - **Summary**: one-line description of what the algorithm does
   - **Supported methods**: which recurrence methods are verified for this example (e.g., TM, AR, IT, EC)
4. Click on a category in the sidebar to filter by technique.

## Loading an Example into the Analyzer

1. Find an example card.
2. Click **Load in Analyzer** (or similar action).
3. The pseudocode is copied to session storage and you are redirected to `/{locale}/analyzer`.
4. The editor is pre-filled with the example code.
5. Click **Analyze** to run the analysis.

The example's expected complexity is shown as a badge on the card. Compare the analyzer's result with the badge to verify understanding.

## Badges and Labels

### Supported Methods

| Badge | Method |
|-------|--------|
| TM | Master Theorem |
| IT | Iteration Method |
| AR | Recursion Tree |
| EC | Characteristic Equation |

These badges only appear if the backend data confirms that method is verified for that example. The badge is visible only for enabled examples.

### "Supported" vs "Partial" Labels

- **Supported** (green): the example is fully enabled in the current environment. The analyzer should produce a complete result.
- **Partial** (amber/yellow): the example exists in the catalog but some features may be limited. The engine may produce a partial result.
- **Disabled** (not shown): the example exists in the master catalog but is not exposed in the UI. It may be used for internal testing or future release.

### Tier

- **contractual**: tested and guaranteed to work in the CI pipeline. These examples serve as oracles.
- Other tiers: experimental or under development.

## Using Examples for Study

### Compare and Contrast

Load two related examples and compare their results:

| Compare | What to Notice |
|---------|---------------|
| `bubble-sort` vs `merge-sort` | Quadratic vs log-linear |
| `factorial-iterativo` vs `factorial-recursivo` | Same complexity, different approach |
| `binary-search-iterativa` vs `binary-search-recursiva` | Same O(log n), different structure |
| `fibonacci` naive vs with memoization | Exponential vs linear with memoization |

### Study Recurrence Patterns

- Use divide-and-conquer examples (`merge-sort`, `quick-sort`, `binary-reduction-sum`) to study Master Theorem cases.
- Use decrease-and-conquer examples (`factorial`, `linear-search-recursiva`) to study iteration method.
- Use Fibonacci to study the characteristic equation.

### Practice Workflow

1. Pick an example.
2. Hide the badge (cover it). Analyze the algorithm yourself on paper.
3. Load it into AALIE and run the analysis.
4. Compare your result with the analyzer's output and the badge.
5. If they differ, use the procedure view to understand where the discrepancy comes from.

## Known Limits

- A disabled example may exist in the master catalog but not be exposed in the UI. The catalog contains more entries than what is shown.
- The supported methods badges reflect the current verification state. Some methods may work even without a badge if they are structurally applicable.
- Loading an example does not auto-run the analysis — you must click Analyze after loading.

## Related Files

- `user-guide.md`
- `docs/03-specs/examples-catalog-spec.md` — technical spec of the catalog
