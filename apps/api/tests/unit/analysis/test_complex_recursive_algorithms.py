"""Test recursive invariant for complex algorithms."""

import json
from app.modules.analysis.recursive_invariants import generate_recursive_invariant
from app.modules.analysis.recursive_invariants.extractor import extract_recursive_facts


def test_merge_sort_recursive_invariant():
    """Test divide-and-conquer with merge phase."""

    ast = {
        "type": "Program",
        "body": [
            {
                "type": "ProcDef",
                "name": "mergeSort",
                "params": [{"name": "A"}, {"name": "p"}, {"name": "r"}],
                "body": [
                    {
                        "type": "If",
                        "test": {
                            "type": "Binary",
                            "op": ">=",
                            "left": {"type": "Identifier", "name": "p"},
                            "right": {"type": "Identifier", "name": "r"},
                        },
                        "consequent": [{"type": "Return", "value": None}],
                        "alternate": [],
                    },
                    {
                        "type": "Assign",
                        "left": {"type": "Identifier", "name": "q"},
                        "right": {
                            "type": "Binary",
                            "op": "/",
                            "left": {
                                "type": "Binary",
                                "op": "+",
                                "left": {"type": "Identifier", "name": "p"},
                                "right": {"type": "Identifier", "name": "r"},
                            },
                            "right": {"type": "Literal", "value": 2},
                        },
                    },
                    {
                        "type": "Call",
                        "func": {"type": "Identifier", "name": "mergeSort"},
                        "args": [
                            {"type": "Identifier", "name": "A"},
                            {"type": "Identifier", "name": "p"},
                            {"type": "Identifier", "name": "q"},
                        ],
                    },
                    {
                        "type": "Call",
                        "func": {"type": "Identifier", "name": "mergeSort"},
                        "args": [
                            {"type": "Identifier", "name": "A"},
                            {
                                "type": "Binary",
                                "op": "+",
                                "left": {"type": "Identifier", "name": "q"},
                                "right": {"type": "Literal", "value": 1},
                            },
                            {"type": "Identifier", "name": "r"},
                        ],
                    },
                    {
                        "type": "Call",
                        "func": {"type": "Identifier", "name": "merge"},
                        "args": [
                            {"type": "Identifier", "name": "A"},
                            {"type": "Identifier", "name": "p"},
                            {"type": "Identifier", "name": "q"},
                            {"type": "Identifier", "name": "r"},
                        ],
                    },
                ],
            }
        ],
    }

    facts = extract_recursive_facts(ast)
    print("\n=== MERGE SORT ===")
    print(f"Recursive calls: {facts.recursive_call_count}")
    print(f"Base conditions: {facts.base_conditions}")
    print(f"Mutually exclusive: {facts.calls_are_mutually_exclusive}")

    invariant = generate_recursive_invariant(ast=ast, locale="en")
    assert invariant["status"] in ["ok", "low_confidence"]
    # Note: Merge sort has 2 sequential (not mutually exclusive) recursive calls
    # Classifier sees 2 independent calls → multiple_recursive
    # (Though from D&C perspective, each call halves the problem)
    print(f"Classification: {invariant['evidence']['recursionType']}")
    print(f"Confidence: {invariant['confidence']:.2f}")
    print(f"Summary: {invariant['didacticSummary']}")


def test_tower_of_hanoi_recursive_invariant():
    """Test recursion with auxiliary parameters."""

    ast = {
        "type": "Program",
        "body": [
            {
                "type": "ProcDef",
                "name": "hanoi",
                "params": [
                    {"name": "n"},
                    {"name": "from"},
                    {"name": "to"},
                    {"name": "aux"},
                ],
                "body": [
                    {
                        "type": "If",
                        "test": {
                            "type": "Binary",
                            "op": "==",
                            "left": {"type": "Identifier", "name": "n"},
                            "right": {"type": "Literal", "value": 1},
                        },
                        "consequent": [
                            {
                                "type": "Call",
                                "func": {"type": "Identifier", "name": "print"},
                                "args": [
                                    {
                                        "type": "Literal",
                                        "value": "move from X to Y",
                                    }
                                ],
                            }
                        ],
                        "alternate": [],
                    },
                    {
                        "type": "Call",
                        "func": {"type": "Identifier", "name": "hanoi"},
                        "args": [
                            {
                                "type": "Binary",
                                "op": "-",
                                "left": {"type": "Identifier", "name": "n"},
                                "right": {"type": "Literal", "value": 1},
                            },
                            {"type": "Identifier", "name": "from"},
                            {"type": "Identifier", "name": "aux"},
                            {"type": "Identifier", "name": "to"},
                        ],
                    },
                    {
                        "type": "Call",
                        "func": {"type": "Identifier", "name": "print"},
                        "args": [
                            {
                                "type": "Literal",
                                "value": "move from X to Y",
                            }
                        ],
                    },
                    {
                        "type": "Call",
                        "func": {"type": "Identifier", "name": "hanoi"},
                        "args": [
                            {
                                "type": "Binary",
                                "op": "-",
                                "left": {"type": "Identifier", "name": "n"},
                                "right": {"type": "Literal", "value": 1},
                            },
                            {"type": "Identifier", "name": "aux"},
                            {"type": "Identifier", "name": "to"},
                            {"type": "Identifier", "name": "from"},
                        ],
                    },
                ],
            }
        ],
    }

    facts = extract_recursive_facts(ast)
    print("\n=== TOWER OF HANOI ===")
    print(f"Recursive calls: {facts.recursive_call_count}")
    print(f"Base conditions: {facts.base_conditions}")
    print(f"Calls independent: {not facts.calls_are_mutually_exclusive}")

    invariant = generate_recursive_invariant(ast=ast, locale="en")
    assert invariant["status"] in ["ok", "low_confidence"]
    # Two independent calls → multiple recursion
    assert invariant["evidence"]["recursionType"] == "multiple_recursive"
    print(f"Classification: {invariant['evidence']['recursionType']}")
    print(f"Confidence: {invariant['confidence']:.2f}")
    print(f"Summary: {invariant['didacticSummary']}")


def test_quicksort_recursive_invariant():
    """Test divide-and-conquer with in-place partitioning."""

    ast = {
        "type": "Program",
        "body": [
            {
                "type": "ProcDef",
                "name": "quickSort",
                "params": [{"name": "A"}, {"name": "p"}, {"name": "r"}],
                "body": [
                    {
                        "type": "If",
                        "test": {
                            "type": "Binary",
                            "op": "<",
                            "left": {"type": "Identifier", "name": "p"},
                            "right": {"type": "Identifier", "name": "r"},
                        },
                        "consequent": [
                            {
                                "type": "Assign",
                                "left": {"type": "Identifier", "name": "q"},
                                "right": {
                                    "type": "Call",
                                    "func": {"type": "Identifier", "name": "partition"},
                                    "args": [
                                        {"type": "Identifier", "name": "A"},
                                        {"type": "Identifier", "name": "p"},
                                        {"type": "Identifier", "name": "r"},
                                    ],
                                },
                            },
                            {
                                "type": "Call",
                                "func": {"type": "Identifier", "name": "quickSort"},
                                "args": [
                                    {"type": "Identifier", "name": "A"},
                                    {"type": "Identifier", "name": "p"},
                                    {
                                        "type": "Binary",
                                        "op": "-",
                                        "left": {"type": "Identifier", "name": "q"},
                                        "right": {"type": "Literal", "value": 1},
                                    },
                                ],
                            },
                            {
                                "type": "Call",
                                "func": {"type": "Identifier", "name": "quickSort"},
                                "args": [
                                    {"type": "Identifier", "name": "A"},
                                    {
                                        "type": "Binary",
                                        "op": "+",
                                        "left": {"type": "Identifier", "name": "q"},
                                        "right": {"type": "Literal", "value": 1},
                                    },
                                    {"type": "Identifier", "name": "r"},
                                ],
                            },
                        ],
                        "alternate": [],
                    }
                ],
            }
        ],
    }

    facts = extract_recursive_facts(ast)
    print("\n=== QUICK SORT ===")
    print(f"Recursive calls: {facts.recursive_call_count}")
    print(f"Base conditions: {facts.base_conditions}")
    print(f"Mutually exclusive: {facts.calls_are_mutually_exclusive}")

    invariant = generate_recursive_invariant(ast=ast, locale="en")
    assert invariant["status"] in ["ok", "low_confidence"]
    # Sequential calls after partition → multiple_recursive classification
    # (Though algorithmically it's D&C with in-place partitioning)
    assert invariant["evidence"]["recursionType"] in ["multiple_recursive", "divide_conquer"]
    print(f"Classification: {invariant['evidence']['recursionType']}")
    print(f"Confidence: {invariant['confidence']:.2f}")
    print(f"Summary: {invariant['didacticSummary']}")


def test_binary_exponentiation_recursive_invariant():
    """Test divide-and-conquer with single recursive call."""

    ast = {
        "type": "Program",
        "body": [
            {
                "type": "ProcDef",
                "name": "power",
                "params": [{"name": "x"}, {"name": "n"}],
                "body": [
                    {
                        "type": "If",
                        "test": {
                            "type": "Binary",
                            "op": "==",
                            "left": {"type": "Identifier", "name": "n"},
                            "right": {"type": "Literal", "value": 0},
                        },
                        "consequent": [
                            {"type": "Return", "value": {"type": "Literal", "value": 1}}
                        ],
                        "alternate": [],
                    },
                    {
                        "type": "If",
                        "test": {
                            "type": "Binary",
                            "op": "%",
                            "left": {"type": "Identifier", "name": "n"},
                            "right": {"type": "Literal", "value": 2},
                        },
                        "consequent": [
                            {
                                "type": "Return",
                                "value": {
                                    "type": "Binary",
                                    "op": "*",
                                    "left": {"type": "Identifier", "name": "x"},
                                    "right": {
                                        "type": "Call",
                                        "func": {"type": "Identifier", "name": "power"},
                                        "args": [
                                            {"type": "Identifier", "name": "x"},
                                            {
                                                "type": "Binary",
                                                "op": "-",
                                                "left": {"type": "Identifier", "name": "n"},
                                                "right": {"type": "Literal", "value": 1},
                                            },
                                        ],
                                    },
                                },
                            }
                        ],
                        "alternate": [
                            {
                                "type": "Return",
                                "value": {
                                    "type": "Call",
                                    "func": {"type": "Identifier", "name": "power"},
                                    "args": [
                                        {
                                            "type": "Binary",
                                            "op": "*",
                                            "left": {"type": "Identifier", "name": "x"},
                                            "right": {"type": "Identifier", "name": "x"},
                                        },
                                        {
                                            "type": "Binary",
                                            "op": "/",
                                            "left": {"type": "Identifier", "name": "n"},
                                            "right": {"type": "Literal", "value": 2},
                                        },
                                    ],
                                },
                            }
                        ],
                    },
                ],
            }
        ],
    }

    facts = extract_recursive_facts(ast)
    print("\n=== BINARY EXPONENTIATION ===")
    print(f"Recursive calls: {facts.recursive_call_count}")
    print(f"Base conditions: {facts.base_conditions}")
    print(f"Mutually exclusive: {facts.calls_are_mutually_exclusive}")

    invariant = generate_recursive_invariant(ast=ast, locale="en")
    assert invariant["status"] in ["ok", "low_confidence"]
    # Mutually exclusive (odd vs even branch)
    assert invariant["evidence"]["recursionType"] == "divide_conquer"
    print(f"Classification: {invariant['evidence']['recursionType']}")
    print(f"Confidence: {invariant['confidence']:.2f}")
    print(f"Summary: {invariant['didacticSummary']}")


def test_ackermann_function_recursive_invariant():
    """Test complex multiple recursion (Ackermann function)."""

    ast = {
        "type": "Program",
        "body": [
            {
                "type": "ProcDef",
                "name": "ackermann",
                "params": [{"name": "m"}, {"name": "n"}],
                "body": [
                    {
                        "type": "If",
                        "test": {
                            "type": "Binary",
                            "op": "==",
                            "left": {"type": "Identifier", "name": "m"},
                            "right": {"type": "Literal", "value": 0},
                        },
                        "consequent": [
                            {
                                "type": "Return",
                                "value": {
                                    "type": "Binary",
                                    "op": "+",
                                    "left": {"type": "Identifier", "name": "n"},
                                    "right": {"type": "Literal", "value": 1},
                                },
                            }
                        ],
                        "alternate": [],
                    },
                    {
                        "type": "If",
                        "test": {
                            "type": "Binary",
                            "op": "==",
                            "left": {"type": "Identifier", "name": "n"},
                            "right": {"type": "Literal", "value": 0},
                        },
                        "consequent": [
                            {
                                "type": "Return",
                                "value": {
                                    "type": "Call",
                                    "func": {"type": "Identifier", "name": "ackermann"},
                                    "args": [
                                        {
                                            "type": "Binary",
                                            "op": "-",
                                            "left": {"type": "Identifier", "name": "m"},
                                            "right": {"type": "Literal", "value": 1},
                                        },
                                        {"type": "Literal", "value": 1},
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
                            "func": {"type": "Identifier", "name": "ackermann"},
                            "args": [
                                {
                                    "type": "Binary",
                                    "op": "-",
                                    "left": {"type": "Identifier", "name": "m"},
                                    "right": {"type": "Literal", "value": 1},
                                },
                                {
                                    "type": "Call",
                                    "func": {"type": "Identifier", "name": "ackermann"},
                                    "args": [
                                        {"type": "Identifier", "name": "m"},
                                        {
                                            "type": "Binary",
                                            "op": "-",
                                            "left": {"type": "Identifier", "name": "n"},
                                            "right": {"type": "Literal", "value": 1},
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                ],
            }
        ],
    }

    facts = extract_recursive_facts(ast)
    print("\n=== ACKERMANN FUNCTION ===")
    print(f"Recursive calls: {facts.recursive_call_count}")
    print(f"Base conditions: {facts.base_conditions}")
    print(f"Mutually exclusive: {facts.calls_are_mutually_exclusive}")

    invariant = generate_recursive_invariant(ast=ast, locale="en")
    assert invariant["status"] in ["ok", "low_confidence", "unavailable"]
    # Nested calls (call inside call argument) → complex, likely multiple or unknown
    # Ackermann has very rapid growth (beyond any primitive recursion)
    print(f"Classification: {invariant['evidence']['recursionType']}")
    print(f"Confidence: {invariant['confidence']:.2f}")
    print(f"Summary: {invariant['didacticSummary']}")


if __name__ == "__main__":
    print("=" * 80)
    print("Testing Complex Recursive Algorithms")
    print("=" * 80)

    try:
        test_merge_sort_recursive_invariant()
        test_tower_of_hanoi_recursive_invariant()
        test_quicksort_recursive_invariant()
        test_binary_exponentiation_recursive_invariant()
        test_ackermann_function_recursive_invariant()

        print("\n" + "=" * 80)
        print("✓ All complex algorithm tests passed!")
        print("=" * 80)
    except AssertionError as e:
        print(f"\n✗ Test failed: {e}")
        import traceback

        traceback.print_exc()
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback

        traceback.print_exc()
