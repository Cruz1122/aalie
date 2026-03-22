# apps/api/app/analysis/visitors/while_repeat_visitor.py

from typing import Any, Dict, List, Optional

from sympy import Symbol, Integer, Expr, sympify, Sum, Rational
import re

from ..ir.expr_utils import expr_to_str
from ..while_engine import analyze_guard, summarize_updates, classify_while
from ..while_engine.engine import WhileEngine, WhileAnalysisInput, WhileAnalysisResult


class WhileRepeatVisitor:
    """
    Visitor que implementa las reglas específicas para bucles WHILE y REPEAT.
    
    Implementa:
    - WHILE: condición se evalúa (t_{while_L} + 1) veces, cuerpo se multiplica por t_{while_L}
    - REPEAT: cuerpo se multiplica por (1 + t_{repeat_L}), condición se evalúa (1 + t_{repeat_L}) veces
    - Análisis de cierre de WHILE: identifica variable de control, regla de cambio y calcula iteraciones
    
    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """
    
    def iter_sym(self, kind: str, line: int) -> str:
        """
        Genera símbolos de iteración deterministas.
        
        Args:
            kind: Tipo de bucle ("while" o "repeat")
            line: Número de línea donde empieza el ciclo
            
        Returns:
            String con el símbolo de iteración (ej: "t_{while_5}", "t_{repeat_10}")
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        return rf"t_{{{kind}_{line}}}"
    
    def _expr_to_str(self, expr: Any) -> str:
        """Delega a expr_to_str del módulo ir.expr_utils."""
        return expr_to_str(expr)

    def _str_to_sympy(self, expr_str: str) -> Expr:
        """
        Convierte un string a expresión SymPy.
        Soporta LaTeX: \\log_{k}(expr), etc.
        
        Args:
            expr_str: String representando una expresión
            
        Returns:
            Expresión SymPy
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        import re

        if not expr_str or expr_str.strip() == "":
            return Integer(1)

        expr_str = expr_str.strip()

        # Preprocesar LaTeX: \\log_{base}(arg) -> log(arg, base)
        log_match = re.search(r"\\log_\{([^}]+)\}\s*\(", expr_str)
        if log_match:
            start = log_match.end()
            depth, i = 1, start
            while i < len(expr_str) and depth > 0:
                if expr_str[i] == "(":
                    depth += 1
                elif expr_str[i] == ")":
                    depth -= 1
                i += 1
            arg = expr_str[start : i - 1]
            expr_str = (
                expr_str[: log_match.start()]
                + f"log({arg}, {log_match.group(1)})"
                + expr_str[i:]
            )
        expr_str = re.sub(r"\\log\s*\(([^)]+)\)", r"log(\1)", expr_str)
        expr_str = re.sub(r"\\frac\{([^}]+)\}\{([^}]+)\}", r"(\1)/(\2)", expr_str)
        expr_str = expr_str.replace("\\cdot", "*")

        try:
            from sympy import log as sympy_log, Min as sympy_Min, Max as sympy_Max

            variable = getattr(self, "variable", "n")
            n = Symbol(variable, integer=True, positive=True)
            i = Symbol("i", integer=True)
            j = Symbol("j", integer=True)
            k = Symbol("k", integer=True)
            # Evitar colisión con sympy.N (evalf). Tratar N como símbolo.
            N_sym = Symbol("N", integer=True, positive=True)
            # Símbolos para parámetros de tamaño habituales (evitar fallo en log(exp), log(e_0), etc.)
            exp_sym = Symbol("exp", integer=True, positive=True)
            m_sym = Symbol("m", integer=True, positive=True)
            e0_sym = Symbol("e_0", integer=True, positive=True)

            syms = {
                variable: n,
                "i": i,
                "j": j,
                "k": k,
                "N": N_sym,
                "log": sympy_log,
                "Min": sympy_Min,
                "Max": sympy_Max,
                "exp": exp_sym,
                "m": m_sym,
                "e_0": e0_sym,
            }

            return sympify(expr_str, locals=syms)
        except Exception:
            return Integer(1)
    
    def _extract_condition_info(self, test: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Extrae información de la condición del WHILE.
        
        Ahora soporta:
        - Condiciones simples: i < n
        - Condiciones de convergencia: izq <= der
        - Condiciones compuestas: (i < n) AND (A[i] > 0)
        
        Args:
            test: Nodo de la condición del WHILE
            
        Returns:
            Diccionario con variable(s), límite y operador, o None si no se puede analizar
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        if not isinstance(test, dict):
            return None
        
        expr_type = test.get("type", "")
        expr_type_lower = expr_type.lower()
        
        # El AST usa 'op' no 'operator'
        op = test.get("op", "") or test.get("operator", "")
        
        # Si es una condición compuesta con AND/OR, analizar recursivamente
        if op.lower() in ("and", "or", "&&", "||"):
            # Intentar analizar la parte izquierda primero
            left = test.get("left", {})
            if isinstance(left, dict):
                left_info = self._extract_condition_info(left)
                if left_info:
                    # Marcar que es parte de una condición compuesta
                    left_info["compound"] = True
                    return left_info
            
            # Si left no funciona, intentar right
            right = test.get("right", {})
            if isinstance(right, dict):
                right_info = self._extract_condition_info(right)
                if right_info:
                    right_info["compound"] = True
                    return right_info
            
            # Si ninguna parte es analizable, fallback
            return None
        
        # Solo analizar condiciones Binary simples (puede ser "Binary" o "binary")
        if expr_type_lower != "binary":
            return None
        
        # Solo operadores de comparación simples
        if op not in ("<", "<=", ">", ">=", "=", "==", "<>", "!="):
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
        elif left_is_var and right_is_var:
            # Ambos son variables: posible patrón de convergencia (izq <= der)
            # Retornar información de ambas variables para análisis de patrón
            return {
                "variable": left.get("name", ""),
                "variable2": right.get("name", ""),
                "limit": right.get("name", ""),  # usar variable2 como límite
                "operator": op,
                "variable_side": "left",
                "two_variables": True
            }
        else:
            # Ninguno es variable simple
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
    
    def _find_initial_value_of_var(self, var_name: str, while_line: int, parent_context: Optional[Dict[str, Any]] = None) -> Optional[str]:
        """
        Busca el valor inicial de la variable de control antes del while.
        
        Args:
            var_name: Nombre de la variable de control
            while_line: Línea donde empieza el while
            parent_context: Contexto del bloque padre que contiene el while
            
        Returns:
            Expresión del valor inicial, o None si no se encuentra
        """
        # Buscar en el contexto padre (bloque que contiene el while)
        if parent_context:
            assignments = []
            self._find_assignments_before_line(parent_context, var_name, while_line, assignments)
            
            if assignments:
                # Tomar la última asignación encontrada (la más cercana al while)
                last_assign = assignments[-1]
                value = last_assign.get("value")
                if value:
                    return self._expr_to_str(value)
        
        # Fallback: buscar en todo el AST raíz si está disponible
        root_ast = getattr(self, 'root_ast', None)
        if root_ast:
            assignments = []
            self._find_assignments_before_line(root_ast, var_name, while_line, assignments)
            if assignments:
                last_assign = assignments[-1]
                value = last_assign.get("value")
                if value:
                    return self._expr_to_str(value)
                    
        # Si hay un loop_stack activo (FOR anidado)...
        
        return None
    
    def _find_assignments_before_line(self, node: Dict[str, Any], var_name: str, target_line: int, assignments: List[Dict[str, Any]]) -> None:
        """
        Busca asignaciones a una variable que ocurren antes de una línea específica.
        
        Args:
            node: Nodo del AST a analizar
            var_name: Nombre de la variable
            target_line: Línea objetivo (solo asignaciones antes de esta línea)
            assignments: Lista donde se acumulan las asignaciones encontradas
        """
        if not isinstance(node, dict):
            return
        
        node_type = node.get("type", "").lower()
        
        # Si es un bloque, buscar en sus statements
        if node_type == "block":
            for stmt in node.get("body", []):
                if not isinstance(stmt, dict):
                    continue
                
                # Verificar la línea del statement
                stmt_line = stmt.get("pos", {}).get("line", 0)
                
                # Si la línea es mayor o igual a target_line, no seguir buscando
                # (ya pasamos el while)
                if stmt_line > 0 and stmt_line >= target_line:
                    break
                
                # Si es una asignación a la variable, agregarla
                if stmt.get("type", "").lower() == "assign":
                    target = stmt.get("target", {})
                    if isinstance(target, dict) and target.get("type", "").lower() == "identifier":
                        if target.get("name", "") == var_name:
                            assignments.append({
                                "target": target,
                                "value": stmt.get("value", {}),
                                "node": stmt,
                                "line": stmt_line
                            })
                else:
                    # Buscar recursivamente en otros tipos de nodos
                    self._find_assignments_before_line(stmt, var_name, target_line, assignments)
        else:
            # Buscar en otros campos comunes
            for key in ["body", "consequent", "alternate"]:
                if key in node:
                    child = node[key]
                    if isinstance(child, dict):
                        self._find_assignments_before_line(child, var_name, target_line, assignments)
                    elif isinstance(child, list):
                        for item in child:
                            if isinstance(item, dict):
                                self._find_assignments_before_line(item, var_name, target_line, assignments)
    
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
            return None
        
        # Si hay múltiples reglas de cambio, usar la primera
        # En el futuro se podría mejorar para detectar el peor caso o la más común
        change_rule = change_rules[0]
        
        return {
            "change_rule": change_rule,
            "initial_value": initial_value  # Se buscará en el contexto padre
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
    
    def _detect_convergence_pattern(self, node: Dict[str, Any], var_name: str, body: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Detecta patrones de convergencia conocidos como búsqueda binaria.
        
        Patrones detectados:
        - Búsqueda binaria: izq <= der, mitad = (izq + der) / 2
        
        Args:
            node: Nodo WHILE completo
            var_name: Variable de control detectada
            body: Cuerpo del WHILE
            
        Returns:
            Diccionario con patrón detectado y complejidad, o None
        """
        test = node.get("test", {})
        test_str = self._expr_to_str(test)
        
        # Patrón búsqueda binaria:
        # - Condición: izq <= der (o left <= right, low <= high, etc.)
        # - Actualización: mitad = (izq + der) / 2, luego izq = mitad +/- 1 o der = mitad -/+ 1
        
        # Buscar variables en la condición (debería haber 2 variables para convergencia)
        condition_vars = []
        if isinstance(test, dict):
            left = test.get("left", {})
            right = test.get("right", {})
            
            if isinstance(left, dict) and left.get("type", "").lower() == "identifier":
                condition_vars.append(left.get("name", ""))
            if isinstance(right, dict) and right.get("type", "").lower() == "identifier":
                condition_vars.append(right.get("name", ""))
        
        # Si hay exactamente 2 variables, puede ser convergencia
        if len(condition_vars) == 2:
            var1, var2 = condition_vars
            
            # Buscar asignación de mitad en el cuerpo
            # Patrón: mitad <- (var1 + var2) / 2 o (var1 + var2) // 2
            has_midpoint = False
            midpoint_var = None
            
            # Buscar asignaciones en el cuerpo
            if isinstance(body, dict) and body.get("type", "").lower() == "block":
                for stmt in body.get("body", []):
                    if isinstance(stmt, dict) and stmt.get("type", "").lower() == "assign":
                        target = stmt.get("target", {})
                        value = stmt.get("value", {})
                        
                        if isinstance(target, dict) and target.get("type", "").lower() == "identifier":
                            target_name = target.get("name", "")
                            
                            # Verificar si es mitad = (var1 + var2) / 2 o // 2
                            # Verificar estructura del nodo directamente
                            if isinstance(value, dict) and value.get("type", "").lower() == "binary":
                                op = value.get("op", "")
                                if op in ("/", "//", "div"):
                                    left_part = value.get("left", {})
                                    right_part = value.get("right", {})
                                    
                                    # Verificar que right_part sea 2 (o algún entero)
                                    if isinstance(right_part, dict) and right_part.get("type", "").lower() == "literal":
                                        divisor = right_part.get("value")
                                        if divisor == 2 or divisor == "2":
                                            # Verificar que left_part sea (var1 + var2)
                                            if isinstance(left_part, dict) and left_part.get("type", "").lower() == "binary":
                                                inner_op = left_part.get("op", "")
                                                if inner_op == "+":
                                                    inner_left = left_part.get("left", {})
                                                    inner_right = left_part.get("right", {})
                                                    
                                                    # Verificar que ambos sean var1 y var2
                                                    left_name = inner_left.get("name", "") if isinstance(inner_left, dict) else ""
                                                    right_name = inner_right.get("name", "") if isinstance(inner_right, dict) else ""
                                                    
                                                    if {left_name, right_name} == {var1, var2}:
                                                        has_midpoint = True
                                                        midpoint_var = target_name
                                                        break
            
            # Si encontramos el patrón de mitad, es búsqueda binaria
            if has_midpoint and midpoint_var:
                return {
                    "pattern": "binary_search",
                    "complexity": "log(n)",
                    "variables": [var1, var2],
                    "midpoint_var": midpoint_var,
                    "note": self._note("binary_search_pattern", var1=var1, var2=var2, midpoint_var=midpoint_var)
                }
        
        return None
    
    def _has_early_exit_condition(self, test: Dict[str, Any], var_name: str) -> bool:
        """
        Detecta si la condición del WHILE puede ser falsa desde el inicio en best case.
        
        Esto ocurre cuando la condición tiene una parte AND con una comparación que no depende
        solo de la variable de control (por ejemplo, comparaciones de arrays).
        
        Args:
            test: Nodo de la condición del WHILE
            var_name: Nombre de la variable de control
            
        Returns:
            True si la condición puede ser falsa desde el inicio en best case
        """
        if not isinstance(test, dict):
            return False
        
        test_type = test.get("type", "").lower()
        operator = (test.get("op", "") or test.get("operator", "")).lower()
        
        # Si es un AND, verificar si alguna parte puede ser falsa desde el inicio
        if test_type in ("binary", "binaryop") and operator in ("and", "&&"):
            left = test.get("left", {})
            right = test.get("right", {})
            
            # Verificar si alguna parte tiene una comparación con arrays u otras variables
            # (no solo la variable de control)
            left_has_non_control = self._has_non_control_comparison(left, var_name)
            right_has_non_control = self._has_non_control_comparison(right, var_name)
            
            if left_has_non_control or right_has_non_control:
                return True
        
        # Si es una comparación que no es solo con la variable de control
        if test_type in ("binary", "binaryop") and operator in (">", "<", ">=", "<=", "==", "!=", "=", "<>"):
            if self._has_non_control_comparison(test, var_name):
                return True
        
        return False
    
    def _is_positive_prefix_guard(self, test: Dict[str, Any], var_name: str) -> bool:
        """
        Detecta el patrón específico de prefijo positivo:
        WHILE (i <= n AND A[i] > 0)
        
        En este caso, bajo un modelo razonable donde la probabilidad de A[i] > 0
        no tiende a 1 con n, la esperanza de iteraciones es O(1).
        """
        if not isinstance(test, dict):
            return False
        
        test_type = test.get("type", "").lower()
        op = (test.get("op", "") or test.get("operator", "")).lower()
        if test_type not in ("binary", "binaryop") or op not in ("and", "&&"):
            return False
        
        left = test.get("left", {})
        right = test.get("right", {})
        
        def is_var_leq_limit(node: Dict[str, Any]) -> bool:
            if not isinstance(node, dict):
                return False
            nt = node.get("type", "").lower()
            if nt not in ("binary", "binaryop"):
                return False
            op2 = node.get("op", "") or node.get("operator", "")
            if op2 not in ("<", "<="):
                return False
            l = node.get("left", {})
            if not (isinstance(l, dict) and l.get("type", "").lower() == "identifier"):
                return False
            return l.get("name", "") == var_name
        
        def is_array_gt_zero(node: Dict[str, Any]) -> bool:
            if not isinstance(node, dict):
                return False
            nt = node.get("type", "").lower()
            if nt not in ("binary", "binaryop"):
                return False
            op3 = node.get("op", "") or node.get("operator", "")
            if op3 not in (">", ">="):
                return False
            l = node.get("left", {})
            r = node.get("right", {})
            # Lado izquierdo: acceso a array A[i]
            if not (isinstance(l, dict) and l.get("type", "").lower() == "index"):
                return False
            index = l.get("index", {})
            if not (isinstance(index, dict) and index.get("type", "").lower() == "identifier"):
                return False
            if index.get("name", "") != var_name:
                return False
            # Lado derecho: constante 0
            if not isinstance(r, dict):
                return False
            rt = r.get("type", "").lower()
            if rt not in ("number", "literal"):
                return False
            val = r.get("value", 0)
            try:
                return float(val) == 0.0
            except Exception:
                return False
        
        return (is_var_leq_limit(left) and is_array_gt_zero(right)) or (
            is_var_leq_limit(right) and is_array_gt_zero(left)
        )

    def _is_linear_search_flag_pattern(
        self, test: Dict[str, Any], body: Any, var_name: str
    ) -> bool:
        """
        Detecta búsqueda lineal con flag: WHILE (i < n AND encontrado = false)
        con IF (A[i] = x) THEN encontrado <- true en el cuerpo.
        En best case: 1 iteración (encuentra x en la primera posición).
        """
        if not isinstance(test, dict) or not body:
            return False
        op = (test.get("op") or test.get("operator", "")).lower()
        if op not in ("and", "&&"):
            return False
        left = test.get("left", {})
        right = test.get("right", {})

        def _is_flag_eq_false(expr: Dict[str, Any]) -> bool:
            """True si expr es una comparación (id = false) o (false = id)."""
            if not isinstance(expr, dict):
                return False
            t = expr.get("type", "").lower()
            if t not in ("binary", "binaryop"):
                return False
            op2 = (expr.get("op") or expr.get("operator", "")).lower()
            if op2 not in ("=", "=="):
                return False
            l, r = expr.get("left", {}), expr.get("right", {})
            for node in (l, r):
                if not isinstance(node, dict):
                    continue
                nt = node.get("type", "").lower()
                if nt in ("literal", "number"):
                    if node.get("value") is False or node.get("value") == 0:
                        return True
                elif nt == "identifier":
                    if (node.get("name") or "").lower() in ("false", "falso", "f"):
                        return True
            return False

        if not (_is_flag_eq_false(left) or _is_flag_eq_false(right)):
            return False

        def _body_has_array_find_then_assign_flag(node: Any) -> bool:
            if isinstance(node, dict):
                if node.get("type", "").lower() == "if":
                    t = node.get("test", {})
                    cons = node.get("consequent", {})
                    if isinstance(cons, list):
                        cons_body = cons
                    elif isinstance(cons, dict) and cons.get("type") == "Block":
                        cons_body = cons.get("body", [])
                    else:
                        cons_body = [cons] if cons else []
                    if self._has_non_control_comparison(t, var_name):
                        for stmt in cons_body:
                            if isinstance(stmt, dict) and stmt.get("type", "").lower() == "assign":
                                target = stmt.get("target", {})
                                if isinstance(target, dict) and target.get("type", "").lower() == "identifier":
                                    return True
                for v in node.values():
                    if _body_has_array_find_then_assign_flag(v):
                        return True
            elif isinstance(node, list):
                return any(_body_has_array_find_then_assign_flag(item) for item in node)
            return False

        body_node = body if isinstance(body, dict) else {"body": body}
        body_list = body_node.get("body", [])
        if not body_list and body_node.get("type") != "Block":
            body_list = [body_node]
        return _body_has_array_find_then_assign_flag(body_list)

    def _has_non_control_comparison(self, node: Dict[str, Any], var_name: str) -> bool:
        """
        Verifica si un nodo contiene una comparación que no es solo con la variable de control.
        
        Args:
            node: Nodo del AST
            var_name: Nombre de la variable de control
            
        Returns:
            True si hay una comparación que involucra otras variables (como arrays)
        """
        if not isinstance(node, dict):
            return False
        
        node_type = node.get("type", "").lower()
        operator = node.get("op", "") or node.get("operator", "")
        operator = operator.lower()
        
        # Si el nodo mismo es un Index (acceso a array), retornar True
        if node_type == "index":
            return True
        
        # Si es una comparación
        if node_type in ("binary", "binaryop") and operator in (">", "<", ">=", "<=", "==", "!=", "=", "<>"):
            left = node.get("left", {})
            right = node.get("right", {})
            
            # Verificar si alguna parte es un acceso a array o una variable diferente
            left_type = left.get("type", "").lower() if isinstance(left, dict) else ""
            right_type = right.get("type", "").lower() if isinstance(right, dict) else ""
            
            # Verificar acceso a array (puede ser "Index", "ArrayAccess", "IndexSuffix", "lvalue", etc.)
            # El AST usa "Index" para acceso a array: {type: "Index", target: {...}, index: {...}}
            has_array_access = False
            if left_type in ("index", "arrayaccess", "indexsuffix", "lvalue") or right_type in ("index", "arrayaccess", "indexsuffix", "lvalue"):
                has_array_access = True
            elif isinstance(left, dict) and ("index" in left or "suffix" in left or left_type == "index"):
                has_array_access = True
            elif isinstance(right, dict) and ("index" in right or "suffix" in right or right_type == "index"):
                has_array_access = True
            
            if has_array_access:
                return True
            
            # Si hay una variable diferente a la de control
            if left_type in ("identifier", "variable"):
                left_name = left.get("name", "") if isinstance(left, dict) else ""
                if left_name and left_name != var_name:
                    return True
            if right_type in ("identifier", "variable"):
                right_name = right.get("name", "") if isinstance(right, dict) else ""
                if right_name and right_name != var_name:
                    return True
            
            # Verificar si hay acceso a array mediante verificación de estructura
            # Un acceso a array suele tener estructura como: {type: "lvalue", name: "A", suffix: [...]}
            if isinstance(left, dict):
                if "suffix" in left or (left_type == "lvalue" and "name" in left):
                    # Verificar si tiene sufijos (acceso a array)
                    suffix = left.get("suffix", [])
                    if suffix:
                        return True
            if isinstance(right, dict):
                if "suffix" in right or (right_type == "lvalue" and "name" in right):
                    suffix = right.get("suffix", [])
                    if suffix:
                        return True
        
        # Recursivamente verificar hijos
        for key in ["left", "right", "operand", "test", "then", "else"]:
            if key in node:
                if self._has_non_control_comparison(node[key], var_name):
                    return True
        
        return False
    
    def _try_param_controlled_best_case(
        self,
        body: Any,
        guard: Any,
        updates: Dict[str, Any],
        var_name: Optional[str],
        while_line: int,
        parent_context: Optional[Dict],
    ) -> Optional[Dict[str, Any]]:
        """
        Best case: si el update está en IF(x=const) o IF(x!=0), asumir que la condición
        habilita progreso. Funciona para cualquier nombre de variable (param o local).
        """
        if not var_name:
            return None
        summary = updates.get(var_name) if isinstance(updates, dict) else None
        if not summary or not getattr(summary, "may_updates", []):
            return None
        # Buscar IF con condición id=const o id!=0 que contiene el assign a var_name
        if_info = self._find_var_guarded_if(body, var_name)
        if not if_info:
            return None
        may_updates = getattr(summary, "may_updates", [])
        change_rule = None
        for u in may_updates:
            if u.get("type") == "num":
                change_rule = {"operator": u.get("operator", "+"), "constant": u.get("constant", "1")}
                break
        if not change_rule:
            return None
        # Obtener limit y operator del guard
        limit = ""
        operator = "<"
        if guard and getattr(guard, "atoms", None):
            for atom in guard.atoms:
                if atom.get("var") == var_name:
                    limit = atom.get("limit", "")
                    operator = atom.get("op", "<")
                    break
        if not limit:
            return None
        initial_value = self._find_initial_value_of_var(var_name, while_line, parent_context)
        iterations = self._calculate_iterations(var_name, initial_value, change_rule, limit, operator, "best")
        if not iterations:
            return None
        return {
            "variable": var_name,
            "initial_value": initial_value,
            "change_rule": change_rule,
            "limit": limit,
            "operator": operator,
            "iterations": iterations,
            "success": True,
            "mode": "best",
            "reason_code": "while_param_enables",
        }

    def _find_var_guarded_if(self, node: Any, var_name: str) -> Optional[Dict]:
        """Encuentra IF con condición id=const o id!=0 que contiene assign a var_name.
        Funciona para cualquier nombre de variable (param o local)."""
        if not isinstance(node, dict):
            return None
        nt = node.get("type", "").lower()
        if nt == "if":
            test = node.get("test", {})
            if self._is_var_eq_const(test):
                consequent = node.get("consequent") or node.get("then")
                if consequent and self._contains_assign_to(consequent, var_name):
                    return {"test": test, "consequent": consequent}
            return None
        if nt == "block":
            for stmt in node.get("body", []):
                found = self._find_var_guarded_if(stmt, var_name)
                if found:
                    return found
        for key in ["body", "consequent", "alternate", "then"]:
            if key in node:
                found = self._find_var_guarded_if(node[key], var_name)
                if found:
                    return found
        return None

    def _is_var_eq_const(self, test: Any) -> bool:
        """True si test es id=const o id!=0 (cualquier identificador, no solo params)."""
        if not isinstance(test, dict):
            return False
        op = (test.get("op") or test.get("operator", "")).lower()
        left = test.get("left", {})
        right = test.get("right", {})
        left_id = isinstance(left, dict) and left.get("type", "").lower() == "identifier"
        right_id = isinstance(right, dict) and right.get("type", "").lower() == "identifier"

        def _is_const(expr: Any) -> bool:
            if not isinstance(expr, dict):
                return False
            t = expr.get("type", "").lower()
            if t in ("number", "literal"):
                return True
            if t == "identifier" and (expr.get("name", "").lower() in ("true", "false", "t", "f")):
                return True
            return False

        left_const = _is_const(left)
        right_const = _is_const(right)
        # id = const o const = id
        if op in ("=", "=="):
            return (left_id and right_const) or (right_id and left_const)
        # id != 0 (truthy)
        if op in ("!=", "<>"):
            return (left_id and right_const) or (right_id and left_const)
        return False

    def _extract_id_from_var_eq_const(self, test: Any) -> Optional[str]:
        """Extrae el identificador de test cuando es id=const o id!=0.
        Retorna el nombre del id o None si no coincide con el patrón."""
        if not isinstance(test, dict):
            return None
        if not self._is_var_eq_const(test):
            return None
        left = test.get("left", {})
        right = test.get("right", {})
        left_id = isinstance(left, dict) and left.get("type", "").lower() == "identifier"
        if left_id:
            return left.get("name", "") or None
        if isinstance(right, dict) and right.get("type", "").lower() == "identifier":
            return right.get("name", "") or None
        return None

    def _contains_assign_to(self, node: Any, var_name: str) -> bool:
        """True si node contiene assign a var_name."""
        if not isinstance(node, dict):
            return False
        if node.get("type", "").lower() == "assign":
            t = node.get("target", {})
            if isinstance(t, dict) and t.get("type", "").lower() == "identifier":
                if t.get("name", "") == var_name:
                    return True
        if node.get("type", "").lower() == "block":
            for stmt in node.get("body", []):
                if self._contains_assign_to(stmt, var_name):
                    return True
        return False

    def _calculate_iterations(self, var_name: str, initial: Optional[str], change_rule: Dict[str, Any], limit: str, operator: str, mode: str = "worst") -> Optional[str]:
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
    
    def _analyze_while_closure(self, node: Dict[str, Any], parent_context: Optional[Dict[str, Any]] = None, mode: str = "worst") -> Optional[Dict[str, Any]]:
        """
        Analiza el cierre de un bucle WHILE.
        
        Estrategia mejorada:
        1. Nuevo clasificador (GuardInfo, UpdateSummary, classify_while) para const/bool_var/rel
        2. Verificar best case (early exit)
        3. Intentar análisis simple (variable de control)
        4. Intentar detectar patrones de convergencia (búsqueda binaria, etc.)
        5. Fallback a símbolo iterativo
        
        Args:
            node: Nodo WHILE del AST
            parent_context: Contexto del bloque padre que contiene el while (opcional)
            mode: Modo de análisis ("worst", "best", "avg")
            
        Returns:
            Diccionario con información del cierre, o None si no se puede analizar
        """
        test = node.get("test", {})
        body = node.get("body", {})
        if isinstance(body, list):
            body = {"type": "Block", "body": body}
        L = node.get("pos", {}).get("line", 0)
        condition_info_pre = self._extract_condition_info(test)
        
        # 1) VERIFICAR BEST CASE PRIMERO: Si es best case y hay condición AND con array/variable diferente
        # Para insertion sort: WHILE (j > 0 AND A[j] > key)
        # En best case: A[j] <= key desde el inicio, entonces la condición es falsa, 0 iteraciones.
        # IMPORTANTE: no aplicar este early-exit cuando la segunda parte es un flag booleano
        # fijado justo antes del WHILE (ej: intercambiado <- VERDADERO; WHILE (i < n AND intercambiado)...).
        test_op = test.get("op", "") or test.get("operator", "")
        test_type = test.get("type", "").lower()
        
        if mode == "best" and test_type in ("binary", "binaryop") and test_op.lower() in ("and", "&&"):
            # Verificar si hay una parte que no depende solo de la variable de control
            left = test.get("left", {})
            right = test.get("right", {})
            
            # Primero extraer información para obtener var_name (necesitamos saber cuál es la variable de control)
            condition_info = condition_info_pre
            if condition_info:
                var_name = condition_info.get("variable")
            else:
                # Si no se puede extraer, intentar detectar var_name de otra manera
                # Por ejemplo, buscar en la parte izquierda que suele ser la comparación con la variable
                if isinstance(left, dict):
                    left_left = left.get("left", {})
                    if isinstance(left_left, dict) and left_left.get("type", "").lower() == "identifier":
                        var_name = left_left.get("name", "")
                    else:
                        var_name = None
                else:
                    var_name = None
            
            if var_name:
                # Verificar si alguna parte tiene acceso a array u otra variable
                left_result = self._has_non_control_comparison(left, var_name)
                right_result = self._has_non_control_comparison(right, var_name)
                has_array_or_other_var = left_result or right_result

                # Si la parte "no de control" es un flag booleano fijado antes del WHILE,
                # NO debemos aplicar early-exit a 0 iteraciones. Ejemplo:
                #   intercambiado <- VERDADERO;
                #   WHILE (i < n AND intercambiado) ...
                #   WHILE (i < n AND intercambiado = VERDADERO) ...
                def _is_bool_flag_fixed_before(var_node: Dict[str, Any]) -> bool:
                    if not isinstance(var_node, Dict):
                        return False
                    if var_node.get("type", "").lower() != "identifier":
                        return False
                    flag_name = var_node.get("name", "")
                    if not flag_name or flag_name == var_name:
                        return False
                    # Buscar valor inicial antes de la línea del while
                    initial_val = self._find_initial_value_of_var(flag_name, L, parent_context)
                    if not initial_val:
                        return False
                    return initial_val.upper() in ("VERDADERO", "FALSO", "TRUE", "FALSE")

                def _extract_flag_identifier_node(expr: Dict[str, Any]) -> Optional[Dict[str, Any]]:
                    """
                    Devuelve un nodo Identifier que represente una bandera booleana en la condición.
                    
                    Soporta:
                    - Uso directo: intercambiado
                    - Comparación explícita: intercambiado = VERDADERO / TRUE / FALSO / FALSE
                    """
                    if not isinstance(expr, Dict):
                        return None
                    t = expr.get("type", "").lower()

                    # Caso 1: identificador directo (ej: WHILE (i < n AND intercambiado) ...)
                    if t == "identifier":
                        return expr

                    # Caso 2: comparación binaria id = const / const = id / id != 0
                    if t in ("binary", "binaryop"):
                        op = (expr.get("op") or expr.get("operator", "")).lower()
                        if op in ("=", "==", "!=", "<>"):
                            left_e = expr.get("left", {})
                            right_e = expr.get("right", {})

                            def _is_bool_const(node: Dict[str, Any]) -> bool:
                                if not isinstance(node, Dict):
                                    return False
                                nt = node.get("type", "").lower()
                                if nt in ("number", "literal"):
                                    # Cualquier literal booleano
                                    val = node.get("value")
                                    if isinstance(val, str) and val.lower().strip() in (
                                        "true",
                                        "false",
                                        "verdadero",
                                        "falso",
                                        "v",
                                        "f",
                                    ):
                                        return True
                                    if isinstance(val, bool):
                                        return True
                                    return False
                                if nt == "identifier":
                                    name = (node.get("name", "") or "").lower()
                                    return name in (
                                        "true",
                                        "false",
                                        "verdadero",
                                        "falso",
                                        "v",
                                        "f",
                                    )
                                return False

                            # id = const
                            if (
                                isinstance(left_e, Dict)
                                and left_e.get("type", "").lower() == "identifier"
                                and _is_bool_const(right_e)
                            ):
                                return left_e
                            # const = id
                            if (
                                isinstance(right_e, Dict)
                                and right_e.get("type", "").lower() == "identifier"
                                and _is_bool_const(left_e)
                            ):
                                return right_e

                    return None

                non_control_is_fixed_flag = False
                # Detectar posible flag en cada lado (soportando tanto identificador como id=const)
                left_flag = _extract_flag_identifier_node(left)
                right_flag = _extract_flag_identifier_node(right)

                if left_flag and left_flag.get("name") != var_name:
                    non_control_is_fixed_flag = _is_bool_flag_fixed_before(left_flag)
                if not non_control_is_fixed_flag and right_flag and right_flag.get("name") != var_name:
                    non_control_is_fixed_flag = _is_bool_flag_fixed_before(right_flag)

                # Early-exit a 0 iteraciones solo aplica cuando:
                # - hay una comparación no solo de la variable de control, y
                # - NO se trata de una bandera booleana fijada antes del WHILE.
                if has_array_or_other_var and not non_control_is_fixed_flag:
                    # En best case, asumir que la parte con array/variable es falsa desde el inicio
                    # Por lo tanto, el WHILE solo evalúa la condición una vez y sale (0 iteraciones)
                    # Retornar información mínima para best case con 0 iteraciones
                    return {
                        "variable": var_name,
                        "initial_value": None,
                        "change_rule": {"operator": "-", "constant": "1"},
                        "limit": "0",
                        "operator": ">",
                        "iterations": "0",
                        "success": True,
                        "mode": mode
                    }

                # Búsqueda lineal con flag: WHILE (i < n AND encontrado = false) con
                # IF (A[i] = x) THEN encontrado <- true. La bandera empieza en false,
                # entramos al bucle; en best case encontramos x en la primera iteración → 1 iter.
                if (
                    mode == "best"
                    and non_control_is_fixed_flag
                    and self._is_linear_search_flag_pattern(test, body, var_name)
                ):
                    return {
                        "variable": var_name,
                        "initial_value": None,
                        "change_rule": {"operator": "+", "constant": "1"},
                        "limit": condition_info_pre.get("limit", "n") if condition_info_pre else "n",
                        "operator": condition_info_pre.get("operator", "<") if condition_info_pre else "<",
                        "iterations": "1",
                        "success": True,
                        "mode": mode,
                        "reason_code": "while_linear_search_flag_best",
                    }
        
        # 1.5) Caso promedio especial: prefijo positivo WHILE (i <= n AND A[i] > 0)
        # Para este patrón, la esperanza de iteraciones es O(1) (no depende de n).
        if mode == "avg" and condition_info_pre and condition_info_pre.get("variable"):
            var_for_avg = condition_info_pre["variable"]
            if self._is_positive_prefix_guard(test, var_for_avg):
                return {
                    "variable": var_for_avg,
                    "initial_value": None,
                    "change_rule": {"operator": "+", "constant": "1"},
                    "limit": condition_info_pre.get("limit", "n"),
                    "operator": condition_info_pre.get("operator", "<="),
                    "iterations": "1",
                    "success": True,
                    "mode": mode,
                    "reason_code": "while_positive_prefix_avg",
                }
        
        # 2) Motor WHILE (engine) o clasificador legacy
        result = None
        try:
            guard = analyze_guard(test)
            # Recopilar todas las variables asignadas en el cuerpo para evaluarlas como posibles cotas
            assigned_vars = set()
            def _collect_vars(n):
                if isinstance(n, dict):
                    if n.get("type", "").lower() == "assign":
                        t = n.get("target", {})
                        if isinstance(t, dict) and t.get("type", "").lower() == "identifier":
                            assigned_vars.add(t.get("name", ""))
                    for v in n.values():
                        _collect_vars(v)
                elif isinstance(n, list):
                    for item in n:
                        _collect_vars(item)
            _collect_vars(body)
            all_vars = guard.vars_used.union(assigned_vars)
            
            updates = summarize_updates(body, all_vars, guard, parent_context)
            # Intentar engine primero
            try:
                engine = WhileEngine()
                engine_input = WhileAnalysisInput(
                    while_node=node,
                    parent_context=parent_context,
                    procedure_context=getattr(self, "root_ast", None),
                    mode=mode,
                )
                engine_result = engine.analyze(engine_input)
                if engine_result.status == "bounded" and engine_result.iterations_expr:
                    return {
                        "variable": engine_result.variable or "",
                        "initial_value": None,
                        "change_rule": engine_result.change_rule or {"operator": "+", "constant": "1"},
                        "limit": engine_result.limit or "n",
                        "operator": engine_result.operator or "<",
                        "iterations": engine_result.iterations_expr,
                        "success": True,
                        "mode": mode,
                        "reason_code": engine_result.reason_code,
                        "pattern": engine_result.pattern_used,
                    }
                if engine_result.status == "unbounded":
                    if mode == "best" and engine_result.reason_code == "while_no_progress_must":
                        param_bounded = self._try_param_controlled_best_case(
                            body, guard, updates,
                            (engine_result.evidence or {}).get("var"), L, parent_context
                        )
                        if param_bounded:
                            return param_bounded
                    return {
                        "success": True,
                        "status": "unbounded",
                        "reason_code": engine_result.reason_code or "while_unbounded_unknown",
                        "evidence": engine_result.evidence or {},
                    }
            except Exception:
                # Si el engine falla, usar el clasificador para no perder bounded/unbounded
                result_fallback = classify_while(guard, updates, mode, parent_context, L)
                if result_fallback.status == "bounded" and result_fallback.iterations_expr:
                    ev = result_fallback.evidence
                    op_rule = ev.get("change_operator") if ev else None
                    const_rule = ev.get("change_constant") if ev else None
                    if op_rule is None or const_rule is None:
                        ch = (ev.get("change") or "+1").strip() if ev else "+1"
                        if ch.startswith("+") or ch.startswith("-"):
                            op_rule = ch[0]
                            const_rule = ch[1:] or "1"
                        else:
                            op_rule = "+"
                            const_rule = "1"
                    else:
                        op_rule = str(op_rule)
                        const_rule = str(const_rule)
                    return {
                        "variable": ev.get("var", "") if ev else "",
                        "initial_value": None,
                        "change_rule": {"operator": op_rule, "constant": const_rule},
                        "limit": ev.get("limit", "") if ev else "n",
                        "operator": ev.get("op", "<") if ev else "<",
                        "iterations": result_fallback.iterations_expr,
                        "success": True,
                        "mode": mode,
                        "reason_code": result_fallback.reason_code,
                    }
                if result_fallback.status == "unbounded":
                    if mode == "best" and result_fallback.reason_code == "while_no_progress_must":
                        param_bounded = self._try_param_controlled_best_case(
                            body, guard, updates,
                            (result_fallback.evidence or {}).get("var"), L, parent_context
                        )
                        if param_bounded:
                            return param_bounded
                    return {
                        "success": True,
                        "status": "unbounded",
                        "reason_code": result_fallback.reason_code or "while_unbounded_unknown",
                        "evidence": result_fallback.evidence or {},
                    }
            result = classify_while(guard, updates, mode, parent_context, L)
            if result.status == "bounded" and result.iterations_expr:
                ev = result.evidence
                op_rule = ev.get("change_operator")
                const_rule = ev.get("change_constant")
                if op_rule is None or const_rule is None:
                    ch = (ev.get("change") or "+1").strip()
                    if ch.startswith("+") or ch.startswith("-"):
                        op_rule = ch[0]
                        const_rule = ch[1:] or "1"
                    else:
                        op_rule = "+"
                        const_rule = "1"
                return {
                    "variable": ev.get("var", ""),
                    "initial_value": None,
                    "change_rule": {"operator": op_rule, "constant": str(const_rule)},
                    "limit": ev.get("limit", ""),
                    "operator": ev.get("op", "<"),
                    "iterations": result.iterations_expr,
                    "success": True,
                    "mode": mode,
                    "reason_code": result.reason_code,
                }
            if result.status == "unbounded":
                # Best case: si es no_progress_must y el update está en IF(param=const), asumir param habilita
                if mode == "best" and result.reason_code == "while_no_progress_must":
                    param_bounded = self._try_param_controlled_best_case(
                        body, guard, updates, result.evidence.get("var"), L, parent_context
                    )
                    if param_bounded:
                        return param_bounded
                return {
                    "success": True,
                    "status": "unbounded",
                    "reason_code": result.reason_code or "while_unbounded_unknown",
                    "evidence": result.evidence,
                }
        except Exception as e:
            import logging
            logging.exception("[WhileRepeatVisitor] Error en classify_while: %s", e)
        
        # 3) Extraer información de la condición (para worst/avg case o si best case no aplica)
        condition_info = condition_info_pre or self._extract_condition_info(test)
        if not condition_info:
            return None
        
        var_name = condition_info["variable"]
        limit = condition_info["limit"]
        operator = condition_info["operator"]
        
        # 1.5) Si hay dos variables, intentar detectar patrón directamente
        if condition_info.get("two_variables"):
            pattern_info = self._detect_convergence_pattern(node, var_name, body)
            if pattern_info and pattern_info["pattern"] == "binary_search":
                # Búsqueda binaria
                # Best case: encuentra el elemento en la primera iteración (mitad del arreglo)
                # Worst/Avg case: O(log n) iteraciones
                var2 = condition_info.get("variable2")
                var2_initial = self._find_initial_value_of_var(var2, L, parent_context)
                actual_limit = var2_initial if var2_initial else limit
                
                if mode == "best":
                    # Best case: 1 iteración (encuentra en el medio)
                    iterations = "1"
                else:
                    # Worst/Avg case: log_2(n) iteraciones
                    iterations = f"\\log_{{2}}({actual_limit})"
                
                return {
                    "variable": var_name,
                    "initial_value": None,
                    "change_rule": {"operator": "/", "constant": "2"},
                    "limit": actual_limit,
                    "operator": operator,
                    "iterations": iterations,
                    "success": True,
                    "mode": mode,
                    "pattern": pattern_info["pattern"],
                    "pattern_note": pattern_info.get("note", "")
                }
            # Búsqueda lineal con flag en avg: E[iteraciones] ≈ (n+1)/2 (no usar modelo geométrico)
            if mode == "avg" and self._is_linear_search_flag_pattern(test, body, var_name):
                initial_val = self._find_initial_value_of_var(var_name, L, parent_context) or "0"
                return {
                    "variable": var_name,
                    "initial_value": initial_val,
                    "change_rule": {"operator": "+", "constant": "1"},
                    "limit": limit,
                    "operator": operator,
                    "iterations": f"(({limit}) - ({initial_val}) + 1) / 2",
                    "success": True,
                    "mode": mode,
                    "reason_code": "while_linear_search_flag_avg",
                }
            # Si no se detectó patrón pero el clasificador ya dio bounded (ej. crecimiento geométrico), usarlo
            if result and result.status == "bounded" and result.iterations_expr:
                ev = result.evidence or {}
                op_rule = ev.get("change_operator")
                const_rule = ev.get("change_constant")
                if op_rule is None or const_rule is None:
                    ch = (ev.get("change") or "+1").strip()
                    if ch.startswith("+") or ch.startswith("-"):
                        op_rule = ch[0]
                        const_rule = ch[1:] or "1"
                    else:
                        op_rule = "+"
                        const_rule = "1"
                return {
                    "variable": ev.get("var", ""),
                    "initial_value": None,
                    "change_rule": {"operator": str(op_rule), "constant": str(const_rule)},
                    "limit": ev.get("limit", limit),
                    "operator": ev.get("op", operator),
                    "iterations": result.iterations_expr,
                    "success": True,
                    "mode": mode,
                    "reason_code": result.reason_code,
                }
            # Si no se detecta patrón, retornar None
            return None
        
        # 2) Analizar el cuerpo para encontrar cambios a la variable
        body_info = self._analyze_body_for_variable_change(body, var_name)
        if not body_info:
            # El análisis simple falló, intentar detectar patrones de convergencia
            pattern_info = self._detect_convergence_pattern(node, var_name, body)
            if pattern_info:
                # Patrón detectado (ej: búsqueda binaria)
                # Retornar información especial para que visitWhile use la complejidad conocida
                if pattern_info["pattern"] == "binary_search":
                    # Búsqueda binaria
                    # Best case: encuentra el elemento en la primera iteración
                    # Worst/Avg case: O(log n) iteraciones
                    if mode == "best":
                        iterations = "1"
                    else:
                        iterations = f"\\log_{{2}}({limit})"
                    
                    return {
                        "variable": var_name,
                        "initial_value": None,
                        "change_rule": {"operator": "/", "constant": "2"},
                        "limit": limit,
                        "operator": operator,
                        "iterations": iterations,
                        "success": True,
                        "mode": mode,
                        "pattern": pattern_info["pattern"],
                        "pattern_note": pattern_info.get("note", "")
                    }
            return None
        
        change_rule = body_info["change_rule"]
        
        # 3) Buscar valor inicial de la variable en el contexto padre
        initial_value = self._find_initial_value_of_var(var_name, L, parent_context)
        if not initial_value:
            # Si no se encontró en el contexto padre, usar variable simbólica
            initial_value = None
        
        # 4) Calcular iteraciones normalmente
        iterations = self._calculate_iterations(var_name, initial_value, change_rule, limit, operator, mode)
        if not iterations:
            return None
        
        # 4.5) Ajustes específicos para caso promedio con condiciones AND que incluyen arrays
        if mode == "avg":
            # Prefijo positivo: WHILE (i <= n AND A[i] > 0) → esperanza O(1)
            if self._is_positive_prefix_guard(test, var_name):
                iterations = "1"
            # Búsqueda lineal / patrones de early exit clásicos: E[iter] ≈ (n+1)/2
            elif self._has_early_exit_condition(test, var_name):
                initial_expr = initial_value if initial_value else f"{var_name}_0"
                iterations = f"(({limit}) - ({initial_expr}) + 1) / 2"
        
        return {
            "variable": var_name,
            "initial_value": initial_value,
            "change_rule": change_rule,
            "limit": limit,
            "operator": operator,
            "iterations": iterations,
            "success": True,
            "mode": mode
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
        except Exception:
            # Si no se encuentra, intentar con la condición inversa
            try:
                # Para condición "i < n", la probabilidad de salir podría ser modelada como
                # la probabilidad de que "i >= n" (condición falsa)
                p_str = self.avg_model.get_probability(condition_str, context)
                p_sympy = self.avg_model.get_probability_sympy(condition_str, context)
                # Si obtenemos una probabilidad, asumir que es la probabilidad de que la condición sea falsa (salir)
                return (p_sympy, p_str)
            except Exception:
                return None
    
    def visitWhile(self, node: Dict[str, Any], mode: str = "worst", parent_context: Optional[Dict[str, Any]] = None) -> None:
        """
        Visita un bucle WHILE y aplica las reglas de análisis.
        
        Args:
            node: Nodo WHILE del AST
            mode: Modo de análisis ("worst", "best", "avg")
            parent_context: Contexto del bloque padre que contiene el while (opcional)
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        L = node.get("pos", {}).get("line", 0)
        t = self.iter_sym("while", L)
        
        # Estrategia unificada:
        # 1. En modo promedio, intentar probabilidad primero (si está disponible)
        # 2. Si no hay probabilidad o modo != "avg", intentar análisis de cierre
        # 3. Si ambos fallan, usar símbolo iterativo con nota mejorada
        
        # Paso 1: Intentar probabilidad en modo promedio
        # PERO: primero verificar si es un patrón conocido (como búsqueda binaria)
        # que tiene complejidad determinística incluso en average case
        if mode == "avg":
            # Verificar si hay un patrón detectado primero (búsqueda binaria o Euclides)
            # O si es unbounded por param-controlled (no_progress_must): NO aplicar modelo geométrico
            # O si es WHILE con AND y array (ej: find_last_index): E[iteraciones] ≈ (n+1)/2, no 1/p
            test = node.get("test", {})
            closure_info_pattern = self._analyze_while_closure(node, parent_context, mode)
            skip_geometric = False
            if closure_info_pattern:
                if closure_info_pattern.get("pattern") or closure_info_pattern.get("reason_code") == "while_euclid_mod":
                    skip_geometric = True
                # Si el clasificador ya determinó que el WHILE es bounded y tiene una expresión
                # explícita de iteraciones, preferimos reutilizar esa expresión también en avg
                # en lugar de aplicar un modelo geométrico 1/p genérico. Esto asegura, por ejemplo,
                # que algoritmos como bubble sort mejorado tengan avg ~ n² (igual que worst) en
                # vez de colapsar a O(n) por asumir pocas pasadas esperadas del WHILE.
                elif (
                    closure_info_pattern.get("success")
                    and closure_info_pattern.get("iterations")
                    and closure_info_pattern.get("status") in (None, "bounded")
                ):
                    # Por defecto, para WHILE bounded preferimos reutilizar el cierre determinista
                    # (evita que el modelo geométrico 1/p colapse avg a O(1) indebidamente en
                    # bucles como el WHILE interno de insertion sort).
                    #
                    # EXCEPCIÓN: patrón de prefijo positivo (i<=n AND A[i]>0) → E[iter] = O(1).
                    var_tmp = closure_info_pattern.get("variable", "")
                    if not self._is_positive_prefix_guard(test, var_tmp):
                        skip_geometric = True
                elif closure_info_pattern.get("status") == "unbounded" and closure_info_pattern.get("reason_code") in (
                    "while_no_progress_must",
                    "while_or_no_progress",
                ):
                    # Progreso controlado por parámetro/condición: modelo geométrico no aplica
                    skip_geometric = True
                # Nota: condiciones de salida temprana por datos se manejan arriba (no forzar skip_geometric).
            if skip_geometric:
                # Saltar análisis probabilístico, ir al paso 2 (manejo unbounded)
                pass
            else:
                # No hay patrón, intentar análisis probabilístico
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
                        
                        # Condición: se evalúa (iterations + 1) veces
                        ck_cond = self.C()
                        cond_count = iterations_expr + Integer(1)
                        ops = self._ops_of_expr(node.get("test", {})) if hasattr(self, "_ops_of_expr") else 1
                        ops = max(1, ops)
                        self.add_row(
                            line=L,
                            kind="while",
                            ck=ck_cond,
                            count=cond_count,
                            note=self._note("while_avg_iter", L=L, p_str=p_str),
                            ops=ops
                        )
                        
                        # Cuerpo: se ejecuta E[#iteraciones] veces
                        self.push_multiplier(mult_expr)
                        
                        body = node.get("body")
                        if body:
                            # Aplicar memoización si el cuerpo es un bloque cacheable
                            if self._should_memoize(body):
                                ctx_hash = self.get_context_hash()
                                memo_key = self.memo_key(body, mode, ctx_hash)
                                
                                # Intentar obtener del cache
                                cached_rows = self.memo_get(memo_key)
                                if cached_rows is not None:
                                    # Usar resultados cacheados
                                    self.rows.extend(cached_rows)
                                else:
                                    # Analizar y cachear
                                    rows_before = len(self.rows)
                                    self.visit(body, mode)
                                    rows_added = self.rows[rows_before:]
                                    if rows_added:
                                        self.memo_set(memo_key, rows_added)
                            else:
                                # No es cacheable, visitar normalmente
                                self.visit(body, mode)
                        
                        self.pop_multiplier()
                        return
                    except Exception as e:
                        print(f"[WhileRepeatVisitor] Error calculando E[#iteraciones] = 1/p: {e}")
                        # Continuar con análisis de cierre como fallback
        
        # Paso 2: Intentar análisis de cierre (para todos los modos, incluyendo avg como fallback)
        closure_info = self._analyze_while_closure(node, parent_context, mode)
        
        if closure_info and closure_info.get("success") and closure_info.get("status") == "unbounded":
            # Caso UNBOUNDED: evidencia de no terminación
            reason_code = closure_info.get("reason_code", "while_unbounded_unknown")
            note_text = self._note(reason_code)
            t_sym = Symbol(t, real=True)
            ck_cond = self.C()
            cond_count = t_sym + Integer(1)
            ops = self._ops_of_expr(node.get("test", {})) if hasattr(self, "_ops_of_expr") else 1
            ops = max(1, ops)
            self.add_row(
                line=L,
                kind="while",
                ck=ck_cond,
                count=cond_count,
                note=note_text,
                unbounded=True,
                unbounded_kind="non_terminating",
                ops=ops
            )
            self.push_multiplier(t_sym)
            body = node.get("body")
            if body:
                if self._should_memoize(body):
                    ctx_hash = self.get_context_hash()
                    memo_key = self.memo_key(body, mode, ctx_hash)
                    cached_rows = self.memo_get(memo_key)
                    if cached_rows is not None:
                        self.rows.extend(cached_rows)
                    else:
                        rows_before = len(self.rows)
                        self.visit(body, mode)
                        rows_added = self.rows[rows_before:]
                        if rows_added:
                            self.memo_set(memo_key, rows_added)
                else:
                    self.visit(body, mode)
            self.pop_multiplier()
            return
        
        if closure_info and closure_info.get("success"):
            # Análisis exitoso (bounded): usar expresiones concretas
            iterations = closure_info.get("iterations")
            var_name = closure_info.get("variable", "")
            change_rule = closure_info["change_rule"]
            limit = closure_info["limit"]
            operator = closure_info["operator"]
            initial_value = closure_info.get("initial_value")
            pattern = closure_info.get("pattern")
            
            # Convertir iteraciones (string) a SymPy
            # La variable iterations ya viene diferenciada por modo desde _analyze_while_closure
            # Para binary search: "1" en best case, "\\log_{2}(n)" en worst/avg
            if pattern == "binary_search":
                # Para búsqueda binaria: ya viene el valor correcto en iterations
                from sympy import log, sympify as sp_sympify, ceiling, Symbol as Sym
                try:
                    # Si iterations es "1", usar directamente
                    if iterations == "1":
                        iterations_expr = Integer(1)
                    else:
                        # Es una expresión log en LaTeX, convertir a SymPy
                        # Ejemplo: "\\log_{2}(n)" -> log(n, 2)
                        limit_expr = sp_sympify(limit) if isinstance(limit, str) else limit
                        iterations_expr = log(limit_expr, 2)
                except Exception as e:
                    print(f"[WhileRepeatVisitor] Error convirtiendo log expression: {e}")
                    # Fallback: usar ceil(log(n))
                    n_sym = Sym('n')
                    iterations_expr = ceiling(log(n_sym, 2))
            else:
                try:
                    iterations_expr = self._str_to_sympy(str(iterations))
                except Exception:
                    iterations_expr = self._str_to_sympy(str(iterations))

            # APLICAR SUBSTITUCIÓN DEL LÍMITE:
            if isinstance(limit, str) and limit and not limit.isdigit():
                import re
                if re.match(r'^[a-zA-Z_]\w*$', limit):
                    # Si el límite es una variable de bucle (outer loop), NO sustituir por su valor inicial.
                    # Ejemplo: WHILE (j <= i) dentro de WHILE (i <= n). Aquí i cambia; sustituir i->1
                    # colapsa la sumatoria triangular y rompe Θ(n²).
                    try:
                        loop_vars = set(getattr(self, "loop_index_vars", set()) or set())
                    except Exception:
                        loop_vars = set()
                    if limit not in loop_vars:
                        initial_limit = self._find_initial_value_of_var(limit, L, parent_context)
                        if initial_limit:
                            try:
                                lim_sym = self._str_to_sympy(limit)
                                init_sym = self._str_to_sympy(initial_limit)
                                iterations_expr = iterations_expr.subs(lim_sym, init_sym)
                            except Exception:
                                pass

            # APLICAR SUBSTITUCIÓN DE ALIAS (ej. N <- n) EN iteraciones:
            # Si aparecen símbolos libres como N (o cualquier var) y tienen valor inicial antes del while,
            # sustituirlos para evitar colisiones y mejorar la forma cerrada.
            try:
                from sympy import Symbol as SymSymbol

                skip = {var_name, getattr(self, "variable", "n"), "i", "j", "k"}
                for sym in list(getattr(iterations_expr, "free_symbols", set())):
                    sname = getattr(sym, "name", "")
                    if not sname or sname in skip:
                        continue
                    init_val = self._find_initial_value_of_var(sname, L, parent_context)
                    if init_val:
                        iterations_expr = iterations_expr.subs(SymSymbol(sname), self._str_to_sympy(init_val))
            except Exception:
                pass
            
            mult_expr = iterations_expr

            # MEJORA: Si el WHILE es lineal simple (±1) y tenemos variable de control,
            # representar el multiplicador como una sumatoria Σ_{var=start}^{end} 1.
            # Esto permite cerrar correctamente anidados del tipo:
            #   WHILE (i <= n) ... WHILE (j <= i) ...
            # donde el coste es Σ_{i=1}^{n} i = Θ(n²).
            try:
                # No aplicar a patrones especiales (Euclides/binary search) o símbolos iterativos
                reason_code_local = closure_info.get("reason_code", "")
                pattern_local = closure_info.get("pattern")
                # No construir Sum cuando iterations=1 (ej. búsqueda lineal best case)
                iterations_is_one = iterations == "1" or iterations_expr == Integer(1)
                # Solo construir Sum(1,(var,start,end)) cuando hay un límite explícito.
                # Si no hay limit (ej. while_flag_aux_increase_bound con WHILE(flag) e i<-i+1),
                # mantener mult_expr = iterations_expr (ej. n) para no generar Sum(i,1,0)=0.
                has_explicit_limit = limit and (not isinstance(limit, str) or limit.strip())
                if (
                    not iterations_is_one
                    and pattern_local not in ("binary_search",)
                    and reason_code_local != "while_euclid_mod"
                    and has_explicit_limit
                ):
                    var_sym = Symbol(var_name, integer=True)
                    op = str(change_rule.get("operator", "") or "")
                    const_str = str(change_rule.get("constant", "1") or "1")
                    const_expr = self._str_to_sympy(const_str)

                    # Solo paso unitario
                    if const_expr == Integer(1) and op in ("+", "-"):
                        # Inicio: usar inicial_value si existe, si no, default 1 para i/j/k
                        start_expr = None
                        if initial_value:
                            start_expr = self._str_to_sympy(str(initial_value))
                        else:
                            if var_name in ("i", "j", "k"):
                                start_expr = Integer(1)

                        # Fin: depende del operador de la condición
                        end_expr = None
                        if isinstance(limit, str) and limit:
                            end_expr = self._str_to_sympy(limit)
                        else:
                            end_expr = self._str_to_sympy(str(limit))

                        cond_op = str(operator or "")

                        # Normalizar bounds según tipo de condición
                        if op == "+" and cond_op == "<":
                            end_expr = end_expr - Integer(1)
                        elif op == "-" and cond_op == ">":
                            end_expr = end_expr + Integer(1)

                        if start_expr is not None and end_expr is not None:
                            mult_expr = Sum(Integer(1), (var_sym, start_expr, end_expr))
            except Exception:
                pass
            
            # 1) Condición: se evalúa (iterations + 1) veces
            # En best case con 0 iteraciones, la condición se evalúa 1 vez (y sale)
            ck_cond = self.C()
            if mode == "best" and iterations == "0":
                cond_count = Integer(1)
            else:
                cond_count = iterations_expr + Integer(1)
            
            # Generar nota descriptiva
            change_op = change_rule.get("operator", "")
            change_const = change_rule.get("constant", "1")
            mode_info = closure_info.get("mode", mode)
            pattern_note = closure_info.get("pattern_note", "")
            
            # Agregar información del modo si es best case y hay 0 iteraciones
            reason_code = closure_info.get("reason_code", "")
            if reason_code == "while_euclid_mod":
                note_text = self._note("while_euclid_mod", L=L, var_name=var_name)
            elif pattern == "binary_search":
                note_text = self._note("while_binary_search", L=L, mode_info=mode_info)
            elif mode_info == "best" and iterations == "0":
                if initial_value:
                    note_text = self._note("while_best_false_start", L=L, var_name=var_name, initial_value=initial_value)
                else:
                    note_text = self._note("while_best_false_start_no_init", L=L, var_name=var_name)
            elif mode_info == "best":
                if initial_value:
                    note_text = self._note("while_best_var", L=L, var_name=var_name, initial_value=initial_value, change_op=change_op, change_const=change_const, operator=operator, limit=limit)
                else:
                    note_text = self._note("while_best_var_no_init", L=L, var_name=var_name, change_op=change_op, change_const=change_const, operator=operator, limit=limit)
            elif mode_info == "worst":
                if initial_value:
                    note_text = self._note("while_worst_var", L=L, var_name=var_name, initial_value=initial_value, change_op=change_op, change_const=change_const, operator=operator, limit=limit)
                else:
                    note_text = self._note("while_worst_var_no_init", L=L, var_name=var_name, change_op=change_op, change_const=change_const, operator=operator, limit=limit)
            else:
                if initial_value:
                    note_text = self._note("while_var", L=L, var_name=var_name, initial_value=initial_value, change_op=change_op, change_const=change_const, operator=operator, limit=limit)
                else:
                    note_text = self._note("while_var_no_init", L=L, var_name=var_name, change_op=change_op, change_const=change_const, operator=operator, limit=limit)
            
            ops = self._ops_of_expr(node.get("test", {})) if hasattr(self, "_ops_of_expr") else 1
            ops = max(1, ops)
            self.add_row(
                line=L,
                kind="while",
                ck=ck_cond,
                count=cond_count,
                note=note_text,
                euclid_pattern=(reason_code == "while_euclid_mod"),
                ops=ops
            )

            # 2) Cuerpo: se ejecuta iterations veces
            # En best case con 0 iteraciones, el multiplicador debe ser 0
            if mode == "best" and iterations == "0":
                # El cuerpo no se ejecuta, usar multiplicador 0
                self.push_multiplier(Integer(0))
            else:
                self.push_multiplier(mult_expr)
            
            # Best case param-controlled: IF(param=const) debe tomar THEN (param habilita progreso)
            param_controlled = mode == "best" and closure_info.get("reason_code") == "while_param_enables"
            if param_controlled:
                setattr(self, "_param_controlled_if_take_then", True)
            
            # Visitar el cuerpo del bucle (con memoización si es un bloque)
            body = node.get("body")
            if body:
                # Aplicar memoización si el cuerpo es un bloque cacheable
                if self._should_memoize(body):
                    ctx_hash = self.get_context_hash()
                    memo_key = self.memo_key(body, mode, ctx_hash)
                    
                    # Intentar obtener del cache
                    cached_rows = self.memo_get(memo_key)
                    if cached_rows is not None:
                        # Usar resultados cacheados
                        self.rows.extend(cached_rows)
                    else:
                        # Analizar y cachear
                        rows_before = len(self.rows)
                        self.visit(body, mode)
                        rows_added = self.rows[rows_before:]
                        if rows_added:
                            self.memo_set(memo_key, rows_added)
                else:
                    # No es cacheable, visitar normalmente
                    self.visit(body, mode)
            
            if param_controlled:
                setattr(self, "_param_controlled_if_take_then", False)
            self.pop_multiplier()
        else:
            # Paso 3: Fallback - usar símbolo iterativo con nota mejorada
            if mode == "avg":
                # En promedio, usar símbolo t̄_while_L (esperanza)
                t_bar = f"\\bar{{t}}_{{while_{L}}}"
                t_sym = Symbol(f"t_bar_while_{L}", real=True, positive=True)
                note_text = self._note("while_avg_unbounded", L=L, t_bar=t_bar)
            else:
                # En worst/best, usar símbolo t_while_L
                t_sym = Symbol(t, real=True)
                # Importante: “desconocido” no implica no-terminación.
                # No marcar como unbounded a menos que el clasificador tenga evidencia.
                note_text = self._note("while_unbounded_unknown")
            
            # 1) Condición: se evalúa (t + 1) veces
            ck_cond = self.C()
            cond_count = t_sym + Integer(1)
            ops = self._ops_of_expr(node.get("test", {})) if hasattr(self, "_ops_of_expr") else 1
            ops = max(1, ops)
            self.add_row(
                line=L,
                kind="while",
                ck=ck_cond,
                count=cond_count,
                note=note_text,
                ops=ops
            )
            
            # 2) Cuerpo: se ejecuta t veces
            self.push_multiplier(t_sym)
            
            # Visitar el cuerpo del bucle (con memoización si es un bloque)
            body = node.get("body")
            if body:
                # Aplicar memoización si el cuerpo es un bloque cacheable
                if self._should_memoize(body):
                    ctx_hash = self.get_context_hash()
                    memo_key = self.memo_key(body, mode, ctx_hash)
                    
                    # Intentar obtener del cache
                    cached_rows = self.memo_get(memo_key)
                    if cached_rows is not None:
                        # Usar resultados cacheados
                        self.rows.extend(cached_rows)
                    else:
                        # Analizar y cachear
                        rows_before = len(self.rows)
                        self.visit(body, mode)
                        rows_added = self.rows[rows_before:]
                        if rows_added:
                            self.memo_set(memo_key, rows_added)
                else:
                    # No es cacheable, visitar normalmente
                    self.visit(body, mode)
            
            self.pop_multiplier()
    
    def visitRepeat(self, node: Dict[str, Any], mode: str = "worst") -> None:
        """
        Visita un bucle REPEAT y aplica las reglas de análisis.
        
        Args:
            node: Nodo REPEAT del AST
            mode: Modo de análisis ("worst", "best", "avg")
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        L = node.get("pos", {}).get("line", 0)
        t = self.iter_sym("repeat", L)
        t_sym = Symbol(t, real=True)
        
        # 1) Cuerpo: al menos 1 vez -> (1 + t_{repeat_L})
        mult_expr = Integer(1) + t_sym
        self.push_multiplier(mult_expr)
        
        # Visitar el cuerpo del bucle (con memoización si es un bloque)
        body = node.get("body")
        if body:
            # Aplicar memoización si el cuerpo es un bloque cacheable
            if self._should_memoize(body):
                ctx_hash = self.get_context_hash()
                memo_key = self.memo_key(body, mode, ctx_hash)
                
                # Intentar obtener del cache
                cached_rows = self.memo_get(memo_key)
                if cached_rows is not None:
                    # Usar resultados cacheados
                    self.rows.extend(cached_rows)
                else:
                    # Analizar y cachear
                    rows_before = len(self.rows)
                    self.visit(body, mode)
                    rows_added = self.rows[rows_before:]
                    if rows_added:
                        self.memo_set(memo_key, rows_added)
            else:
                # No es cacheable, visitar normalmente
                self.visit(body, mode)
        
        self.pop_multiplier()
        
        # 2) Condición: se evalúa también (1 + t_{repeat_L}) veces
        ck_cond = self.C()
        cond_count = Integer(1) + t_sym
        ops = self._ops_of_expr(node.get("test", {})) if hasattr(self, "_ops_of_expr") else 1
        ops = max(1, ops)
        self.add_row(
            line=L,
            kind="repeat",
            ck=ck_cond,
            count=cond_count,
            note=self._note("repeat_cond_line", L=L),
            ops=ops
        )
