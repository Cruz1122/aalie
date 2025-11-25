from sympy import Symbol, sympify, latex, oo, log, exp, Expr
from sympy import Poly
from sympy.polys.polytools import LC, LM
import re


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
            
            # Expandir la expresión antes de extraer el término dominante
            # NO usar simplify() aquí porque puede factorizar la expresión
            # Esto evita problemas cuando SymPy factoriza expresiones como n^3 + n^2 + n -> n*(n**2 + n + 1)
            from sympy import expand
            # Expandir la expresión para asegurar que esté en forma de suma de términos
            expr = expand(expr)
            
            # Extraer término dominante
            dominant = self._extract_dominant_sympy(expr, variable)
            
            # Convertir a LaTeX
            result = self._sympy_to_latex(dominant)
            return result
        except Exception as e:
            print(f"[ComplexityClasses] Error extrayendo término dominante de {polynomial}: {e}")
            return polynomial
    
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
        
        # Reemplazar operadores LaTeX
        expr_str = expr_str.replace('\\cdot', '*')
        
        # Manejar fracciones LaTeX: \frac{a}{b} -> (a)/(b)
        # Procesar recursivamente para manejar fracciones anidadas
        def replace_frac(match):
            num = match.group(1)
            den = match.group(2)
            return f'({num})/({den})'
        
        max_iterations = 20  # Evitar loops infinitos
        iteration = 0
        while '\\frac{' in expr_str and iteration < max_iterations:
            # Usar regex con grupos nombrados para mejor captura
            expr_str = re.sub(r'\\frac\{([^{}]*)\}\{([^{}]*)\}', replace_frac, expr_str)
            iteration += 1
        
        # Reemplazar potencias LaTeX: n^2 -> n**2, n^{2} -> n**2
        expr_str = re.sub(r'(\w+)\^(\d+)', r'\1**\2', expr_str)
        expr_str = re.sub(r'(\w+)\^\{(\d+)\}', r'\1**\2', expr_str)
        
        # Reemplazar logaritmos: \log(n) -> log(n), \log{\left(n\right)} -> log(n)
        # Primero remover \left y \right dentro de logaritmos
        expr_str = re.sub(r'\\log\{\\left\(([^)]+)\\right\)\}', r'log(\1)', expr_str)
        expr_str = re.sub(r'\\log\(([^)]+)\)', r'log(\1)', expr_str)
        expr_str = re.sub(r'\\log\{([^}]+)\}', r'log(\1)', expr_str)
        
        # Si la expresión contiene C_k o constantes no numéricas, no podemos parsearla
        # Esto indica que es T_polynomial con constantes, no T_open simplificado
        if 'C_' in expr_str or 'C{' in expr_str:
            raise ValueError(f"Expresión contiene constantes C_k, no se puede parsear directamente: {expr_str[:100]}")
        
        # Crear símbolo para la variable
        n = Symbol(variable, integer=True, positive=True)
        
        # Crear contexto con símbolos comunes
        from sympy import log
        syms = {variable: n, 'log': log}
        
        try:
            return sympify(expr_str, locals=syms)
        except Exception as e:
            # Fallback: intentar con parsing más simple
            try:
                # Intentar sin algunos reemplazos complejos
                expr_str_simple = expr_str
                return sympify(expr_str_simple, locals=syms)
            except Exception:
                raise e
    
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
        
        # Si no se encuentra el símbolo de la variable, intentar usar el primer símbolo
        # (esto puede ser útil para casos donde la variable tiene otro nombre)
        if var_symbol is None:
            # Si no hay símbolo con el nombre de la variable, es constante
            return Integer(1)
        
        # Intentar crear Poly y extraer término líder
        # Este es el método principal para polinomios
        # Asegurar que la expresión esté expandida antes de crear el Poly
        # (puede estar factorizada como n*(n**2 + n + 1))
        from sympy import expand as sympy_expand, Symbol, ZZ
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

