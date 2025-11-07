# apps/api/app/analysis/__init__.py

from .base import BaseAnalyzer
from .iterative_analyzer import IterativeAnalyzer
from .dummy_analyzer import DummyAnalyzer, create_dummy_analysis

# Registry de analizadores
AnalyzerRegistry = {
    "iterative": IterativeAnalyzer,
    "dummy": DummyAnalyzer
}

__all__ = [
    "BaseAnalyzer",
    "IterativeAnalyzer",
    "AnalyzerRegistry",
    "DummyAnalyzer", 
    "create_dummy_analysis"
]
