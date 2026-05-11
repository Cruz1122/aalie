# Recursive Invariant Architecture & Design

## Overview

The **Recursive Invariant** is a pedagogical artefact generated deterministically for recursive algorithms when no loop invariant is available. It provides structured narrative explanation of recursion correctness through inductive reasoning.

**Design Philosophy:**
- Deterministic: Uses only local AST evidence, no external ML
- Generic: Works for any recursive algorithm type
- Pedagogical: 4-section narrative (base → hypothesis → step → termination)
- Complementary: Augments (not replaces) complexity analysis
- Graceful Degradation: Explicit states for unsupported cases

---

## Domain Model

### RecursiveInvariant (Payload)

```typescript
interface RecursiveInvariant {
  status: "ok" | "low_confidence" | "unavailable"
  reason?: "no_recursive_calls" | "complex_recursion" | "insufficient_evidence"
  
  recursiveStructure: {
    baseCondition: string        // e.g., "n <= 1"
    baseResult: string           // e.g., "return 1"
    recursiveCallPattern: {
      calls: string              // e.g., "f(n-1)" or "f(n/2)"
      parameters: string[]       // e.g., ["n-1"] or ["n/2"]
    }[]
  }
  
  invariant: {
    baseProperty: string         // What holds at base case
    inductiveHypothesis: string  // Inductive assumption
    recursiveStep: string        // How induction works
    terminationGarantee: string  // Why recursion terminates
  }
  
  didacticSummary: string        // One-line pedagogical summary
  confidence: number             // 0.0 to 1.0
  evidence: {
    detectedRecursiveCalls: string[]
    baseConditions: string[]
    recursionType: "linear_recursive" | "divide_conquer" | "multiple_recursive" | "unknown"
  }
}
```

### RecursionType Classification

| Type | Pattern | Example | Confidence |
|------|---------|---------|-----------|
| `linear_recursive` | T(n) = T(n-1) + O(1) | Countdown, factorial | 0.82-0.95 |
| `divide_conquer` | T(n) = T(n/2) + O(n) | Binary search, merge sort | 0.88-0.95 |
| `multiple_recursive` | T(n) = T(n-1) + T(n-2) + ... | Fibonacci | 0.78-0.95 |
| `unknown` | Unclassified | Complex transforms | 0.0-0.3 |

---

## Pipeline Architecture

```
AST (Pseudocode)
    ↓
extract_recursive_facts()  [extractor.py]
    ├─ Find recursive call sites (with path tracking)
    ├─ Extract base conditions (first If only)
    ├─ Extract base results (first If consequent only)
    ├─ Detect mutual exclusivity (branch path analysis)
    └─ Calculate subproblems_per_call (1 if exclusive, else count)
    ↓
RecursiveFacts
    ├─ has_recursive_calls: bool
    ├─ recursive_calls: List[RecursiveCallInfo]
    ├─ base_conditions: List[str]
    ├─ base_results: List[str]
    ├─ calls_are_mutually_exclusive: bool
    └─ subproblems_per_call: int
    ↓
classify_recursion_pattern()  [classifier.py]
    ├─ Check mutual exclusivity (highest priority)
    ├─ Analyze call parameters (subtraction/division/etc)
    ├─ Count recursive calls
    └─ Assign confidence score
    ↓
ClassificationResult
    ├─ recursion_type: RecursionType
    ├─ confidence: float
    └─ reasons: List[str]
    ↓
build_invariant_text()  [templates.py]
    ├─ Select templates by type + locale
    ├─ Substitute context variables
    ├─ Render 4 narrative sections
    └─ Generate didactic summary
    ↓
InvariantText
    ├─ base_property: str
    ├─ inductive_hypothesis: str
    ├─ recursive_step: str
    ├─ termination_guarantee: str
    └─ didactic_summary: str
    ↓
generate_recursive_invariant()  [service.py]
    ├─ Determine status (ok/low_confidence/unavailable)
    ├─ Build recursive structure
    ├─ Assemble evidence
    └─ Return fixed-shape payload
    ↓
RecursiveInvariant (JSON)
```

---

## Key Design Decisions

### 1. **Path Tracking for Mutual Exclusivity**

Recursive calls can appear in different branches of conditional statements:

```
If condition:
    Call f(n-1)  ← Branch T (taken if condition true)
Else:
    Call f(n/2)  ← Branch F (taken if condition false)
```

These are **mutually exclusive**: only one executes per invocation.

**Algorithm:**
- Track `path: List['T'|'F']` through If traversal
- Compare paths pairwise: if they differ at same depth with one 'T' and one 'F', mark exclusive
- **Result:** Binary search → `calls_are_mutually_exclusive = True` → classify as divide_conquer (not multiple_recursive)

### 2. **Subproblems Per Call vs. Recursive Call Count**

Two different metrics:

| Metric | Meaning | Example (Binary Search) |
|--------|---------|------------------------|
| `recursive_call_count` | # of call sites in code | 2 (two branches have calls) |
| `subproblems_per_call` | # subproblems actually resolved **per execution** | 1 (only one branch executes) |

**Importance:** 
- Binary search has 2 call sites BUT only solves 1 subproblem per call
- This distinction prevents misclassification as "multiple recursion" (Fibonacci-like)

### 3. **Base Case Extraction (First If Only)**

Base cases are typically in the first If statement:

```pseudocode
FUNCTION f(n)
    If n <= 1                    ← First If = Base Case
        Return 1
    Else
        ...
        If n == found           ← Nested If = Recursive Case
            Return found
        Else
            Return f(n-1)
```

**Strategy:**
- `_extract_base_conditions()`: Process only the first If
- `_extract_base_results()`: Extract only from first If's **consequent** (true branch)
- **Why:** Avoids polluting base case info with recursive case details

### 4. **Confidence Scoring**

Confidence increases with evidence clarity:

```python
confidence = 0.75  # Base

if facts.has_clear_base_case:
    confidence += 0.08  # ±8% for obvious base conditions

if facts.parameters_strictly_decrease:
    confidence += 0.10  # ±10% for clear termination

if facts.has_clear_termination:
    confidence += 0.05  # ±5% for explicit base case
```

**Status Mapping:**
- `confidence >= 0.75` → `status = "ok"`
- `0.50 <= confidence < 0.75` → `status = "low_confidence"`
- `confidence < 0.50` → `status = "unavailable"`

---

## Extensibility Points

### 1. **Adding New Recursion Types**

To recognize a new recursion pattern (e.g., tail-recursive, mutual recursion):

1. **Update `RecursionType`** in `schemas.py`:
   ```python
   RecursionType = Literal[
       "linear_recursive",
       "divide_conquer",
       "multiple_recursive",
       "tail_recursive",  # NEW
       "unknown",
   ]
   ```

2. **Add classification logic** in `classifier.py`:
   ```python
   # Check for tail recursion (last statement is recursive call)
   if is_tail_call(facts.recursive_calls):
       return ClassificationResult(
           recursion_type="tail_recursive",
           confidence=0.85,
           reasons=["Last statement is recursive call", ...]
       )
   ```

3. **Add templates** in `templates.py`:
   ```python
   "tail_recursive": {
       "en": { "base_property": "...", ... },
       "es": { "base_property": "...", ... },
   }
   ```

### 2. **Improving Confidence Scoring**

Current scoring is heuristic. Future improvements:

- **AST Depth Analysis:** Deeper nesting → lower confidence
- **Pattern Regularity:** Consistent shift patterns (n-1, n-2 vs. n-1, n/2) → higher confidence
- **Base Case Clarity:** Multiple base conditions → lower confidence
- **Termination Proof:** Can we detect termination guarantee from code structure?

### 3. **Supporting Multiple Procedure Definitions**

Currently handles single procedure. For mutual recursion:

```pseudocode
FUNCTION f(n)
    If n <= 0: Return 1
    Return g(n-1)

FUNCTION g(n)
    If n <= 0: Return 1
    Return f(n-1)
```

**Approach:**
- Extend `extract_recursive_facts()` to accept list of procedures
- Track inter-procedure calls
- Classify mutual recursion pattern
- Generate narrative for call graph

### 4. **Formal Verification Integration**

Currently: Deterministic heuristics + narrative explanation

**Future:**
- SMT solver integration for termination proof
- Recurrence relation extraction → SymPy solving
- Loop/recursion rank analysis (Terminator-style)

---

## Integration Points

### Backend Integration (Python/FastAPI)

**In `RecursiveAnalyzer.analyze()`:**
```python
def analyze(self, ast: Dict, ...):
    result = self.result()
    
    # Generate recursive invariant (post-analysis)
    if result.get("ok"):
        try:
            self.recursive_invariant = generate_recursive_invariant(
                ast=ast,
                locale=self.locale,
            )
        except Exception:
            self.recursive_invariant = None
    
    return result
```

**In `service.py` (`analyze_algorithm()`):**
```python
if isinstance(analyzer, RecursiveAnalyzer):
    result["recursiveInvariant"] = analyzer.recursive_invariant
```

### Frontend Integration (React/Next.js)

**In `page.tsx`:**
```tsx
const isAlgorithmRecursive = isRecursiveAnalysis(data?.worst);
const recursiveInvariantData = data?.recursiveInvariant || null;

// Render button contextually
{isAlgorithmRecursive ? (
    <button onClick={() => setShowRecursiveInvariantModal(true)}>
        {t("viewRecursiveInvariant")}
    </button>
) : (
    <button onClick={() => setShowLoopInvariantModal(true)}>
        {t("viewLoopInvariant")}
    </button>
)}

// Render modal
<RecursiveInvariantModal
    open={showRecursiveInvariantModal}
    onClose={() => setShowRecursiveInvariantModal(false)}
    recursiveInvariant={recursiveInvariantData}
/>
```

### Localization (i18n)

All user-facing strings in `messages/{en,es}.json`:

```json
{
  "analyzer": {
    "recursiveInvariant": {
      "title": "Recursive Invariant",
      "sections": {
        "baseProperty": "Base Case Property",
        "inductiveHypothesis": "Inductive Hypothesis",
        "recursiveStep": "Recursive Step",
        "terminationGarantee": "Termination Guarantee"
      }
    }
  }
}
```

---

## Testing Strategy

### Unit Tests (`test_recursive_invariant_generation.py`)

- **Fibonacci:** Multiple recursion with exponential growth
- **Binary Search:** Mutually exclusive branches (divide-and-conquer)
- **Countdown:** Linear recursion with constant shift
- **Locale Test:** Verify English/Spanish generation

### E2E Tests (Playwright)

- Analyze recursive algorithm
- Click recursive invariant button
- Verify modal renders correctly
- Check all 4 sections display
- Verify status badge shows correct confidence
- Test modal close/open

### Regression Tests

- Run full analysis suite on recursive + iterative algorithms
- Verify no regressions in complexity analysis
- Verify loop invariant still works for iterative code

---

## Performance Considerations

### Complexity Analysis

| Phase | Time | Space |
|-------|------|-------|
| AST Traversal | O(n) | O(1) |
| Path Tracking | O(n) | O(d) where d = nesting depth |
| Classification | O(c) where c = call count | O(1) |
| Template Rendering | O(t) where t = template size | O(1) |
| **Total** | **O(n)** | **O(d)** |

- **Typical:** < 10ms for algorithms with < 1000 AST nodes
- **Pathological:** Deep recursion tree + deep nesting → O(d) space

### Caching Opportunities

- Pre-compile regex patterns in `_stringify_expr()`
- Cache template strings (Jinja2-style)
- Memoize classification results per AST

---

## Error Handling

### Graceful Degradation

```python
# If invariant generation fails, return explicit unavailable status
if not facts.has_recursive_calls:
    return {
        "status": "unavailable",
        "reason": "no_recursive_calls",
        "recursiveStructure": {...},  # Empty structure
        "invariant": {...},            # Empty text
        "confidence": 0.0,
    }
```

### User-Facing Messages

**English:**
- `ok`: "Well-supported recursive structure"
- `low_confidence`: "Partially supported (confidence: 62%)"
- `unavailable`: "Recursive invariant not available"

**Spanish:**
- `ok`: "Estructura recursiva bien soportada"
- `low_confidence`: "Parcialmente soportada (confianza: 62%)"
- `unavailable`: "Invariante recursivo no disponible"

---

## Future Roadmap

### Phase 2: Enhanced Classification

- [ ] Tail recursion detection
- [ ] Mutual recursion support
- [ ] Accumulator pattern recognition
- [ ] CPS (continuation-passing style) detection

### Phase 3: Formal Integration

- [ ] Recurrence relation extraction
- [ ] SymPy solver integration
- [ ] Termination proof generation
- [ ] Complexity bound generation

### Phase 4: Visualization

- [ ] Recursion tree visualization (first N levels)
- [ ] Inductive proof step-by-step walkthrough
- [ ] Call graph rendering (for mutual recursion)
- [ ] Parameter trace animation

### Phase 5: Educational Tools

- [ ] Quiz generation (test understanding of base/inductive/step)
- [ ] Interactive "prove by induction" sandbox
- [ ] Comparison tool (two recursive approaches)
- [ ] Pattern library (catalog of recursion patterns)

---

## References

- **Inductive Proof:** [Mathematical Induction - Khan Academy](https://www.khanacademy.org/math/algebra-home/alg-series-and-induction/alg-induction)
- **Recurrence Relations:** CLRS Chapter 4 (Divide-and-Conquer)
- **Structural Recursion:** [Recursive Data Structures - MIT OpenCourseWare](https://ocw.mit.edu)
- **Loop Invariants (Complementary):** Existing AALIE documentation

---

## Appendix: Template Injection Context

### Available Variables

```python
context = {
    "recursion_type": "divide_conquer",
    "base_condition": "inicio > fin",
    "base_result": "return -1",
    "num_recursive_calls": 2,
    "num_subproblems": 1,              # Key: NOT recursive_call_count
    "divisor": 2,
    "work_term": "O(n)",
    "recurrence_template": "T(n) = T(n/2) + O(work)",
}
```

### Template Example

**Input:**
```
"The function divides the problem into {{num_subproblems}} subproblem(s) "
"of size ~n/{{divisor}}, solving each recursively and combining in {{work_term}}."
```

**Output:**
```
"The function divides the problem into 1 subproblem(s) "
"of size ~n/2, solving each recursively and combining in O(n)."
```

---

**Document Version:** 1.0  
**Last Updated:** May 2026  
**Maintainer:** AALIE Project
