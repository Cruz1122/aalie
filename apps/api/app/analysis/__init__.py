# apps/api/app/analysis/__init__.py

from .base import BaseAnalyzer
from .iterative_analyzer import IterativeAnalyzer
from .recursive_analyzer import RecursiveAnalyzer
from .dummy_analyzer import DummyAnalyzer, create_dummy_analysis
from .algorithm_classifier import detect_algorithm_kind

# Registry de analizadores
AnalyzerRegistry = {
    "iterative": IterativeAnalyzer,
    "recursive": RecursiveAnalyzer,
    "hybrid": RecursiveAnalyzer,  # Los híbridos también usan RecursiveAnalyzer
    "dummy": DummyAnalyzer
}

__all__ = [
    "BaseAnalyzer",
    "IterativeAnalyzer",
    "RecursiveAnalyzer",
    "AnalyzerRegistry",
    "DummyAnalyzer", 
    "create_dummy_analysis",
    "detect_algorithm_kind"
]
