"""
Carga de algoritmos (.txt) y especificaciones (json/yaml) desde _support.

Author: AALIE reform
Version: 0.1.0
"""
import json
from pathlib import Path
from typing import Any, Dict

_BASE = Path(__file__).resolve().parent


def load_algorithm(family: str, name: str) -> str:
    """
    Carga el pseudocódigo de un algoritmo desde _support/algorithms/<family>/<name>.txt.
    """
    path = _BASE / "algorithms" / family / f"{name}.txt"
    if not path.exists():
        raise FileNotFoundError(f"Algoritmo no encontrado: {path}")
    return path.read_text(encoding="utf-8")


def load_spec(family: str, name: str) -> Dict[str, Any]:
    """
    Carga la especificación de expectativas desde _support/expectations/<family>/<name>.json.
    """
    path = _BASE / "expectations" / family / f"{name}.json"
    if not path.exists():
        raise FileNotFoundError(f"Spec no encontrada: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def load_trace_expectation(family: str, name: str) -> Dict[str, Any]:
    """
    Carga la expectativa de diagrama de seguimiento desde _support/expectations/trace/<family>/<name>.json.

    Esquema esperado: input_size, initial_variables (opcional), patternKind, minNodes,
    minEdges (opcional), nodeLabelsContain, nodeIdsPrefix (opcional).
    """
    path = _BASE / "expectations" / "trace" / family / f"{name}.json"
    if not path.exists():
        raise FileNotFoundError(f"Trace expectation no encontrada: {path}")
    return json.loads(path.read_text(encoding="utf-8"))
