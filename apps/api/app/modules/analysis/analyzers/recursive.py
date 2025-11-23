from typing import Any, Dict, List, Optional, Tuple
import math
import re
from sympy import Expr, latex, Integer, Symbol, sympify, simplify, solve, symbols, I, im, expand, factor
from collections import Counter
from .base import BaseAnalyzer


class RecursiveAnalyzer(BaseAnalyzer):
    """
    Analizador para algoritmos recursivos divide-and-conquer.
    
    Extrae recurrencias de la forma T(n) = a·T(n/b) + f(n)
    y las resuelve mediante el Teorema Maestro, método de iteración o árbol de recursión.
    
    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """
    
    def __init__(self):
        """
        Inicializa una instancia de RecursiveAnalyzer.
        
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        super().__init__()
        self.procedure_name: Optional[str] = None
        self.proc_def: Optional[Dict[str, Any]] = None
        self.ast: Optional[Dict[str, Any]] = None  # Guardar AST completo para buscar funciones auxiliares
        self.recurrence: Optional[Dict[str, Any]] = None
        self.master: Optional[Dict[str, Any]] = None
        self.iteration: Optional[Dict[str, Any]] = None
        self.recursion_tree: Optional[Dict[str, Any]] = None
        self.proof: List[Dict[str, str]] = []
        self.proof_steps: List[Dict[str, str]] = []
        # Inicializar expr_converter si no está en BaseAnalyzer
        if not hasattr(self, 'expr_converter'):
            from .expr_converter import ExprConverter
            self.expr_converter = ExprConverter()
    
    def analyze(self, ast: Dict[str, Any], mode: str = "worst", api_key: Optional[str] = None, avg_model: Optional[Dict[str, Any]] = None, preferred_method: Optional[str] = None) -> Dict[str, Any]:
        """
        Analiza un AST recursivo y retorna el resultado con recurrencia y Teorema Maestro.
        
        Args:
            ast: AST del algoritmo a analizar
            mode: Modo de análisis ("worst", "best", "avg")
            api_key: API Key (ignorado, mantenido por compatibilidad)
            avg_model: Modelo promedio (ignorado por ahora, recursivos normalmente tienen mismo costo)
            preferred_method: Método preferido ("characteristic_equation", "iteration", "recursion_tree", "master")
            
        Returns:
            Resultado del análisis con recurrence, master, proof, etc.
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        # Limpiar estado previo
        self.clear()
        self.mode = mode
        self.ast = ast  # Guardar AST completo
        
        # 1. Encontrar el procedimiento principal
        proc_def = self._find_main_procedure(ast)
        if not proc_def:
            return {
                "ok": False,
                "errors": [{"message": "No se encontró un procedimiento principal", "line": None, "column": None}]
            }
        
        self.proc_def = proc_def  # Guardar para uso posterior
        self.procedure_name = proc_def.get("name")
        
        # 2. Validar condiciones iniciales (divide-and-conquer canónico)
        validation_result = self._validate_conditions(proc_def)
        if not validation_result["valid"]:
            return {
                "ok": False,
                "errors": [{"message": f"No aplicable: {validation_result['reason']}", "line": None, "column": None}]
            }
        
        # 3. Extraer recurrencia (puede usar preferred_method si se proporciona)
        extraction_result = self._extract_recurrence(proc_def, preferred_method=preferred_method)
        if not extraction_result["success"]:
            return {
                "ok": False,
                "errors": [{"message": f"Error extrayendo recurrencia: {extraction_result['reason']}", "line": None, "column": None}]
            }
        
        self.recurrence = extraction_result["recurrence"]
        
        # Si no es aplicable ningún método, retornar error
        if not self.recurrence.get("applicable", False):
            return {
                "ok": False,
                "errors": [{"message": f"No aplicable: {self.recurrence.get('notes', ['Razón desconocida'])[0]}", "line": None, "column": None}]
            }
        
        # 4. Aplicar método apropiado
        # Si se proporcionó preferred_method, usarlo directamente
        if preferred_method:
            method = preferred_method
            # Validar que el método preferido es aplicable
            if method not in ["characteristic_equation", "iteration", "recursion_tree", "master"]:
                return {
                    "ok": False,
                    "errors": [{"message": f"Método preferido inválido: {preferred_method}", "line": None, "column": None}]
                }
        else:
            # Usar la prioridad automática (PRIORIDAD: Ecuación Característica > Iteración > Árbol > Maestro)
            method = self.recurrence.get("method", "master")
        
        if method == "characteristic_equation":
            # Aplicar Método de Ecuación Característica (PRIORIDAD ALTA)
            char_eq_result = self._apply_characteristic_equation_method()
            if not char_eq_result["success"]:
                return {
                    "ok": False,
                    "errors": [{"message": f"Error aplicando Método de Ecuación Característica: {char_eq_result['reason']}", "line": None, "column": None}]
                }
            
            self.characteristic_equation = char_eq_result["characteristic_equation"]
        elif method == "iteration":
            # Aplicar Método de Iteración
            iteration_result = self._apply_iteration_method()
            if not iteration_result["success"]:
                return {
                    "ok": False,
                    "errors": [{"message": f"Error aplicando Método de Iteración: {iteration_result['reason']}", "line": None, "column": None}]
                }
            
            self.iteration = iteration_result["iteration"]
        elif method == "recursion_tree":
            # Aplicar Método de Árbol de Recursión
            tree_result = self._apply_recursion_tree_method()
            if not tree_result["success"]:
                return {
                    "ok": False,
                    "errors": [{"message": f"Error aplicando Método de Árbol de Recursión: {tree_result['reason']}", "line": None, "column": None}]
                }
            
            self.recursion_tree = tree_result["recursion_tree"]
        else:
            # Aplicar Teorema Maestro
            master_result = self._apply_master_theorem()
            if not master_result["success"]:
                return {
                    "ok": False,
                    "errors": [{"message": f"Error aplicando Teorema Maestro: {master_result['reason']}", "line": None, "column": None}]
                }
            
            self.master = master_result["master"]
        
        # 5. Generar resultado
        return self.result()
    
    def detect_applicable_methods(self, ast: Dict[str, Any]) -> Dict[str, Any]:
        """
        Detecta qué métodos de análisis son aplicables para un algoritmo recursivo
        sin ejecutar el análisis completo.
        
        Args:
            ast: AST del algoritmo a analizar
            
        Returns:
            {
                "ok": bool,
                "applicable_methods": List[str],
                "default_method": str,
                "recurrence_info": dict
            }
        """
        try:
            # Limpiar estado previo
            self.clear()
            self.mode = "worst"  # Usar worst para detección
            self.ast = ast
            
            # 1. Encontrar el procedimiento principal
            proc_def = self._find_main_procedure(ast)
            if not proc_def:
                return {
                    "ok": False,
                    "errors": [{"message": "No se encontró un procedimiento principal", "line": None, "column": None}]
                }
            
            self.proc_def = proc_def
            self.procedure_name = proc_def.get("name")
            
            # 2. Validar condiciones iniciales
            validation_result = self._validate_conditions(proc_def)
            if not validation_result["valid"]:
                return {
                    "ok": False,
                    "errors": [{"message": f"No aplicable: {validation_result['reason']}", "line": None, "column": None}]
                }
            
            # 3. Extraer recurrencia sin método preferido (para detectar todos los métodos)
            extraction_result = self._extract_recurrence(proc_def, preferred_method=None)
            if not extraction_result["success"]:
                return {
                    "ok": False,
                    "errors": [{"message": f"Error extrayendo recurrencia: {extraction_result['reason']}", "line": None, "column": None}]
                }
            
            recurrence = extraction_result["recurrence"]
            
            if not recurrence.get("applicable", False):
                return {
                    "ok": False,
                    "errors": [{"message": f"No aplicable: {recurrence.get('notes', ['Razón desconocida'])[0]}", "line": None, "column": None}]
                }
            
            # 4. Detectar todos los métodos aplicables
            # Obtener información necesaria para la detección
            recursive_calls = self._find_recursive_calls(proc_def)
            a = self._calculate_recursive_calls_count(proc_def, recursive_calls)
            
            # Calcular b (necesario para detect_recursion_tree_method)
            subproblem_sizes = []
            for call in recursive_calls:
                subproblem_info = self._analyze_subproblem_type(call, proc_def)
                if subproblem_info and subproblem_info["type"] not in ["subtraction"]:
                    size_info = self._analyze_subproblem_size(call, proc_def)
                    if size_info:
                        subproblem_sizes.append(size_info)
            
            b = 2  # Valor por defecto
            if subproblem_sizes:
                b_values = [s["b"] for s in subproblem_sizes if s.get("b")]
                if b_values and len(set(b_values)) == 1:
                    b = b_values[0]
            
            # Detectar cada método INDEPENDIENTEMENTE (sin prioridad)
            applicable_methods = []
            
            # Ecuación Característica
            use_characteristic = self._detect_characteristic_equation_method(proc_def, recursive_calls)
            if use_characteristic:
                applicable_methods.append("characteristic_equation")
            
            # Método de Iteración (verificar independientemente, aunque típicamente se excluyen)
            use_iteration = self._detect_iteration_method(proc_def, recursive_calls)
            if use_iteration:
                applicable_methods.append("iteration")
            
            # Árbol de Recursión
            use_recursion_tree = self._detect_recursion_tree_method(proc_def, recursive_calls, a, b)
            if use_recursion_tree:
                applicable_methods.append("recursion_tree")
            
            # Teorema Maestro siempre está disponible (fallback)
            applicable_methods.append("master")
            
            # Determinar método por defecto (prioridad)
            default_method = recurrence.get("method", "master")
            
            # Preparar información básica de la recurrencia
            recurrence_info = {
                "type": recurrence.get("type"),
                "form": recurrence.get("form"),
                "applicable": recurrence.get("applicable")
            }
            
            if recurrence.get("type") == "divide_conquer":
                recurrence_info.update({
                    "a": recurrence.get("a"),
                    "b": recurrence.get("b"),
                    "f": recurrence.get("f")
                })
            elif recurrence.get("type") == "linear_shift":
                recurrence_info.update({
                    "order": recurrence.get("order"),
                    "shifts": recurrence.get("shifts"),
                    "g(n)": recurrence.get("g(n)")
                })
            
            return {
                "ok": True,
                "applicable_methods": applicable_methods,
                "default_method": default_method,
                "recurrence_info": recurrence_info
            }
            
        except Exception as e:
            return {
                "ok": False,
                "errors": [
                    {
                        "message": f"Error detectando métodos: {str(e)}",
                        "line": None,
                        "column": None
                    }
                ]
            }
    
    def _has_object_field_access_in_recursive_calls(self, recursive_calls: List[Dict[str, Any]]) -> bool:
        """
        Detecta si las llamadas recursivas usan accesos a campos de objetos
        (ej: raiz.izquierda, raiz.derecha) - típico de BST o árboles binarios.
        
        Args:
            recursive_calls: Lista de llamadas recursivas
            
        Returns:
            True si alguna llamada recursiva usa accesos a campos de objetos
        """
        for call in recursive_calls:
            args = call.get("args", [])
            for arg in args:
                if self._has_field_access(arg):
                    return True
        return False
    
    def _has_field_access(self, node: Any) -> bool:
        """
        Verifica si un nodo contiene accesos a campos (field access).
        
        Args:
            node: Nodo del AST
            
        Returns:
            True si el nodo contiene accesos a campos
        """
        if not isinstance(node, dict):
            return False
        
        node_type = node.get("type", "").lower()
        
        # Verificar si es un acceso a campo directo
        if node_type == "field":
            return True
        
        # Buscar recursivamente en hijos
        for key, value in node.items():
            if key in ["type", "pos"]:
                continue
            if isinstance(value, list):
                for item in value:
                    if self._has_field_access(item):
                        return True
            elif isinstance(value, dict):
                if self._has_field_access(value):
                    return True
        
        return False
    
    def _find_main_procedure(self, ast: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Encuentra el procedimiento principal en el AST.
        
        Args:
            ast: AST del programa
            
        Returns:
            Nodo ProcDef del procedimiento principal o None
        """
        if not isinstance(ast, dict):
            return None
        
        body = ast.get("body", [])
        for item in body:
            if isinstance(item, dict) and item.get("type") == "ProcDef":
                return item
        
        return None
    
    def _find_procedure_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """
        Encuentra un procedimiento por su nombre en el AST.
        
        Args:
            name: Nombre del procedimiento a buscar
            
        Returns:
            Nodo ProcDef del procedimiento o None
        """
        if not self.ast or not isinstance(self.ast, dict):
            return None
        
        body = self.ast.get("body", [])
        for item in body:
            if isinstance(item, dict) and item.get("type") == "ProcDef":
                proc_name = item.get("name", "")
                if proc_name and proc_name.lower() == name.lower():
                    return item
        
        return None
    
    def _validate_conditions(self, proc_def: Dict[str, Any]) -> Dict[str, Any]:
        """
        Valida que el algoritmo cumple condiciones para Teorema Maestro.
        
        Args:
            proc_def: Nodo ProcDef del procedimiento
            
        Returns:
            {"valid": bool, "reason": str}
        """
        # Por ahora, validación básica: debe tener llamadas recursivas
        # La validación completa se hace durante la extracción
        has_recursive_calls = self._has_recursive_calls(proc_def)
        
        if not has_recursive_calls:
            return {
                "valid": False,
                "reason": "No se detectaron llamadas recursivas"
            }
        
        return {"valid": True, "reason": ""}
    
    def _has_recursive_calls(self, proc_def: Dict[str, Any]) -> bool:
        """
        Verifica si el procedimiento tiene llamadas recursivas.
        
        Args:
            proc_def: Nodo ProcDef
            
        Returns:
            True si tiene llamadas recursivas
        """
        proc_name = proc_def.get("name", "")
        if not proc_name:
            return False
        
        body = proc_def.get("body", {})
        return self._search_recursive_calls(body, proc_name)
    
    def _search_recursive_calls(self, node: Any, proc_name: str) -> bool:
        """
        Busca recursivamente llamadas a proc_name en el árbol.
        
        Args:
            node: Nodo del AST
            proc_name: Nombre del procedimiento
            
        Returns:
            True si encuentra una llamada recursiva
        """
        if not isinstance(node, dict):
            return False
        
        node_type = node.get("type", "")
        
        # Verificar si es una llamada al mismo procedimiento
        if node_type == "Call":
            call_name = node.get("name") or node.get("callee", "")
            if call_name and call_name.lower() == proc_name.lower():
                return True
        
        # Buscar recursivamente en hijos
        for key, value in node.items():
            if key in ["type", "pos", "name", "callee"]:
                continue
            if isinstance(value, list):
                for item in value:
                    if self._search_recursive_calls(item, proc_name):
                        return True
            elif isinstance(value, dict):
                if self._search_recursive_calls(value, proc_name):
                    return True
        
        return False
    
    def _extract_recurrence(self, proc_def: Dict[str, Any], preferred_method: Optional[str] = None) -> Dict[str, Any]:
        """
        Extrae la recurrencia T(n) = a·T(n/b) + f(n) del procedimiento.
        
        Args:
            proc_def: Nodo ProcDef del procedimiento
            preferred_method: Método preferido (opcional)
            
        Returns:
            {"success": bool, "recurrence": dict, "reason": str}
        """
        self.proof_steps.append({"id": "extract", "text": "\\text{Iniciando extracción de recurrencia}"})
        
        # 1. Encontrar todas las llamadas recursivas
        recursive_calls = self._find_recursive_calls(proc_def)
        
        if not recursive_calls:
            return {
                "success": False,
                "reason": "No se encontraron llamadas recursivas"
            }
        
        self.proof_steps.append({"id": "extract", "text": f"\\text{{Encontradas }} {len(recursive_calls)} \\text{{ llamadas recursivas}}"})
        
        # 2. Analizar tamaños de subproblemas
        # Primero intentar con decrease-and-conquer (para método de iteración)
        subproblem_sizes = []
        for call in recursive_calls:
            # Intentar primero detectar decrease-and-conquer (n-1, n-k)
            subproblem_info = self._analyze_subproblem_type(call, proc_def)
            if subproblem_info and subproblem_info["type"] in ["subtraction", "division"]:
                # Para decrease-and-conquer, crear estructura compatible
                factor = subproblem_info.get("factor", 1)
                pattern = subproblem_info.get("pattern", "n-1")
                # Para decrease-and-conquer, no usamos "b" tradicional
                # En su lugar, almacenamos la información en el subproblem_size
                subproblem_sizes.append({
                    "type": subproblem_info["type"],
                    "pattern": pattern,
                    "factor": factor
                })
            else:
                # Si no es decrease-and-conquer, intentar divide-and-conquer
                size_info = self._analyze_subproblem_size(call, proc_def)
                if size_info:
                    subproblem_sizes.append(size_info)
        
        # Si no se pudieron determinar tamaños, verificar si es un caso con objetos (BST, árboles, etc.)
        if not subproblem_sizes:
            # Verificar si las llamadas recursivas usan accesos a campos de objetos
            # (ej: raiz.izquierda, raiz.derecha) - típico de BST o árboles binarios
            has_object_field_access = self._has_object_field_access_in_recursive_calls(recursive_calls)
            
            if has_object_field_access:
                # Heurística: Para llamadas recursivas con objetos (BST, árboles),
                # asumir divide-and-conquer binario: T(n) = T(n/2) + O(1)
                # Solo se ejecuta una rama por llamada (a=1), y cada subproblema es ~n/2 (b=2)
                subproblem_sizes = [{"b": 2, "offset": 0, "type": "division", "heuristic": "object_field_access"}]
            else:
                return {
                    "success": False,
                    "reason": "No se pudieron determinar los tamaños de los subproblemas"
                }
        
        # 3. Verificar que todos los subproblemas tienen el mismo tamaño relativo
        # Distinguir entre decrease-and-conquer y divide-and-conquer
        has_subtraction = any(s.get("type") == "subtraction" for s in subproblem_sizes)
        
        if has_subtraction:
            # Para decrease-and-conquer, verificar patrones
            patterns = [s.get("pattern") for s in subproblem_sizes if s.get("type") == "subtraction"]
            
            # Permitir múltiples llamadas recursivas con substracciones (ej: Fibonacci T(n) = T(n-1) + T(n-2))
            # Solo rechazar si hay mezcla de tipos (substracción y división)
            has_mixed_types = any(s.get("type") != "subtraction" for s in subproblem_sizes)
            
            if has_mixed_types:
                return {
                    "success": False,
                    "recurrence": {
                        "applicable": False,
                        "notes": ["Mezcla de tipos de subproblemas (substracción y división)"]
                    },
                    "reason": "Subproblemas de tipos distintos"
                }
            
            # Si hay múltiples patrones de substracción, aún se puede resolver con iteración
            # (aunque sea más complejo, como en Fibonacci)
            if not patterns:
                return {
                    "success": False,
                    "recurrence": {
                        "applicable": False,
                        "notes": ["No se pudieron identificar patrones de subproblemas"]
                    },
                    "reason": "Patrones de subproblemas no identificados"
                }
            
            # Usar un b ficticio para decrease-and-conquer (se usará solo si aplica Teorema Maestro)
            # Para método de iteración, se detectará más adelante
            b = 2  # Valor por defecto, no se usará para decrease-and-conquer
        else:
            # Para divide-and-conquer, verificar que todos tienen el mismo b
            b_values = [s["b"] for s in subproblem_sizes if s.get("b")]
            if not b_values or len(set(b_values)) > 1:
                return {
                    "success": False,
                    "recurrence": {
                        "applicable": False,
                        "notes": ["Subproblemas de tamaños distintos o no proporcionales"]
                    },
                    "reason": "Subproblemas de tamaños distintos"
                }
            b = b_values[0]
        
        # 3.5. Determinar el valor de 'a' considerando ramas mutuamente excluyentes
        # Si las llamadas recursivas están en un IF-ELSE, solo se ejecuta una rama
        a = self._calculate_recursive_calls_count(proc_def, recursive_calls)
        
        # 4. Calcular f(n) (trabajo no recursivo)
        f_n = self._calculate_non_recursive_work(proc_def, recursive_calls)
        
        # 5. Detectar caso base n0
        n0 = self._detect_base_case(proc_def)
        
        # 6. Detectar método apropiado
        # Si se proporciona preferred_method, usarlo directamente y detectar los demás para validación
        if preferred_method:
            # Detectar todos los métodos aplicables para validar que preferred_method es aplicable
            use_characteristic = self._detect_characteristic_equation_method(proc_def, recursive_calls)
            use_iteration = self._detect_iteration_method(proc_def, recursive_calls) if not use_characteristic else False
            use_recursion_tree = self._detect_recursion_tree_method(proc_def, recursive_calls, a, b) if not use_iteration else False
            
            # Forzar el método preferido
            if preferred_method == "characteristic_equation":
                use_characteristic = True
                use_iteration = False
                use_recursion_tree = False
            elif preferred_method == "iteration":
                use_characteristic = False
                use_iteration = True
                use_recursion_tree = False
            elif preferred_method == "recursion_tree":
                use_characteristic = False
                use_iteration = False
                use_recursion_tree = True
            elif preferred_method == "master":
                use_characteristic = False
                use_iteration = False
                use_recursion_tree = False
        else:
            # Detectar método apropiado (PRIORIDAD: Ecuación Característica > Iteración > Árbol > Maestro)
            use_characteristic = self._detect_characteristic_equation_method(proc_def, recursive_calls)
            use_iteration = False
            use_recursion_tree = False
            
            if not use_characteristic:
                # Solo considerar Iteración si NO aplica Ecuación Característica
                use_iteration = self._detect_iteration_method(proc_def, recursive_calls)
            
            if not use_iteration:
                # Solo considerar Árbol de Recursión si no aplica Ecuación Característica ni Iteración
                use_recursion_tree = self._detect_recursion_tree_method(proc_def, recursive_calls, a, b)
        
        # 7. Construir recurrencia con método apropiado
        # Simplificar b para mostrar
        b_str = self._simplify_number_latex(b)
        
        # Para ecuación característica e iteración, usar desplazamientos constantes (n-1, n-2, etc.)
        if use_characteristic or use_iteration:
            # Para método de iteración o ecuación característica, construir la forma de la recurrencia
            # Contar todas las llamadas recursivas por tamaño (puede haber múltiples del mismo tamaño)
            from collections import Counter
            term_counts = Counter()
            for call in recursive_calls:
                subproblem_info = self._analyze_subproblem_type(call, proc_def)
                if subproblem_info and subproblem_info["type"] == "subtraction":
                    pattern = subproblem_info.get("pattern", "n-1")
                    term_counts[pattern] += 1
            
            if len(term_counts) > 1:
                # Caso especial: múltiples términos recursivos DIFERENTES (ej: Fibonacci T(n) = T(n-1) + T(n-2))
                # Construir forma completa: T(n) = T(n-1) + T(n-2) + f(n)
                terms_latex = " + ".join([f"T({term})" for term in sorted(term_counts.keys(), reverse=True)])
                recurrence_form = f"T(n) = {terms_latex} + f(n)"
            elif len(term_counts) == 1:
                # Caso normal: un solo término recursivo (puede aparecer múltiples veces)
                pattern, count = list(term_counts.items())[0]
                if count > 1:
                    # Múltiples llamadas del mismo tamaño (ej: Torres de Hanoi T(n) = 2T(n-1) + 1)
                    recurrence_form = f"T(n) = {count} \\cdot T({pattern}) + f(n)"
                else:
                    recurrence_form = f"T(n) = T({pattern}) + f(n)"
            else:
                # Fallback
                subproblem_info = self._analyze_subproblem_type(recursive_calls[0], proc_def)
                if subproblem_info:
                    pattern = subproblem_info.get("pattern", "n-1")
                    recurrence_form = f"T(n) = T({pattern}) + f(n)"
                else:
                    recurrence_form = f"T(n) = T(n-1) + f(n)"
        else:
            # Para divide-and-conquer (Teorema Maestro o Árbol de Recursión)
            recurrence_form = f"T(n) = {a} \\cdot T(n/{b_str}) + f(n)"
        
        # Determinar método a usar (PRIORIDAD: characteristic_equation > iteration > recursion_tree > master)
        if use_characteristic:
            method = "characteristic_equation"
        elif use_iteration:
            method = "iteration"
        elif use_recursion_tree:
            method = "recursion_tree"
        else:
            method = "master"
        
        # Construir recurrencia según el método
        if method == "characteristic_equation":
            # Para ecuación característica, usar estructura linear_shift (sin a/b)
            # Obtener información de desplazamientos y coeficientes
            linear_info = self._detect_linear_recurrence(proc_def, recursive_calls)
            if linear_info:
                coefficients = linear_info["coefficients"]
                max_offset = linear_info["max_offset"]
                g_n_str = linear_info["g_n"]
                
                # Construir forma correcta para ecuación característica: T(n) = T(n-1) + T(n-2) + g(n)
                # Usar g(n) en lugar de f(n), y omitir g(n) si es 0 (homogénea)
                g_n_clean = g_n_str.strip().lower() if g_n_str else ""
                is_homogeneous = (g_n_clean == "0" or 
                                 g_n_clean == "\\theta(0)" or 
                                 g_n_clean == "theta(0)" or
                                 (g_n_clean == "" and (not g_n_str or len(g_n_str.strip()) == 0)))
                
                # Construir términos recursivos
                terms_latex = []
                for offset in sorted(coefficients.keys(), reverse=True):
                    coeff = coefficients[offset]
                    if coeff == 1:
                        terms_latex.append(f"T(n-{offset})")
                    else:
                        terms_latex.append(f"{coeff} \\cdot T(n-{offset})")
                
                # Formar la ecuación de recurrencia
                if is_homogeneous:
                    recurrence_form_corrected = f"T(n) = {' + '.join(terms_latex)}"
                else:
                    recurrence_form_corrected = f"T(n) = {' + '.join(terms_latex)} + g(n)"
                
                recurrence = {
                    "type": "linear_shift",
                    "form": recurrence_form_corrected,
                    "order": max_offset,  # orden de la recurrencia (k)
                    "shifts": sorted(coefficients.keys()),  # [1, 2] para Fibonacci
                    "coefficients": [coefficients[shift] for shift in sorted(coefficients.keys())],  # [1, 1] para Fibonacci
                    "g(n)": "0" if is_homogeneous else (g_n_str if g_n_str else None),
                    "n0": n0,
                    "applicable": True,
                    "notes": [],
                    "method": method
                }
            else:
                # Fallback si no se puede obtener linear_info
                recurrence = {
                    "type": "linear_shift",
                    "form": recurrence_form,
                    "g(n)": f_n if f_n != "0" else None,
                    "n0": n0,
                    "applicable": True,
                    "notes": [],
                    "method": method
                }
        else:
            # Para otros métodos (master, iteration, recursion_tree), usar a, b, f
            recurrence = {
                "type": "divide_conquer",
            "form": recurrence_form,
            "a": a,
            "b": float(b),
            "f": f_n,
            "n0": n0,
            "applicable": True,
            "notes": [],
            "method": method
        }
        
        # Simplificar valores para mostrar en proof
        b_display = self._simplify_number_latex(b)
        method_names = {
            "characteristic_equation": "Método de Ecuación Característica",
            "iteration": "Método de Iteración",
            "recursion_tree": "Método de Árbol de Recursión",
            "master": "Teorema Maestro"
        }
        method_name = method_names.get(method, "Teorema Maestro")
        self.proof_steps.append({"id": "method", "text": f"\\text{{Método detectado: }} \\text{{{method_name}}}"})
        
        # Solo agregar "Parámetros extraídos" si NO es ecuación característica
        # Para ecuación característica, estos parámetros (a, b, f) no son relevantes
        if method != "characteristic_equation":
            self.proof_steps.append({"id": "extract", "text": f"\\text{{Parámetros extraídos: }} a={a}, b={b_display}, f(n)={f_n}, n_0={n0}"})
        
        return {
            "success": True,
            "recurrence": recurrence
        }
    
    def _find_recursive_calls(self, proc_def: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Encuentra todas las llamadas recursivas en el procedimiento.
        
        Args:
            proc_def: Nodo ProcDef
            
        Returns:
            Lista de nodos Call recursivos
        """
        proc_name = proc_def.get("name", "")
        calls = []
        body = proc_def.get("body", {})
        self._collect_recursive_calls(body, proc_name, calls)
        return calls
    
    def _collect_recursive_calls(self, node: Any, proc_name: str, calls: List[Dict[str, Any]]):
        """
        Recolecta recursivamente todas las llamadas a proc_name.
        
        Args:
            node: Nodo del AST
            proc_name: Nombre del procedimiento
            calls: Lista donde agregar las llamadas encontradas
        """
        if not isinstance(node, dict):
            return
        
        node_type = node.get("type", "")
        
        if node_type == "Call":
            call_name = node.get("name") or node.get("callee", "")
            if call_name and call_name.lower() == proc_name.lower():
                calls.append(node)
        
        # Buscar recursivamente en hijos
        for key, value in node.items():
            if key in ["type", "pos", "name", "callee"]:
                continue
            if isinstance(value, list):
                for item in value:
                    self._collect_recursive_calls(item, proc_name, calls)
            elif isinstance(value, dict):
                self._collect_recursive_calls(value, proc_name, calls)
    
    def _calculate_recursive_calls_count(self, proc_def: Dict[str, Any], recursive_calls: List[Dict[str, Any]]) -> int:
        """
        Calcula el número real de llamadas recursivas considerando ramas mutuamente excluyentes.
        
        Si las llamadas recursivas están en un IF-ELSE, solo se ejecuta una por llamada,
        entonces a = 1. Si están en diferentes caminos no mutuamente excluyentes, se suman.
        
        Args:
            proc_def: Nodo ProcDef del procedimiento
            recursive_calls: Lista de llamadas recursivas encontradas
            
        Returns:
            Número efectivo de llamadas recursivas (a)
        """
        if len(recursive_calls) <= 1:
            return len(recursive_calls)
        
        # Buscar si hay llamadas recursivas en ramas IF-ELSE mutuamente excluyentes
        body = proc_def.get("body", {})
        if_else_paths = self._find_if_else_paths(body)
        
        # Si encontramos un IF-ELSE con llamadas recursivas en ambas ramas,
        # entonces a = 1 (solo se ejecuta una rama)
        if not self.procedure_name:
            # Si no tenemos el nombre del procedimiento, usar todas las llamadas
            return len(recursive_calls)
        
        for if_node in if_else_paths:
            consequent_has_recursive = self._has_recursive_call_in_subtree(
                if_node.get("consequent"), self.procedure_name
            )
            alternate_has_recursive = self._has_recursive_call_in_subtree(
                if_node.get("alternate"), self.procedure_name
            )
            
            if consequent_has_recursive and alternate_has_recursive:
                # Las dos llamadas están en ramas mutuamente excluyentes
                # Solo se ejecuta una por llamada, así que a = 1
                return 1
        
        # Si no hay ramas mutuamente excluyentes, contar todas las llamadas
        return len(recursive_calls)
    
    def _find_if_else_paths(self, node: Any) -> List[Dict[str, Any]]:
        """
        Encuentra todos los nodos IF que tienen ramas alternate (IF-ELSE).
        
        Args:
            node: Nodo del AST donde buscar
            
        Returns:
            Lista de nodos IF con ramas alternate
        """
        if_nodes = []
        
        if not isinstance(node, dict):
            return if_nodes
        
        node_type = node.get("type", "")
        
        # Si es un IF con alternate, es un IF-ELSE
        if node_type == "If" and node.get("alternate"):
            if_nodes.append(node)
        
        # Buscar recursivamente
        for key, value in node.items():
            if key in ["type", "pos"]:
                continue
            if isinstance(value, list):
                for item in value:
                    if_nodes.extend(self._find_if_else_paths(item))
            elif isinstance(value, dict):
                if_nodes.extend(self._find_if_else_paths(value))
        
        return if_nodes
    
    def _has_recursive_call_in_subtree(self, node: Any, proc_name: str) -> bool:
        """
        Verifica si algún nodo en el subárbol es una llamada recursiva.
        
        Args:
            node: Nodo del AST donde buscar
            proc_name: Nombre del procedimiento a buscar
            
        Returns:
            True si encuentra una llamada recursiva en el subárbol
        """
        if not isinstance(node, dict):
            return False
        
        node_type = node.get("type", "")
        
        # Verificar si este nodo es una llamada recursiva
        if node_type == "Call":
            call_name = node.get("name") or node.get("callee", "")
            if call_name and call_name.lower() == proc_name.lower():
                return True
        
        # Buscar recursivamente en hijos
        for key, value in node.items():
            if key in ["type", "pos"]:
                continue
            if isinstance(value, list):
                for item in value:
                    if self._has_recursive_call_in_subtree(item, proc_name):
                        return True
            elif isinstance(value, dict):
                if self._has_recursive_call_in_subtree(value, proc_name):
                    return True
        
        return False
    
    def _analyze_subproblem_size(self, call: Dict[str, Any], proc_def: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Analiza el tamaño del subproblema en una llamada recursiva.
        
        Compara los argumentos de la llamada con los parámetros originales
        para detectar cómo se reduce el tamaño (divide-and-conquer).
        
        Args:
            call: Nodo Call recursivo
            proc_def: Nodo ProcDef del procedimiento
            
        Returns:
            {"b": float, "offset": int} o None si no se puede determinar
        """
        # Obtener parámetros del procedimiento
        params = proc_def.get("params", [])
        if not params:
            return None
        
        args = call.get("args", [])
        if len(args) < len(params):
            return None
        
        # Estrategia 1: Buscar división directa en argumentos
        # Ejemplo: mergeSort(A, izq, medio) donde medio = (izq + der) / 2
        # O: mergeSort3Vias(A, izq, tercio1) donde tercio1 = izq + tamaño / 3
        for i, arg in enumerate(args):
            b_value = self._extract_division_factor(arg)
            if b_value and b_value >= 2:  # Asegurar que b >= 2
                return {"b": b_value, "offset": 0}
        
        # Estrategia 2: Comparar argumentos con parámetros originales
        # Si el procedimiento recibe (A, izq, der) y llamamos con (A, izq, medio)
        # donde medio = (izq + der) / 2, detectar que el rango se divide por 2
        # O si llamamos con (A, izq, tercio1) donde tercio1 = izq + tamaño / 3
        b_value = self._detect_size_reduction_by_comparison(args, params, proc_def)
        if b_value and b_value >= 2:  # Asegurar que b >= 2
            return {"b": b_value, "offset": 0}
        
        # Estrategia 3: Buscar divisiones indirectas en el cuerpo
        # Para casos como mergeSort3Vias donde se calcula tercio1 = izq + tamaño / 3
        # y luego se llama con (A, izq, tercio1)
        # O para multiplicarMatrices donde se calcula mitad = n / 2
        # y luego se llama con (A11, B11, mitad)
        body = proc_def.get("body", {}) or proc_def.get("block", {})
        b_value = self._detect_indirect_division(body, args, params)
        if b_value and b_value >= 2:  # Asegurar que b >= 2
            return {"b": b_value, "offset": 0}
        
        # Estrategia 3.5: Si un argumento es un identificador simple (variable),
        # buscar directamente si esa variable se asignó con una división
        # Esto maneja casos donde el argumento es simplemente "mitad" sin estar en una expresión compleja
        for arg in args:
            if isinstance(arg, dict):
                arg_type = arg.get("type", "").lower()
                if arg_type == "identifier":
                    var_name = arg.get("name") or arg.get("id", "")
                    if var_name:
                        b_value = self._find_variable_division(body, var_name)
                        if b_value and b_value >= 2:
                            return {"b": b_value, "offset": 0}
        
        # Estrategia 4: Buscar floor/ceil de divisiones
        for arg in args:
            b_value = self._extract_floor_ceil_division(arg)
            if b_value and b_value >= 2:  # Asegurar que b >= 2
                return {"b": b_value, "offset": 0}
        
        # Estrategia 5: Detectar tamaños variables por reducción de rango
        # Para casos como QuickSort: quicksort(A, izq, pi-1) y quicksort(A, pi+1, der)
        # Los tamaños son variables pero sugerir divide-and-conquer con b=2 (mejor caso)
        # o inferir peor caso si hay patrones de decrease-and-conquer
        b_value = self._detect_variable_size_reduction(args, params, proc_def)
        if b_value and b_value >= 2:
            return {"b": b_value, "offset": 0}
        
        return None
    
    def _detect_indirect_division(self, body: Any, args: List[Any], params: List[Any]) -> Optional[float]:
        """
        Detecta divisiones indirectas donde los argumentos son variables calculadas con divisiones.
        
        Ejemplo: En mergeSort3Vias, se calcula tercio1 = izq + tamaño / 3,
        y luego se llama con (A, izq, tercio1). Necesitamos detectar el / 3.
        
        Args:
            body: Cuerpo del procedimiento donde buscar asignaciones
            args: Argumentos de la llamada recursiva
            params: Parámetros del procedimiento
            
        Returns:
            Factor b si se encuentra una división indirecta
        """
        if not args or not params:
            return None
        
        # Buscar argumentos que sean identificadores (variables)
        division_factors = []
        for arg in args:
            if isinstance(arg, dict):
                arg_type = arg.get("type", "").lower()
                if arg_type == "identifier":
                    var_name = arg.get("name", "") or arg.get("id", "")
                    if var_name:
                        # Buscar si esta variable se asignó con una división
                        b_value = self._find_variable_division(body, var_name)
                        if b_value:
                            division_factors.append(b_value)
                # También buscar divisiones dentro de expresiones binarias
                elif arg_type == "binary":
                    b_value = self._extract_division_factor(arg)
                    if b_value:
                        division_factors.append(b_value)
        
        # Si encontramos divisiones, usar la más común
        if division_factors:
            from collections import Counter
            counter = Counter(division_factors)
            most_common = counter.most_common(1)[0]
            # Si hay una división dominante (al menos 50% de las divisiones)
            if most_common[1] >= len(division_factors) * 0.5:
                return most_common[0]
            # Si todas las divisiones son iguales, usar ese valor
            if len(set(division_factors)) == 1:
                return division_factors[0]
        
        return None
    
    def _detect_size_reduction_by_comparison(self, args: List[Any], params: List[Any], proc_def: Dict[str, Any]) -> Optional[float]:
        """
        Detecta reducción de tamaño comparando argumentos con parámetros.
        
        Busca patrones como:
        - Parámetros: (A, izq, der) → tamaño = der - izq + 1 = n
        - Argumentos: (A, izq, medio) donde medio = (izq + der) / 2
        - Nuevo tamaño = medio - izq + 1 ≈ n/2
        
        Args:
            args: Argumentos de la llamada recursiva
            params: Parámetros del procedimiento
            proc_def: Nodo ProcDef
            
        Returns:
            Factor b (n/b) o None
        """
        # Estrategia 1: Buscar asignaciones que calculen divisiones
        # Ejemplo: "medio <- (izq + der) / 2"
        body = proc_def.get("body", {}) or proc_def.get("block", {})
        division_factors = []
        
        # Buscar asignaciones como "medio <- (izq + der) / 2"
        self._find_division_assignments(body, division_factors)
        
        if division_factors:
            # Si encontramos divisiones, usar la más común
            from collections import Counter
            counter = Counter(division_factors)
            most_common = counter.most_common(1)[0]
            if most_common[1] >= len(division_factors) * 0.5:  # Al menos 50% de las divisiones
                return most_common[0]
        
        # Estrategia 2: Analizar los argumentos de las llamadas recursivas
        # Si vemos que los argumentos cambian de manera que sugiere división
        # Por ejemplo: (izq, der) → (izq, medio) donde medio = (izq + der) / 2
        if len(args) >= 2 and len(params) >= 2:
            # Buscar si algún argumento es una variable que se calculó como división
            for arg in args:
                if isinstance(arg, dict):
                    arg_name = arg.get("name") or (arg.get("target", {}).get("name") if isinstance(arg.get("target"), dict) else None)
                    if arg_name:
                        # Buscar si esta variable se asignó con una división
                        b_value = self._find_variable_division(body, arg_name)
                        if b_value:
                            return b_value
        
        return None
    
    def _find_variable_division(self, node: Any, var_name: str) -> Optional[float]:
        """
        Busca si una variable se asignó con una división.
        
        Args:
            node: Nodo del AST donde buscar
            var_name: Nombre de la variable a buscar
            
        Returns:
            Factor de división o None
        """
        if not isinstance(node, dict):
            return None
        
        node_type = node.get("type", "")
        
        # Buscar asignaciones a la variable
        if node_type == "Assign":
            target = node.get("target", {})
            if isinstance(target, dict):
                target_name = target.get("name") or target.get("id", "")
                if target_name and target_name.lower() == var_name.lower():
                    # Verificar si el valor es una división
                    value = node.get("value", {})
                    if isinstance(value, dict):
                        return self._extract_division_factor(value)
        
        # Buscar recursivamente
        for key, value in node.items():
            if key in ["type", "pos", "name", "callee"]:
                continue
            if isinstance(value, list):
                for item in value:
                    result = self._find_variable_division(item, var_name)
                    if result:
                        return result
            elif isinstance(value, dict):
                result = self._find_variable_division(value, var_name)
                if result:
                    return result
        
        return None
    
    def _find_division_assignments(self, node: Any, factors: List[float]):
        """
        Busca asignaciones que calculen divisiones (como medio <- (izq + der) / 2).
        
        Args:
            node: Nodo del AST
            factors: Lista donde agregar factores encontrados
        """
        if not isinstance(node, dict):
            return
        
        node_type = node.get("type", "")
        
        if node_type == "Assign":
            # Verificar si la asignación es una división
            value = node.get("value", {})
            if isinstance(value, dict):
                b_value = self._extract_division_factor(value)
                if b_value:
                    factors.append(b_value)
        
        # Buscar recursivamente
        for key, value in node.items():
            if key in ["type", "pos", "name", "callee"]:
                continue
            if isinstance(value, list):
                for item in value:
                    self._find_division_assignments(item, factors)
            elif isinstance(value, dict):
                self._find_division_assignments(value, factors)
    
    def _extract_division_factor(self, expr: Any) -> Optional[float]:
        """
        Extrae el factor de división de una expresión (n/b -> b).
        
        Maneja casos como:
        - n / 2 → 2
        - n / 3 → 3
        - n / 4 → 4
        - (izq + der) / 2 → 2 (si izq + der representa n)
        - tamaño / 3 → 3
        - (a + b) / c → c (si a + b representa n)
        - izq + tamaño / 3 → 3 (extrae la división dentro de la suma)
        
        Args:
            expr: Expresión del AST
            
        Returns:
            Valor de b o None
        """
        if not isinstance(expr, dict):
            return None
        
        expr_type = expr.get("type", "").lower()
        
        if expr_type == "binary":
            op = expr.get("operator", "") or expr.get("op", "")
            
            # Si es una división directa: expr / constante
            if op == "/" or op == "div":
                left = expr.get("left", {}) or expr.get("lhs", {})
                right = expr.get("right", {}) or expr.get("rhs", {})
                
                # Verificar si right es un número constante
                if isinstance(right, dict):
                    right_type = right.get("type", "").lower()
                    if right_type in ["number", "literal"]:
                        try:
                            b = float(right.get("value", 0))
                            if b > 0:
                                # Verificar que left sea una expresión que represente n
                                # (puede ser un identificador, suma, etc.)
                                if self._represents_size_variable(left):
                                    return b
                        except Exception:
                            pass
                    # También verificar si right es un número directo
                    elif isinstance(right, (int, float)):
                        if right > 0:
                            if self._represents_size_variable(left):
                                return float(right)
                    # También verificar si right es una expresión constante evaluable
                    elif right_type == "binary":
                        # Intentar evaluar la expresión del divisor
                        try:
                            # Convertir a SymPy y evaluar si es constante
                            right_expr = self.expr_converter.ast_to_sympy(right)
                            # Si no tiene variables, es constante
                            if not right_expr.free_symbols:
                                b = float(right_expr.evalf())
                                if b > 0 and self._represents_size_variable(left):
                                    return b
                        except Exception:
                            pass
                # También verificar si right es un número directo (no dict)
                elif isinstance(right, (int, float)):
                    if right > 0:
                        if self._represents_size_variable(left):
                            return float(right)
            
            # Si es una suma o resta, buscar divisiones dentro de ella
            # Ejemplo: izq + tamaño / 3 → buscar / 3 dentro de la expresión
            elif op in ["+", "-"]:
                left = expr.get("left", {}) or expr.get("lhs", {})
                right = expr.get("right", {}) or expr.get("rhs", {})
                
                # Buscar división en el lado izquierdo
                if isinstance(left, dict):
                    b_value = self._extract_division_factor(left)
                    if b_value:
                        return b_value
                
                # Buscar división en el lado derecho
                if isinstance(right, dict):
                    b_value = self._extract_division_factor(right)
                    if b_value:
                        return b_value
        
        return None
    
    def _represents_size_variable(self, expr: Any) -> bool:
        """
        Verifica si una expresión representa el tamaño n del problema.
        
        Args:
            expr: Expresión del AST
            
        Returns:
            True si representa n (o una expresión que incluye n)
        """
        if not isinstance(expr, dict):
            return False
        
        expr_type = expr.get("type", "").lower()
        
        # Identificador que podría ser n o un parámetro de tamaño
        if expr_type == "identifier":
            name = expr.get("name", "").lower()
            # Parámetros comunes que representan tamaño
            if name in ["n", "size", "length", "tamaño", "tamanio", "der", "end", "high", "fin"]:
                return True
            # También podría ser izq + der que representa el rango
            return True  # Por ahora, asumir que cualquier identificador puede ser tamaño
        
        # Suma/resta que podría representar un rango (der - izq + 1, etc.)
        if expr_type == "binary":
            op = expr.get("operator", "") or expr.get("op", "")
            if op in ["+", "-"]:
                left = expr.get("left", {})
                right = expr.get("right", {})
                # Si es una suma/resta de parámetros, probablemente representa tamaño
                if (isinstance(left, dict) and left.get("type", "").lower() == "identifier") or \
                   (isinstance(right, dict) and right.get("type", "").lower() == "identifier"):
                    return True
        
        return False
    
    def _detect_variable_size_reduction(self, args: List[Any], params: List[Any], proc_def: Dict[str, Any]) -> Optional[float]:
        """
        Detecta reducción de tamaño variable para casos como QuickSort.
        
        Para QuickSort: quicksort(A, izq, pi-1) y quicksort(A, pi+1, der)
        Los tamaños son variables pero podemos inferir divide-and-conquer con b=2
        (mejor caso) basándonos en que hay dos llamadas recursivas.
        
        Args:
            args: Argumentos de la llamada recursiva
            params: Parámetros del procedimiento
            proc_def: Nodo ProcDef
            
        Returns:
            Factor b estimado (típicamente 2 para divide-and-conquer) o None
        """
        if not args or not params:
            return None
        
        # Para QuickSort y algoritmos similares, los argumentos suelen ser:
        # - Primer argumento: el mismo array/estructura
        # - Argumentos siguientes: expresiones aritméticas que reducen el rango
        
        # Verificar si los argumentos son expresiones aritméticas (resta/suma)
        # que sugieren división del rango
        has_arithmetic_expressions = False
        for i, arg in enumerate(args):
            if i == 0:
                continue  # Saltar el primer argumento (array/estructura)
            
            if isinstance(arg, dict):
                arg_type = arg.get("type", "").lower()
                if arg_type == "binary":
                    op = arg.get("op", "")
                    # Si hay expresiones con + o -, sugiere manipulación del rango
                    if op in ["+", "-"]:
                        has_arithmetic_expressions = True
                        break
        
        # Si encontramos expresiones aritméticas que modifican el rango,
        # y el procedimiento tiene múltiples llamadas recursivas,
        # inferir que es divide-and-conquer con b=2 (mejor caso común)
        if has_arithmetic_expressions:
            # Verificar si hay múltiples llamadas recursivas (divide-and-conquer)
            recursive_calls = self._find_recursive_calls(proc_def)
            if len(recursive_calls) >= 2:
                # QuickSort y algoritmos similares típicamente dividen por 2
                return 2.0
        
        return None
    
    def _extract_floor_ceil_division(self, expr: Any) -> Optional[float]:
        """
        Extrae el factor de división de floor(n/b) o ceil(n/b).
        
        Args:
            expr: Expresión del AST
            
        Returns:
            Valor de b o None
        """
        if not isinstance(expr, dict):
            return None
        
        # Por ahora, simplificado: buscar divisiones dentro de unary/function calls
        # En el futuro, se puede mejorar para detectar floor/ceil explícitos
        
        return None
    
    def _calculate_non_recursive_work(self, proc_def: Dict[str, Any], recursive_calls: List[Dict[str, Any]]) -> str:
        """
        Calcula f(n) como el trabajo no recursivo por activación.
        
        Analiza el código no recursivo para determinar su complejidad:
        - Si hay bucles que iteran sobre n → f(n) = Θ(n)
        - Si hay bucles anidados → f(n) = Θ(n²)
        - Si hay llamadas a funciones auxiliares (como merge) → f(n) = Θ(n) típicamente
        - Si solo hay operaciones constantes → f(n) = Θ(1)
        
        Args:
            proc_def: Nodo ProcDef
            recursive_calls: Lista de llamadas recursivas
            
        Returns:
            Expresión de f(n) en formato LaTeX
        """
        body = proc_def.get("body", {}) or proc_def.get("block", {})
        
        # Analizar la complejidad del trabajo no recursivo
        work_complexity = self._analyze_work_complexity(body, recursive_calls)
        
        # Si hay llamadas a funciones auxiliares (como merge), asumir O(n) típicamente
        # Esto es común en divide-and-conquer donde se combinan resultados
        # Nota: Las llamadas auxiliares simples (como moverDisco) son O(1)
        # Las llamadas complejas (como merge) se detectarían por bucles en _analyze_work_complexity
        # Por defecto, work_complexity ya es correcta después de _analyze_work_complexity
        
        return work_complexity
    
    def _has_auxiliary_function_calls(self, node: Any, recursive_calls: List[Dict[str, Any]]) -> bool:
        """
        Verifica si hay llamadas a funciones auxiliares (no recursivas).
        
        Args:
            node: Nodo del AST
            recursive_calls: Lista de llamadas recursivas para excluir
            
        Returns:
            True si hay llamadas auxiliares
        """
        if not isinstance(node, dict):
            return False
        
        node_type = node.get("type", "")
        
        # Verificar si es una llamada
        if node_type == "Call":
            call_name = node.get("name") or node.get("callee", "")
            # Si no es recursiva, es auxiliar
            if call_name and call_name.lower() != (self.procedure_name or "").lower():
                return True
        
        # Buscar recursivamente
        for key, value in node.items():
            if key in ["type", "pos", "name", "callee"]:
                continue
            if isinstance(value, list):
                for item in value:
                    if self._has_auxiliary_function_calls(item, recursive_calls):
                        return True
            elif isinstance(value, dict):
                if self._has_auxiliary_function_calls(value, recursive_calls):
                    return True
        
        return False
    
    def _analyze_work_complexity(self, node: Any, recursive_calls: List[Dict[str, Any]]) -> str:
        """
        Analiza la complejidad del trabajo no recursivo.
        
        Args:
            node: Nodo del AST
            recursive_calls: Lista de llamadas recursivas para excluir
            
        Returns:
            Expresión de complejidad en LaTeX (n, n^2, 1, 0, etc.)
        """
        if not isinstance(node, dict):
            return "1"
        
        node_type = node.get("type", "")
        
        # Manejar llamadas a funciones
        if node_type == "Call":
            call_name = node.get("name") or node.get("callee", "")
            if call_name:
                # Si es recursiva, no cuenta trabajo
                if call_name.lower() == (self.procedure_name or "").lower():
                    return "0"  # No cuenta trabajo recursivo
                # Si es una función auxiliar, buscar su definición y analizar su complejidad
                else:
                    aux_proc = self._find_procedure_by_name(call_name)
                    if aux_proc:
                        # Analizar la complejidad de la función auxiliar
                        aux_complexity = self._analyze_work_complexity(aux_proc.get("body", {}), recursive_calls)
                        return aux_complexity
                    # Si no se encuentra la definición, asumir O(1) por defecto
                    return "1"
        
        # Detectar RETURN que solo contiene operaciones básicas con llamadas recursivas
        # En ese caso, el trabajo es 0 (homogénea)
        if node_type == "Return":
            value = node.get("value", {})
            if isinstance(value, dict):
                value_type = value.get("type", "")
                # Si el return es solo una suma/resta de llamadas recursivas, trabajo = 0
                if value_type == "Binary" and value.get("op") in ["+", "-"]:
                    left = value.get("left", {})
                    right = value.get("right", {})
                    # Verificar si ambos lados son llamadas recursivas
                    left_is_recursive = (isinstance(left, dict) and 
                                       left.get("type") == "Call" and
                                       (left.get("name") or left.get("callee", "")).lower() == (self.procedure_name or "").lower())
                    right_is_recursive = (isinstance(right, dict) and 
                                        right.get("type") == "Call" and
                                        (right.get("name") or right.get("callee", "")).lower() == (self.procedure_name or "").lower())
                    if left_is_recursive and right_is_recursive:
                        # Solo suma/resta de llamadas recursivas, trabajo = 0 (homogénea)
                        return "0"
        
        max_complexity = "1"  # Por defecto, constante
        
        # Buscar bucles FOR
        if node_type == "For":
            # Analizar el rango del bucle
            start = node.get("start", {})
            end = node.get("end", {})
            
            # Si el rango depende de n (parámetros del procedimiento), es O(n)
            if self._depends_on_size_variable(start, end):
                max_complexity = "n"
            else:
                max_complexity = "1"
        
        # Buscar bucles WHILE y REPEAT
        if node_type in ["While", "Repeat"]:
            # Si hay un bucle WHILE/REPEAT, probablemente itera sobre alguna variable
            # Si la condición incluye comparaciones con parámetros (como medio, fin, n, etc.), es O(n)
            test = node.get("test", {}) or node.get("condition", {})
            if self._while_depends_on_size(test):
                max_complexity = "n"
        
        # Buscar bucles anidados
        if node_type in ["For", "While", "Repeat"]:
            # Verificar si hay bucles anidados dentro
            body = node.get("body", {})
            nested_complexity = self._check_nested_loops(body, recursive_calls)
            if nested_complexity == "n^2":
                max_complexity = "n^2"
            elif nested_complexity == "n" and max_complexity == "1":
                max_complexity = "n"
        
        # Buscar recursivamente en hijos
        for key, value in node.items():
            if key in ["type", "pos", "name", "callee"]:
                continue
            if isinstance(value, list):
                for item in value:
                    child_complexity = self._analyze_work_complexity(item, recursive_calls)
                    max_complexity = self._max_complexity(max_complexity, child_complexity)
            elif isinstance(value, dict):
                child_complexity = self._analyze_work_complexity(value, recursive_calls)
                max_complexity = self._max_complexity(max_complexity, child_complexity)
        
        return max_complexity
    
    def _depends_on_size_variable(self, start: Any, end: Any) -> bool:
        """
        Verifica si un rango de bucle depende de la variable de tamaño n.
        
        Args:
            start: Expresión de inicio
            end: Expresión de fin
            
        Returns:
            True si depende de n
        """
        # Verificar si start o end son parámetros que representan tamaño
        if isinstance(start, dict):
            start_type = start.get("type", "").lower()
            if start_type == "identifier":
                name = start.get("name", "").lower()
                if name in ["izq", "left", "start", "begin"]:
                    # Si el inicio es un parámetro, probablemente el fin también lo es
                    return True
        
        if isinstance(end, dict):
            end_type = end.get("type", "").lower()
            if end_type == "identifier":
                name = end.get("name", "").lower()
                if name in ["der", "right", "end", "n", "size", "length"]:
                    return True
        
        return False
    
    def _while_depends_on_size(self, test: Any) -> bool:
        """
        Verifica si un bucle WHILE/REPEAT depende de variables de tamaño.
        
        Args:
            test: Condición del bucle (test o condition)
            
        Returns:
            True si la condición depende de variables de tamaño (medio, fin, n, etc.)
        """
        if not isinstance(test, dict):
            return False
        
        node_type = test.get("type", "").lower()
        
        # Si es una comparación binaria (<=, <, >=, >, =, etc.)
        if node_type in ["binary", "binaryop"]:
            left = test.get("left", {})
            right = test.get("right", {})
            
            # Verificar si alguno de los lados es un parámetro de tamaño
            size_params = ["medio", "fin", "end", "n", "size", "length", "inicio", "start"]
            
            def is_size_param(node):
                if not isinstance(node, dict):
                    return False
                if node.get("type", "").lower() == "identifier":
                    name = node.get("name", "").lower()
                    return name in size_params
                return False
            
            if is_size_param(left) or is_size_param(right):
                return True
            
            # Verificar recursivamente en expresiones compuestas
            if isinstance(left, dict):
                if self._while_depends_on_size(left):
                    return True
            if isinstance(right, dict):
                if self._while_depends_on_size(right):
                    return True
        
        # Si es una operación lógica (AND, OR), verificar ambos lados
        if node_type in ["logical", "logicalop"]:
            left = test.get("left", {})
            right = test.get("right", {})
            return self._while_depends_on_size(left) or self._while_depends_on_size(right)
        
        return False
    
    def _check_nested_loops(self, node: Any, recursive_calls: List[Dict[str, Any]]) -> str:
        """
        Verifica si hay bucles anidados en el nodo.
        
        Args:
            node: Nodo del AST
            recursive_calls: Lista de llamadas recursivas
            
        Returns:
            "n^2" si hay bucles anidados, "n" si hay un bucle, "1" si no hay
        """
        if not isinstance(node, dict):
            return "1"
        
        node_type = node.get("type", "")
        has_loop = False
        
        if node_type in ["For", "While", "Repeat"]:
            has_loop = True
            # Verificar si hay otro bucle dentro
            body = node.get("body", {})
            if self._has_loop_inside(body, recursive_calls):
                return "n^2"
        
        # Buscar recursivamente
        for key, value in node.items():
            if key in ["type", "pos", "name", "callee"]:
                continue
            if isinstance(value, list):
                for item in value:
                    nested = self._check_nested_loops(item, recursive_calls)
                    if nested == "n^2":
                        return "n^2"
                    if nested == "n":
                        has_loop = True
            elif isinstance(value, dict):
                nested = self._check_nested_loops(value, recursive_calls)
                if nested == "n^2":
                    return "n^2"
                if nested == "n":
                    has_loop = True
        
        return "n" if has_loop else "1"
    
    def _has_loop_inside(self, node: Any, recursive_calls: List[Dict[str, Any]]) -> bool:
        """
        Verifica si hay un bucle dentro del nodo.
        
        Args:
            node: Nodo del AST
            recursive_calls: Lista de llamadas recursivas
            
        Returns:
            True si hay un bucle
        """
        if not isinstance(node, dict):
            return False
        
        node_type = node.get("type", "")
        if node_type in ["For", "While", "Repeat"]:
            return True
        
        # Buscar recursivamente
        for key, value in node.items():
            if key in ["type", "pos", "name", "callee"]:
                continue
            if isinstance(value, list):
                for item in value:
                    if self._has_loop_inside(item, recursive_calls):
                        return True
            elif isinstance(value, dict):
                if self._has_loop_inside(value, recursive_calls):
                    return True
        
        return False
    
    def _max_complexity(self, c1: str, c2: str) -> str:
        """
        Retorna la complejidad máxima entre dos.
        
        Orden: 1 < n < n^2 < n^3 < ...
        
        Args:
            c1: Primera complejidad
            c2: Segunda complejidad
            
        Returns:
            La complejidad máxima
        """
        if c1 == "0" or c2 == "0":
            return c1 if c1 != "0" else c2
        
        # Extraer exponentes
        def get_exponent(c: str) -> int:
            if c == "1":
                return 0
            if c == "n":
                return 1
            if "^" in c:
                try:
                    exp_str = c.split("^")[1]
                    return int(exp_str)
                except Exception:
                    return 1
            return 1
        
        exp1 = get_exponent(c1)
        exp2 = get_exponent(c2)
        
        if exp1 >= exp2:
            return c1
        else:
            return c2
    
    def _count_non_recursive_statements(self, node: Any, recursive_calls: List[Dict[str, Any]]) -> int:
        """
        Cuenta statements no recursivos.
        
        Args:
            node: Nodo del AST
            recursive_calls: Lista de llamadas recursivas para excluir
            
        Returns:
            Número de statements no recursivos
        """
        count = 0
        
        if not isinstance(node, dict):
            return count
        
        node_type = node.get("type", "")
        
        # Excluir llamadas recursivas
        if node_type == "Call":
            call_name = node.get("name") or node.get("callee", "")
            if call_name and call_name.lower() == (self.procedure_name or "").lower():
                return 0
        
        # Contar otros tipos de statements
        if node_type in ["Assign", "If", "For", "While", "Repeat", "Return"]:
            count += 1
        
        # Buscar recursivamente en hijos
        for key, value in node.items():
            if key in ["type", "pos", "name", "callee"]:
                continue
            if isinstance(value, list):
                for item in value:
                    count += self._count_non_recursive_statements(item, recursive_calls)
            elif isinstance(value, dict):
                count += self._count_non_recursive_statements(value, recursive_calls)
        
        return count
    
    def _detect_base_case(self, proc_def: Dict[str, Any]) -> int:
        """
        Detecta el caso base n0 de la recurrencia.
        
        Args:
            proc_def: Nodo ProcDef
            
        Returns:
            Valor de n0 (por defecto 1)
        """
        # Buscar guardas como "if n <= 1" o "if n == 0"
        body = proc_def.get("body", {})
        n0 = self._find_base_case_guard(body)
        return n0 if n0 is not None else 1
    
    def _detect_base_cases(self, proc_def: Dict[str, Any]) -> Dict[str, int]:
        """
        Detecta todos los casos base de la recurrencia desde el AST.
        
        Extrae casos base como T(0) = 0, T(1) = 1 para Fibonacci.
        
        Args:
            proc_def: Nodo ProcDef
            
        Returns:
            Diccionario con casos base: {"T(0)": 0, "T(1)": 1, ...}
        """
        base_cases = {}
        body = proc_def.get("body", {}) or proc_def.get("block", {})
        
        # Buscar IF statements que sean casos base
        def find_base_case_returns(node: Any) -> None:
            """Busca recursivamente RETURN statements en casos base (IF sin recursión)."""
            if not isinstance(node, dict):
                return
            
            node_type = node.get("type", "")
            
            # Si encontramos un IF, verificar si es caso base
            if node_type == "If":
                condition = node.get("test", {}) or node.get("condition", {})
                consequent = node.get("consequent", {})
                
                # Extraer valor de n de la condición (ej: "n <= 1" → 1)
                n_value = self._extract_base_case_from_condition(condition)
                
                # Buscar RETURN en el consequent (rama del caso base)
                if n_value is not None:
                    return_value = self._extract_return_value(consequent)
                    # Si el return es el parámetro mismo (ej: RETURN n), usar n_value como valor
                    if return_value is None:
                        # Verificar si el return es el parámetro (ej: RETURN n cuando n <= 1)
                        return_expr = self._find_return_expression(consequent)
                        param_name = self._get_procedure_param_name()
                        if return_expr:
                            return_expr_type = return_expr.get("type", "")
                            # El AST puede usar "Identifier" (mayúscula) o "identifier" (minúscula)
                            if return_expr_type.lower() == "identifier":
                                return_id_name = return_expr.get("name", "")
                                # Si el return es el parámetro mismo (ej: RETURN n)
                                if param_name and return_id_name.lower() == param_name.lower():
                                    # RETURN n significa T(n) = n cuando n <= n_value
                                    # Para Fibonacci con n <= 1: T(0) = 0, T(1) = 1
                                    for i in range(n_value + 1):
                                        base_cases[f"T({i})"] = i
                                    return_value = n_value  # Marcar como procesado
                    
                    if return_value is not None:
                        # Agregar caso base T(n_value) = return_value
                        if f"T({n_value})" not in base_cases:  # Evitar duplicados
                            base_cases[f"T({n_value})"] = return_value
                
                # También buscar en alternate si existe (para ELSE)
                alternate = node.get("alternate", {})
                if alternate:
                    find_base_case_returns(alternate)
            
            # Buscar recursivamente en hijos
            for key, value in node.items():
                if key in ["type", "pos"]:
                    continue
                if isinstance(value, list):
                    for item in value:
                        find_base_case_returns(item)
                elif isinstance(value, dict):
                    find_base_case_returns(value)
        
        find_base_case_returns(body)
        
        # Si no se detectaron casos base, intentar método alternativo más directo
        if not base_cases:
            # Buscar directamente en el body del procedimiento
            # Para Fibonacci: IF n <= 1 THEN BEGIN RETURN n END
            # El body es un Block que contiene un If
            if isinstance(body, dict):
                if body.get("type") == "Block":
                    statements = body.get("body", [])
                    for stmt in statements:
                        if isinstance(stmt, dict) and stmt.get("type") == "If":
                            condition = stmt.get("test", {}) or stmt.get("condition", {})
                            consequent = stmt.get("consequent", {})
                            n_value = self._extract_base_case_from_condition(condition)
                            if n_value is not None:
                                # Buscar RETURN en el consequent (puede estar dentro de un Block)
                                return_expr = self._find_return_expression(consequent)
                                param_name = self._get_procedure_param_name()
                                if return_expr:
                                    return_expr_type = return_expr.get("type", "")
                                    # El AST puede usar "Identifier" (mayúscula) o "identifier" (minúscula)
                                    if return_expr_type.lower() == "identifier":
                                        return_id_name = return_expr.get("name", "")
                                        if param_name and return_id_name.lower() == param_name.lower():
                                            # RETURN n significa T(n) = n cuando n <= n_value
                                            # Para Fibonacci con n <= 1: T(0) = 0, T(1) = 1
                                            for i in range(n_value + 1):
                                                base_cases[f"T({i})"] = i
                                            break
                else:
                    # Si el body no es un Block, buscar directamente
                    if body.get("type") == "If":
                        condition = body.get("test", {}) or body.get("condition", {})
                        consequent = body.get("consequent", {})
                        n_value = self._extract_base_case_from_condition(condition)
                        if n_value is not None:
                            return_expr = self._find_return_expression(consequent)
                            param_name = self._get_procedure_param_name()
                            if return_expr and return_expr.get("type") == "Identifier":
                                return_id_name = return_expr.get("name", "")
                                if param_name and return_id_name.lower() == param_name.lower():
                                    for i in range(n_value + 1):
                                        base_cases[f"T({i})"] = i
        
        return base_cases
    
    def _find_return_expression(self, node: Any) -> Optional[Any]:
        """
        Encuentra la expresión de un RETURN statement.
        
        Args:
            node: Nodo del AST
            
        Returns:
            Expresión del return o None
        """
        if not isinstance(node, dict):
            return None
        
        node_type = node.get("type", "")
        
        if node_type == "Return":
            return node.get("value", {})
        
        # Si es un Block, buscar RETURN en su body
        if node_type == "Block":
            body = node.get("body", [])
            for stmt in body:
                if isinstance(stmt, dict) and stmt.get("type") == "Return":
                    return stmt.get("value", {})
        
        # Buscar recursivamente
        for key, value in node.items():
            if key in ["type", "pos"]:
                continue
            if isinstance(value, list):
                for item in value:
                    result = self._find_return_expression(item)
                    if result is not None:
                        return result
            elif isinstance(value, dict):
                result = self._find_return_expression(value)
                if result is not None:
                    return result
        
        return None
    
    def _extract_return_value(self, node: Any) -> Optional[int]:
        """
        Extrae el valor de un RETURN statement.
        
        Args:
            node: Nodo del AST (puede ser Block, Return, etc.)
            
        Returns:
            Valor del return (int) o None
        """
        if not isinstance(node, dict):
            return None
        
        node_type = node.get("type", "")
        
        # Si es un RETURN directo
        if node_type == "Return":
            value = node.get("value", {})
            return self._extract_literal_value(value)
        
        # Si es un Block, buscar RETURN en su body
        if node_type == "Block":
            body = node.get("body", [])
            for stmt in body:
                if isinstance(stmt, dict) and stmt.get("type") == "Return":
                    value = stmt.get("value", {})
                    return self._extract_literal_value(value)
        
        # Buscar recursivamente
        for key, value in node.items():
            if key in ["type", "pos"]:
                continue
            if isinstance(value, list):
                for item in value:
                    result = self._extract_return_value(item)
                    if result is not None:
                        return result
            elif isinstance(value, dict):
                result = self._extract_return_value(value)
                if result is not None:
                    return result
        
        return None
    
    def _extract_literal_value(self, expr: Any) -> Optional[int]:
        """
        Extrae un valor literal de una expresión.
        
        Args:
            expr: Expresión del AST
            
        Returns:
            Valor int o None
        """
        if not isinstance(expr, dict):
            # Si es directamente un número
            if isinstance(expr, (int, float)):
                return int(expr)
            return None
        
        expr_type = expr.get("type", "")
        
        # Literal o número
        if expr_type in ["Literal", "Number"]:
            value = expr.get("value")
            if isinstance(value, (int, float)):
                return int(value)
        
        # Identifier (ej: RETURN n cuando n es el parámetro del caso base)
        if expr_type == "Identifier":
            # Si es el mismo nombre del parámetro, no podemos determinar el valor
            # Pero para casos como RETURN n cuando n = 0 o n = 1, sería útil
            # Por ahora, retornamos None y dejamos que el análisis del IF nos dé el valor
            pass
        
        return None
    
    def _get_procedure_param_name(self) -> Optional[str]:
        """
        Obtiene el nombre del parámetro del procedimiento.
        
        Returns:
            Nombre del parámetro o None
        """
        if not self.proc_def:
            return None
        
        params = self.proc_def.get("params", [])
        if params and len(params) > 0:
            # El primer parámetro es típicamente 'n'
            param = params[0]
            if isinstance(param, dict):
                return param.get("name")
            elif isinstance(param, str):
                return param
        
        return None
    
    def _find_base_case_guard(self, node: Any) -> Optional[int]:
        """
        Busca guardas de caso base en el árbol.
        
        Args:
            node: Nodo del AST
            
        Returns:
            Valor de n0 o None
        """
        if not isinstance(node, dict):
            return None
        
        node_type = node.get("type", "")
        
        if node_type == "If":
            condition = node.get("condition", {})
            n0 = self._extract_base_case_from_condition(condition)
            if n0 is not None:
                return n0
        
        # Buscar recursivamente
        for key, value in node.items():
            if key in ["type", "pos"]:
                continue
            if isinstance(value, list):
                for item in value:
                    result = self._find_base_case_guard(item)
                    if result is not None:
                        return result
            elif isinstance(value, dict):
                result = self._find_base_case_guard(value)
                if result is not None:
                    return result
        
        return None
    
    def _extract_base_case_from_condition(self, condition: Any) -> Optional[int]:
        """
        Extrae n0 de una condición como "n <= 1" o "n == 0".
        
        Args:
            condition: Expresión de condición
            
        Returns:
            Valor de n0 o None
        """
        if not isinstance(condition, dict):
            return None
        
        expr_type = condition.get("type", "")
        expr_type_lower = expr_type.lower() if expr_type else ""
        
        # El AST puede usar "Binary" (mayúscula) o "binary" (minúscula)
        if expr_type_lower == "binary":
            # El operador puede estar en "op" o "operator"
            op = condition.get("op", "") or condition.get("operator", "")
            right = condition.get("right", {})
            
            # Verificar si es una comparación con constante
            if op in ["<=", "<", "==", "==="]:
                # Verificar si right es un número
                if isinstance(right, dict):
                    right_type = right.get("type", "")
                    right_type_lower = right_type.lower() if right_type else ""
                    if right_type_lower in ["number", "literal"]:
                        try:
                            n0 = int(float(right.get("value", 0)))
                            return max(1, n0)  # Mínimo 1
                        except Exception:
                            pass
        
        return None
    
    def _apply_master_theorem(self) -> Dict[str, Any]:
        """
        Aplica el Teorema Maestro a la recurrencia extraída.
        
        Returns:
            {"success": bool, "master": dict, "reason": str}
        """
        if not self.recurrence:
            return {
                "success": False,
                "reason": "No hay recurrencia extraída"
            }
        
        self.proof_steps.append({"id": "critical", "text": "\\text{Calculando } g(n) = n^{\\log_b a}"})
        
        a = self.recurrence["a"]
        b = self.recurrence["b"]
        f_n_str = self.recurrence["f"]
        
        # Detectar si hay un return temprano (mejor caso O(1))
        has_early_return = self._detect_early_return()
        
        # Calcular g(n) = n^(log_b a)
        log_b_a = math.log(a, b) if b > 1 else 1
        n_sym = Symbol("n", integer=True, positive=True)
        g_n_expr = n_sym ** log_b_a
        
        log_b_a_str = self._simplify_number_latex(log_b_a)
        
        # Simplificar n^{1} → n y n^{0} → 1
        if log_b_a_str == "1":
            nlogba = "n"
        elif log_b_a_str == "0":
            nlogba = "1"
        else:
            nlogba = f"n^{{{log_b_a_str}}}"
        
        self.proof_steps.append({"id": "critical", "text": f"\\text{{g(n) = }} {nlogba}"})
        
        # Comparar f(n) con g(n)
        comparison_result = self._compare_f_with_g(f_n_str, log_b_a)
        
        case = comparison_result["case"]
        comparison = comparison_result["comparison"]
        
        comparison_text = {
            "smaller": "f(n) < g(n)",
            "equal": "f(n) = g(n)",
            "larger": "f(n) > g(n)"
        }.get(comparison, comparison)
        self.proof_steps.append({"id": "compare", "text": f"\\text{{Comparando }} f(n) \\text{{ vs }} g(n) \\rightarrow {comparison_text} \\text{{ (Caso }} {case}\\text{{)}}"})
        
        # Verificar regularidad si Caso 3
        regularity = {"checked": False, "note": ""}
        if case == 3:
            regularity_result = self._check_regularity(a, b, f_n_str)
            regularity = regularity_result
        
        # Calcular theta (worst/average case)
        theta_worst_avg = self._calculate_theta(case, g_n_expr, f_n_str, log_b_a)
        
        # Calcular mejor caso: siempre usar O (big-O) en lugar de Θ para best case
        # Si hay return temprano, es O(1), sino es O del mismo valor que worst/average
        if has_early_return:
            theta_best = "O(1)"
            self.proof_steps.append({"id": "best_case", "text": "\\text{Mejor caso: } O(1) \\text{ (return temprano detectado)}"})
        else:
            # Convertir Θ(...) a O(...) para best case
            # Reemplazar \Theta por O en la expresión LaTeX
            theta_best = theta_worst_avg.replace("\\Theta", "O")
            best_case_text = f"\\text{{Mejor caso: }} {theta_best}"
            self.proof_steps.append({"id": "best_case", "text": best_case_text})
        
        master = {
            "case": case,
            "nlogba": nlogba,
            "comparison": comparison,
            "regularity": regularity,
            "theta": theta_worst_avg,
            "theta_best": theta_best,
            "has_early_return": has_early_return
        }
        
        self.proof_steps.append({"id": "conclude", "text": f"\\text{{Caso }} {case} \\Rightarrow T(n) = {theta_worst_avg}"})
        if has_early_return:
            # theta_best ya contiene "O(1)", no necesitamos agregar otro "O"
            self.proof_steps.append({"id": "conclude_best", "text": f"\\text{{Mejor caso: }} T(n) = {theta_best}"})
        
        return {
            "success": True,
            "master": master
        }
    
    def _detect_early_return(self) -> bool:
        """
        Detecta si hay un return temprano antes de las llamadas recursivas.
        
        Un return temprano hace que el mejor caso sea O(1).
        Ejemplo: En búsqueda binaria, si el elemento está en el medio, se retorna O(1).
        
        Returns:
            True si hay un return temprano detectado
        """
        proc_def = self.proc_def  # Usar el proc_def guardado
        if not proc_def:
            return False
        
        body = proc_def.get("body", {}) or proc_def.get("block", {})
        recursive_calls = self._find_recursive_calls(proc_def)
        
        if not recursive_calls:
            return False
        
        # Si body es un Block, obtener su lista de statements
        statements_list = None
        if isinstance(body, dict) and body.get("type") == "Block":
            statements_list = body.get("body", []) or body.get("statements", [])
        elif isinstance(body, list):
            statements_list = body
        
        # Buscar returns que estén antes de cualquier llamada recursiva en el flujo de control
        # Esto buscará en todo el body, incluyendo estructuras anidadas como IFs
        return self._has_return_before_recursive_calls(body, recursive_calls)
    
    def _has_return_before_recursive_calls(self, node: Any, recursive_calls: List[Dict[str, Any]]) -> bool:
        """
        Verifica si hay un return antes de las llamadas recursivas en el flujo de control.
        
        Patrón común: IF condición THEN RETURN valor; ELSE llamadas_recursivas
        
        Args:
            node: Nodo del AST
            recursive_calls: Lista de llamadas recursivas
            
        Returns:
            True si hay un return antes de las llamadas recursivas
        """
        if not isinstance(node, dict):
            return False
        
        node_type = node.get("type", "")
        
        # Si es un Return, verificar que no contiene llamadas recursivas
        if node_type == "Return":
            return not self._contains_recursive_call(node, recursive_calls)
        
        # Si es un If, verificar patrón común: return en THEN, recursivas en ELSE
        if node_type == "If" or node_type == "Conditional":
            then_body = node.get("then", {}) or node.get("thenBody", {}) or node.get("consequent", {})
            else_body = node.get("else", {}) or node.get("elseBody", {}) or node.get("alternate", {})
            
            # Verificar si en THEN hay return sin recursivas Y en ELSE hay recursivas
            if then_body and else_body:
                # Buscar todos los returns en THEN (pueden estar dentro de Blocks)
                returns_in_then = self._find_return_statements(then_body)
                
                # Verificar si alguno de los returns en THEN NO contiene recursivas
                has_early_return_in_then = False
                if returns_in_then:
                    for ret in returns_in_then:
                        if not self._contains_recursive_call(ret, recursive_calls):
                            has_early_return_in_then = True
                            break
                
                # Verificar recursivas en ELSE (pueden estar anidadas en otros IFs o dentro de Returns)
                # IMPORTANTE: Buscar recursivamente, incluso si están dentro de otro IF anidado
                has_recursive_in_else = self._has_recursive_calls_in_node(else_body)
                
                # Patrón clásico: return temprano en THEN, recursivas en ELSE (directas o anidadas)
                if has_early_return_in_then and has_recursive_in_else:
                    return True
        
        # Si es un Block o Begin, buscar secuencialmente
        if node_type == "Block" or node_type == "Begin":
            statements = node.get("statements", []) or node.get("body", [])
            if isinstance(statements, list):
                found_early_return = False
                for stmt in statements:
                    if not isinstance(stmt, dict):
                        continue
                    
                    # Si es un Return sin recursivas, marcarlo
                    if stmt.get("type") == "Return":
                        if not self._contains_recursive_call(stmt, recursive_calls):
                            found_early_return = True
                            continue
                    
                    # Si es un IF, verificar si tiene el patrón return en THEN, recursivas en ELSE
                    if stmt.get("type") == "If" or stmt.get("type") == "Conditional":
                        # Buscar recursivamente en este IF
                        if self._has_return_before_recursive_calls(stmt, recursive_calls):
                            return True
                    
                    # Si encontramos recursivas después de un return temprano, es válido
                    if self._has_recursive_calls_in_node(stmt):
                        if found_early_return:
                            return True
                        # Si encontramos recursivas antes de return temprano, continuar buscando
                
                # Si hay return temprano pero no encontramos recursivas después en este nivel,
                # buscar recursivamente en hijos
                if found_early_return:
                    # Verificar si hay recursivas en algún lugar después
                    for stmt in statements:
                        if self._has_recursive_calls_in_node(stmt):
                            return True
                    # Si no hay recursivas visibles aquí, buscar recursivamente
                    return True  # Hay return temprano, asumir que es válido
        
        # Buscar recursivamente en otros nodos
        # Pero NO en "statements" o "body" si ya los procesamos arriba
        processed_keys = set()
        if node_type == "Block" or node_type == "Begin":
            processed_keys.add("statements")
            processed_keys.add("body")
        if node_type == "If" or node_type == "Conditional":
            processed_keys.add("then")
            processed_keys.add("thenBody")
            processed_keys.add("consequent")
            processed_keys.add("else")
            processed_keys.add("elseBody")
            processed_keys.add("alternate")
        
        for key, value in node.items():
            if key in ["type", "pos", "name", "callee"] or key in processed_keys:
                continue
            if isinstance(value, list):
                for item in value:
                    if self._has_return_before_recursive_calls(item, recursive_calls):
                        return True
            elif isinstance(value, dict):
                if self._has_return_before_recursive_calls(value, recursive_calls):
                    return True
        
        return False
    
    def _has_recursive_calls_in_node(self, node: Any) -> bool:
        """
        Verifica si un nodo o sus hijos contienen llamadas recursivas.
        
        Args:
            node: Nodo del AST
            
        Returns:
            True si contiene llamadas recursivas
        """
        if not isinstance(node, dict):
            return False
        
        node_type = node.get("type", "")
        
        if node_type == "Call":
            call_name = node.get("name") or node.get("callee", "")
            if call_name and call_name.lower() == (self.procedure_name or "").lower():
                return True
        
        # Buscar recursivamente en TODOS los campos (incluyendo "value" de Return, "args" de Call, etc.)
        for key, value in node.items():
            if key in ["type", "pos"]:
                continue
            if isinstance(value, list):
                for item in value:
                    if self._has_recursive_calls_in_node(item):
                        return True
            elif isinstance(value, dict):
                if self._has_recursive_calls_in_node(value):
                    return True
        
        return False
    
    def _contains_recursive_call(self, node: Any, recursive_calls: List[Dict[str, Any]]) -> bool:
        """
        Verifica si un nodo contiene alguna llamada recursiva.
        
        Args:
            node: Nodo del AST
            recursive_calls: Lista de llamadas recursivas
            
        Returns:
            True si contiene una llamada recursiva
        """
        if not isinstance(node, dict):
            return False
        
        node_type = node.get("type", "")
        
        if node_type == "Call":
            call_name = node.get("name") or node.get("callee", "")
            if call_name and call_name.lower() == (self.procedure_name or "").lower():
                return True
        
        # Buscar recursivamente
        for key, value in node.items():
            if key in ["type", "pos"]:
                continue
            if isinstance(value, list):
                for item in value:
                    if self._contains_recursive_call(item, recursive_calls):
                        return True
            elif isinstance(value, dict):
                if self._contains_recursive_call(value, recursive_calls):
                    return True
        
        return False
    
    def _compare_f_with_g(self, f_n_str: str, log_b_a: float) -> Dict[str, Any]:
        """
        Compara f(n) con g(n) = n^(log_b a) para determinar el caso usando SymPy.
        
        Args:
            f_n_str: Expresión de f(n) como string (ej: "n", "n^2", "1")
            log_b_a: log_b(a)
            
        Returns:
            {"case": int, "comparison": str}
        """
        try:
            n_sym = Symbol("n", integer=True, positive=True)
            
            # Convertir f(n) a SymPy
            f_n_expr = self._parse_complexity_expression(f_n_str, n_sym)
            
            # Calcular g(n) = n^(log_b a)
            g_n_expr = n_sym ** log_b_a
            
            # Comparar usando límites
            comparison_result = self._compare_with_limits(f_n_expr, g_n_expr, n_sym, log_b_a)
            
            return comparison_result
            
        except Exception:
            # Fallback a método simplificado
            return self._compare_f_with_g_simple(f_n_str, log_b_a)
    
    def _parse_complexity_expression(self, expr_str: str, n_sym: Symbol) -> Expr:
        """
        Parsea una expresión de complejidad a SymPy.
        
        Maneja: "1", "n", "n^2", "n log n", etc.
        
        Args:
            expr_str: Expresión como string
            n_sym: Símbolo de n en SymPy
            
        Returns:
            Expresión SymPy
        """
        expr_str = expr_str.strip().lower()
        
        if expr_str == "1" or expr_str == "0":
            return Integer(1)
        
        if expr_str == "n":
            return n_sym
        
        # Manejar n^k
        if "^" in expr_str:
            parts = expr_str.split("^")
            if len(parts) == 2 and parts[0].strip() == "n":
                try:
                    k = float(parts[1].strip())
                    return n_sym ** k
                except Exception:
                    pass
        
        # Manejar n log n
        if "log" in expr_str and "n" in expr_str:
            if expr_str.replace(" ", "") == "nlog(n)" or expr_str.replace(" ", "") == "n*log(n)":
                from sympy import log
                return n_sym * log(n_sym)
        
        # Intentar parsear directamente con SymPy
        try:
            from sympy import sympify, log
            # Reemplazar n con el símbolo
            expr_str_clean = expr_str.replace("n", str(n_sym))
            return sympify(expr_str_clean, locals={"log": log})
        except Exception:
            # Fallback: asumir n
            return n_sym
    
    def _compare_with_limits(self, f_n_expr: Expr, g_n_expr: Expr, n_sym: Symbol, log_b_a: float) -> Dict[str, Any]:
        """
        Compara f(n) y g(n)) usando límites cuando n → ∞.
        
        Args:
            f_n_expr: Expresión de f(n)
            g_n_expr: Expresión de g(n) = n^(log_b a)
            n_sym: Símbolo de n
            log_b_a: log_b(a)
            
        Returns:
            {"case": int, "comparison": str}
        """
        try:
            from sympy import limit, oo, simplify
            
            # Calcular límite de f(n) / g(n) cuando n → ∞
            ratio = simplify(f_n_expr / g_n_expr)
            lim = limit(ratio, n_sym, oo)
            
            # Si el límite es 0 → f(n) = o(g(n)) → Caso 1
            if lim == 0 or (isinstance(lim, (int, float)) and abs(lim) < 1e-10):
                return {
                    "case": 1,
                    "comparison": "smaller"
                }
            
            # Si el límite es constante positiva → f(n) = Θ(g(n)) → Caso 2
            if lim.is_number and lim > 0:
                return {
                    "case": 2,
                    "comparison": "equal"
                }
            
            # Si el límite es ∞ → f(n) = ω(g(n)) → Caso 3 (necesita verificar regularidad)
            if lim == oo or (isinstance(lim, (int, float)) and lim > 1e10):
                return {
                    "case": 3,
                    "comparison": "larger"
                }
            
            # Si el límite tiene log(n), podría ser Caso 2
            if "log" in str(lim).lower():
                # Verificar si es n^k * log(n) con k = log_b_a
                return {
                    "case": 2,
                    "comparison": "equal"
                }
            
        except Exception:
            pass
        
        # Fallback: comparación heurística
        return self._compare_heuristic(f_n_expr, g_n_expr, log_b_a)
    
    def _compare_heuristic(self, f_n_expr: Expr, g_n_expr: Expr, log_b_a: float) -> Dict[str, Any]:
        """
        Comparación heurística cuando los límites fallan.
        
        Args:
            f_n_expr: Expresión de f(n)
            g_n_expr: Expresión de g(n)
            log_b_a: log_b(a)
            
        Returns:
            {"case": int, "comparison": str}
        """
        # Extraer exponente de f(n) si es n^k
        f_exponent = self._extract_exponent_from_expr(f_n_expr)
        
        if f_exponent is not None:
            if f_exponent < log_b_a - 0.1:
                return {"case": 1, "comparison": "smaller"}
            elif abs(f_exponent - log_b_a) < 0.1:
                return {"case": 2, "comparison": "equal"}
            else:
                return {"case": 3, "comparison": "larger"}
        
        # Fallback: asumir Caso 2
        return {"case": 2, "comparison": "equal"}
    
    def _extract_exponent_from_expr(self, expr: Expr) -> Optional[float]:
        """
        Extrae el exponente de n de una expresión n^k.
        
        Args:
            expr: Expresión SymPy
            
        Returns:
            Exponente k o None
        """
        from sympy import Pow
        
        if isinstance(expr, Pow):
            base, exp = expr.as_base_exp()
            if str(base) == "n":
                try:
                    return float(exp)
                except Exception:
                    pass
        
        # Si es n directamente
        if str(expr) == "n":
            return 1.0
        
        # Si es constante
        if expr.is_number:
            return 0.0
        
        return None
    
    def _compare_f_with_g_simple(self, f_n_str: str, log_b_a: float) -> Dict[str, Any]:
        """
        Comparación simplificada (fallback).
        
        Args:
            f_n_str: Expresión de f(n) como string
            log_b_a: log_b(a)
            
        Returns:
            {"case": int, "comparison": str}
        """
        # Extraer exponente de f(n)
        f_exponent = self._extract_exponent(f_n_str)
        
        if f_exponent is None:
            # Por defecto, asumir Caso 2 si no se puede determinar
            return {"case": 2, "comparison": "equal"}
        
        # Comparar exponentes
        if f_exponent < log_b_a - 0.1:
            return {"case": 1, "comparison": "smaller"}
        elif abs(f_exponent - log_b_a) < 0.1:
            return {"case": 2, "comparison": "equal"}
        else:
            return {"case": 3, "comparison": "larger"}
    
    def _extract_exponent(self, f_n_str: str) -> Optional[float]:
        """
        Extrae el exponente de f(n) si es de la forma n^k.
        
        Args:
            f_n_str: Expresión de f(n)
            
        Returns:
            Exponente k o None
        """
        # Simplificado: buscar patrones como "n", "n^2", etc.
        if f_n_str == "n":
            return 1.0
        elif f_n_str == "1":
            return 0.0
        elif "^" in f_n_str or "**" in f_n_str:
            # Intentar extraer exponente
            try:
                # Buscar n^k o n^{k}
                import re
                match = re.search(r'n\^?\{?(\d+(?:\.\d+)?)\}?', f_n_str)
                if match:
                    return float(match.group(1))
            except Exception:
                pass
        
        return None
    
    def _check_regularity(self, a: int, b: float, f_n_str: str) -> Dict[str, Any]:
        """
        Verifica la condición de regularidad para Caso 3.
        
        Args:
            a: Número de subproblemas
            b: Factor de reducción
            f_n_str: Expresión de f(n)
            
        Returns:
            {"checked": bool, "note": str}
        """
        # Por ahora, asumir que se cumple si f(n) es polinómica
        # En el futuro, se puede verificar con SymPy: a·f(n/b) <= c·f(n) para c < 1
        
        # Simplificado: si f(n) = n^k con k > log_b_a, generalmente se cumple
        f_exponent = self._extract_exponent(f_n_str)
        log_b_a = math.log(a, b) if b > 1 else 1
        
        if f_exponent is not None and f_exponent > log_b_a:
            return {
                "checked": True,
                "note": "Regularidad verificada para funciones polinómicas"
            }
        
        return {
            "checked": False,
            "note": "Regularidad asumida"
        }
    
    def _simplify_latex_expr(self, latex_str: str) -> str:
        """
        Simplifica expresiones LaTeX comunes usando regex y reglas específicas.
        
        Args:
            latex_str: Expresión LaTeX a simplificar
            
        Returns:
            Expresión LaTeX simplificada
        """
        if not isinstance(latex_str, str):
            latex_str = str(latex_str)
        
        import re
        
        try:
            # Simplificar n^{0.0} o n^{0} → 1 (dentro de expresiones)
            latex_str = re.sub(r'n\^{0(\.0+)?\s*\}', '1', latex_str)
            latex_str = re.sub(r'\(n\^0(\.0+)?\)', '1', latex_str)
            latex_str = re.sub(r'\bn\^0(\.0+)?(?=\s|$|\)|,|})', '1', latex_str)
            
            # Simplificar n^{1.0} o n^{1} → n (dentro de expresiones)
            latex_str = re.sub(r'n\^{\s*1(\.0+)?\s*\}', 'n', latex_str)
            latex_str = re.sub(r'\(n\^1(\.0+)?\)', 'n', latex_str)
            latex_str = re.sub(r'\bn\^1(\.0+)?(?=\s|$|\)|,|})', 'n', latex_str)
            
            # Simplificar log(n) → log n (sin paréntesis innecesarios cuando solo hay n)
            # Primero manejar \log (LaTeX con backslash) - usar re.escape para seguridad
            latex_str = re.sub(re.escape(r'\log') + r'\s*\(n\)', r'\\log n', latex_str)
            # Luego manejar log sin backslash (evitar capturar \log)
            # Usar un grupo de captura para preservar el carácter anterior si existe
            latex_str = re.sub(r'([^\\])log\s*\(n\)', r'\1log n', latex_str)
            # Manejar caso especial al inicio de la cadena
            if latex_str.startswith('log'):
                latex_str = re.sub(r'^log\s*\(n\)', 'log n', latex_str)
            
            # Simplificar exponentes con .0 innecesarios dentro de llaves: {2.0} → {2}
            latex_str = re.sub(r'\{(\d+)\.0+(\}|\s)', r'{\1\2', latex_str)
            
            # Redondear exponentes decimales largos a 2 decimales: n^{2.8073549220576} → n^{2.81}
            def round_exponent(match):
                exp_str = match.group(1)
                try:
                    exp_num = float(exp_str)
                    rounded = round(exp_num, 2)
                    # Si después de redondear es un entero, quitar decimales
                    if abs(rounded - round(rounded)) < 1e-10:
                        return f"^{{{int(round(rounded))}}}"
                    # Siempre mostrar 2 decimales para exponentes decimales
                    return f"^{{{rounded:.2f}}}"
                except Exception:
                    return match.group(0)
            
            # Buscar patrones como n^{2.8073549220576} o cualquier exponente decimal
            latex_str = re.sub(r'\^\{(\d+\.\d+)\}', round_exponent, latex_str)
            
            # Simplificar exponentes decimales innecesarios: 2.0 → 2 (cuando está dentro de n^{2.0})
            latex_str = re.sub(r'\^\{(\d+)\.0+\}', r'^{\1}', latex_str)
            
            # Simplificar fracciones con denominador 1: \frac{k}{1} → k
            latex_str = re.sub(re.escape(r'\frac') + r'\{(\d+(?:\.\d+)?)\}\{1\}', r'\1', latex_str)
            
            # Simplificar multiplicación por 1: 1 \cdot x → x, x \cdot 1 → x
            # Usar re.escape para escapar \cdot correctamente
            cdot_pattern = re.escape(r'\cdot')
            # Simplificar 1 \cdot (cualquier cosa) → (cualquier cosa)
            latex_str = re.sub(r'1\s*' + cdot_pattern + r'\s*', '', latex_str)
            # Simplificar (cualquier cosa) \cdot 1 → (cualquier cosa)
            # Lookahead simplificado para evitar problemas de escape
            latex_str = re.sub(cdot_pattern + r'\s*1(?=\s|$|\)|}|,)', '', latex_str)
            
            # Simplificar logaritmos con multiplicación por 1
            log_pattern = re.escape(r'\log')
            # REGLAS PRIORITARIAS: Simplificar 1 \log n → \log n en cualquier contexto
            # Esto debe ejecutarse antes de otras simplificaciones para capturar todos los casos
            # Regla simple y directa: buscar "1 \log n" o "1 log n" y reemplazar por "\log n" o "log n"
            # 1 \log n → \log n (con uno o más espacios entre 1 y \log)
            latex_str = re.sub(r'1\s+' + log_pattern + r'\s+n', r'\\log n', latex_str)
            latex_str = re.sub(r'1\s*' + log_pattern + r'\s+n', r'\\log n', latex_str)
            # Manejar formato SymPy: 1 \log{\left(n \right)} → \log n
            left_right_pattern = re.escape(r'\left(') + r'\s*n\s*' + re.escape(r'\right)')
            latex_str = re.sub(r'1\s*' + log_pattern + r'\s*\{\s*' + left_right_pattern + r'\s*\}', r'\\log n', latex_str)
            latex_str = re.sub(r'1\s+' + log_pattern + r'\s*\(\s*n\s*\)', r'\\log n', latex_str)
            # Manejar log sin backslash (con y sin espacios) - solo cuando hay espacios antes del 1
            # Para evitar reemplazar números como "21 log n", solo reemplazar si hay espacio, inicio, o paréntesis antes
            # Usar alternativas simples para evitar problemas con lookbehinds de ancho variable
            latex_str = re.sub(r'(?<=\s)1\s+log\s+n', 'log n', latex_str)
            latex_str = re.sub(r'(?<=\()1\s+log\s+n', 'log n', latex_str)
            latex_str = re.sub(r'^1\s+log\s+n', 'log n', latex_str)
            latex_str = re.sub(r'(?<=\s)1\s*log\s+n', 'log n', latex_str)
            latex_str = re.sub(r'(?<=\()1\s*log\s+n', 'log n', latex_str)
            latex_str = re.sub(r'^1\s*log\s+n', 'log n', latex_str)
            # Manejar casos sin espacios: 1logn → log n (solo si está aislado)
            latex_str = re.sub(r'(?<=\s)1log\s+n', 'log n', latex_str)
            latex_str = re.sub(r'(?<=\()1log\s+n', 'log n', latex_str)
            latex_str = re.sub(r'^1log\s+n', 'log n', latex_str)
            # Simplificar 1\log n (sin espacios) → \log n
            latex_str = re.sub(r'(?<=\s)1' + log_pattern + r'n', r'\\log n', latex_str)
            latex_str = re.sub(r'(?<=\()1' + log_pattern + r'n', r'\\log n', latex_str)
            latex_str = re.sub(r'^1' + log_pattern + r'n', r'\\log n', latex_str)
            
            # Simplificar \log n \cdot 1 → \log n (diferentes formatos)
            latex_str = re.sub(log_pattern + r'\s+n\s+' + cdot_pattern + r'\s*1(?=\s|$|\)|}|,)', r'\\log n', latex_str)
            # Manejar formato SymPy con \left y \right
            left_right_n = re.escape(r'\left(') + r'\s*n\s*' + re.escape(r'\right)')
            latex_str = re.sub(log_pattern + r'\s*\{\s*' + left_right_n + r'\s*\}\s+' + cdot_pattern + r'\s*1(?=\s|$|\)|}|,)', r'\\log n', latex_str)
            
            # Simplificar expresiones generales: 1 * cualquier_expresión → cualquier_expresión
            # (solo si está precedido por espacios, inicio, o paréntesis)
            # Separar las alternativas para evitar problemas con lookbehinds
            latex_str = re.sub(r'(?<=\s)1\s*\*\s*', '', latex_str)  # 1 * expr después de espacio
            latex_str = re.sub(r'(?<=\()1\s*\*\s*', '', latex_str)  # 1 * expr después de (
            latex_str = re.sub(r'^1\s*\*\s*', '', latex_str)  # 1 * expr al inicio
            latex_str = re.sub(r'\*\s*1(?=\s|$|\)|}|,)', '', latex_str)  # expr * 1
            
            # Simplificar paréntesis LaTeX de SymPy: \left(n\right) → n (cuando es simple)
            latex_str = re.sub(re.escape(r'\left(') + r'n\s*' + re.escape(r'\right)'), 'n', latex_str)
            latex_str = re.sub(re.escape(r'\left[') + r'\s*n\s*' + re.escape(r'\right]'), 'n', latex_str)
            
            # Simplificar paréntesis innecesarios alrededor de n simple: (n) → n
            # PERO NO simplificar si está dentro de comandos LaTeX como \Theta(n), \Omega(n), O(n)
            # Proteger comandos LaTeX comunes antes de simplificar
            # Lista de comandos LaTeX que deben mantener (n) con paréntesis
            latex_commands = ['Theta', 'Omega', 'O', 'o']
            for cmd in latex_commands:
                # Proteger el patrón \comando(n) para que no se simplifique
                pattern = re.escape(f'\\{cmd}') + r'\s*\(n\)'
                # Reemplazar temporalmente con un marcador único
                latex_str = re.sub(pattern, f'__PROTECTED_{cmd}__', latex_str)
            
            # Ahora simplificar (n) → n solo si no está protegido
            latex_str = re.sub(r'\(n\)(?=\s|$|\)|,|})', 'n', latex_str)
            
            # Restaurar los comandos protegidos
            for cmd in latex_commands:
                latex_str = latex_str.replace(f'__PROTECTED_{cmd}__', f'\\{cmd}(n)')
            
        except Exception as e:
            # Si hay un error en el regex, retornar la cadena original
            # para evitar romper el análisis completo
            print(f"[_simplify_latex_expr] Error en simplificación: {e}")
            return latex_str
        
        return latex_str.strip()
    
    def _simplify_expr_latex(self, expr: Expr) -> str:
        """
        Simplifica una expresión SymPy y la convierte a LaTeX con simplificaciones adicionales.
        
        Args:
            expr: Expresión SymPy a simplificar
            
        Returns:
            String LaTeX simplificado
        """
        from sympy import simplify, powsimp
        
        # Simplificar la expresión usando SymPy
        try:
            simplified = simplify(expr)
            simplified = powsimp(simplified, force=True)
        except Exception:
            simplified = expr
        
        # Convertir a LaTeX
        latex_str = latex(simplified)
        
        # Aplicar simplificaciones adicionales
        return self._simplify_latex_expr(latex_str)
    
    def _simplify_number_latex(self, num: float) -> str:
        """
        Simplifica un número para LaTeX.
        
        Args:
            num: Número a simplificar
            
        Returns:
            String LaTeX simplificado
        """
        # Si es entero (dentro de tolerancia), retornar como entero
        if abs(num - round(num)) < 1e-10:
            return str(int(round(num)))
        
        # Si está muy cerca de fracciones comunes, simplificar
        from fractions import Fraction
        try:
            frac = Fraction(num).limit_denominator(100)
            if frac.denominator == 1:
                return str(frac.numerator)
            # Si el denominador es razonable, usar fracción LaTeX
            if frac.denominator <= 20:
                if frac.numerator == 1:
                    return f"\\frac{{1}}{{{frac.denominator}}}"
                else:
                    return f"\\frac{{{frac.numerator}}}{{{frac.denominator}}}"
        except Exception:
            pass
        
        # Redondear a 2 decimales y eliminar .0 si es necesario
        rounded = round(num, 2)
        if abs(rounded - round(rounded)) < 1e-10:
            return str(int(round(rounded)))
        return str(rounded)
    
    def _calculate_theta(self, case: int, g_n_expr: Expr, f_n_str: str, log_b_a: float) -> str:
        """
        Calcula Θ(...) según el caso del Teorema Maestro.
        
        Args:
            case: Caso (1, 2, 3)
            g_n_expr: Expresión de g(n) = n^(log_b a)
            f_n_str: Expresión de f(n)
            log_b_a: log_b(a)
            
        Returns:
            Expresión Θ(...) en formato LaTeX
        """
        if case == 1:
            # T(n) = Θ(g(n)) = Θ(n^(log_b a))
            g_n_latex = self._simplify_expr_latex(g_n_expr)
            result = f"\\Theta({g_n_latex})"
            # Simplificar el resultado final para casos como \Theta(1) → \Theta(1)
            return self._simplify_latex_expr(result)
        elif case == 2:
            # T(n) = Θ(g(n) · log n) = Θ(n^(log_b a) · log n)
            if abs(log_b_a - 1.0) < 0.1:
                result = "\\Theta(n \\log n)"
            else:
                g_n_latex = self._simplify_expr_latex(g_n_expr)
                result = f"\\Theta({g_n_latex} \\log n)"
            # Simplificar el resultado final para casos como \Theta(1 \log n) → \Theta(\log n)
            return self._simplify_latex_expr(result)
        else:  # case == 3
            # T(n) = Θ(f(n))
            # Simplificar f(n) si es posible
            simplified_f = self._simplify_latex_expr(f_n_str)
            result = f"\\Theta({simplified_f})"
            # Simplificar el resultado final
            return self._simplify_latex_expr(result)
    
    def result(self) -> Dict[str, Any]:
        """
        Genera la respuesta estándar del análisis recursivo.
        
        Returns:
            Diccionario con byLine, totals (incluyendo recurrence, master o iteration, proof)
        """
        # Construir byLine básico (puede estar vacío para recursivos)
        by_line = []
        
        # Determinar T_open según el método usado y el modo (PRIORIDAD: characteristic_equation > iteration > recursion_tree > master)
        if self.characteristic_equation:
            t_open = self.characteristic_equation.get("theta", "N/A")
        elif self.iteration:
            t_open = self.iteration.get("theta", "N/A")
        elif self.recursion_tree:
            t_open = self.recursion_tree.get("theta", "N/A")
        elif self.master:
            # Para master theorem, usar theta_best si mode="best"
            # Sino usar theta (worst/average)
            if self.mode == "best":
                t_open = self.master.get("theta_best", self.master.get("theta", "N/A"))
            else:
                t_open = self.master.get("theta", "N/A")
        else:
            t_open = "N/A"
        
        # Construir totals
        totals = {
            "T_open": t_open,
            "symbols": self.symbols if self.symbols else None,
            "notes": self.notes if self.notes else None
        }
        
        # Agregar información de recurrencia
        if self.recurrence:
            totals["recurrence"] = self.recurrence
        
        # Agregar resultado del método aplicado (PRIORIDAD: characteristic_equation > iteration > recursion_tree > master)
        if self.characteristic_equation:
            totals["characteristic_equation"] = self.characteristic_equation
        elif self.iteration:
            totals["iteration"] = self.iteration
        elif self.recursion_tree:
            totals["recursion_tree"] = self.recursion_tree
        elif self.master:
            totals["master"] = self.master
        
        # Construir proof desde proof_steps
        proof = []
        for step in self.proof_steps:
            # Si ya es un diccionario, usarlo directamente
            if isinstance(step, dict):
                proof.append(step)
            # Si es un string, intentar parsearlo (compatibilidad hacia atrás)
            elif isinstance(step, str):
                if ":" in step:
                    parts = step.split(":", 1)
                    proof.append({
                        "id": parts[0].strip(),
                        "text": parts[1].strip()
                    })
                else:
                    proof.append({
                        "id": "step",
                        "text": step
                    })
        
        totals["proof"] = proof
        
        return {
            "ok": True,
            "byLine": by_line,
            "totals": totals
        }
    
    def clear(self):
        """Limpia todos los datos del analizador."""
        super().clear()
        self.procedure_name = None
        self.proc_def = None
        self.ast = None
        self.recurrence = None
        self.master = None
        self.proof = []
        self.proof_steps = []
        self.iteration = None
        self.recursion_tree = None
        self.characteristic_equation = None
    
    # ============================================================================
    # MÉTODO DE ECUACIÓN CARACTERÍSTICA (LINEAL CON DESPLAZAMIENTOS CONSTANTES)
    # ============================================================================
    
    def _detect_linear_recurrence(self, proc_def: Dict[str, Any], recursive_calls: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """
        Detecta si la recurrencia es lineal con desplazamientos constantes.
        
        Forma: T(n) = c₁T(n-1) + c₂T(n-2) + ... + cₖT(n-k) + g(n)
        
        Args:
            proc_def: Nodo ProcDef del procedimiento
            recursive_calls: Lista de llamadas recursivas encontradas
            
        Returns:
            Dict con información de la recurrencia lineal o None si no aplica
            {
                "is_linear": bool,
                "coefficients": {offset: coefficient},  # ej: {1: 1, 2: 1} para T(n) = T(n-1) + T(n-2)
                "max_offset": int,  # k (máximo desplazamiento)
                "g_n": str  # término no homogéneo g(n) en LaTeX
            }
        """
        if not recursive_calls:
            return None
        
        # Analizar todos los subproblemas
        subproblem_info_list = []
        for call in recursive_calls:
            subproblem_info = self._analyze_subproblem_type(call, proc_def)
            if subproblem_info:
                subproblem_info_list.append(subproblem_info)
        
        # Verificar que al menos hay una llamada recursiva analizada
        if not subproblem_info_list:
            return None
        
        # Solo considerar si todos los subproblemas analizados son de tipo "subtraction" (n-1, n-2, etc.)
        # Si alguna llamada recursiva no se pudo analizar (subproblem_info es None), no la incluimos
        # pero si todas las que se analizaron son "subtraction", entonces es lineal
        subtraction_count = sum(1 for info in subproblem_info_list if info.get("type") == "subtraction")
        
        # Si no todas las llamadas analizadas son de tipo "subtraction", no es lineal
        if subtraction_count != len(subproblem_info_list):
            return None
        
        # Si no hay ninguna llamada de tipo "subtraction", no es lineal
        if subtraction_count == 0:
            return None
        
        # Extraer los desplazamientos (offsets)
        # Ejemplo: n-1 -> offset=1, n-2 -> offset=2
        coefficients = Counter()
        for info in subproblem_info_list:
            if info and info.get("type") == "subtraction":
                pattern = info.get("pattern", "")
                # Extraer el número del patrón "n-k"
                if pattern.startswith("n-"):
                    try:
                        offset = int(pattern[2:])
                        coefficients[offset] += 1
                    except ValueError:
                        # Si no es un número constante, no es lineal
                        return None
        
        if not coefficients:
            return None
        
        # Verificar que todos los offsets son constantes positivos
        max_offset = max(coefficients.keys())
        if max_offset <= 0:
            return None
        
        # Obtener g(n) (término no homogéneo)
        # Para ecuaciones características, g(n) = 0 si el trabajo no recursivo es solo
        # operaciones básicas (suma, resta) entre llamadas recursivas
        f_n = self._calculate_non_recursive_work(proc_def, recursive_calls)
        
        # Si f(n) ya es 0, ya es homogénea (correcto)
        # Si f(n) es solo O(1) básico y no hay llamadas a funciones auxiliares, considerar g(n) = 0
        f_n_clean = f_n.strip().lower() if f_n else ""
        # Aceptar más variantes de O(1): "1", "theta(1)", "\\theta(1)", "o(1)", "O(1)", etc.
        o1_variants = ["1", "\\theta(1)", "theta(1)", "o(1)", "o(1)", "O(1)", "\\Theta(1)", "Θ(1)"]
        if f_n_clean != "0" and f_n_clean in o1_variants:
            # Verificar si hay llamadas a funciones auxiliares (no recursivas)
            has_aux_calls = self._has_auxiliary_function_calls(proc_def, recursive_calls)
            if not has_aux_calls:
                # Si no hay llamadas auxiliares y el trabajo es solo O(1) básico,
                # considerar homogénea (g(n) = 0)
                # Esto es porque las operaciones O(1) básicas (sumas, comparaciones)
                # entre llamadas recursivas no cuentan como trabajo no homogéneo
                f_n = "0"
        
        return {
            "is_linear": True,
            "coefficients": dict(coefficients),
            "max_offset": max_offset,
            "g_n": f_n
        }
    
    def _detect_characteristic_equation_method(self, proc_def: Dict[str, Any], recursive_calls: List[Dict[str, Any]]) -> bool:
        """
        Detecta si debe usarse el Método de Ecuación Característica.
        
        Prioridad ALTA sobre Método de Iteración.
        
        Aplica cuando la recurrencia es lineal con desplazamientos constantes:
        T(n) = c₁T(n-1) + c₂T(n-2) + ... + cₖT(n-k) + g(n)
        
        Args:
            proc_def: Nodo ProcDef del procedimiento
            recursive_calls: Lista de llamadas recursivas encontradas
            
        Returns:
            True si debe usar Ecuación Característica
        """
        linear_info = self._detect_linear_recurrence(proc_def, recursive_calls)
        return linear_info is not None and linear_info.get("is_linear", False)
    
    def _has_case_variability(self) -> bool:
        """
        Detecta si el algoritmo tiene variabilidad entre worst/best/avg.
        
        Para algoritmos recursivos determinísticos (ej: Fibonacci), la estructura
        del árbol recursivo es siempre idéntica, por lo que worst/best/avg son iguales.
        
        Un algoritmo tiene variabilidad si:
        - Tiene ramas condicionales que afectan el número de llamadas recursivas
        - Tiene early returns que cambian según los datos
        - El tamaño de los subproblemas varía según los datos
        
        Returns:
            True si hay variabilidad, False si worst/best/avg son idénticos
        """
        if not self.proc_def:
            return True  # Por defecto, asumir variabilidad
        
        # Para algoritmos con ecuación característica (lineales con desplazamientos constantes),
        # típicamente NO hay variabilidad porque la estructura es determinística
        if self.recurrence and self.recurrence.get("method") == "characteristic_equation":
            # Verificar si hay ramas condicionales que afecten recursión
            body = self.proc_def.get("body", {}) or self.proc_def.get("block", {})
            
            # Buscar IF que contengan llamadas recursivas en diferentes ramas
            recursive_calls = self._find_recursive_calls(self.proc_def)
            if not recursive_calls:
                return True
            
            # Verificar si las llamadas recursivas están en diferentes ramas condicionales
            # Si todas las llamadas recursivas están en la misma rama (o fuera de IF),
            # entonces no hay variabilidad
            has_conditional_recursion = self._has_conditional_recursive_calls(body, recursive_calls)
            
            # Si hay early returns que afectan el flujo recursivo, hay variabilidad
            # PERO: un early return en el caso base (IF n <= k THEN RETURN) NO cuenta como variabilidad
            # porque siempre se ejecuta igual para todos los casos (determinístico)
            # Solo cuenta si el early return está en una rama que afecta la recursión
            has_early_return = False
            if has_conditional_recursion:
                # Solo verificar early return si hay condicionales que afecten recursión
                # Si no hay condicionales, el early return en el caso base no cuenta
                has_early_return = self._detect_early_return()
            
            # Para ecuación característica (lineal con desplazamientos constantes),
            # típicamente NO hay variabilidad porque el algoritmo es determinístico.
            # Solo hay variabilidad si hay condicionales que afecten el flujo recursivo.
            # Para Fibonacci, todas las llamadas recursivas están en el mismo bloque (ELSE),
            # así que no hay variabilidad.
            if not has_conditional_recursion and not has_early_return:
                return False  # No hay variabilidad (worst/best/avg son idénticos)
            
            return True  # Hay variabilidad
        
        # Para otros métodos, verificar de manera similar
        return True  # Por defecto, asumir variabilidad
    
    def _has_conditional_recursive_calls(self, node: Any, recursive_calls: List[Dict[str, Any]]) -> bool:
        """
        Verifica si hay llamadas recursivas en diferentes ramas condicionales.
        
        Args:
            node: Nodo del AST
            recursive_calls: Lista de llamadas recursivas
            
        Returns:
            True si hay llamadas recursivas en diferentes ramas condicionales
        """
        if not isinstance(node, dict):
            return False
        
        node_type = node.get("type", "")
        
        # Si encontramos un IF con llamadas recursivas en ambas ramas
        if node_type == "If":
            consequent = node.get("consequent", {})
            alternate = node.get("alternate", {})
            
            # Verificar si hay llamadas recursivas en cada rama
            has_in_consequent = self._contains_recursive_call(consequent, recursive_calls)
            has_in_alternate = self._contains_recursive_call(alternate, recursive_calls)
            
            # Si hay en ambas ramas, hay variabilidad
            if has_in_consequent and has_in_alternate:
                return True
        
        # Buscar recursivamente
        for key, value in node.items():
            if key in ["type", "pos"]:
                continue
            if isinstance(value, list):
                for item in value:
                    if self._has_conditional_recursive_calls(item, recursive_calls):
                        return True
            elif isinstance(value, dict):
                if self._has_conditional_recursive_calls(value, recursive_calls):
                    return True
        
        return False
    
    def _contains_recursive_call(self, node: Any, recursive_calls: List[Dict[str, Any]]) -> bool:
        """
        Verifica si un nodo contiene una llamada recursiva.
        
        Args:
            node: Nodo del AST
            recursive_calls: Lista de llamadas recursivas (no se usa directamente, pero útil para tipo)
            
        Returns:
            True si contiene una llamada recursiva
        """
        if not isinstance(node, dict):
            return False
        
        node_type = node.get("type", "")
        
        if node_type == "Call":
            call_name = node.get("name") or node.get("callee", "")
            if call_name and call_name.lower() == (self.procedure_name or "").lower():
                return True
        
        # Buscar recursivamente
        for key, value in node.items():
            if key in ["type", "pos"]:
                continue
            if isinstance(value, list):
                for item in value:
                    if self._contains_recursive_call(item, recursive_calls):
                        return True
            elif isinstance(value, dict):
                if self._contains_recursive_call(value, recursive_calls):
                    return True
        
        return False
    
    def _apply_characteristic_equation_method(self) -> Dict[str, Any]:
        """
        Aplica el Método de Ecuación Característica para resolver la recurrencia.
        
        Resuelve recurrencias lineales de la forma:
        T(n) = c₁T(n-1) + c₂T(n-2) + ... + cₖT(n-k) + g(n)
        
        Returns:
            {"success": bool, "characteristic_equation": dict, "reason": str}
        """
        if not self.recurrence:
            return {
                "success": False,
                "reason": "No hay recurrencia extraída"
            }
        
        # Obtener información de recurrencia lineal
        linear_info = self._detect_linear_recurrence(self.proc_def, self._find_recursive_calls(self.proc_def))
        if not linear_info or not linear_info.get("is_linear"):
            return {
                "success": False,
                "reason": "No es una recurrencia lineal con desplazamientos constantes"
            }
        
        self.proof_steps.append({"id": "characteristic_start", "text": "\\text{Aplicando Método de Ecuación Característica}"})
        
        coefficients = linear_info["coefficients"]
        max_offset = linear_info["max_offset"]
        g_n_str = linear_info["g_n"]
        
        # Detectar casos base del AST
        base_cases = self._detect_base_cases(self.proc_def)
        
        # Construir la ecuación característica
        # Para T(n) = c₁T(n-1) + c₂T(n-2) + ... + cₖT(n-k) + g(n)
        # La ecuación característica es: r^k - c₁r^(k-1) - c₂r^(k-2) - ... - cₖ = 0
        
        # Construir ecuación característica en SymPy
        # NO usar positive=True porque puede excluir raíces negativas (ej: (1-√5)/2 para Fibonacci)
        r = Symbol('r', real=True)
        char_eq_terms = []
        
        # Término principal: r^k
        char_eq_terms.append(r**max_offset)
        
        # Términos negativos: -cᵢr^(k-i)
        for offset, coeff in coefficients.items():
            power = max_offset - offset
            if power >= 0:
                char_eq_terms.append(-coeff * r**power)
        
        # Construir ecuación: r^k - c₁r^(k-1) - ... = 0
        char_eq_expr = sum(char_eq_terms)
        # Simplificar la expresión para evitar r^2 + -r + -1 = 0
        char_eq_expr_simplified = simplify(char_eq_expr)
        char_eq_latex = latex(char_eq_expr_simplified) + " = 0"
        
        # Construir paso con valores reemplazados
        # Mostrar cómo se construye la ecuación desde la recurrencia
        recurrence_terms = []
        for offset, coeff in sorted(coefficients.items()):
            if coeff == 1:
                recurrence_terms.append(f"T(n-{offset})")
            else:
                recurrence_terms.append(f"{coeff} \\cdot T(n-{offset})")
        
        if g_n_str and g_n_str.strip() and g_n_str.strip() != "0":
            recurrence_form_expanded = f"T(n) = {' + '.join(recurrence_terms)} + {g_n_str}"
        else:
            recurrence_form_expanded = f"T(n) = {' + '.join(recurrence_terms)}"
        
        # Mostrar construcción de ecuación característica
        # NOTA: La ecuación característica NO incluye g(n), solo los términos recursivos
        # Para T(n) = c₁T(n-1) + c₂T(n-2) + g(n), la ecuación característica es r^k - c₁r^(k-1) - c₂r^(k-2) - ... = 0
        char_eq_construction = []
        char_eq_construction.append(f"r^{{{max_offset}}}")
        for offset, coeff in sorted(coefficients.items()):
            power = max_offset - offset
            if power >= 0:
                if power == 0:
                    char_eq_construction.append(f"-{coeff}")
                elif power == 1:
                    if coeff == 1:
                        char_eq_construction.append("-r")
                    else:
                        char_eq_construction.append(f"-{coeff}r")
                else:
                    if coeff == 1:
                        char_eq_construction.append(f"-r^{{{power}}}")
                    else:
                        char_eq_construction.append(f"-{coeff}r^{{{power}}}")
        
        char_eq_construction_latex = " + ".join(char_eq_construction) + " = 0"
        
        # Construir texto del paso (usar ecuación simplificada directamente)
        # La ecuación característica ya está simplificada en char_eq_latex (ej: r^2 - r - 1 = 0)
        # No mostrar la construcción intermedia con r^2 + -r + -1 = 0
        if g_n_str and g_n_str.strip() and g_n_str.strip() != "0":
            step_text = f"\\text{{De }} {recurrence_form_expanded} \\text{{, para la ecuación característica homogénea asociada (ignorando }} g(n) = {g_n_str} \\text{{), reemplazando }} T(n) = r^n \\text{{ obtenemos: }} {char_eq_latex}"
        else:
            step_text = f"\\text{{De }} {recurrence_form_expanded} \\text{{, reemplazando }} T(n) = r^n \\text{{ obtenemos: }} {char_eq_latex}"
        
        self.proof_steps.append({
            "id": "characteristic_eq",
            "text": step_text
        })
        
        # Resolver ecuación característica
        try:
            # Resolver r^k - c₁r^(k-1) - ... = 0 (usar expresión simplificada)
            roots = solve(char_eq_expr_simplified, r)
            
            # Filtrar raíces reales (incluir todas las raíces reales, no solo positivas)
            # Para ecuaciones cuadráticas como r^2 - r - 1 = 0, necesitamos ambas raíces
            # IMPORTANTE: NO evaluar las raíces todavía para mantener su forma simbólica
            real_roots = []
            for root in roots:
                try:
                    # Verificar si es real sin evaluar numéricamente
                    if root.is_real:
                        # Mantener la raíz en forma simbólica para mejor representación
                        real_roots.append(root)
                    else:
                        # Intentar verificar si tiene parte real
                        try:
                            if root.real.is_real:
                                real_roots.append(root)
                        except:
                            pass
                except:
                    # Si no se puede verificar, incluir de todas formas
                    real_roots.append(root)
            
            if not real_roots:
                # Si no hay raíces reales, usar todas las raíces
                real_roots = roots
            
            # Ordenar raíces por valor numérico (descendente por valor absoluto), para que la mayor esté primero
            # Pero mantener la forma simbólica
            try:
                real_roots = sorted(real_roots, key=lambda r: abs(float(r.evalf())) if hasattr(r, 'evalf') else 0, reverse=True)
            except:
                try:
                    # Fallback: ordenar por valor real si es complejo
                    real_roots = sorted(real_roots, key=lambda r: abs(float(r.real.evalf())) if hasattr(r, 'real') else 0, reverse=True)
                except:
                    pass
            
            # Procesar raíces con multiplicidad (mantener forma simbólica)
            # IMPORTANTE: Usar la raíz directamente como clave para evitar problemas de comparación
            roots_info = []
            root_counts = Counter()
            root_map = {}  # Mapa de raíz simplificada -> raíz original
            
            for root in real_roots:
                try:
                    # Simplificar la raíz manteniendo forma simbólica
                    root_simplified = simplify(root)
                    # Usar hash o representación única para evitar problemas de comparación
                    root_key = str(root_simplified)
                    
                    # Si ya existe esta raíz, incrementar contador
                    if root_key not in root_map:
                        root_map[root_key] = root_simplified
                    
                    root_counts[root_key] += 1
                except:
                    root_key = str(root)
                    if root_key not in root_map:
                        root_map[root_key] = root
                    root_counts[root_key] += 1
            
            # Procesar cada raíz única con su multiplicidad
            for root_key, mult in root_counts.items():
                try:
                    # Obtener la raíz simplificada del mapa
                    root_simplified = root_map.get(root_key, sympify(root_key))
                    
                    # Intentar simplificar aún más la raíz para mostrar forma algebraica
                    if not isinstance(root_simplified, (int, float)):
                        root_simplified = simplify(root_simplified)
                    
                    # Intentar factorizar o simplificar aún más
                    try:
                        # Si es una fracción o expresión compleja, intentar simplificar
                        root_factorized = factor(root_simplified)
                        if root_factorized != root_simplified:
                            root_simplified = root_factorized
                    except:
                        pass
                    
                    root_latex = latex(root_simplified)
                    
                    # Si la raíz es un número decimal, intentar encontrar forma algebraica
                    try:
                        root_num = float(root_simplified.evalf())
                        # Para casos comunes como (1+√5)/2 ≈ 1.618, intentar reconstruir
                        if abs(root_num - 1.61803398874989) < 1e-10:
                            root_latex = "\\frac{1 + \\sqrt{5}}{2}"
                        elif abs(root_num - -0.618033988749895) < 1e-10:
                            root_latex = "\\frac{1 - \\sqrt{5}}{2}"
                    except:
                        pass
                except:
                    root_latex = root_str
                
                roots_info.append({
                    "root": root_latex,
                    "multiplicity": mult
                })
            
            # Determinar si es homogénea o no homogénea
            # Una recurrencia es homogénea SI Y SOLO SI g(n) = 0
            # Si g(n) = 1, \Theta(1), o cualquier constante distinta de 0, es NO homogénea
            g_n_clean = g_n_str.strip().lower() if g_n_str else ""
            
            # Es homogénea solo si g(n) es explícitamente 0 o vacío
            # Cualquier otra cosa (incluyendo "1", "\theta(1)", constantes, etc.) es NO homogénea
            is_homogeneous = (g_n_clean == "0" or 
                             g_n_clean == "\\theta(0)" or 
                             g_n_clean == "theta(0)" or
                             (g_n_clean == "" and (not g_n_str or len(g_n_str.strip()) == 0)))
            
            # Si g(n) no es 0, es NO homogénea (por defecto)
            # Esto incluye "1", "\theta(1)", y cualquier otra constante distinta de 0
            
            # Construir solución general
            if len(roots_info) == 1 and roots_info[0]["multiplicity"] == 1:
                # Caso simple: una raíz única
                r_val = roots_info[0]["root"]
                if is_homogeneous:
                    homogeneous_sol = f"A \\cdot {r_val}^n"
                else:
                    # Necesitamos solución particular
                    homogeneous_sol = f"A \\cdot {r_val}^n"
            elif len(roots_info) == 2 and all(r["multiplicity"] == 1 for r in roots_info):
                # Dos raíces distintas (ej: Fibonacci)
                r1 = roots_info[0]["root"]
                r2 = roots_info[1]["root"]
                homogeneous_sol = f"A_1 \\cdot {r1}^n + A_2 \\cdot {r2}^n"
            else:
                # Caso general con múltiples raíces
                terms = []
                for i, root_info in enumerate(roots_info):
                    r_val = root_info["root"]
                    mult = root_info["multiplicity"]
                    if mult == 1:
                        terms.append(f"A_{i+1} \\cdot {r_val}^n")
                    else:
                        # Raíz múltiple: agregar términos con potencias de n
                        for j in range(mult):
                            terms.append(f"A_{i+1}{j+1} \\cdot n^{j} \\cdot {r_val}^n")
                homogeneous_sol = " + ".join(terms)
            
            # Construir solución general (homogénea + particular si aplica)
            general_solution = homogeneous_sol
            
            # Solución particular (si no es homogénea)
            particular_sol = None
            if not is_homogeneous:
                # Calcular solución particular real
                # Para g(n) = constante C, asumir T_p(n) = K (constante)
                # Sustituir en la recurrencia: K = c₁K + c₂K + ... + C
                try:
                    g_n_clean = g_n_str.strip().lower()
                    
                    # Extraer el valor numérico de g(n) si es una constante
                    g_value = None
                    if g_n_clean == "1":
                        g_value = 1
                    elif g_n_clean == "0":
                        g_value = 0
                    elif "theta(1)" in g_n_clean or "\\theta(1)" in g_n_clean:
                        g_value = 1
                    elif g_n_clean.isdigit():
                        g_value = int(g_n_clean)
                    else:
                        # Intentar extraer número de expresiones como "\\Theta(1)"
                        match = re.search(r'(\d+)', g_n_clean)
                        if match:
                            g_value = int(match.group(1))
                    
                    if g_value is not None and g_value != 0:
                        # Calcular K = g_value / (1 - suma_coeficientes)
                        # T_p(n) = K, entonces K = c₁K + c₂K + ... + g_value
                        # K - (c₁ + c₂ + ...)K = g_value
                        # K(1 - suma) = g_value
                        # K = g_value / (1 - suma)
                        sum_coeffs = sum(coefficients.values())
                        denominator = 1 - sum_coeffs
                        
                        if abs(denominator) < 1e-6:
                            # Si 1 - suma = 0, entonces no hay solución constante
                            # Usar forma polinómica
                            particular_sol = "P(n)"  # Polinomio de grado apropiado
                        else:
                            k_value = g_value / denominator
                            # Simplificar k_value
                            try:
                                k_sympy = sympify(k_value)
                                k_simplified = simplify(k_sympy)
                                k_latex = latex(k_simplified)
                                particular_sol = k_latex
                            except:
                                # Redondear a 3 decimales si es necesario
                                if abs(k_value - round(k_value)) < 1e-6:
                                    particular_sol = str(int(round(k_value)))
                                else:
                                    particular_sol = f"{k_value:.3f}".rstrip('0').rstrip('.')
                    else:
                        # Si no se puede extraer constante, usar forma genérica
                        if "n" in g_n_str.lower():
                            particular_sol = "P(n)"  # Polinomio
                        else:
                            particular_sol = "C"  # Constante genérica
                except Exception as e:
                    # En caso de error, usar forma genérica
                    if "n" in g_n_str.lower():
                        particular_sol = "P(n)"  # Polinomio
                    else:
                        particular_sol = "C"  # Constante genérica
                
                # Actualizar solución general con solución particular
                if particular_sol:
                    general_solution = f"{homogeneous_sol} + {particular_sol}"
            
            # Forma cerrada simplificada
            # Para casos comunes, simplificar
            if len(roots_info) == 1:
                r_val = roots_info[0]["root"]
                try:
                    r_sympy = sympify(r_val)
                    r_num = float(r_sympy.evalf())
                    if abs(r_num - 1.0) < 1e-6:
                        closed_form = "\\Theta(n)"
                    elif r_num > 1:
                        closed_form = f"\\Theta({r_val}^n)"
                    else:
                        closed_form = f"\\Theta({r_val}^n)"
                except:
                    closed_form = f"\\Theta({r_val}^n)"
            elif len(roots_info) == 2:
                # Dos raíces: usar la mayor en valor absoluto (raíz dominante)
                r1_val = roots_info[0]["root"]
                r2_val = roots_info[1]["root"]
                try:
                    r1_sympy = sympify(r1_val)
                    r2_sympy = sympify(r2_val)
                    r1_num = float(r1_sympy.evalf())
                    r2_num = float(r2_sympy.evalf())
                    # Usar la raíz con mayor valor absoluto (raíz dominante)
                    r_max_num = max(abs(r1_num), abs(r2_num))
                    r_max_val = r1_val if abs(r1_num) >= abs(r2_num) else r2_val
                    # Para complejidad asintótica, usar la raíz dominante
                    closed_form = f"\\Theta({r_max_val}^n)"
                except:
                    # Fallback: usar la primera raíz (ya está ordenada por valor absoluto descendente)
                    closed_form = f"\\Theta({r1_val}^n)"
            else:
                # Caso general: encontrar la raíz con mayor valor numérico
                try:
                    r_max = max(roots_info, key=lambda r: float(sympify(r["root"]).evalf()) if sympify(r["root"]).is_real else 0)
                    closed_form = f"\\Theta({r_max['root']}^n)"
                except:
                    # Fallback: usar la primera raíz
                    closed_form = f"\\Theta({roots_info[0]['root']}^n)"
            
            # Detectar si es caso de DP lineal
            is_dp_linear = max_offset <= 3 and all(offset <= 3 for offset in coefficients.keys())
            
            # Generar versión DP si aplica
            dp_version = None
            dp_optimized_version = None
            dp_equivalence = ""
            if is_dp_linear:
                # Generar código DP básico (O(n) espacio)
                dp_code = self._generate_dp_code(coefficients, max_offset)
                
                # Generar código DP optimizado (O(1) espacio o O(k) espacio)
                dp_code_optimized = self._generate_optimized_dp_code(coefficients, max_offset, g_n_str)
                
                # Calcular complejidades
                recursive_complexity = self._calculate_recursive_complexity(coefficients, max_offset)
                dp_time = "O(n)"
                dp_space = "O(n)"  # Versión básica con tabla
                
                # Espacio optimizado: O(1) para max_offset <= 3, O(k) para otros casos
                if max_offset <= 3:
                    dp_space_optimized = "O(1)"
                else:
                    dp_space_optimized = f"O({max_offset})"  # Arreglo circular pequeño
                
                dp_version = {
                    "code": dp_code,
                    "time_complexity": dp_time,
                    "space_complexity": dp_space,
                    "recursive_complexity": recursive_complexity
                }
                
                dp_optimized_version = {
                    "code": dp_code_optimized,
                    "time_complexity": dp_time,
                    "space_complexity": dp_space_optimized
                }
                
                dp_equivalence = (
                    "Las raíces de la ecuación característica corresponden a los valores propios "
                    "de la transición lineal del sistema DP. La solución cerrada matemática "
                    "equivale a la solución iterativa mediante programación dinámica."
                )
            
            # Resultado final
            theta_result = closed_form
            
            # Calcular raíz dominante (mayor valor absoluto) y tasa de crecimiento
            dominant_root = None
            growth_rate = None
            if roots_info:
                try:
                    # Encontrar la raíz con mayor valor absoluto
                    r_max_info = max(roots_info, key=lambda r: abs(float(sympify(r["root"]).evalf())) if sympify(r["root"]).is_real else 0)
                    dominant_root = r_max_info["root"]
                    growth_rate = float(sympify(dominant_root).evalf())
                except:
                    # Fallback: usar la primera raíz (ya está ordenada)
                    if roots_info:
                        dominant_root = roots_info[0]["root"]
                        try:
                            growth_rate = float(sympify(dominant_root).evalf())
                        except:
                            pass
            
            result = {
                "method": "characteristic_equation",
                "is_dp_linear": is_dp_linear,
                "equation": char_eq_latex,
                "roots": roots_info,
                "dominant_root": dominant_root,
                "growth_rate": growth_rate,
                "solved_by": "characteristic_equation",
                "homogeneous_solution": homogeneous_sol,
                "particular_solution": particular_sol,
                "general_solution": general_solution,
                "base_cases": base_cases if base_cases else None,
                "closed_form": closed_form,
                "dp_version": dp_version,
                "dp_optimized_version": dp_optimized_version,
                "dp_equivalence": dp_equivalence,
                "theta": theta_result
            }
            
            self.proof_steps.append({
                "id": "characteristic_solution",
                "text": f"\\text{{Solución: }} T(n) = {theta_result}"
            })
            
            if is_dp_linear:
                self.proof_steps.append({
                    "id": "dp_detection",
                    "text": "\\text{Esta recurrencia corresponde a un caso de Programación Dinámica Lineal}"
                })
            
            return {
                "success": True,
                "characteristic_equation": result
            }
            
        except Exception as e:
            return {
                "success": False,
                "reason": f"Error resolviendo ecuación característica: {str(e)}"
            }
    
    def _generate_dp_code(self, coefficients: Dict[int, int], max_offset: int) -> str:
        """
        Genera código pseudocódigo para versión DP del algoritmo.
        
        Args:
            coefficients: Diccionario {offset: coefficient}
            max_offset: Máximo desplazamiento k
            
        Returns:
            Código pseudocódigo en string
        """
        # Determinar casos base
        base_cases = []
        for i in range(max_offset):
            base_cases.append(f"    dp[{i}] = T{i}  // Caso base")
        
        # Construir bucle principal
        loop_body = "    dp[i] = "
        terms = []
        for offset, coeff in sorted(coefficients.items()):
            if coeff == 1:
                terms.append(f"dp[i-{offset}]")
            else:
                terms.append(f"{coeff} * dp[i-{offset}]")
        
        loop_body += " + ".join(terms)
        
        code = f"""FUNCIÓN dp_solve(n):
    SI n <= {max_offset-1} ENTONCES
        RETORNAR caso_base[n]
    
    // Inicializar tabla DP
    dp[0..n] = 0
    
    // Casos base
{chr(10).join(base_cases)}
    
    // Llenar tabla bottom-up
    PARA i = {max_offset} HASTA n HACER
{loop_body}
    FIN PARA
    
    RETORNAR dp[n]
FIN FUNCIÓN"""
        
        return code
    
    def _generate_optimized_dp_code(self, coefficients: Dict[int, int], max_offset: int, g_n_str: str = "0") -> str:
        """
        Genera código pseudocódigo para versión DP optimizada con O(1) espacio.
        
        En lugar de usar una tabla completa, usa solo variables auxiliares.
        Ejemplo para Fibonacci: usar solo a=0, b=1 en el loop.
        
        Args:
            coefficients: Diccionario {offset: coefficient}
            max_offset: Máximo desplazamiento k
            g_n_str: Término no homogéneo g(n) para determinar si incluir +g(i) en el código
            
        Returns:
            Código pseudocódigo optimizado en string
        """
        if max_offset == 1:
            # Caso simple: T(n) = cT(n-1) + g(n)
            coeff = coefficients.get(1, 1)
            code = f"""FUNCIÓN dp_solve_optimized(n):
    SI n <= 0 ENTONCES
        RETORNAR caso_base[0]
    
    // Versión optimizada O(1) espacio
    prev = caso_base[0]  // T(0)
    
    // Llenar bottom-up con solo variables auxiliares
    PARA i = 1 HASTA n HACER
        actual = {coeff} * prev + g(i)  // T(i) = {coeff}T(i-1) + g(i)
        prev = actual
    FIN PARA
    
    RETORNAR prev
FIN FUNCIÓN"""
        elif max_offset == 2:
            # Caso común: T(n) = c1T(n-1) + c2T(n-2) + g(n) (ej: Fibonacci)
            coeff1 = coefficients.get(1, 1)
            coeff2 = coefficients.get(2, 1)
            
            # Determinar si es homogénea (g(n) = 0)
            g_n_clean = g_n_str.strip().lower() if g_n_str else "0"
            is_homogeneous = (g_n_clean == "0" or 
                             g_n_clean == "\\theta(0)" or 
                             g_n_clean == "theta(0)" or
                             (g_n_clean == "" and (not g_n_str or len(g_n_str.strip()) == 0)))
            
            # Construir término g(n) solo si no es homogénea
            g_term = "" if is_homogeneous else " + g(i)"
            g_comment = "" if is_homogeneous else f" + g(i)"
            
            code = f"""FUNCIÓN dp_solve_optimized(n):
    SI n <= 0 ENTONCES
        RETORNAR caso_base[0]
    SI n = 1 ENTONCES
        RETORNAR caso_base[1]
    
    // Versión optimizada O(1) espacio
    // Usar solo dos variables auxiliares
    a = caso_base[0]  // T(0)
    b = caso_base[1]  // T(1)
    
    // Llenar bottom-up con solo variables auxiliares
    PARA i = 2 HASTA n HACER
        temp = {coeff1} * b + {coeff2} * a{g_term}  // T(i) = {coeff1}T(i-1) + {coeff2}T(i-2){g_comment}
        a = b
        b = temp
    FIN PARA
    
    RETORNAR b
FIN FUNCIÓN"""
        elif max_offset == 3:
            # Caso: T(n) = c1T(n-1) + c2T(n-2) + c3T(n-3) + g(n) (ej: Tribonacci)
            coeff1 = coefficients.get(1, 1)
            coeff2 = coefficients.get(2, 1)
            coeff3 = coefficients.get(3, 1)
            
            code = f"""FUNCIÓN dp_solve_optimized(n):
    SI n <= 0 ENTONCES
        RETORNAR caso_base[0]
    SI n = 1 ENTONCES
        RETORNAR caso_base[1]
    SI n = 2 ENTONCES
        RETORNAR caso_base[2]
    
    // Versión optimizada O(1) espacio
    // Usar solo tres variables auxiliares
    a = caso_base[0]  // T(0)
    b = caso_base[1]  // T(1)
    c = caso_base[2]  // T(2)
    
    // Llenar bottom-up con solo variables auxiliares
    PARA i = 3 HASTA n HACER
        temp = {coeff1} * c + {coeff2} * b + {coeff3} * a + g(i)  // T(i) = {coeff1}T(i-1) + {coeff2}T(i-2) + {coeff3}T(i-3) + g(i)
        a = b
        b = c
        c = temp
    FIN PARA
    
    RETORNAR c
FIN FUNCIÓN"""
        else:
            # Caso general: usar un arreglo circular pequeño (solo max_offset elementos)
            # Aunque técnicamente es O(k) espacio, es O(1) relativo a n
            terms = []
            for offset in sorted(coefficients.keys()):
                coeff = coefficients[offset]
                if coeff == 1:
                    terms.append(f"dp[(i-{offset}) % {max_offset}]")
                else:
                    terms.append(f"{coeff} * dp[(i-{offset}) % {max_offset}]")
            
            code = f"""FUNCIÓN dp_solve_optimized(n):
    SI n <= {max_offset-1} ENTONCES
        RETORNAR caso_base[n]
    
    // Versión optimizada O({max_offset}) espacio (arreglo circular)
    // Inicializar arreglo circular pequeño
    dp[0..{max_offset-1}] = 0
    
    // Casos base
"""
            for i in range(max_offset):
                code += f"    dp[{i}] = caso_base[{i}]  // Caso base T({i})\n"
            
            code += f"""
    // Llenar bottom-up con arreglo circular
    PARA i = {max_offset} HASTA n HACER
        dp[i % {max_offset}] = {' + '.join(terms)} + g(i)  // T(i) = ... + g(i)
    FIN PARA
    
    RETORNAR dp[n % {max_offset}]
FIN FUNCIÓN"""
        
        return code
    
    def _calculate_recursive_complexity(self, coefficients: Dict[int, int], max_offset: int) -> str:
        """
        Calcula la complejidad de la versión recursiva.
        
        Args:
            coefficients: Diccionario {offset: coefficient}
            max_offset: Máximo desplazamiento k
            
        Returns:
            Complejidad en notación O
        """
        # Contar número total de llamadas recursivas
        total_calls = sum(coefficients.values())
        
        if total_calls == 1:
            return "O(n)"
        elif total_calls == 2:
            return "O(2^n)"
        else:
            return f"O({total_calls}^n)"
    
    # ============================================================================
    # MÉTODO DE ITERACIÓN (UNROLLING)
    # ============================================================================
    
    def _detect_iteration_method(self, proc_def: Dict[str, Any], recursive_calls: List[Dict[str, Any]]) -> bool:
        """
        Detecta si debe usarse el Método de Iteración en lugar del Teorema Maestro.
        
        Reglas para usar Método de Iteración:
        1. Llamados recursivos con subproblemas decrease-and-conquer (n-1, n-k, n/c)
        2. Subproblemas de tipo substracción (n-1, n-2, etc.) o división (n/2, n/c)
        3. Todos los subproblemas son decrease-and-conquer (no divide-and-conquer uniforme)
        4. Subproblema estrictamente más pequeño g(n) < n
        
        Casos especiales permitidos:
        - Múltiples llamadas recursivas con substracción (ej: Fibonacci T(n) = T(n-1) + T(n-2))
        
        Args:
            proc_def: Nodo ProcDef del procedimiento
            recursive_calls: Lista de llamadas recursivas encontradas
            
        Returns:
            True si debe usar Método de Iteración
        """
        if not recursive_calls:
            return False
        
        # Verificar que todos los subproblemas son decrease-and-conquer (substracción o división)
        all_subtraction_or_division = True
        for call in recursive_calls:
            subproblem_info = self._analyze_subproblem_type(call, proc_def)
            if not subproblem_info:
                all_subtraction_or_division = False
                break
            # Permitir substracción y división, pero no otros tipos
            if subproblem_info["type"] not in ["subtraction", "division"]:
                all_subtraction_or_division = False
                break
        
        if not all_subtraction_or_division:
            return False
        
        # Verificar que no combina múltiples resultados de forma compleja
        # (esto se verificará más adelante, pero aquí rechazamos casos obviamente complejos)
        # Para casos como Fibonacci, permitimos múltiples llamadas recursivas
        
        return True
        
        # Regla 2 y 5: Analizar tipo de subproblema
        call = recursive_calls[0]
        subproblem_info = self._analyze_subproblem_type(call, proc_def)
        
        if not subproblem_info:
            return False
        
        # Debe ser decrease-and-conquer (substracción o división)
        if subproblem_info["type"] not in ["subtraction", "division"]:
            return False
        
        # Regla 6: No debe combinar múltiples resultados (verificar que no hay suma de llamadas recursivas)
        if self._combines_multiple_results(proc_def, recursive_calls):
            return False
        
        return True
    
    def _analyze_subproblem_type(self, call: Dict[str, Any], proc_def: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Analiza el tipo de subproblema en una llamada recursiva para Método de Iteración.
        
        Clasifica el subproblema como:
        - "subtraction": n-1, n-k, n-c
        - "division": n/2, n/c
        - "range_halving": (inicio + fin) / 2
        - "unknown": No se puede clasificar
        
        Args:
            call: Nodo Call recursivo
            proc_def: Nodo ProcDef del procedimiento
            
        Returns:
            {"type": str, "pattern": str, "factor": float|int} o None
        """
        params = proc_def.get("params", [])
        if not params:
            return None
        
        args = call.get("args", [])
        if not args:
            return None
        
        # Estrategia 0: Detectar reducción de rango cuando los parámetros son inicio/fin
        # Ejemplo: invertirArray(A, inicio, fin) con llamada (A, inicio + 1, fin - 1)
        # El tamaño es fin - inicio + 1, y se reduce en 2 (inicio + 1, fin - 1)
        range_reduction = self._detect_range_reduction(args, params)
        if range_reduction:
            return range_reduction
        
        # Obtener el nombre del primer parámetro (usualmente el tamaño)
        first_param = params[0]
        if isinstance(first_param, dict):
            first_param_name = first_param.get("name", "")
            # Verificar si el primer parámetro es un array (tiene corchetes en el nombre o es arrayParam)
            first_param_is_array = "[" in first_param_name or first_param.get("type", "").lower() == "arrayparam"
        else:
            first_param_name = str(first_param)
            first_param_is_array = "[" in first_param_name
        
        # Si el primer parámetro es un array, buscar el tamaño en los siguientes parámetros
        # Ejemplo: sumaArray(A[n], n) -> el tamaño es el segundo parámetro 'n'
        size_param_index = 0
        size_param_name = first_param_name
        
        if first_param_is_array and len(params) > 1:
            # El tamaño probablemente está en el segundo parámetro
            size_param = params[1]
            if isinstance(size_param, dict):
                size_param_name = size_param.get("name", "")
            else:
                size_param_name = str(size_param)
            size_param_index = 1
        elif not first_param_is_array and len(params) > 1:
            # Si el primer parámetro NO es un array pero hay dos parámetros,
            # verificar si el segundo parámetro parece ser el tamaño
            # (nombres comunes como 'n', 'size', 'length', etc.)
            second_param = params[1]
            if isinstance(second_param, dict):
                second_param_name = second_param.get("name", "").lower()
                # Si el segundo parámetro tiene un nombre común de tamaño, usarlo
                if second_param_name in ["n", "size", "length", "len", "tam", "tamaño"]:
                    size_param_name = second_param.get("name", "")
                    size_param_index = 1
        
        # Analizar argumentos buscando el que corresponde al tamaño
        # Si el primer parámetro es array, buscar en args[1], sino en args[0]
        # Pero si detectamos que el tamaño está en el segundo parámetro, buscar en args[1]
        size_arg_index = size_param_index if size_param_index < len(args) else 0
        size_arg = args[size_arg_index] if size_arg_index < len(args) else None
        
        if size_arg and isinstance(size_arg, dict):
            arg_type = size_arg.get("type", "").lower()
            
            # Caso: n - 1 o n - k (BinaryExpression con operador -)
            if arg_type == "binary":
                op = size_arg.get("op", "")
                
                if op == "-":
                    left = size_arg.get("left", {})
                    right = size_arg.get("right", {})
                    
                    # Verificar que left es el parámetro de tamaño
                    if isinstance(left, dict):
                        left_name = left.get("name", "") or left.get("id", "")
                        if left_name == size_param_name:
                            # Extraer el valor de resta
                            if isinstance(right, dict) and right.get("type", "").lower() == "literal":
                                value = right.get("value", 1)
                                return {
                                    "type": "subtraction",
                                    "pattern": f"n-{value}",
                                    "factor": value
                                }
                            elif isinstance(right, dict) and right.get("type", "").lower() == "identifier":
                                # Es n - k donde k es una variable
                                return {
                                    "type": "subtraction",
                                    "pattern": "n-k",
                                    "factor": 1  # Asumimos 1 por defecto
                                }
                
                # Caso: n / 2 o n / c (BinaryExpression con operador /)
                elif op == "/":
                    left = size_arg.get("left", {})
                    right = size_arg.get("right", {})
                    
                    if isinstance(left, dict):
                        left_name = left.get("name", "") or left.get("id", "")
                        if left_name == size_param_name:
                            # Extraer el factor de división
                            if isinstance(right, dict) and right.get("type", "").lower() == "literal":
                                value = right.get("value", 2)
                                return {
                                    "type": "division",
                                    "pattern": f"n/{value}",
                                    "factor": value
                                }
                        # También verificar si left es una expresión (inicio + fin) / 2
                        elif self._is_range_halving_pattern(size_arg, params):
                            return {
                                "type": "range_halving",
                                "pattern": "(inicio+fin)/2",
                                "factor": 2
                            }
            
            # Caso: parámetro directo sin modificación (n)
            elif arg_type == "identifier":
                arg_name = size_arg.get("name", "") or size_arg.get("id", "")
                if arg_name == size_param_name:
                    # No es decrease-and-conquer, es recursión directa
                    return None
        
        return None
    
    def _is_range_halving_pattern(self, expr: Dict[str, Any], params: List[Any]) -> bool:
        """
        Detecta si una expresión es del tipo (inicio + fin) / 2.
        
        Args:
            expr: Expresión binaria
            params: Parámetros del procedimiento
            
        Returns:
            True si es un patrón de range halving
        """
        if not isinstance(expr, dict):
            return False
        
        op = expr.get("op", "")
        if op == "/":
            left = expr.get("left", {})
            right = expr.get("right", {})
            
            # Verificar que right es 2
            if isinstance(right, dict) and right.get("type", "").lower() == "literal":
                if right.get("value") == 2:
                    # Verificar que left es una suma de dos parámetros
                    if isinstance(left, dict) and left.get("op", "") == "+":
                        return True
        
        return False
    
    def _detect_range_reduction(self, args: List[Any], params: List[Any]) -> Optional[Dict[str, Any]]:
        """
        Detecta reducción de rango cuando los parámetros son inicio/fin.
        
        Ejemplo: invertirArray(A, inicio, fin) con llamada (A, inicio + 1, fin - 1)
        El tamaño es fin - inicio + 1, y se reduce en 2.
        
        Args:
            args: Argumentos de la llamada recursiva
            params: Parámetros del procedimiento
            
        Returns:
            {"type": "subtraction", "pattern": str, "factor": int} o None
        """
        if len(args) < 3 or len(params) < 3:
            return None
        
        # Buscar parámetros que parezcan inicio/fin (ignorar el primero que suele ser el array)
        param_info = []
        for i, param in enumerate(params[1:], start=1):  # Saltar el primer parámetro (array)
            if isinstance(param, dict):
                param_name = param.get("name", "")
            else:
                param_name = str(param)
            param_info.append({"index": i, "name": param_name, "name_lower": param_name.lower()})
        
        # Nombres comunes para inicio/fin
        inicio_keywords = ["inicio", "izq", "left", "start", "begin", "low"]
        fin_keywords = ["fin", "der", "right", "end", "high"]
        
        # Buscar si hay un par inicio/fin en los parámetros
        inicio_param = None
        fin_param = None
        
        for param in param_info:
            name_lower = param["name_lower"]
            if any(keyword in name_lower for keyword in inicio_keywords):
                inicio_param = param
            elif any(keyword in name_lower for keyword in fin_keywords):
                fin_param = param
        
        if inicio_param is None or fin_param is None:
            return None
        
        inicio_idx = inicio_param["index"]
        fin_idx = fin_param["index"]
        
        # Verificar que los argumentos correspondientes son expresiones binarias
        if inicio_idx >= len(args) or fin_idx >= len(args):
            return None
        
        inicio_arg = args[inicio_idx]
        fin_arg = args[fin_idx]
        
        # Verificar que inicio_arg es una suma (inicio + k)
        if not isinstance(inicio_arg, dict) or inicio_arg.get("type", "").lower() != "binary":
            return None
        
        inicio_op = inicio_arg.get("op", "")
        if inicio_op != "+":
            return None
        
        inicio_left = inicio_arg.get("left", {})
        inicio_right = inicio_arg.get("right", {})
        
        # Verificar que left es el parámetro inicio
        if isinstance(inicio_left, dict):
            inicio_left_name = (inicio_left.get("name") or inicio_left.get("id", "")).lower()
            if inicio_left_name != inicio_param["name_lower"]:
                return None
        
        # Extraer el valor de k de inicio + k
        if isinstance(inicio_right, dict) and inicio_right.get("type", "").lower() == "literal":
            k_value = inicio_right.get("value", 0)
        else:
            return None
        
        # Verificar que fin_arg es una resta (fin - k)
        if not isinstance(fin_arg, dict) or fin_arg.get("type", "").lower() != "binary":
            return None
        
        fin_op = fin_arg.get("op", "")
        if fin_op != "-":
            return None
        
        fin_left = fin_arg.get("left", {})
        fin_right = fin_arg.get("right", {})
        
        # Verificar que left es el parámetro fin
        if isinstance(fin_left, dict):
            fin_left_name = (fin_left.get("name") or fin_left.get("id", "")).lower()
            if fin_left_name != fin_param["name_lower"]:
                return None
        
        # Verificar que right es el mismo k
        if isinstance(fin_right, dict) and fin_right.get("type", "").lower() == "literal":
            fin_k_value = fin_right.get("value", 0)
            if fin_k_value != k_value:
                return None
        else:
            return None
        
        # El tamaño se reduce en 2k (inicio + k, fin - k)
        reduction = 2 * k_value
        
        return {
            "type": "subtraction",
            "pattern": f"n-{reduction}",
            "factor": reduction
        }
    
    def _combines_multiple_results(self, proc_def: Dict[str, Any], recursive_calls: List[Dict[str, Any]]) -> bool:
        """
        Verifica si el algoritmo combina múltiples resultados recursivos.
        
        Por ejemplo: return T(n/2) + T(n/2) no es válido para iteración.
        Pero: return T(n-1) + n es válido.
        
        Args:
            proc_def: Nodo ProcDef del procedimiento
            recursive_calls: Lista de llamadas recursivas
            
        Returns:
            True si combina múltiples resultados recursivos
        """
        # Si hay más de una llamada recursiva, definitivamente combina múltiples resultados
        if len(recursive_calls) > 1:
            return True
        
        # Buscar returns que sumen múltiples llamadas recursivas
        body = proc_def.get("body", {})
        
        # Buscar nodos Return
        returns = self._find_return_statements(body)
        
        for ret in returns:
            ret_expr = ret.get("expr", {})
            if self._contains_multiple_recursive_calls(ret_expr, self.procedure_name):
                return True
        
        return False
    
    def _find_return_statements(self, node: Any) -> List[Dict[str, Any]]:
        """
        Encuentra todos los statements Return en el AST.
        
        Args:
            node: Nodo del AST
            
        Returns:
            Lista de nodos Return
        """
        returns = []
        
        if not isinstance(node, dict):
            return returns
        
        node_type = node.get("type", "")
        if node_type == "Return":
            returns.append(node)
        
        # Buscar recursivamente
        for key, value in node.items():
            if key in ["type", "pos"]:
                continue
            if isinstance(value, list):
                for item in value:
                    returns.extend(self._find_return_statements(item))
            elif isinstance(value, dict):
                returns.extend(self._find_return_statements(value))
        
        return returns
    
    def _contains_multiple_recursive_calls(self, expr: Any, proc_name: str) -> bool:
        """
        Verifica si una expresión contiene múltiples llamadas recursivas.
        
        Args:
            expr: Expresión a analizar
            proc_name: Nombre del procedimiento recursivo
            
        Returns:
            True si contiene más de una llamada recursiva
        """
        if not isinstance(expr, dict):
            return False
        
        # Contar llamadas recursivas en la expresión
        calls = []
        self._collect_recursive_calls(expr, proc_name, calls)
        
        return len(calls) > 1
    
    def _apply_iteration_method(self) -> Dict[str, Any]:
        """
        Aplica el Método de Iteración (Unrolling) a la recurrencia extraída.
        
        Implementa los 7 pasos del método:
        1. Identificar la recurrencia T(n) = T(g(n)) + f(n)
        2. Expandir una vez
        3. Expandir k veces (patrón general)
        4. Determinar k en el caso base
        5. Sustituir k en la suma
        6. Evaluar la sumatoria
        7. Simplificar a Θ(·)
        
        Returns:
            {"success": bool, "iteration": dict, "reason": str}
        """
        if not self.recurrence:
            return {
                "success": False,
                "reason": "No hay recurrencia extraída"
            }
        
        self.proof_steps.append({"id": "iteration_start", "text": "\\text{Aplicando Método de Iteración (Unrolling)}"})
        
        # Paso 1: Identificar la recurrencia
        a = self.recurrence["a"]
        f_n_str = self.recurrence["f"]
        n0 = self.recurrence["n0"]
        
        # Obtener información del subproblema
        proc_def = self._find_main_procedure({"body": []})  # Necesitamos acceso al proc_def
        # Por ahora, inferir g(n) desde la forma de la recurrencia
        recurrence_form = self.recurrence.get("form", "")
        
        # Extraer g(n) de la forma T(n) = T(g(n)) + f(n)
        g_n_info = self._extract_g_function()
        if not g_n_info:
            return {
                "success": False,
                "reason": "No se pudo extraer la función g(n)"
            }
        
        g_type = g_n_info["type"]
        g_pattern = g_n_info["pattern"]
        has_multiple = g_n_info.get("has_multiple_terms", False)
        
        # Verificar si la recurrencia tiene coeficiente a > 1 para el mismo término (ej: Torres de Hanoi T(n) = 2T(n-1) + 1)
        recurrence_form = self.recurrence.get("form", "")
        has_coefficient = a > 1 and not has_multiple
        
        # Si hay múltiples términos recursivos (ej: Fibonacci), usar análisis especial
        if has_multiple:
            self.proof_steps.append({"id": "step1", "text": f"\\text{{Paso 1: Recurrencia identificada }} {recurrence_form}"})
            
            # Detectar si es Fibonacci (T(n) = T(n-1) + T(n-2) + f(n))
            all_factors = g_n_info.get("all_factors", [])
            if all_factors and set(all_factors) == {1, 2}:
                # Caso Fibonacci: T(n) = T(n-1) + T(n-2) + f(n)
                self.proof_steps.append({
                    "id": "step1_note", 
                    "text": "\\text{Nota: Esta es una recurrencia lineal de segundo orden (tipo Fibonacci). Se requiere análisis especial.}"
                })
                
                # Usar análisis de árbol de recursión aproximado
                # En el árbol de Fibonacci, cada nodo tiene 2 hijos (T(n-1) y T(n-2))
                # La altura aproximada es n (cada nivel reduce en 1 o 2)
                # El número de nodos en el peor caso es O(2^n)
                self.proof_steps.append({
                    "id": "step2", 
                    "text": "\\text{Paso 2: Análisis del árbol de recursión} \\\\ \\text{Cada llamada genera 2 subproblemas (T(n-1) y T(n-2))}"
                })
                self.proof_steps.append({
                    "id": "step3", 
                    "text": "\\text{Paso 3: Número de nodos} \\\\ \\text{En el nivel i, hay aproximadamente 2^i nodos}"
                })
                self.proof_steps.append({
                    "id": "step4", 
                    "text": "\\text{Paso 4: Altura del árbol} \\\\ \\text{La altura aproximada es } \\Theta(n) \\text{ (cada nivel reduce en 1 o 2)}"
                })
                self.proof_steps.append({
                    "id": "step5", 
                    "text": "\\text{Paso 5: Cálculo del costo total} \\\\ \\sum_{i=0}^{n} 2^i = 2^{n+1} - 1 = O(2^n)"
                })
                
                # Para Fibonacci, la complejidad exacta es Θ(φ^n) donde φ es el número áureo
                # Pero comúnmente se usa O(2^n) como cota superior
                theta = "2^n"
                summation_result = {
                    "expression": "T(n) = \\sum_{i=0}^{n} 2^i",
                    "evaluated": "2^{n+1} - 1",
                    "theta": theta
                }
                
                self.proof_steps.append({
                    "id": "step6", 
                    "text": f"\\text{{Paso 6: Resultado }} T(n) = \\Theta({theta}) \\\\ \\text{{(cota superior. La complejidad exacta es }} \\Theta(\\phi^n) \\text{{ donde }} \\phi \\approx 1.618 \\text{{ es el número áureo)}}"
                })
                self.proof_steps.append({"id": "step7", "text": f"\\text{{Paso 7: Resultado final }} T(n) = \\Theta({theta})"})
                
                # Construir resultado con expansiones aproximadas
                expansions = [
                    "T(n) = T(n-1) + T(n-2) + (1)",
                    "T(n) = [T(n-2) + T(n-3)] + [T(n-3) + T(n-4)] + (1) + (1)",
                    "T(n) = [T(n-3) + T(n-4)] + [T(n-4) + T(n-5)] + [T(n-4) + T(n-5)] + [T(n-5) + T(n-6)] + ..."
                ]
                general_form = "T(n) = \\sum_{i=0}^{n} 2^i \\approx O(2^n)"
                
            else:
                # Otro tipo de recurrencia con múltiples términos
                self.proof_steps.append({
                    "id": "step1_note", 
                    "text": "\\text{Nota: Esta recurrencia tiene múltiples términos recursivos y requiere técnicas especiales.}"
                })
                # Intentar análisis básico
                theta = "n^2"  # Aproximación conservadora
                summation_result = {
                    "expression": recurrence_form,
                    "evaluated": "Análisis complejo requerido",
                    "theta": theta
                }
                expansions = [recurrence_form]
                general_form = recurrence_form
                self.proof_steps.append({"id": "step7", "text": f"\\text{{Paso 7: Resultado aproximado }} T(n) = O({theta})"})
        elif has_coefficient:
            # Caso especial: T(n) = aT(n-1) + f(n) con a > 1 (ej: Torres de Hanoi T(n) = 2T(n-1) + 1)
            self.proof_steps.append({"id": "step1", "text": f"\\text{{Paso 1: Recurrencia identificada }} {recurrence_form}"})
            self.proof_steps.append({
                "id": "step1_note", 
                "text": f"\\text{{Nota: Esta recurrencia tiene coeficiente }} a={a} > 1 \\text{{. Se requiere análisis especial.}}"
            })
            
            # Para T(n) = aT(n-1) + f(n), el método de iteración da:
            # T(n) = aT(n-1) + f(n)
            # T(n) = a[aT(n-2) + f(n-1)] + f(n) = a^2T(n-2) + af(n-1) + f(n)
            # T(n) = a^3T(n-3) + a^2f(n-2) + af(n-1) + f(n)
            # ...
            # T(n) = a^kT(n-k) + sum_{i=0}^{k-1} a^i f(n-i)
            # Cuando n-k = 1 (caso base), k = n-1
            # T(n) = a^{n-1}T(1) + sum_{i=0}^{n-2} a^i f(n-i)
            
            # Si f(n) = 1 (constante):
            # T(n) = a^{n-1} * 1 + sum_{i=0}^{n-2} a^i * 1
            # T(n) = a^{n-1} + (a^{n-1} - 1)/(a - 1)
            # T(n) = a^n/(a-1) - 1/(a-1) + a^{n-1}
            # Para a > 1, el término dominante es a^n
            # T(n) = Θ(a^n)
            
            self.proof_steps.append({
                "id": "step2", 
                "text": f"\\text{{Paso 2: Expansión}} \\\\ T(n) = {a}T(n-1) + {f_n_str} = {a}[{a}T(n-2) + {f_n_str}|_{{n-1}}] + {f_n_str} = {a}^2T(n-2) + {a}{f_n_str}|_{{n-1}} + {f_n_str}"
            })
            self.proof_steps.append({
                "id": "step3", 
                "text": f"\\text{{Paso 3: Forma general}} \\\\ T(n) = {a}^kT(n-k) + \\sum_{{i=0}}^{{k-1}} {a}^i \\cdot {f_n_str}|_{{n-i}}"
            })
            self.proof_steps.append({
                "id": "step4", 
                "text": f"\\text{{Paso 4: Caso base}} \\\\ n-k = {n0} \\Rightarrow k = n-{n0}"
            })
            
            # Evaluar según f(n)
            if f_n_str.strip().lower() == "1" or f_n_str.strip().lower() == "c":
                # f(n) = 1 (constante)
                self.proof_steps.append({
                    "id": "step5", 
                    "text": f"\\text{{Paso 5: Evaluación de la sumatoria}} \\\\ T(n) = {a}^{{n-{n0}}}T({n0}) + \\sum_{{i=0}}^{{n-{n0}-1}} {a}^i"
                })
                self.proof_steps.append({
                    "id": "step6", 
                    "text": f"\\text{{Paso 6: Resultado}} \\\\ T(n) = {a}^{{n-{n0}}} + \\frac{{{a}^{{n-{n0}}} - 1}}{{{a} - 1}} = \\frac{{{a}^{{n-{n0}+1}} - 1}}{{{a} - 1}} = \\Theta({a}^n)"
                })
                theta = f"{a}^n"
                summation_result = {
                    "expression": f"T(n) = {a}^{{n-{n0}}} + \\sum_{{i=0}}^{{n-{n0}-1}} {a}^i",
                    "evaluated": f"\\frac{{{a}^{{n-{n0}+1}} - 1}}{{{a} - 1}}",
                    "theta": theta
                }
            else:
                # f(n) no constante - análisis más complejo
                theta = f"{a}^n"  # Aproximación conservadora
                summation_result = {
                    "expression": recurrence_form,
                    "evaluated": f"Análisis complejo (término dominante {a}^n)",
                    "theta": theta
                }
                self.proof_steps.append({
                    "id": "step6", 
                    "text": f"\\text{{Paso 6: Resultado aproximado}} \\\\ T(n) = \\Theta({theta})"
                })
            
            self.proof_steps.append({"id": "step7", "text": f"\\text{{Paso 7: Resultado final }} T(n) = \\Theta({theta})"})
            
            # Construir expansiones aproximadas
            expansions = [
                f"T(n) = {a}T(n-1) + ({f_n_str})",
                f"T(n) = {a}^2T(n-2) + {a}({f_n_str}|_{{n-1}}) + ({f_n_str})",
                f"T(n) = {a}^3T(n-3) + {a}^2({f_n_str}|_{{n-2}}) + {a}({f_n_str}|_{{n-1}}) + ({f_n_str})"
            ]
            general_form = f"T(n) = {a}^kT(n-k) + \\sum_{{i=0}}^{{k-1}} {a}^i \\cdot {f_n_str}|_{{n-i}}"
        else:
            self.proof_steps.append({"id": "step1", "text": f"\\text{{Paso 1: Recurrencia identificada }} T(n) = T({g_pattern}) + f(n)"})
            
            # Paso 2: Expandir una vez
            expansions = self._expand_recurrence(g_n_info, f_n_str, num_expansions=3)
            
            if len(expansions) > 0:
                self.proof_steps.append({"id": "step2", "text": f"\\text{{Paso 2: Primera expansión }} {expansions[0]}"})
            
            if len(expansions) > 1:
                self.proof_steps.append({"id": "step2b", "text": f"\\text{{Segunda expansión }} {expansions[1]}"})
            
            # Paso 3: Expresar forma general con k
            general_form = self._create_general_form(g_n_info, f_n_str)
            self.proof_steps.append({"id": "step3", "text": f"\\text{{Paso 3: Forma general }} {general_form}"})
            
            # Paso 4: Determinar k en el caso base
            k_expr = self._determine_k_from_base_case(g_n_info, n0)
            self.proof_steps.append({"id": "step4", "text": f"\\text{{Paso 4: Caso base }} {g_pattern} = {n0} \\Rightarrow k = {k_expr}"})
            
            # Paso 5: Sustituir k en la suma
            substituted_form = self._substitute_k_in_summation(g_n_info, f_n_str, k_expr, n0)
            self.proof_steps.append({"id": "step5", "text": f"\\text{{Paso 5: Sustitución }} {substituted_form}"})
            
            # Paso 6: Evaluar la sumatoria
            summation_result = self._solve_summation(g_n_info, f_n_str, k_expr)
            self.proof_steps.append({"id": "step6", "text": f"\\text{{Paso 6: Evaluación }} {summation_result['evaluated']}"})
            
            # Paso 7: Simplificar a notación asintótica
            theta = summation_result["theta"]
            self.proof_steps.append({"id": "step7", "text": f"\\text{{Paso 7: Resultado }} T(n) = \\Theta({theta})"})
        
        # Construir resultado
        if has_multiple or has_coefficient:
            # Para múltiples términos o coeficiente > 1, construir estructura especial
            if has_coefficient:
                k_expr = f"n-{n0}"
            else:
                k_expr = "n"
            iteration = {
                "method": "iteration",
                "g_function": recurrence_form if has_multiple else g_pattern,
                "expansions": expansions,
                "general_form": general_form,
                "base_case": {
                    "condition": f"n = {n0}" if has_multiple else f"{g_pattern} = {n0}",
                    "k": k_expr
                },
                "summation": summation_result,
                "theta": f"\\Theta({theta})"
            }
        else:
            # Para un solo término, usar estructura normal
            k_expr = self._determine_k_from_base_case(g_n_info, n0)
            substituted_form = self._substitute_k_in_summation(g_n_info, f_n_str, k_expr, n0)
            iteration = {
                "method": "iteration",
                "g_function": g_pattern,
                "expansions": expansions,
                "general_form": general_form,
                "base_case": {
                    "condition": f"{g_pattern} = {n0}",
                    "k": k_expr
                },
                "summation": {
                    "expression": substituted_form,
                    "evaluated": summation_result["evaluated"]
                },
                "theta": f"\\Theta({theta})"
            }
        
        return {
            "success": True,
            "iteration": iteration
        }
    
    def _extract_g_function(self) -> Optional[Dict[str, Any]]:
        """
        Extrae la función g(n) de la recurrencia almacenada.
        
        Para casos con múltiples términos recursivos (ej: T(n) = T(n-1) + T(n-2)),
        detecta correctamente todos los términos.
        
        Returns:
            {"type": str, "pattern": str, "factor": float, "has_multiple_terms": bool, "all_factors": list} o None
        """
        # Analizar la forma de la recurrencia para extraer g(n)
        form = self.recurrence.get("form", "")
        
        # Buscar patrón T(n-k), T(n/k), etc.
        import re
        
        # Patrón para n-k (puede haber múltiples)
        # findall con un grupo devuelve solo el grupo capturado (el número)
        matches = re.findall(r'T\(n-(\d+)\)', form)
        if matches:
            # Extraer todos los factores
            factors = [int(m) for m in matches]
            # Si hay múltiples factores distintos, es un caso especial (ej: Fibonacci)
            unique_factors = sorted(set(factors))
            has_multiple = len(unique_factors) > 1
            
            # Usar el factor más pequeño como patrón principal
            k = min(factors) if factors else 1
            
            return {
                "type": "subtraction",
                "pattern": f"n-{k}",
                "factor": k,
                "has_multiple_terms": has_multiple,
                "all_factors": unique_factors if has_multiple else None
            }
        
        # Patrón para n/k
        matches = re.findall(r'T\(n/(\d+)\)', form)
        if matches:
            factors = [int(m) for m in matches]
            unique_factors = sorted(set(factors))
            has_multiple = len(unique_factors) > 1
            k = factors[0]  # Usar el primero
            return {
                "type": "division",
                "pattern": f"n/{k}",
                "factor": k,
                "has_multiple_terms": has_multiple,
                "all_factors": unique_factors if has_multiple else None
            }
        
        # Por defecto, asumir n-1
        return {
            "type": "subtraction",
            "pattern": "n-1",
            "factor": 1,
            "has_multiple_terms": False
        }
    
    def _expand_recurrence(self, g_n_info: Dict[str, Any], f_n: str, num_expansions: int = 3) -> List[str]:
        """
        Genera expansiones simbólicas de la recurrencia.
        
        Args:
            g_n_info: Información de la función g(n)
            f_n: Función f(n)
            num_expansions: Número de expansiones a generar
            
        Returns:
            Lista de strings LaTeX con las expansiones
        """
        g_type = g_n_info["type"]
        g_pattern = g_n_info["pattern"]
        factor = g_n_info["factor"]
        
        expansions = []
        
        if g_type == "subtraction":
            # T(n) = T(n-1) + f(n)
            # T(n) = T(n-2) + f(n-1) + f(n)
            # T(n) = T(n-3) + f(n-2) + f(n-1) + f(n)
            for i in range(1, num_expansions + 1):
                terms = []
                # Agregar T(n-i)
                terms.append(f"T(n-{i})")
                # Agregar suma de f(n-j) para j = 0..i-1
                f_terms = []
                for j in range(i):
                    if j == 0:
                        f_terms.append(f"({f_n})")
                    else:
                        f_terms.append(f"({f_n}|_{{n-{j}}})")
                terms.append(" + ".join(f_terms))
                
                expansion = f"T(n) = {' + '.join(terms)}"
                expansions.append(expansion)
        
        elif g_type == "division":
            # T(n) = T(n/2) + f(n)
            # T(n) = T(n/4) + f(n/2) + f(n)
            for i in range(1, num_expansions + 1):
                denominator = factor ** i
                terms = []
                terms.append(f"T(n/{denominator})")
                # Agregar suma de f(n/2^j) para j = 0..i-1
                f_terms = []
                for j in range(i):
                    if j == 0:
                        f_terms.append(f"({f_n})")
                    else:
                        denom_j = factor ** j
                        f_terms.append(f"({f_n}|_{{n/{denom_j}}})")
                terms.append(" + ".join(f_terms))
                
                expansion = f"T(n) = {' + '.join(terms)}"
                expansions.append(expansion)
        
        return expansions
    
    def _create_general_form(self, g_n_info: Dict[str, Any], f_n: str) -> str:
        """
        Crea la forma general T(n) = T(g^k(n)) + Σ f(g^i(n)).
        
        Args:
            g_n_info: Información de la función g(n)
            f_n: Función f(n)
            
        Returns:
            String LaTeX con la forma general
        """
        g_type = g_n_info["type"]
        factor = g_n_info["factor"]
        
        if g_type == "subtraction":
            return f"T(n) = T(n-k) + \\sum_{{i=0}}^{{k-1}} ({f_n})|_{{n-i}}"
        elif g_type == "division":
            return f"T(n) = T(n/{factor}^k) + \\sum_{{i=0}}^{{k-1}} ({f_n})|_{{n/{factor}^i}}"
        else:
            return f"T(n) = T(g^k(n)) + \\sum_{{i=0}}^{{k-1}} f(g^i(n))"
    
    def _determine_k_from_base_case(self, g_n_info: Dict[str, Any], n0: int) -> str:
        """
        Determina el valor de k cuando se alcanza el caso base.
        
        Args:
            g_n_info: Información de la función g(n)
            n0: Tamaño del caso base
            
        Returns:
            Expresión LaTeX para k
        """
        g_type = g_n_info["type"]
        factor = g_n_info["factor"]
        
        if g_type == "subtraction":
            # n - k = n0 => k = n - n0
            if n0 == 1:
                return "n-1"
            else:
                return f"n-{n0}"
        elif g_type == "division":
            # n / c^k = n0 => k = log_c(n/n0)
            if n0 == 1:
                return f"\\log_{{{factor}}}(n)"
            else:
                return f"\\log_{{{factor}}}(n/{n0})"
        else:
            return "k"
    
    def _substitute_k_in_summation(self, g_n_info: Dict[str, Any], f_n: str, k_expr: str, n0: int) -> str:
        """
        Sustituye k en la sumatoria.
        
        Args:
            g_n_info: Información de la función g(n)
            f_n: Función f(n)
            k_expr: Expresión para k
            n0: Tamaño del caso base
            
        Returns:
            String LaTeX con la sustitución
        """
        g_type = g_n_info["type"]
        factor = g_n_info["factor"]
        
        if g_type == "subtraction":
            return f"T(n) = T({n0}) + \\sum_{{i=0}}^{{{k_expr}}} ({f_n})|_{{n-i}}"
        elif g_type == "division":
            return f"T(n) = T({n0}) + \\sum_{{i=0}}^{{{k_expr}}} ({f_n})|_{{n/{factor}^i}}"
        else:
            return f"T(n) = T({n0}) + \\sum f(\\cdot)"
    
    def _solve_summation(self, g_n_info: Dict[str, Any], f_n: str, k_expr: str) -> Dict[str, str]:
        """
        Evalúa la sumatoria y simplifica a notación asintótica.
        
        Args:
            g_n_info: Información de la función g(n)
            f_n: Función f(n)
            k_expr: Expresión para k
            
        Returns:
            {"evaluated": str, "theta": str}
        """
        g_type = g_n_info["type"]
        factor = g_n_info["factor"]
        
        # Simplificar f(n) para análisis
        f_simplified = f_n.strip().lower()
        
        # Detectar el tipo de sumatoria
        if f_simplified == "1" or f_simplified == "c":
            # Sumatoria constante: Σ c = c * k
            if g_type == "subtraction":
                evaluated = f"\\Theta(n)"
                theta = "n"
            else:  # division
                evaluated = f"\\Theta(\\log n)"
                theta = "\\log n"
        
        elif f_simplified == "n" or "n" in f_simplified:
            # Sumatoria aritmética o geométrica
            if g_type == "subtraction":
                # Σ (n-i) para i=0..n-1 = n + (n-1) + ... + 1 = n(n+1)/2
                evaluated = f"\\sum_{{i=0}}^{{n-1}} (n-i) = \\frac{{n(n+1)}}{{2}}"
                theta = "n^2"
            else:  # division
                # Σ n/2^i para i=0..log(n) ≈ 2n (serie geométrica)
                evaluated = f"\\sum_{{i=0}}^{{\\log n}} n/{factor}^i \\approx 2n"
                theta = "n"
        
        elif "^" in f_simplified or "2" in f_simplified:
            # Polinomio de grado superior
            if g_type == "subtraction":
                evaluated = f"\\Theta(n^3)"
                theta = "n^3"
            else:
                evaluated = f"\\Theta(n^2)"
                theta = "n^2"
        
        else:
            # Por defecto
            if g_type == "subtraction":
                evaluated = f"\\Theta(n)"
                theta = "n"
            else:
                evaluated = f"\\Theta(n)"
                theta = "n"
        
        return {
            "evaluated": evaluated,
            "theta": theta
        }
    
    # ============================================================================
    # MÉTODO DE ÁRBOL DE RECURSIÓN
    # ============================================================================
    
    def _detect_recursion_tree_method(self, proc_def: Dict[str, Any], recursive_calls: List[Dict[str, Any]], a: int, b: float) -> bool:
        """
        Detecta si debe usarse el Método de Árbol de Recursión.
        
        Reglas para usar Método de Árbol de Recursión:
        1. a ≥ 2: Hay múltiples llamadas recursivas
        2. Subproblemas uniformes: Todos tienen el mismo tamaño (mismo b)
        3. Divide-and-conquer: Estructura de dividir y combinar
        4. NO es recurrencia lineal: a ≠ 1
        5. Reducción uniforme: Todas las llamadas reciben el mismo g(n)
        6. Combina resultados: El algoritmo suma/combina costos de subproblemas
        7. Útil para visualización: Aunque se pueda usar Teorema Maestro, el árbol aporta intuición
        
        Args:
            proc_def: Nodo ProcDef del procedimiento
            recursive_calls: Lista de llamadas recursivas encontradas
            a: Número de subproblemas
            b: Factor de reducción
            
        Returns:
            True si debe usar Método de Árbol de Recursión
        """
        # Regla 1 y 4: a ≥ 2 y a ≠ 1
        if a < 2:
            return False
        
        # Regla 2: Verificar que todos los subproblemas tienen el mismo tamaño
        # Esto ya se verificó en _extract_recurrence, pero confirmamos aquí
        subproblem_sizes = []
        for call in recursive_calls:
            size_info = self._analyze_subproblem_size(call, proc_def)
            if size_info and size_info.get("b"):
                subproblem_sizes.append(size_info["b"])
        
        if not subproblem_sizes or len(set(subproblem_sizes)) > 1:
            return False
        
        # Regla 3: Verificar que es divide-and-conquer (no decrease-and-conquer)
        # Si hay subtracción (n-1, n-k), no es divide-and-conquer
        has_subtraction = any(
            self._analyze_subproblem_type(call, proc_def) and
            self._analyze_subproblem_type(call, proc_def).get("type") == "subtraction"
            for call in recursive_calls
        )
        if has_subtraction:
            return False
        
        # Regla 5: Verificar reducción uniforme (todas las llamadas usan n/b)
        # Esto ya está garantizado si b es constante
        
        # Regla 6: Verificar que combina resultados (puede ser suma, max, min, etc.)
        # Por defecto, si a ≥ 2 y es divide-and-conquer, asumimos que combina
        # (esto se puede refinar más adelante)
        
        # Regla 7: Es útil para visualización cuando a ≥ 2
        return True
    
    def _apply_recursion_tree_method(self) -> Dict[str, Any]:
        """
        Aplica el Método de Árbol de Recursión a la recurrencia extraída.
        
        Implementa los 7 pasos del método:
        1. Extraer T(n) = a·T(n/b) + f(n)
        2. Construir nivel 0 (raíz)
        3. Construir nivel i (generalización)
        4. Calcular altura h = log_b(n)
        5. Sumar costos por nivel
        6. Identificar nivel dominante
        7. Derivar Θ final
        
        Returns:
            {"success": bool, "recursion_tree": dict, "reason": str}
        """
        if not self.recurrence:
            return {
                "success": False,
                "reason": "No hay recurrencia extraída"
            }
        
        self.proof_steps.append({"id": "tree_start", "text": "\\text{Aplicando Método de Árbol de Recursión}"})
        
        # Paso 1: Extraer parámetros de la recurrencia
        a = self.recurrence["a"]
        b = self.recurrence["b"]
        f_n = self.recurrence["f"]
        n0 = self.recurrence["n0"]
        
        self.proof_steps.append({
            "id": "tree_extract",
            "text": f"T(n) = {a} \\cdot T(n/{self._simplify_number_latex(b)}) + {f_n}"
        })
        
        # Paso 2-3: Construir niveles del árbol
        levels = self._build_tree_levels(a, b, f_n, n0)
        
        # Paso 4: Calcular altura
        height_expr = f"\\log_{{{self._simplify_number_latex(b)}}}(n)"
        if n0 == 1:
            height_latex = f"h = {height_expr}"
        else:
            height_latex = f"h = {height_expr} \\approx \\log_{{{self._simplify_number_latex(b)}}}(n)"
        
        self.proof_steps.append({"id": "tree_height", "text": height_latex})
        
        # Paso 5: Calcular sumatoria
        summation_result = self._calculate_tree_sum(levels, a, b, f_n)
        
        self.proof_steps.append({
            "id": "tree_summation",
            "text": f"T(n) = \\sum_{{i=0}}^{{{height_expr}}} a^i \\cdot f(n/b^i) = {summation_result['expression']}"
        })
        
        # Paso 6: Identificar nivel dominante
        dominating_level = self._identify_dominating_level(levels, a, b, f_n)
        
        # El reason ya viene con LaTeX formateado completamente
        self.proof_steps.append({
            "id": "tree_dominating",
            "text": f"\\text{{Nivel dominante: }} {dominating_level['reason']}"
        })
        
        # Paso 7: Resultado final
        theta = summation_result.get("theta", f"\\Theta({f_n})")
        
        self.proof_steps.append({
            "id": "tree_result",
            "text": f"T(n) = {theta}"
        })
        
        # Construir tabla por niveles para UI
        table_by_levels = []
        for i, level in enumerate(levels):
            table_by_levels.append({
                "level": i,
                "num_nodes": level["num_nodes_latex"],
                "subproblem_size": level["subproblem_size_latex"],
                "cost_per_node": level["cost_per_node_latex"],
                "total_cost": level["total_cost_latex"]
            })
        
        recursion_tree = {
            "method": "recursion_tree",
            "levels": levels,
            "height": height_expr,
            "summation": summation_result,
            "dominating_level": dominating_level,
            "table_by_levels": table_by_levels,
            "theta": theta
        }
        
        return {
            "success": True,
            "recursion_tree": recursion_tree
        }
    
    def _build_tree_levels(self, a: int, b: float, f_n: str, n0: int) -> List[Dict[str, Any]]:
        """
        Construye la información de cada nivel del árbol de recursión.
        
        Args:
            a: Número de subproblemas
            b: Factor de reducción
            f_n: Función f(n) (LaTeX)
            n0: Caso base
            
        Returns:
            Lista de diccionarios con información de cada nivel
        """
        levels = []
        
        # Calcular número máximo de niveles (hasta llegar al caso base)
        # h ≈ log_b(n), pero generamos suficientes niveles para llenar el modal
        max_levels = 10  # Generar 10 niveles para visualización
        
        # Detectar si f(n) es constante para simplificar notación
        f_simplified = f_n.strip().lower()
        is_constant = f_simplified == "1" or f_simplified == "c" or f_simplified.replace(" ", "") == "c_1"
        
        for i in range(max_levels + 1):
            # Número de nodos en el nivel i: a^i
            num_nodes = a ** i
            num_nodes_latex = f"{a}^{i}" if i > 0 else "1"
            
            # Tamaño del subproblema en el nivel i: n/b^i
            if i == 0:
                subproblem_size_latex = "n"
            else:
                b_str = self._simplify_number_latex(b)
                subproblem_size_latex = f"n/{b_str}^{i}"
            
            # Costo por nodo: f(n/b^i)
            # Si f(n) es constante, no usar notación de evaluación
            if is_constant:
                cost_per_node_latex = f_n
            elif i == 0:
                cost_per_node_latex = f_n
            else:
                b_str = self._simplify_number_latex(b)
                cost_per_node_latex = f"{f_n}|_{{n/{b_str}^{i}}}"
            
            # Costo total del nivel: a^i · f(n/b^i)
            # Si f(n) es constante, simplificar a^i · c
            if is_constant:
                if i == 0:
                    total_cost_latex = f_n
                else:
                    total_cost_latex = f"{a}^{i} \\cdot {f_n}"
            elif i == 0:
                total_cost_latex = f_n
            else:
                b_str = self._simplify_number_latex(b)
                total_cost_latex = f"{a}^{i} \\cdot {f_n}|_{{n/{b_str}^{i}}}"
            
            levels.append({
                "level": i,
                "num_nodes": num_nodes,
                "num_nodes_latex": num_nodes_latex,
                "subproblem_size_latex": subproblem_size_latex,
                "cost_per_node_latex": cost_per_node_latex,
                "total_cost_latex": total_cost_latex
            })
        
        return levels
    
    def _calculate_tree_sum(self, levels: List[Dict[str, Any]], a: int, b: float, f_n: str) -> Dict[str, str]:
        """
        Calcula la sumatoria de costos por niveles.
        
        Args:
            levels: Lista de niveles del árbol
            a: Número de subproblemas
            b: Factor de reducción
            f_n: Función f(n)
            
        Returns:
            {"expression": str, "evaluated": str, "theta": str}
        """
        b_str = self._simplify_number_latex(b)
        height_expr = f"\\log_{{{b_str}}}(n)"
        
        # Evaluar según el tipo de f(n)
        f_simplified = f_n.strip().lower()
        
        # Construir expresión de la sumatoria (simplificar si f(n) es constante)
        if f_simplified == "1" or f_simplified == "c" or f_simplified.replace(" ", "") == "c_1":
            # Si f(n) es constante, no usar notación de evaluación
            expression = f"\\sum_{{i=0}}^{{{height_expr}}} {a}^i \\cdot {f_n}"
        else:
            expression = f"\\sum_{{i=0}}^{{{height_expr}}} {a}^i \\cdot {f_n}|_{{n/{b_str}^i}}"
        
        # Caso 1: f(n) = constante (1, c)
        if f_simplified == "1" or f_simplified == "c" or f_simplified.replace(" ", "") == "c_1":
            # Σ a^i · c = c · Σ a^i = c · (a^(log_b(n)+1) - 1)/(a - 1)
            # Si a = b, entonces: Σ a^i = Σ 1^i = log_b(n) + 1 ≈ log_b(n)
            # Pero el costo real es: Σ a^i = (a^(log_b(n)+1) - 1)/(a - 1)
            # Si a = b: Σ b^i = (b^(log_b(n)+1) - 1)/(b - 1) = (b·n - 1)/(b - 1) ≈ n
            if a == int(b):
                # Suma geométrica: Σ b^i desde i=0 hasta log_b(n) = (b^(log_b(n)+1) - 1)/(b - 1) = (b·n - 1)/(b - 1) = Θ(n)
                evaluated = f"{f_n} \\cdot \\sum_{{i=0}}^{{{height_expr}}} {a}^i = {f_n} \\cdot \\frac{{{a}^{{\\log_{{{b_str}}}(n)+1}} - 1}}{{{a} - 1}} = {f_n} \\cdot \\frac{{{a} \\cdot n - 1}}{{{a} - 1}}"
                theta = f"\\Theta(n)"
            else:
                # Si a ≠ b, el término dominante es a^log_b(n) = n^log_b(a)
                evaluated = f"{f_n} \\cdot \\sum_{{i=0}}^{{{height_expr}}} {a}^i = {f_n} \\cdot \\frac{{{a}^{{\\log_{{{b_str}}}(n)+1}} - 1}}{{{a} - 1}} \\approx {f_n} \\cdot n^{{\\log_{{{b_str}}} {a}}}"
                theta = f"\\Theta(n^{{\\log_{{{b_str}}} {a}}})"
        
        # Caso 2: f(n) = n (lineal)
        elif f_simplified == "n" or "n" in f_simplified and "^" not in f_simplified:
            # Σ a^i · (n/b^i) = n · Σ (a/b)^i
            # Si a = b, entonces Σ 1^i = log_b(n), entonces T(n) = n·log_b(n)
            if a == int(b):
                evaluated = f"n \\cdot \\sum_{{i=0}}^{{{height_expr}}} 1 = n \\cdot {height_expr}"
                theta = f"\\Theta(n \\log n)"
            # Si a < b, la suma converge: n · (1 - (a/b)^(log_b(n)+1))/(1 - a/b) ≈ n
            elif a < b:
                evaluated = f"n \\cdot \\sum_{{i=0}}^{{{height_expr}}} ({a}/{b_str})^i \\approx n"
                theta = f"\\Theta(n)"
            # Si a > b, domina el último nivel: n · (a/b)^(log_b(n)) ≈ n · a^log_b(n) / b^log_b(n) = n^log_b(a)
            else:
                evaluated = f"n \\cdot \\sum_{{i=0}}^{{{height_expr}}} ({a}/{b_str})^i \\approx n^{{\\log_{{{b_str}}} {a}}}"
                theta = f"\\Theta(n^{{\\log_{{{b_str}}} {a}}})"
        
        # Caso 3: f(n) = n^2 (cuadrática)
        elif "^2" in f_simplified or "n^2" in f_simplified:
            # Similar al caso anterior pero con n^2
            if a == int(b):
                evaluated = f"n^2 \\cdot \\sum_{{i=0}}^{{{height_expr}}} ({a}/{b_str}^2)^i \\approx n^2"
                theta = f"\\Theta(n^2)"
            else:
                evaluated = f"n^2 \\cdot \\sum_{{i=0}}^{{{height_expr}}} ({a}/{b_str}^2)^i"
                theta = f"\\Theta(n^2)"
        
        # Caso por defecto: usar expresión general
        else:
            evaluated = expression
            theta = f"\\Theta({f_n} \\cdot n^{{\\log_{{{b_str}}} {a}}})"
        
        return {
            "expression": expression,
            "evaluated": evaluated,
            "theta": theta
        }
    
    def _identify_dominating_level(self, levels: List[Dict[str, Any]], a: int, b: float, f_n: str) -> Dict[str, Any]:
        """
        Identifica qué nivel del árbol domina el costo total.
        
        Args:
            levels: Lista de niveles del árbol
            a: Número de subproblemas
            b: Factor de reducción
            f_n: Función f(n)
            
        Returns:
            {"level": int|str, "reason": str}
        """
        f_simplified = f_n.strip().lower()
        
        # Comparar n^log_b(a) con f(n)
        # Si f(n) = O(n^log_b(a) - ε), entonces dominan las hojas (caso 1)
        # Si f(n) = Θ(n^log_b(a)), entonces trabajo equilibrado (caso 2)
        # Si f(n) = Ω(n^log_b(a) + ε), entonces domina la raíz (caso 3)
        
        b_str = self._simplify_number_latex(b)
        nlogba = f"n^{{\\log_{{{b_str}}} {a}}}"
        height_expr = f"\\log_{{{b_str}}}(n)"
        
        # Caso: f(n) = constante
        if f_simplified == "1" or f_simplified == "c" or f_simplified.replace(" ", "") == "c_1":
            if a == int(b):
                # Cuando a=b y f(n)=constante, cada nivel tiene costo a^i·c
                # El nivel i tiene costo 3^i·c, así que los niveles más profundos tienen mayor costo
                # Pero el costo total es Θ(n) debido a la suma geométrica
                return {"level": "leaves", "reason": f"{a}^{{i}} \\text{{ (cada nodo tiene costo }} {f_n} \\text{{)}} \\\\ \\text{{Último nivel tiene costo }} \\Theta(n)"}
            else:
                if a > b:
                    return {"level": "leaves", "reason": f"\\text{{Trabajo en hojas }} {nlogba} \\\\ \\text{{Trabajo en raíz }} {f_n}"}
                else:
                    return {"level": "root", "reason": f"\\text{{Trabajo en raíz }} {f_n} \\\\ \\text{{Trabajo en hojas (}} a < b \\text{{)}}"}
        
        # Caso: f(n) = n
        elif f_simplified == "n":
            if a == int(b):
                return {"level": "all", "reason": f"\\text{{Cada nivel tiene costo }} n \\\\ \\text{{Total }} = n \\cdot \\log n"}
            elif a < b:
                return {"level": "root", "reason": f"\\text{{Trabajo en raíz }} {f_n} \\\\ \\text{{Trabajo en hojas}}"}
            else:
                return {"level": "leaves", "reason": f"\\text{{Trabajo en hojas }} {nlogba} \\\\ \\text{{Trabajo en raíz }} {f_n}"}
        
        # Caso por defecto
        else:
            return {"level": "unknown", "reason": f"\\text{{Depende de la relación entre }} {f_n} \\text{{ y }} {nlogba}"}

