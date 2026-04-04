import pytest

from app.modules.analysis.service import analyze_algorithm

pytestmark = [pytest.mark.contract, pytest.mark.recursive]

MERGE_SORT = """mergeSort(A, izq, der) BEGIN
  IF (izq < der) THEN BEGIN
    medio <- (izq + der) / 2;
    CALL mergeSort(A, izq, medio);
    CALL mergeSort(A, medio + 1, der);
    CALL merge(A, izq, medio, der);
  END
END
"""

BINARY_SEARCH_REC = """busquedaBinaria(A, x, inicio, fin) BEGIN
  IF (inicio > fin) THEN BEGIN
    RETURN -1;
  END
  mitad <- (inicio + fin) / 2;
  IF (A[mitad] = x) THEN BEGIN
    RETURN mitad;
  END
  IF (x < A[mitad]) THEN BEGIN
    RETURN busquedaBinaria(A, x, inicio, mitad - 1);
  END
  ELSE BEGIN
    RETURN busquedaBinaria(A, x, mitad + 1, fin);
  END
END
"""

FIBONACCI_REC = """fibonacci(n) BEGIN
  IF (n <= 1) THEN BEGIN
    RETURN n;
  END
  RETURN fibonacci(n - 1) + fibonacci(n - 2);
END
"""

QUICK_SORT_WORST = """quickSortWorst(A, izq, der) BEGIN
  IF (izq < der) THEN BEGIN
    pivot <- izq;
    i <- izq;
    FOR j <- izq + 1 TO der DO BEGIN
      IF (A[j] < A[pivot]) THEN BEGIN
        i <- i + 1;
        temp <- A[i];
        A[i] <- A[j];
        A[j] <- temp;
      END
    END
    temp <- A[pivot];
    A[pivot] <- A[i];
    A[i] <- temp;
    CALL quickSortWorst(A, izq, i - 1);
    CALL quickSortWorst(A, i + 1, der);
  END
END
"""


def test_merge_sort_tree_levels_and_labels():
    result = analyze_algorithm(
        MERGE_SORT, mode="worst", preferred_method="recursion_tree"
    )
    assert result.get("ok"), result.get("errors", [])
    recursion_tree = result.get("totals", {}).get("recursion_tree", {})
    assert recursion_tree.get("recurrence_type") == "divide_conquer"
    levels = recursion_tree.get("levels", [])
    assert len(levels) >= 2
    assert levels[0].get("num_nodes_latex") == "1"
    assert "n" in levels[0].get("subproblem_size_latex", "")
    assert "2" in levels[1].get("num_nodes_latex", "")
    assert "n/2" in levels[1].get("subproblem_size_latex", "").replace(" ", "")
    assert "log" in recursion_tree.get(
        "height", ""
    ).lower() or "2" in recursion_tree.get("height", "")
    theta = recursion_tree.get("theta", "")
    assert "n" in theta and ("log" in theta.lower() or "\\log" in theta)


def test_merge_sort_tree_has_required_fields():
    result = analyze_algorithm(
        MERGE_SORT, mode="worst", preferred_method="recursion_tree"
    )
    assert result.get("ok")
    levels = result.get("totals", {}).get("recursion_tree", {}).get("levels", [])
    for level in levels:
        assert "num_nodes_latex" in level
        assert "subproblem_size_latex" in level
        assert "cost_per_node_latex" in level
        assert "total_cost_latex" in level


def test_binary_search_tree_structure():
    result = analyze_algorithm(
        BINARY_SEARCH_REC, mode="worst", preferred_method="recursion_tree"
    )
    assert result.get("ok"), result.get("errors", [])
    recursion_tree = result.get("totals", {}).get("recursion_tree", {})
    if recursion_tree:
        assert recursion_tree.get("recurrence_type") == "divide_conquer"
        theta = recursion_tree.get("theta", "")
        assert "log" in theta.lower() or "\\log" in theta


def test_fibonacci_recurrence_type_linear_shift():
    result = analyze_algorithm(FIBONACCI_REC, mode="worst")
    assert result.get("ok"), result.get("errors", [])
    recurrence = result.get("totals", {}).get("recurrence", {})
    assert recurrence.get("type") == "linear_shift"


def test_fibonacci_recursion_tree_preferred_correct_structure():
    result = analyze_algorithm(
        FIBONACCI_REC, mode="worst", preferred_method="recursion_tree"
    )
    assert result.get("ok"), result.get("errors", [])
    recursion_tree = result.get("totals", {}).get("recursion_tree", {})
    assert recursion_tree
    assert recursion_tree.get("recurrence_type") == "linear_shift"
    theta = recursion_tree.get("theta", "")
    assert "n" not in theta or "log" not in theta.lower()


def test_quicksort_worst_tree_structure():
    result = analyze_algorithm(
        QUICK_SORT_WORST, mode="worst", preferred_method="recursion_tree"
    )
    assert result.get("ok"), result.get("errors", [])
    recursion_tree = result.get("totals", {}).get("recursion_tree", {})
    if recursion_tree:
        assert recursion_tree.get("recurrence_type") == "linear_shift"
        levels = recursion_tree.get("levels", [])
        assert levels[0].get("num_nodes_latex") == "1"
        theta = recursion_tree.get("theta", "")
        assert "2" in theta or "n^2" in theta.lower() or "n²" in theta
