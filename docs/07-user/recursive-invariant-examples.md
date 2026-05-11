# Recursive Invariant Examples

This document showcases real algorithms and the pedagogical recursive invariants they generate.

---

## 1. Fibonacci (Multiple Recursion)

### Algorithm

```
FUNCTION fib(n)
BEGIN
  IF n <= 1 THEN
    RETURN 1
  ELSE
    RETURN fib(n-1) + fib(n-2)
  END
END
```

### Classification

- **Type:** Multiple Recursion
- **Confidence:** 91%
- **Recursion Calls:** 2
- **Subproblems per call:** 2

### Recursive Invariant

**Base Property:**
If n ≤ 1, the function returns 1.

**Inductive Hypothesis:**
Assume all recursive calls with inputs strictly smaller than n produce correct Fibonacci numbers.

**Recursive Step:**
The function combines results from 2 recursive calls along with work term O(1). Formally:
$$T(n) = T(n-1) + T(n-2) + O(1)$$

By the inductive hypothesis, both sub-results are correct, so the combined result is also correct.

**Termination Guarantee:**
Problem size decreases in each recursive branch; base cases stop recursion.

### Insight

The key observation is that **Fibonacci makes 2 independent recursive calls** at each level. This leads to exponential growth: roughly $2^n$ calls total. The structure helps understand why naive Fibonacci is inefficient (despite being simple conceptually).

---

## 2. Binary Search (Divide-and-Conquer)

### Algorithm

```
FUNCTION busquedaBinaria(A, x, inicio, fin)
BEGIN
  IF inicio > fin THEN
    RETURN -1
  END
  
  mitad = (inicio + fin) / 2
  
  IF A[mitad] = x THEN
    RETURN mitad
  ELSE IF x < A[mitad] THEN
    RETURN busquedaBinaria(A, x, inicio, mitad - 1)
  ELSE
    RETURN busquedaBinaria(A, x, mitad + 1, fin)
  END
END
```

### Classification

- **Type:** Divide-and-Conquer
- **Confidence:** 88%
- **Recursion Calls:** 2
- **Subproblems per call:** 1 ⚠️ (mutually exclusive branches)

### Recursive Invariant

**Base Property:**
If inicio > fin, the function returns -1 without further recursion.

**Inductive Hypothesis:**
Assume f(k) works correctly for all strictly smaller search ranges k.

**Recursive Step:**
For a search range of size n, we identify the midpoint, compare the target with the middle element, and recursively search either the left or right half (size ~n/2). Only ONE branch executes per call. By the inductive hypothesis, the recursive call produces the correct result.

**Termination Guarantee:**
Each recursion reduces problem size (n → n/2). Size strictly decreases, eventually reaching the base case.

### Insight

**Critical Difference from Fibonacci:**
- Binary search has **2 call sites in the code** (left and right branches)
- But **only 1 executes per invocation** (mutually exclusive)
- This yields O(log n) complexity, NOT exponential

The invariant makes this clear: "Only one branch executes" is the key insight.

---

## 3. Countdown (Linear Recursion)

### Algorithm

```
FUNCTION countdown(n)
BEGIN
  IF n = 0 THEN
    RETURN 0
  ELSE
    RETURN countdown(n - 1)
  END
END
```

### Classification

- **Type:** Linear Recursion
- **Confidence:** 82%
- **Recursion Calls:** 1
- **Subproblems per call:** 1

### Recursive Invariant

**Base Property:**
If n = 0, the function returns 0.

**Inductive Hypothesis:**
Assume f(k) works correctly for all k < n.

**Recursive Step:**
For f(n), we compute f(n-1) and combine it with a constant amount of work (O(1)). By the inductive hypothesis, f(n-1) works correctly, so f(n) also satisfies the property.

**Termination Guarantee:**
Each call decreases n by a constant (1). Eventually, n reaches the base case, guaranteeing termination.

### Insight

Linear recursion is the "simplest" recursive pattern: one smaller problem at each level, leading to O(n) total calls.

---

## 4. Merge Sort (Multiple Recursion with Structure)

### Algorithm

```
FUNCTION mergeSort(A, p, r)
BEGIN
  IF p >= r THEN
    RETURN
  END
  
  q = (p + r) / 2
  
  mergeSort(A, p, q)
  mergeSort(A, q + 1, r)
  merge(A, p, q, r)
END
```

### Classification

- **Type:** Multiple Recursion (2 sequential calls)
- **Confidence:** 73%
- **Recursion Calls:** 2
- **Subproblems per call:** 2

### Recursive Invariant

**Base Property:**
If p ≥ r, the array segment is already "sorted" (trivially, since size ≤ 1).

**Inductive Hypothesis:**
Assume mergeSort works correctly for all segments of size < (r - p).

**Recursive Step:**
We divide the segment [p, r] into two halves [p, q] and [q+1, r], recursively sort both, and merge them. By the inductive hypothesis, both halves are correctly sorted. The merge operation combines them in O(n) work, producing a sorted result.

**Termination Guarantee:**
Each recursion divides the segment size (n → n/2). Size strictly decreases, eventually reaching the base case.

### Insight

Merge sort is interesting: it has **2 independent calls** (like multiple recursion), but the work distribution is very structured. The combined complexity is O(n log n) because of the O(n) merge at each level. The invariant helps understand why merge sort is efficient despite making many recursive calls.

---

## 5. Quick Sort (Multiple Recursion with Partition)

### Algorithm

```
FUNCTION quickSort(A, p, r)
BEGIN
  IF p < r THEN
    q = partition(A, p, r)
    quickSort(A, p, q - 1)
    quickSort(A, q + 1, r)
  END
END
```

### Classification

- **Type:** Multiple Recursion (2 sequential calls)
- **Confidence:** 73%
- **Recursion Calls:** 2
- **Subproblems per call:** 2

### Recursive Invariant

**Base Property:**
If p ≥ r, the segment is already sorted (size ≤ 1).

**Inductive Hypothesis:**
Assume quickSort works correctly for all smaller segments.

**Recursive Step:**
We partition the segment around a pivot into two parts, recursively sort both, and rely on partition correctness. By the inductive hypothesis, both parts are sorted, giving a sorted array overall.

**Termination Guarantee:**
Segment size decreases at each level (random or worst-case dependent).

### Insight

Quick sort is probabilistically efficient (average O(n log n)) despite the same structure as merge sort. The difference is in **where the work happens**:
- Merge sort: work at **merge phase** (O(n) per level)
- Quick sort: work at **partition phase** (O(n) once)

The invariant structure is similar, but the complexity implications differ.

---

## 6. Tower of Hanoi (Exponential Growth)

### Algorithm

```
FUNCTION hanoi(n, from, to, aux)
BEGIN
  IF n = 1 THEN
    PRINT "Move from X to Y"
  ELSE
    hanoi(n - 1, from, aux, to)
    PRINT "Move from X to Y"
    hanoi(n - 1, aux, to, from)
  END
END
```

### Classification

- **Type:** Multiple Recursion
- **Confidence:** 73%
- **Recursion Calls:** 2
- **Subproblems per call:** 2

### Recursive Invariant

**Base Property:**
If n = 1, move the disk directly.

**Inductive Hypothesis:**
Assume hanoi correctly moves n-1 disks from any peg to any other peg.

**Recursive Step:**
To move n disks:
1. Move top n-1 disks from `from` to `aux` (using `to` as auxiliary)
2. Move the largest disk from `from` to `to`
3. Move n-1 disks from `aux` to `to` (using `from` as auxiliary)

By the inductive hypothesis, steps 1 and 3 are correct, and the largest disk never blocks smaller ones.

**Termination Guarantee:**
Each recursive call reduces n by 1, eventually reaching n = 1.

### Insight

Tower of Hanoi requires $2^n - 1$ moves total (exponential). Despite being elegant, it's one of the slowest practical algorithms. The invariant shows **why it works** (clever use of auxiliary peg), but the exponential growth is inherent to the problem structure.

---

## 7. Binary Exponentiation (Divide-and-Conquer with Optimization)

### Algorithm

```
FUNCTION power(x, n)
BEGIN
  IF n = 0 THEN
    RETURN 1
  END
  
  IF n % 2 = 1 THEN
    RETURN x * power(x, n - 1)
  ELSE
    RETURN power(x * x, n / 2)
  END
END
```

### Classification

- **Type:** Divide-and-Conquer
- **Confidence:** 96%
- **Recursion Calls:** 2
- **Subproblems per call:** 1 (mutually exclusive)

### Recursive Invariant

**Base Property:**
If n = 0, x^n = 1.

**Inductive Hypothesis:**
Assume power(x, k) correctly computes x^k for all k < n.

**Recursive Step:**
For even n: $x^n = (x^2)^{n/2}$ ⟹ one recursive call with half the exponent  
For odd n: $x^n = x \cdot x^{n-1}$ ⟹ multiply by x and reduce exponent by 1

By the inductive hypothesis, the recursive call produces the correct result, and the scaling is correct.

**Termination Guarantee:**
Exponent halves (even case) or reduces by 1 then halves, reaching n = 0.

### Insight

This is the **optimal exponentiation algorithm** with O(log n) multiplications. The invariant shows:
1. Why it's correct (mathematical identity for even/odd cases)
2. Why it's fast (halving vs. decrementing)
3. How it compares to naive approaches (binary vs. unary reduction)

---

## Key Takeaways

| Algorithm | Type | Calls/Level | Complexity | Key Insight |
|-----------|------|-------------|-----------|------------|
| Fibonacci | Multiple | 2 | O(2^n) | Independent calls → exponential |
| Binary Search | D&C | 2* | O(log n) | Mutually exclusive branches → halving |
| Countdown | Linear | 1 | O(n) | Single path → linear |
| Merge Sort | Multiple | 2 | O(n log n) | 2 calls + O(n) merge/level |
| Quick Sort | Multiple | 2 | O(n log n) avg | 2 calls, work at partition |
| Tower of Hanoi | Multiple | 2 | O(2^n) | Clever but inherently exponential |
| Power | D&C | 2* | O(log n) | Mutual exclusion + halving |

*: Mutually exclusive branches

---

## Using the Invariant for Learning

1. **Understand Correctness:** The 4-section narrative (base → hypothesis → step → termination) mirrors a formal inductive proof.

2. **Distinguish Patterns:** Compare two algorithms with the same recursion count but different complexities (e.g., binary search vs. Fibonacci).

3. **Design New Algorithms:** When designing a recursive algorithm, ask:
   - "What's my base case?"
   - "How does my recursive step shrink the problem?"
   - "Are my branches exclusive or independent?"
   - "How much work per level?"

4. **Debug and Optimize:** If an algorithm is slow, check the invariant:
   - Are you solving more subproblems than needed? (e.g., naive Fibonacci)
   - Can you add memoization? (top-down DP)
   - Can you convert to iteration? (bottom-up DP)

---

## Next Steps

- Explore the **Recurrence Relations** section to see how the invariant translates to complexity formulas
- Use the **Execution Trace** to step through a small instance and verify the invariant holds
- Compare invariants across languages or algorithm variants in your codebase

---

**Document Version:** 1.0  
**Last Updated:** May 2026  
**Tool:** AALIE Recursive Invariant Generator
