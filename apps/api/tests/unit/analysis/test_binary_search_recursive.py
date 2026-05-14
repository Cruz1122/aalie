from app.modules.analysis.recursive_invariants import generate_recursive_invariant
from app.modules.analysis.recursive_invariants.extractor import extract_recursive_facts


def test_binary_search_classification_and_base_result():
    """Binary search should be classified as divide-and-conquer (mutually exclusive branches)
    and base result should be the literal returned in the base case (e.g., -1)."""

    ast = {
        "type": "Program",
        "body": [
            {
                "type": "ProcDef",
                "name": "busquedaBinaria",
                "params": [
                    {"name": "A"},
                    {"name": "x"},
                    {"name": "inicio"},
                    {"name": "fin"},
                ],
                "body": [
                    {
                        "type": "If",
                        "test": {
                            "type": "Binary",
                            "op": ">",
                            "left": {"type": "Identifier", "name": "inicio"},
                            "right": {"type": "Identifier", "name": "fin"},
                        },
                        "consequent": [
                            {"type": "Return", "value": {"type": "Literal", "value": -1}}
                        ],
                        "alternate": [],
                    },
                    {
                        "type": "Assign",
                        "left": {"type": "Identifier", "name": "mitad"},
                        "right": {
                            "type": "Binary",
                            "op": "/",
                            "left": {"type": "Binary", "op": "+", "left": {"type": "Identifier", "name": "inicio"}, "right": {"type": "Identifier", "name": "fin"}},
                            "right": {"type": "Literal", "value": 2},
                        },
                    },
                    {
                        "type": "If",
                        "test": {"type": "Binary", "op": "=", "left": {"type": "Identifier", "name": "A[mitad]"}, "right": {"type": "Identifier", "name": "x"}},
                        "consequent": [{"type": "Return", "value": {"type": "Identifier", "name": "mitad"}}],
                        "alternate": [
                            {
                                "type": "If",
                                "test": {"type": "Binary", "op": "<", "left": {"type": "Identifier", "name": "x"}, "right": {"type": "Identifier", "name": "A[mitad]"}},
                                "consequent": [
                                    {"type": "Return", "value": {"type": "Call", "func": {"type": "Identifier", "name": "busquedaBinaria"}, "args": [
                                        {"type": "Identifier", "name": "A"},
                                        {"type": "Identifier", "name": "x"},
                                        {"type": "Identifier", "name": "inicio"},
                                        {"type": "Binary", "op": "-", "left": {"type": "Identifier", "name": "mitad"}, "right": {"type": "Literal", "value": 1}}
                                    ]}}
                                ],
                                "alternate": [
                                    {"type": "Return", "value": {"type": "Call", "func": {"type": "Identifier", "name": "busquedaBinaria"}, "args": [
                                        {"type": "Identifier", "name": "A"},
                                        {"type": "Identifier", "name": "x"},
                                        {"type": "Binary", "op": "+", "left": {"type": "Identifier", "name": "mitad"}, "right": {"type": "Literal", "value": 1}},
                                        {"type": "Identifier", "name": "fin"}
                                    ]}}
                                ],
                            }
                        ],
                    },
                ],
            }
        ],
    }

    facts = extract_recursive_facts(ast)
    assert facts.has_recursive_calls, "Should detect recursive calls"
    assert facts.recursive_call_count == 2, "Should detect two recursive call sites"
    assert facts.calls_are_mutually_exclusive, "Calls should be marked mutually exclusive"

    invariant = generate_recursive_invariant(ast=ast, locale="es")
    assert invariant["evidence"]["recursionType"] in ["divide_conquer", "multiple_recursive"]
    # Prefer divide_conquer for mutually exclusive branches
    assert invariant["evidence"]["recursionType"] == "divide_conquer"
    # Base result should reflect the literal -1
    assert facts.base_results and facts.base_results[0] == "return -1"

    print('\n✓ Binary search classified as divide-and-conquer and base result correct')


def test_binary_search_with_tail_return_branch_is_single_path_divide_conquer():
    """Binary search style with one recursive call in an if-branch and one tail return
    must still be treated as one recursive subproblem per execution path."""

    ast = {
        "type": "Program",
        "body": [
            {
                "type": "ProcDef",
                "name": "binarySearchRec",
                "params": [
                    {"name": "A"},
                    {"name": "x"},
                    {"name": "inicio"},
                    {"name": "fin"},
                ],
                "body": [
                    {
                        "type": "If",
                        "test": {
                            "type": "Binary",
                            "op": ">",
                            "left": {"type": "Identifier", "name": "inicio"},
                            "right": {"type": "Identifier", "name": "fin"},
                        },
                        "consequent": [
                            {"type": "Return", "value": {"type": "Literal", "value": -1}}
                        ],
                        "alternate": [],
                    },
                    {
                        "type": "If",
                        "test": {
                            "type": "Binary",
                            "op": "<",
                            "left": {"type": "Identifier", "name": "x"},
                            "right": {"type": "Identifier", "name": "A[medio]"},
                        },
                        "consequent": [
                            {
                                "type": "Return",
                                "value": {
                                    "type": "Call",
                                    "func": {
                                        "type": "Identifier",
                                        "name": "binarySearchRec",
                                    },
                                    "args": [
                                        {"type": "Identifier", "name": "A"},
                                        {"type": "Identifier", "name": "x"},
                                        {"type": "Identifier", "name": "inicio"},
                                        {
                                            "type": "Binary",
                                            "op": "-",
                                            "left": {"type": "Identifier", "name": "medio"},
                                            "right": {"type": "Literal", "value": 1},
                                        },
                                    ],
                                },
                            }
                        ],
                        "alternate": [],
                    },
                    {
                        "type": "Return",
                        "value": {
                            "type": "Call",
                            "func": {"type": "Identifier", "name": "binarySearchRec"},
                            "args": [
                                {"type": "Identifier", "name": "A"},
                                {"type": "Identifier", "name": "x"},
                                {
                                    "type": "Binary",
                                    "op": "+",
                                    "left": {"type": "Identifier", "name": "medio"},
                                    "right": {"type": "Literal", "value": 1},
                                },
                                {"type": "Identifier", "name": "fin"},
                            ],
                        },
                    },
                ],
            }
        ],
    }

    facts = extract_recursive_facts(ast)
    assert facts.recursive_call_count == 2
    assert facts.max_recursive_calls_per_path == 1
    assert facts.subproblems_per_call == 1

    invariant = generate_recursive_invariant(ast=ast, locale="es")
    assert invariant["evidence"]["recursionType"] == "divide_conquer"
    assert "logar" in invariant["didacticSummary"].lower()

    print("\n✓ Tail-return binary search stays single-branch divide-and-conquer")
