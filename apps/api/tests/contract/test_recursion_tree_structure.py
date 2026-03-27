"""
Tests de estructura del árbol de recursión para algoritmos de referencia.
Verifica que levels, height, theta y etiquetas sean correctos según el tipo de recurrencia.

Author: @Cruz1122
"""
from app.modules.analysis.service import analyze_algorithm

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


class TestRecursionTreeStructure:
    """Verifica estructura y etiquetas del árbol de recursión para algoritmos de referencia."""

    def test_merge_sort_tree_levels_and_labels(self):
        """Merge sort (divide-and-conquer): levels con 2^i nodos, subproblem n/2^i, theta Θ(n log n)."""
        result = analyze_algorithm(MERGE_SORT, mode="worst", preferred_method="recursion_tree")
        assert result.get("ok"), f"Análisis falló: {result.get('errors', [])}"
        totals = result.get("totals", {})
        recursion_tree = totals.get("recursion_tree", {})
        assert recursion_tree, "Debe tener recursion_tree"
        assert recursion_tree.get("recurrence_type") == "divide_conquer"
        levels = recursion_tree.get("levels", [])
        assert len(levels) >= 2, "Debe tener al menos 2 niveles"
        # Nivel 0: 1 nodo, tamaño n
        assert levels[0].get("num_nodes_latex") == "1"
        assert "n" in levels[0].get("subproblem_size_latex", "")
        # Nivel 1: 2 nodos, tamaño n/2
        assert "2" in levels[1].get("num_nodes_latex", "")
        assert "n/2" in levels[1].get("subproblem_size_latex", "").replace(" ", "")
        assert "log" in recursion_tree.get("height", "").lower() or "2" in recursion_tree.get("height", "")
        theta = recursion_tree.get("theta", "")
        assert "n" in theta and ("log" in theta.lower() or "\\log" in theta)

    def test_merge_sort_tree_has_required_fields(self):
        """Merge sort: verificar presencia de num_nodes_latex, subproblem_size_latex, cost_per_node_latex, total_cost_latex."""
        result = analyze_algorithm(MERGE_SORT, mode="worst", preferred_method="recursion_tree")
        assert result.get("ok")
        recursion_tree = result.get("totals", {}).get("recursion_tree", {})
        levels = recursion_tree.get("levels", [])
        for level in levels:
            assert "num_nodes_latex" in level
            assert "subproblem_size_latex" in level
            assert "cost_per_node_latex" in level
            assert "total_cost_latex" in level

    def test_binary_search_tree_structure(self):
        """Búsqueda binaria (divide-and-conquer a=1): 1 nodo por nivel, theta Θ(log n)."""
        result = analyze_algorithm(BINARY_SEARCH_REC, mode="worst", preferred_method="recursion_tree")
        assert result.get("ok"), f"Análisis falló: {result.get('errors', [])}"
        totals = result.get("totals", {})
        totals.get("recurrence", {})
        # Puede usar recursion_tree o master según detección
        if "recursion_tree" in totals:
            recursion_tree = totals["recursion_tree"]
            assert recursion_tree.get("recurrence_type") == "divide_conquer"
            theta = recursion_tree.get("theta", "")
            assert "log" in theta.lower() or "\\log" in theta

    def test_fibonacci_recurrence_type_linear_shift(self):
        """Fibonacci: recurrence.type debe ser linear_shift."""
        result = analyze_algorithm(FIBONACCI_REC, mode="worst")
        assert result.get("ok"), f"Análisis falló: {result.get('errors', [])}"
        recurrence = result.get("totals", {}).get("recurrence", {})
        assert recurrence.get("type") == "linear_shift", (
            f"Fibonacci debe ser linear_shift, obtuvo {recurrence.get('type')}"
        )

    def test_fibonacci_recursion_tree_preferred_correct_structure(self):
        """Fibonacci con preferred_method=recursion_tree: no debe usar estructura divide-and-conquer incorrecta."""
        result = analyze_algorithm(FIBONACCI_REC, mode="worst", preferred_method="recursion_tree")
        assert result.get("ok"), f"Análisis falló: {result.get('errors', [])}"
        totals = result.get("totals", {})
        recursion_tree = totals.get("recursion_tree", {})
        assert recursion_tree, "Debe tener recursion_tree"
        # Debe ser linear_shift (rama Fibonacci), no divide_conquer
        assert recursion_tree.get("recurrence_type") == "linear_shift"
        theta = recursion_tree.get("theta", "")
        # Fibonacci es Θ(φ^n), no Θ(n log n)
        assert "n" not in theta or "log" not in theta.lower(), (
            f"Fibonacci no debe dar Θ(n log n), obtuvo theta={theta}"
        )

    def test_quicksort_worst_tree_structure(self):
        """Quicksort peor caso (linear_shift): 1 nodo por nivel, theta Θ(n²)."""
        result = analyze_algorithm(QUICK_SORT_WORST, mode="worst", preferred_method="recursion_tree")
        assert result.get("ok"), f"Análisis falló: {result.get('errors', [])}"
        totals = result.get("totals", {})
        recursion_tree = totals.get("recursion_tree", {})
        if recursion_tree:
            assert recursion_tree.get("recurrence_type") == "linear_shift"
            levels = recursion_tree.get("levels", [])
            # 1 nodo por nivel
            assert levels[0].get("num_nodes_latex") == "1"
            theta = recursion_tree.get("theta", "")
            assert "2" in theta or "n^2" in theta.lower() or "n²" in theta
