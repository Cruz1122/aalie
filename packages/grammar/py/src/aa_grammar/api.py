from typing import Any, Dict, List, Tuple
from antlr4 import InputStream, CommonTokenStream  # type: ignore
from .generated.LanguageLexer import LanguageLexer  # type: ignore
from .generated.LanguageParser import LanguageParser  # type: ignore
from .error_listener import CollectingErrorListener
from .ast_builder import ASTBuilder

def parse_to_ast(source: str) -> Tuple[Dict[str, Any] | None, List[Dict[str, Any]]]:
    chars = InputStream(source)
    lexer = LanguageLexer(chars)
    lex_err = CollectingErrorListener()
    lexer.removeErrorListeners()
    lexer.addErrorListener(lex_err)

    tokens = CommonTokenStream(lexer)
    parser = LanguageParser(tokens)
    par_err = CollectingErrorListener()
    parser.removeErrorListeners()
    parser.addErrorListener(par_err)

    tree = parser.program()
    errors = lex_err.errors + par_err.errors

    try:
        # Usar el ASTBuilder para construir un AST limpio
        ast = ASTBuilder().visit(tree)
    except Exception as e:  # AST puede fallar si el árbol está incompleto
        errors.append({"line": 1, "column": 1, "message": f"AST error: {e}"})
        ast = None

    return ast, errors
