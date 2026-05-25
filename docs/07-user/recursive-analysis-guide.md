# Recursive Analysis Guide

**Tipo:** guía
**Estado:** final
**Audiencia:** estudiante
**Fuente de verdad:** `apps/web/src/app/[locale]/analyzer/page.tsx`, `apps/web/src/features/analyzer/`, `apps/api/app/analysis/`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** sección 3.4 (análisis recursivo)

## When to Use Recursive Analysis

The analyzer classifies algorithms as `recursive` or `hybrid` when the AST detects self-calling functions (a function that calls itself via `CALL`). Use the analyzer recursively when:

- Your algorithm contains one or more recursive calls.
- The recursion reduces the problem size (by division, subtraction, or other reduction).
- You want to see the recurrence relation and its solution.

If the algorithm is purely iterative (loops only), the iterative analysis path is used instead.

## Writing Recursive Pseudocode

Recursive algorithms in AALIE follow these syntax rules:

- **Recursive calls** must use `CALL` keyword: `CALL mergeSort(A, inicio, medio);`
- **Return values** from recursive calls are assigned: `izq <- CALL binaryReductionSum(A, inicio, medio);`
- **Function parameters** should include the problem size or range so the engine can extract the recurrence.
- The **base case** must be reachable (size stops decreasing).

### Required patterns for recurrence extraction

The engine extracts the recurrence from the AST by analyzing:
1. **Base case condition**: `IF (inicio = fin)` or `IF (n <= 1)` — identifies when recursion stops.
2. **Recursive call arguments**: how the problem size changes (division by 2, subtraction by 1, etc.).
3. **Number of recursive calls**: single vs. multiple calls per invocation.
4. **Work done outside recursion**: the non-recursive cost (loop, merge, partition, etc.).

### Example — valid recurrence extraction

```
mergeSort(A[n], inicio, fin) BEGIN
    IF (inicio < fin) THEN BEGIN
        medio <- (inicio + fin) DIV 2;
        CALL mergeSort(A, inicio, medio);
        CALL mergeSort(A, medio + 1, fin);
        CALL merge(A, inicio, medio, fin);
    END
    RETURN 0;
END
```

The engine extracts: `T(n) = 2T(n/2) + O(n)` (two recursive calls on halves + linear merge).

## Detect Methods

After classification as recursive, the engine runs **detect-methods** to determine which recurrence-solving methods are applicable. It analyzes the recurrence's structure and returns a list of available methods.

### Methods Available

| Method | Best For | Example |
|--------|----------|---------|
| **Master Theorem** | Recurrences of the form `T(n) = aT(n/b) + f(n)` with a ≥ 1, b > 1 | Merge Sort: `T(n) = 2T(n/2) + O(n)`, Binary Search: `T(n) = T(n/2) + O(1)` |
| **Iteration Method** (expansion) | Any recurrence, especially when Master Theorem doesn't apply. Expands the recurrence iteratively to find a pattern. | Factorial: `T(n) = T(n-1) + O(1)` |
| **Recursion Tree** | Visual recurrences where you want to see the tree expansion. Works for divide-and-conquer recurrences. | `T(n) = 2T(n/2) + n` — shows log n levels, each with 2^i nodes |
| **Characteristic Equation** | Linear recurrences with constant coefficients (homogeneous). | Fibonacci: `T(n) = T(n-1) + T(n-2) + O(1)` |

### Method Status

Each method returns a status bundle:

| Status | Meaning |
|--------|---------|
| `complete` | The method produced a full solution automatically. |
| `partial` | The method was applied but some steps may be simplified or closed-form may be missing. |
| `unsupported` | The recurrence form does not match this method's requirements. |
| `error` | An error occurred during application. |

### Default Method

The engine selects a default method based on the recurrence form:
- `master` for `T(n) = aT(n/b) + f(n)` forms
- `iteration` for `T(n) = T(n-k) + f(n)` forms (subtraction)
- `characteristic_equation` for linear recurrences like Fibonacci
- `recursion_tree` as a visual support method

The user can override the default by selecting a different method in the method selector dialog.

## Reading Step Bundles

Each method produces a **step bundle** — an ordered list of derivation steps. Each step contains:

```
Step ID | Title | LaTeX expression | Text explanation
```

Example — Master Theorem for Merge Sort:

| Step | Content |
|------|---------|
| 1 | Identify a=2, b=2, f(n)=n |
| 2 | Compute log_b(a) = log_2(2) = 1 |
| 3 | Compare f(n) = n with n^log_b(a) = n^1 |
| 4 | f(n) = Θ(n^log_b(a)) → Case 2 |
| 5 | T(n) = Θ(n log n) |

The **summary** field provides a human-readable explanation of the result. The **conceptNote** explains the mathematical concept used (e.g., "Master Theorem Case 2: when f(n) = Θ(n^log_b(a) * log^k(n))").

## Recursion Tree Visualization

After analysis, click the **Recursion Tree** tab. The tree is rendered using React Flow:

- **Nodes**: each recursive call, labeled with the problem size and cost.
- **Edges**: parent-child call relationships.
- **Levels**: the tree height corresponds to the recursion depth.
- **Expansion**: zoom and pan to explore deep trees.
- **Truncation**: very deep trees are truncated to keep the visualization readable.

The tree helps students understand:
- Why `T(n) = 2T(n/2) + n` has log₂(n) levels.
- Why Fibonacci's `T(n) = T(n-1) + T(n-2) + O(1)` yields exponential growth (each node branches into 2).
- The difference between single-call recursion (linear chain) and multiple-call recursion (branching tree).

## Common Errors in Recursive Analysis

| Error | Cause | Fix |
|-------|-------|-----|
| "No recurrence detected" | Missing or incorrect CALL syntax | Ensure recursive calls use `CALL functionName(...)`. |
| "No applicable method" | Recurrence form not recognized | Check if the recurrence fits a standard form. Try rewriting. |
| `partial` status | Engine could not fully close the expression | Accept partial result or try a different method. |
| "Infinite recursion" warning | Recursion arguments don't decrease toward the base case | Verify the recursive call reduces the problem size (e.g., `n-1`, `n/2`). |
| Unexpected O(1) result | Base case cost dominates incorrectly | Check the base case: should be constant cost, not a loop. |
| Method selector shows "unsupported" | The recurrence doesn't match the method's contract | Select a different method from the list. |

## Manual Guided Trace

The recursive trace mode provides a pedagogical walk through the call tree:

- **Step-by-step**: navigate recursive calls one at a time.
- **Level-by-level**: expand or collapse entire levels of the call tree.
- **Return events**: when a recursive call completes, the return is shown as a separate event.
- **Depth indicator**: shows current recursion depth.

This mode reuses the same trace contract as the iterative trace, so export consistency is preserved.

## Examples for Study

| Algorithm | Method | Recurrence | Complexity | Notes |
|-----------|--------|------------|------------|-------|
| Merge Sort | Master | `T(n) = 2T(n/2) + n` | Θ(n log n) | Textbook divide-and-conquer |
| Binary Search | Master | `T(n) = T(n/2) + 1` | Θ(log n) | Single recursive branch |
| Factorial | Iteration | `T(n) = T(n-1) + 1` | Θ(n) | Linear recursion |
| Fibonacci | Characteristic Eq. | `T(n) = T(n-1) + T(n-2) + 1` | Θ(2^n) | Exponential — good for tree visualization |
| Fast Power | Master | `T(n) = T(n/2) + 1` | Θ(log n) | Even/odd optimization |
| Tower of Hanoi | Iteration | `T(n) = 2T(n-1) + 1` | Θ(2^n) | Two branches via subtraction |

## Known Limits

- Not every recurrence has a complete automatic solution. Some produce `partial` results.
- The method selector may offer methods that produce weaker results for certain recurrence forms.
- Very deep recursion trees are truncated in visualization. The truncation preserves readability.
- Recursive analysis assumes deterministic recursion (no randomization in the recurrence).
