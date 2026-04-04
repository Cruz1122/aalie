"""
Tests de inferencia de parámetros para ejecución recursiva.
"""

import pytest

from app.modules.execution.executor import CodeExecutor
from app.modules.parsing.service import parse_source


def _build_executor(source: str, input_size: int = 4) -> tuple[CodeExecutor, dict]:
    parsed = parse_source(source)
    assert parsed.get("ok") is True
    ast = parsed.get("ast")
    assert isinstance(ast, dict)
    proc = ast.get("body", [])[0]
    assert isinstance(proc, dict)
    return CodeExecutor(ast, input_size=input_size, case="worst"), proc


@pytest.mark.unit
def test_map_procedure_params_infers_linked_list_without_initial_variables() -> None:
    source = """
buscarLista(nodo, valor) BEGIN
    IF (nodo = null) THEN BEGIN
        RETURN false;
    END
    IF (nodo.valor = valor) THEN BEGIN
        RETURN true;
    END
    ELSE BEGIN
        RETURN buscarLista(nodo.siguiente, valor);
    END
END
"""
    executor, proc = _build_executor(source, input_size=4)
    params = executor._map_procedure_params(proc)

    nodo = params.get("nodo")
    assert isinstance(nodo, dict)
    assert "valor" in nodo
    assert "siguiente" in nodo
    assert params.get("valor") == 1

    trace = executor.execute()
    calls = (trace.get("recursionTree") or {}).get("calls", [])
    assert len(calls) > 1
    assert len(calls) < executor.max_recursion_depth


@pytest.mark.unit
def test_map_procedure_params_infers_bst_without_initial_variables() -> None:
    source = """
buscarBST(raiz, valor) BEGIN
    IF (raiz = null) THEN BEGIN
        RETURN null;
    END
    IF (raiz.valor = valor) THEN BEGIN
        RETURN raiz;
    END
    ELSE BEGIN
        IF (valor < raiz.valor) THEN BEGIN
            RETURN buscarBST(raiz.izquierda, valor);
        END
        ELSE BEGIN
            RETURN buscarBST(raiz.derecha, valor);
        END
    END
END
"""
    executor, proc = _build_executor(source, input_size=4)
    params = executor._map_procedure_params(proc)

    raiz = params.get("raiz")
    assert isinstance(raiz, dict)
    assert "valor" in raiz
    assert "izquierda" in raiz
    assert "derecha" in raiz
    assert params.get("valor") == 1

    trace = executor.execute()
    calls = (trace.get("recursionTree") or {}).get("calls", [])
    assert len(calls) > 1
    assert len(calls) < executor.max_recursion_depth


@pytest.mark.unit
def test_map_procedure_params_uses_case_worst_for_default_array() -> None:
    source = """
mergeSort(A[n], inicio, fin) BEGIN
    IF (inicio < fin) THEN BEGIN
        medio <- (inicio + fin) / 2;
        CALL mergeSort(A, inicio, medio);
        CALL mergeSort(A, medio + 1, fin);
    END
END
"""
    executor, proc = _build_executor(source, input_size=4)
    params = executor._map_procedure_params(proc)
    assert params.get("A") == [4, 3, 2, 1]
    assert params.get("inicio") == 1
    assert params.get("fin") == 4


@pytest.mark.unit
def test_recursive_calls_keep_array_as_numeric_list_and_merge_sort_sorts() -> None:
    source = """
mergeSort(A[n], inicio, fin) BEGIN
    IF (inicio < fin) THEN BEGIN
        medio <- (inicio + fin) / 2;
        CALL mergeSort(A, inicio, medio);
        CALL mergeSort(A, medio + 1, fin);
        CALL mezclar(A, inicio, medio, fin);
    END
END

mezclar(A[n], inicio, medio, fin) BEGIN
    i <- inicio;
    j <- medio + 1;
    k <- 1;
    WHILE (i <= medio AND j <= fin) DO BEGIN
        IF (A[i] <= A[j]) THEN BEGIN
            temp[k] <- A[i];
            i <- i + 1;
        END
        ELSE BEGIN
            temp[k] <- A[j];
            j <- j + 1;
        END
        k <- k + 1;
    END
    WHILE (i <= medio) DO BEGIN
        temp[k] <- A[i];
        i <- i + 1;
        k <- k + 1;
    END
    WHILE (j <= fin) DO BEGIN
        temp[k] <- A[j];
        j <- j + 1;
        k <- k + 1;
    END
    FOR i <- 1 TO k - 1 DO BEGIN
        A[inicio + i - 1] <- temp[i];
    END
END
"""
    parsed = parse_source(source)
    assert parsed.get("ok") is True
    ast = parsed.get("ast")
    assert isinstance(ast, dict)
    executor = CodeExecutor(ast, input_size=4, case="worst")

    trace = executor.execute()
    calls = (trace.get("recursionTree") or {}).get("calls", [])
    assert len(calls) >= 1

    for call in calls:
        arr = (call.get("params") or {}).get("A")
        if arr is None:
            continue
        assert isinstance(arr, list)
        assert all(isinstance(x, int) for x in arr)

    steps = trace.get("steps", [])
    assert steps
    assert steps[-1].get("variables", {}).get("A") == "[1, 2, 3, 4]"


@pytest.mark.unit
def test_bitonic_sort_infers_ascending_flag_and_sorts() -> None:
    source = """
bitonicSort(A[n], inicio, fin, ascendente) BEGIN
    IF (fin - inicio <= 0) THEN BEGIN
        RETURN 0;
    END
    medio <- (inicio + fin) DIV 2;
    CALL bitonicSort(A, inicio, medio, true);
    CALL bitonicSort(A, medio + 1, fin, false);
    CALL bitonicMerge(A, inicio, fin, ascendente);
    RETURN 0;
END

bitonicMerge(A[n], inicio, fin, ascendente) BEGIN
    IF (fin - inicio <= 0) THEN BEGIN
        RETURN 0;
    END
    medio <- (inicio + fin) DIV 2;
    i <- inicio;
    WHILE (i <= medio) DO BEGIN
        CALL compareAndSwap(A, i, i + (medio - inicio + 1), ascendente);
        i <- i + 1;
    END
    CALL bitonicMerge(A, inicio, medio, ascendente);
    CALL bitonicMerge(A, medio + 1, fin, ascendente);
    RETURN 0;
END

compareAndSwap(A[n], i, j, ascendente) BEGIN
    temp <- 0;
    IF (ascendente = true) THEN BEGIN
        IF (A[i] > A[j]) THEN BEGIN
            temp <- A[i];
            A[i] <- A[j];
            A[j] <- temp;
        END
    END
    ELSE BEGIN
        IF (A[i] < A[j]) THEN BEGIN
            temp <- A[i];
            A[i] <- A[j];
            A[j] <- temp;
        END
    END
    RETURN 0;
END
"""
    parsed = parse_source(source)
    assert parsed.get("ok") is True
    ast = parsed.get("ast")
    assert isinstance(ast, dict)
    executor = CodeExecutor(
        ast, input_size=4, case="worst", initial_variables={"A": [4, 3, 2, 1]}
    )

    trace = executor.execute()
    steps = trace.get("steps", [])
    assert steps
    assert steps[-1].get("variables", {}).get("A") == "[1, 2, 3, 4]"
