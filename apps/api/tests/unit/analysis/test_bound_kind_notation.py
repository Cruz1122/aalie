#!/usr/bin/env python3
"""
Test para verificar que la notación asintótica se convierte correctamente
basada en bound_kind en los step-by-step bundles.
"""

from app.modules.analysis.analyzers.recursive import RecursiveAnalyzer


def build_fibonacci_ast():
    return {
        "type": "Program",
        "body": [
            {
                "type": "ProcDef",
                "name": "fibonacci",
                "params": [{"name": "n"}],
                "body": [
                    {
                        "type": "If",
                        "test": {
                            "type": "Binary",
                            "op": "<=",
                            "left": {"type": "Identifier", "name": "n"},
                            "right": {"type": "Literal", "value": 1},
                        },
                        "consequent": [
                            {"type": "Return", "value": {"type": "Literal", "value": 1}}
                        ],
                        "alternate": [],
                    },
                    {
                        "type": "Return",
                        "value": {
                            "type": "Binary",
                            "op": "+",
                            "left": {
                                "type": "Call",
                                "func": {"type": "Identifier", "name": "fibonacci"},
                                "args": [
                                    {
                                        "type": "Binary",
                                        "op": "-",
                                        "left": {"type": "Identifier", "name": "n"},
                                        "right": {"type": "Literal", "value": 1},
                                    }
                                ],
                            },
                            "right": {
                                "type": "Call",
                                "func": {"type": "Identifier", "name": "fibonacci"},
                                "args": [
                                    {
                                        "type": "Binary",
                                        "op": "-",
                                        "left": {"type": "Identifier", "name": "n"},
                                        "right": {"type": "Literal", "value": 2},
                                    }
                                ],
                            },
                        },
                    },
                ],
            }
        ],
    }


def test_fibonacci_recursion_tree_uses_big_o_notation():
    """
    Verifica que recursion_tree para Fibonacci usa O(φⁿ) y no Θ(φⁿ).
    Esto es porque recursion_tree para linear_shift tiene bound_kind="upper".
    """
    analyzer = RecursiveAnalyzer(locale="es")
    ast = build_fibonacci_ast()

    analyze_result = analyzer.analyze(ast, preferred_method="recursion_tree")
    assert analyze_result["ok"], f"Analyze error: {analyze_result.get('errors', [])}"

    step_bundle = analyze_result.get("recursion_tree", {}).get("step_by_step")
    assert step_bundle is not None, "No step_by_step bundle found"

    steps = step_bundle.get("steps", [])
    asymptotic_step = next((step for step in steps if step.get("step_id") == "rt_s11"), None)

    assert asymptotic_step is not None, "No asymptotic conclusion step found"

    primary_latex = asymptotic_step.get("primary_latex", "")
    payload = asymptotic_step.get("payload", {})
    asymptotic_result = payload.get("asymptoticResult", "")

    assert "O(" in primary_latex or "O(" in asymptotic_result, (
        f"Expected O notation but got: primary_latex={primary_latex}, asymptotic_result={asymptotic_result}"
    )
    assert "\\Theta(" not in primary_latex and "\\Theta(" not in asymptotic_result, (
        f"Should not have Θ notation but got: primary_latex={primary_latex}, asymptotic_result={asymptotic_result}"
    )


def test_fibonacci_characteristic_equation_uses_theta_notation():
    """
    Verifica que characteristic_equation para Fibonacci usa Θ(φⁿ).
    Esto es porque characteristic_equation tiene bound_kind="equivalent".
    """
    analyzer = RecursiveAnalyzer(locale="es")
    ast = build_fibonacci_ast()

    analyze_result = analyzer.analyze(ast, preferred_method="characteristic_equation")
    assert analyze_result["ok"], f"Analyze error: {analyze_result.get('errors', [])}"

    step_bundle = analyze_result.get("characteristic_equation", {}).get("step_by_step")
    assert step_bundle is not None, "No step_by_step bundle found"

    steps = step_bundle.get("steps", [])
    asymptotic_step = next((step for step in steps if step.get("step_id") == "ceq_s12"), None)

    assert asymptotic_step is not None, "No asymptotic conclusion step found"

    primary_latex = asymptotic_step.get("primary_latex", "")
    payload = asymptotic_step.get("payload", {})
    theta = payload.get("theta", "")

    assert "\\Theta(" in primary_latex or "\\Theta(" in theta, (
        f"Expected Θ notation but got: primary_latex={primary_latex}, theta={theta}"
    )


if __name__ == "__main__":
    print("Testing bound_kind notation conversion...\n")

    try:
        test_fibonacci_recursion_tree_uses_big_o_notation()
        test_fibonacci_characteristic_equation_uses_theta_notation()
        print("✅ All tests passed!")
    except AssertionError as e:
        print(f"❌ Test failed: {e}")
        exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback

        traceback.print_exc()
        exit(1)
