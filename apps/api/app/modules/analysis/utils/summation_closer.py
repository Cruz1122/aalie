from typing import List, Tuple, Optional, Union
from sympy import Symbol, summation, simplify, latex, sympify, Sum, expand, factor, Expr, Add, Mul
from sympy.parsing.sympy_parser import parse_expr
import re


class SummationCloser:
    """
    Cierra sumatorias usando SymPy y genera procedimientos educativos paso a paso.
    
    Maneja casos canónicos:
    - Sumatorias simples: \\sum_{i=1}^{n} 1 → n
    - Sumatorias anidadas rectangulares: \\sum_{i=1}^{n} \\sum_{j=1}^{m} 1 → n \\cdot m
    - Sumatorias triangulares: \\sum_{i=1}^{n} \\sum_{j=1}^{i} 1 → \\frac{n(n+1)}{2}
    - Sumatorias con límites dependientes: \\sum_{i=1}^{n-1} \\sum_{j=i+1}^{n} 1 → \\frac{n(n-1)}{2}
    
    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """
    
    def __init__(self):
        """
        Inicializa una instancia de SummationCloser.
        
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        pass
    
    def _has_iterative_symbols(self, expr: Expr) -> bool:
        """
        Verifica si una expresión contiene símbolos iterativos (t_while_L, t_repeat_L, etc.).
        
        Args:
            expr: Expresión SymPy
            
        Returns:
            True si contiene símbolos iterativos, False en caso contrario
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        from sympy import preorder_traversal
        
        # Patrones de nombres de símbolos iterativos
        iterative_patterns = [
            't_while_',
            't_repeat_',
            't_bar_while_',
            't_bar_repeat_',
            'bar{t}_{while_',
            'bar{t}_{repeat_',
        ]
        
        for subexpr in preorder_traversal(expr):
            if isinstance(subexpr, Symbol):
                symbol_name = subexpr.name if hasattr(subexpr, 'name') else str(subexpr)
                # Verificar si el nombre del símbolo coincide con algún patrón iterativo
                for pattern in iterative_patterns:
                    if pattern in symbol_name:
                        return True
        
        return False
    
    def _has_summations(self, expr: Expr) -> bool:
        """
        Verifica si una expresión contiene sumatorias.
        
        Args:
            expr: Expresión SymPy
            
        Returns:
            True si contiene sumatorias, False en caso contrario
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        from sympy import preorder_traversal
        
        for subexpr in preorder_traversal(expr):
            if isinstance(subexpr, Sum):
                return True
        
        return False
    
    def close_summation(self, expr: Union[str, Expr], variable: str = "n") -> Tuple[str, List[str]]:
        """
        Cierra una sumatoria y genera pasos educativos.
        
        Args:
            expr: Expresión LaTeX con sumatorias (ej: "\\sum_{i=1}^{n} 1") o Expr de SymPy
            variable: Variable principal (por defecto "n")
            
        Returns:
            Tupla (expresión_cerrada_latex, lista_de_pasos_en_latex)
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        # Si recibimos un objeto SymPy directamente, trabajar con él
        if isinstance(expr, Expr):
            try:
                # Verificar si contiene símbolos iterativos
                has_iterative = self._has_iterative_symbols(expr)
                has_sums = self._has_summations(expr)
                
                # Si solo contiene símbolos iterativos (sin sumatorias), generar pasos educativos
                if has_iterative and not has_sums:
                    # Es una expresión con símbolos iterativos pero sin sumatorias
                    # No intentar cerrarla, solo simplificar y generar pasos educativos
                    result_expr = simplify(expr)
                    
                    # Intentar simplificar algebraicamente (ej: t + 1, 2*t, etc.)
                    try:
                        expanded = expand(result_expr)
                        result_expr = simplify(expanded)
                    except Exception:
                        pass
                    
                    # Convertir a LaTeX
                    closed_latex = self._sympy_to_latex(result_expr)
                    
                    # Generar pasos educativos explicando el símbolo iterativo
                    steps = [
                        f"\\text{{Expresión con variable iterativa no acotada: }} {closed_latex}",
                        f"\\text{{Esta variable representa el número de iteraciones de un bucle no acotado.}}",
                        f"\\text{{Requiere análisis adicional o asumir límites para acotar.}}",
                        f"\\text{{Resultado: }} {closed_latex}"
                    ]
                    
                    return closed_latex, steps
                
                # Generar pasos educativos desde la estructura SymPy
                # Intentar obtener el resultado evaluado directamente si es una suma aritmética
                steps = []
                result_expr = None
                
                # Si la expresión es directamente una Sum, intentar analizarla para obtener el resultado
                if isinstance(expr, Sum):
                    steps_result = self._analyze_single_sum(expr, variable)
                    if isinstance(steps_result, tuple):
                        steps_list, evaluated = steps_result
                        steps = steps_list
                        if evaluated is not None:
                            result_expr = evaluated
                
                # Si no se obtuvo resultado, generar pasos y evaluar normalmente
                if result_expr is None:
                    steps = self._generate_steps_from_sympy(expr, variable)
                    # Evaluar todas las sumatorias recursivamente
                    result_expr = self._evaluate_all_sums_sympy(expr)
                
                # Simplificar completamente el resultado
                result_expr = simplify(result_expr)
                
                # Intentar expandir y factorizar para obtener la forma más simple
                try:
                    expanded = expand(result_expr)
                    result_expr = simplify(expanded)
                except Exception:
                    pass
                
                # Verificar si aún hay Sum sin evaluar y forzar su evaluación
                from sympy import preorder_traversal
                has_sum = False
                for subexpr in preorder_traversal(result_expr):
                    if isinstance(subexpr, Sum):
                        has_sum = True
                        break
                
                if has_sum:
                    # Hay sumatorias sin evaluar, intentar evaluarlas todas
                    result_expr = result_expr.replace(lambda x: isinstance(x, Sum), lambda x: x.doit())
                    result_expr = simplify(result_expr)
                
                # Verificar y eliminar variables de iteración que no deberían estar en el resultado final
                # Las variables i, j, k son variables de iteración que deben ser eliminadas
                iteration_vars = ['i', 'j', 'k']
                for var_name in iteration_vars:
                    var_symbol = Symbol(var_name, integer=True)
                    if result_expr.has(var_symbol):
                        # La expresión todavía contiene una variable de iteración
                        # Esto significa que alguna sumatoria no se evaluó completamente
                        # Intentar forzar la evaluación expandiendo y simplificando
                        try:
                            result_expr = expand(result_expr)
                            result_expr = simplify(result_expr)
                            # Si aún contiene la variable, intentar factorizar y simplificar
                            if result_expr.has(var_symbol):
                                result_expr = factor(result_expr)
                                result_expr = simplify(result_expr)
                                # Si todavía queda, intentar evaluar sumatorias restantes
                                if result_expr.has(var_symbol):
                                    from sympy import Sum as SymSum
                                    if isinstance(result_expr, SymSum):
                                        result_expr = result_expr.doit()
                                        result_expr = expand(result_expr)
                                        result_expr = simplify(result_expr)
                                    # Si todavía queda después de todo, sustituir por 0
                                    if result_expr.has(var_symbol):
                                        print(f"[SummationCloser] Advertencia: Variable de iteración {var_name} todavía presente en resultado final, sustituyendo por 0")
                                        from sympy import Integer as SymInteger
                                        result_expr = result_expr.subs(var_symbol, SymInteger(0))
                                        result_expr = simplify(result_expr)
                        except Exception as e:
                            print(f"[SummationCloser] Error eliminando variable de iteración {var_name}: {e}")
                            # Fallback: sustituir por 0
                            try:
                                from sympy import Integer as SymInteger
                                result_expr = result_expr.subs(var_symbol, SymInteger(0))
                                result_expr = simplify(result_expr)
                            except:
                                pass
                
                # Convertir a LaTeX
                closed_latex = self._sympy_to_latex(result_expr)
                
                # Validación final: verificar que no haya variables de iteración en el LaTeX
                if any(var in closed_latex for var in ['\\left(i', '(i', 'i)', '\\left(j', '(j', 'j)', '\\left(k', '(k', 'k)']):
                    print(f"[SummationCloser] ERROR: Resultado LaTeX todavía contiene variables de iteración: {closed_latex}")
                
                # Agregar resultado final si no está en los pasos
                if steps:
                    # Verificar si el último paso ya contiene el resultado
                    last_step = steps[-1]
                    if closed_latex not in last_step and "Resultado" not in last_step:
                        steps.append(f"\\text{{Resultado: }} {closed_latex}")
                else:
                    steps = [f"\\text{{Resultado: }} {closed_latex}"]
                
                return closed_latex, steps
            except Exception as e:
                print(f"[SummationCloser] Error procesando Expr directamente: {e}")
                import traceback
                traceback.print_exc()
                # Fallback: convertir a string y procesar normalmente
                expr = latex(expr) if hasattr(expr, '__str__') else str(expr)
        
        # Asegurar que expr sea un string
        if not isinstance(expr, str):
            try:
                expr = str(expr)
            except Exception:
                expr = "1"
        
        if not expr or expr.strip() == "":
            return "1", []
        
        # Verificar si el string contiene símbolos iterativos en formato LaTeX
        iterative_patterns_latex = [
            r't_\{while_',
            r't_\{repeat_',
            r'\\bar\{t\}_\{while_',
            r'\\bar\{t\}_\{repeat_',
            r'bar\{t\}_\{while_',
            r'bar\{t\}_\{repeat_',
        ]
        
        has_iterative_latex = False
        for pattern in iterative_patterns_latex:
            if re.search(pattern, expr):
                has_iterative_latex = True
                break
        
        # Si contiene símbolos iterativos y no hay sumatorias, manejar como símbolo iterativo
        has_sums_latex = '\\sum' in expr
        if has_iterative_latex and not has_sums_latex:
            # Es una expresión con símbolos iterativos pero sin sumatorias
            # Intentar simplificar algebraicamente
            try:
                # Convertir a SymPy para simplificar
                sympy_expr = self._parse_algebraic_to_sympy(expr, variable)
                simplified = simplify(sympy_expr)
                closed_latex = self._sympy_to_latex(simplified)
                
                # Generar pasos educativos
                steps = [
                    f"\\text{{Expresión con variable iterativa no acotada: }} {expr}",
                    f"\\text{{Esta variable representa el número de iteraciones de un bucle no acotado.}}",
                    f"\\text{{Requiere análisis adicional o asumir límites para acotar.}}",
                    f"\\text{{Resultado: }} {closed_latex}"
                ]
                
                return closed_latex, steps
            except Exception as e:
                print(f"[SummationCloser] Error procesando símbolo iterativo {expr}: {e}")
                # Fallback: devolver expresión original con pasos educativos
                steps = [
                    f"\\text{{Expresión con variable iterativa no acotada: }} {expr}",
                    f"\\text{{Esta variable representa el número de iteraciones de un bucle no acotado.}}",
                    f"\\text{{Requiere análisis adicional o asumir límites para acotar.}}",
                    f"\\text{{Resultado: }} {expr}"
                ]
                return expr, steps
        
        # Primero, simplificar expresiones algebraicas sin sumatorias
        # Esto maneja casos como "(n) - (2) + 2" → "n"
        simplified_expr = self._simplify_algebraic_expression(expr, variable)
        if simplified_expr != expr:
            steps = [f"\\text{{Simplificando expresión algebraica: }} {expr} → {simplified_expr}"]
            expr = simplified_expr
        else:
            steps = []
        
        # Detectar tipo de patrón
        pattern_type = self._detect_pattern(expr)
        
        # Generar pasos según el patrón
        if pattern_type == 'constant_sum':
            pattern_steps = self._generate_constant_sum_steps(expr, variable)
            steps.extend(pattern_steps)
        elif pattern_type == 'triangular':
            pattern_steps = self._generate_triangular_steps(expr, variable)
            steps.extend(pattern_steps)
        elif pattern_type == 'nested_rectangular':
            pattern_steps = self._generate_nested_rectangular_steps(expr, variable)
            steps.extend(pattern_steps)
        elif pattern_type == 'arithmetic_sum':
            pattern_steps = self._generate_arithmetic_sum_steps(expr, variable)
            steps.extend(pattern_steps)
        else:
            pattern_steps = self._generate_generic_steps(expr, variable)
            steps.extend(pattern_steps)
        
        # Evaluar con SymPy
        try:
            closed_expr = self._evaluate_with_sympy(expr, variable)
            closed_latex = self._sympy_to_latex(closed_expr)
            
            # Si el resultado es diferente a la entrada, agregar paso final
            if closed_latex != expr:
                if steps and not any("Resultado final" in step or "Forma final" in step for step in steps):
                    steps.append(f"\\text{{Resultado final: }} {closed_latex}")
            elif not steps:
                steps.append(f"\\text{{Resultado: }} {closed_latex}")
            
            return closed_latex, steps
        except Exception as e:
            print(f"[SummationCloser] Error evaluando {expr}: {e}")
            import traceback
            traceback.print_exc()
            # Fallback: devolver expresión original
            if not steps:
                steps.append(f"\\text{{No se pudo simplificar: }} {expr}")
            return expr, steps
    
    def _detect_pattern(self, expr: str) -> str:
        """
        Detecta el tipo de patrón de sumatoria.
        
        Returns:
            Tipo de patrón: 'constant_sum', 'triangular', 'nested_rectangular', 'arithmetic_sum', 'generic'
        """
        # Asegurar que expr sea un string
        if not isinstance(expr, str):
            return 'generic'
        
        # Detectar sumatoria constante: \sum_{i=1}^{n} 1
        if re.search(r'\\sum.*\^.*\}\s*1\s*$', expr) and expr.count('\\sum') == 1:
            return 'constant_sum'
        
        # Detectar sumatoria aritmética: \sum_{i=1}^{n} i
        if re.search(r'\\sum_\{(\w+)=([^}]+)\}\^\{([^}]+)\}\s*\1\s*$', expr):
            return 'arithmetic_sum'
        
        # Detectar sumatoria triangular: \sum_{i=1}^{n} \sum_{j=1}^{i} ...
        if re.search(r'\\sum.*\^.*\{i\}', expr) and expr.count('\\sum') == 2:
            return 'triangular'
        
        # Detectar sumatorias anidadas rectangulares (independientes)
        if expr.count('\\sum') == 2:
            return 'nested_rectangular'
        
        return 'generic'
    
    def _generate_constant_sum_steps(self, expr: str, variable: str) -> List[str]:
        """Genera pasos para sumatoria constante."""
        steps = []
        
        # Extraer variable, inicio y fin
        match = re.search(r'\\sum_\{(\w+)=([^}]+)\}\^\{([^}]+)\}', expr)
        if match:
            var, start, end = match.groups()
            
            # Simplificar límites si son numéricos
            try:
                start_val = int(start) if start.strip().isdigit() else start
                end_val = int(end) if end.strip().isdigit() else end
            except Exception:
                # start_val y end_val no se usan después, pero se mantienen para compatibilidad
                pass
            
            # Generar paso explicativo
            if start == '1' and end == variable:
                steps.append(
                    f"\\text{{Aplicando fórmula de sumatoria constante: }} "
                    f"\\sum_{{{var}={start}}}^{{{end}}} 1 = {end}"
                )
            elif start == '0' and end == variable:
                steps.append(
                    f"\\text{{Aplicando fórmula de sumatoria constante: }} "
                    f"\\sum_{{{var}={start}}}^{{{end}}} 1 = {end} + 1"
                )
            else:
                steps.append(
                    f"\\text{{Aplicando fórmula de sumatoria constante: }} "
                    f"\\sum_{{{var}={start}}}^{{{end}}} 1 = {end} - {start} + 1"
                )
        
        return steps
    
    def _generate_triangular_steps(self, expr: str, variable: str) -> List[str]:
        """Genera pasos para sumatoria triangular."""
        steps = []
        
        # Extraer información de las sumatorias anidadas
        inner_match = re.search(r'\\sum_\{(\w+)=([^}]+)\}\^\{(\w+)\}\s*1', expr)
        outer_match = re.search(r'\\sum_\{(\w+)=([^}]+)\}\^\{([^}]+)\}', expr)
        
        if inner_match and outer_match:
            inner_var, inner_start, inner_end = inner_match.groups()
            outer_var, outer_start, outer_end = outer_match.groups()
            
            if inner_end == outer_var:  # Triangular: \sum_{i=1}^{n} \sum_{j=1}^{i} 1
                steps.append(
                    f"\\text{{Evaluando sumatoria interna: }} "
                    f"\\sum_{{{inner_var}={inner_start}}}^{{{inner_end}}} 1 = {inner_end}"
                )
                steps.append(
                    f"\\text{{Sustituyendo: }} \\sum_{{{outer_var}={outer_start}}}^{{{outer_end}}} {outer_var}"
                )
                steps.append(
                    f"\\text{{Aplicando fórmula de suma aritmética: }} "
                    f"\\sum_{{{outer_var}={outer_start}}}^{{{outer_end}}} {outer_var} = \\frac{{{outer_end}({outer_end}+1)}}{{2}}"
                )
        
        return steps
    
    def _generate_nested_rectangular_steps(self, expr: str, variable: str) -> List[str]:
        """Genera pasos para sumatorias anidadas rectangulares."""
        steps = []
        
        # Extraer ambas sumatorias
        matches = list(re.finditer(r'\\sum_\{(\w+)=([^}]+)\}\^\{([^}]+)\}', expr))
        
        if len(matches) >= 2:
            inner_match = matches[-1]  # La más interna
            outer_match = matches[-2]   # La externa
            
            inner_var, inner_start, inner_end = inner_match.groups()
            outer_var, outer_start, outer_end = outer_match.groups()
            
            steps.append(
                f"\\text{{Evaluando sumatoria interna: }} "
                f"\\sum_{{{inner_var}={inner_start}}}^{{{inner_end}}} 1 = {inner_end} - {inner_start} + 1"
            )
            
            # Simplificar si es posible
            if inner_start == '1':
                steps.append(
                    f"\\text{{Simplificando: }} {inner_end} - 1 + 1 = {inner_end}"
                )
            
            steps.append(
                f"\\text{{Sustituyendo: }} \\sum_{{{outer_var}={outer_start}}}^{{{outer_end}}} ({inner_end})"
            )
            steps.append(
                f"\\text{{Aplicando factor constante: }} "
                f"{inner_end} \\cdot \\sum_{{{outer_var}={outer_start}}}^{{{outer_end}}} 1 = "
                f"{inner_end} \\cdot ({outer_end} - {outer_start} + 1)"
            )
        
        return steps
    
    def _generate_arithmetic_sum_steps(self, expr: str, variable: str) -> List[str]:
        """Genera pasos para sumatoria aritmética."""
        steps = []
        
        match = re.search(r'\\sum_\{(\w+)=([^}]+)\}\^\{([^}]+)\}\s*\1', expr)
        if match:
            var, start, end = match.groups()
            
            # Convertir a números si es posible para calcular correctamente
            try:
                start_val = int(start) if start.strip().isdigit() else start
                # end_val no se usa después
                
                if start_val == 1:
                    # Caso especial: suma desde 1
                    steps.append(
                        f"\\text{{Aplicando fórmula de suma aritmética: }} "
                        f"\\sum_{{{var}={start}}}^{{{end}}} {var} = \\frac{{{end}({end}+1)}}{{2}}"
                    )
                else:
                    # Caso general: suma desde a hasta b
                    # Fórmula: Σ_{i=a}^{b} i = (b(b+1))/2 - ((a-1)a)/2
                    start_minus_one = start_val - 1
                    steps.append(
                        f"\\text{{Aplicando fórmula de suma aritmética: }} "
                        f"\\sum_{{{var}={start}}}^{{{end}}} {var} = "
                        f"\\sum_{{{var}=1}}^{{{end}}} {var} - \\sum_{{{var}=1}}^{{{start_minus_one}}} {var}"
                    )
                    steps.append(
                        f"\\text{{Evaluando: }} "
                        f"\\frac{{{end}({end}+1)}}{{2}} - \\frac{{{start_minus_one}({start})}}{{2}}"
                    )
            except Exception:
                # Si no se puede convertir a números, usar fórmula general
                steps.append(
                    f"\\text{{Aplicando fórmula de suma aritmética: }} "
                    f"\\sum_{{{var}={start}}}^{{{end}}} {var} = "
                    f"\\frac{{{end}({end}+1) - {start}({start}-1)}}{{2}}"
                )
        
        return steps
    
    def _generate_generic_steps(self, expr: str, variable: str) -> List[str]:
        """Genera pasos genéricos usando SymPy."""
        steps = []
        
        # Intentar simplificar paso a paso
        try:
            steps.append(f"\\text{{Simplificando expresión: }} {expr}")
            # SymPy manejará la simplificación
        except Exception:
            steps.append(f"\\text{{No se pudo simplificar automáticamente: }} {expr}")
        
        return steps
    
    def _latex_to_sympy(self, expr: str, variable: str = "n") -> Expr:
        """
        Convierte una expresión LaTeX a SymPy (método legacy para compatibilidad).
        
        Args:
            expr: Expresión LaTeX
            variable: Variable principal
            
        Returns:
            Expresión SymPy
        """
        # Este método se mantiene para compatibilidad con código legacy
        # pero ahora simplemente delega a la lógica existente
        return self._evaluate_with_sympy(expr, variable)
    
    def _evaluate_with_sympy(self, expr: str, variable: str = "n") -> Expr:
        """
        Evalúa una expresión con sumatorias usando SymPy.
        
        Args:
            expr: Expresión LaTeX con sumatorias
            variable: Variable principal
            
        Returns:
            Expresión SymPy simplificada
        """
        # Crear símbolos (algunos no se usan pero se mantienen para compatibilidad futura)
        # n = Symbol(variable, integer=True, positive=True)  # No usado actualmente
        # i = Symbol('i', integer=True)  # No usado actualmente
        # j = Symbol('j', integer=True)  # No usado actualmente
        # k = Symbol('k', integer=True)  # No usado actualmente
        
        # Convertir LaTeX a expresión SymPy
        sympy_expr = self._latex_to_sympy(expr, variable)
        
        # Evaluar sumatorias
        result = simplify(sympy_expr)
        
        return result
    
    def _latex_to_sympy(self, expr: str, variable: str = "n") -> 'Expr':
        """
        Convierte una expresión LaTeX a SymPy.
        
        Args:
            expr: Expresión LaTeX
            variable: Variable principal
            
        Returns:
            Expresión SymPy
        """
        # Crear símbolos (algunos no se usan pero se mantienen para compatibilidad futura)
        # n = Symbol(variable, integer=True, positive=True)  # No usado actualmente
        # i = Symbol('i', integer=True)  # No usado actualmente
        # j = Symbol('j', integer=True)  # No usado actualmente
        # k = Symbol('k', integer=True)  # No usado actualmente
        
        # Si la expresión ya no tiene sumatorias, convertir directamente
        if '\\sum' not in expr:
            return self._parse_algebraic_to_sympy(expr, variable)
        
        # Reemplazar sumatorias LaTeX por SymPy Sum
        # Patrón: \sum_{var=start}^{end} body
        
        # Primero, manejar sumatorias anidadas (de adentro hacia afuera)
        # Buscar la sumatoria más interna (sin otras sumatorias dentro de su cuerpo)
        while '\\sum' in expr:
            # Encontrar todas las sumatorias
            sum_pattern = r'\\sum_\{(\w+)=([^}]+)\}\^\{([^}]+)\}'
            all_sums = list(re.finditer(sum_pattern, expr))
            
            if not all_sums:
                break
            
            # Encontrar la sumatoria más interna (la última que no contiene otras sumatorias)
            innermost_match = None
            for match in reversed(all_sums):
                # Extraer el cuerpo después de esta sumatoria
                start_pos = match.end()
                # Buscar el cuerpo hasta el siguiente \\sum o fin de expresión
                remaining = expr[start_pos:]
                # Verificar si hay más sumatorias en el cuerpo inmediato
                # Buscar hasta encontrar un paréntesis de cierre o el final
                body_end_pos = start_pos
                if remaining.startswith('('):
                    # Buscar paréntesis balanceado
                    depth = 0
                    for idx, char in enumerate(remaining):
                        if char == '(':
                            depth += 1
                        elif char == ')':
                            depth -= 1
                            if depth == 0:
                                body_end_pos = start_pos + idx + 1
                                break
                else:
                    # Buscar hasta el siguiente operador o fin
                    for idx, char in enumerate(remaining):
                        if char in ['+', '-', '*', '\\'] or remaining[idx:idx+5] == '\\sum':
                            body_end_pos = start_pos + idx
                            break
                    else:
                        body_end_pos = len(expr)
                
                # Verificar si hay sumatorias en el cuerpo
                body_section = expr[start_pos:body_end_pos]
                if '\\sum' not in body_section:
                    innermost_match = match
                    break
            
            if not innermost_match:
                # Si no encontramos una sin sumatorias internas, tomar la última
                innermost_match = all_sums[-1]
            
            var_name, start_str, end_str = innermost_match.groups()
            
            # Extraer el cuerpo de la sumatoria (puede tener paréntesis anidados)
            body_start = innermost_match.end()
            body_str = self._extract_sum_body(expr, body_start)
            
            if not body_str:
                # Si no se puede extraer el cuerpo, intentar con el patrón simple
                body_str = "1"  # Fallback
            
            # Convertir límites a SymPy
            start_expr = self._parse_limit(start_str, variable)
            end_expr = self._parse_limit(end_str, variable)
            
            # Convertir cuerpo a SymPy (puede contener expresiones complejas)
            try:
                body_expr = self._parse_body(body_str, variable)
            except Exception:
                body_expr = 1  # Fallback
            
            # Crear Sum de SymPy
            var_sym = Symbol(var_name, integer=True)
            sum_expr = Sum(body_expr, (var_sym, start_expr, end_expr))
            
            # Evaluar la sumatoria
            try:
                # Usar summation() directamente en lugar de Sum().doit() para mejor manejo
                # de sumatorias donde el cuerpo depende de la variable de la sumatoria
                try:
                    evaluated = summation(body_expr, (var_sym, start_expr, end_expr))
                    # Simplificar el resultado
                    evaluated = simplify(evaluated)
                except Exception as e1:
                    print(f"[SummationCloser] Error usando summation(), intentando con Sum().doit(): {e1}")
                    # Fallback: usar Sum().doit()
                    evaluated = sum_expr.doit()
                    evaluated = simplify(evaluated)
                
                # Si el resultado es None o nan, intentar con Sum().doit() como fallback
                if evaluated is None or str(evaluated) in ['nan', 'oo', '-oo']:
                    evaluated = sum_expr.doit()
                    evaluated = simplify(evaluated)
                
                # Verificar si el resultado aún contiene la variable de la sumatoria
                # Si es así, intentar expandir y simplificar más
                if var_name in str(evaluated):
                    try:
                        evaluated = expand(evaluated)
                        evaluated = simplify(evaluated)
                        # Si aún contiene la variable, intentar factorizar
                        if var_name in str(evaluated):
                            evaluated = factor(evaluated)
                            evaluated = simplify(evaluated)
                    except Exception as e:
                        print(f"[SummationCloser] Error expandiendo/factorizando: {e}")
                        pass
                
                evaluated_str = str(evaluated).strip()
                
                # Verificar que evaluated_str no tenga paréntesis mal formados
                # Si empieza con ')' sin un '(' correspondiente, hay un problema
                # También verificar si tiene ')' en medio sin '(' correspondiente antes
                if evaluated_str.startswith(')'):
                    # Esto no debería pasar, pero si pasa, limpiar
                    print(f"[SummationCloser] WARNING: evaluated_str empieza con ')': '{evaluated_str}'")
                    # Buscar el primer carácter que no sea ')' o espacios
                    start_idx = 0
                    for i, char in enumerate(evaluated_str):
                        if char != ')' and not char.isspace():
                            start_idx = i
                            break
                    if start_idx > 0:
                        evaluated_str = evaluated_str[start_idx:].strip()
                        print(f"[SummationCloser] Limpiado evaluated_str a: '{evaluated_str}'")
                
                # También verificar si hay paréntesis de cierre sin abrir en medio
                # Buscar el primer '(' que tenga un ')' correspondiente después
                open_count = 0
                valid_start = 0
                for i, char in enumerate(evaluated_str):
                    if char == '(':
                        open_count += 1
                        if open_count == 1:
                            valid_start = i
                    elif char == ')':
                        if open_count > 0:
                            open_count -= 1
                        else:
                            # Paréntesis de cierre sin abrir, empezar después de este
                            valid_start = i + 1
                
                # Si encontramos un inicio válido diferente, usar ese
                if valid_start > 0 and valid_start < len(evaluated_str):
                    # Verificar que desde valid_start la expresión esté balanceada
                    test_expr = evaluated_str[valid_start:]
                    if test_expr.count('(') == test_expr.count(')'):
                        evaluated_str = test_expr.strip()
                        print(f"[SummationCloser] Ajustado evaluated_str a: '{evaluated_str}'")
                
                # Simplificar paréntesis redundantes en el resultado evaluado
                # Ejemplo: ((n-1)) → n-1
                max_iterations = 10
                iteration = 0
                while evaluated_str.startswith('(') and evaluated_str.endswith(')') and iteration < max_iterations:
                    iteration += 1
                    inner = evaluated_str[1:-1]
                    if inner.count('(') == inner.count(')'):
                        evaluated_str = inner.strip()
                    else:
                        break
                
                # Reemplazar en la expresión original
                # Reemplazar desde el inicio de \sum hasta el final del cuerpo
                expr_before = expr[:innermost_match.start()]
                expr_after = expr[body_start + len(body_str):]
                
                # Limpiar paréntesis extra en expr_after si los hay
                # Esto puede pasar si el cuerpo tenía paréntesis y se reemplazó
                # Verificar balance de paréntesis en la expresión completa
                # Si expr_after empieza con ')' y no hay un '(' correspondiente antes, es un paréntesis extra
                
                # Contar paréntesis en expr_before + evaluated_str
                total_open = expr_before.count('(') + evaluated_str.count('(')
                total_close = expr_before.count(')') + evaluated_str.count(')')
                
                # Si expr_after empieza con ')' y ya hay más cierres que aperturas, es un paréntesis extra
                if expr_after.startswith(')') and total_close >= total_open:
                    # Verificar si el cuerpo tenía paréntesis que se eliminaron
                    if body_str.startswith('(') and body_str.endswith(')'):
                        # El cuerpo tenía paréntesis, verificar si evaluated_str también los tiene
                        if not (evaluated_str.startswith('(') and evaluated_str.endswith(')')):
                            # El resultado no tiene paréntesis pero el cuerpo sí, hay un paréntesis extra
                            expr_after = expr_after[1:]
                            print(f"[SummationCloser] Eliminando paréntesis extra en expr_after")
                
                expr = expr_before + evaluated_str + expr_after
                
                # Verificar balance final y limpiar si es necesario
                final_open = expr.count('(')
                final_close = expr.count(')')
                if final_close > final_open:
                    # Hay paréntesis de cierre extra, limpiar al final
                    while expr.endswith(')') and final_close > final_open:
                        expr = expr[:-1]
                        final_close -= 1
                        print(f"[SummationCloser] Limpiando paréntesis extra al final")
                
                # Debug: mostrar el reemplazo
                replaced_part = expr[innermost_match.start():body_start + len(body_str)] if innermost_match.start() < len(expr) else ''
                print(f"[SummationCloser] Reemplazando: {replaced_part} → {evaluated_str}")
                print(f"[SummationCloser] expr_before: '{expr_before}', expr_after: '{expr_after}', evaluated_str: '{evaluated_str}'")
                print(f"[SummationCloser] Expresión resultante: '{expr}'")
            except Exception as e:
                print(f"[SummationCloser] Error evaluando sumatoria {var_name}: {e}")
                import traceback
                traceback.print_exc()
                break
        
        # Convertir expresión restante a SymPy (ya no debería tener sumatorias)
        try:
            # Limpiar paréntesis desbalanceados antes de parsear
            expr_clean = expr.strip()
            # Limpiar paréntesis extra al final
            while expr_clean.endswith(')') and expr_clean.count('(') < expr_clean.count(')'):
                expr_clean = expr_clean[:-1].strip()
            # Limpiar paréntesis extra al inicio
            while expr_clean.startswith('(') and expr_clean.count('(') > expr_clean.count(')'):
                expr_clean = expr_clean[1:].strip()
            
            return self._parse_algebraic_to_sympy(expr_clean, variable)
        except Exception as e:
            print(f"[SummationCloser] Error parseando expresión final {expr}: {e}")
            # Fallback: intentar parsear directamente
            try:
                expr_clean = expr.replace('\\cdot', '*').replace(' ', '').strip()
                # Limpiar paréntesis desbalanceados
                while expr_clean.endswith(')') and expr_clean.count('(') < expr_clean.count(')'):
                    expr_clean = expr_clean[:-1].strip()
                return sympify(expr_clean)
            except Exception:
                return sympify("0")  # Fallback final
    
    def _parse_limit(self, limit_str: str, variable: str) -> 'Expr':
        """Parsea un límite de sumatoria a SymPy."""
        limit_str = limit_str.strip()
        
        # Si es numérico
        if limit_str.isdigit():
            return int(limit_str)
        
        # Si es la variable principal
        if limit_str == variable:
            return Symbol(variable, integer=True, positive=True)
        
        # Si es una expresión como "n-1"
        try:
            return sympify(limit_str.replace(variable, variable))
        except Exception:
            return Symbol(limit_str, integer=True)
    
    def _simplify_algebraic_expression(self, expr: str, variable: str) -> str:
        """
        Simplifica expresiones algebraicas sin sumatorias.
        Maneja casos como: (n) - (2) + 2 → n, ((j_0) - (1)) + 1 → j_0
        """
        # Asegurar que expr sea un string
        if not isinstance(expr, str):
            try:
                expr = str(expr)
            except Exception:
                return "1"
        
        # Si no hay sumatorias, simplificar directamente
        if '\\sum' not in expr:
            try:
                # Convertir a SymPy y simplificar
                sympy_expr = self._parse_algebraic_to_sympy(expr, variable)
                simplified = simplify(sympy_expr)
                return self._sympy_to_latex(simplified)
            except Exception as e:
                print(f"[SummationCloser] Error simplificando expresión algebraica {expr}: {e}")
                return expr
        
        return expr
    
    def _parse_algebraic_to_sympy(self, expr: str, variable: str) -> 'Expr':
        """Parsea una expresión algebraica (sin sumatorias) a SymPy."""
        # Crear símbolos comunes
        n = Symbol(variable, integer=True, positive=True)
        
        # Normalizar formato LaTeX
        expr_normalized = expr.strip()
        
        # Limpiar paréntesis extra al inicio/final si están desbalanceados
        # Ejemplo: "n - 1)" → "n - 1"
        while expr_normalized.endswith(')') and not expr_normalized.startswith('('):
            # Contar paréntesis para verificar balance
            open_count = expr_normalized.count('(')
            close_count = expr_normalized.count(')')
            if close_count > open_count:
                expr_normalized = expr_normalized[:-1].strip()
            else:
                break
        
        # Limpiar paréntesis extra al inicio si están desbalanceados
        while expr_normalized.startswith('(') and not expr_normalized.endswith(')'):
            open_count = expr_normalized.count('(')
            close_count = expr_normalized.count(')')
            if open_count > close_count:
                expr_normalized = expr_normalized[1:].strip()
            else:
                break
        
        # Reemplazar operadores LaTeX y comandos especiales
        expr_normalized = expr_normalized.replace('\\cdot', '*')
        expr_normalized = expr_normalized.replace('\\left', '')
        expr_normalized = expr_normalized.replace('\\right', '')
        expr_normalized = expr_normalized.replace('\\leq', '<=')
        expr_normalized = expr_normalized.replace('\\geq', '>=')
        expr_normalized = expr_normalized.replace('\\substack', '')
        expr_normalized = expr_normalized.replace('\\\\', '')
        expr_normalized = expr_normalized.replace(' ', '')
        
        # Simplificar paréntesis redundantes: ((x)) → x, pero mantener estructura necesaria
        # Primero, detectar y crear símbolos para variables con subíndices
        constant_pattern = r'(\w+)_(\d+)'
        constants = {}
        for match in re.finditer(constant_pattern, expr_normalized):
            const_name = match.group(0)  # ej: "j_0"
            if const_name not in constants:
                constants[const_name] = Symbol(const_name, real=True)
        
        # Crear contexto de símbolos
        syms = {variable: n}
        syms.update(constants)
        
        # Simplificar paréntesis redundantes ANTES de intentar parsear
        # Remover paréntesis externos redundantes iterativamente
        # Ejemplo: (((x))) → x
        max_iterations = 20  # Aumentar para casos más complejos
        iteration = 0
        prev_expr = ""
        while expr_normalized.startswith('(') and expr_normalized.endswith(')') and iteration < max_iterations:
            iteration += 1
            # Evitar loops infinitos
            if expr_normalized == prev_expr:
                break
            prev_expr = expr_normalized
            
            inner = expr_normalized[1:-1]
            inner_open = inner.count('(')
            inner_close = inner.count(')')
            if inner_open == inner_close:
                expr_normalized = inner.strip()
            else:
                break
        
        # Intentar simplificar paréntesis redundantes parseando y re-parseando
        try:
            # Primero intentar parsear directamente
            parsed = sympify(expr_normalized, locals=syms)
            # Simplificar para eliminar paréntesis redundantes
            simplified = simplify(parsed)
            return simplified
        except Exception as e1:
            print(f"[SummationCloser] Error parseando {expr_normalized}: {e1}")
            # El problema puede ser que aún hay paréntesis redundantes o que SymPy no puede parsear j_0
            # Intentar simplificar paréntesis manualmente antes de parsear
            # El problema puede ser que aún hay paréntesis redundantes
            try:
                # Remover TODOS los paréntesis externos redundantes posibles
                max_iterations = 20
                iteration = 0
                prev_expr = ""
                while expr_normalized.startswith('(') and expr_normalized.endswith(')') and iteration < max_iterations:
                    iteration += 1
                    if expr_normalized == prev_expr:
                        break
                    prev_expr = expr_normalized
                    
                    inner = expr_normalized[1:-1]
                    inner_open = inner.count('(')
                    inner_close = inner.count(')')
                    if inner_open == inner_close:
                        expr_normalized = inner.strip()
                    else:
                        break
                
                print(f"[SummationCloser] Después de simplificar paréntesis: {expr_normalized}")
                
                # Intentar parsear de nuevo después de simplificar
                parsed = sympify(expr_normalized, locals=syms)
                simplified = simplify(parsed)
                return simplified
            except Exception as e2:
                print(f"[SummationCloser] Error parseando después de simplificar paréntesis {expr_normalized}: {e2}")
                # Fallback: intentar sin contexto de símbolos
                try:
                    return sympify(expr_normalized)
                except Exception as e3:
                    print(f"[SummationCloser] Error final parseando {expr_normalized}: {e3}")
                    # Último fallback: intentar evaluar la expresión paso a paso
                    # Si contiene j_0, intentar simplificar manualmente
                    if 'j_0' in expr_normalized or 'i_0' in expr_normalized:
                        # Intentar usar parse_expr de SymPy que es más robusto
                        try:
                            # parse_expr puede manejar mejor expresiones complejas
                            parsed = parse_expr(expr_normalized, local_dict=syms)
                            simplified = simplify(parsed)
                            return simplified
                        except Exception as e4:
                            print(f"[SummationCloser] Error con parse_expr {expr_normalized}: {e4}")
                            pass
                    # Si todo falla, devolver el símbolo desconocido
                    return Symbol('unknown', real=True)
    
    def _parse_body(self, body: str, variable: str) -> 'Expr':
        """Parsea el cuerpo de una sumatoria a SymPy."""
        body = body.strip()
        
        # Si es "1"
        if body == "1":
            return 1
        
        # Si es la variable del índice (ej: "i")
        if len(body) == 1 and body.isalpha():
            return Symbol(body, integer=True)
        
        # Intentar parsear como expresión algebraica
        try:
            return self._parse_algebraic_to_sympy(body, variable)
        except Exception:
            return 1  # Fallback
    
    def _extract_sum_body(self, expr: str, start_pos: int) -> str:
        """
        Extrae el cuerpo de una sumatoria considerando paréntesis balanceados.
        
        Args:
            expr: Expresión completa
            start_pos: Posición donde comienza el cuerpo (después de ^{end})
            
        Returns:
            String con el cuerpo de la sumatoria (sin paréntesis externos si los hay)
        """
        if start_pos >= len(expr):
            return ""
        
        # Saltar espacios
        while start_pos < len(expr) and expr[start_pos].isspace():
            start_pos += 1
        
        if start_pos >= len(expr):
            return "1"  # Default
        
        # Si empieza con paréntesis, extraer contenido balanceado
        if expr[start_pos] == '(':
            # Contar paréntesis balanceados
            depth = 0
            i = start_pos
            while i < len(expr):
                if expr[i] == '(':
                    depth += 1
                elif expr[i] == ')':
                    depth -= 1
                    if depth == 0:
                        # Incluir el paréntesis de cierre
                        return expr[start_pos:i+1]
                i += 1
            # Si no se cerró, devolver hasta el final
            return expr[start_pos:]
        else:
            # Si no hay paréntesis, buscar hasta el siguiente operador o fin
            # Buscar hasta encontrar +, -, *, \sum, o fin de string
            i = start_pos
            while i < len(expr):
                # Verificar si encontramos un operador (pero no dentro de un nombre LaTeX)
                if i < len(expr) - 1:
                    # Verificar si es el inicio de \sum
                    if expr[i:i+5] == '\\sum':
                        break
                    # Verificar operadores binarios (pero no si es parte de un número negativo)
                    if expr[i] in ['+', '-'] and i > start_pos:
                        # Verificar que no sea parte de un número o variable
                        prev_char = expr[i-1]
                        if prev_char not in ['(', ' ', '*', '\\']:
                            break
                    elif expr[i] == '*' and i > start_pos:
                        break
                i += 1
            result = expr[start_pos:i].strip()
            return result if result else "1"
    
    def _sympy_to_latex(self, expr: 'Expr') -> str:
        """
        Convierte una expresión SymPy a LaTeX.
        
        Args:
            expr: Expresión SymPy
            
        Returns:
            String LaTeX
        """
        try:
            # Verificar y eliminar variables de iteración que no deberían estar en el resultado final
            iteration_vars = ['i', 'j', 'k']
            cleaned_expr = expr
            for var_name in iteration_vars:
                var_symbol = Symbol(var_name, integer=True)
                if cleaned_expr.has(var_symbol):
                    # La expresión todavía contiene una variable de iteración
                    # Intentar expandir, factorizar y simplificar para eliminarla
                    try:
                        from sympy import expand, factor, simplify
                        cleaned_expr = expand(cleaned_expr)
                        cleaned_expr = simplify(cleaned_expr)
                        if cleaned_expr.has(var_symbol):
                            cleaned_expr = factor(cleaned_expr)
                            cleaned_expr = simplify(cleaned_expr)
                    except Exception:
                        pass
            
            latex_str = latex(cleaned_expr)
            # Normalizar formato
            latex_str = latex_str.replace('*', ' \\cdot ')
            return latex_str
        except Exception:
            return str(expr)
    
    def _evaluate_all_sums_sympy(self, expr: Expr) -> Expr:
        """
        Evalúa recursivamente todas las sumatorias en una expresión SymPy.
        
        Args:
            expr: Expresión SymPy
            
        Returns:
            Expresión SymPy con todas las sumatorias evaluadas
        """
        from sympy import simplify, expand, factor, summation
        
        def evaluate_all_sums(expr: Expr) -> Expr:
            """Evalúa recursivamente todas las sumatorias en la expresión."""
            # Si es una Sum, evaluarla
            if isinstance(expr, Sum):
                try:
                    # Si la Sum tiene múltiples límites (sumatorias anidadas compactas),
                    # evaluarlas una por una de adentro hacia afuera
                    if len(expr.args) > 2:
                        # Tiene múltiples límites: Sum(body, (var1, a1, b1), (var2, a2, b2), ...)
                        # Evaluar de adentro hacia afuera
                        body = expr.args[0]
                        all_limits = list(expr.args[1:])
                        
                        # Crear sumatorias anidadas explícitas (de más interna a más externa)
                        # all_limits[0] es la más externa, all_limits[-1] es la más interna
                        result = body
                        for limit in reversed(all_limits):
                            # Evaluar esta sumatoria
                            if len(limit) >= 3:
                                var = limit[0]
                                start = limit[1]
                                end = limit[2]
                                # Usar summation() en lugar de Sum().doit() para mejor evaluación
                                try:
                                    result = summation(result, (var, start, end))
                                    result = simplify(result)
                                except Exception:
                                    # Fallback a Sum().doit()
                                    result = Sum(result, (var, start, end)).doit()
                                    result = simplify(result)
                        
                        return simplify(result)
                    else:
                        # Sumatoria simple con un solo límite
                        # Intentar usar summation() primero, que es más robusto para sumatorias simbólicas
                        body = expr.args[0]
                        limits = expr.args[1]
                        if len(limits) >= 3:
                            sum_var = limits[0]
                            start = limits[1]
                            end = limits[2]
                            try:
                                # Usar summation() que maneja mejor las sumatorias simbólicas
                                from sympy import summation
                                evaluated = summation(body, (sum_var, start, end))
                                evaluated = simplify(evaluated)
                                # Verificar si el resultado todavía contiene Sum, seguir evaluando
                                if isinstance(evaluated, Sum):
                                    return evaluate_all_sums(evaluated)
                                # Verificar si el resultado contiene más Sum anidadas
                                from sympy import preorder_traversal
                                has_nested_sum = False
                                for subexpr in preorder_traversal(evaluated):
                                    if isinstance(subexpr, Sum):
                                        has_nested_sum = True
                                        break
                                if has_nested_sum:
                                    return evaluate_all_sums(evaluated)
                                return evaluated
                            except Exception as e1:
                                # Fallback a doit()
                                try:
                                    evaluated = expr.doit()
                                    evaluated = simplify(evaluated)
                                    # Si el resultado todavía contiene Sum, seguir evaluando
                                    if isinstance(evaluated, Sum):
                                        return evaluate_all_sums(evaluated)
                                    # Verificar si el resultado contiene más Sum anidadas
                                    from sympy import preorder_traversal
                                    has_nested_sum = False
                                    for subexpr in preorder_traversal(evaluated):
                                        if isinstance(subexpr, Sum):
                                            has_nested_sum = True
                                            break
                                    if has_nested_sum:
                                        return evaluate_all_sums(evaluated)
                                    return evaluated
                                except Exception as e2:
                                    print(f"[SummationCloser] Error evaluando sumatoria: {e1}, {e2}")
                                    return expr
                        else:
                            # No se pudo extraer límites, intentar doit()
                            evaluated = expr.doit()
                            evaluated = simplify(evaluated)
                            if isinstance(evaluated, Sum):
                                return evaluate_all_sums(evaluated)
                            return evaluated
                except Exception:
                    # Si no se puede evaluar, intentar expandir y reevaluar
                    try:
                        expanded = expand(expr)
                        if isinstance(expanded, Sum):
                            evaluated = expanded.doit()
                            return simplify(evaluate_all_sums(evaluated))
                        return evaluate_all_sums(expanded)
                    except Exception:
                        return expr
            
            # Si es una expresión compuesta (Add, Mul, etc.), evaluar recursivamente
            if hasattr(expr, 'args'):
                # Evaluar cada argumento recursivamente
                evaluated_args = [evaluate_all_sums(arg) for arg in expr.args]
                # Reconstruir la expresión con los argumentos evaluados
                if isinstance(expr, (Add, Mul)):
                    try:
                        new_expr = expr.func(*evaluated_args)
                        # Simplificar el resultado
                        new_expr = simplify(new_expr)
                        # Verificar si aún hay Sum sin evaluar
                        from sympy import preorder_traversal
                        has_sum = False
                        for subexpr in preorder_traversal(new_expr):
                            if isinstance(subexpr, Sum):
                                has_sum = True
                                break
                        if has_sum:
                            # Hay más sumatorias, seguir evaluando
                            return evaluate_all_sums(new_expr)
                        return new_expr
                    except Exception:
                        return expr
            
            return expr
        
        result = evaluate_all_sums(expr)
        
        # Verificar y eliminar variables de iteración que no deberían estar en el resultado final
        iteration_vars = ['i', 'j', 'k']
        for var_name in iteration_vars:
            var_symbol = Symbol(var_name, integer=True)
            if result.has(var_symbol):
                # La expresión todavía contiene una variable de iteración
                # Intentar expandir, factorizar y simplificar para eliminarla
                try:
                    result = expand(result)
                    result = simplify(result)
                    if result.has(var_symbol):
                        result = factor(result)
                        result = simplify(result)
                except Exception:
                    pass
        
        return result
    
    def _generate_steps_from_sympy(self, expr: Expr, variable: str = "n") -> List[str]:
        """
        Genera pasos educativos paso a paso desde una expresión SymPy.
        
        Args:
            expr: Expresión SymPy que puede contener Sum
            variable: Variable principal (por defecto "n")
            
        Returns:
            Lista de pasos en formato LaTeX
        """
        steps = []
        
        # Si la expresión es directamente una Sum, analizar su estructura SymPy
        # Esto es más preciso que detectar patrones desde LaTeX
        if isinstance(expr, Sum):
            return self._generate_steps_from_sympy_structure(expr, variable)
        
        # Si no es una Sum, verificar si contiene Sum dentro
        from sympy import preorder_traversal
        has_sum = False
        for subexpr in preorder_traversal(expr):
            if isinstance(subexpr, Sum):
                has_sum = True
                break
        
        if has_sum:
            # Contiene Sum, analizar estructura SymPy
            return self._generate_steps_from_sympy_structure(expr, variable)
        
        # Si no hay Sum, es una expresión simple
        # Convertir a LaTeX y detectar patrón
        expr_latex = self._sympy_to_latex(expr)
        pattern_type = self._detect_pattern(expr_latex)
        
        # Generar pasos según el patrón detectado
        if pattern_type == 'constant_sum':
            steps = self._generate_constant_sum_steps(expr_latex, variable)
        elif pattern_type == 'triangular':
            steps = self._generate_triangular_steps(expr_latex, variable)
        elif pattern_type == 'nested_rectangular':
            steps = self._generate_nested_rectangular_steps(expr_latex, variable)
        elif pattern_type == 'arithmetic_sum':
            steps = self._generate_arithmetic_sum_steps(expr_latex, variable)
        else:
            # Expresión simple sin patrón conocido
            steps = [f"\\text{{Expresión: }} {expr_latex}"]
        
        return steps
    
    def _generate_steps_from_sympy_structure(self, expr: Expr, variable: str = "n") -> List[str]:
        """
        Genera pasos educativos analizando la estructura SymPy directamente.
        
        Args:
            expr: Expresión SymPy
            variable: Variable principal
            
        Returns:
            Lista de pasos en formato LaTeX
        """
        steps = []
        from sympy import preorder_traversal
        
        # Si la expresión es directamente una Sum, analizarla
        if isinstance(expr, Sum):
            steps_result = self._analyze_single_sum(expr, variable)
            if isinstance(steps_result, tuple):
                steps_list, _ = steps_result
                steps.extend(steps_list)
            else:
                steps.extend(steps_result)
            return steps
        
        # Buscar todas las Sum en la expresión
        sums_found = []
        for subexpr in preorder_traversal(expr):
            if isinstance(subexpr, Sum):
                # Evitar agregar la misma Sum múltiples veces
                # Comparar por estructura, no por identidad
                is_duplicate = False
                for existing_sum in sums_found:
                    if (isinstance(existing_sum, Sum) and isinstance(subexpr, Sum) and
                        len(existing_sum.args) == len(subexpr.args) and
                        existing_sum.args[0] == subexpr.args[0] and
                        existing_sum.args[1] == subexpr.args[1]):
                        is_duplicate = True
                        break
                if not is_duplicate:
                    sums_found.append(subexpr)
        
        # Si hay una sola Sum, analizarla en detalle
        if len(sums_found) == 1:
            sum_expr = sums_found[0]
            steps.extend(self._analyze_single_sum(sum_expr, variable))
        elif len(sums_found) > 1:
            # Sumatorias anidadas o múltiples
            # Ordenar por profundidad: la más externa primero
            # (las que no están dentro de otra Sum)
            outer_sums = []
            inner_sums = []
            
            for sum_expr in sums_found:
                # Verificar si esta Sum está dentro de otra
                is_inner = False
                for other_sum in sums_found:
                    if other_sum != sum_expr:
                        # Verificar si sum_expr está dentro de other_sum
                        for subexpr in preorder_traversal(other_sum):
                            if subexpr == sum_expr:
                                is_inner = True
                                break
                        if is_inner:
                            break
                
                if is_inner:
                    inner_sums.append(sum_expr)
                else:
                    outer_sums.append(sum_expr)
            
            # Si hay una externa y una interna, son anidadas
            if len(outer_sums) == 1 and len(inner_sums) >= 1:
                steps.extend(self._analyze_nested_sums([outer_sums[0]] + inner_sums, variable))
            else:
                # Múltiples sumatorias independientes o estructura compleja
                for sum_expr in sums_found:
                    steps_result = self._analyze_single_sum(sum_expr, variable)
                    if isinstance(steps_result, tuple):
                        steps_list, _ = steps_result
                        steps.extend(steps_list)
                    else:
                        steps.extend(steps_result)
        else:
            # No hay sumatorias, es una expresión simple
            expr_latex = self._sympy_to_latex(expr)
            steps.append(f"\\text{{Expresión: }} {expr_latex}")
        
        return steps
    
    def _analyze_single_sum(self, sum_expr: Sum, variable: str = "n") -> tuple[List[str], Optional[Expr]]:
        """
        Analiza una sumatoria simple y genera pasos educativos.
        
        Args:
            sum_expr: Expresión Sum de SymPy
            variable: Variable principal
            
        Returns:
            Tupla (lista de pasos en formato LaTeX, expresión evaluada o None)
        """
        steps = []
        evaluated_result = None
        from sympy import Integer, latex, Integer as Int, preorder_traversal
        
        try:
            # PRIMERO: Verificar si hay múltiples límites (SymPy representa sumatorias anidadas así)
            # Sum(body, (var1, start1, end1), (var2, start2, end2), ...)
            if len(sum_expr.args) > 2:
                # Hay múltiples límites, es una sumatoria anidada
                return self._analyze_multiple_limits_sum(sum_expr, variable)
            
            # SEGUNDO: Verificar si el cuerpo es otra Sum (sumatoria anidada)
            body = sum_expr.args[0]
            limits = sum_expr.args[1]
            
            # Buscar Sum dentro del cuerpo
            inner_sum = None
            if isinstance(body, Sum):
                inner_sum = body
            else:
                # Buscar Sum en el cuerpo
                for subexpr in preorder_traversal(body):
                    if isinstance(subexpr, Sum) and subexpr != sum_expr:
                        inner_sum = subexpr
                        break
            
            # Si hay una Sum anidada, manejarla de manera especial
            if inner_sum is not None:
                return self._analyze_nested_sum_with_structure(sum_expr, inner_sum, variable)
            
            # TERCERO: Analizar como sumatoria simple
            # Sum(body, (var, start, end))
            # SymPy usa Tuple, no tuple de Python estándar
            if len(sum_expr.args) >= 2:
                # Verificar que limits tenga al menos 3 elementos y se pueda acceder por índice
                try:
                    if len(limits) >= 3 and limits[0] is not None and limits[1] is not None and limits[2] is not None:
                        sum_var = limits[0]
                        start = limits[1]
                        end = limits[2]
                    
                    # Convertir a LaTeX para mostrar
                    var_latex = latex(sum_var)
                    start_latex = latex(start)
                    end_latex = latex(end)
                    body_latex = latex(body)
                    sum_latex = f"\\sum_{{{var_latex}={start_latex}}}^{{{end_latex}}} {body_latex}"
                    
                    steps.append(f"\\text{{Sumatoria: }} {sum_latex}")
                    
                    # Analizar el cuerpo
                    # Verificar si el cuerpo es constante respecto a la variable de suma
                    from sympy import Symbol as SymSymbol
                    from sympy import simplify as sympy_simplify
                    
                    # PRIMERO: Verificar si el cuerpo es exactamente la variable de la sumatoria
                    # Usar comparación más robusta: simplificar ambos y comparar
                    body_simplified = sympy_simplify(body)
                    sum_var_simplified = sympy_simplify(sum_var)
                    is_arithmetic_sum = (body_simplified == sum_var_simplified) or (body == sum_var)
                    
                    # Verificar también si body es un Symbol con el mismo nombre
                    if not is_arithmetic_sum and isinstance(body, SymSymbol) and isinstance(sum_var, SymSymbol):
                        is_arithmetic_sum = (body.name == sum_var.name)
                    
                    body_depends_on_var = body.has(sum_var) if isinstance(sum_var, SymSymbol) else False
                    
                    # Si el cuerpo es 1, es una sumatoria constante
                    if body == Int(1) or body == 1:
                        # Calcular y simplificar el resultado usando SymPy
                        from sympy import simplify
                        result_expr = end - start + Int(1)
                        result_simplified = simplify(result_expr)
                        result_latex = latex(result_simplified)
                        
                        # Calcular también la expresión sin simplificar para mostrar el paso
                        formula_expr = end - start + Int(1)
                        formula_latex = latex(formula_expr)
                        
                        steps.append(
                            f"\\text{{Aplicando fórmula de sumatoria constante: }} "
                            f"\\sum_{{{var_latex}={start_latex}}}^{{{end_latex}}} 1 = {formula_latex}"
                        )
                        # Si la simplificación cambia algo, mostrar el paso
                        if result_latex != formula_latex:
                            steps.append(
                                f"\\text{{Simplificando: }} {formula_latex} = {result_latex}"
                            )
                        else:
                            # Asegurar que el resultado final esté en los pasos
                            if result_latex not in steps[-1]:
                                steps.append(f"\\text{{Resultado: }} {result_latex}")
                    # Si el cuerpo es la variable de la sumatoria, es una suma aritmética
                    # DEBE ir ANTES del caso de factor constante
                    elif is_arithmetic_sum:
                        # Calcular la suma aritmética correctamente
                        from sympy import simplify, summation
                        # Fórmula: Σ_{i=a}^{b} i = (b(b+1))/2 - ((a-1)a)/2
                        # Usar summation() que es más robusto para sumatorias simbólicas
                        try:
                            # Usar summation() directamente
                            result_expr = summation(body, (sum_var, start, end))
                            result_simplified = simplify(result_expr)
                            
                            # Verificar que no contenga la variable de iteración
                            if isinstance(sum_var, SymSymbol) and result_simplified.has(sum_var):
                                # Todavía contiene la variable, intentar expandir y simplificar más
                                from sympy import expand, factor
                                result_simplified = expand(result_simplified)
                                result_simplified = simplify(result_simplified)
                                if result_simplified.has(sum_var):
                                    result_simplified = factor(result_simplified)
                                    result_simplified = simplify(result_simplified)
                            
                            result_latex = latex(result_simplified)
                            
                            # Generar paso explicativo
                            if start == Int(1) or (isinstance(start, Integer) and int(start) == 1):
                                # Caso especial: suma desde 1
                                steps.append(
                                    f"\\text{{Aplicando fórmula de suma aritmética: }} "
                                    f"\\sum_{{{var_latex}={start_latex}}}^{{{end_latex}}} {var_latex} = "
                                    f"\\frac{{{end_latex} \\left({end_latex} + 1\\right)}}{{2}}"
                                )
                                if result_latex not in steps[-1]:
                                    steps.append(f"\\text{{Resultado: }} {result_latex}")
                            else:
                                # Caso general: suma desde a hasta b
                                # Mostrar fórmula: Σ_{i=a}^{b} i = Σ_{i=1}^{b} i - Σ_{i=1}^{a-1} i
                                start_minus_one = simplify(start - Int(1))
                                start_minus_one_latex = latex(start_minus_one)
                                
                                # Calcular manualmente para mostrar los pasos correctos
                                try:
                                    # Calcular n(n+1)/2 - (a-1)a/2
                                    if isinstance(start, Integer):
                                        start_val = int(start)
                                        # Fórmula manual: n(n+1)/2 - (start_val-1)start_val/2
                                        from sympy import Integer as IntSym
                                        result_manual = (end * (end + IntSym(1))) / IntSym(2) - (IntSym(start_val - 1) * IntSym(start_val)) / IntSym(2)
                                        result_manual = simplify(result_manual)
                                        result_manual_latex = latex(result_manual)
                                        
                                        steps.append(
                                            f"\\text{{Aplicando fórmula de suma aritmética: }} "
                                            f"\\sum_{{{var_latex}={start_latex}}}^{{{end_latex}}} {var_latex} = "
                                            f"\\sum_{{{var_latex}=1}}^{{{end_latex}}} {var_latex} - \\sum_{{{var_latex}=1}}^{{{start_minus_one_latex}}} {var_latex}"
                                        )
                                        steps.append(
                                            f"\\text{{Evaluando: }} "
                                            f"\\frac{{{end_latex}({end_latex}+1)}}{{2}} - \\frac{{({start_val-1})({start_val})}}{{2}} = {result_manual_latex}"
                                        )
                                        
                                        # Usar el resultado manual si es diferente del de summation()
                                        if result_manual_latex != result_latex:
                                            # Preferir el resultado manual si no contiene variables de iteración
                                            if not result_manual.has(sum_var) if isinstance(sum_var, SymSymbol) else True:
                                                result_latex = result_manual_latex
                                                result_simplified = result_manual
                                    else:
                                        # start no es un Integer, usar expresión general
                                        steps.append(
                                            f"\\text{{Aplicando fórmula de suma aritmética: }} "
                                            f"\\sum_{{{var_latex}={start_latex}}}^{{{end_latex}}} {var_latex} = "
                                            f"\\sum_{{{var_latex}=1}}^{{{end_latex}}} {var_latex} - \\sum_{{{var_latex}=1}}^{{{start_minus_one_latex}}} {var_latex}"
                                        )
                                        steps.append(
                                            f"\\text{{Evaluando: }} "
                                            f"\\frac{{{end_latex}({end_latex}+1)}}{{2}} - \\frac{{{start_minus_one_latex}({start_latex})}}{{2}} = {result_latex}"
                                        )
                                except Exception as e3:
                                    print(f"[SummationCloser] Error calculando manualmente: {e3}")
                                    # Usar resultado de summation()
                                    steps.append(
                                        f"\\text{{Aplicando fórmula de suma aritmética: }} "
                                        f"\\sum_{{{var_latex}={start_latex}}}^{{{end_latex}}} {var_latex} = "
                                        f"\\sum_{{{var_latex}=1}}^{{{end_latex}}} {var_latex} - \\sum_{{{var_latex}=1}}^{{{start_minus_one_latex}}} {var_latex}"
                                    )
                                    steps.append(
                                        f"\\text{{Evaluando: }} "
                                        f"\\frac{{{end_latex}({end_latex}+1)}}{{2}} - \\frac{{{start_minus_one_latex}({start_latex})}}{{2}} = {result_latex}"
                                    )
                        except Exception as e:
                            print(f"[SummationCloser] Error calculando suma aritmética con summation(): {e}")
                            import traceback
                            traceback.print_exc()
                            # Fallback: intentar con doit()
                            try:
                                sum_expr = Sum(body, (sum_var, start, end))
                                result_expr = sum_expr.doit()
                                result_simplified = simplify(result_expr)
                                result_latex = latex(result_simplified)
                                
                                if start == Int(1) or (isinstance(start, Integer) and int(start) == 1):
                                    steps.append(
                                        f"\\text{{Aplicando fórmula de suma aritmética: }} "
                                        f"\\sum_{{{var_latex}={start_latex}}}^{{{end_latex}}} {var_latex} = "
                                        f"\\frac{{{end_latex} \\left({end_latex} + 1\\right)}}{{2}}"
                                    )
                                else:
                                    start_minus_one = simplify(start - Int(1))
                                    start_minus_one_latex = latex(start_minus_one)
                                    steps.append(
                                        f"\\text{{Aplicando fórmula de suma aritmética: }} "
                                        f"\\sum_{{{var_latex}={start_latex}}}^{{{end_latex}}} {var_latex} = "
                                        f"\\sum_{{{var_latex}=1}}^{{{end_latex}}} {var_latex} - \\sum_{{{var_latex}=1}}^{{{start_minus_one_latex}}} {var_latex}"
                                    )
                                    steps.append(
                                        f"\\text{{Evaluando: }} "
                                        f"\\frac{{{end_latex}({end_latex}+1)}}{{2}} - \\frac{{{start_minus_one_latex}({start_latex})}}{{2}} = {result_latex}"
                                    )
                            except Exception as e2:
                                print(f"[SummationCloser] Error con doit() también: {e2}")
                                # Último fallback: fórmula general
                                steps.append(
                                    f"\\text{{Aplicando fórmula de suma aritmética: }} "
                                    f"\\sum_{{{var_latex}={start_latex}}}^{{{end_latex}}} {var_latex} = "
                                    f"\\frac{{{end_latex} \\left({end_latex} + 1\\right) - {start_latex} \\left({start_latex} - 1\\right)}}{{2}}"
                                )
                                result_latex = f"\\frac{{{end_latex} \\left({end_latex} + 1\\right) - {start_latex} \\left({start_latex} - 1\\right)}}{{2}}"
                        
                        # Asegurar que el resultado final esté en los pasos si no está ya
                        if steps and result_latex not in steps[-1] and "Resultado" not in steps[-1]:
                            # Verificar si el último paso ya muestra el resultado
                            last_step_has_result = any(result_latex in step for step in steps)
                            if not last_step_has_result:
                                steps.append(f"\\text{{Resultado: }} {result_latex}")
                        
                        # Retornar el resultado evaluado
                        return steps, result_simplified
                    # Si el cuerpo NO depende de la variable de suma, es constante (factor constante)
                    elif not body_depends_on_var:
                        # Aplicar regla de factor constante: Σ_{i=a}^{b} c = c · (b - a + 1)
                        from sympy import simplify
                        result_expr = body * (end - start + Int(1))
                        result_simplified = simplify(result_expr)
                        result_latex = latex(result_simplified)
                        body_latex_display = latex(body)
                        
                        steps.append(
                            f"\\text{{Aplicando factor constante: }} "
                            f"\\sum_{{{var_latex}={start_latex}}}^{{{end_latex}}} {body_latex_display} = "
                            f"{body_latex_display} \\cdot \\sum_{{{var_latex}={start_latex}}}^{{{end_latex}}} 1"
                        )
                        steps.append(
                            f"\\text{{Evaluando sumatoria constante: }} "
                            f"\\sum_{{{var_latex}={start_latex}}}^{{{end_latex}}} 1 = {end_latex} - {start_latex} + 1"
                        )
                        # Simplificar si es necesario
                        const_count_expr = end - start + Int(1)
                        const_count_simplified = simplify(const_count_expr)
                        const_count_latex = latex(const_count_simplified)
                        if const_count_latex != f"{end_latex} - {start_latex} + 1":
                            steps.append(
                                f"\\text{{Simplificando: }} {end_latex} - {start_latex} + 1 = {const_count_latex}"
                            )
                        steps.append(
                            f"\\text{{Multiplicando: }} {body_latex_display} \\cdot {const_count_latex} = {result_latex}"
                        )
                    # Si el cuerpo depende de la variable de forma lineal (como -i + n + 1)
                    else:
                        # Analizar si el cuerpo es una expresión lineal en la variable de suma
                        from sympy import expand, Add as SymAdd, Mul as SymMul
                        
                        # Expandir el cuerpo para ver sus términos
                        body_expanded = expand(body)
                        
                        # Verificar si es una expresión Add (suma de términos)
                        if isinstance(body_expanded, SymAdd):
                            # Separar términos que dependen de sum_var y términos constantes (respecto a sum_var)
                            terms_with_var = []
                            constant_terms = []
                            
                            for term in body_expanded.args:
                                # Verificar si el término depende de sum_var
                                if term.has(sum_var):
                                    terms_with_var.append(term)
                                else:
                                    constant_terms.append(term)
                            
                            # Si hay términos que dependen de la variable y términos constantes
                            if terms_with_var and constant_terms:
                                # Generar pasos explicativos usando propiedad de linealidad
                                terms_var_latex = latex(SymAdd(*terms_with_var))
                                const_terms_latex = latex(SymAdd(*constant_terms))
                                
                                steps.append(
                                    f"\\text{{Aplicando propiedad de linealidad: }} "
                                    f"\\sum_{{{var_latex}={start_latex}}}^{{{end_latex}}} "
                                    f"\\left({terms_var_latex} + {const_terms_latex}\\right) = "
                                    f"\\sum_{{{var_latex}={start_latex}}}^{{{end_latex}}} {terms_var_latex} + "
                                    f"\\sum_{{{var_latex}={start_latex}}}^{{{end_latex}}} {const_terms_latex}"
                                )
                                
                                # Evaluar cada parte y combinar resultados
                                const_result_latex = None
                                var_result_latex = None
                                
                                # Parte constante
                                if constant_terms:
                                    const_sum = Sum(SymAdd(*constant_terms), (sum_var, start, end))
                                    try:
                                        const_result = const_sum.doit()
                                        const_result_simplified = simplify(const_result)
                                        const_result_latex = latex(const_result_simplified)
                                        steps.append(
                                            f"\\text{{Evaluando sumatoria constante: }} "
                                            f"\\sum_{{{var_latex}={start_latex}}}^{{{end_latex}}} {const_terms_latex} = {const_result_latex}"
                                        )
                                    except Exception:
                                        pass
                                
                                # Parte con variable
                                if terms_with_var:
                                    # Construir expresión con términos de variable
                                    var_sum_expr = SymAdd(*terms_with_var)
                                    
                                    # Verificar si es de la forma k*sum_var (suma aritmética)
                                    if len(terms_with_var) == 1:
                                        term = terms_with_var[0]
                                        # Verificar si el término es proporcional a sum_var
                                        # Intentar factorizar sum_var
                                        from sympy import factor
                                        term_factored = factor(term)
                                        
                                        if isinstance(term_factored, SymMul):
                                            # Buscar si sum_var está en los factores
                                            has_var = False
                                            coeff = 1
                                            for factor_elem in term_factored.args:
                                                if factor_elem == sum_var:
                                                    has_var = True
                                                elif not factor_elem.has(sum_var):
                                                    coeff = coeff * factor_elem if coeff != 1 else factor_elem
                                            
                                            if has_var:
                                                # Es de la forma k*sum_var
                                                var_sum = Sum(sum_var, (sum_var, start, end))
                                                try:
                                                    var_sum_result = var_sum.doit()
                                                    var_sum_simplified = simplify(var_sum_result)
                                                    var_sum_latex = latex(var_sum_simplified)
                                                    
                                                    if coeff != 1:
                                                        coeff_latex = latex(coeff)
                                                        total_result = coeff * var_sum_result
                                                        total_simplified = simplify(total_result)
                                                        total_latex = latex(total_simplified)
                                                        
                                                        steps.append(
                                                            f"\\text{{Aplicando fórmula de suma aritmética: }} "
                                                            f"\\sum_{{{var_latex}={start_latex}}}^{{{end_latex}}} {terms_var_latex} = "
                                                            f"{coeff_latex} \\cdot \\sum_{{{var_latex}={start_latex}}}^{{{end_latex}}} {var_latex} = "
                                                            f"{coeff_latex} \\cdot {var_sum_latex} = {total_latex}"
                                                        )
                                                        var_result_latex = total_latex
                                                    else:
                                                        steps.append(
                                                            f"\\text{{Aplicando fórmula de suma aritmética: }} "
                                                            f"\\sum_{{{var_latex}={start_latex}}}^{{{end_latex}}} {var_latex} = {var_sum_latex}"
                                                        )
                                                        var_result_latex = var_sum_latex
                                                except Exception:
                                                    steps.append(
                                                        f"\\text{{Evaluando sumatoria: }} "
                                                        f"\\sum_{{{var_latex}={start_latex}}}^{{{end_latex}}} {terms_var_latex}"
                                                    )
                                            else:
                                                # No es proporcional a sum_var, evaluar directamente
                                                var_sum = Sum(var_sum_expr, (sum_var, start, end))
                                                try:
                                                    var_sum_result = var_sum.doit()
                                                    var_sum_simplified = simplify(var_sum_result)
                                                    var_sum_latex = latex(var_sum_simplified)
                                                    steps.append(
                                                        f"\\text{{Evaluando sumatoria: }} "
                                                        f"\\sum_{{{var_latex}={start_latex}}}^{{{end_latex}}} {terms_var_latex} = {var_sum_latex}"
                                                    )
                                                    var_result_latex = var_sum_latex
                                                except Exception:
                                                    steps.append(
                                                        f"\\text{{Evaluando sumatoria: }} "
                                                        f"\\sum_{{{var_latex}={start_latex}}}^{{{end_latex}}} {terms_var_latex}"
                                                    )
                                        else:
                                            # No es un Mul, verificar si es directamente sum_var
                                            if term == sum_var:
                                                var_sum = Sum(sum_var, (sum_var, start, end))
                                                try:
                                                    var_sum_result = var_sum.doit()
                                                    var_sum_simplified = simplify(var_sum_result)
                                                    var_sum_latex = latex(var_sum_simplified)
                                                    steps.append(
                                                        f"\\text{{Aplicando fórmula de suma aritmética: }} "
                                                        f"\\sum_{{{var_latex}={start_latex}}}^{{{end_latex}}} {var_latex} = {var_sum_latex}"
                                                    )
                                                    var_result_latex = var_sum_latex
                                                except Exception:
                                                    steps.append(
                                                        f"\\text{{Evaluando sumatoria: }} "
                                                        f"\\sum_{{{var_latex}={start_latex}}}^{{{end_latex}}} {terms_var_latex}"
                                                    )
                                            else:
                                                # Evaluar directamente
                                                var_sum = Sum(var_sum_expr, (sum_var, start, end))
                                                try:
                                                    var_sum_result = var_sum.doit()
                                                    var_sum_simplified = simplify(var_sum_result)
                                                    var_sum_latex = latex(var_sum_simplified)
                                                    steps.append(
                                                        f"\\text{{Evaluando sumatoria: }} "
                                                        f"\\sum_{{{var_latex}={start_latex}}}^{{{end_latex}}} {terms_var_latex} = {var_sum_latex}"
                                                    )
                                                    var_result_latex = var_sum_latex
                                                except Exception:
                                                    steps.append(
                                                        f"\\text{{Evaluando sumatoria: }} "
                                                        f"\\sum_{{{var_latex}={start_latex}}}^{{{end_latex}}} {terms_var_latex}"
                                                    )
                                    else:
                                        # Múltiples términos con variable, evaluar directamente
                                        var_sum = Sum(var_sum_expr, (sum_var, start, end))
                                        try:
                                            var_sum_result = var_sum.doit()
                                            var_sum_simplified = simplify(var_sum_result)
                                            var_sum_latex = latex(var_sum_simplified)
                                            steps.append(
                                                f"\\text{{Evaluando sumatoria: }} "
                                                f"\\sum_{{{var_latex}={start_latex}}}^{{{end_latex}}} {terms_var_latex} = {var_sum_latex}"
                                            )
                                            var_result_latex = var_sum_latex
                                        except Exception:
                                            steps.append(
                                                f"\\text{{Evaluando sumatoria: }} "
                                                f"\\sum_{{{var_latex}={start_latex}}}^{{{end_latex}}} {terms_var_latex}"
                                            )
                            
                            elif terms_with_var:
                                # Solo términos que dependen de la variable
                                steps.append(
                                    f"\\text{{Evaluando sumatoria con cuerpo dependiente de la variable: }} {sum_latex}"
                                )
                            else:
                                # Solo términos constantes (debería haber sido detectado antes como constante)
                                steps.append(
                                    f"\\text{{Aplicando fórmula de sumatoria constante: }} {sum_latex}"
                                )
                        else:
                            # No es una Add, es una expresión más compleja
                            steps.append(
                                f"\\text{{Evaluando sumatoria: }} {sum_latex}"
                            )
                        
                        # Agregar resultado final combinado si hay partes separadas (solo dentro del bloque Add)
                        if isinstance(body_expanded, SymAdd) and terms_with_var and constant_terms:
                            if 'const_result_latex' in locals() and 'var_result_latex' in locals() and const_result_latex and var_result_latex:
                                # Combinar resultados
                                try:
                                    from sympy import sympify
                                    total_expr = sympify(var_result_latex.replace('\\', '')) + sympify(const_result_latex.replace('\\', ''))
                                    total_simplified = simplify(total_expr)
                                    total_latex = latex(total_simplified)
                                    steps.append(
                                        f"\\text{{Combinando resultados: }} {var_result_latex} + {const_result_latex} = {total_latex}"
                                    )
                                except Exception:
                                    pass
                        
                        # Agregar resultado final (para todos los casos)
                        try:
                            evaluated = sum_expr.doit()
                            evaluated_simplified = simplify(evaluated)
                            evaluated_latex = latex(evaluated_simplified)
                            # Solo agregar si no está ya en los pasos
                            if evaluated_latex not in " ".join(steps):
                                steps.append(f"\\text{{Resultado: }} {evaluated_latex}")
                        except Exception:
                            pass
                except (TypeError, IndexError, AttributeError):
                    # No se puede acceder a limits como secuencia o tiene estructura inesperada
                    try:
                        sum_latex = latex(sum_expr)
                        steps.append(f"\\text{{Sumatoria: }} {sum_latex}")
                    except Exception:
                        steps.append(f"\\text{{Error: no se pudo procesar la sumatoria}}")
        except Exception as e:
            print(f"[SummationCloser] Error analizando sumatoria: {e}")
            import traceback
            traceback.print_exc()
            try:
                sum_latex = latex(sum_expr)
                steps.append(f"\\text{{Sumatoria: }} {sum_latex}")
            except Exception:
                steps.append(f"\\text{{Error: no se pudo procesar la sumatoria}}")
        
        return steps
    
    def _analyze_nested_sums(self, sums: List[Sum], variable: str = "n") -> List[str]:
        """
        Analiza sumatorias anidadas y genera pasos educativos.
        
        Args:
            sums: Lista de expresiones Sum (primera es externa, siguientes son internas)
            variable: Variable principal
            
        Returns:
            Lista de pasos en formato LaTeX
        """
        steps = []
        from sympy import latex, Integer as Int
        
        if len(sums) >= 2:
            # Dos o más sumatorias: son anidadas
            outer_sum = sums[0]   # La primera es la externa
            inner_sum = sums[1]   # La segunda es la interna
            
            # Extraer información de ambas sumatorias
            # outer_body = outer_sum.args[0]  # No usado actualmente
            outer_limits = outer_sum.args[1]
            inner_body = inner_sum.args[0]
            inner_limits = inner_sum.args[1]
            
            if isinstance(outer_limits, tuple) and len(outer_limits) >= 3:
                outer_var = outer_limits[0]
                outer_start = outer_limits[1]
                outer_end = outer_limits[2]
                
                if isinstance(inner_limits, tuple) and len(inner_limits) >= 3:
                    inner_var = inner_limits[0]
                    inner_start = inner_limits[1]
                    inner_end = inner_limits[2]
                    
                    # Convertir a LaTeX
                    outer_var_latex = latex(outer_var)
                    outer_start_latex = latex(outer_start)
                    outer_end_latex = latex(outer_end)
                    inner_var_latex = latex(inner_var)
                    inner_start_latex = latex(inner_start)
                    inner_end_latex = latex(inner_end)
                    inner_body_latex = latex(inner_body)
                    
                    # Mostrar estructura anidada
                    steps.append(
                        f"\\text{{Sumatorias anidadas: }} "
                        f"\\sum_{{{outer_var_latex}={outer_start_latex}}}^{{{outer_end_latex}}} "
                        f"\\left(\\sum_{{{inner_var_latex}={inner_start_latex}}}^{{{inner_end_latex}}} {inner_body_latex}\\right)"
                    )
                    
                    # Si el cuerpo interno es 1, es una sumatoria constante anidada
                    if inner_body == Int(1) or inner_body == 1:
                        steps.append(
                            f"\\text{{Evaluando sumatoria interna: }} "
                            f"\\sum_{{{inner_var_latex}={inner_start_latex}}}^{{{inner_end_latex}}} 1 = {inner_end_latex} - {inner_start_latex} + 1"
                        )
                        
                        # Simplificar si es posible
                        try:
                            from sympy import simplify
                            inner_result_expr = inner_end - inner_start + Int(1)
                            inner_result_simplified = simplify(inner_result_expr)
                            inner_result_latex = latex(inner_result_simplified)
                            
                            steps.append(
                                f"\\text{{Simplificando: }} {inner_end_latex} - {inner_start_latex} + 1 = {inner_result_latex}"
                            )
                            
                            # Sustituir en la sumatoria externa
                            steps.append(
                                f"\\text{{Sustituyendo en sumatoria externa: }} "
                                f"\\sum_{{{outer_var_latex}={outer_start_latex}}}^{{{outer_end_latex}}} {inner_result_latex}"
                            )
                            
                            # Si el resultado interno no depende de la variable externa, es constante
                            if not inner_result_expr.has(outer_var):
                                steps.append(
                                    f"\\text{{Aplicando factor constante: }} "
                                    f"{inner_result_latex} \\cdot \\sum_{{{outer_var_latex}={outer_start_latex}}}^{{{outer_end_latex}}} 1 = "
                                    f"{inner_result_latex} \\cdot ({outer_end_latex} - {outer_start_latex} + 1)"
                                )
                            else:
                                # El resultado interno depende de la variable externa (caso triangular o dependiente)
                                steps.append(
                                    f"\\text{{Evaluando sumatoria externa con límite dependiente: }} "
                                    f"\\sum_{{{outer_var_latex}={outer_start_latex}}}^{{{outer_end_latex}}} {inner_result_latex}"
                                )
                                
                                # Evaluar la sumatoria externa completa
                                try:
                                    from sympy import summation
                                    outer_result = summation(inner_result_simplified, (outer_var, outer_start, outer_end))
                                    outer_result = simplify(outer_result)
                                    
                                    # Verificar y eliminar variables de iteración más agresivamente
                                    iteration_vars = ['i', 'j', 'k']
                                    for var_name in iteration_vars:
                                        var_symbol = Symbol(var_name, integer=True)
                                        if outer_result.has(var_symbol):
                                            # Intentar expandir y simplificar múltiples veces
                                            outer_result = expand(outer_result)
                                            outer_result = simplify(outer_result)
                                            if outer_result.has(var_symbol):
                                                # Si todavía tiene la variable, intentar factorizar
                                                outer_result = factor(outer_result)
                                                outer_result = simplify(outer_result)
                                                if outer_result.has(var_symbol):
                                                    # Si todavía queda, es un error - la sumatoria no se evaluó completamente
                                                    # Intentar forzar la evaluación usando doit() si es una Sum
                                                    from sympy import Sum as SymSum
                                                    if isinstance(outer_result, SymSum):
                                                        outer_result = outer_result.doit()
                                                        outer_result = expand(outer_result)
                                                        outer_result = simplify(outer_result)
                                                    # Si todavía tiene la variable después de todo, eliminarla sustituyendo por 0
                                                    if outer_result.has(var_symbol):
                                                        print(f"[SummationCloser] Advertencia: Variable de iteración {var_name} todavía presente después de evaluar sumatoria, sustituyendo por 0")
                                                        from sympy import Integer as SymInteger
                                                        outer_result = outer_result.subs(var_symbol, SymInteger(0))
                                                        outer_result = simplify(outer_result)
                                    
                                    outer_result_latex = latex(outer_result)
                                    # Validar que el resultado no contenga variables de iteración en LaTeX
                                    if 'i' in outer_result_latex or 'j' in outer_result_latex or 'k' in outer_result_latex:
                                        # Intentar evaluar de nuevo si el LaTeX todavía tiene variables
                                        print(f"[SummationCloser] Advertencia: Resultado LaTeX todavía contiene variables de iteración: {outer_result_latex}")
                                    
                                    steps.append(f"\\text{{Resultado: }} {outer_result_latex}")
                                except Exception as eval_error:
                                    print(f"[SummationCloser] Error evaluando sumatoria externa: {eval_error}")
                        except Exception as e:
                            print(f"[SummationCloser] Error en análisis de sumatorias anidadas: {e}")
        else:
            # Una sola sumatoria o ninguna
            for i, sum_expr in enumerate(sums):
                sum_latex = latex(sum_expr)
                steps.append(f"\\text{{Sumatoria: }} {sum_latex}")
        
        return steps
    
    def _analyze_nested_sum_with_structure(self, outer_sum: Sum, inner_sum: Sum, variable: str = "n") -> List[str]:
        """
        Analiza una sumatoria anidada donde el cuerpo de la externa es una Sum interna.
        
        Args:
            outer_sum: Sumatoria externa
            inner_sum: Sumatoria interna (cuerpo de la externa)
            variable: Variable principal
            
        Returns:
            Lista de pasos en formato LaTeX
        """
        return self._analyze_nested_sums([outer_sum, inner_sum], variable)
    
    def _analyze_multiple_limits_sum(self, sum_expr: Sum, variable: str = "n") -> List[str]:
        """
        Analiza una sumatoria con múltiples límites (representación de SymPy para sumatorias anidadas).
        
        Args:
            sum_expr: Expresión Sum con múltiples límites
            variable: Variable principal
            
        Returns:
            Lista de pasos en formato LaTeX
        """
        steps = []
        from sympy import latex, Integer as Int
        
        # Sum(body, (var1, start1, end1), (var2, start2, end2), ...)
        body = sum_expr.args[0]
        all_limits = sum_expr.args[1:]
        
        if len(all_limits) >= 2:
            # Hay múltiples límites, tratar como sumatorias anidadas
            # En SymPy, cuando se construye Sum(body, limit1, limit2, ...),
            # los límites se ordenan de más externo a más interno.
            # Entonces all_limits[0] es el más externo y all_limits[-1] es el más interno.
            # Por ejemplo: Sum(1, (i, 1, n-1), (j, i+1, n))
            #   - (i, 1, n-1) es externo (primer límite)
            #   - (j, i+1, n) es interno (segundo límite, j depende de i)
            
            # Verificar que los límites sean secuencias con al menos 3 elementos
            # SymPy usa su propio tipo de tupla (Tuple), no tuple de Python estándar
            try:
                # Extraer información de todos los límites
                limits_info = []
                for limit in all_limits:
                    if len(limit) >= 3:
                        var = limit[0]
                        start = limit[1]
                        end = limit[2]
                        limits_info.append({
                            'var': var,
                            'start': start,
                            'end': end,
                            'var_latex': latex(var),
                            'start_latex': latex(start),
                            'end_latex': latex(end)
                        })
                
                if not limits_info:
                    # No se pudieron extraer los límites
                    sum_latex = latex(sum_expr)
                    steps.append(f"\\text{{Sumatoria: }} {sum_latex}")
                    return steps
                
                # Construir representación de sumatorias anidadas (de externa a interna)
                # all_limits está ordenado de externo a interno
                # all_limits[0] es el más externo, all_limits[-1] es el más interno
                # Para mostrar correctamente en LaTeX: construir envolviendo desde el más interno hacia el más externo
                body_latex = latex(body)
                
                # Construir cadena de sumatorias anidadas envolviendo desde interno a externo
                # limits_info[-1] es el más interno, limits_info[0] es el más externo
                # Construimos envolviendo: empezamos con el cuerpo, luego envuelve el interno, luego el externo
                sum_chain = body_latex
                # Construir de interno a externo (iterando en orden inverso) para que el externo envuelva al interno
                for limit_info in reversed(limits_info):  # Empezar con interno ([-1]), terminar con externo ([0])
                    sum_chain = f"\\sum_{{{limit_info['var_latex']}={limit_info['start_latex']}}}^{{{limit_info['end_latex']}}} {sum_chain}"
                
                steps.append(f"\\text{{Sumatorias anidadas: }} {sum_chain}")
                
                # Para el análisis, usar el más interno y el más externo
                # inner_limits = all_limits[-1]  # Último límite = más interno - No usado
                # outer_limits = all_limits[0]  # Primer límite = más externo - No usado
                
                # inner_var = limits_info[-1]['var']  # No usado actualmente
                inner_start = limits_info[-1]['start']
                inner_end = limits_info[-1]['end']
                inner_var_latex = limits_info[-1]['var_latex']
                inner_start_latex = limits_info[-1]['start_latex']
                inner_end_latex = limits_info[-1]['end_latex']
                
                outer_var = limits_info[0]['var']
                # outer_start = limits_info[0]['start']  # No usado actualmente
                # outer_end = limits_info[0]['end']  # No usado actualmente
                outer_var_latex = limits_info[0]['var_latex']
                outer_start_latex = limits_info[0]['start_latex']
                outer_end_latex = limits_info[0]['end_latex']
                
                # Importar funciones necesarias
                from sympy import simplify, expand
                
                # Si el cuerpo es 1, es una sumatoria constante anidada
                if body == Int(1) or body == 1:
                    # Calcular la expresión usando SymPy primero
                    inner_result_expr = expand(inner_end - inner_start + Int(1))
                    inner_result_simplified = simplify(inner_result_expr)
                    inner_result_latex = latex(inner_result_simplified)
                    
                    # Calcular también la expresión sin simplificar para mostrar el paso
                    inner_result_unsimplified = inner_end - inner_start + Int(1)
                    inner_result_unsimplified_latex = latex(inner_result_unsimplified)
                    
                    steps.append(
                        f"\\text{{Evaluando sumatoria interna: }} "
                        f"\\sum_{{{inner_var_latex}={inner_start_latex}}}^{{{inner_end_latex}}} 1 = {inner_result_unsimplified_latex}"
                    )
                    
                    # Mostrar el paso de simplificación si cambia
                    if inner_result_latex != inner_result_unsimplified_latex:
                        steps.append(
                            f"\\text{{Simplificando: }} {inner_result_unsimplified_latex} = {inner_result_latex}"
                        )
                    
                    # Sustituir en la sumatoria externa
                    steps.append(
                        f"\\text{{Sustituyendo en sumatoria externa: }} "
                        f"\\sum_{{{outer_var_latex}={outer_start_latex}}}^{{{outer_end_latex}}} {inner_result_latex}"
                    )
                    
                    # Verificar si el resultado interno depende de la variable externa
                    if inner_result_expr.has(outer_var):
                        # El resultado interno depende de la variable externa (caso triangular o dependiente)
                        steps.append(
                            f"\\text{{Evaluando sumatoria externa con límite dependiente: }} "
                            f"\\sum_{{{outer_var_latex}={outer_start_latex}}}^{{{outer_end_latex}}} {inner_result_latex}"
                        )
                    else:
                        # El resultado interno NO depende de la variable externa, es constante
                        steps.append(
                            f"\\text{{Aplicando factor constante: }} "
                            f"{inner_result_latex} \\cdot \\sum_{{{outer_var_latex}={outer_start_latex}}}^{{{outer_end_latex}}} 1 = "
                            f"{inner_result_latex} \\cdot ({outer_end_latex} - {outer_start_latex} + 1)"
                        )
                
                # Evaluar la sumatoria completa para obtener el resultado final
                try:
                    evaluated = sum_expr.doit()
                    evaluated_simplified = simplify(evaluated)
                    
                    # Verificar y eliminar variables de iteración que no deberían estar en el resultado final
                    iteration_vars = ['i', 'j', 'k']
                    for var_name in iteration_vars:
                        var_symbol = Symbol(var_name, integer=True)
                        if evaluated_simplified.has(var_symbol):
                            # La expresión todavía contiene una variable de iteración
                            # Intentar expandir, factorizar y simplificar para eliminarla
                            try:
                                # Expandir y simplificar múltiples veces
                                evaluated_simplified = expand(evaluated_simplified)
                                evaluated_simplified = simplify(evaluated_simplified)
                                if evaluated_simplified.has(var_symbol):
                                    evaluated_simplified = factor(evaluated_simplified)
                                    evaluated_simplified = simplify(evaluated_simplified)
                                    if evaluated_simplified.has(var_symbol):
                                        # Si todavía tiene la variable, intentar usar summation() de SymPy
                                        from sympy import summation, Sum as SymSum
                                        # Intentar re-evaluar si es posible
                                        if isinstance(evaluated_simplified, SymSum):
                                            evaluated_simplified = evaluated_simplified.doit()
                                            evaluated_simplified = expand(evaluated_simplified)
                                            evaluated_simplified = simplify(evaluated_simplified)
                                        # Si todavía queda, sustituir por 0 (error - no debería estar)
                                        if evaluated_simplified.has(var_symbol):
                                            print(f"[SummationCloser] Advertencia: Variable de iteración {var_name} todavía presente después de evaluar sumatoria con doit(), sustituyendo por 0")
                                            from sympy import Integer as SymInteger
                                            evaluated_simplified = evaluated_simplified.subs(var_symbol, SymInteger(0))
                                            evaluated_simplified = simplify(evaluated_simplified)
                            except Exception as e:
                                print(f"[SummationCloser] Error eliminando variable de iteración {var_name}: {e}")
                                # Fallback: sustituir por 0
                                try:
                                    from sympy import Integer as SymInteger
                                    evaluated_simplified = evaluated_simplified.subs(var_symbol, SymInteger(0))
                                    evaluated_simplified = simplify(evaluated_simplified)
                                except:
                                    pass
                    
                    evaluated_latex = latex(evaluated_simplified)
                    # Validar que el resultado no contenga variables de iteración en LaTeX
                    if any(var in evaluated_latex for var in ['\\left(i', '(i', 'i)', '\\left(j', '(j', 'j)', '\\left(k', '(k', 'k)']):
                        print(f"[SummationCloser] Advertencia: Resultado LaTeX todavía contiene variables de iteración: {evaluated_latex}")
                    
                    if evaluated_latex not in " ".join(steps):
                        steps.append(f"\\text{{Resultado: }} {evaluated_latex}")
                except Exception as e:
                    print(f"[SummationCloser] Error evaluando sumatoria múltiple: {e}")
                    # e se usa en el print, así que está bien
                    import traceback
                    traceback.print_exc()
            except (IndexError, TypeError) as e:
                # Si no se pueden extraer los elementos, no es una estructura válida
                print(f"[SummationCloser] Error extrayendo límites de sumatoria múltiple: {e}")
                return steps
        
        return steps

