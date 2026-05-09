"""Extract recursive facts from AST for invariant generation."""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Set

from .schemas import RecursiveCallInfo, RecursiveFacts


def _ensure_stmt_list(node_or_list):
    """Normalize a node or list into a list of statement nodes.

    Accepts: None, list, dict (Block or single stmt)
    Returns: list
    """
    if node_or_list is None:
        return []
    if isinstance(node_or_list, list):
        return node_or_list
    if isinstance(node_or_list, dict):
        if node_or_list.get("type") == "Block" and isinstance(node_or_list.get("body"), list):
            return node_or_list.get("body", [])
        return [node_or_list]
    return []


def extract_recursive_facts(ast: Optional[Dict[str, Any]]) -> RecursiveFacts:
    """Extract structured facts about recursion from AST.

    Args:
        ast: The algorithm AST

    Returns:
        RecursiveFacts with analyzed recursion information
    """

    facts = RecursiveFacts()

    if not isinstance(ast, dict):
        return facts

    # Find the main procedure
    statements = ast.get("body", [])
    if not statements:
        return facts

    main_proc = None
    for stmt in statements:
        if stmt.get("type") == "ProcDef":
            main_proc = stmt
            break

    if not main_proc:
        return facts

    # Get procedure name for recursive call matching
    proc_name = main_proc.get("name", "f")
    
    proc_body = main_proc.get("body", [])
    # Normalize proc_body: some parsers wrap procedure body in a Block node
    if isinstance(proc_body, dict):
        # Common pattern: {"type": "Block", "body": [...]}
        if proc_body.get("type") == "Block" and isinstance(proc_body.get("body"), list):
            proc_body = proc_body.get("body", [])
        elif isinstance(proc_body.get("body"), list):
            proc_body = proc_body.get("body", [])

    # Extract base conditions and results
    base_conditions = _extract_base_conditions(proc_body)
    base_results = _extract_base_results(proc_body)
    facts.base_conditions = base_conditions
    facts.base_results = base_results
    facts.has_clear_base_case = len(base_conditions) > 0 and len(base_results) > 0

    # Find recursive calls using the actual procedure name
    recursive_calls = _find_recursive_calls(proc_body, proc_name)
    facts.recursive_calls = recursive_calls
    facts.recursive_call_count = len(recursive_calls)
    facts.has_recursive_calls = facts.recursive_call_count > 0

    # Determine if calls are mutually exclusive by comparing branch paths
    if facts.recursive_call_count > 1:
        paths = [tuple(c.path) for c in recursive_calls]
        mutually_exclusive = False
        # compare pairwise
        for i in range(len(paths)):
            for j in range(i + 1, len(paths)):
                p = paths[i]
                q = paths[j]
                # find first index where they differ
                minlen = min(len(p), len(q))
                k = 0
                while k < minlen and p[k] == q[k]:
                    k += 1
                if k < minlen:
                    # if they differ at same depth and one is 'T' other 'F', they are mutually exclusive
                    if (p[k] == 'T' and q[k] == 'F') or (p[k] == 'F' and q[k] == 'T'):
                        mutually_exclusive = True
                        break
            if mutually_exclusive:
                break
        facts.calls_are_mutually_exclusive = mutually_exclusive

    # Calculate actual subproblems resolved per call
    # If mutually exclusive, only one branch executes, so effectively 1 subproblem
    # If not mutually exclusive, all calls execute, so N subproblems
    if facts.calls_are_mutually_exclusive:
        facts.subproblems_per_call = 1
    else:
        facts.subproblems_per_call = facts.recursive_call_count

    if not facts.has_recursive_calls:
        return facts

    # Extract size parameters (typically the first parameter)
    size_params = _extract_size_parameters(main_proc)  # Ensure helper is top-level
    facts.size_parameters = size_params

    # Analyze parameter decrease
    facts.parameters_strictly_decrease = _analyze_parameter_decrease(
        recursive_calls, size_params
    )

    # Classify recursion type
    facts.recursion_type = _classify_recursion_type(recursive_calls, base_conditions)

    # Analyze termination
    facts.has_clear_termination = _analyze_termination(base_conditions, recursive_calls)

    return facts


def _extract_base_conditions(body: List[Dict[str, Any]]) -> List[str]:
    """Extract base case conditions from the first If statement (assumed to be base case)."""
    conditions = []

    for stmt in _ensure_stmt_list(body):
        if not isinstance(stmt, dict):
            continue
        # Only look at top-level If for base case
        if stmt.get("type") == "If":
            test = stmt.get("test", {})
            # Try to extract human-readable condition
            condition_str = _stringify_condition(test)
            if condition_str:
                conditions.append(condition_str)
            # Only process the first If (base case)
            break

    return conditions


def _extract_base_results(body: List[Dict[str, Any]]) -> List[str]:
    """Extract base case return values from the first If statement (assumed to be base case)."""
    results = []

    for stmt in _ensure_stmt_list(body):
        if not isinstance(stmt, dict):
            continue
        # Only look at top-level If for base case results
        if stmt.get("type") == "If":
            # Extract returns from the first If's consequent (base case branch)
            for s in _ensure_stmt_list(stmt.get("consequent", [])):
                if isinstance(s, dict) and s.get("type") == "Return":
                    value = s.get("value")
                    if value:
                        result_str = _stringify_expr(value)
                        if result_str:
                            results.append(f"return {result_str}")
            # Only process the first If (base case)
            break

    return results


def _find_recursive_calls(body: List[Dict[str, Any]], proc_name: str = "f") -> List[RecursiveCallInfo]:
    """Find all recursive call sites in procedure body, tracking branch path."""
    calls = []

    for stmt in _ensure_stmt_list(body):
        calls.extend(_find_recursive_calls_in_stmt(stmt, proc_name, path=[]))

    return calls


def _find_recursive_calls_in_stmt(
    stmt: Dict[str, Any], proc_name: str = "f", path: Optional[List[str]] = None
) -> List[RecursiveCallInfo]:
    """Recursively find recursive calls in a statement, recording branch path.

    `path` is a list of 'T'/'F' strings representing taken branches at each If
    encountered along the traversal.
    """
    calls = []

    if path is None:
        path = []

    if not isinstance(stmt, dict):
        return []

    stmt_type = stmt.get("type")

    if stmt_type == "Call":
        # Support different parser shapes: 'func' dict with 'name' or 'callee' as string/dict
        callee = stmt.get("func") or stmt.get("callee")
        callee_name = None
        if isinstance(callee, dict):
            callee_name = callee.get("name")
        elif isinstance(callee, str):
            callee_name = callee

        if callee_name == proc_name:
            args = stmt.get("args", [])
            params = [_stringify_expr(arg) for arg in args]
            call_expr = f"{proc_name}({', '.join(params)})"
            calls.append(
                RecursiveCallInfo(
                    call_expr=call_expr,
                    parameters=params,
                    parameter_count=len(params),
                    path=list(path),
                )
            )
        # Also scan into call arguments for nested calls
        for arg in stmt.get("args", []):
            if isinstance(arg, dict):
                calls.extend(_find_recursive_calls_in_stmt(arg, proc_name, path=list(path)))
    elif stmt_type == "If":
        # consequent -> take 'T'
        for s in _ensure_stmt_list(stmt.get("consequent", [])):
            calls.extend(_find_recursive_calls_in_stmt(s, proc_name, path=list(path) + ["T"]))
        # alternate -> take 'F'
        for s in _ensure_stmt_list(stmt.get("alternate", [])):
            calls.extend(_find_recursive_calls_in_stmt(s, proc_name, path=list(path) + ["F"]))
    elif stmt_type in ["For", "While", "Repeat"]:
        for s in _ensure_stmt_list(stmt.get("body", [])):
            calls.extend(_find_recursive_calls_in_stmt(s, proc_name, path=list(path)))
    elif stmt_type == "Return":
        # Scan return expression for nested calls
        value = stmt.get("value")
        if isinstance(value, dict):
            calls.extend(_find_recursive_calls_in_stmt(value, proc_name, path=list(path)))
    else:
        # Generic: if this node contains expression fields, try to scan them
        # e.g., Binary expressions nested as statements in some ASTs
        for key, v in stmt.items():
            if isinstance(v, dict) and "type" in v:
                calls.extend(_find_recursive_calls_in_stmt(v, proc_name, path=list(path)))
            elif isinstance(v, list):
                for item in v:
                    if isinstance(item, dict) and "type" in item:
                        calls.extend(_find_recursive_calls_in_stmt(item, proc_name, path=list(path)))

    return calls



def _extract_size_parameters(proc_def: Dict[str, Any]) -> List[str]:
    """Extract size parameters (usually the first parameter)."""
    params = proc_def.get("params", [])
    if params and isinstance(params, list):
        return [p.get("name", str(p)) for p in params[:1]]
    return []


def _analyze_parameter_decrease(
    calls: List[RecursiveCallInfo], size_params: List[str]
) -> bool:
    """Check if parameters strictly decrease in recursive calls."""
    if not calls or not size_params:
        return False

    size_param = size_params[0]

    for call in calls:
        for param in call.parameters:
            # Check if parameter contains subtraction (n-1) or division (n/2)
            if "-" not in param and "/" not in param:
                return False

    return True


def _classify_recursion_type(
    calls: List[RecursiveCallInfo], base_conditions: List[str]
) -> str:
    """Classify recursion type based on call patterns."""
    if not calls:
        return "unknown"

    # Analyze call parameters
    param_patterns: Set[str] = set()
    for call in calls:
        for param in call.parameters:
            if "-" in param:
                param_patterns.add("subtraction")
            elif "/" in param:
                param_patterns.add("division")

    # Decision logic
    if "division" in param_patterns and len(calls) >= 2:
        return "divide_conquer"
    elif "subtraction" in param_patterns and len(calls) <= 1:
        return "linear_recursive"
    elif len(calls) >= 2:
        return "multiple_recursive"
    else:
        return "linear_recursive" if len(calls) == 1 else "unknown"


def _analyze_termination(
    base_conditions: List[str], calls: List[RecursiveCallInfo]
) -> bool:
    """Analyze if termination is clear."""
    return len(base_conditions) > 0 and len(calls) > 0


def _stringify_condition(condition: Dict[str, Any]) -> Optional[str]:
    """Convert condition AST to readable string."""
    if not isinstance(condition, dict):
        return None

    cond_type = condition.get("type")

    if cond_type == "Binary":
        left = _stringify_expr(condition.get("left", {}))
        op = condition.get("op", "")
        right = _stringify_expr(condition.get("right", {}))
        if left and right:
            return f"{left} {op} {right}"

    return None


def _stringify_expr(expr: Any) -> Optional[str]:
    """Convert expression AST to readable string."""
    if not isinstance(expr, dict):
        return str(expr) if expr else None

    expr_type = expr.get("type")

    if expr_type == "Identifier":
        return expr.get("name")
    elif expr_type == "Literal":
        return str(expr.get("value", ""))
    elif expr_type == "Call":
        # stringify call expressions like fibonacci(n-1)
        callee = expr.get("func") or expr.get("callee")
        if isinstance(callee, dict):
            name = callee.get("name")
        else:
            name = callee
        args = expr.get("args", [])
        params = [ _stringify_expr(a) or "?" for a in args ]
        return f"{name}({', '.join(params)})" if name else None
    elif expr_type == "Binary":
        left = _stringify_expr(expr.get("left", {}))
        op = expr.get("op", "")
        right = _stringify_expr(expr.get("right", {}))
        if left and right:
            return f"{left}{op}{right}"
    elif expr_type == "Unary":
        arg = _stringify_expr(expr.get("argument", {}))
        if arg:
            return f"{expr.get('op', '')}{arg}"

    return None
