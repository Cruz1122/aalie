"""
Códigos de razón y diagnósticos para el motor WHILE.

Reason codes estables y testeables.

Author: @Cruz1122
Version: 0.1.0
"""

from typing import Dict, Set

REASON_CODES: Dict[str, str] = {
    "while_const_true": "unbounded",
    "while_bool_no_must_kill": "unbounded",
    "while_bool_kills": "bounded",
    "while_bool_revived": "unknown",
    "while_flag_aux_decrease_bound": "bounded",
    "while_flag_aux_increase_bound": "bounded",
    "while_no_progress_must": "unbounded",
    "while_euclid_mod": "bounded",
    "while_linear": "bounded",
    "while_decrement": "bounded",
    "while_log": "bounded",
    "while_reset": "unbounded",
    "while_two_vars": "unknown",
    "while_no_updates": "unknown",
    "while_param_enables": "bounded",
    "while_positive_prefix_avg": "bounded",
    "while_unbounded_unknown": "unknown",
    "while_binary_search_interval": "bounded",
    "while_sentinel_scan": "bounded",
    "while_geometric_growth": "bounded",
    "while_geometric_decay": "bounded",
    "while_coupled_interval": "bounded",
}

BOUNDED_CODES: Set[str] = {k for k, v in REASON_CODES.items() if v == "bounded"}
UNBOUNDED_CODES: Set[str] = {k for k, v in REASON_CODES.items() if v == "unbounded"}
