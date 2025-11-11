# apps/api/app/analysis/avg_model.py

from typing import Dict, Optional, Any
from sympy import Symbol, sympify, Integer, Rational


class AvgModel:
    """
    Modelo probabilístico para análisis de caso promedio.
    
    Maneja dos modos:
    - uniform: probabilidad uniforme (p=1/2 por defecto para comparaciones simétricas)
    - symbolic: probabilidades simbólicas (p, q, p(i), etc.)
    
    Permite definir predicados específicos con probabilidades explícitas.
    """
    
    def __init__(self, mode: str = "uniform", predicates: Optional[Dict[str, str]] = None):
        """
        Inicializa el modelo probabilístico.
        
        Args:
            mode: "uniform" | "symbolic"
            predicates: Diccionario opcional de predicados a probabilidades
                       ej: {"A[j] > A[j+1]": "1/2", "A[i] < pivot": "p"}
        """
        if mode not in ("uniform", "symbolic"):
            raise ValueError(f"mode debe ser 'uniform' o 'symbolic', recibido: {mode}")
        
        self.mode = mode
        self.predicates = predicates or {}
        self._symbol_counter = 0  # Para generar símbolos únicos p, q, r, etc.
    
    def get_probability(self, predicate: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Obtiene la probabilidad para un predicado dado.
        
        Args:
            predicate: String que describe el predicado (ej: "A[j] > A[j+1]")
            context: Contexto opcional (ej: variable de bucle actual)
        
        Returns:
            String con la probabilidad (ej: "1/2", "p", "p(i)")
        """
        # Buscar predicado exacto en el diccionario
        if predicate in self.predicates:
            return self.predicates[predicate]
        
        # Buscar predicados que contengan el predicado como subcadena (para flexibilidad)
        for key, value in self.predicates.items():
            if predicate in key or key in predicate:
                return value
        
        # Si no hay predicado explícito
        if self.mode == "uniform":
            # Para comparaciones simétricas entre dos elementos aleatorios, p = 1/2
            return "1/2"
        else:  # symbolic
            # Generar símbolo probabilístico
            # Si hay contexto con variable de bucle, usar p(i), p(j), etc.
            if context and "loop_var" in context:
                loop_var = context["loop_var"]
                return f"p({loop_var})"
            else:
                # Usar símbolo genérico p, q, r, etc.
                symbols = ["p", "q", "r", "s", "t"]
                symbol = symbols[self._symbol_counter % len(symbols)]
                self._symbol_counter += 1
                return symbol
    
    def get_default_probability(self) -> str:
        """
        Obtiene la probabilidad por defecto del modelo.
        
        Returns:
            "1/2" para uniform, "p" para symbolic
        """
        if self.mode == "uniform":
            return "1/2"
        else:
            return "p"
    
    def get_probability_sympy(self, predicate: str, context: Optional[Dict[str, Any]] = None) -> Any:
        """
        Obtiene la probabilidad como expresión SymPy.
        
        Args:
            predicate: String que describe el predicado
            context: Contexto opcional
        
        Returns:
            Expresión SymPy (Rational, Symbol, o función)
        """
        prob_str = self.get_probability(predicate, context)
        
        try:
            # Intentar convertir a Rational (fracción)
            if "/" in prob_str:
                parts = prob_str.split("/")
                if len(parts) == 2:
                    num = int(parts[0].strip())
                    den = int(parts[1].strip())
                    return Rational(num, den)
            
            # Intentar convertir a Integer
            if prob_str.isdigit():
                return Integer(int(prob_str))
            
            # Intentar convertir a float y luego a Rational
            try:
                val = float(prob_str)
                return Rational(int(val * 100), 100)  # Aproximación
            except ValueError:
                pass
            
            # Si es un símbolo como "p", "p(i)", etc.
            if "(" in prob_str and ")" in prob_str:
                # Función como p(i)
                func_name = prob_str.split("(")[0].strip()
                var_name = prob_str.split("(")[1].split(")")[0].strip()
                var_sym = Symbol(var_name, integer=True)
                func_sym = Symbol(func_name, real=True)
                # Retornar como función aplicada
                from sympy import Function
                p_func = Function(func_name)
                return p_func(var_sym)
            else:
                # Símbolo simple
                return Symbol(prob_str, real=True, positive=True)
        
        except Exception:
            # Fallback: símbolo genérico
            return Symbol("p", real=True, positive=True)
    
    def get_model_info(self) -> Dict[str, str]:
        """
        Obtiene información del modelo para mostrar en la UI.
        
        Returns:
            Diccionario con mode y note (badge del modelo)
        """
        if self.mode == "uniform":
            if self.predicates:
                # Hay predicados explícitos
                predicates_str = ", ".join([f"{k}: {v}" for k, v in list(self.predicates.items())[:2]])
                if len(self.predicates) > 2:
                    predicates_str += "..."
                note = f"uniforme (predicados: {predicates_str})"
            else:
                note = "uniforme (p=1/2)"
        else:  # symbolic
            if self.predicates:
                predicates_str = ", ".join([f"{k}: {v}" for k, v in list(self.predicates.items())[:2]])
                if len(self.predicates) > 2:
                    predicates_str += "..."
                note = f"simbólico (predicados: {predicates_str})"
            else:
                note = "simbólico (p)"
        
        return {
            "mode": self.mode,
            "note": note
        }
    
    def has_symbols(self) -> bool:
        """
        Verifica si el modelo contiene símbolos probabilísticos.
        
        Returns:
            True si hay símbolos (mode="symbolic" o predicados con símbolos)
        """
        if self.mode == "symbolic":
            return True
        
        # Verificar si algún predicado contiene símbolos (no números)
        for prob_str in self.predicates.values():
            try:
                # Intentar convertir a número
                if "/" in prob_str:
                    parts = prob_str.split("/")
                    int(parts[0].strip())
                    int(parts[1].strip())
                else:
                    float(prob_str)
                # Si llegamos aquí, es un número
            except (ValueError, AttributeError):
                # No es un número, es un símbolo
                return True
        
        return False

