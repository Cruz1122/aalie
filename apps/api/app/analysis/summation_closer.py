# apps/api/app/analysis/summation_closer.py

from typing import List, Tuple, Optional, Union
from sympy import Symbol, summation, simplify, latex, sympify, oo, Sum, expand, factor, Expr, Add, Mul
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
    """
    
    def __init__(self):
        pass
    
    def close_summation(self, expr: Union[str, Expr], variable: str = "n") -> Tuple[str, List[str]]:
        """
        Cierra una sumatoria y genera pasos educativos.
        
        Args:
            expr: Expresión LaTeX con sumatorias (ej: "\\sum_{i=1}^{n} 1") o Expr de SymPy
            variable: Variable principal (por defecto "n")
            
        Returns:
            Tupla (expresión_cerrada_latex, lista_de_pasos_en_latex)
        """
        # Si recibimos un objeto SymPy directamente, trabajar con él
        if isinstance(expr, Expr):
            try:
                # Evaluar directamente con SymPy
                from sympy import summation, simplify, expand, factor
                
                # Función recursiva para evaluar todas las sumatorias
                def evaluate_all_sums(expr: Expr) -> Expr:
                    """Evalúa recursivamente todas las sumatorias en la expresión."""
                    # Si es una Sum, evaluarla
                    if isinstance(expr, Sum):
                        try:
                            evaluated = expr.doit()
                            return simplify(evaluated)
                        except:
                            # Si no se puede evaluar, intentar expandir y reevaluar
                            try:
                                expanded = expand(expr)
                                if isinstance(expanded, Sum):
                                    return expanded.doit()
                                return evaluate_all_sums(expanded)
                            except:
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
                                if hasattr(new_expr, 'args'):
                                    for arg in new_expr.args:
                                        if isinstance(arg, Sum):
                                            # Hay más sumatorias, seguir evaluando
                                            return evaluate_all_sums(new_expr)
                                return new_expr
                            except:
                                return expr
                    
                    return expr
                
                # Evaluar todas las sumatorias recursivamente
                result_expr = evaluate_all_sums(expr)
                
                # Simplificar completamente el resultado
                result_expr = simplify(result_expr)
                
                # Intentar expandir y factorizar para obtener la forma más simple
                try:
                    expanded = expand(result_expr)
                    result_expr = simplify(expanded)
                except:
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
                
                # Convertir a LaTeX
                closed_latex = self._sympy_to_latex(result_expr)
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
            except:
                expr = "1"
        
        if not expr or expr.strip() == "":
            return "1", []
        
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
            except:
                start_val = start
                end_val = end
            
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
            
            steps.append(
                f"\\text{{Aplicando fórmula de suma aritmética: }} "
                f"\\sum_{{{var}={start}}}^{{{end}}} {var} = \\frac{{{end}({end}+1)}}{{2}}"
            )
        
        return steps
    
    def _generate_generic_steps(self, expr: str, variable: str) -> List[str]:
        """Genera pasos genéricos usando SymPy."""
        steps = []
        
        # Intentar simplificar paso a paso
        try:
            steps.append(f"\\text{{Simplificando expresión: }} {expr}")
            # SymPy manejará la simplificación
        except Exception as e:
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
        # Crear símbolos
        n = Symbol(variable, integer=True, positive=True)
        i = Symbol('i', integer=True)
        j = Symbol('j', integer=True)
        k = Symbol('k', integer=True)
        
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
        # Crear símbolos
        n = Symbol(variable, integer=True, positive=True)
        i = Symbol('i', integer=True)
        j = Symbol('j', integer=True)
        k = Symbol('k', integer=True)
        
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
            except:
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
            except:
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
        except:
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
            except:
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
        except:
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
            latex_str = latex(expr)
            # Normalizar formato
            latex_str = latex_str.replace('*', ' \\cdot ')
            return latex_str
        except:
            return str(expr)

