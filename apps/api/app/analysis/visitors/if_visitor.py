# apps/api/app/analysis/visitors/if_visitor.py

from typing import Any, Dict, List, Optional
from sympy import Integer, Expr


class IfVisitor:
    """
    Visitor que implementa las reglas específicas para condicionales IF.
    
    Implementa:
    - Guardia del if: siempre se evalúa una vez
    - Rama THEN: líneas internas, ya multiplicadas por bucles activos
    - Rama ELSE: igual que THEN (si existe)
    - En peor caso: tomar la rama dominante (la que "cuesta más")
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
    
    def visitIf(self, node: Dict[str, Any], mode: str = "worst") -> None:
        """
        Visita un nodo IF y aplica las reglas de análisis.
        
        Args:
            node: Nodo IF del AST
            mode: Modo de análisis ("worst", "best", "avg")
        """
        # Extraer información del nodo IF
        line = node.get("pos", {}).get("line", 0)
        consequent = node.get("consequent")  # bloque THEN
        alternate = node.get("alternate")  # bloque ELSE (opcional)
        
        # 1) Guardia: siempre se evalúa una vez
        ck_guard = self.C()  # generar siguiente constante
        self.add_row(
            line=line,
            kind="if",
            ck=ck_guard,
            count=Integer(1),
            note="Evaluación de la condición"
        )
        
        # Helper para ejecutar un bloque y extraer solo las filas nuevas
        def run_block_to_buffer(block_node):
            # Guardar estado de rows para extraer solo lo nuevo
            start = len(self.rows)
            # Visitar el bloque sobre el mismo contexto (loop_stack se respeta)
            if block_node:
                self.visit(block_node, mode)
            # Extraer lo recién agregado
            new_rows = self.rows[start:]
            # Removerlos de rows para decidir luego qué rama se queda
            self.rows = self.rows[:start]
            return new_rows
        
        # 2) THEN y 3) ELSE -> buffers
        then_buf = run_block_to_buffer(consequent)
        else_buf = run_block_to_buffer(alternate)
        
        # 4) Elegir rama dominante (worst)
        if mode == "worst":
            # Helper para detectar si una rama contiene early returns
            def has_early_return(rows):
                for row in rows:
                    if row.get("kind") in ("return", "break") and row.get("count") != "1":
                        return True
                return False
            
            if not else_buf:
                # Si no hay else, verificar si then tiene early return
                if has_early_return(then_buf):
                    chosen = []  # No ejecutar early return en worst case
                    annotate = "worst: no early-exit"
                else:
                    chosen = then_buf
                    annotate = "worst: then (no else)"
            else:
                # Verificar early returns en ambas ramas
                then_has_early = has_early_return(then_buf)
                else_has_early = has_early_return(else_buf)
                
                if then_has_early and not else_has_early:
                    chosen = else_buf
                    annotate = "worst: no early-exit (else)"
                elif else_has_early and not then_has_early:
                    chosen = then_buf
                    annotate = "worst: no early-exit (then)"
                else:
                    # Heurística simple: más filas => más "peso"
                    chosen = then_buf if len(then_buf) >= len(else_buf) else else_buf
                    annotate = "worst: max(then, else)"
            
            # Anotar en la primera fila elegida
            if chosen:
                chosen[0] = {**chosen[0], "note": annotate}
            self.rows.extend(chosen)

