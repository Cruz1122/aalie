from typing import Dict, Optional
from sympy import Symbol, sympify, simplify, latex, oo, limit, log, exp, symbols
from sympy import Poly, degree
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
    """
    
    def __init__(self):
        pass
    
    def extract_dominant_term(self, polynomial: str, variable: str = "n") -> str:
        """
        Extrae el término dominante de un polinomio.
        
        Args:
            polynomial: Expresión polinómica en formato LaTeX o string
            variable: Variable principal (por defecto "n")
            
        Returns:
            Término dominante en formato LaTeX
        """
        if not polynomial or polynomial.strip() == "":
            return "1"
        
        try:
            # Convertir a SymPy
            expr = self._parse_polynomial(polynomial, variable)
            
            # Simplificar
            expr = simplify(expr)
            
            # Extraer término dominante
            dominant = self._extract_dominant_sympy(expr, variable)
            
            # Convertir a LaTeX
            return self._sympy_to_latex(dominant)
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
        """
        dominant = self.extract_dominant_term(polynomial, variable)
        return f"\\Theta({dominant})"
    
    def _parse_polynomial(self, polynomial: str, variable: str = "n") -> 'Expr':
        """
        Parsea un polinomio desde string/LaTeX a SymPy.
        
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
        
        # Reemplazar logaritmos: \log(n) -> log(n)
        expr_str = re.sub(r'\\log\((\w+)\)', r'log(\1)', expr_str)
        expr_str = re.sub(r'\\log\{(\w+)\}', r'log(\1)', expr_str)
        
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
            except:
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
        n = Symbol(variable, real=True, positive=True)
        n_sym = Symbol(variable, real=True, positive=True)
        
        # Verificar si la expresión es constante (no depende de n)
        if not expr.has(n_sym):
            # Es constante, retornar 1 para notación asintótica
            from sympy import Integer
            return Integer(1)
        
        try:
            # Intentar como polinomio
            poly = Poly(expr, n)
            if poly:
                # Obtener término líder usando LC (leading coefficient) y LM (leading monomial)
                leading_coeff = LC(poly)
                leading_monom = LM(poly)
                lt = leading_coeff * leading_monom
                simplified = simplify(lt)
                
                # Si el término dominante es constante, retornar 1
                if not simplified.has(n_sym):
                    from sympy import Integer
                    return Integer(1)
                
                return simplified
        except:
            pass
        
        # Si no es un polinomio simple, analizar comportamiento asintótico
        try:
            # Verificar si es exponencial
            if expr.has(exp):
                return expr
            
            # Verificar si tiene logaritmos
            if expr.has(log):
                # Comparar con n*log(n) y log(n)
                log_term = expr.subs(n_sym, oo)
                if log_term == oo:
                    # Intentar extraer término con log
                    if expr.has(n_sym * log(n_sym)):
                        return n_sym * log(n_sym)
                    return log(n_sym)
            
            # Para polinomios, extraer el término de mayor grado
            if expr.is_polynomial(n_sym):
                poly = Poly(expr, n_sym)
                if poly:
                    leading_coeff = LC(poly)
                    leading_monom = LM(poly)
                    result = leading_coeff * leading_monom
                    # Si es constante, retornar 1
                    if not result.has(n_sym):
                        from sympy import Integer
                        return Integer(1)
                    return result
            
            # Fallback: verificar si es constante después de simplificar
            simplified = simplify(expr)
            if not simplified.has(n_sym):
                from sympy import Integer
                return Integer(1)
            
            return simplified
        except:
            # Si hay error, verificar si es constante
            if not expr.has(n_sym):
                from sympy import Integer
                return Integer(1)
            return expr
    
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
        except:
            return str(expr)

