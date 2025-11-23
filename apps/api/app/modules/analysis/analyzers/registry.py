"""
Registry de analizadores.
"""
from .iterative import IterativeAnalyzer
from .recursive import RecursiveAnalyzer
from .dummy import DummyAnalyzer

# Registry de analizadores
AnalyzerRegistry = {
    "iterative": IterativeAnalyzer,
    "recursive": RecursiveAnalyzer,
    "hybrid": RecursiveAnalyzer,  # Los híbridos también usan RecursiveAnalyzer
    "dummy": DummyAnalyzer
}

__all__ = ["AnalyzerRegistry"]

