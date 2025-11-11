# apps/api/app/analysis/visitors/if_visitor.py

from typing import Any, Dict, List, Optional
from sympy import Integer, Expr, Symbol, Mul, Rational


class IfVisitor:
    """
    Visitor que implementa las reglas específicas para condicionales IF.
    
    Implementa:
    - Guardia del if: siempre se evalúa una vez
    - Rama THEN: líneas internas, ya multiplicadas por bucles activos
    - Rama ELSE: igual que THEN (si existe)
    - En peor caso: tomar la rama dominante (la que "cuesta más")
    - En mejor caso: 
        * Si no hay ELSE y no hay early return: NO ejecutar THEN (condición falsa)
        * Si hay early return: ejecutar la rama con early return (termina temprano)
        * Si hay ELSE: elegir la rama con menor costo
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
        
        # Helper para multiplicar count_raw_expr por probabilidad (definido antes de usarlo)
        def multiply_by_probability(rows, prob_expr, prob_str, branch_name):
            """Multiplica el count_raw_expr de cada fila por la probabilidad."""
            from sympy import latex as sympy_latex
            multiplied_rows = []
            for row in rows:
                new_row = dict(row)
                # Obtener count_raw_expr si existe
                count_expr = new_row.get("count_raw_expr")
                if count_expr is None:
                    # Fallback: convertir desde count_raw
                    if hasattr(self, '_str_to_sympy'):
                        count_expr = self._str_to_sympy(new_row.get("count_raw", "1"))
                    else:
                        count_expr = Integer(1)
                
                # Multiplicar por probabilidad
                new_count_expr = Mul(count_expr, prob_expr)
                new_row["count_raw_expr"] = new_count_expr
                
                # Actualizar count_raw (LaTeX) para reflejar la probabilidad
                try:
                    new_count_raw_latex = sympy_latex(new_count_expr)
                    new_row["count_raw"] = new_count_raw_latex
                    # También actualizar expectedRuns para caso promedio
                    if hasattr(self, 'mode') and self.mode == "avg":
                        new_row["expectedRuns"] = new_count_raw_latex
                except:
                    # Si falla la conversión, dejar el count_raw original
                    pass
                
                # Actualizar nota para indicar probabilidad
                old_note = new_row.get("note", "")
                if old_note:
                    new_row["note"] = f"avg: {branch_name}, p={prob_str}"
                else:
                    new_row["note"] = f"avg: {branch_name}, p={prob_str}"
                
                multiplied_rows.append(new_row)
            return multiplied_rows
        
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
        
        elif mode == "best":
            # Helper para detectar si una rama contiene early returns
            # Un early return es un return o break que está dentro de un bucle
            def has_early_return(rows):
                # Verificar si hay bucles activos (multiplicadores en el stack)
                has_active_loops = hasattr(self, 'loop_stack') and len(self.loop_stack) > 0
                
                for row in rows:
                    # Si es un return o break, y hay bucles activos, es un early return
                    if row.get("kind") in ("return", "break"):
                        # Si hay bucles activos, es un early return (puede terminar el bucle temprano)
                        # Si no hay bucles, también puede ser un early return (termina la función temprano)
                        # En best case, cualquier return es favorable
                        return True
                return False
            
            if not else_buf:
                # Si no hay else, en best case la condición es falsa (no se ejecuta el THEN)
                # EXCEPTO si hay early return, que es favorable (termina temprano)
                if has_early_return(then_buf):
                    chosen = then_buf  # Ejecutar early return en best case (favorable)
                    annotate = "best: early-exit (then)"
                else:
                    # En best case sin early return: condición falsa → NO ejecutar THEN
                    chosen = []
                    annotate = "best: condition false (no then, no else)"
            else:
                # Verificar early returns en ambas ramas
                then_has_early = has_early_return(then_buf)
                else_has_early = has_early_return(else_buf)
                
                # En best case, preferir ramas con early return (permiten salir temprano)
                if then_has_early and not else_has_early:
                    chosen = then_buf
                    annotate = "best: early-exit (then)"
                elif else_has_early and not then_has_early:
                    chosen = else_buf
                    annotate = "best: early-exit (else)"
                else:
                    # Si ambas tienen early return o ninguna, elegir la que tiene menos filas
                    # Menos filas => menor costo => mejor caso
                    chosen = then_buf if len(then_buf) <= len(else_buf) else else_buf
                    if then_has_early or else_has_early:
                        annotate = "best: min(then, else) with early-exit"
                    else:
                        annotate = "best: min(then, else)"
            
            # Anotar en la primera fila elegida (si hay alguna)
            if chosen:
                chosen[0] = {**chosen[0], "note": annotate}
            self.rows.extend(chosen)
        
        elif mode == "avg":
            # Caso promedio: verificar si estamos en un bucle con early return
            # En Modelo A (éxito seguro): el IF siempre entra en THEN, no aplicar probabilidades
            has_active_loop = hasattr(self, 'loop_stack') and len(self.loop_stack) > 0
            has_early_return = False
            
            if has_active_loop:
                # Verificar si alguna rama tiene return (early return)
                has_return_then = any(row.get("kind") == "return" for row in then_buf)
                has_return_else = any(row.get("kind") == "return" for row in else_buf)
                has_early_return = has_return_then or has_return_else
            
            if has_early_return:
                # Modelo A: éxito seguro (Pr(éxito) = 1)
                # El IF siempre entra en la rama con return (éxito)
                # No aplicar probabilidades, solo tomar la rama de éxito
                if then_buf and any(row.get("kind") == "return" for row in then_buf):
                    # THEN tiene return (éxito): siempre se ejecuta
                    for row in then_buf:
                        # No multiplicar por probabilidad, mantener count_raw_expr original
                        # Solo agregar nota si no tiene una ya
                        if not row.get("note"):
                            row["note"] = "avg: éxito seguro"
                    self.rows.extend(then_buf)
                elif else_buf and any(row.get("kind") == "return" for row in else_buf):
                    # ELSE tiene return (fracaso): nunca se ejecuta en Modelo A
                    # No agregar filas de else_buf
                    pass
                else:
                    # No hay return en ninguna rama, aplicar probabilidades normales
                    # Obtener probabilidad p del avg_model
                    if not hasattr(self, 'avg_model') or self.avg_model is None:
                        p_sympy = Rational(1, 2)
                        p_str = "1/2"
                    else:
                        test = node.get("test", {})
                        condition_str = self._expr_to_str(test)
                        context = None
                        if hasattr(self, 'loop_stack') and self.loop_stack:
                            from sympy import Sum
                            last_mult = self.loop_stack[-1]
                            if isinstance(last_mult, Sum):
                                var_sym = last_mult.args[1][0]
                                if hasattr(var_sym, 'name'):
                                    context = {"loop_var": var_sym.name}
                        p_str = self.avg_model.get_probability(condition_str, context)
                        p_sympy = self.avg_model.get_probability_sympy(condition_str, context)
                    
                    # Aplicar probabilidades normalmente
                    if then_buf:
                        then_multiplied = multiply_by_probability(then_buf, p_sympy, p_str, "then")
                        self.rows.extend(then_multiplied)
                    if else_buf:
                        one_minus_p_sympy = Integer(1) - p_sympy
                        one_minus_p_str = f"1-{p_str}" if p_str != "1/2" else "1/2"
                        else_multiplied = multiply_by_probability(else_buf, one_minus_p_sympy, one_minus_p_str, "else")
                        self.rows.extend(else_multiplied)
                return
            
            # Caso promedio normal: ambas ramas se ejecutan con probabilidades
            # Obtener probabilidad p del avg_model
            if not hasattr(self, 'avg_model') or self.avg_model is None:
                # Fallback: usar 1/2 por defecto
                p_sympy = Rational(1, 2)
                p_str = "1/2"
            else:
                # Obtener condición como string para buscar predicado
                test = node.get("test", {})
                condition_str = self._expr_to_str(test)
                
                # Obtener contexto (variable de bucle actual si existe)
                context = None
                if hasattr(self, 'loop_stack') and self.loop_stack:
                    # Intentar obtener variable del bucle más interno
                    from sympy import Sum
                    last_mult = self.loop_stack[-1]
                    if isinstance(last_mult, Sum):
                        var_sym = last_mult.args[1][0]
                        if hasattr(var_sym, 'name'):
                            context = {"loop_var": var_sym.name}
                
                # Obtener probabilidad del modelo
                p_str = self.avg_model.get_probability(condition_str, context)
                p_sympy = self.avg_model.get_probability_sympy(condition_str, context)
            
            # Aplicar probabilidades a ambas ramas
            # THEN: p * #visitas, ELSE: (1-p) * #visitas
            
            # Procesar THEN con probabilidad p
            if then_buf:
                then_multiplied = multiply_by_probability(then_buf, p_sympy, p_str, "then")
                self.rows.extend(then_multiplied)
            
            # Procesar ELSE con probabilidad (1-p)
            if else_buf:
                # Calcular (1-p)
                one_minus_p_sympy = Integer(1) - p_sympy
                one_minus_p_str = f"1-{p_str}" if p_str != "1/2" else "1/2"
                else_multiplied = multiply_by_probability(else_buf, one_minus_p_sympy, one_minus_p_str, "else")
                self.rows.extend(else_multiplied)
            
            # Si no hay else, no hay nada más que hacer (then ya se agregó con probabilidad p)

