import re

from sympy import Expr, Poly, Symbol, exp, latex, log, oo, sympify
from sympy.polys.polytools import LC, LM


class ComplexityClasses:
    """
    Extrae términos dominantes y calcula clases de complejidad O/Ω/Θ.
    
    Maneja:
    - Polinomios: n², n³, etc.
    - Funciones logarítmicas: log(n), n*log(n)
    - Funciones exponenciales: 2^n
    - Combinaciones de las anteriores
    
    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """
    
    def __init__(self):
        """
        Inicializa una instancia de ComplexityClasses.
        
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        pass
    
    def extract_dominant_term(self, polynomial: str, variable: str = "n") -> str:
        """
        Extrae el término dominante de un polinomio.
        
        Args:
            polynomial: Expresión polinómica en formato LaTeX o string
            variable: Variable principal (por defecto "n")
            
        Returns:
            Término dominante en formato LaTeX
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        if not polynomial or polynomial.strip() == "":
            return "1"
        
        try:
            # Convertir a SymPy
            expr = self._parse_polynomial(polynomial, variable)

            # Expandir la expresión antes de extraer el término dominante.
            # NO usar simplify() aquí porque puede factorizar la expresión y mezclar grados.
            from sympy import expand

            expr = expand(expr)

            free_symbols = list(expr.free_symbols)
            if not free_symbols:
                # Expresión constante: complejidad O(1)
                return "1"

            # Caso 1: solo una variable de tamaño → usar lógica clásica (univariante)
            if len(free_symbols) == 1:
                dominant = self._extract_dominant_sympy(expr, variable)
                dominant = self._strip_numeric_coefficient(dominant)
                return self._sympy_to_latex(dominant)

            # Caso 2: varias variables de tamaño (p.ej. n y m) → extraer monomio dominante
            # Definimos el grado de un término como la suma de los exponentes
            # de todas las variables de tamaño (grado total). Elegimos el término
            # con mayor grado total. Esto asegura, por ejemplo:
            #   5 m n + 6 n   →  término dominante 5 m n  (grado 2 frente a 1)
            size_syms = tuple(free_symbols)

            # Descomponer en términos aditivos
            if expr.is_Add:
                terms = expr.as_ordered_terms()
            else:
                terms = [expr]

            best_term = None
            best_deg = -1.0

            for term in terms:
                try:
                    powers = term.as_powers_dict()
                except Exception:
                    continue

                total_deg = 0.0
                for sym, exp in powers.items():
                    if sym in size_syms:
                        # exp puede no ser puramente numérico (casos raros), intentar evaluarlo
                        if getattr(exp, "is_number", False):
                            try:
                                total_deg += float(exp)
                            except Exception:
                                pass
                        else:
                            try:
                                total_deg += float(exp.evalf())
                            except Exception:
                                pass

                if total_deg > best_deg:
                    best_deg = total_deg
                    best_term = term

            if best_term is None or best_deg <= 0:
                # No se encontró monomio con grado positivo → tratar como constante
                return "1"
            
            # Eliminar factor numérico (p.ej., 15 n^2 → n^2, 7/2 n^2 → n^2)
            best_term = self._strip_numeric_coefficient(best_term)
            return self._sympy_to_latex(best_term)
        except Exception as e:
            print(f"[ComplexityClasses] Error extrayendo término dominante de {polynomial}: {e}")
            # Fallback: aproximar el monomio dominante directamente desde el string
            return self._fallback_dominant_from_string(polynomial, variable)
    
    def calculate_big_o(self, polynomial: str, variable: str = "n") -> str:
        """
        Calcula O(f(n)) para una expresión.
        
        Args:
            polynomial: Expresión polinómica
            variable: Variable principal
            
        Returns:
            Clase Big-O en formato LaTeX (ej: "O(n^2)")
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        dominant = self.extract_dominant_term(polynomial, variable)
        return f"O({dominant})"
    
    def calculate_big_omega(self, polynomial: str, variable: str = "n") -> str:
        """
        Calcula Ω(f(n)) para una expresión.
        
        Args:
            polynomial: Expresión polinómica
            variable: Variable principal
            
        Returns:
            Clase Big-Omega en formato LaTeX (ej: "Ω(n^2)")
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        dominant = self.extract_dominant_term(polynomial, variable)
        return f"\\Omega({dominant})"
    
    def calculate_big_theta(self, polynomial: str, variable: str = "n") -> str:
        """
        Calcula Θ(f(n)) para una expresión.
        
        Args:
            polynomial: Expresión polinómica
            variable: Variable principal
            
        Returns:
            Clase Big-Theta en formato LaTeX (ej: "Θ(n^2)")
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        dominant = self.extract_dominant_term(polynomial, variable)
        return f"\\Theta({dominant})"
    
    def _parse_polynomial(self, polynomial: str, variable: str = "n") -> 'Expr':
        """
        Parsea un polinomio desde string/LaTeX a SymPy.
        
        Args:
            polynomial: Expresión polinómica en formato LaTeX o string
            variable: Variable principal (por defecto "n")
            
        Returns:
            Expresión SymPy
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        
        Args:
            polynomial: Expresión en formato string o LaTeX
            variable: Variable principal
            
        Returns:
            Expresión SymPy
        """
        # Normalizar formato LaTeX
        expr_str = polynomial
        
        # Eliminar comandos LaTeX que no afectan el parsing: \left, \right
        expr_str = re.sub(r'\\left\(', '(', expr_str)
        expr_str = re.sub(r'\\right\)', ')', expr_str)
        expr_str = re.sub(r'\\left\{', '{', expr_str)
        expr_str = re.sub(r'\\right\}', '}', expr_str)
        expr_str = re.sub(r'\\left\[', '[', expr_str)
        expr_str = re.sub(r'\\right\]', ']', expr_str)
        
        # Eliminar espacios
        expr_str = re.sub(r'\s+', '', expr_str)

        # Normalizar t_{while_X} y t_{repeat_X} a t_while_X (SymPy no parsea llaves)
        expr_str = re.sub(r't_\{while_(\d+)\}', r't_while_\1', expr_str)
        expr_str = re.sub(r't_\{repeat_(\d+)\}', r't_repeat_\1', expr_str)
        
        # Reemplazar operadores LaTeX
        expr_str = expr_str.replace('\\cdot', '*')
        # Normalizar algunos patrones con fracciones que ya vienen parcialmente "sympificados"
        # como resultado de latex() (evita errores de TokenError con '\\' y saltos de línea).
        expr_str = expr_str.replace('\\\\', '\\')

        # Normalizar variantes de la variable de exponente con subíndice:
        #   exp_{0}, exp_0, exp_{1}, etc. → exp
        expr_str = re.sub(r'exp_\{\d+\}', 'exp', expr_str)
        expr_str = re.sub(r'exp_\d+', 'exp', expr_str)
        
        # Normalizar símbolos de tamaño equivalentes:
        # En algunos cierres se usa 'N' (mayúscula) como alias de la variable principal.
        # Para la extracción de complejidad, tratamos ambas como la misma variable.
        if variable == "n":
            expr_str = expr_str.replace("N", "n")

        # Manejar multiplicación implícita entre variable de tamaño y paréntesis:
        #   n(7*n-1)  ->  n*(7*n-1)
        #   3n(7*n+1) -> 3*n*(7*n+1)
        # Usamos lookbehind negativo para letras para no tocar llamadas a funciones
        # como log(n) o exp(n), pero sí permitir coeficientes numéricos antes de n.
        expr_str = re.sub(rf"(?<![a-zA-Z]){re.escape(variable)}\(", f"{variable}*(", expr_str)
        
        # Manejar fracciones LaTeX: \frac{a}{b} -> (a)/(b)
        # 1) Caso especial: fracciones anidadas simples \frac{\frac{n}{2}}{3}
        expr_str = re.sub(
            r'\\frac\{\\frac\{([^{}]+)\}\{([^{}]+)\}\}\{([^{}]+)\}',
            r'((\1)/(\2))/(\3)',
            expr_str,
        )
        # 2) Fracciones simples
        def replace_frac(match):
            num = match.group(1)
            den = match.group(2)
            return f'({num})/({den})'
        
        expr_str = re.sub(r'\\frac\{([^{}]+)\}\{([^{}]+)\}', replace_frac, expr_str)
        
        # Reemplazar potencias LaTeX: n^2 -> n**2, n^{2} -> n**2
        expr_str = re.sub(r'(\w+)\^(\d+)', r'\1**\2', expr_str)
        expr_str = re.sub(r'(\w+)\^\{(\d+)\}', r'\1**\2', expr_str)
        
        # Reemplazar logaritmos: \log(n) -> log(n), \log{\left(n\right)} -> log(n)
        # Primero remover \left y \right dentro de logaritmos
        expr_str = re.sub(r'\\log\{\\left\(([^)]+)\\right\)\}', r'log(\1)', expr_str)
        expr_str = re.sub(r'\\log\(([^)]+)\)', r'log(\1)', expr_str)
        expr_str = re.sub(r'\\log\{([^}]+)\}', r'log(\1)', expr_str)
        
        # Normalizar productos implícitos típicos en polinomios:
        #   5n  -> 5*n
        #   5mn -> 5*m*n
        #   mn  -> m*n, nm -> n*m
        # Esto ayuda a SymPy a parsear expresiones como 5mn+6n+3.
        # 1) número seguido de letra: 5n -> 5*n
        expr_str = re.sub(r'(\d)([a-zA-Z])', r'\1*\2', expr_str)
        # 2) letras de tamaño consecutivas (m y n) sin operador: mn -> m*n, nm -> n*m
        expr_str = re.sub(r'([mn])([mn])', r'\1*\2', expr_str)
        
        # Si la expresión contiene C_k o constantes no numéricas, no podemos parsearla
        # Esto indica que es T_polynomial con constantes, no T_open simplificado
        if 'C_' in expr_str or 'C{' in expr_str:
            raise ValueError(f"Expresión contiene constantes C_k, no se puede parsear directamente: {expr_str[:100]}")
        
        # Crear símbolo para la variable
        n = Symbol(variable, integer=True, positive=True)
        
        # Crear contexto con símbolos comunes + t_while_X, t_repeat_X
        syms = {variable: n, 'log': log}
        for m in re.finditer(r't_(?:while|repeat)_\d+', expr_str):
            name = m.group(0)
            syms[name] = n  # Sustituir por n como cota conservadora cuando no hay bound explícito
        
        try:
            return sympify(expr_str, locals=syms)
        except Exception:
            # Fallback: intentar con parsing más simple
            try:
                # Intentar sin algunos reemplazos complejos
                expr_str_simple = expr_str
                return sympify(expr_str_simple, locals=syms)
            except Exception as e2:
                raise e2

    def _strip_numeric_coefficient(self, expr: 'Expr') -> 'Expr':
        """
        Elimina el coeficiente numérico global de un monomio.
        Ejemplos:
            15*n**2      -> n**2
            7/2*n**2     -> n**2
            3*n*log(n)   -> n*log(n)
        Si el "coeficiente" no es puramente numérico (depende de variables),
        se devuelve la expresión original.
        """
        try:
            from sympy import Expr as SymExpr
            if not isinstance(expr, SymExpr):
                return expr
            coeff, rest = expr.as_coeff_Mul()
            # coeff puramente numérico (Integer, Rational, Float, etc.)
            if getattr(coeff, "is_number", False) and coeff != 0:
                return rest
            return expr
        except Exception:
            return expr

    def _fallback_dominant_from_string(self, polynomial: str, variable: str = "n") -> str:
        """
        Heurística de último recurso: extrae un monomio dominante directamente del string
        sin usar SymPy. Garantiza devolver SIEMPRE un monomio (no la expresión entera).
        """
        import re

        s = polynomial or ""

        # 1) Manejar expresiones con logaritmos primero
        has_log = ("\\log" in s) or ("log(" in s) or ("log{" in s)
        if has_log:
            # Eliminar bloques log(...) / \log{...} temporariamente para ver
            # si la variable aparece FUERA del log (n log n vs log n).
            import re as _re
            log_block_pattern = r'(\\log\{[^}]*\}|\\log\([^)]*\)|log\([^)]*\))'
            s_no_logs = _re.sub(log_block_pattern, "", s)
            var_outside_logs = variable in s_no_logs
            if var_outside_logs:
                # n log n (o peor) domina sobre log puro
                return f"{variable} \\log({variable})"
            else:
                # Solo log(n)
                return f"\\log({variable})"

        # 2) Buscar exponentes explícitos tipo n^{k} o n^k
        exps = re.findall(rf"{re.escape(variable)}\^\{{(\d+)\}}", s)
        exps += re.findall(rf"{re.escape(variable)}\^(\d+)", s)
        if exps:
            k = max(int(e) for e in exps)
            if k == 1:
                return variable
            return f"{variable}^{{{k}}}"

        # 3) Buscar productos implícitos de la forma nn (-> n^2) o n n
        if re.search(rf"{re.escape(variable)}\s*{re.escape(variable)}", s) or re.search(
            rf"{re.escape(variable)}{re.escape(variable)}", s
        ):
            return f"{variable}^{{2}}"

        # 4) Multivariable simple: patrón m n o n m → mn (grado 2)
        #    Esto cubre casos rectangulares n*m.
        if re.search(r"m\s*n|n\s*m|mn|nm", s):
            return "m n"

        # 5) Si aparece la variable sin exponente, devolver n
        if re.search(rf"{re.escape(variable)}", s):
            return variable

        # 6) Si no se encontró el símbolo pedido, pero hay otros símbolos candidatos,
        # intentar una pasada adicional usando uno de ellos como nueva variable.
        import re as _re2
        token_vars = _re2.findall(r"[a-zA-Z]+", s)
        # Filtrar tokens obvios que no representan tamaño (log, C, t, etc.)
        # y nombres típicos de arrays (A, B, arr, etc.) que no deben aparecer en complejidad
        ARRAY_LIKE_NAMES = {"a", "b", "c", "arr", "array", "lista", "list"}
        filtered = []
        for tok in token_vars:
            low = tok.lower()
            if low in ("log", "cdot", "frac", "text"):
                continue
            if low.startswith("c_") or low.startswith("t_"):
                continue
            if low in ARRAY_LIKE_NAMES:
                continue
            filtered.append(tok)
        # Evitar recursión infinita: solo reintentar si encontramos algo distinto
        for alt in filtered:
            if alt != variable:
                return self._fallback_dominant_from_string(polynomial, variable=alt)

        # 7) Fallback completo: sin variables detectables → constante
        return "1"
    
    def _extract_dominant_sympy(self, expr: 'Expr', variable: str = "n") -> 'Expr':
        """
        Extrae el término dominante usando SymPy.
        
        Args:
            expr: Expresión SymPy
            variable: Variable principal
            
        Returns:
            Término dominante como expresión SymPy (si es constante, retorna 1)
        """
        from sympy import Integer
        
        # Obtener símbolos libres de la expresión
        free_symbols = expr.free_symbols
        
        # Si no hay símbolos libres, es constante
        if not free_symbols:
            return Integer(1)
        
        # Buscar el símbolo de la variable en los símbolos libres
        var_symbol = None
        for sym in free_symbols:
            if sym.name == variable:
                var_symbol = sym
                break
        
        # Si no se encuentra el símbolo de la variable pedida, usar una variable libre
        # disponible como fallback (evita colapsar indebidamente a O(1)).
        if var_symbol is None:
            if free_symbols:
                # Preferir nombres canónicos de tamaño cuando existan.
                preferred = [s for s in free_symbols if getattr(s, "name", "") in ("n", "m", "N")]
                var_symbol = preferred[0] if preferred else next(iter(free_symbols))
            else:
                return Integer(1)
        
        # Intentar crear Poly y extraer término líder
        # Este es el método principal para polinomios
        # Asegurar que la expresión esté expandida antes de crear el Poly
        # (puede estar factorizada como n*(n**2 + n + 1))
        from sympy import ZZ, Symbol
        from sympy import expand as sympy_expand
        # Expandir la expresión para asegurar que esté en forma de suma
        expr_expanded = sympy_expand(expr)
        
        # Crear un símbolo nuevo sin propiedades especiales para crear el Poly
        # Si el símbolo original tiene integer=True, positive=True, Poly puede usar
        # domain='ZZ[n]' que causa problemas con degree()
        var_symbol_for_poly = Symbol(variable)
        
        # Reemplazar el símbolo original con el genérico en la expresión expandida
        # Esto asegura que Poly use domain='ZZ' en lugar de 'ZZ[n]'
        expr_for_poly = expr_expanded.subs(var_symbol, var_symbol_for_poly)
        
        # Intentar convertir a Poly usando as_poly() que es más robusto
        # Primero intentar con el símbolo genérico
        try:
            poly = expr_for_poly.as_poly(var_symbol_for_poly, domain=ZZ)
            if poly is not None and not poly.is_zero:
                degree_val = poly.degree()
                if degree_val is not None and degree_val > 0:
                    # Obtener término líder
                    leading_coeff = LC(poly)
                    leading_monom = LM(poly)
                    result_term = leading_coeff * leading_monom
                    # Reemplazar el símbolo genérico con el original
                    if var_symbol != var_symbol_for_poly:
                        result_term = result_term.subs(var_symbol_for_poly, var_symbol)
                    return result_term
        except Exception:
            # Si as_poly() falla, intentar crear Poly directamente
            try:
                poly = Poly(expr_for_poly, var_symbol_for_poly, domain=ZZ)
                if poly is not None and not poly.is_zero:
                    degree_val = poly.degree()
                    if degree_val is not None and degree_val > 0:
                        leading_coeff = LC(poly)
                        leading_monom = LM(poly)
                        result_term = leading_coeff * leading_monom
                        if var_symbol != var_symbol_for_poly:
                            result_term = result_term.subs(var_symbol_for_poly, var_symbol)
                        return result_term
            except Exception:
                # Ambos métodos fallaron, continuar con método alternativo
                pass
        
        # Método alternativo: analizar términos manualmente usando as_coeff_exponent
        # Este método es más robusto para obtener la potencia de una variable
        # NO usar term.has(var_symbol) porque los símbolos pueden ser objetos diferentes
        if expr_expanded.is_Add:
            terms = expr_expanded.args
            max_complexity_level = -1  # -1: constante, 0: log(n), 1: n, 2: n*log(n), 3+: n^k
            max_term = None
            
            for term in terms:
                # Verificar si el término contiene la variable por nombre
                term_symbol_names = [s.name for s in term.free_symbols]
                if variable not in term_symbol_names:
                    # Término constante
                    if max_complexity_level < 0:
                        max_complexity_level = -1
                        max_term = term
                    continue
                
                # Calcular nivel de complejidad del término
                term_level = -1
                term_power = 0
                
                # Verificar si tiene log
                from sympy import log
                has_log = term.has(log)
                
                # Buscar el símbolo con el nombre de la variable en el término
                for sym in term.free_symbols:
                    if sym.name == variable:
                        try:
                            # Obtener coeficiente y exponente para este símbolo
                            _, exponent = term.as_coeff_exponent(sym)
                            if exponent.is_number:
                                term_power = float(exponent)
                            break
                        except Exception:
                            # Si falla, podría ser que el término sea directamente el símbolo
                            if term == sym:
                                term_power = 1
                            break
                
                # Determinar nivel de complejidad
                if has_log and term_power == 0:
                    # Solo log(n), sin n^k
                    term_level = 0
                elif has_log and term_power > 0:
                    # n^k * log(n)
                    term_level = term_power + 0.5  # n*log(n) está entre n y n^2
                elif term_power > 0:
                    # n^k sin log
                    term_level = term_power
                else:
                    # Constante
                    term_level = -1
                
                # Actualizar máximo
                if term_level > max_complexity_level:
                    max_complexity_level = term_level
                    max_term = term
            
            # Retornar el término de mayor complejidad
            if max_term is not None:
                return max_term
        
        # Si no es un polinomio, analizar comportamiento asintótico
        # Verificar si es exponencial
        if expr.has(exp):
            return expr
        
        # Verificar si tiene logaritmos
        from sympy import log
        if expr.has(log) and var_symbol is not None:
            try:
                log_term = expr.subs(var_symbol, oo)
                if log_term == oo:
                    if expr.has(var_symbol * log(var_symbol)):
                        return var_symbol * log(var_symbol)
                    return log(var_symbol)
            except Exception:
                pass
        
        # Último fallback: si tiene la variable, retornar la expresión
        # Si no tiene la variable, es constante
        if expr_expanded.has(var_symbol):
            return expr_expanded
        return Integer(1)
    
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
            # Asegurar que log se muestre como \log
            latex_str = latex_str.replace('log', '\\log')
            return latex_str
        except Exception:
            return str(expr)

