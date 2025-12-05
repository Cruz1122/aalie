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

# Test factorial(5) recursion
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

import json
print("Full Result:")
print(json.dumps(result, indent=2))

