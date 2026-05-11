"""Test recursive invariant generation for various algorithms."""

from app.modules.analysis.recursive_invariants import generate_recursive_invariant
from app.modules.analysis.recursive_invariants.extractor import extract_recursive_facts


def test_fibonacci_recursive_invariant():
    """Test recursive invariant for Fibonacci algorithm."""
    
    # Simple Fibonacci AST
    ast = {
        "type": "Program",
        "body": [
            {
                "type": "ProcDef",
                "name": "fib",
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
                            {
                                "type": "Return",
                                "value": {"type": "Literal", "value": 1},
                            }
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
                                "func": {"type": "Identifier", "name": "fib"},
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
                                "func": {"type": "Identifier", "name": "fib"},
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

    # Extract facts
    facts = extract_recursive_facts(ast)
    assert facts.has_recursive_calls, "Should detect recursive calls"
    assert facts.recursive_call_count == 2, "Should detect 2 recursive calls"
    print(f"✓ Detected {facts.recursive_call_count} recursive calls")
    print(f"✓ Base conditions: {facts.base_conditions}")
    print(f"✓ Recursion type: {facts.recursion_type}")
    
    # Generate invariant
    invariant = generate_recursive_invariant(ast=ast, locale="en")
    assert invariant["status"] in ["ok", "low_confidence"], "Should generate valid invariant"
    assert "baseProperty" in invariant["invariant"], "Should have base property"
    assert "inductiveHypothesis" in invariant["invariant"], "Should have inductive hypothesis"
    assert "recursiveStep" in invariant["invariant"], "Should have recursive step"
    assert "terminationGarantee" in invariant["invariant"], "Should have termination guarantee"
    
    print("\n✓ Fibonacci recursive invariant generated successfully")
    print(f"  Status: {invariant['status']}")
    print(f"  Confidence: {invariant['confidence']:.2f}")
    print(f"  Recursion Type: {invariant['evidence']['recursionType']}")
    print(f"\n  Base Property: {invariant['invariant']['baseProperty']}")
    print(f"  Recursive Step: {invariant['invariant']['recursiveStep']}")
    

def test_linear_shift_recursive_invariant():
    """Test recursive invariant for linear shift recursion (T(n) = T(n-1) + 1)."""
    
    ast = {
        "type": "Program",
        "body": [
            {
                "type": "ProcDef",
                "name": "countdown",
                "params": [{"name": "n"}],
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
                            {
                                "type": "Return",
                                "value": {"type": "Literal", "value": 0},
                            }
                        ],
                        "alternate": [],
                    },
                    {
                        "type": "Return",
                        "value": {
                            "type": "Call",
                            "func": {"type": "Identifier", "name": "countdown"},
                            "args": [
                                {
                                    "type": "Binary",
                                    "op": "-",
                                    "left": {"type": "Identifier", "name": "n"},
                                    "right": {"type": "Literal", "value": 1},
                                }
                            ],
                        },
                    },
                ],
            }
        ],
    }

    facts = extract_recursive_facts(ast)
    assert facts.has_recursive_calls, "Should detect recursive call"
    assert facts.recursive_call_count == 1, "Should detect 1 recursive call"
    assert facts.recursion_type == "linear_recursive", "Should classify as linear recursion"
    print(f"\n✓ Countdown: Detected {facts.recursive_call_count} call(s)")
    print(f"✓ Recursion type: {facts.recursion_type}")
    
    invariant = generate_recursive_invariant(ast=ast, locale="en")
    assert invariant["status"] in ["ok", "low_confidence"], "Should generate valid invariant"
    print("\n✓ Countdown recursive invariant generated successfully")
    print(f"  Status: {invariant['status']}")
    print(f"  Confidence: {invariant['confidence']:.2f}")
    

def test_spanish_locale():
    """Test that Spanish locale works."""
    
    ast = {
        "type": "Program",
        "body": [
            {
                "type": "ProcDef",
                "name": "f",
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
                            "type": "Call",
                            "func": {"type": "Identifier", "name": "f"},
                            "args": [
                                {
                                    "type": "Binary",
                                    "op": "-",
                                    "left": {"type": "Identifier", "name": "n"},
                                    "right": {"type": "Literal", "value": 1},
                                }
                            ],
                        },
                    },
                ],
            }
        ],
    }
    
    invariant_en = generate_recursive_invariant(ast=ast, locale="en")
    invariant_es = generate_recursive_invariant(ast=ast, locale="es")
    
    # Both should have valid structure
    assert invariant_en["status"] in ["ok", "low_confidence"]
    assert invariant_es["status"] in ["ok", "low_confidence"]
    
    # English and Spanish should have different text
    assert invariant_en["invariant"]["baseProperty"] != invariant_es["invariant"]["baseProperty"]
    
    print("\n✓ Spanish locale test passed")
    print(f"  EN: {invariant_en['didacticSummary']}")
    print(f"  ES: {invariant_es['didacticSummary']}")


if __name__ == "__main__":
    print("=" * 80)
    print("Testing Recursive Invariant Generation")
    print("=" * 80)
    
    try:
        test_fibonacci_recursive_invariant()
        test_linear_shift_recursive_invariant()
        test_spanish_locale()
        
        print("\n" + "=" * 80)
        print("✓ All tests passed!")
        print("=" * 80)
    except AssertionError as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
