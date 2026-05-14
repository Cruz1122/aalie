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

    path_outcomes = _analyze_execution_path_call_counts(proc_body, proc_name)
    facts.max_recursive_calls_per_path = max(path_outcomes) if path_outcomes else 0

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
        # Also consider control-flow evidence: if no path can execute more than one
        # recursive call, then call sites are effectively mutually exclusive.
        facts.calls_are_mutually_exclusive = (
            mutually_exclusive or facts.max_recursive_calls_per_path <= 1
        )

    # Calculate actual subproblems resolved per call
    # If mutually exclusive, only one branch executes, so effectively 1 subproblem
    # If not mutually exclusive, all calls execute, so N subproblems
    if facts.calls_are_mutually_exclusive or facts.max_recursive_calls_per_path <= 1:
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

    # Estimate local work per level and total complexity for pedagogical text.
    facts.local_work_term = _estimate_local_work_term(proc_body)
    facts.estimated_total_complexity = _estimate_total_complexity(facts)

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
    elif stmt_type in ("AssignStmt", "Assignment", "VariableAssignment"):
        # The recursive call could be in the value (RHS) of the assignment
        value = stmt.get("value")
        if isinstance(value, dict):
            calls.extend(_find_recursive_calls_in_stmt(value, proc_name, path=list(path)))
        # Also scan the target (LHS) for any nested calls (rare but possible)
        target = stmt.get("target")
        if isinstance(target, dict):
            calls.extend(_find_recursive_calls_in_stmt(target, proc_name, path=list(path)))
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


def _analyze_execution_path_call_counts(
    body: List[Dict[str, Any]], proc_name: str
) -> List[int]:
    """Return recursive-call counts across possible execution paths.

    This models sequential statements, conditional branches, and early returns.
    It approximates how many recursive calls can execute in one invocation.
    """

    outcomes = _analyze_sequence_outcomes(_ensure_stmt_list(body), 0, proc_name)
    return [count for count, _ in outcomes] if outcomes else [0]


def _analyze_sequence_outcomes(
    stmts: List[Dict[str, Any]],
    start_count: int,
    proc_name: str,
) -> List[tuple[int, bool]]:
    """Analyze a statement sequence and return [(count, terminated_by_return), ...]."""

    outcomes: List[tuple[int, bool]] = [(start_count, False)]

    for stmt in _ensure_stmt_list(stmts):
        next_outcomes: List[tuple[int, bool]] = []
        for count, terminated in outcomes:
            if terminated:
                next_outcomes.append((count, True))
                continue
            next_outcomes.extend(_analyze_statement_outcomes(stmt, count, proc_name))
        outcomes = next_outcomes

    return outcomes


def _analyze_statement_outcomes(
    stmt: Dict[str, Any],
    current_count: int,
    proc_name: str,
) -> List[tuple[int, bool]]:
    """Analyze one statement and return possible outcomes."""

    if not isinstance(stmt, dict):
        return [(current_count, False)]

    stmt_type = stmt.get("type")

    if stmt_type == "If":
        outcomes: List[tuple[int, bool]] = []

        cons = _ensure_stmt_list(stmt.get("consequent", []))
        outcomes.extend(_analyze_sequence_outcomes(cons, current_count, proc_name))

        alt = _ensure_stmt_list(stmt.get("alternate", []))
        if alt:
            outcomes.extend(_analyze_sequence_outcomes(alt, current_count, proc_name))
        else:
            outcomes.append((current_count, False))

        return outcomes

    if stmt_type == "Return":
        value = stmt.get("value")
        calls_in_return = _count_recursive_calls_in_node(value, proc_name)
        return [(current_count + calls_in_return, True)]

    calls_in_stmt = _count_recursive_calls_in_node(stmt, proc_name)
    return [(current_count + calls_in_stmt, False)]


def _count_recursive_calls_in_node(node: Any, proc_name: str) -> int:
    """Count recursive calls to proc_name inside an AST node."""

    if not isinstance(node, dict):
        return 0

    count = 0
    node_type = node.get("type")

    if node_type == "Call":
        callee = node.get("func") or node.get("callee")
        callee_name = None
        if isinstance(callee, dict):
            callee_name = callee.get("name")
        elif isinstance(callee, str):
            callee_name = callee
        if callee_name == proc_name:
            count += 1

    for value in node.values():
        if isinstance(value, dict):
            count += _count_recursive_calls_in_node(value, proc_name)
        elif isinstance(value, list):
            for item in value:
                if isinstance(item, dict):
                    count += _count_recursive_calls_in_node(item, proc_name)

    return count



def _extract_size_parameters(proc_def: Dict[str, Any]) -> List[str]:
    """Extract size parameters (usually the first parameter)."""
    params = proc_def.get("params", [])
    if params and isinstance(params, list):
        names: List[str] = []
        for p in params:
            if isinstance(p, dict):
                name = p.get("name")
                if name:
                    names.append(str(name))
            else:
                names.append(str(p))
        return names
    return []


def _analyze_parameter_decrease(
    calls: List[RecursiveCallInfo], size_params: List[str]
) -> bool:
    """Check if parameters strictly decrease in recursive calls."""
    if not calls or not size_params:
        return False

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


def _estimate_local_work_term(body: List[Dict[str, Any]]) -> str:
    """Estimate non-recursive local work per recursive level from loop structure."""

    max_depth = _max_loop_depth(body)
    if max_depth <= 0:
        return "O(1)"
    if max_depth == 1:
        return "O(n)"
    return f"O(n^{max_depth})"


def _max_loop_depth(node: Any, depth: int = 0) -> int:
    """Compute maximum nested loop depth in the AST subtree."""

    if isinstance(node, list):
        if not node:
            return depth
        return max((_max_loop_depth(item, depth) for item in node), default=depth)

    if not isinstance(node, dict):
        return depth

    node_type = node.get("type")
    if node_type in {"For", "While", "Repeat"}:
        body_depth = _max_loop_depth(_ensure_stmt_list(node.get("body", [])), depth + 1)
        # For statements with additional expressions/conditions that may include nested nodes
        other_depth = depth + 1
        for value in node.values():
            if isinstance(value, (dict, list)):
                other_depth = max(other_depth, _max_loop_depth(value, depth + 1))
        return max(body_depth, other_depth)

    max_found = depth
    for value in node.values():
        if isinstance(value, (dict, list)):
            max_found = max(max_found, _max_loop_depth(value, depth))
    return max_found


def _estimate_total_complexity(facts: RecursiveFacts) -> str:
    """Best-effort pedagogical complexity summary from recursion shape + local work."""

    work = (facts.local_work_term or "O(1)").replace(" ", "")
    rtype = facts.recursion_type

    if rtype == "linear_recursive" and facts.subproblems_per_call <= 1:
        if work == "O(1)":
            return "O(n)"
        if work == "O(logn)":
            return "O(n log n)"
        if work == "O(n)":
            return "O(n^2)"
        if work.startswith("O(n^") and work.endswith(")"):
            try:
                exp = int(work[4:-1])
                return f"O(n^{exp + 1})"
            except Exception:
                pass
        return f"O(n * {work[2:-1]})"

    if rtype == "divide_conquer" and facts.subproblems_per_call <= 1:
        if work == "O(1)":
            return "O(log n)"
        if work == "O(n)":
            return "O(n log n)"
        return f"O(log n * {work[2:-1]})"

    if rtype == "multiple_recursive":
        return "growth depends on branching (often exponential)"

    return "unknown"


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
