# Analyzer Workflows

**Tipo:** guía
**Estado:** final
**Audiencia:** estudiante
**Fuente de verdad:** `apps/web/src/app/[locale]/analyzer/page.tsx`, `apps/web/src/features/analyzer/`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** sección 3.3 (flujos de análisis)

## 1. Basic Analysis Workflow

**Goal:** Write a simple algorithm and get its complexity.

```
Write code → Validate → Analyze → Read results
```

**Steps:**
1. Go to `/{locale}/analyzer`.
2. Write pseudocode in the Monaco editor. Example:
   ```
   sumArray(A[n], n) BEGIN
       suma <- 0;
       FOR i <- 1 TO n DO BEGIN
           suma <- suma + A[i];
       END
       RETURN suma;
   END
   ```
3. Observe real-time syntax validation. Errors appear as red underlines.
4. Click **Analyze** (or press `Ctrl+S`).
5. Wait for the progress indicator to reach 100%.
6. Read the results panel:
   - **Classification**: `iterative`
   - **T(n)** (efficiency equation): `T(n) = 1 + 3(n+1) + 2n + 1`
   - **T_polynomial** (grouped): `3n + 5`
   - **Big O**: `O(n)`
   - **Big Ω**: `Ω(n)`
   - **Big Θ**: `Θ(n)`
   - **By-line costs**: each line shows `ck` (cost), `count` (executions), and `ops` (operations).
7. (Optional) Click **View Procedure** to see the step-by-step derivation.

**What to explain to the student:** The analyzer builds T(n) by summing the cost of each line multiplied by how many times it executes. The FOR header runs `n+1` times (check + increment), the body runs `n` times.

## 2. Iterative Algorithm — Nested Loops

**Goal:** Analyze an algorithm with nested loops and understand how the engine derives quadratic complexity.

**Example — Exchange Sort:**
```
exchangeSort(A[n], n) BEGIN
    FOR i <- 1 TO n - 1 DO BEGIN
        FOR j <- i + 1 TO n DO BEGIN
            IF (A[i] > A[j]) THEN BEGIN
                temp <- A[i];
                A[i] <- A[j];
                A[j] <- temp;
            END
        END
    END
    RETURN 0;
END
```

**Steps:**
1. Load or type the code in the analyzer.
2. Click **Analyze**.
3. Examine the by-line cost table:
   - Outer FOR header: `n` iterations
   - Inner FOR header: runs `n-i` times per outer iteration ≈ `n(n-1)/2` total
   - IF body: proportional to inner loop
4. Check asymptotic notation: `O(n²)`, `Ω(n²)`, `Θ(n²)`.
5. Click **General Procedure** to see the sum derivation: `T(n) = Σᵢ₌₁ⁿ⁻¹ (3 + Σⱼ₌ᵢ₊₁ⁿ (4)) + 1`
6. (Optional) Click **GPU vs CPU** to see a heuristic analysis of parallelism suitability.

**Common error:** Students often forget that the inner loop's iteration count depends on `i`. The analyzer's by-line table makes this dependency visible.

## 3. WHILE Loop Analysis

**Goal:** Analyze an algorithm with a WHILE loop and understand pattern-based heuristics.

**Example — Euclidean GCD:**
```
euclidesIterativo(a, b) BEGIN
    WHILE (b != 0) DO BEGIN
        temp <- b;
        b <- a MOD b;
        a <- temp;
    END
    RETURN a;
END
```

**Steps:**
1. Write the algorithm in the editor.
2. Click **Analyze**.
3. Check the **Evidence Level** in the results panel:
   - The engine identifies a WHILE loop pattern.
   - Supported patterns: linear counter, geometric growth, binary search, Euclid (mod), flag-controlled.
   - Euclid pattern detected → `O(log min(a,b))` confidence level displayed.
4. If the pattern is not recognized, a **warning** appears: "Heuristic — limited evidence."
5. Review the by-line costs. WHILE loops may show symbolic counts instead of closed forms.

**What to explain:** WHILE loop analysis is conservative. The engine uses structural signals (the condition expression, variable updates) to match known patterns. Unrecognized patterns return partial results with warnings rather than invented answers.

## 4. Recursive Algorithm Analysis

**Goal:** Write a recursive function and walk through the method selection workflow.

**Example — Merge Sort:**
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

**Steps:**
1. Write the recursive code (must use `CALL` for recursive calls).
2. Click **Analyze**.
3. The engine classifies as `recursive` and runs **detect-methods**.
4. A method selector appears showing applicable methods:
   - **Master Theorem** (default — recommended)
   - Iteration Method
   - Recursion Tree
   - Characteristic Equation (may be dimmed if not applicable)
5. Select a method or accept the default. Click **Continue**.
6. Read the step bundles:
   - **Status**: `complete` / `partial` / `unsupported` / `error`
   - **Steps**: ordered derivation steps with LaTeX formulas
   - **Summary**: text explanation of the procedure
7. For Master Theorem, the recurrence `T(n) = 2T(n/2) + O(n)` is shown, and the engine identifies case 2: `T(n) = Θ(n log n)`.
8. Click the **Recursion Tree** visualization tab to see the tree rendered via React Flow.

**Fallback:** If no method is applicable, the engine reports "no methods available." Try rewriting the recurrence in a standard form.

## 5. Execution Trace

**Goal:** Step through an algorithm's execution and watch variables change.

**Steps:**
1. Run an analysis first (any algorithm).
2. Click **Trace** (or switch to trace view).
3. Configure input values (e.g., `n=5`, array `[3,1,4,1,5]`).
4. Use the step controls:
   - **Step Forward** (`→`): advance one step
   - **Step Backward** (`←`): go back
   - **Jump to Step**: enter a specific step number
   - **Auto-Play**: continuous stepping
5. Watch the state panel update on each step:
   - Variable values change
   - Line highlights show current execution point
   - Call stack shows recursion depth (for recursive algorithms)
6. For recursive traces, the **call tree** is shown alongside the trace steps.

**What to explain:** The trace connects the abstract complexity analysis to concrete execution. Students can verify that a loop indeed runs `n` times or that recursive calls match the recurrence.

## 6. LLM Comparison

**Goal:** Compare the analyzer's deterministic result with an LLM's analysis.

**Prerequisites:** A valid API key must be configured on the backend.

**Steps:**
1. Run analysis on an algorithm.
2. If an API key is available, the **Compare with LLM** button appears in the results panel.
3. Click the button. A comparison modal opens with a progress indicator.
4. Wait for the LLM to process (may take 10–30 seconds).
5. Review the comparison:
   - **Own Analysis**: the deterministic result
   - **LLM Analysis**: the model's analysis of the same code
   - **Note**: a brief assessment of differences or agreement
6. Use the comparison for discussion: is the LLM's analysis accurate? Does it match the deterministic engine? Where do they differ?

**Limitations:**
- The LLM may produce different results depending on the model, prompt, and temperature.
- The comparison is pedagogical, not authoritative.
- Without an API key, this feature is hidden.
- The comparison does not replace the formal analysis.

## 7. Export Workflow

**Goal:** Export analysis results in a chosen format.

**Steps:**
1. Run analysis (must have results to export).
2. Click **Export**.
3. Select a format:
   - **Markdown**: quick, readable, versionable
   - **LaTeX**: for academic papers
   - **PDF**: institutional format (requires `pdflatex`)
   - **ZIP**: bundle with report + `snapshot.json` + `manifest.json`
4. Click **Generate**.
5. The file downloads automatically.

See the [exports guide](./exports-guide.md) for format details and limitations.

## Auxiliary Tools

| Tool | Description |
|------|-------------|
| **Loop Invariant** | Shows the inferred loop invariant (for supported iterative algorithms) |
| **Recursive Invariant** | Shows the recursive invariant with base property, inductive hypothesis, recursive step, and termination guarantee |
| **GPU vs CPU** | Heuristic analysis of structural suitability for parallel execution (CPU/GPU) — not a benchmark |
| **AST View** | Shows the parsed Abstract Syntax Tree (tree or JSON mode) |
| **TXT Import** | Import pseudocode from a `.txt` file with normalization suggestions |
| **Repair** | LLM-assisted pseudocode repair (requires API key) |

## Known Limits

- LLM and comparison features may not be available (no API key, backend not configured).
- The assistant explains visible data; it does not substitute formal results.
- GPU vs CPU analysis is heuristic, not a scientific benchmark.
