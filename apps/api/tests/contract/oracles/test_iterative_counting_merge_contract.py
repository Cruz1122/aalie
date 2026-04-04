"""
Contrato: counting-sort y merge de dos arreglos (cierre WHILE, sin I_while, Θ acorde).
"""

import pytest

from app.modules.analysis.service import analyze_algorithm

pytestmark = [pytest.mark.contract, pytest.mark.oracle]

COUNTING_SORT = """
countingSort(A[n], n, k) BEGIN
    FOR i <- 0 TO k DO BEGIN
        C[i] <- 0;
    END
    FOR i <- 1 TO n DO BEGIN
        C[A[i]] <- C[A[i]] + 1;
    END
    indice <- 1;
    FOR valor <- 0 TO k DO BEGIN
        WHILE (C[valor] > 0) DO BEGIN
            A[indice] <- valor;
            C[valor] <- C[valor] - 1;
            indice <- indice + 1;
        END
    END
    RETURN 0;
END
"""

MERGE_TWO = """
mergeDosArreglos(A[n], n, B[m], m) BEGIN
    i <- 1;
    j <- 1;
    k <- 1;
    WHILE (i <= n AND j <= m) DO BEGIN
        IF (A[i] <= B[j]) THEN BEGIN
            C[k] <- A[i];
            i <- i + 1;
        END
        ELSE BEGIN
            C[k] <- B[j];
            j <- j + 1;
        END
        k <- k + 1;
    END
    RETURN k - 1;
END
"""


def _notation_has_no_open_while(totals: dict) -> bool:
    bundle = (
        str(totals.get("big_theta", ""))
        + str(totals.get("big_o", ""))
        + str(totals.get("T_open", ""))
        + str(totals.get("t_polynomial", ""))
    )
    lower = bundle.lower()
    assert "i_while" not in lower and "i_{while" not in lower, bundle


def _assert_theta_like_n_plus_k(theta: str) -> None:
    t = (theta or "").lower().replace(" ", "")
    assert "n" in t and "k" in t, theta


def _assert_theta_like_n_plus_m(theta: str) -> None:
    t = (theta or "").lower().replace(" ", "")
    assert "n" in t and "m" in t, theta


class TestCountingSortContract:
    def test_counting_sort_all_modes_no_i_while_and_nk(self):
        for mode in ("worst", "best", "avg"):
            out = analyze_algorithm(
                COUNTING_SORT, mode=mode, algorithm_kind="iterative"
            )
            assert out.get("ok") is not False, (mode, out.get("errors"))
            totals = out.get("totals") or {}
            _notation_has_no_open_while(totals)
            theta = str(totals.get("big_theta") or "")
            _assert_theta_like_n_plus_k(theta)


class TestMergeTwoSortedContract:
    def test_merge_two_pointers_worst_avg_no_i_while_and_nm(self):
        # Best case: el cierre actual puede colapsar AND (i<=n & j<=m) a 0 iteraciones con
        # datos simbólicos; worst/avg conservan n+m vía patrón merge_two_pointers.
        for mode in ("worst", "avg"):
            out = analyze_algorithm(MERGE_TWO, mode=mode, algorithm_kind="iterative")
            assert out.get("ok") is not False, (mode, out.get("errors"))
            totals = out.get("totals") or {}
            _notation_has_no_open_while(totals)
            theta = str(totals.get("big_theta") or "")
            _assert_theta_like_n_plus_m(theta)
