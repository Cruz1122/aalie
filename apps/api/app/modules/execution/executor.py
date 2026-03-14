"""
Ejecutor principal que recorre el AST y genera pasos de ejecución.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""
from typing import Any, Dict, List, Optional, Union
import copy
from ..analysis.translations import get_trace_step_labels
from .environment import ExecutionEnvironment
from .trace_builder import TraceBuilder


class MaxRecursionDepthExceeded(Exception):
    """Excepción lanzada cuando se excede el límite de profundidad recursiva."""
    pass


class CodeExecutor:
    """
    Ejecutor que simula la ejecución del pseudocódigo paso a paso.
    
    Recorre el AST y genera un rastro de ejecución detallado.
    
    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """
    
    def __init__(
        self,
        ast: Dict[str, Any],
        input_size: Optional[int] = None,
        case: str = "worst",
        initial_variables: Optional[Dict[str, Any]] = None,
        max_recursion_depth: int = 100,
        locale: str = "en",
    ):
        """
        Inicializa el ejecutor.

        Args:
            ast: AST del código a ejecutar
            input_size: Tamaño de entrada concreto (ej: n=4)
            case: Caso a ejecutar ("worst", "best", "avg")
            initial_variables: Variables iniciales para el environment
            max_recursion_depth: Límite de profundidad recursiva (default: 100)
            locale: Idioma para descripciones de pasos ("en" | "es")

        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        self.ast = ast
        self.input_size = input_size
        self.case = case
        self.locale = locale if locale in ("en", "es") else "en"
        self._trace_labels = get_trace_step_labels(self.locale)
        self.environment = ExecutionEnvironment(input_size)
        
        # Cargar variables iniciales si existen
        if initial_variables:
            for name, value in initial_variables.items():
                self.environment.set_variable(name, value)
                
        self.trace_builder = TraceBuilder()
        self.current_line = 0
        # Flag para detener la ejecución cuando se alcanza un RETURN
        self.terminated = False
        
        # Control de profundidad recursiva
        self.max_recursion_depth = max_recursion_depth
        self.recursion_depth = 0
        self.recursion_truncated = False
        self.call_stack: List[Dict[str, Any]] = []  # Pila de frames de llamadas
    
    def execute(self) -> Dict[str, Any]:
        """
        Ejecuta el código y genera el rastro.
        
        Returns:
            Rastro de ejecución completo con metadatos de recursión
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        try:
            # Encontrar el procedimiento principal o ejecutar el programa
            if self.ast.get("type") == "Program":
                body = self.ast.get("body", [])
                
                # Separar ProcDefs de statements ejecutables
                proc_defs = [stmt for stmt in body if isinstance(stmt, dict) and stmt.get("type") == "ProcDef"]
                executable_stmts = [stmt for stmt in body if not (isinstance(stmt, dict) and stmt.get("type") == "ProcDef")]
                
                # Si hay statements ejecutables, ejecutarlos normalmente
                if executable_stmts:
                    for stmt in body:
                        self._execute_statement(stmt)
                # Si solo hay definiciones de procedimientos y no hay statements ejecutables
                elif proc_defs:
                    # Si hay un solo procedimiento, ejecutarlo automáticamente
                    if len(proc_defs) == 1:
                        proc_def = proc_defs[0]
                        # Mapear parámetros del procedimiento usando initial_variables
                        params = self._map_procedure_params(proc_def)
                        self._execute_procedure(proc_def, params)
                    else:
                        # Si hay múltiples procedimientos y no hay statements ejecutables,
                        # ejecutar el primero como procedimiento principal.
                        proc_def = proc_defs[0]
                        params = self._map_procedure_params(proc_def)
                        self._execute_procedure(proc_def, params)
            elif self.ast.get("type") == "ProcDef":
                # Si el AST es directamente un ProcDef, ejecutarlo con parámetros vacíos
                # pero intentar mapear desde initial_variables si están disponibles
                params = self._map_procedure_params(self.ast)
                self._execute_procedure(self.ast, params)
        except MaxRecursionDepthExceeded:
            self.recursion_truncated = True
        
        result = self.trace_builder.build()
        
        # Añadir metadatos de recursión
        if self.recursion_truncated:
            result["recursion_truncated"] = True
            result["max_depth_reached"] = self.max_recursion_depth
        
        return result
    
    def _build_linked_list_from_array(self, arr: List[Any]) -> Optional[Dict[str, Any]]:
        """Construye una lista enlazada desde un array para algoritmos tipo buscarLista."""
        if not arr:
            return None
        head: Dict[str, Any] = {"valor": arr[0], "siguiente": None}
        current = head
        for v in arr[1:]:
            node = {"valor": v, "siguiente": None}
            current["siguiente"] = node
            current = node
        return head

    def _collect_identifiers(self, node: Any, out: Optional[set] = None) -> set:
        """Recolecta identificadores usados en un nodo del AST."""
        if out is None:
            out = set()
        if isinstance(node, dict):
            node_type = node.get("type", "")
            if node_type == "Identifier":
                name = node.get("name")
                if name:
                    out.add(name)
            for key, value in node.items():
                if key == "type":
                    continue
                self._collect_identifiers(value, out)
        elif isinstance(node, list):
            for item in node:
                self._collect_identifiers(item, out)
        return out

    def _collect_array_index_identifiers(
        self,
        node: Any,
        array_param_names: List[str],
        out: Optional[set] = None,
    ) -> set:
        """Recolecta identificadores usados como indices de un array param."""
        if out is None:
            out = set()
        if isinstance(node, dict):
            node_type = node.get("type", "")
            if node_type == "Index":
                target = node.get("target", {})
                if isinstance(target, dict) and target.get("type") == "Identifier":
                    array_name = target.get("name")
                    if array_name in array_param_names:
                        index_node = node.get("index")
                        for ident in self._collect_identifiers(index_node):
                            out.add(ident)
            for key, value in node.items():
                if key == "type":
                    continue
                self._collect_array_index_identifiers(value, array_param_names, out)
        elif isinstance(node, list):
            for item in node:
                self._collect_array_index_identifiers(item, array_param_names, out)
        return out

    def _collect_array_targets(self, node: Any, out: Optional[set] = None) -> set:
        """Recolecta identificadores usados como target en accesos Index (A[i])."""
        if out is None:
            out = set()
        if isinstance(node, dict):
            node_type = node.get("type", "")
            if node_type == "Index":
                target = node.get("target", {})
                if isinstance(target, dict) and target.get("type") == "Identifier":
                    name = target.get("name")
                    if name:
                        out.add(name)
            for key, value in node.items():
                if key == "type":
                    continue
                self._collect_array_targets(value, out)
        elif isinstance(node, list):
            for item in node:
                self._collect_array_targets(item, out)
        return out

    def _contains_call(self, node: Any) -> bool:
        """Detecta si un nodo del AST contiene una llamada a procedimiento."""
        if isinstance(node, dict):
            if node.get("type") == "Call":
                return True
            for key, value in node.items():
                if key == "type":
                    continue
                if self._contains_call(value):
                    return True
        elif isinstance(node, list):
            return any(self._contains_call(item) for item in node)
        return False

    def _pick_array_value(self, preferred_names: Optional[List[str]] = None) -> Optional[List[Any]]:
        """Obtiene un array del environment priorizando nombres comunes."""
        if preferred_names:
            for name in preferred_names:
                value = self.environment.get_variable(name)
                if isinstance(value, list):
                    return value
        for value in self.environment.variables.values():
            if isinstance(value, list):
                return value
        return None

    def _map_procedure_params(self, proc_def: Dict[str, Any]) -> Dict[str, Any]:
        """
        Mapea los parámetros del procedimiento usando las variables iniciales disponibles.
        
        Incluye fallback para algoritmos de lista enlazada: si los params son (nodo, valor)
        y el environment tiene A (array) y x, construye una lista enlazada desde A.
        
        Args:
            proc_def: Nodo ProcDef del AST
            
        Returns:
            Diccionario con los parámetros mapeados
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        params_map: Dict[str, Any] = {}
        formal_params = proc_def.get("params", [])
        param_names: List[str] = []
        array_param_names: List[str] = []

        for param in formal_params:
            param_name = None

            # Extraer el nombre del parámetro según su tipo
            if isinstance(param, dict):
                if param.get("type") == "Param":
                    param_name = param.get("name")
                elif param.get("type") == "ArrayParam":
                    param_name = param.get("name")
                    if param_name:
                        array_param_names.append(param_name)
                elif param.get("type") == "ObjectParam":
                    param_name = param.get("name")
                else:
                    param_name = param.get("name")
            elif isinstance(param, str):
                param_name = param

            if param_name:
                param_names.append(param_name)
                value = self.environment.get_variable(param_name)
                if value is not None:
                    params_map[param_name] = value

        # Si no hay ArrayParam explícito, inferir array params por uso en índices
        if not array_param_names:
            body = proc_def.get("body") or proc_def
            array_targets = self._collect_array_targets(body)
            for param_name in param_names:
                if param_name in array_targets:
                    array_param_names.append(param_name)

        # Heurística: si hay params de array sin valor y existe un array en el environment
        if array_param_names:
            preferred = ["A", "arr", "array", "lista", "list"]
            for array_name in array_param_names:
                if array_name in params_map:
                    continue
                picked = self._pick_array_value(preferred)
                if picked is not None:
                    params_map[array_name] = picked

        # Inferir parametros de indices cuando se detecta un array param y uso de indices en el AST
        if array_param_names:
            body = proc_def.get("body") or proc_def
            index_params = self._collect_array_index_identifiers(body, array_param_names)
            missing_index_params = [
                p for p in param_names if p in index_params and p not in params_map
            ]

            array_len: Optional[int] = None
            for array_name in array_param_names:
                value = params_map.get(array_name)
                if isinstance(value, list):
                    array_len = len(value)
                    break
            if array_len is None:
                for value in self.environment.variables.values():
                    if isinstance(value, list):
                        array_len = len(value)
                        break
            if array_len is None and self.input_size is not None:
                try:
                    array_len = int(self.input_size)
                except Exception:
                    array_len = None

            if missing_index_params and array_len is not None:
                ordered_missing = [p for p in param_names if p in missing_index_params]
                if len(ordered_missing) >= 2:
                    params_map[ordered_missing[0]] = 1
                    params_map[ordered_missing[1]] = array_len
                elif len(ordered_missing) == 1:
                    name = ordered_missing[0].lower()
                    end_like = {"fin", "end", "right", "high", "r", "last", "final"}
                    params_map[ordered_missing[0]] = array_len if name in end_like else 1

            # Inferir inicio/fin aunque no aparezcan como índice explícito
            if array_len is not None:
                start_like = {"inicio", "start", "left", "low", "l", "izq", "from", "begin"}
                end_like = {"fin", "end", "right", "high", "r", "der", "to", "last", "final"}
                for param_name in param_names:
                    if param_name in params_map:
                        continue
                    lowered = param_name.lower()
                    if lowered in start_like:
                        params_map[param_name] = 1
                    elif lowered in end_like:
                        params_map[param_name] = array_len

        # Si aún no hay array_len (p. ej. no se detectó array param), inferir inicio/fin por nombre
        if not array_param_names:
            array_len: Optional[int] = None
            for value in self.environment.variables.values():
                if isinstance(value, list):
                    array_len = len(value)
                    break
            if array_len is None and self.input_size is not None:
                try:
                    array_len = int(self.input_size)
                except Exception:
                    array_len = None
            if array_len is not None:
                start_like = {"inicio", "start", "left", "low", "l", "izq", "from", "begin"}
                end_like = {"fin", "end", "right", "high", "r", "der", "to", "last", "final"}
                for param_name in param_names:
                    if param_name in params_map:
                        continue
                    lowered = param_name.lower()
                    if lowered in start_like:
                        params_map[param_name] = 1
                    elif lowered in end_like:
                        params_map[param_name] = array_len

        # Fallback: algoritmos de lista enlazada (buscarLista, etc.) con A y x
        if len(params_map) < len(param_names) and len(param_names) >= 2:
            arr = self.environment.get_variable("A")
            x_val = self.environment.get_variable("x")
            if isinstance(arr, list) and x_val is not None:
                first = (param_names[0] or "").lower()
                second = (param_names[1] or "").lower()
                node_like = first in ("nodo", "node", "head", "list", "raiz", "root")
                value_like = second in ("valor", "value", "key", "x", "target")
                if node_like and value_like:
                    linked = self._build_linked_list_from_array(arr)
                    if linked is not None:
                        params_map[param_names[0]] = linked
                        params_map[param_names[1]] = x_val

        return params_map
    
    def _execute_procedure(self, proc_def: Dict[str, Any], params: Dict[str, Any], return_value: Optional[Any] = None, pregenerated_call_id: Optional[str] = None) -> Any:
        """
        Ejecuta un procedimiento con soporte robusto para recursión.
        
        Args:
            proc_def: Nodo ProcDef del AST
            params: Parámetros del procedimiento
            return_value: Valor de retorno (usado internamente)
            
        Returns:
            Valor de retorno del procedimiento
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        proc_name = proc_def.get("name", "unknown")
        body = proc_def.get("body", {})
        
        # Verificar si es recursivo (se llama a sí mismo)
        is_recursive = self._is_recursive_procedure(proc_def)
        
        if is_recursive:
            # Verificar límite de profundidad
            if self.recursion_depth >= self.max_recursion_depth:
                raise MaxRecursionDepthExceeded(f"Profundidad máxima de recursión ({self.max_recursion_depth}) excedida")
            
            # Capturar profundidad actual antes de incrementar
            depth = self.recursion_depth
            
            # Generar ID de llamada (o usar el pregenerado por el padre para call_spawn_child)
            call_id = pregenerated_call_id or self.trace_builder.generate_call_id()
            
            # Parent ID ANTES de añadir nuestro frame (el padre es quien nos llamó)
            parent_id = self.call_stack[-1]["call_id"] if self.call_stack else None
            
            # Incrementar profundidad para llamadas subsecuentes
            self.recursion_depth += 1
            
            # Crear nuevo frame para la llamada
            params_snapshot = copy.deepcopy(params)
            frame = {
                "call_id": call_id,
                "proc_name": proc_name,
                "params": params_snapshot,
                "depth": depth,
                "return_value": None
            }
            self.call_stack.append(frame)
            
            # Registrar entrada a recursión
            entry_line = proc_def.get("pos", {}).get("line", 0)
            self.trace_builder.enter_recursion(
                call_id, depth, params_snapshot,
                function_name=proc_name,
                entry_line=entry_line,
                parent_call_id=parent_id,
            )
            
            # Agregar paso de entrada (call_enter)
            line = proc_def.get("pos", {}).get("line", 0)
            self.current_line = line
            self.trace_builder.add_step(
                line=line,
                kind="call",
                variables=self.environment.get_variables_snapshot(),
                recursion={
                    "depth": depth,
                    "callId": call_id,
                    "params": params_snapshot,
                    "procedure": proc_name,
                },
                description=self._trace_labels["recursive_call"].format(
                    proc_name=proc_name, depth=depth
                ),
                event_kind="call_enter",
            )
        
        # Establecer parámetros en el scope para que el cuerpo pueda usarlos
        created_scope = False
        if not is_recursive and params:
            self.environment.push_scope()
            created_scope = True
        if params:
            for param_name, param_value in params.items():
                self.environment.set_variable(param_name, param_value)

        # Ejecutar el cuerpo
        if body.get("type") == "Block":
            self._execute_block(body)
        else:
            self._execute_statement(body)
        
        # Obtener valor de retorno del frame actual si existe
        result = None
        if is_recursive and self.call_stack:
            current_frame = self.call_stack[-1]
            # Actualizar params del frame con los valores finales en el environment
            formal_params = proc_def.get("params", [])
            for param in formal_params:
                param_name = param.get("name") if isinstance(param, dict) else param
                if not param_name:
                    continue
                current_frame["params"][param_name] = copy.deepcopy(
                    self.environment.get_variable(param_name)
                )
            result = current_frame.get("return_value")
            call_id = current_frame.get("call_id")
            if call_id:
                self.trace_builder.record_return_value(call_id, result)

            # Emitir call_exit antes de cerrar el frame
            line = proc_def.get("pos", {}).get("line", 0)
            self.trace_builder.add_step(
                line=line,
                kind="call_exit",
                variables=self.environment.get_variables_snapshot(),
                recursion={
                    "depth": self.recursion_depth - 1,
                    "callId": call_id,
                    "params": current_frame.get("params", {}),
                    "procedure": proc_name,
                },
                description=f"Salida de {proc_name}",
                event_kind="call_exit",
            )

            # Registrar salida de recursión
            self.trace_builder.exit_recursion()
            
            # Pop del frame
            self.call_stack.pop()
            
            # Decrementar profundidad
            self.recursion_depth -= 1
        
        # Restaurar scope si lo creamos
        if created_scope:
            self.environment.pop_scope()
        
        return result
    
    def _execute_statement(self, stmt: Dict[str, Any]) -> None:
        """
        Ejecuta una sentencia.
        
        Args:
            stmt: Nodo de sentencia del AST
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        # Si ya se alcanzó un RETURN, no ejecutar más sentencias
        if getattr(self, "terminated", False):
            return

        if not isinstance(stmt, dict):
            return
        
        stmt_type = stmt.get("type", "").lower()
        line = stmt.get("pos", {}).get("line", 0)
        self.current_line = line
        
        if stmt_type == "assign":
            self._execute_assign(stmt)
        elif stmt_type == "for":
            self._execute_for(stmt)
        elif stmt_type == "while":
            self._execute_while(stmt)
        elif stmt_type == "repeat":
            self._execute_repeat(stmt)
        elif stmt_type == "if":
            self._execute_if(stmt)
        elif stmt_type == "return":
            self._execute_return(stmt)
        elif stmt_type == "call":
            self._execute_call(stmt)
        elif stmt_type == "print":
            self._execute_print(stmt)
        elif stmt_type == "block":
            self._execute_block(stmt)
        elif stmt_type == "decl":
            self._execute_decl(stmt)
        elif stmt_type == "procdef":
            # Las definiciones de procedimientos no se ejecutan, solo se registran
            pass
    
    def _execute_assign(self, node: Dict[str, Any]) -> None:
        """Ejecuta una asignación."""
        target = node.get("target", {})
        value_expr = node.get("value")

        # Evaluar el valor (si hay llamadas, ejecutarlas para registrar recursión)
        if value_expr is not None and self._contains_call(value_expr):
            value = self._evaluate_for_return(value_expr)
        else:
            value = self.environment.evaluate_expression(value_expr)
        
        # Obtener nombre de variable y manejar asignación a array
        var_name = None
        description_suffix = ""
        
        if isinstance(target, dict):
            if target.get("type") == "Identifier":
                var_name = target.get("name")
                self.environment.set_variable(var_name, value)
                
            elif target.get("type") == "Index":
                # Asignación a elemento de array: A[i] = val
                array_node = target.get("target", {})
                index_node = target.get("index")
                
                if array_node.get("type") == "Identifier":
                    array_name = array_node.get("name")
                    index_val = self.environment.evaluate_expression(index_node)
                    
                    # Obtener array actual
                    current_array = self.environment.get_variable(array_name)
                    
                    # Si no existe, intentar crear uno nuevo si el índice es pequeño
                    if current_array is None and isinstance(index_val, int) and 0 <= index_val < 20:
                        current_array = [0] * (index_val + 1)
                    
                    if isinstance(current_array, list) and isinstance(index_val, int):
                        idx = index_val - 1 if index_val > 0 else 0
                        # Asegurar tamaño
                        if idx >= len(current_array):
                            # Extender array si es necesario (comportamiento dinámico para pseudocódigo)
                            current_array.extend([0] * (idx - len(current_array) + 1))
                        
                        # Actualizar valor
                        current_array[idx] = value
                        self.environment.set_variable(array_name, current_array)
                        
                        var_name = f"{array_name}[{index_val}]"
                    else:
                        # Fallback simbólico
                        var_name = f"{array_name}[{self.environment.evaluate_to_string(index_node)}]"
                
                # Soporte para matrices A[i][j] = val
                elif array_node.get("type") == "Index":
                    # array_node es A[i], index_node es j
                    matrix_node = array_node.get("target", {}) # A
                    row_index_node = array_node.get("index")   # i
                    col_index_node = index_node                # j
                    
                    if matrix_node.get("type") == "Identifier":
                        matrix_name = matrix_node.get("name")
                        row_val = self.environment.evaluate_expression(row_index_node)
                        col_val = self.environment.evaluate_expression(col_index_node)
                        
                        current_matrix = self.environment.get_variable(matrix_name)
                        
                        if isinstance(current_matrix, list) and isinstance(row_val, int) and isinstance(col_val, int):
                            row_idx = row_val - 1 if row_val > 0 else 0
                            col_idx = col_val - 1 if col_val > 0 else 0
                            # Asegurar filas
                            if row_idx >= len(current_matrix):
                                current_matrix.extend([[] for _ in range(row_idx - len(current_matrix) + 1)])
                            
                            row_list = current_matrix[row_idx]
                            if not isinstance(row_list, list):
                                row_list = []
                                current_matrix[row_idx] = row_list
                            
                            # Asegurar columnas
                            if col_idx >= len(row_list):
                                row_list.extend([0] * (col_idx - len(row_list) + 1))
                            
                            row_list[col_idx] = value
                            self.environment.set_variable(matrix_name, current_matrix)
                            
                            var_name = f"{matrix_name}[{row_val}][{col_val}]"
                        else:
                            var_name = f"{matrix_name}[{self.environment.evaluate_to_string(row_index_node)}][{self.environment.evaluate_to_string(col_index_node)}]"

        # Mejorar descripción: a = j = 5
        description_parts = []
        if var_name:
            description_parts.append(var_name)
        
        # Si el valor proviene de otra variable, incluirla
        if isinstance(value_expr, dict) and value_expr.get("type") == "Identifier":
            source_var = value_expr.get("name")
            if source_var != var_name:
                description_parts.append(source_var)
        
        # Valor final (usar el valor calculado para evitar re-evaluación con variables actualizadas)
        val_str = self.environment.evaluate_to_string(value)
        description_parts.append(val_str)
        
        expr = " = ".join(description_parts)
        description = self._trace_labels["assign"].format(expr=expr)

        self.trace_builder.add_step(
            line=node.get("pos", {}).get("line", 0),
            kind="assign",
            variables=self.environment.get_variables_snapshot(),
            description=description,
            event_kind="assign",
        )
    
    def _execute_for(self, node: Dict[str, Any]) -> None:
        """Ejecuta un bucle FOR."""
        var_name = node.get("var", "i")
        start_expr = node.get("start")
        end_expr = node.get("end")
        body = node.get("body", {})
        
        # Evaluar inicio y fin
        start_val = self.environment.evaluate_expression(start_expr)
        end_val = self.environment.evaluate_expression(end_expr)
        
        # Convertir a enteros si es posible
        try:
            if isinstance(start_val, (int, float)):
                start_int = int(start_val)
            else:
                # Expresión simbólica - usar valor por defecto
                start_int = 1
            
            if isinstance(end_val, (int, float)):
                end_int = int(end_val)
            else:
                # Expresión simbólica - usar valor por defecto o n
                end_int = self.input_size if self.input_size else 4
            
            # loop_enter: entrada al ciclo
            self.trace_builder.add_step(
                line=node.get("pos", {}).get("line", 0),
                kind="for",
                variables=self.environment.get_variables_snapshot(),
                iteration={"loopVar": var_name, "currentValue": start_int, "maxValue": end_int},
                description=self._trace_labels.get("for_enter", "Entrada a FOR").format(
                    var_name=var_name, start=start_int, end=end_int
                ) if isinstance(self._trace_labels.get("for_enter"), str) else f"FOR {var_name} = {start_int}..{end_int}",
                event_kind="loop_enter",
            )

            # Ejecutar iteraciones
            iteration_count = 0
            for i in range(start_int, end_int + 1):
                # Si ya hubo un RETURN, no seguir iterando
                if getattr(self, "terminated", False):
                    break
                iteration_count += 1
                
                # Establecer variable del bucle
                self.environment.set_variable(var_name, i)
                
                # Agregar paso de iteración (loop_iter_enter)
                self.trace_builder.add_step(
                    line=node.get("pos", {}).get("line", 0),
                    kind="for",
                    variables=self.environment.get_variables_snapshot(),
                    iteration={
                        "loopVar": var_name,
                        "currentValue": i,
                        "maxValue": end_int,
                        "iteration": iteration_count,
                    },
                    description=self._trace_labels["for_iteration"].format(
                        iteration_count=iteration_count, var_name=var_name, value=i
                    ),
                    event_kind="loop_iter_enter",
                )
                
                # Ejecutar cuerpo
                if body.get("type") == "Block":
                    for stmt in body.get("body", []):
                        # Detener si ya hubo RETURN dentro del cuerpo
                        if getattr(self, "terminated", False):
                            break
                        self._execute_statement(stmt)
                else:
                    self._execute_statement(body)

                # loop_iter_exit: fin de iteración
                self.trace_builder.add_step(
                    line=node.get("pos", {}).get("line", 0),
                    kind="for",
                    variables=self.environment.get_variables_snapshot(),
                    iteration={
                        "loopVar": var_name,
                        "currentValue": i,
                        "maxValue": end_int,
                        "iteration": iteration_count,
                    },
                    description=self._trace_labels.get("for_iter_exit", "Fin iteración").format(
                        iteration_count=iteration_count, var_name=var_name, value=i
                    ) if isinstance(self._trace_labels.get("for_iter_exit"), str) else f"Fin iter {iteration_count}",
                    event_kind="loop_iter_exit",
                )

                # Si ya hubo RETURN dentro del cuerpo, salir del bucle
                if getattr(self, "terminated", False):
                    break

            # loop_exit: salida del ciclo
            self.trace_builder.add_step(
                line=node.get("pos", {}).get("line", 0),
                kind="for",
                variables=self.environment.get_variables_snapshot(),
                iteration={"loopVar": var_name, "currentValue": end_int, "maxValue": end_int},
                description=self._trace_labels.get("for_exit", "Salida de FOR").format(
                    var_name=var_name
                ) if isinstance(self._trace_labels.get("for_exit"), str) else f"Salida FOR {var_name}",
                event_kind="loop_exit",
            )
        except Exception as e:
            # Si falla, agregar paso simbólico
            self.trace_builder.add_step(
                line=node.get("pos", {}).get("line", 0),
                kind="for",
                variables=self.environment.get_variables_snapshot(),
                description=self._trace_labels["for_symbolic"].format(var_name=var_name)
            )
    
    def _execute_while(self, node: Dict[str, Any]) -> None:
        """Ejecuta un bucle WHILE."""
        # AST: {"type": "While", "test": ..., "body": ...}
        condition = node.get("test")
        body = node.get("body", {})
        
        iteration_count = 0
        max_iterations = self._infer_loop_max_iterations()

        # loop_enter: inicio del bucle WHILE
        self.trace_builder.add_step(
            line=node.get("pos", {}).get("line", 0),
            kind="while",
            variables=self.environment.get_variables_snapshot(),
            iteration={"loopVar": "iter", "currentValue": 1, "maxValue": max_iterations},
            description=self._trace_labels.get("while_iteration", "WHILE"),
            event_kind="loop_enter",
        )
        
        while iteration_count < max_iterations:
            # Evaluar condición
            condition_val = self._evaluate_condition(condition)
            
            if not condition_val:
                break
            
            iteration_count += 1
            
            self.trace_builder.add_step(
                line=node.get("pos", {}).get("line", 0),
                kind="while",
                variables=self.environment.get_variables_snapshot(),
                iteration={
                    "loopVar": "iter",
                    "currentValue": iteration_count,
                    "maxValue": max_iterations,
                    "iteration": iteration_count,
                },
                description=self._trace_labels["while_iteration"].format(
                    iteration_count=iteration_count
                ),
                event_kind="loop_iter_enter",
            )
            
            # Ejecutar cuerpo
            if body.get("type") == "Block":
                for stmt in body.get("body", []):
                    self._execute_statement(stmt)
            else:
                self._execute_statement(body)
            
            # En best case, salir después de primera iteración
            if self.case == "best" and iteration_count == 1:
                break

            # loop_iter_exit: fin de iteración
            self.trace_builder.add_step(
                line=node.get("pos", {}).get("line", 0),
                kind="while",
                variables=self.environment.get_variables_snapshot(),
                iteration={
                    "loopVar": "iter",
                    "currentValue": iteration_count,
                    "maxValue": max_iterations,
                    "iteration": iteration_count,
                },
                description=self._trace_labels.get("for_iter_exit", "Fin iteración").format(
                    iteration_count=iteration_count, var_name="iter", value=iteration_count
                ) if isinstance(self._trace_labels.get("for_iter_exit"), str) else f"Fin iter {iteration_count}",
                event_kind="loop_iter_exit",
            )

        # Si se alcanzó el límite de seguridad, añadir paso de advertencia
        if iteration_count >= max_iterations:
            label_key = "loop_truncated"
            desc = self._trace_labels.get(label_key, "Loop reached safety limit.")
            self.trace_builder.add_step(
                line=node.get("pos", {}).get("line", 0),
                kind="while",
                variables=self.environment.get_variables_snapshot(),
                iteration={"iteration": iteration_count, "truncated": True},
                description=desc,
            )

        # loop_exit: salida del bucle WHILE
        self.trace_builder.add_step(
            line=node.get("pos", {}).get("line", 0),
            kind="while",
            variables=self.environment.get_variables_snapshot(),
            iteration={"loopVar": "iter", "currentValue": iteration_count, "maxValue": max_iterations},
            description=self._trace_labels.get("for_exit", "Salida de FOR").format(
                var_name="iter"
            ) if isinstance(self._trace_labels.get("for_exit"), str) else "Salida WHILE",
            event_kind="loop_exit",
        )

    def _execute_repeat(self, node: Dict[str, Any]) -> None:
        """Ejecuta un bucle REPEAT."""
        # AST: {"type": "Repeat", "body": {..}, "test": ...}
        condition = node.get("test")
        body = node.get("body", {})
        
        iteration_count = 0
        max_iterations = self._infer_loop_max_iterations()

        # loop_enter: inicio del bucle REPEAT
        self.trace_builder.add_step(
            line=node.get("pos", {}).get("line", 0),
            kind="repeat",
            variables=self.environment.get_variables_snapshot(),
            iteration={"loopVar": "iter", "currentValue": 1, "maxValue": max_iterations},
            description=self._trace_labels.get("repeat_iteration", "REPEAT"),
            event_kind="loop_enter",
        )
        
        while iteration_count < max_iterations:
            # Detener si ya hubo RETURN
            if getattr(self, "terminated", False):
                break
            iteration_count += 1
            
            self.trace_builder.add_step(
                line=node.get("pos", {}).get("line", 0),
                kind="repeat",
                variables=self.environment.get_variables_snapshot(),
                iteration={
                    "loopVar": "iter",
                    "currentValue": iteration_count,
                    "maxValue": max_iterations,
                    "iteration": iteration_count,
                },
                description=self._trace_labels["repeat_iteration"].format(
                    iteration_count=iteration_count
                ),
                event_kind="loop_iter_enter",
            )
            
            # Ejecutar cuerpo
            if body.get("type") == "Block":
                for stmt in body.get("body", []):
                    if getattr(self, "terminated", False):
                        break
                    self._execute_statement(stmt)
            else:
                self._execute_statement(body)
            
            # Evaluar condición (REPEAT evalúa al final)
            condition_val = self._evaluate_condition(condition)
            if condition_val or getattr(self, "terminated", False):
                break

            # loop_iter_exit: fin de iteración
            self.trace_builder.add_step(
                line=node.get("pos", {}).get("line", 0),
                kind="repeat",
                variables=self.environment.get_variables_snapshot(),
                iteration={
                    "loopVar": "iter",
                    "currentValue": iteration_count,
                    "maxValue": max_iterations,
                    "iteration": iteration_count,
                },
                description=self._trace_labels.get("for_iter_exit", "Fin iteración").format(
                    iteration_count=iteration_count, var_name="iter", value=iteration_count
                ) if isinstance(self._trace_labels.get("for_iter_exit"), str) else f"Fin iter {iteration_count}",
                event_kind="loop_iter_exit",
            )

        # Si se alcanzó el límite de seguridad, añadir paso de advertencia
        if iteration_count >= max_iterations:
            desc = self._trace_labels.get("loop_truncated", "Loop reached safety limit.")
            self.trace_builder.add_step(
                line=node.get("pos", {}).get("line", 0),
                kind="repeat",
                variables=self.environment.get_variables_snapshot(),
                iteration={"iteration": iteration_count, "truncated": True},
                description=desc,
            )

        # loop_exit: salida del bucle REPEAT
        self.trace_builder.add_step(
            line=node.get("pos", {}).get("line", 0),
            kind="repeat",
            variables=self.environment.get_variables_snapshot(),
            iteration={"loopVar": "iter", "currentValue": iteration_count, "maxValue": max_iterations},
            description=self._trace_labels.get("for_exit", "Salida de FOR").format(
                var_name="iter"
            ) if isinstance(self._trace_labels.get("for_exit"), str) else "Salida REPEAT",
            event_kind="loop_exit",
        )

    def _infer_loop_max_iterations(self) -> int:
        """Infiere un limite de seguridad para bucles segun el input actual."""
        base = None
        if isinstance(self.input_size, int) and self.input_size > 0:
            base = self.input_size
        else:
            for value in self.environment.variables.values():
                if isinstance(value, list):
                    base = len(value)
                    break
        if not base or base <= 0:
            base = 10
        # Ampliar el margen para evitar truncar merges/particiones
        return max(10, base) * 4

    def _execute_if(self, node: Dict[str, Any]) -> None:
        """Ejecuta un condicional IF."""
        # AST: {"type": "If", "test": ..., "consequent": Block, "alternate": Block|None}
        condition = node.get("test")
        then_body = node.get("consequent", {})
        else_body = node.get("alternate")
        
        condition_val = self._evaluate_condition(condition)

        # Heurística para mejor/peor caso cuando no podemos evaluar la condición con datos concretos.
        # Si el then tiene un RETURN, interpretamos:
        # - best: entrar por then (éxito temprano)
        # - worst: NO entrar por then (no se cumple la condición)
        def _has_return_in(node: Any) -> bool:
            if not isinstance(node, dict):
                return False
            node_type = node.get("type", "").lower()
            if node_type == "return":
                return True
            if node_type == "block":
                for stmt in node.get("body", []):
                    if _has_return_in(stmt):
                        return True
            # Buscar recursivamente en hijos
            for key, value in node.items():
                if key == "type":
                    continue
                if isinstance(value, dict) and _has_return_in(value):
                    return True
                if isinstance(value, list):
                    for item in value:
                        if _has_return_in(item):
                            return True
            return False

        has_return_in_then = _has_return_in(then_body)

        # Decidir qué rama ejecutar según el caso
        execute_then = condition_val

        # Solo aplicar heurística best/worst cuando no hay evaluación concreta
        # (evitar sobrescribir condiciones con valores concretos como nodo==null)
        if has_return_in_then and condition_val not in (True, False):
            if self.case == "best":
                execute_then = True
            elif self.case == "worst":
                execute_then = False
        
        condition_text = self._condition_to_string(condition)
        self.trace_builder.add_step(
            line=node.get("pos", {}).get("line", 0),
            kind="if",
            variables=self.environment.get_variables_snapshot(),
            description=self._trace_labels["if_condition"].format(
                condition_val=condition_val
            ),
            event_kind="condition_eval",
            decision={"conditionText": condition_text, "result": execute_then},
        )
        
        if execute_then:
            if then_body.get("type") == "Block":
                for stmt in then_body.get("body", []):
                    self._execute_statement(stmt)
            else:
                self._execute_statement(then_body)
        elif else_body:
            if else_body.get("type") == "Block":
                for stmt in else_body.get("body", []):
                    self._execute_statement(stmt)
            else:
                self._execute_statement(else_body)
    
    def _evaluate_for_return(self, expr: Any) -> Any:
        """
        Evalúa la expresión de RETURN, delegando Call a _execute_call para registrar recursión.
        Necesario para RETURN n * factorialRecursivo(n-1) y expresiones similares.
        """
        if expr is None:
            return None
        if not isinstance(expr, dict):
            return self.environment.evaluate_expression(expr)

        node_type = expr.get("type")
        if node_type == "Call":
            return self._execute_call(expr)
        if node_type == "Binary":
            left_val = self._evaluate_for_return(expr.get("left"))
            right_val = self._evaluate_for_return(expr.get("right"))
            op = expr.get("op", "")
            l = self._to_numeric(left_val)
            r = self._to_numeric(right_val)
            if op == "*":
                return l * r
            if op == "+":
                return l + r
            if op == "-":
                return l - r
            if op == "/":
                return l / r if r != 0 else 0
            if op == "div":
                return int(l // r) if r != 0 else 0
            if op == "mod":
                return int(l % r) if r != 0 else 0
            if op == "and":
                return 1 if (left_val and right_val) else 0
            if op == "or":
                return 1 if (left_val or right_val) else 0
            if op in ("==", "!=", "<", "<=", ">", ">="):
                cmp = (op == "==" and l == r) or (op == "!=" and l != r) or (op == "<" and l < r) or (op == "<=" and l <= r) or (op == ">" and l > r) or (op == ">=" and l >= r)
                return 1 if cmp else 0
        if node_type == "Unary":
            arg_val = self._evaluate_for_return(expr.get("arg"))
            op = expr.get("op", "")
            if op == "-":
                return -self._to_numeric(arg_val)
            if op == "not":
                return 0 if arg_val else 1
        return self.environment.evaluate_expression(expr)

    def _to_numeric(self, v: Any) -> Union[int, float]:
        """Convierte valor a número para operaciones aritméticas."""
        if v is None:
            return 0
        if isinstance(v, (int, float)):
            return v
        return 0

    def _execute_return(self, node: Dict[str, Any]) -> None:
        """Ejecuta un RETURN y marca la ejecución como terminada."""
        value_expr = node.get("value")
        # Usar _evaluate_for_return para que expresiones como n * factorialRecursivo(n-1)
        # invoquen _execute_call y registren la recursión en el árbol
        value = self._evaluate_for_return(value_expr) if value_expr else None
        value_str = str(value) if value is not None else "None"

        # Guardar valor de retorno en el frame actual si estamos en recursión
        if self.call_stack:
            self.call_stack[-1]["return_value"] = value
            call_id = self.call_stack[-1].get("call_id")
            if call_id:
                self.trace_builder.record_return_value(call_id, value)

        self.trace_builder.add_step(
            line=node.get("pos", {}).get("line", 0),
            kind="return",
            variables=self.environment.get_variables_snapshot(),
            description=self._trace_labels["return_val"].format(value_str=value_str),
            event_kind="return_emit",
        )
        # Marcar como terminado para no ejecutar más sentencias después del return
        self.terminated = True
    
    def _execute_call(self, node: Dict[str, Any]) -> Any:
        """Ejecuta una llamada a procedimiento con soporte recursivo."""
        proc_name = node.get("name") or node.get("callee", "unknown")
        args = node.get("args", [])
        
        # Evaluar argumentos
        arg_values = {}
        evaluated_args = []
        arg_sources = []
        for i, arg in enumerate(args):
            arg_val = self.environment.evaluate_expression(arg)
            evaluated_args.append(arg_val)
            arg_values[f"arg_{i}"] = arg_val
            source_name = None
            if isinstance(arg, dict) and arg.get("type") == "Identifier":
                source_name = arg.get("name")
            arg_sources.append(source_name)
        
        # Buscar el procedimiento en el AST
        proc_def = None
        if self.ast.get("type") == "Program":
            body = self.ast.get("body", [])
            proc_defs = [item for item in body if isinstance(item, dict) and item.get("type") == "ProcDef"]
            for p in proc_defs:
                if p.get("name") == proc_name:
                    proc_def = p
                    break
        
        # Si encontramos el procedimiento, ejecutarlo recursivamente
        if proc_def:
            # Preparar parámetros formales con valores actuales
            formal_params = proc_def.get("params", [])
            params_map = {}
            param_sources = {}
            for i, param in enumerate(formal_params):
                param_name = param.get("name") if isinstance(param, dict) else param
                if i < len(evaluated_args):
                    params_map[param_name] = evaluated_args[i]
                    if i < len(arg_sources):
                        param_sources[param_name] = arg_sources[i]
            
            # Si estamos en recursión y el proc es recursivo: emitir call_spawn_child y pasar call_id
            pregenerated_call_id = None
            is_recursive_proc = self._is_recursive_procedure(proc_def)
            if is_recursive_proc and self.call_stack:
                pregenerated_call_id = self.trace_builder.generate_call_id()
                parent_frame = self.call_stack[-1]
                parent_call_id = parent_frame.get("call_id")
                params_snapshot = copy.deepcopy(params_map)
                self.trace_builder.add_step(
                    line=node.get("pos", {}).get("line", 0),
                    kind="call",
                    variables=self.environment.get_variables_snapshot(),
                    recursion={
                        "depth": self.recursion_depth,
                        "callId": pregenerated_call_id,
                        "parentCallId": parent_call_id,
                        "params": params_snapshot,
                        "procedure": proc_name,
                    },
                    description=self._trace_labels.get("recursive_call", "Llamada recursiva").format(
                        proc_name=proc_name, depth=self.recursion_depth
                    ) if isinstance(self._trace_labels.get("recursive_call"), str) else f"Invocando {proc_name}",
                    event_kind="call_spawn_child",
                )
            
            # Guardar estado del environment actual
            saved_terminated = self.terminated
            self.terminated = False
            
            # Crear un nuevo scope para la llamada (importante para recursión)
            self.environment.push_scope()
            
            # Establecer variables de parámetros en el nuevo scope
            for param_name, param_value in params_map.items():
                self.environment.set_variable(param_name, param_value)
            
            # Ejecutar el procedimiento
            return_value = self._execute_procedure(proc_def, params_map, pregenerated_call_id=pregenerated_call_id)

            # Capturar posibles mutaciones de arrays/objetos para propagarlas al caller
            updated_params = {}
            for param_name, source_name in param_sources.items():
                if not source_name:
                    continue
                updated_value = self.environment.get_variable(param_name)
                if isinstance(updated_value, (list, dict)):
                    updated_params[source_name] = updated_value
            
            # Restaurar el scope anterior (importante para recursión)
            self.environment.pop_scope()

            # Propagar cambios en estructuras mutables al scope anterior
            for source_name, updated_value in updated_params.items():
                self.environment.set_variable(source_name, updated_value)
            
            # Si estamos en recursión: emitir call_resume (volvimos de la hija)
            if is_recursive_proc and self.call_stack:
                parent_frame = self.call_stack[-1]
                parent_call_id = parent_frame.get("call_id")
                self.trace_builder.add_step(
                    line=node.get("pos", {}).get("line", 0),
                    kind="call",
                    variables=self.environment.get_variables_snapshot(),
                    recursion={
                        "depth": self.recursion_depth - 1,
                        "callId": parent_call_id,
                        "params": parent_frame.get("params", {}),
                        "procedure": proc_def.get("name", "unknown"),
                    },
                    description=f"Reanudando tras retorno de {proc_name}",
                    event_kind="call_resume",
                )
            
            # Restaurar estado
            self.terminated = saved_terminated
            
            return return_value
        else:
            # Si no encontramos la definición, solo registrar la llamada
            self.trace_builder.add_step(
                line=node.get("pos", {}).get("line", 0),
                kind="call",
                variables=self.environment.get_variables_snapshot(),
                description=self._trace_labels["call_proc"].format(proc_name=proc_name),
                event_kind="call_enter",
            )
            return None
    
    def _execute_print(self, node: Dict[str, Any]) -> None:
        """Ejecuta un PRINT."""
        args = node.get("args", [])
        arg_strs = [self.environment.evaluate_to_string(arg) for arg in args]

        self.trace_builder.add_step(
                line=node.get("pos", {}).get("line", 0),
                kind="print",
                variables=self.environment.get_variables_snapshot(),
                description=self._trace_labels["print_args"].format(
                    args=", ".join(arg_strs)
                ),
                event_kind="print",
            )
    
    def _execute_block(self, node: Dict[str, Any]) -> None:
        """Ejecuta un bloque."""
        body = node.get("body", [])
        for stmt in body:
            if getattr(self, "terminated", False):
                break
            self._execute_statement(stmt)
    
    def _execute_decl(self, node: Dict[str, Any]) -> None:
        """Ejecuta una declaración."""
        # Las declaraciones no generan pasos de ejecución significativos
        pass
    
    def _condition_to_string(self, condition: Any) -> str:
        """Convierte una condición del AST a string legible para decision.conditionText."""
        if not isinstance(condition, dict):
            return str(condition)
        cond_type = condition.get("type", "").lower()
        if cond_type == "binary":
            left = self.environment.evaluate_to_string(condition.get("left"))
            right = self.environment.evaluate_to_string(condition.get("right"))
            op = condition.get("operator") or condition.get("op") or "?"
            return f"{left} {op} {right}"
        if cond_type == "unary":
            arg = self.environment.evaluate_to_string(condition.get("arg"))
            op = condition.get("operator", "not")
            return f"{op} {arg}"
        return self.environment.evaluate_to_string(condition)

    def _evaluate_condition(self, condition: Any) -> bool:
        """
        Evalúa una condición booleana.
        
        Args:
            condition: Expresión de condición del AST
            
        Returns:
            Valor booleano de la condición
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        if not isinstance(condition, dict):
            return bool(condition)
        
        cond_type = condition.get("type", "").lower()
        
        if cond_type == "binary":
            left = self.environment.evaluate_expression(condition.get("left"))
            right = self.environment.evaluate_expression(condition.get("right"))
            op = (condition.get("operator", "") or condition.get("op", "")).lower()

            # Operadores lógicos (evaluar subcondiciones)
            if op in ("and", "&&"):
                return self._evaluate_condition(condition.get("left")) and self._evaluate_condition(
                    condition.get("right")
                )
            if op in ("or", "||"):
                return self._evaluate_condition(condition.get("left")) or self._evaluate_condition(
                    condition.get("right")
                )
            
            # Comparaciones con None (ej. nodo == null en listas enlazadas)
            if left is None or right is None:
                if op in ("=", "=="):
                    return left is None and right is None
                if op in ("<>", "!="):
                    return left is not None or right is not None

            # Convertir a valores numéricos si es posible
            try:
                if isinstance(left, (int, float)) and isinstance(right, (int, float)):
                    if op == "=" or op == "==":
                        return left == right
                    elif op == "<>" or op == "!=":
                        return left != right
                    elif op == "<":
                        return left < right
                    elif op == ">":
                        return left > right
                    elif op == "<=" or op == "≤":
                        return left <= right
                    elif op == ">=" or op == "≥":
                        return left >= right
            except Exception:
                pass
            
            # Por defecto, asumir verdadero en worst case
            return self.case == "worst"
        
        elif cond_type == "unary":
            arg = self.environment.evaluate_expression(condition.get("arg"))
            op = condition.get("operator", "")
            if op == "not" or op == "!":
                return not bool(arg)
            return bool(arg)
        
        # Por defecto, evaluar como expresión
        value = self.environment.evaluate_expression(condition)
        return bool(value)
    
    def _is_recursive_procedure(self, proc_def: Dict[str, Any]) -> bool:
        """
        Verifica si un procedimiento es recursivo.
        
        Args:
            proc_def: Nodo ProcDef del AST
            
        Returns:
            True si el procedimiento se llama a sí mismo
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        proc_name = proc_def.get("name", "")
        body = proc_def.get("body", {})
        
        # Buscar llamadas a sí mismo en el cuerpo
        return self._has_recursive_call(body, proc_name)
    
    def _has_recursive_call(self, node: Any, proc_name: str) -> bool:
        """
        Verifica si un nodo contiene una llamada recursiva.
        
        Args:
            node: Nodo del AST
            proc_name: Nombre del procedimiento
            
        Returns:
            True si hay una llamada recursiva
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        if not isinstance(node, dict):
            return False
        
        node_type = node.get("type", "").lower()
        
        if node_type == "call":
            call_name = node.get("name") or node.get("callee", "")
            if call_name == proc_name:
                return True
        
        # Buscar recursivamente en hijos
        for key, value in node.items():
            if key == "type":
                continue
            if isinstance(value, dict):
                if self._has_recursive_call(value, proc_name):
                    return True
            elif isinstance(value, list):
                for item in value:
                    if self._has_recursive_call(item, proc_name):
                        return True
        
        return False

