"""System tests for deterministic loop invariant integration in /analyze/open."""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _analyze(source: str, mode: str = "all", locale: str = "en"):
    response = client.post(
        "/analyze/open",
        json={
            "source": source,
            "mode": mode,
            "locale": locale,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "ok" in data
    return data


def _assert_loop_invariant_shape(payload):
    assert "loopInvariant" in payload
    li = payload["loopInvariant"]
    assert "status" in li
    assert "reason" in li
    assert "selectedLoop" in li
    assert "invariant" in li
    assert "didacticSummary" in li
    assert "evidence" in li

    selected = li["selectedLoop"]
    assert {
        "nodeType",
        "lineStart",
        "lineEnd",
        "depth",
        "score",
        "patternType",
        "controlVariables",
        "stateVariables",
        "boundVariables",
        "collectionVariables",
        "targetVariables",
        "keyUpdates",
        "keyConditions",
    } <= set(selected.keys())

    sections = li["invariant"]
    assert sections["propertyStatement"]
    assert sections["initialization"]
    assert sections["maintenance"]
    assert sections["finalization"]


def test_mode_all_exposes_loop_invariant_only_top_level():
    source = """
scan(A[n], n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        x <- A[i];
    END
END
"""
    data = _analyze(source, mode="all", locale="en")

    assert data["ok"] is True
    _assert_loop_invariant_shape(data)
    assert "worst" in data
    assert "best" in data
    assert "loopInvariant" not in data["worst"]


@pytest.mark.parametrize(
    "name,source,expected_patterns,expected_node_type",
    [
        (
            "sum_array",
            """
sumArray(A[n], n) BEGIN
    sum <- 0;
    FOR i <- 1 TO n DO BEGIN
        sum <- sum + A[i];
    END
    RETURN sum;
END
""",
            {"accumulation", "traversal"},
            "FOR",
        ),
        (
            "product_array",
            """
prodArray(A[n], n) BEGIN
    prod <- 1;
    FOR i <- 1 TO n DO BEGIN
        prod <- prod * A[i];
    END
    RETURN prod;
END
""",
            {"accumulation"},
            "FOR",
        ),
        (
            "search_for",
            """
linearSearchFor(A[n], n, x) BEGIN
    FOR i <- 1 TO n DO BEGIN
        IF (A[i] = x) THEN BEGIN
            RETURN i;
        END
    END
    RETURN -1;
END
""",
            {"search"},
            "FOR",
        ),
        (
            "search_while",
            """
linearSearchWhile(A[n], n, x) BEGIN
    i <- 1;
    WHILE (i <= n) DO BEGIN
        IF (A[i] = x) THEN BEGIN
            RETURN i;
        END
        i <- i + 1;
    END
    RETURN -1;
END
""",
            {"search"},
            "WHILE",
        ),
        (
            "search_flag",
            """
linearSearchFlag(A[n], n, x) BEGIN
    found <- false;
    FOR i <- 1 TO n DO BEGIN
        IF (A[i] = x) THEN BEGIN
            found <- true;
        END
    END
    RETURN found;
END
""",
            {"search"},
            "FOR",
        ),
        (
            "counting",
            """
countPos(A[n], n) BEGIN
    count <- 0;
    FOR i <- 1 TO n DO BEGIN
        IF (A[i] > 0) THEN BEGIN
            count <- count + 1;
        END
    END
    RETURN count;
END
""",
            {"counting", "accumulation"},
            "FOR",
        ),
        (
            "extrema",
            """
minArray(A[n], n) BEGIN
    minVal <- A[1];
    FOR i <- 2 TO n DO BEGIN
        IF (A[i] < minVal) THEN BEGIN
            minVal <- A[i];
        END
    END
    RETURN minVal;
END
""",
            {"extrema"},
            "FOR",
        ),
        (
            "sorting_pass",
            """
bubblePass(A[n], n) BEGIN
    FOR j <- 1 TO n - 1 DO BEGIN
        IF (A[j] > A[j + 1]) THEN BEGIN
            temp <- A[j];
            A[j] <- A[j + 1];
            A[j + 1] <- temp;
        END
    END
END
""",
            {"sorting_pass"},
            "FOR",
        ),
        (
            "array_copy",
            """
copyArray(A[n], B[n], n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        B[i] <- A[i];
    END
END
""",
            {"prefix_progress", "traversal"},
            "FOR",
        ),
        (
            "prefix_sum",
            """
prefixSums(A[n], P[n], n) BEGIN
    P[1] <- A[1];
    FOR i <- 2 TO n DO BEGIN
        P[i] <- P[i - 1] + A[i];
    END
END
""",
            {"prefix_progress", "accumulation"},
            "FOR",
        ),
        (
            "binary_search_iterative",
            """
binarySearch(A[n], n, x) BEGIN
    low <- 1;
    high <- n;
    WHILE (low <= high) DO BEGIN
        mid <- (low + high) / 2;
        IF (A[mid] = x) THEN BEGIN
            RETURN mid;
        END
        IF (A[mid] < x) THEN BEGIN
            low <- mid + 1;
        END
        ELSE BEGIN
            high <- mid - 1;
        END
    END
    RETURN -1;
END
""",
            {"binary_search_interval"},
            "WHILE",
        ),
        (
            "euclidean_gcd",
            """
mcd(a, b) BEGIN
    WHILE (b != 0) DO BEGIN
        temp <- b;
        b <- a MOD b;
        a <- temp;
    END
    RETURN a;
END
""",
            {"euclidean_gcd"},
            "WHILE",
        ),
        (
            "quicksort_partition",
            """
particionar(A[n], inicio, fin) BEGIN
    pivote <- A[fin];
    i <- inicio - 1;
    FOR j <- inicio TO fin - 1 DO BEGIN
        IF (A[j] <= pivote) THEN BEGIN
            i <- i + 1;
            temp <- A[i];
            A[i] <- A[j];
            A[j] <- temp;
        END
    END
    temp <- A[i + 1];
    A[i + 1] <- A[fin];
    A[fin] <- temp;
    RETURN i + 1;
END
""",
            {"partition_by_pivot"},
            "FOR",
        ),
        (
            "merge_progress",
            """
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
END
""",
            {"merge_progress"},
            "WHILE",
        ),
        (
            "insertion_prefix_sorted",
            """
insertionSort(arr, n) BEGIN
  FOR i <- 2 TO n DO BEGIN
    key <- arr[i];
    j <- i - 1;
    WHILE (j >= 1 AND arr[j] > key) DO BEGIN
      arr[j + 1] <- arr[j];
      j <- j - 1;
    END
    arr[j + 1] <- key;
  END
END
""",
            {"insertion_prefix_sorted"},
            "FOR",
        ),
        (
            "selection_prefix_sorted",
            """
selectionSort(A, n) BEGIN
  FOR i <- 1 TO n - 1 DO BEGIN
    min_idx <- i;
    FOR j <- i + 1 TO n DO BEGIN
      IF (A[j] < A[min_idx]) THEN BEGIN
        min_idx <- j;
      END
    END
    IF (min_idx != i) THEN BEGIN
      temp <- A[i];
      A[i] <- A[min_idx];
      A[min_idx] <- temp;
    END
  END
END
""",
            {"selection_prefix_sorted"},
            "FOR",
        ),
        (
            "loop_progress_only",
            """
linear(n) BEGIN
  i <- 0;
  WHILE (i < n) DO BEGIN
    x <- 1;
    i <- i + 1;
  END
END
""",
            {"loop_progress_only"},
            "WHILE",
        ),
        (
            "two_pointer_reverse",
            """
reverse(A[n], n) BEGIN
    left <- 1;
    right <- n;
    WHILE (left < right) DO BEGIN
        temp <- A[left];
        A[left] <- A[right];
        A[right] <- temp;
        left <- left + 1;
        right <- right - 1;
    END
END
""",
            {"two_pointer_like", "sorting_pass"},
            "WHILE",
        ),
        (
            "repeat_until",
            """
repeatSearch(A[n], n, x) BEGIN
    i <- 1;
    REPEAT
        IF (A[i] = x) THEN BEGIN
            RETURN i;
        END
        i <- i + 1;
    UNTIL (i > n);
    RETURN -1;
END
""",
            {"search", "state_refinement", "unknown"},
            "REPEAT",
        ),
        (
            "renamed_linear_search",
            """
lookupOdd(_rack_77[n_lim], n_lim, needle_5) BEGIN
    FOR zzCursor_3 <- 1 TO n_lim DO BEGIN
        IF (_rack_77[zzCursor_3] = needle_5) THEN BEGIN
            RETURN zzCursor_3;
        END
    END
    RETURN -1;
END
""",
            {"search"},
            "FOR",
        ),
        (
            "renamed_extrema_without_name_hints",
            """
peakOdd(zset_7[nn], nn) BEGIN
    z_88 <- zset_7[1];
    FOR probe_4 <- 2 TO nn DO BEGIN
        IF (zset_7[probe_4] > z_88) THEN BEGIN
            z_88 <- zset_7[probe_4];
        END
    END
    RETURN z_88;
END
""",
            {"extrema"},
            "FOR",
        ),
        (
            "renamed_field_assignment",
            """
markScore(rec_7[nn], nn) BEGIN
  FOR it_2 <- 1 TO nn DO BEGIN
    IF (rec_7[it_2].grade_4 >= 3) THEN BEGIN
      rec_7[it_2].ok_1 <- 1;
    END
    ELSE BEGIN
      rec_7[it_2].ok_1 <- 0;
    END
  END
END
""",
            {"field_assignment_progress"},
            "FOR",
        ),
    ],
)
def test_loop_invariant_representative_cases(
    name, source, expected_patterns, expected_node_type
):
    data = _analyze(source, mode="all", locale="en")

    assert data["ok"] is True, name
    _assert_loop_invariant_shape(data)

    loop_invariant = data["loopInvariant"]
    selected = loop_invariant["selectedLoop"]

    assert selected["nodeType"] == expected_node_type, name
    assert selected["patternType"] in expected_patterns, (name, selected["patternType"])


def test_nested_loops_select_single_deterministic_loop():
    source = """
nestedMain(A[n], n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        FOR j <- 1 TO n DO BEGIN
            x <- A[j];
        END
    END
END
"""
    first = _analyze(source, mode="all", locale="en")
    second = _analyze(source, mode="all", locale="en")

    first_sel = first["loopInvariant"]["selectedLoop"]
    second_sel = second["loopInvariant"]["selectedLoop"]

    assert first_sel == second_sel
    assert first_sel["nodeType"] == "FOR"
    assert first_sel["lineStart"] in {2, 3}


def test_insufficient_evidence_keeps_shape_and_low_confidence():
    source = """
unclear(n) BEGIN
    WHILE (n > 0) DO BEGIN
        x <- 1;
    END
END
"""
    data = _analyze(source, mode="all", locale="en")

    _assert_loop_invariant_shape(data)
    assert data["loopInvariant"]["status"] in {"low_confidence", "unavailable"}


def test_stability_same_input_same_selected_loop_and_text():
    source = """
acc(A[n], n) BEGIN
    sum <- 0;
    FOR i <- 1 TO n DO BEGIN
        sum <- sum + A[i];
    END
    RETURN sum;
END
"""
    first = _analyze(source, mode="all", locale="es")
    second = _analyze(source, mode="all", locale="es")

    first_li = first["loopInvariant"]
    second_li = second["loopInvariant"]

    assert first_li["selectedLoop"] == second_li["selectedLoop"]
    assert first_li["invariant"] == second_li["invariant"]
    assert first_li["didacticSummary"] == second_li["didacticSummary"]


def test_factorial_iterative_avoids_array_wording_in_invariant():
    source = """
factorialIter(n) BEGIN
    result <- 1;
    FOR k <- 1 TO n DO BEGIN
        result <- result * k;
    END
    RETURN result;
END
"""
    data = _analyze(source, mode="all", locale="es")

    _assert_loop_invariant_shape(data)
    li = data["loopInvariant"]

    assert li["selectedLoop"]["patternType"] == "accumulation"
    assert "A[" not in li["invariant"]["propertyStatement"]
    assert "A[" not in li["invariant"]["maintenance"]


def test_multi_accumulator_nested_conflict_without_collection_avoids_default_array_wording():
    source = """
nestedConflict(R[n], n, m) BEGIN
  FOR i <- 1 TO n DO BEGIN
    x <- i;
  END

  sum <- 0;
  product <- 1;
  FOR j <- 1 TO m DO BEGIN
    sum <- sum + j;
    product <- product * j;
  END

  RETURN sum;
END
"""
    data = _analyze(source, mode="all", locale="es")

    _assert_loop_invariant_shape(data)
    li = data["loopInvariant"]

    assert li["selectedLoop"]["patternType"] == "accumulation"
    assert li["evidence"]["templateVariant"] == "multi_accumulator_ambiguous"
    assert li["selectedLoop"]["controlVariables"] == ["j"]
    assert li["selectedLoop"]["collectionVariables"] == []

    invariant = li["invariant"]
    assert "A[" not in invariant["propertyStatement"]
    assert "A[" not in invariant["initialization"]
    assert "A[" not in invariant["maintenance"]
    assert "A[" not in invariant["finalization"]
    assert "1..m" in invariant["finalization"]
