from typing import Any
from sympy import Symbol, Integer, sympify, Expr


class ExprConverter:
    """
    Convierte expresiones del AST a expresiones SymPy.
    
    Maneja:
    - Identificadores (variables)
    - Números literales
    - Operaciones binarias (+, -, *, /)
    - Operaciones unarias (-, +)
    - Expresiones indexadas (arrays)
    
    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """
    
    def __init__(self, variable: str = "n"):
        """
        Inicializa el convertidor.
        
        Args:
            variable: Variable principal del algoritmo (por defecto "n")
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        self.variable = variable
        # Crear símbolos comunes con tipos apropiados
        self.symbols = {
            variable: Symbol(variable, integer=True, positive=True),
            'i': Symbol('i', integer=True),
            'j': Symbol('j', integer=True),
            'k': Symbol('k', integer=True),
            'm': Symbol('m', integer=True, positive=True),
        }
    
    def ast_to_sympy(self, expr: Any) -> Expr:
        """
        Convierte una expresión del AST a SymPy.
        
        Args:
            expr: Expresión del AST (puede ser dict, str, int, float, None)
            
        Returns:
            Expresión SymPy
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        if expr is None:
            return Integer(0)
        
        elif isinstance(expr, (int, float)):
            return Integer(int(expr)) if isinstance(expr, int) else sympify(expr)
        
        elif isinstance(expr, str):
            # Si es un string, intentar parsearlo como expresión SymPy
            # Primero verificar si es un número
            try:
                return Integer(int(expr))
            except ValueError:
                try:
                    return sympify(float(expr))
                except ValueError:
                    # Es un identificador o expresión
                    if expr in self.symbols:
                        return self.symbols[expr]
                    # Intentar crear un símbolo nuevo
                    return Symbol(expr, real=True)
        
        elif isinstance(expr, dict):
            expr_type = expr.get("type", "").lower()
            
            if expr_type == "identifier":
                name = expr.get("name", "unknown")
                if name in self.symbols:
                    return self.symbols[name]
                # Crear símbolo nuevo si no existe
                return Symbol(name, real=True)
            
            elif expr_type == "number":
                value = expr.get("value", 0)
                return Integer(int(value)) if isinstance(value, int) else sympify(value)
            
            elif expr_type == "literal":
                value = expr.get("value", 0)
                return Integer(int(value)) if isinstance(value, int) else sympify(value)
            
            elif expr_type == "binary":
                left = self.ast_to_sympy(expr.get("left"))
                right = self.ast_to_sympy(expr.get("right"))
                # Intentar obtener el operador de múltiples campos posibles
                op = expr.get("operator", "") or expr.get("op", "")
                
                if op == "+":
                    return left + right
                elif op == "-":
                    return left - right
                elif op == "*":
                    return left * right
                elif op == "/":
                    return left / right
                elif op == "**" or op == "^":
                    return left ** right
                elif op == "%":
                    return left % right
                else:
                    # Fallback: tratar como resta (pero esto puede ser un error)
                    # Mejor retornar la expresión sin modificar o lanzar un error
                    print(f"[ExprConverter] Warning: operador desconocido '{op}' en expresión binaria, usando resta como fallback")
                    return left - right
            
            elif expr_type == "unary":
                arg = self.ast_to_sympy(expr.get("arg"))
                op = expr.get("operator", "")
                
                if op == "-":
                    return -arg
                elif op == "+":
                    return arg
                else:
                    return arg
            
            elif expr_type == "index":
                # Para expresiones indexadas como A[i], tratamos el índice como expresión
                # pero no podemos hacer mucho más sin contexto del array
                # target = self.ast_to_sympy(expr.get("target", ""))  # No usado actualmente
                index = self.ast_to_sympy(expr.get("index", ""))
                # Retornar solo el índice como expresión (el array no afecta el conteo)
                return index
            
            else:
                # Fallback: intentar obtener un valor
                if "value" in expr:
                    value = expr["value"]
                    return self.ast_to_sympy(value)
                # Si no hay valor, retornar 0
                return Integer(0)
        
        else:
            # Fallback final: convertir a string y parsear
            try:
                return sympify(str(expr))
            except Exception:
                return Integer(0)
    
    def get_symbol(self, name: str) -> Symbol:
        """
        Obtiene o crea un símbolo SymPy para un nombre dado.
        
        Args:
            name: Nombre del símbolo
            
        Returns:
            Símbolo SymPy
        """
        if name in self.symbols:
            return self.symbols[name]
        
        # Crear nuevo símbolo
        symbol = Symbol(name, real=True)
        self.symbols[name] = symbol
        return symbol

