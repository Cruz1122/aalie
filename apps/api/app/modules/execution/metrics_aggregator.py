"""
Agregador de métricas por step y por call.

Consolida microseconds/tokens por step, por call, costo agregado por subárbol.
Evita que call_tree_builder mezcle lógica de agregación con lógica visual.

Author: Plan refactor subsistema trace
Version: 0.1.0
"""
from typing import Any, Dict, List, Tuple


def aggregate_metrics(
    steps: List[Dict[str, Any]],
    calls: List[Dict[str, Any]],
) -> Dict[str, Dict[str, Any]]:
    """
    Agrega métricas por call_id.

    Args:
        steps: Pasos del trace con recursion.callId, tokens, microseconds
        calls: Lista de llamadas con id, children

    Returns:
        Dict[call_id, {tokens, microseconds, aggregateTokens, aggregateMicroseconds}]
    """
    cost_by_call: Dict[str, Dict[str, Any]] = {}

    # Por step: sumar tokens y microseconds por callId
    for step in steps:
        rec = step.get("recursion")
        if not rec:
            continue
        call_id = rec.get("callId")
        if not call_id:
            continue
        if call_id not in cost_by_call:
            cost_by_call[call_id] = {"tokens": 0, "microseconds": 0.0}
        cost_by_call[call_id]["tokens"] += step.get("tokens") or 0
        cost_by_call[call_id]["microseconds"] += step.get("microseconds") or 0.0

    # Costo agregado por subárbol (local + hijos)
    calls_by_id: Dict[str, Dict[str, Any]] = {c["id"]: c for c in calls}

    def _aggregate(call_id: str, visited: set) -> Tuple[int, float]:
        if call_id in visited:
            return 0, 0.0  # Evitar ciclos (children mal formados)
        visited.add(call_id)
        local_t = cost_by_call.get(call_id, {}).get("tokens", 0)
        local_u = cost_by_call.get(call_id, {}).get("microseconds", 0.0)
        call = calls_by_id.get(call_id, {})
        children = call.get("children", [])
        for cid in children:
            if cid != call_id:  # No procesar self-reference
                ct, cu = _aggregate(cid, visited)
                local_t += ct
                local_u += cu
        return local_t, local_u

    for call_id in cost_by_call:
        agg_t, agg_u = _aggregate(call_id, set())
        cost_by_call[call_id]["aggregateTokens"] = agg_t
        cost_by_call[call_id]["aggregateMicroseconds"] = agg_u

    return cost_by_call
