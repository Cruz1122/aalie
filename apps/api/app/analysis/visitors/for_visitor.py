# apps/api/app/analysis/visitors/for_visitor.py

from typing import Any, Dict, List, Optional
from sympy import Symbol, Sum, Integer, Expr


class ForVisitor:
    """
    Visitor que implementa las reglas específicas para bucles FOR.
    
    Implementa:
    - Cabecera del for: (b - a + 2) evaluaciones (worst case)
    - Cuerpo del for: multiplicado por Σ_{v=a}^{b} 1 (worst case)
    - Best case con early return: cabecera = 2, multiplicador = 1 (solo primera iteración)
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
    
    def _ast_expr_to_readable_str(self, expr: Any) -> str:
        """
        Convierte una expresión del AST a string legible para notas.
        Esto es más confiable que convertir desde SymPy porque preserva el orden original.
        
        Args:
            expr: Expresión del AST
            
        Returns:
            String legible representando la expresión
        """
        if expr is None:
            return ""
        elif isinstance(expr, str):
            return expr
        elif isinstance(expr, (int, float)):
            return str(expr)
        elif isinstance(expr, dict):
            expr_type = expr.get("type", "").lower() if isinstance(expr.get("type"), str) else ""
            
            if expr_type == "identifier":
                return expr.get("name", "unknown")
            elif expr_type == "number":
                return str(expr.get("value", "0"))
            elif expr_type == "literal":
                value = expr.get("value", "0")
                # Manejar valores booleanos y None
                if value is True:
                    return "TRUE"
                elif value is False:
                    return "FALSE"
                elif value is None:
                    return "NULL"
                return str(value)
            elif expr_type == "binary":
                left = self._ast_expr_to_readable_str(expr.get("left", ""))
                right = self._ast_expr_to_readable_str(expr.get("right", ""))
                # Intentar obtener el operador de múltiples campos posibles
                op = expr.get("operator", "") or expr.get("op", "")
                if not op:
                    op = "-"  # Default
                
                # Para operadores binarios, formatear legiblemente
                if op == "+":
                    return f"{left} + {right}"
                elif op == "-":
                    return f"{left} - {right}"
                elif op == "*":
                    return f"{left} * {right}"
                elif op == "/":
                    return f"{left} / {right}"
                elif op in ["<", ">", "<=", ">=", "==", "!=", "="]:
                    return f"{left} {op} {right}"
                else:
                    return f"{left} {op} {right}"
            elif expr_type == "index":
                target = self._ast_expr_to_readable_str(expr.get("target", ""))
                index = self._ast_expr_to_readable_str(expr.get("index", ""))
                return f"{target}[{index}]"
            elif expr_type == "unary":
                arg = self._ast_expr_to_readable_str(expr.get("arg", ""))
                op = expr.get("operator", "") or expr.get("op", "")
                if op == "-":
                    return f"-{arg}"
                elif op == "+":
                    return f"+{arg}"
                return f"{op}{arg}" if op else str(arg)
            else:
                # Fallback: intentar obtener un valor o representar el tipo
                if "value" in expr:
                    return str(expr["value"])
                # Si no hay valor, intentar representar el tipo o el dict completo como último recurso
                if expr_type:
                    return expr_type
                # Último recurso: convertir a string (puede mostrar el dict completo)
                return str(expr)
        else:
            return str(expr)
    
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
        
        # Fallback: usar método legible
        return self._ast_expr_to_readable_str(expr)
    
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
    
    def _has_return_in_body(self, body_node: Dict[str, Any]) -> bool:
        """
        Detecta si un bloque de código contiene un return.
        Busca recursivamente en el AST.
        
        Args:
            body_node: Nodo del cuerpo a analizar
            
        Returns:
            True si contiene un return, False en caso contrario
        """
        if body_node is None:
            return False
        
        if not isinstance(body_node, dict):
            return False
        
        node_type = body_node.get("type", "").lower()
        
        # Si es un return, encontrado
        if node_type == "return":
            return True
        
        # Si es un bloque, buscar en sus hijos
        if node_type == "block":
            for stmt in body_node.get("body", []):
                if self._has_return_in_body(stmt):
                    return True
        
        # Si es un IF, buscar en ambas ramas
        elif node_type == "if":
            consequent = body_node.get("consequent")
            alternate = body_node.get("alternate")
            if self._has_return_in_body(consequent) or self._has_return_in_body(alternate):
                return True
        
        # Si es un FOR, WHILE, REPEAT, buscar en el cuerpo
        elif node_type in ("for", "while", "repeat"):
            body = body_node.get("body")
            if self._has_return_in_body(body):
                return True
        
        # Buscar en campos comunes
        for key in ["body", "consequent", "alternate", "value"]:
            if key in body_node:
                child = body_node[key]
                if isinstance(child, dict):
                    if self._has_return_in_body(child):
                        return True
                elif isinstance(child, list):
                    for item in child:
                        if isinstance(item, dict) and self._has_return_in_body(item):
                            return True
        
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
        
        # Generar strings para la nota desde el AST original (más confiable que desde SymPy)
        # Esto evita problemas de representación cuando SymPy reordena términos
        a_str = self._ast_expr_to_readable_str(start_expr)
        b_str = self._ast_expr_to_readable_str(end_expr)
        
        # Detectar si el cuerpo tiene returns (para best case)
        has_return = False
        if mode == "best" and body:
            has_return = self._has_return_in_body(body)
        
        # 1) Cabecera del for
        ck_header = self.C()  # generar siguiente constante
        
        if mode == "best" and has_return:
            # En best case con early return: solo se evalúa la condición inicial y una vez más (2 evaluaciones)
            # Evaluación inicial + 1 evaluación de condición = 2
            header_count = Integer(2)
            header_note = f"Cabecera del bucle for {var}={a_str}..{b_str} (best: early return en primera iteración)"
        else:
            # Cabecera normal: (b - a + 2) evaluaciones
            # La cabecera se evalúa: evaluación inicial + b - a evaluaciones de condición + 1 final = (b - a + 2)
            try:
                if isinstance(a_expr, Integer) and isinstance(b_expr, Integer):
                    header_count = Integer(int(b_expr) - int(a_expr) + 2)
                else:
                    # Generar expresión general: (b - a + 2)
                    header_count = b_expr - a_expr + Integer(2)
            except:
                # Fallback: expresión general
                header_count = b_expr - a_expr + Integer(2)
            header_note = f"Cabecera del bucle for {var}={a_str}..{b_str}"
        
        # Para cabeceras de bucles anidados, usar add_row para generar count_raw correctamente
        # add_row aplicará los multiplicadores del stack automáticamente
        self.add_row(
            line=line,
            kind="for",
            ck=ck_header,
            count=header_count,
            note=header_note
        )
        
        # 2) Multiplicador del cuerpo
        if mode == "best" and has_return:
            # En best case con early return: solo 1 iteración (el return se ejecuta en la primera)
            mult = Integer(1)
        else:
            # Multiplicador normal: Σ_{v=a}^{b} 1
            # El cuerpo se ejecuta (b - a + 1) veces (iteraciones)
            # Sum(1, (var, a, b)) suma desde a hasta b inclusive = (b - a + 1) iteraciones
            var_sym = Symbol(var, integer=True)
            mult = Sum(Integer(1), (var_sym, a_expr, b_expr))
        
        self.push_multiplier(mult)
        
        # 3) Visitar el cuerpo del bucle
        if body:
            self.visit(body, mode)
        
        # 4) Salir del contexto del bucle
        self.pop_multiplier()
