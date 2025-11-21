from typing import Any, Dict, List, Optional
import math
from sympy import Expr, latex, Integer, Symbol
from .base import BaseAnalyzer


class RecursiveAnalyzer(BaseAnalyzer):
    """
    Analizador para algoritmos recursivos divide-and-conquer.
    
    Extrae recurrencias de la forma T(n) = a·T(n/b) + f(n)
    y las resuelve mediante el Teorema Maestro.
    """
    
    def __init__(self):
        super().__init__()
        self.procedure_name: Optional[str] = None
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
    
    def analyze(self, ast: Dict[str, Any], mode: str = "worst", api_key: Optional[str] = None, avg_model: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Analiza un AST recursivo y retorna el resultado con recurrencia y Teorema Maestro.
        
        Args:
            ast: AST del algoritmo a analizar
            mode: Modo de análisis ("worst", "best", "avg")
            api_key: API Key (ignorado, mantenido por compatibilidad)
            avg_model: Modelo promedio (ignorado por ahora, recursivos normalmente tienen mismo costo)
            
        Returns:
            Resultado del análisis con recurrence, master, proof, etc.
        """
        # Limpiar estado previo
        self.clear()
        self.mode = mode
        
        # 1. Encontrar el procedimiento principal
        proc_def = self._find_main_procedure(ast)
        if not proc_def:
            return {
                "ok": False,
                "errors": [{"message": "No se encontró un procedimiento principal", "line": None, "column": None}]
            }
        
        self.procedure_name = proc_def.get("name")
        
        # 2. Validar condiciones iniciales (divide-and-conquer canónico)
        validation_result = self._validate_conditions(proc_def)
        if not validation_result["valid"]:
            return {
                "ok": False,
                "errors": [{"message": f"No aplicable: {validation_result['reason']}", "line": None, "column": None}]
            }
        
        # 3. Extraer recurrencia
        extraction_result = self._extract_recurrence(proc_def)
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
        
        # 4. Aplicar método apropiado (Iteración, Árbol de Recursión o Teorema Maestro)
        method = self.recurrence.get("method", "master")
        
        if method == "iteration":
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
    
    def _extract_recurrence(self, proc_def: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extrae la recurrencia T(n) = a·T(n/b) + f(n) del procedimiento.
        
        Args:
            proc_def: Nodo ProcDef del procedimiento
            
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
        
        if not subproblem_sizes:
            return {
                "success": False,
                "reason": "No se pudieron determinar los tamaños de los subproblemas"
            }
        
        # 3. Verificar que todos los subproblemas tienen el mismo tamaño relativo
        # Distinguir entre decrease-and-conquer y divide-and-conquer
        has_subtraction = any(s.get("type") == "subtraction" for s in subproblem_sizes)
        
        if has_subtraction:
            # Para decrease-and-conquer, verificar que todos tienen el mismo patrón
            patterns = [s.get("pattern") for s in subproblem_sizes if s.get("type") == "subtraction"]
            if not patterns or len(set(patterns)) > 1:
                return {
                    "success": False,
                    "recurrence": {
                        "applicable": False,
                        "notes": ["Subproblemas de tamaños distintos"]
                    },
                    "reason": "Subproblemas de tamaños distintos"
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
        
        # 6. Detectar si debe usar Método de Iteración, Árbol de Recursión o Teorema Maestro
        use_iteration = self._detect_iteration_method(proc_def, recursive_calls)
        use_recursion_tree = False
        
        if not use_iteration:
            # Solo considerar Árbol de Recursión si no aplica Iteración
            use_recursion_tree = self._detect_recursion_tree_method(proc_def, recursive_calls, a, b)
        
        # 7. Construir recurrencia con método apropiado
        # Simplificar b para mostrar
        b_str = self._simplify_number_latex(b)
        
        if use_iteration:
            # Para método de iteración, la forma es diferente
            # Analizar el tipo de subproblema
            subproblem_info = self._analyze_subproblem_type(recursive_calls[0], proc_def)
            if subproblem_info:
                pattern = subproblem_info.get("pattern", "n-1")
                recurrence_form = f"T(n) = T({pattern}) + f(n)"
            else:
                recurrence_form = f"T(n) = T(n-1) + f(n)"
        else:
            recurrence_form = f"T(n) = {a} \\cdot T(n/{b_str}) + f(n)"
        
        # Determinar método a usar
        if use_iteration:
            method = "iteration"
        elif use_recursion_tree:
            method = "recursion_tree"
        else:
            method = "master"
        
        recurrence = {
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
            "iteration": "Método de Iteración",
            "recursion_tree": "Método de Árbol de Recursión",
            "master": "Teorema Maestro"
        }
        method_name = method_names.get(method, "Teorema Maestro")
        self.proof_steps.append({"id": "method", "text": f"\\text{{Método detectado: }} \\text{{{method_name}}}"})
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
        if work_complexity == "1":
            # Buscar llamadas a funciones que no sean recursivas
            has_auxiliary_calls = self._has_auxiliary_function_calls(body, recursive_calls)
            if has_auxiliary_calls:
                # En divide-and-conquer, las funciones auxiliares suelen ser O(n)
                # Ejemplo: merge en mergeSort, combine en otros algoritmos
                work_complexity = "n"
        
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
            Expresión de complejidad en LaTeX (n, n^2, 1, etc.)
        """
        if not isinstance(node, dict):
            return "1"
        
        node_type = node.get("type", "")
        
        # Excluir llamadas recursivas
        if node_type == "Call":
            call_name = node.get("name") or node.get("callee", "")
            if call_name and call_name.lower() == (self.procedure_name or "").lower():
                return "0"  # No cuenta trabajo recursivo
        
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
        
        expr_type = condition.get("type", "").lower()
        
        if expr_type == "binary":
            op = condition.get("operator", "")
            right = condition.get("right", {})
            
            # Verificar si es una comparación con constante
            if op in ["<=", "<", "==", "==="]:
                # Verificar si right es un número
                if isinstance(right, dict):
                    right_type = right.get("type", "").lower()
                    if right_type in ["number", "literal"]:
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
        
        # Calcular theta
        theta = self._calculate_theta(case, g_n_expr, f_n_str, log_b_a)
        
        master = {
            "case": case,
            "nlogba": nlogba,
            "comparison": comparison,
            "regularity": regularity,
            "theta": theta
        }
        
        self.proof_steps.append({"id": "conclude", "text": f"\\text{{Caso }} {case} \\Rightarrow T(n) = {theta}"})
        
        return {
            "success": True,
            "master": master
        }
    
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
        
        # Determinar T_open según el método usado
        if self.iteration:
            t_open = self.iteration.get("theta", "N/A")
        elif self.recursion_tree:
            t_open = self.recursion_tree.get("theta", "N/A")
        elif self.master:
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
        
        # Agregar resultado del método aplicado
        if self.iteration:
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
        self.recurrence = None
        self.master = None
        self.proof = []
        self.proof_steps = []
        self.iteration = None
        self.recursion_tree = None
    
    # ============================================================================
    # MÉTODO DE ITERACIÓN (UNROLLING)
    # ============================================================================
    
    def _detect_iteration_method(self, proc_def: Dict[str, Any], recursive_calls: List[Dict[str, Any]]) -> bool:
        """
        Detecta si debe usarse el Método de Iteración en lugar del Teorema Maestro.
        
        Reglas para usar Método de Iteración:
        1. Un solo llamado recursivo (a = 1)
        2. Subproblema decrease-and-conquer (n-1, n-k, n/c)
        3. No es divide-and-conquer (no múltiples subproblemas)
        4. a = 1 (no aplica Teorema Maestro típico)
        5. Subproblema estrictamente más pequeño g(n) < n
        6. No combina múltiples resultados
        
        Args:
            proc_def: Nodo ProcDef del procedimiento
            recursive_calls: Lista de llamadas recursivas encontradas
            
        Returns:
            True si debe usar Método de Iteración
        """
        # Regla 1: Un solo llamado recursivo
        if len(recursive_calls) != 1:
            return False
        
        # Regla 3 y 4: Verificar que a = 1 (no hay múltiples llamadas en ramas paralelas)
        a = self._calculate_recursive_calls_count(proc_def, recursive_calls)
        if a != 1:
            return False
        
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
        
        # Obtener el nombre del primer parámetro (usualmente el tamaño)
        first_param = params[0]
        if isinstance(first_param, dict):
            param_name = first_param.get("name", "")
        else:
            param_name = str(first_param)
        
        # Analizar primer argumento (suele ser el tamaño)
        first_arg = args[0]
        
        if isinstance(first_arg, dict):
            arg_type = first_arg.get("type", "").lower()
            
            # Caso: n - 1 o n - k (BinaryExpression con operador -)
            if arg_type == "binary":
                op = first_arg.get("op", "")
                
                if op == "-":
                    left = first_arg.get("left", {})
                    right = first_arg.get("right", {})
                    
                    # Verificar que left es el parámetro original
                    if isinstance(left, dict):
                        left_name = left.get("name", "") or left.get("id", "")
                        if left_name == param_name:
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
                    left = first_arg.get("left", {})
                    right = first_arg.get("right", {})
                    
                    if isinstance(left, dict):
                        left_name = left.get("name", "") or left.get("id", "")
                        if left_name == param_name:
                            # Extraer el factor de división
                            if isinstance(right, dict) and right.get("type", "").lower() == "literal":
                                value = right.get("value", 2)
                                return {
                                    "type": "division",
                                    "pattern": f"n/{value}",
                                    "factor": value
                                }
                        # También verificar si left es una expresión (inicio + fin) / 2
                        elif self._is_range_halving_pattern(first_arg, params):
                            return {
                                "type": "range_halving",
                                "pattern": "(inicio+fin)/2",
                                "factor": 2
                            }
            
            # Caso: parámetro directo sin modificación (n)
            elif arg_type == "identifier":
                arg_name = first_arg.get("name", "") or first_arg.get("id", "")
                if arg_name == param_name:
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
        
        Returns:
            {"type": str, "pattern": str, "factor": float} o None
        """
        # Analizar la forma de la recurrencia para extraer g(n)
        form = self.recurrence.get("form", "")
        
        # Buscar patrón T(n-k), T(n/k), etc.
        import re
        
        # Patrón para n-k
        match = re.search(r'T\((n-(\d+))\)', form)
        if match:
            k = int(match.group(2))
            return {
                "type": "subtraction",
                "pattern": f"n-{k}",
                "factor": k
            }
        
        # Patrón para n/k
        match = re.search(r'T\(n/(\d+)\)', form)
        if match:
            k = int(match.group(1))
            return {
                "type": "division",
                "pattern": f"n/{k}",
                "factor": k
            }
        
        # Por defecto, asumir n-1
        return {
            "type": "subtraction",
            "pattern": "n-1",
            "factor": 1
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

