"""
Gestión del environment de variables durante la ejecución.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""
from typing import Any, Dict, Optional, Union
from sympy import Symbol, Integer, Expr, sympify
from ..analysis.utils.expr_converter import ExprConverter


class ExecutionEnvironment:
    """
    Environment de variables para la ejecución del pseudocódigo.
    
    Maneja valores concretos cuando están disponibles y expresiones simbólicas
    cuando no lo están (evaluación híbrida).
    
    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """
    
    def __init__(self, input_size: Optional[int] = None, variable_name: str = "n"):
        """
        Inicializa el environment.
        
        Args:
            input_size: Tamaño de entrada concreto (ej: n=4). Si es None, se usa evaluación simbólica.
            variable_name: Nombre de la variable principal (por defecto "n")
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        self.variables: Dict[str, Union[int, float, str, Expr]] = {}
        self.input_size = input_size
        self.variable_name = variable_name
        self.expr_converter = ExprConverter(variable_name)
        
        # Si hay tamaño de entrada concreto, inicializar la variable principal
        if input_size is not None:
            self.variables[variable_name] = input_size
    
    def set_variable(self, name: str, value: Union[int, float, str, Expr, Any]) -> None:
        """
        Establece el valor de una variable.
        
        Args:
            name: Nombre de la variable
            value: Valor a asignar (puede ser concreto o simbólico)
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        # Convertir a Expr si es necesario
        if isinstance(value, (int, float)):
            self.variables[name] = value
        elif isinstance(value, str):
            # Intentar evaluar como número
            try:
                self.variables[name] = int(value) if '.' not in value else float(value)
            except ValueError:
                # Mantener como string si no es número
                self.variables[name] = value
        elif isinstance(value, Expr):
            self.variables[name] = value
        else:
            # Intentar convertir usando expr_converter
            try:
                self.variables[name] = self.expr_converter.ast_to_sympy(value)
            except Exception:
                self.variables[name] = str(value)
    
    def get_variable(self, name: str) -> Union[int, float, str, Expr, None]:
        """
        Obtiene el valor de una variable.
        
        Args:
            name: Nombre de la variable
            
        Returns:
            Valor de la variable o None si no existe
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        return self.variables.get(name)
    
    def has_variable(self, name: str) -> bool:
        """
        Verifica si una variable existe.
        
        Args:
            name: Nombre de la variable
            
        Returns:
            True si la variable existe, False en caso contrario
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        return name in self.variables
    
    def evaluate_expression(self, expr: Any) -> Union[int, float, str, Expr]:
        """
        Evalúa una expresión del AST.
        
        Si el input_size es concreto, intenta evaluar con valores concretos.
        Si no, mantiene expresiones simbólicas.
        
        Args:
            expr: Expresión del AST a evaluar
            
        Returns:
            Valor concreto si es posible, expresión simbólica en caso contrario
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        # Convertir a SymPy primero
        sympy_expr = self.expr_converter.ast_to_sympy(expr)
        
        # Si tenemos input_size concreto, intentar evaluar
        if self.input_size is not None:
            try:
                # Sustituir símbolos conocidos
                evaluated = sympy_expr.subs({
                    Symbol(self.variable_name): self.input_size
                })
                
                # Sustituir variables del environment
                for var_name, var_value in self.variables.items():
                    if isinstance(var_value, (int, float)):
                        evaluated = evaluated.subs(Symbol(var_name), var_value)
                
                # Intentar evaluar numéricamente
                if evaluated.is_number:
                    return float(evaluated) if isinstance(evaluated, float) else int(evaluated)
                
                # Si no es completamente numérico, retornar la expresión simplificada
                return evaluated
            except Exception:
                # Si falla, retornar expresión simbólica
                return sympy_expr
        
        # Sin input_size, retornar expresión simbólica
        return sympy_expr
    
    def evaluate_to_string(self, expr: Any) -> str:
        """
        Evalúa una expresión y la convierte a string legible.
        
        Args:
            expr: Expresión del AST
            
        Returns:
            String representando el valor o expresión
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        value = self.evaluate_expression(expr)
        
        if isinstance(value, (int, float)):
            return str(value)
        elif isinstance(value, str):
            return value
        elif isinstance(value, Expr):
            # Intentar simplificar y convertir a string
            try:
                from sympy import latex
                return latex(value)
            except Exception:
                return str(value)
        else:
            return str(value)
    
    def get_variables_snapshot(self) -> Dict[str, Union[int, float, str]]:
        """
        Obtiene un snapshot de todas las variables como diccionario serializable.
        
        Returns:
            Diccionario con nombre -> valor (convertido a string si es Expr)
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        snapshot = {}
        for name, value in self.variables.items():
            if isinstance(value, (int, float, str)):
                snapshot[name] = value
            elif isinstance(value, Expr):
                # Convertir expresión a string legible
                try:
                    from sympy import latex
                    snapshot[name] = latex(value)
                except Exception:
                    snapshot[name] = str(value)
            else:
                snapshot[name] = str(value)
        return snapshot
    
    def copy(self) -> 'ExecutionEnvironment':
        """
        Crea una copia del environment (útil para recursión).
        
        Returns:
            Nueva instancia con las mismas variables
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        new_env = ExecutionEnvironment(self.input_size, self.variable_name)
        new_env.variables = self.variables.copy()
        return new_env

