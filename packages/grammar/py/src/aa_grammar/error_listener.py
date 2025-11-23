from antlr4.error.ErrorListener import ErrorListener  # type: ignore
from typing import List, Dict, Any

class CollectingErrorListener(ErrorListener):
    def __init__(self) -> None:
        super().__init__()
        self.errors: List[Dict[str, Any]] = []

    def syntaxError(self, recognizer, offendingSymbol, line, column, msg, e):
        # ANTLR: line base 1, column base 0 → normalizar a base 1
        self.errors.append({
            "line": int(line),
            "column": int(column) + 1,
            "message": str(msg),
        })
