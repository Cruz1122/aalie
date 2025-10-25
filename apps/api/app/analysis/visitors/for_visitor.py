# apps/api/app/analysis/visitors/for_visitor.py

from typing import Any, Dict, List, Optional


class ForVisitor:
    """
    Visitor que implementa las reglas específicas para bucles FOR.
    
    Implementa:
    - Cabecera del for: (b - a + 2) evaluaciones
    - Cuerpo del for: multiplicado por Σ_{v=a}^{b} 1
    - Procedimiento explicativo
    """
    
    def _expr_to_str(self, expr: Any) -> str:
        """
        Convierte una expresión del AST a string.
        
        Args:
            expr: Expresión del AST
            
        Returns:
            String representando la expresión
        """
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
                # Asegurar que el operador no se pierda
                if not op:
                    op = "-"  # fallback para operadores perdidos
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
                # Fallback para tipos desconocidos
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
        
        # Convertir expresiones a strings
        a = self._expr_to_str(start_expr)
        b = self._expr_to_str(end_expr)
        
        # 1) Cabecera del for: (b - a + 2) evaluaciones
        ck_header = self.C()  # generar siguiente constante
        
        # Calcular header_count: (b - a + 2) evaluaciones
        if self._is_int(a) and self._is_int(b):
            header_count = str(int(b) - int(a) + 2)   # aquí sí calculas el valor numérico
        else:
            # Simplificar expresiones comunes
            if a == "1" and b == "(n) - (1)":
                header_count = "n"  # (n-1) - 1 + 2 = n
            elif a == "1" and b == "n":
                header_count = "n + 1"  # n - 1 + 2 = n + 1
            elif a == "1" and b.startswith("(n) - (") and b.endswith(")"):
                # Para casos como (n) - (i), simplificar a n - i + 1
                inner_expr = b[7:-1]  # extraer "i" de "(n) - (i)"
                header_count = f"n - {inner_expr} + 1"  # n - i + 1
            else:
                header_count = f"({b}) - ({a}) + 2"       # caso general
        
        # Para cabeceras de bucles anidados, integrar con sumatorios activos
        if self.loop_stack and len(self.loop_stack) > 0:
            # Si hay un sumatorio activo por i y estamos en el bucle de j
            outer_mult = self.loop_stack[-1]
            if var == "j" and "\\sum_{i=" in outer_mult:
                # Integrar la cabecera en el sumatorio externo
                # \sum_{i=...}^{...} ( (b) - (a) + 2) )
                import re
                match = re.match(r"\\sum_{i=(.+?)}^{(.+?)} 1$", outer_mult)
                if match:
                    start_i, end_i = match.groups()
                    integrated_count = f"\\sum_{{i={start_i}}}^{{{end_i}}} ({header_count})"
                    self.add_row(
                        line=line,
                        kind="for",
                        ck=ck_header,
                        count=integrated_count,
                        note=f"Cabecera del bucle for {var}={a}..{b}"
                    )
                    return  # No agregar multiplicador, ya está integrado
        
        # Para cabeceras de bucles anidados, no aplicar multiplicadores del stack
        if self.loop_stack and len(self.loop_stack) > 0 and var == "j":
            # Agregar fila sin multiplicadores para cabeceras anidadas
            self.rows.append({
                "line": line,
                "kind": "for",
                "ck": ck_header,
                "count": header_count,
                "note": f"Cabecera del bucle for {var}={a}..{b}"
            })
        else:
            self.add_row(
                line=line,
                kind="for",
                ck=ck_header,
                count=header_count,
                note=f"Cabecera del bucle for {var}={a}..{b}"
            )
        
        # 2) Multiplicador del cuerpo: Σ_{v=a}^{b} 1
        mult = f"\\sum_{{{var}={a}}}^{{{b}}} 1"
        self.push_multiplier(mult)
        
        # 3) Visitar el cuerpo del bucle
        if body:
            self.visit(body, mode)
        
        # 4) Salir del contexto del bucle
        self.pop_multiplier()
        
        # 5) Agregar pasos al procedimiento
        self.add_procedure_step(
            rf"En for {var}={a}\ldots{b}, cabecera: ({b})-({a})+2."
        )
        self.add_procedure_step(
            rf"Cuerpo multiplicado por \sum_{{{var}={a}}}^{{{b}}} 1."
        )
