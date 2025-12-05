import unittest
import sys
import os

# Ensure current directory is in path
sys.path.append(os.getcwd())

try:
    import app
except ImportError:
    # Try adding parent directory if running from subdirectory
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.modules.execution.executor import CodeExecutor

class TestRecursionGeneric(unittest.TestCase):
    def test_factorial_recursion(self):
        """Test factorial(5) recursion."""
        ast = {
            "type": "Program",
            "body": [
                {
                    "type": "ProcDef",
                    "name": "factorial",
                    "params": [{"name": "n"}],
                    "pos": {"line": 1},
                    "body": {
                        "type": "Block",
                        "body": [
                            {
                                "type": "If",
                                "pos": {"line": 2},
                                "test": {"type": "Binary", "left": {"type": "Identifier", "name": "n"}, "op": "<=", "right": {"type": "Literal", "value": 1}},
                                "consequent": {
                                    "type": "Return", 
                                    "pos": {"line": 3},
                                    "value": {"type": "Literal", "value": 1}
                                },
                                "alternate": {
                                    "type": "Return",
                                    "pos": {"line": 5},
                                    "value": {
                                        "type": "Binary",
                                        "left": {"type": "Identifier", "name": "n"},
                                        "op": "*",
                                        "right": {
                                            "type": "Call",
                                            "name": "factorial",
                                            "pos": {"line": 5},
                                            "args": [
                                                {"type": "Binary", "left": {"type": "Identifier", "name": "n"}, "op": "-", "right": {"type": "Literal", "value": 1}}
                                            ]
                                        }
                                    }
                                }
                            }
                        ]
                    }
                },
                {
                    "type": "Call",
                    "name": "factorial",
                    "pos": {"line": 8},
                    "args": [{"type": "Literal", "value": 5}]
                }
            ]
        }

        executor = CodeExecutor(ast, input_size=5)
        result = executor.execute()
        
        # Verify recursion tree
        self.assertIn("recursionTree", result)
        tree = result["recursionTree"]
        self.assertTrue(len(tree["calls"]) > 0)
        
        # Verify call depth
        calls = tree["calls"]
        depths = [c["depth"] for c in calls]
        self.assertIn(0, depths)
        self.assertIn(1, depths)
        self.assertIn(5, depths)
        
        # Verify steps
        steps = result["steps"]
        self.assertTrue(len(steps) > 0)
        
        # Check for return value of 120 (5!)
        return_steps = [s for s in steps if s["kind"] == "return"]
        last_return = return_steps[-1]
        self.assertIn("120", last_return["description"])

    def test_fibonacci_recursion(self):
        """Test fibonacci(4) recursion."""
        ast = {
            "type": "Program",
            "body": [
                {
                    "type": "ProcDef",
                    "name": "fib",
                    "params": [{"name": "n"}],
                    "pos": {"line": 1},
                    "body": {
                        "type": "Block",
                        "body": [
                            {
                                "type": "If",
                                "pos": {"line": 2},
                                "test": {"type": "Binary", "left": {"type": "Identifier", "name": "n"}, "op": "<=", "right": {"type": "Literal", "value": 1}},
                                "consequent": {
                                    "type": "Return",
                                    "pos": {"line": 3},
                                    "value": {"type": "Identifier", "name": "n"}
                                },
                                "alternate": {
                                    "type": "Return",
                                    "pos": {"line": 5},
                                    "value": {
                                        "type": "Binary",
                                        "left": {
                                            "type": "Call",
                                            "name": "fib",
                                            "pos": {"line": 5},
                                            "args": [{"type": "Binary", "left": {"type": "Identifier", "name": "n"}, "op": "-", "right": {"type": "Literal", "value": 1}}]
                                        },
                                        "op": "+",
                                        "right": {
                                            "type": "Call",
                                            "name": "fib",
                                            "pos": {"line": 5},
                                            "args": [{"type": "Binary", "left": {"type": "Identifier", "name": "n"}, "op": "-", "right": {"type": "Literal", "value": 2}}]
                                        }
                                    }
                                }
                            }
                        ]
                    }
                },
                {
                    "type": "Call",
                    "name": "fib",
                    "pos": {"line": 8},
                    "args": [{"type": "Literal", "value": 4}]
                }
            ]
        }

        executor = CodeExecutor(ast, input_size=4)
        result = executor.execute()
        
        self.assertIn("recursionTree", result)
        tree = result["recursionTree"]
        
        steps = result["steps"]
        return_steps = [s for s in steps if s["kind"] == "return"]
        last_return = return_steps[-1]
        self.assertIn("3", last_return["description"])

if __name__ == '__main__':
    unittest.main()

