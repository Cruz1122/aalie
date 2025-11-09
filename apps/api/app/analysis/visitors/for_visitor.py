# apps/api/app/analysis/visitors/for_visitor.py

from typing import Any, Dict, List, Optional
from sympy import Symbol, Sum, Integer, Expr


class ForVisitor:
    """
    Visitor que implementa las reglas específicas para bucles FOR.
    
    Implementa:
    - Cabecera del for: (b - a + 2) evaluaciones
    - Cuerpo del for: multiplicado por Σ_{v=a}^{b} 1
    - Procedimiento explicativo
    """
    
    def _expr_to_sympy(self, expr: Any) -> Expr:
        """
        Convierte una expresión del AST a SymPy.
        
        Args:
            expr: Expresión del AST
            
        Returns:
            Expresión SymPy
        """
        # Usar el método de BaseAnalyzer si está disponible
        if hasattr(self, 'expr_converter'):
            return self.expr_converter.ast_to_sympy(expr)
        # Fallback: usar método de BaseAnalyzer si existe
        if hasattr(self, '_expr_to_sympy') and callable(getattr(super(), '_expr_to_sympy', None)):
            return super()._expr_to_sympy(expr)
        # Último fallback: convertir a string y luego a SymPy
        return self._str_to_sympy(self._expr_to_str(expr))
    
    def _str_to_sympy(self, expr_str: str) -> Expr:
        """
        Convierte un string a expresión SymPy.
        
        Args:
            expr_str: String representando una expresión
            
        Returns:
            Expresión SymPy
        """
        from sympy import sympify, Symbol, Integer
        
        if not expr_str or expr_str.strip() == "":
            return Integer(1)
        
        try:
            # Crear contexto con símbolos comunes
            variable = getattr(self, 'variable', 'n')
            n = Symbol(variable, integer=True, positive=True)
            i = Symbol('i', integer=True)
            j = Symbol('j', integer=True)
            k = Symbol('k', integer=True)
            
            syms = {
                variable: n,
                'i': i,
                'j': j,
                'k': k,
            }
            
            return sympify(expr_str, locals=syms)
        except:
            return Integer(1)
    
    def _expr_to_str(self, expr: Any) -> str:
        """
        Convierte una expresión del AST a string (método legacy, usar _expr_to_sympy).
        
        Args:
            expr: Expresión del AST
            
        Returns:
            String representando la expresión
        """
        # Si hay un método _expr_to_sympy, usarlo y convertir a string
        if hasattr(self, '_expr_to_sympy'):
            sympy_expr = self._expr_to_sympy(expr)
            return str(sympy_expr)
        
        # Fallback al método original
        if expr is None:
            return ""
        elif isinstance(expr, str):
            return expr
        elif isinstance(expr, (int, float)):
            return str(expr)
        elif isinstance(expr, dict):
            expr_type = expr.get("type", "")
            
            if expr_type == "identifier":
                return expr.get("name", "unknown")
            elif expr_type == "number":
                return str(expr.get("value", "0"))
            elif expr_type == "literal":
                return str(expr.get("value", "0"))
            elif expr_type == "binary":
                left = self._expr_to_str(expr.get("left", ""))
                right = self._expr_to_str(expr.get("right", ""))
                op = expr.get("operator", "")
                if not op:
                    op = "-"
                return f"({left}) {op} ({right})"
            elif expr_type == "index":
                target = self._expr_to_str(expr.get("target", ""))
                index = self._expr_to_str(expr.get("index", ""))
                return f"{target}[{index}]"
            elif expr_type == "unary":
                arg = self._expr_to_str(expr.get("arg", ""))
                op = expr.get("operator", "")
                return f"{op}({arg})"
            else:
                return str(expr.get("value", str(expr)))
        else:
            return str(expr)
    
    def _is_int(self, value: str) -> bool:
        """
        Verifica si un string representa un entero.
        
        Args:
            value: String a verificar
            
        Returns:
            True si el string representa un entero, False en caso contrario
        """
        try:
            int(value)
            return True
        except (ValueError, TypeError):
            return False
    
    def visitFor(self, node: Dict[str, Any], mode: str = "worst") -> None:
        """
        Visita un nodo FOR y aplica las reglas de análisis.
        
        Args:
            node: Nodo FOR del AST
            mode: Modo de análisis ("worst", "best", "avg")
        """
        # Extraer información del nodo FOR
        line = node.get("pos", {}).get("line", 0)
        var = node.get("var", "i")  # variable del bucle
        start_expr = node.get("start")  # expresión de inicio
        end_expr = node.get("end")  # expresión de fin
        body = node.get("body")  # cuerpo del bucle
        
        # Convertir expresiones a SymPy
        a_expr = self._expr_to_sympy(start_expr)
        b_expr = self._expr_to_sympy(end_expr)
        
        # Convertir también a strings para notas y comparaciones
        a_str = str(a_expr)
        b_str = str(b_expr)
        
        # 1) Cabecera del for: (b - a + 2) evaluaciones
        ck_header = self.C()  # generar siguiente constante
        
        # Calcular header_count: (b - a + 2) evaluaciones
        # Intentar evaluar numéricamente si es posible
        try:
            if isinstance(a_expr, Integer) and isinstance(b_expr, Integer):
                header_count = Integer(int(b_expr) - int(a_expr) + 2)
            else:
                # Generar expresión general
                header_count = b_expr - a_expr + Integer(2)
        except:
            # Fallback: expresión general
            header_count = b_expr - a_expr + Integer(2)
        
        # Para cabeceras de bucles anidados, usar add_row para generar count_raw correctamente
        # add_row aplicará los multiplicadores del stack automáticamente
        self.add_row(
            line=line,
            kind="for",
            ck=ck_header,
            count=header_count,
            note=f"Cabecera del bucle for {var}={a_str}..{b_str}"
        )
        
        # 2) Multiplicador del cuerpo: Σ_{v=a}^{b} 1
        var_sym = Symbol(var, integer=True)
        mult = Sum(Integer(1), (var_sym, a_expr, b_expr))
        self.push_multiplier(mult)
        
        # 3) Visitar el cuerpo del bucle
        if body:
            self.visit(body, mode)
        
        # 4) Salir del contexto del bucle
        self.pop_multiplier()
