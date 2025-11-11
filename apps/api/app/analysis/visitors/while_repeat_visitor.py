# apps/api/app/analysis/visitors/while_repeat_visitor.py

from typing import Any, Dict, List, Optional
from sympy import Symbol, Integer, Expr, sympify, Sum, Rational, latex
import re


class WhileRepeatVisitor:
    """
    Visitor que implementa las reglas específicas para bucles WHILE y REPEAT.
    
    Implementa:
    - WHILE: condición se evalúa (t_{while_L} + 1) veces, cuerpo se multiplica por t_{while_L}
    - REPEAT: cuerpo se multiplica por (1 + t_{repeat_L}), condición se evalúa (1 + t_{repeat_L}) veces
    - Análisis de cierre de WHILE: identifica variable de control, regla de cambio y calcula iteraciones
    """
    
    def iter_sym(self, kind: str, line: int) -> str:
        """
        Genera símbolos de iteración deterministas.
        
        Args:
            kind: Tipo de bucle ("while" o "repeat")
            line: Número de línea donde empieza el ciclo
            
        Returns:
            String con el símbolo de iteración (ej: "t_{while_5}", "t_{repeat_10}")
        """
        return rf"t_{{{kind}_{line}}}"
    
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
            
            if expr_type.lower() == "identifier":
                return expr.get("name", "unknown")
            elif expr_type.lower() in ("number", "literal"):
                return str(expr.get("value", "0"))
            elif expr_type.lower() == "binary":
                left = self._expr_to_str(expr.get("left", ""))
                right = self._expr_to_str(expr.get("right", ""))
                # El AST usa 'op' no 'operator'
                op = expr.get("op", "") or expr.get("operator", "")
                if not op:
                    op = "-"
                return f"({left}) {op} ({right})"
            elif expr_type.lower() == "index":
                target = self._expr_to_str(expr.get("target", ""))
                index = self._expr_to_str(expr.get("index", ""))
                return f"{target}[{index}]"
            elif expr_type.lower() == "unary":
                arg = self._expr_to_str(expr.get("arg", ""))
                op = expr.get("operator", "")
                return f"{op}({arg})"
            else:
                return str(expr.get("value", str(expr)))
        else:
            return str(expr)
    
    def _str_to_sympy(self, expr_str: str) -> Expr:
        """
        Convierte un string a expresión SymPy.
        
        Args:
            expr_str: String representando una expresión
            
        Returns:
            Expresión SymPy
        """
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
    
    def _extract_condition_info(self, test: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Extrae información de la condición del WHILE.
        
        Args:
            test: Nodo de la condición del WHILE
            
        Returns:
            Diccionario con variable, límite y operador, o None si no se puede analizar
        """
        if not isinstance(test, dict):
            print(f"[While Closure] _extract_condition_info: test no es dict, es {type(test)}")
            return None
        
        expr_type = test.get("type", "")
        expr_type_lower = expr_type.lower()
        print(f"[While Closure] _extract_condition_info: expr_type={expr_type}")
        
        # El AST usa 'op' no 'operator'
        op = test.get("op", "") or test.get("operator", "")
        print(f"[While Closure] _extract_condition_info: operator={op}")
        
        # Si es una condición compuesta con AND/OR, analizar recursivamente
        if op.lower() in ("and", "or", "&&", "||"):
            print(f"[While Closure] _extract_condition_info: Condición compuesta con {op}, analizando partes")
            # Intentar analizar la parte izquierda primero
            left = test.get("left", {})
            if isinstance(left, dict):
                left_info = self._extract_condition_info(left)
                if left_info:
                    print(f"[While Closure] _extract_condition_info: Encontrada condición simple en left: {left_info}")
                    return left_info
            
            # Si left no funciona, intentar right
            right = test.get("right", {})
            if isinstance(right, dict):
                right_info = self._extract_condition_info(right)
                if right_info:
                    print(f"[While Closure] _extract_condition_info: Encontrada condición simple en right: {right_info}")
                    return right_info
            
            # Si ninguna parte es analizable, fallback
            print(f"[While Closure] _extract_condition_info: No se pudo analizar ninguna parte de la condición compuesta")
            return None
        
        # Solo analizar condiciones Binary simples (puede ser "Binary" o "binary")
        if expr_type_lower != "binary":
            print(f"[While Closure] _extract_condition_info: No es binary, es {expr_type}")
            return None
        
        # Solo operadores de comparación simples
        if op not in ("<", "<=", ">", ">=", "=", "==", "<>", "!="):
            print(f"[While Closure] _extract_condition_info: Operador no válido: {op}")
            return None
        
        left = test.get("left", {})
        right = test.get("right", {})
        
        # Identificar variable de control (debe ser un Identifier simple)
        left_str = self._expr_to_str(left)
        right_str = self._expr_to_str(right)
        
        # Verificar si alguno es un identificador simple (variable)
        left_is_var = isinstance(left, dict) and left.get("type", "").lower() == "identifier"
        right_is_var = isinstance(right, dict) and right.get("type", "").lower() == "identifier"
        
        # Determinar variable y límite
        if left_is_var and not right_is_var:
            # Caso: i < n
            var_name = left.get("name", "")
            limit = right_str
            variable_side = "left"
        elif right_is_var and not left_is_var:
            # Caso: n > i (equivalente a i < n)
            var_name = right.get("name", "")
            limit = left_str
            # Invertir operador
            op_map = {">": "<", ">=": "<=", "<": ">", "<=": ">=", "=": "=", "==": "=", "<>": "<>", "!=": "<>"}
            op = op_map.get(op, op)
            variable_side = "right"
        else:
            # Ambos son variables o ninguno es variable simple
            return None
        
        if not var_name:
            return None
        
        return {
            "variable": var_name,
            "limit": limit,
            "operator": op,
            "variable_side": variable_side
        }
    
    def _find_assignments_to_var(self, node: Dict[str, Any], var_name: str, assignments: List[Dict[str, Any]]) -> None:
        """
        Busca recursivamente asignaciones a la variable de control en el cuerpo.
        
        Args:
            node: Nodo del AST a analizar
            var_name: Nombre de la variable de control
            assignments: Lista donde se acumulan las asignaciones encontradas
        """
        if not isinstance(node, dict):
            return
        
        node_type = node.get("type", "").lower()
        
        # Si es una asignación, verificar si es a la variable de control
        if node_type == "assign":
            target = node.get("target", {})
            value = node.get("value", {})
            
            # Verificar si el target es la variable de control
            if isinstance(target, dict) and target.get("type", "").lower() == "identifier":
                if target.get("name", "") == var_name:
                    assignments.append({
                        "target": target,
                        "value": value,
                        "node": node
                    })
        
        # Buscar recursivamente en hijos
        if node_type == "block":
            for stmt in node.get("body", []):
                self._find_assignments_to_var(stmt, var_name, assignments)
        elif node_type == "if":
            # Buscar en ramas THEN y ELSE
            consequent = node.get("consequent")
            alternate = node.get("alternate")
            if consequent:
                self._find_assignments_to_var(consequent, var_name, assignments)
            if alternate:
                self._find_assignments_to_var(alternate, var_name, assignments)
        elif node_type in ("while", "repeat", "for"):
            # No buscar dentro de bucles anidados (solo el bucle actual)
            pass
        else:
            # Buscar en otros campos comunes
            for key in ["body", "consequent", "alternate", "value", "left", "right", "arg"]:
                if key in node:
                    child = node[key]
                    if isinstance(child, dict):
                        self._find_assignments_to_var(child, var_name, assignments)
                    elif isinstance(child, list):
                        for item in child:
                            if isinstance(item, dict):
                                self._find_assignments_to_var(item, var_name, assignments)
    
    def _analyze_body_for_variable_change(self, body: Dict[str, Any], var_name: str) -> Optional[Dict[str, Any]]:
        """
        Analiza el cuerpo del WHILE para encontrar asignaciones a la variable de control.
        
        Args:
            body: Nodo del cuerpo del WHILE
            var_name: Nombre de la variable de control
            
        Returns:
            Diccionario con change_rule e initial_value, o None si no se encuentra
        """
        if not isinstance(body, dict):
            return None
        
        # Buscar todas las asignaciones a la variable de control recursivamente
        assignments = []
        self._find_assignments_to_var(body, var_name, assignments)
        
        print(f"[While Closure] _analyze_body_for_variable_change: Encontradas {len(assignments)} asignaciones a {var_name}")
        
        if not assignments:
            return None
        
        change_rules = []
        initial_value = None
        
        # Analizar cada asignación encontrada
        for assign in assignments:
            value = assign["value"]
            value_str = self._expr_to_str(value)
            
            # Intentar analizar expresiones binarias directamente
            if isinstance(value, dict) and value.get("type", "").lower() == "binary":
                # El AST usa 'op' no 'operator'
                val_op = value.get("op", "") or value.get("operator", "")
                val_left = value.get("left", {})
                val_right = value.get("right", {})
                
                # Verificar si left o right es la variable
                if isinstance(val_left, dict) and val_left.get("type", "").lower() == "identifier":
                    if val_left.get("name", "") == var_name:
                        # i op constante
                        if val_op in ("+", "-", "*", "/"):
                            const_val = self._expr_to_str(val_right)
                            # Verificar si la constante es numérica simple
                            if self._is_simple_constant(const_val):
                                change_rules.append({
                                    "operator": val_op,
                                    "constant": const_val,
                                    "expression": value_str
                                })
                elif isinstance(val_right, dict) and val_right.get("type", "").lower() == "identifier":
                    if val_right.get("name", "") == var_name:
                        # constante op i (solo para + y *)
                        if val_op in ("+", "*"):
                            const_val = self._expr_to_str(val_left)
                            if self._is_simple_constant(const_val):
                                change_rules.append({
                                    "operator": val_op,
                                    "constant": const_val,
                                    "expression": value_str
                                })
            else:
                # Intentar con patrones regex como fallback
                patterns = [
                    (rf"\({re.escape(var_name)}\)\s*\+\s*(\d+)", "+"),  # i + 1
                    (rf"\({re.escape(var_name)}\)\s*-\s*(\d+)", "-"),  # i - 1
                    (rf"\({re.escape(var_name)}\)\s*\*\s*(\d+)", "*"),  # i * 2
                    (rf"\({re.escape(var_name)}\)\s*/\s*(\d+)", "/"),  # i / 2
                    (rf"{re.escape(var_name)}\s*\+\s*(\d+)", "+"),  # i + 1 (sin paréntesis)
                    (rf"{re.escape(var_name)}\s*-\s*(\d+)", "-"),  # i - 1 (sin paréntesis)
                    (rf"{re.escape(var_name)}\s*\*\s*(\d+)", "*"),  # i * 2 (sin paréntesis)
                    (rf"{re.escape(var_name)}\s*/\s*(\d+)", "/"),  # i / 2 (sin paréntesis)
                ]
                
                for pattern, op in patterns:
                    match = re.search(pattern, value_str)
                    if match:
                        const = match.group(1)
                        change_rules.append({
                            "operator": op,
                            "constant": const,
                            "expression": value_str
                        })
                        break
        
        if not change_rules:
            print(f"[While Closure] _analyze_body_for_variable_change: No se encontraron reglas de cambio válidas")
            return None
        
        # Si hay múltiples reglas de cambio, usar la primera
        # En el futuro se podría mejorar para detectar el peor caso o la más común
        change_rule = change_rules[0]
        print(f"[While Closure] _analyze_body_for_variable_change: Regla de cambio seleccionada: {change_rule}")
        
        return {
            "change_rule": change_rule,
            "initial_value": initial_value  # None por ahora, se usará variable simbólica
        }
    
    def _is_simple_constant(self, expr: str) -> bool:
        """
        Verifica si una expresión es una constante simple (número).
        
        Args:
            expr: Expresión a verificar
            
        Returns:
            True si es una constante simple, False en caso contrario
        """
        try:
            float(expr)
            return True
        except (ValueError, TypeError):
            return False
    
    def _calculate_iterations(self, var_name: str, initial: Optional[str], change_rule: Dict[str, Any], limit: str, operator: str) -> Optional[str]:
        """
        Calcula el número de iteraciones basándose en valor inicial, regla de cambio, límite y operador.
        
        Args:
            var_name: Nombre de la variable de control
            initial: Valor inicial de la variable (None si no se conoce)
            change_rule: Diccionario con operator y constant
            limit: Límite de la condición
            operator: Operador de comparación
            
        Returns:
            Expresión del número de iteraciones, o None si no se puede calcular
        """
        op = change_rule.get("operator", "")
        const = change_rule.get("constant", "1")
        
        # Si no hay valor inicial, usar variable simbólica
        initial_expr = initial if initial else f"{var_name}_0"
        
        # Solo manejar cambios lineales simples por ahora
        if op == "+":
            # i <- i + c, condición i < n
            if operator in ("<", "<="):
                # Iteraciones: (n - i_0) / c (aproximado)
                if const == "1":
                    return f"({limit}) - ({initial_expr})"
                else:
                    return f"(({limit}) - ({initial_expr})) / ({const})"
            elif operator in (">", ">="):
                # i <- i + c, condición i > n (poco común)
                return None
        elif op == "-":
            # i <- i - c, condición i > n
            if operator in (">", ">="):
                # Iteraciones: (i_0 - n) / c
                if const == "1":
                    return f"({initial_expr}) - ({limit})"
                else:
                    return f"(({initial_expr}) - ({limit})) / ({const})"
            elif operator in ("<", "<="):
                # i <- i - c, condición i < n (poco común)
                return None
        elif op == "*":
            # i <- i * c, condición i < n
            # Iteraciones: log_c(n / i_0)
            if operator in ("<", "<="):
                return f"\\log_{{{const}}}(({limit}) / ({initial_expr}))"
        elif op == "/":
            # i <- i / c, condición i > n
            # Iteraciones: log_c(i_0 / n)
            if operator in (">", ">="):
                return f"\\log_{{{const}}}(({initial_expr}) / ({limit}))"
        
        return None
    
    def _analyze_while_closure(self, node: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Analiza el cierre de un bucle WHILE.
        
        Args:
            node: Nodo WHILE del AST
            
        Returns:
            Diccionario con información del cierre, o None si no se puede analizar
        """
        test = node.get("test", {})
        body = node.get("body", {})
        
        # Debug: verificar estructura del nodo
        print(f"[While Closure] Analizando WHILE, test type: {type(test)}, body type: {type(body)}")
        if isinstance(test, dict):
            print(f"[While Closure] test keys: {list(test.keys()) if isinstance(test, dict) else 'N/A'}")
        if isinstance(body, dict):
            print(f"[While Closure] body keys: {list(body.keys()) if isinstance(body, dict) else 'N/A'}")
        
        # 1) Extraer información de la condición
        condition_info = self._extract_condition_info(test)
        if not condition_info:
            print(f"[While Closure] No se pudo extraer información de la condición")
            if isinstance(test, dict):
                print(f"[While Closure] test type: {test.get('type', 'unknown')}")
            return None
        
        print(f"[While Closure] Condición extraída: variable={condition_info['variable']}, limit={condition_info['limit']}, operator={condition_info['operator']}")
        
        var_name = condition_info["variable"]
        limit = condition_info["limit"]
        operator = condition_info["operator"]
        
        # 2) Analizar el cuerpo para encontrar cambios a la variable
        body_info = self._analyze_body_for_variable_change(body, var_name)
        if not body_info:
            print(f"[While Closure] No se encontró cambio a la variable {var_name} en el cuerpo")
            return None
        
        print(f"[While Closure] Cambio encontrado: operator={body_info['change_rule']['operator']}, constant={body_info['change_rule']['constant']}")
        
        change_rule = body_info["change_rule"]
        initial_value = body_info["initial_value"]
        
        # 3) Calcular iteraciones
        iterations = self._calculate_iterations(var_name, initial_value, change_rule, limit, operator)
        if not iterations:
            print(f"[While Closure] No se pudo calcular iteraciones")
            return None
        
        print(f"[While Closure] Iteraciones calculadas: {iterations}")
        
        return {
            "variable": var_name,
            "initial_value": initial_value,
            "change_rule": change_rule,
            "limit": limit,
            "operator": operator,
            "iterations": iterations,
            "success": True
        }
    
    def _get_while_exit_probability(self, node: Dict[str, Any]) -> Optional[tuple]:
        """
        Obtiene la probabilidad de salida del WHILE desde el avgModel.
        
        Args:
            node: Nodo WHILE del AST
        
        Returns:
            Tupla (p_sympy, p_str) si se encuentra, None si no
        """
        if not hasattr(self, 'avg_model') or self.avg_model is None:
            return None
        
        # Obtener condición del while
        test = node.get("test", {})
        condition_str = self._expr_to_str(test)
        
        # Buscar predicado relacionado con la condición de salida
        # Por ejemplo, si la condición es "i < n", buscar "i >= n" o "salir del while"
        exit_predicate = f"salir del while: {condition_str}"
        
        # Obtener contexto
        context = None
        if hasattr(self, 'loop_stack') and self.loop_stack:
            last_mult = self.loop_stack[-1]
            if isinstance(last_mult, Sum):
                var_sym = last_mult.args[1][0]
                if hasattr(var_sym, 'name'):
                    context = {"loop_var": var_sym.name}
        
        # Intentar obtener probabilidad
        try:
            p_str = self.avg_model.get_probability(exit_predicate, context)
            p_sympy = self.avg_model.get_probability_sympy(exit_predicate, context)
            return (p_sympy, p_str)
        except:
            # Si no se encuentra, intentar con la condición inversa
            try:
                # Para condición "i < n", la probabilidad de salir podría ser modelada como
                # la probabilidad de que "i >= n" (condición falsa)
                p_str = self.avg_model.get_probability(condition_str, context)
                p_sympy = self.avg_model.get_probability_sympy(condition_str, context)
                # Si obtenemos una probabilidad, asumir que es la probabilidad de que la condición sea falsa (salir)
                return (p_sympy, p_str)
            except:
                return None
    
    def visitWhile(self, node: Dict[str, Any], mode: str = "worst") -> None:
        """
        Visita un bucle WHILE y aplica las reglas de análisis.
        
        Args:
            node: Nodo WHILE del AST
            mode: Modo de análisis
        """
        L = node.get("pos", {}).get("line", 0)
        t = self.iter_sym("while", L)
        
        # Para modo promedio, intentar obtener probabilidad de salida
        if mode == "avg":
            exit_prob = self._get_while_exit_probability(node)
            if exit_prob:
                p_sympy, p_str = exit_prob
                # E[#iteraciones] = 1/p para proceso geométrico
                from sympy import Pow
                try:
                    # Calcular 1/p
                    if isinstance(p_sympy, Rational):
                        # Si p es una fracción, calcular 1/p directamente
                        iterations_expr = Rational(1) / p_sympy
                    else:
                        # Si p es un símbolo, usar 1/p simbólico
                        iterations_expr = Pow(p_sympy, -1)
                    
                    # Multiplicador para el cuerpo
                    mult_expr = iterations_expr
                    
                    # Si hay multiplicadores externos, integrar
                    if hasattr(self, 'loop_stack') and self.loop_stack:
                        outer_mult = self.loop_stack[-1]
                        if isinstance(outer_mult, Sum):
                            var_sym = outer_mult.args[1][0]
                            start_expr = outer_mult.args[1][1]
                            end_expr = outer_mult.args[1][2]
                            mult_expr = Sum(iterations_expr, (var_sym, start_expr, end_expr))
                        else:
                            mult_expr = iterations_expr * outer_mult
                    
                    # Condición: se evalúa (iterations + 1) veces
                    ck_cond = self.C()
                    cond_count = iterations_expr + Integer(1)
                    self.add_row(
                        line=L,
                        kind="while",
                        ck=ck_cond,
                        count=cond_count,
                        note=f"Condición del bucle while en línea {L} (avg: E[#] = 1/p, p={p_str})"
                    )
                    
                    # Cuerpo: se ejecuta E[#iteraciones] veces
                    self.push_multiplier(mult_expr)
                    
                    body = node.get("body")
                    if body:
                        self.visit(body, mode)
                    
                    self.pop_multiplier()
                    return
                except Exception as e:
                    print(f"[WhileRepeatVisitor] Error calculando E[#iteraciones] = 1/p: {e}")
                    # Fallback: usar símbolo
        
        # Intentar analizar el cierre del WHILE (para worst/best o fallback de avg)
        closure_info = self._analyze_while_closure(node)
        
        if closure_info and closure_info.get("success"):
            # Análisis exitoso: usar expresiones concretas
            iterations = closure_info["iterations"]
            var_name = closure_info["variable"]
            change_rule = closure_info["change_rule"]
            limit = closure_info["limit"]
            operator = closure_info["operator"]
            
            # Convertir iteraciones a sumatoria para el multiplicador
            # Si iterations es algo como "n - i_0", usar sumatoria: \sum_{k=0}^{iterations-1} 1
            # O simplemente usar la expresión directamente si es simple
            # Por ahora, usar la expresión directamente como multiplicador
            # Convertir iterations (string) a SymPy
            try:
                iterations_expr = sympify(iterations)
            except:
                # Fallback: usar string y convertir después
                iterations_expr = self._str_to_sympy(iterations)
            
            mult_expr = iterations_expr
            
            # Si hay multiplicadores externos (anidado), integrar
            if self.loop_stack:
                # Integrar con multiplicadores externos
                outer_mult = self.loop_stack[-1]
                
                # outer_mult ahora es un objeto SymPy (Sum o Expr)
                if isinstance(outer_mult, Sum):
                    # Es una sumatoria, envolver iterations_expr dentro
                    var_sym = outer_mult.args[1][0]  # Variable de la sumatoria
                    start_expr = outer_mult.args[1][1]  # Límite inferior
                    end_expr = outer_mult.args[1][2]  # Límite superior
                    mult_expr = Sum(iterations_expr, (var_sym, start_expr, end_expr))
                else:
                    # Es una expresión multiplicativa
                    mult_expr = iterations_expr * outer_mult
            
            # 1) Condición: se evalúa (iterations + 1) veces
            ck_cond = self.C()
            # Usar iterations_expr que ya convertimos arriba
            cond_count = iterations_expr + Integer(1)
            self.add_row(
                line=L,
                kind="while",
                ck=ck_cond,
                count=cond_count,
                note=f"Condición del bucle while en línea {L}"
            )
            
            # 2) Cuerpo: se ejecuta iterations veces
            # mult_expr ya es una expresión SymPy
            self.push_multiplier(mult_expr)
            
            # Visitar el cuerpo del bucle
            body = node.get("body")
            if body:
                self.visit(body, mode)
            
            self.pop_multiplier()
            
            # 3) Procedimiento con información del cierre (ahora manejado por LLM)
            change_op = change_rule.get("operator", "")
            change_const = change_rule.get("constant", "1")
            initial_val = closure_info.get("initial_value") or f"{var_name}_0"
        else:
            # Fallback: usar símbolo simbólico
            if mode == "avg":
                # En promedio, usar símbolo t̄_while_L (esperanza)
                t_bar = f"\\bar{{t}}_{{while_{L}}}"
                t_sym = Symbol(f"t_bar_while_{L}", real=True, positive=True)
                note_text = f"Condición del bucle while en línea {L} (avg: E[#] = {t_bar})"
            else:
                # En worst/best, usar símbolo t_while_L
                t_sym = Symbol(t, real=True)
                note_text = f"Condición del bucle while en línea {L}"
            
            # 1) Condición: se evalúa (t + 1) veces
            ck_cond = self.C()  # C_{k} para evaluar la condición
            cond_count = t_sym + Integer(1)
            self.add_row(
                line=L,
                kind="while",
                ck=ck_cond,
                count=cond_count,
                note=note_text
            )
            
            # 2) Cuerpo: se ejecuta t veces
            self.push_multiplier(t_sym)  # multiplicador simbólico
            
            # Visitar el cuerpo del bucle
            body = node.get("body")
            if body:
                self.visit(body, mode)
            
            self.pop_multiplier()
    
    def visitRepeat(self, node: Dict[str, Any], mode: str = "worst") -> None:
        """
        Visita un bucle REPEAT y aplica las reglas de análisis.
        
        Args:
            node: Nodo REPEAT del AST
            mode: Modo de análisis
        """
        L = node.get("pos", {}).get("line", 0)
        t = self.iter_sym("repeat", L)
        t_sym = Symbol(t, real=True)
        
        # 1) Cuerpo: al menos 1 vez -> (1 + t_{repeat_L})
        mult_expr = Integer(1) + t_sym
        self.push_multiplier(mult_expr)
        
        # Visitar el cuerpo del bucle
        body = node.get("body")
        if body:
            self.visit(body, mode)
        
        self.pop_multiplier()
        
        # 2) Condición: se evalúa también (1 + t_{repeat_L}) veces
        ck_cond = self.C()
        cond_count = Integer(1) + t_sym
        self.add_row(
            line=L,
            kind="repeat",
            ck=ck_cond,
            count=cond_count,
            note=f"Condición del bucle repeat en línea {L}"
        )
