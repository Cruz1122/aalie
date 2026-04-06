"""
Shared constants for the pure-Python export engine.
"""

from __future__ import annotations

MARKDOWN_FILENAME = "report.md"
LATEX_FILENAME = "report.tex"
PDF_FILENAME = "report.pdf"
SNAPSHOT_SCHEMA_VERSION = "1.0.0"
DEFAULT_SOURCE_ORIGIN = "editor"

INSTITUTIONAL_DISCLAIMER_TEXT = {
    "es": (
        "Este documento fue generado automáticamente como apoyo al análisis y puede "
        "contener omisiones o imprecisiones. No sustituye criterio profesional ni "
        "garantiza exactitud total. Valide los resultados y consulte a un especialista "
        "cuando aplique."
    ),
    "en": (
        "This document was generated automatically as analytical support and may "
        "contain omissions or inaccuracies. It does not replace professional judgment "
        "or guarantee complete accuracy. Validate the results and consult a specialist "
        "when applicable."
    ),
}

DEFAULT_GENERAL_LIMITATIONS_ES = [
    "El análisis automático puede fallar o ser no concluyente en algoritmos complejos o no canónicos.",
    "La clasificación de recurrencias y simplificaciones simbólicas depende de patrones detectables en el AST.",
    "La comparación con LLM es auxiliar y su contrato puede variar según el proveedor/modelo.",
]

DEFAULT_GENERAL_LIMITATIONS_EN = [
    "Automatic analysis can fail or be inconclusive for complex or non-canonical algorithms.",
    "Recurrence classification and symbolic simplification depend on patterns detectable in the AST.",
    "LLM comparison is auxiliary and its contract can vary by provider/model.",
]

SNAPSHOT_NOT_IMPLEMENTED_TODOS = {
    "normalizedPseudocode": "Normalized pseudocode serialization is not implemented.",
    "loopInvariant": "Loop invariant extraction is not implemented.",
    "symbolicRecurrenceTree": "Full symbolic recurrence tree reconstruction is not implemented.",
}
