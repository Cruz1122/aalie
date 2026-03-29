from app.modules.export.format_utils import (
    normalize_latex_math_expression,
    render_latex_cell_value,
    render_latex_text_with_embedded_math,
    render_latex_text_with_inline_math,
    to_markdown_text_with_inline_math,
)


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
