"""
Registry de analizadores.
"""

from .iterative import IterativeAnalyzer
from .recursive import RecursiveAnalyzer

# Registry de analizadores
AnalyzerRegistry = {
    "iterative": IterativeAnalyzer,
    "recursive": RecursiveAnalyzer,
    "hybrid": RecursiveAnalyzer,  # Los híbridos también usan RecursiveAnalyzer
}

__all__ = ["AnalyzerRegistry"]
