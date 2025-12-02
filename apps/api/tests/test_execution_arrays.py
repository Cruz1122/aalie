import pytest
from app.modules.execution.environment import ExecutionEnvironment
from app.modules.execution.executor import CodeExecutor

def test_environment_array_support():
    env = ExecutionEnvironment(input_size=4)
    
    # Test setting and getting list
    env.set_variable("A", [1, 2, 3])
    assert env.get_variable("A") == [1, 2, 3]
    
    # Test formatting
    assert env.evaluate_to_string([1, 2, 3]) == "[1, 2, 3]"
    
    # Test snapshot
    snapshot = env.get_variables_snapshot()
    assert snapshot["A"] == "[1, 2, 3]"

def test_environment_matrix_support():
    env = ExecutionEnvironment(input_size=4)
    
    # Test setting and getting matrix
    matrix = [[1, 2], [3, 4]]
    env.set_variable("M", matrix)
    assert env.get_variable("M") == [[1, 2], [3, 4]]
    
    # Test formatting
    assert env.evaluate_to_string(matrix) == "[[1, 2], [3, 4]]"

def test_executor_array_assignment():
    # Mock AST for: A[1] = 5
    ast = {
        "type": "Program",
        "body": [
            {
                "type": "Assign",
                "target": {
                    "type": "Index",
                    "target": {"type": "Identifier", "name": "A"},
                    "index": {"type": "Literal", "value": 1}
                },
                "value": {"type": "Literal", "value": 5},
                "pos": {"line": 1}
            }
        ]
    }
    
    executor = CodeExecutor(ast, input_size=4)
    # Pre-populate array
    executor.environment.set_variable("A", [0, 0, 0])
    
    trace = executor.execute()
    
    assert trace["steps"][0]["kind"] == "assign"
    assert "A[1] = 5" in trace["steps"][0]["description"]
    assert executor.environment.get_variable("A")[1] == 5

def test_executor_improved_assignment_description():
    # Mock AST for: a = j (where j = 5)
    ast = {
        "type": "Program",
        "body": [
            {
                "type": "Assign",
                "target": {"type": "Identifier", "name": "a"},
                "value": {"type": "Identifier", "name": "j"},
                "pos": {"line": 1}
            }
        ]
    }
    
    executor = CodeExecutor(ast, input_size=4)
    executor.environment.set_variable("j", 5)
    
    trace = executor.execute()
    
    description = trace["steps"][0]["description"]
    # Should be "Asignación: a = j = 5"
    assert "a = j = 5" in description
