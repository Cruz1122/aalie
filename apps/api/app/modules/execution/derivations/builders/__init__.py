"""
Builders de StructuredTraceView por patrón estructural.

Cada builder produce StructuredTraceView a partir de ExecutionTrace
y StructuralTraceClassification.

Author: Plan Sistema Traza Estructural
Version: 0.1.0
"""

from .backtracking_stateful import build_backtracking_stateful
from .binary_branch_recursive import build_binary_branch_recursive
from .divide_merge_recurse import build_divide_merge_recurse
from .divide_partition_recurse import build_divide_partition_recurse
from .generic_iterative import build_generic_iterative
from .generic_recursive import build_generic_recursive
from .hybrid_recursive_iterative import build_hybrid_recursive_iterative
from .single_branch_recursive_search import build_single_branch_recursive_search
from .tail_recursive_linear import build_tail_recursive_linear

__all__ = [
    "build_generic_iterative",
    "build_generic_recursive",
    "build_tail_recursive_linear",
    "build_single_branch_recursive_search",
    "build_binary_branch_recursive",
    "build_divide_partition_recurse",
    "build_divide_merge_recurse",
    "build_backtracking_stateful",
    "build_hybrid_recursive_iterative",
]
