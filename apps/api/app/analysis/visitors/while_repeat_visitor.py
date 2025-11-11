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
                    return left_info
            
            # Si left no funciona, intentar right
            right = test.get("right", {})
            if isinstance(right, dict):
                right_info = self._extract_condition_info(right)
                if right_info:
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
                    initial_expr = self._expr_to_str(value)
                    return initial_expr
        
        # Si hay un loop_stack activo (FOR anidado), la variable podría depender
        # de la variable del FOR. Por ejemplo: j <- i - 1 dentro de FOR i
        # En este caso, el valor inicial se debería encontrar en el bloque padre,
        # pero si no se encuentra, podríamos considerar la variable del FOR
        # como parte del contexto (esto se maneja implícitamente en la expresión)
        
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
        operator = test.get("operator", "").lower()
        
        # Si es un AND, verificar si alguna parte puede ser falsa desde el inicio
        if test_type in ("binary", "binaryop") and operator in ("and", "&&"):
            left = test.get("left", {})
            right = test.get("right", {})
            
            print(f"[Early Exit] Detected AND condition, checking left and right for non-control comparisons")
            
            # Verificar si alguna parte tiene una comparación con arrays u otras variables
            # (no solo la variable de control)
            left_has_non_control = self._has_non_control_comparison(left, var_name)
            right_has_non_control = self._has_non_control_comparison(right, var_name)
            
            print(f"[Early Exit] left has non-control: {left_has_non_control}, right has non-control: {right_has_non_control}")
            
            if left_has_non_control or right_has_non_control:
                return True
        
        # Si es una comparación que no es solo con la variable de control
        if test_type in ("binary", "binaryop") and operator in (">", "<", ">=", "<=", "==", "!=", "=", "<>"):
            if self._has_non_control_comparison(test, var_name):
                return True
        
        return False
    
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
        
        Args:
            node: Nodo WHILE del AST
            parent_context: Contexto del bloque padre que contiene el while (opcional)
            mode: Modo de análisis ("worst", "best", "avg")
            
        Returns:
            Diccionario con información del cierre, o None si no se puede analizar
        """
        test = node.get("test", {})
        body = node.get("body", {})
        L = node.get("pos", {}).get("line", 0)
        
        # 0) VERIFICAR BEST CASE ANTES: Si es best case y hay condición AND con array/variable diferente
        # Para insertion sort: WHILE (j > 0 AND A[j] > key)
        # En best case: A[j] <= key desde el inicio, entonces la condición es falsa, 0 iteraciones
        test_op = test.get("op", "") or test.get("operator", "")
        test_type = test.get("type", "").lower()
        
        if mode == "best" and test_type in ("binary", "binaryop") and test_op.lower() in ("and", "&&"):
            # Verificar si hay una parte que no depende solo de la variable de control
            left = test.get("left", {})
            right = test.get("right", {})
            
            # Primero extraer información para obtener var_name (necesitamos saber cuál es la variable de control)
            condition_info = self._extract_condition_info(test)
            if condition_info:
                var_name = condition_info["variable"]
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
                
                if has_array_or_other_var:
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
        
        # 1) Extraer información de la condición (para worst/avg case o si best case no aplica)
        condition_info = self._extract_condition_info(test)
        if not condition_info:
            return None
        
        var_name = condition_info["variable"]
        limit = condition_info["limit"]
        operator = condition_info["operator"]
        
        # 2) Analizar el cuerpo para encontrar cambios a la variable
        body_info = self._analyze_body_for_variable_change(body, var_name)
        if not body_info:
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
    
    def visitWhile(self, node: Dict[str, Any], mode: str = "worst", parent_context: Optional[Dict[str, Any]] = None) -> None:
        """
        Visita un bucle WHILE y aplica las reglas de análisis.
        
        Args:
            node: Nodo WHILE del AST
            mode: Modo de análisis
            parent_context: Contexto del bloque padre que contiene el while (opcional)
        """
        L = node.get("pos", {}).get("line", 0)
        t = self.iter_sym("while", L)
        
        # Estrategia unificada:
        # 1. En modo promedio, intentar probabilidad primero (si está disponible)
        # 2. Si no hay probabilidad o modo != "avg", intentar análisis de cierre
        # 3. Si ambos fallan, usar símbolo iterativo con nota mejorada
        
        # Paso 1: Intentar probabilidad en modo promedio
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
                        note=f"Condición del bucle while en línea {L} (avg: E[#iteraciones] = 1/p, p={p_str})"
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
                    # Continuar con análisis de cierre como fallback
        
        # Paso 2: Intentar análisis de cierre (para todos los modos, incluyendo avg como fallback)
        closure_info = self._analyze_while_closure(node, parent_context, mode)
        
        if closure_info and closure_info.get("success"):
            # Análisis exitoso: usar expresiones concretas
            iterations = closure_info["iterations"]
            var_name = closure_info["variable"]
            change_rule = closure_info["change_rule"]
            limit = closure_info["limit"]
            operator = closure_info["operator"]
            initial_value = closure_info.get("initial_value")
            
            # Convertir iteraciones (string) a SymPy
            try:
                iterations_expr = sympify(iterations)
            except:
                # Fallback: usar string y convertir después
                iterations_expr = self._str_to_sympy(iterations)
            
            mult_expr = iterations_expr
            
            # Si hay multiplicadores externos (anidado), integrar
            if hasattr(self, 'loop_stack') and self.loop_stack:
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
            
            # Agregar información del modo si es best case y hay 0 iteraciones
            if mode_info == "best" and iterations == "0":
                if initial_value:
                    note_text = f"Condición del bucle while en línea {L} (best case: condición falsa desde el inicio, variable {var_name} inicializada en {initial_value})"
                else:
                    note_text = f"Condición del bucle while en línea {L} (best case: condición falsa desde el inicio, variable {var_name})"
            elif mode_info == "best":
                if initial_value:
                    note_text = f"Condición del bucle while en línea {L} (best case: variable {var_name} inicializada en {initial_value}, cambia en {change_op} {change_const}, límite: {var_name} {operator} {limit})"
                else:
                    note_text = f"Condición del bucle while en línea {L} (best case: variable {var_name} cambia en {change_op} {change_const}, límite: {var_name} {operator} {limit})"
            elif mode_info == "worst":
                if initial_value:
                    note_text = f"Condición del bucle while en línea {L} (worst case: variable {var_name} inicializada en {initial_value}, cambia en {change_op} {change_const}, límite: {var_name} {operator} {limit})"
                else:
                    note_text = f"Condición del bucle while en línea {L} (worst case: variable {var_name} cambia en {change_op} {change_const}, límite: {var_name} {operator} {limit})"
            else:
                if initial_value:
                    note_text = f"Condición del bucle while en línea {L} (variable {var_name} inicializada en {initial_value}, cambia en {change_op} {change_const}, límite: {var_name} {operator} {limit})"
                else:
                    note_text = f"Condición del bucle while en línea {L} (variable {var_name} cambia en {change_op} {change_const}, límite: {var_name} {operator} {limit})"
            
            self.add_row(
                line=L,
                kind="while",
                ck=ck_cond,
                count=cond_count,
                note=note_text
            )
            
            # 2) Cuerpo: se ejecuta iterations veces
            # En best case con 0 iteraciones, el multiplicador debe ser 0
            if mode == "best" and iterations == "0":
                # El cuerpo no se ejecuta, usar multiplicador 0
                self.push_multiplier(Integer(0))
            else:
                self.push_multiplier(mult_expr)
            
            # Visitar el cuerpo del bucle
            body = node.get("body")
            if body:
                self.visit(body, mode)
            
            self.pop_multiplier()
        else:
            # Paso 3: Fallback - usar símbolo iterativo con nota mejorada
            if mode == "avg":
                # En promedio, usar símbolo t̄_while_L (esperanza)
                t_bar = f"\\bar{{t}}_{{while_{L}}}"
                t_sym = Symbol(f"t_bar_while_{L}", real=True, positive=True)
                note_text = (
                    f"Condición del bucle while en línea {L} "
                    f"(avg: E[#iteraciones] = {t_bar}). "
                    f"Variable iterativa no acotada - requiere análisis adicional para determinar límites."
                )
            else:
                # En worst/best, usar símbolo t_while_L
                t_sym = Symbol(t, real=True)
                note_text = (
                    f"Condición del bucle while en línea {L}. "
                    f"Variable iterativa {t} no acotada - no se pudo determinar el número de iteraciones. "
                    f"Requiere análisis adicional o asumir límites según el caso ({mode} case)."
                )
            
            # 1) Condición: se evalúa (t + 1) veces
            ck_cond = self.C()
            cond_count = t_sym + Integer(1)
            self.add_row(
                line=L,
                kind="while",
                ck=ck_cond,
                count=cond_count,
                note=note_text
            )
            
            # 2) Cuerpo: se ejecuta t veces
            self.push_multiplier(t_sym)
            
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
