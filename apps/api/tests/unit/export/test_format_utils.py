import pytest

from app.modules.export.format_utils import (
    build_status_block,
    ensure_sentence,
    escape_latex_text,
    is_likely_math_expression,
    is_narrative_equation,
    is_narrative_sentence,
    is_technical_token,
    localize,
    localize_status_label,
    localize_todos,
    maybe_list,
    normalize_latex_math_expression,
    normalize_recursive_formula,
    pick_case_complexity,
    render_latex_cell_value,
    render_latex_text_with_embedded_math,
    render_latex_text_with_inline_math,
    safe,
    strip_outer_math_delimiters,
    to_markdown_inline_math,
    to_markdown_text_with_inline_math,
)
from app.modules.export.i18n import get_export_i18n

pytestmark = [pytest.mark.unit, pytest.mark.fast, pytest.mark.export]


def test_general_helpers_cover_branches():
    i18n_es = get_export_i18n("es")
    i18n_en = get_export_i18n("en")

    assert localize(i18n_es, "hola", "hello") == "hola"
    assert localize(i18n_en, "hola", "hello") == "hello"

    assert safe("  x  ", "fallback") == "x"
    assert safe("", "fallback") == "fallback"
    assert safe(10, "fallback") == "10"
    assert safe(None, "fallback") == "fallback"

    class _BadString:
        def __str__(self) -> str:
            raise RuntimeError("boom")

    assert safe(_BadString(), "fallback") == "fallback"
    assert maybe_list([" a ", "", None, "b"]) == ["a", "b"]


def test_recursive_formula_normalization_and_sentence_helpers():
    assert normalize_recursive_formula(None) is None

    dominant = (
        r"\text{Trabajo en raíz } n " r"\\ " r"\text{Trabajo en hojas (} n^2 \text{)}"
    )
    normalized_dominant = normalize_recursive_formula(dominant)
    assert "Trabajo en raíz:" in normalized_dominant
    assert "Trabajo en hojas:" in normalized_dominant

    formula_es = r"\text{Cada nivel tiene costo } n \\ \text{Total }= n \log n"
    assert "\\quad" in normalize_recursive_formula(formula_es)

    formula_en = r"\text{Each level has cost } n \\ \text{Total }= n \log n"
    assert "\\quad" in normalize_recursive_formula(formula_en)
    assert normalize_recursive_formula("sin cambios") == "sin cambios"

    assert ensure_sentence("texto") == "texto."
    assert ensure_sentence("texto!") == "texto!"
    assert ensure_sentence("  ") == ""


def test_status_and_case_helpers():
    i18n = get_export_i18n("en")
    snapshot = {
        "globalResult": {
            "cases": {
                "worst": {
                    "big_theta": "Theta(n)",
                }
            }
        }
    }

    assert pick_case_complexity(snapshot, "worst") == "Theta(n)"
    assert pick_case_complexity({}, "worst") == ""

    assert localize_status_label("recursive.recurrence", i18n) == "Recurrence"
    assert localize_status_label("unknown.label", i18n) == "unknown.label"

    todos = localize_todos(
        [
            "Normalized pseudocode serialization is not implemented.",
            "Loop invariant extraction is not implemented.",
            "Full symbolic recurrence tree reconstruction is not implemented.",
            "custom",
        ],
        i18n,
    )
    assert todos[0] == "Normalized pseudocode serialization is not implemented."
    assert todos[1] == "Loop invariant extraction is not implemented."
    assert (
        todos[2] == "Full symbolic recurrence tree reconstruction is not implemented."
    )
    assert todos[3] == "custom"

    assert (
        build_status_block("recursive.recurrence", {"status": "available"}, i18n)
        is None
    )
    status_block = build_status_block(
        "recursive.recurrence",
        {"status": "missing_data", "todos": ["custom"]},
        i18n,
    )
    assert status_block["status"]["status"] == "missing_data"


def test_math_and_token_detection_helpers():
    assert is_narrative_sentence("Este texto describe tres palabras") is True
    assert is_narrative_sentence(r"T(n)=n") is False
    assert is_narrative_sentence("Theta(n) crece") is False
    assert is_narrative_sentence("valor x_{1} grande") is False
    assert is_narrative_equation("La complejidad = lineal") is True
    assert is_narrative_equation(r"T(n)=n") is False
    assert is_narrative_equation(r"\Theta(n) = n") is False
    assert is_narrative_equation("x_1 = valor") is False

    assert is_likely_math_expression("") is False
    assert is_likely_math_expression("Este texto describe tres palabras") is False
    assert is_likely_math_expression(r"\Theta(n)") is True
    assert is_likely_math_expression("x + y") is True
    assert is_likely_math_expression("x_{1}") is True
    assert is_likely_math_expression("a/2") is True
    assert is_likely_math_expression("texto normal") is False

    assert is_technical_token("node_id") is True
    assert is_technical_token("node_id&bad") is False
    assert is_technical_token(r"\Theta_node") is False
    assert is_technical_token("bad token") is False


def test_markdown_and_latex_text_helpers_more_paths():
    assert to_markdown_inline_math("") == ""
    assert to_markdown_inline_math("x + y") == "$x + y$"
    assert to_markdown_inline_math("$x+y$") == "$x+y$"
    assert to_markdown_inline_math("texto") == "texto"

    assert to_markdown_text_with_inline_math("Costo: x + y") == "Costo: $x + y$"
    assert to_markdown_text_with_inline_math("x + y") == "$x + y$"
    assert to_markdown_text_with_inline_math("texto normal") == "texto normal"
    assert to_markdown_text_with_inline_math("") == ""
    assert (
        to_markdown_text_with_inline_math("texto; con punto y coma")
        == "texto; con punto y coma"
    )

    escaped = escape_latex_text(r"a_b & c%")
    assert r"\_" in escaped and r"\&" in escaped and r"\%" in escaped

    assert strip_outer_math_delimiters(r"$x$") == "x"
    assert strip_outer_math_delimiters(r"\(x\)") == "x"
    assert strip_outer_math_delimiters(r"\[x\]") == "x"

    assert render_latex_text_with_inline_math("Texto: x + y") == "Texto: $x + y$"
    assert render_latex_text_with_inline_math("texto; narrativo") == "texto; narrativo"
    assert render_latex_text_with_inline_math(r"$\Theta(n)$") == r"$\Theta(n)$"

    assert render_latex_text_with_embedded_math("texto plano") == "texto plano"
    assert render_latex_text_with_embedded_math(r"$x$") == r"$x$"
    assert render_latex_text_with_embedded_math(r"A \[x+y\] B") == r"A \[x+y\] B"
    assert render_latex_cell_value("") == ""
    assert render_latex_cell_value("narrativa = clara") == "narrativa = clara"
    assert render_latex_cell_value("node_id") == r"\texttt{\detokenize{node_id}}"
    assert render_latex_cell_value("texto normal") == "texto normal"


def test_normalize_latex_math_expression_strips_outer_math_delimiters():
    assert normalize_latex_math_expression(r"$\Theta(n)$") == r"\Theta(n)"
    assert normalize_latex_math_expression(r"\(n_1 + n_2\)") == r"n_{1} + n_{2}"
    assert (
        normalize_latex_math_expression(r"\Theta(\\log{\left(n \right)})")
        == r"\Theta(\log{\left(n \right)})"
    )


def test_render_latex_cell_value_preserves_pre_wrapped_math():
    assert render_latex_cell_value(r"$\Theta(n)$") == r"$\Theta(n)$"
    assert render_latex_cell_value(r"value: $\Theta(n)$") == r"value: $\Theta(n)$"
    assert (
        render_latex_cell_value(r"\Theta(\\log{\left(n \right)})")
        == r"$\Theta(\log{\left(n \right)})$"
    )


def test_render_latex_text_with_inline_math_preserves_embedded_math():
    assert (
        render_latex_text_with_inline_math(r"Complejidad final: $\Theta(n \log n)$")
        == r"Complejidad final: $\Theta(n \log n)$"
    )


def test_render_latex_text_with_embedded_math_converts_parenthesized_latex():
    text = (
        r"A partir de \(T(n) = 4 \cdot n^{2} + 11 \cdot n + 6\), "
        r"queda gobernada por \(n^{2}\)."
    )
    assert (
        render_latex_text_with_embedded_math(text)
        == r"A partir de $T(n) = 4 \cdot n^{2} + 11 \cdot n + 6$, queda gobernada por $n^{2}$."
    )


def test_to_markdown_text_with_inline_math_converts_parenthesized_latex():
    text = (
        r"A partir de \(T(n) = 4 \cdot n^{2} + 11 \cdot n + 6\), "
        r"queda gobernada por \(n^{2}\)."
    )
    assert (
        to_markdown_text_with_inline_math(text)
        == r"A partir de $T(n) = 4 \cdot n^{2} + 11 \cdot n + 6$, queda gobernada por $n^{2}$."
    )
