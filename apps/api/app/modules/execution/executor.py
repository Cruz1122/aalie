"""
Ejecutor principal que recorre el AST y genera pasos de ejecución.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""
from typing import Any, Dict, List, Optional
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
    
    def __init__(self, ast: Dict[str, Any], input_size: Optional[int] = None, case: str = "worst", initial_variables: Optional[Dict[str, Any]] = None, max_recursion_depth: int = 100):
        """
        Inicializa el ejecutor.
        
        Args:
            ast: AST del código a ejecutar
            input_size: Tamaño de entrada concreto (ej: n=4)
            case: Caso a ejecutar ("worst", "best", "avg")
            initial_variables: Variables iniciales para el environment
            max_recursion_depth: Límite de profundidad recursiva (default: 100)
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        self.ast = ast
        self.input_size = input_size
        self.case = case
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
                        # Si hay múltiples procedimientos, no ejecutar automáticamente
                        # Solo registrar las definiciones
                        pass
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
    
    def _map_procedure_params(self, proc_def: Dict[str, Any]) -> Dict[str, Any]:
        """
        Mapea los parámetros del procedimiento usando las variables iniciales disponibles.
        
        Args:
            proc_def: Nodo ProcDef del AST
            
        Returns:
            Diccionario con los parámetros mapeados
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        params_map = {}
        formal_params = proc_def.get("params", [])
        
        for param in formal_params:
            param_name = None
            
            # Extraer el nombre del parámetro según su tipo
            if isinstance(param, dict):
                if param.get("type") == "Param":
                    param_name = param.get("name")
                elif param.get("type") == "ArrayParam":
                    param_name = param.get("name")
                elif param.get("type") == "ObjectParam":
                    param_name = param.get("name")
                else:
                    # Intentar obtener el nombre directamente
                    param_name = param.get("name")
            elif isinstance(param, str):
                param_name = param
            
            # Si encontramos un nombre de parámetro, buscar su valor en las variables iniciales
            if param_name:
                value = self.environment.get_variable(param_name)
                if value is not None:
                    params_map[param_name] = value
        
        return params_map
    
    def _execute_procedure(self, proc_def: Dict[str, Any], params: Dict[str, Any], return_value: Optional[Any] = None) -> Any:
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
            
            # Generar ID de llamada
            call_id = self.trace_builder.generate_call_id()
            
            # Incrementar profundidad para llamadas subsecuentes
            self.recursion_depth += 1
            
            # Crear nuevo frame para la llamada
            frame = {
                "call_id": call_id,
                "proc_name": proc_name,
                "params": params.copy(),
                "depth": depth,
                "return_value": None
            }
            self.call_stack.append(frame)
            
            # Registrar entrada a recursión
            self.trace_builder.enter_recursion(call_id, depth, params)
            
            # Agregar paso de entrada
            line = proc_def.get("pos", {}).get("line", 0)
            self.current_line = line
            self.trace_builder.add_step(
                line=line,
                kind="call",
                variables=self.environment.get_variables_snapshot(),
                recursion={
                    "depth": depth,
                    "callId": call_id,
                    "params": params,
                    "procedure": proc_name
                },
                description=f"Llamada recursiva a {proc_name} (profundidad {depth})"
            )
        
        # Si no es recursivo, aún necesitamos establecer los parámetros en el environment
        # Crear scope nuevo solo si no es recursivo (para recursivos, el scope ya se maneja en _execute_call)
        created_scope = False
        if not is_recursive and params:
            self.environment.push_scope()
            created_scope = True
            # Establecer variables de parámetros en el nuevo scope
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
            result = current_frame.get("return_value")
            
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
        
        # Evaluar el valor
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
                        # Asegurar tamaño
                        if index_val >= len(current_array):
                            # Extender array si es necesario (comportamiento dinámico para pseudocódigo)
                            current_array.extend([0] * (index_val - len(current_array) + 1))
                        
                        # Actualizar valor
                        current_array[index_val] = value
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
                            # Asegurar filas
                            if row_val >= len(current_matrix):
                                current_matrix.extend([[] for _ in range(row_val - len(current_matrix) + 1)])
                            
                            row_list = current_matrix[row_val]
                            if not isinstance(row_list, list):
                                row_list = []
                                current_matrix[row_val] = row_list
                            
                            # Asegurar columnas
                            if col_val >= len(row_list):
                                row_list.extend([0] * (col_val - len(row_list) + 1))
                            
                            row_list[col_val] = value
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
        
        description = f"Asignación: {' = '.join(description_parts)}"
        
        self.trace_builder.add_step(
            line=node.get("pos", {}).get("line", 0),
            kind="assign",
            variables=self.environment.get_variables_snapshot(),
            description=description
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
            
            # Ejecutar iteraciones
            iteration_count = 0
            for i in range(start_int, end_int + 1):
                # Si ya hubo un RETURN, no seguir iterando
                if getattr(self, "terminated", False):
                    break
                iteration_count += 1
                
                # Establecer variable del bucle
                self.environment.set_variable(var_name, i)
                
                # Agregar paso de iteración
                self.trace_builder.add_step(
                    line=node.get("pos", {}).get("line", 0),
                    kind="for",
                    variables=self.environment.get_variables_snapshot(),
                    iteration={
                        "loopVar": var_name,
                        "currentValue": i,
                        "maxValue": end_int,
                        "iteration": iteration_count
                    },
                    description=f"Iteración {iteration_count}: {var_name} = {i}"
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

                # Si ya hubo RETURN dentro del cuerpo, salir del bucle
                if getattr(self, "terminated", False):
                    break
        except Exception as e:
            # Si falla, agregar paso simbólico
            self.trace_builder.add_step(
                line=node.get("pos", {}).get("line", 0),
                kind="for",
                variables=self.environment.get_variables_snapshot(),
                description=f"Bucle FOR {var_name} (evaluación simbólica)"
            )
    
    def _execute_while(self, node: Dict[str, Any]) -> None:
        """Ejecuta un bucle WHILE."""
        # AST: {"type": "While", "test": ..., "body": ...}
        condition = node.get("test")
        body = node.get("body", {})
        
        iteration_count = 0
        max_iterations = 10  # Límite para evitar bucles infinitos
        
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
                    "iteration": iteration_count
                },
                description=f"Iteración {iteration_count} del bucle WHILE"
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
    
    def _execute_repeat(self, node: Dict[str, Any]) -> None:
        """Ejecuta un bucle REPEAT."""
        # AST: {"type": "Repeat", "body": {..}, "test": ...}
        condition = node.get("test")
        body = node.get("body", {})
        
        iteration_count = 0
        max_iterations = 10
        
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
                    "iteration": iteration_count
                },
                description=f"Iteración {iteration_count} del bucle REPEAT"
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

        if has_return_in_then:
            # Para ramas con RETURN, forzar mejor/peor caso de forma explícita
            if self.case == "best":
                # Mejor caso: se cumple la condición y entramos al then
                execute_then = True
            elif self.case == "worst":
                # Peor caso: nunca se cumple la condición, se evita el then
                execute_then = False
        
        self.trace_builder.add_step(
            line=node.get("pos", {}).get("line", 0),
            kind="if",
            variables=self.environment.get_variables_snapshot(),
            description=f"IF: condición = {condition_val}"
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
    
    def _execute_return(self, node: Dict[str, Any]) -> None:
        """Ejecuta un RETURN y marca la ejecución como terminada."""
        value_expr = node.get("value")
        value = self.environment.evaluate_expression(value_expr) if value_expr else None
        value_str = self.environment.evaluate_to_string(value_expr) if value_expr else "None"
        
        # Guardar valor de retorno en el frame actual si estamos en recursión
        if self.call_stack:
            self.call_stack[-1]["return_value"] = value
        
        self.trace_builder.add_step(
            line=node.get("pos", {}).get("line", 0),
            kind="return",
            variables=self.environment.get_variables_snapshot(),
            description=f"RETURN {value_str}"
        )
        # Marcar como terminado para no ejecutar más sentencias después del return
        self.terminated = True
    
    def _execute_call(self, node: Dict[str, Any]) -> Any:
        """Ejecuta una llamada a procedimiento con soporte recursivo."""
        proc_name = node.get("name", "unknown")
        args = node.get("args", [])
        
        # Evaluar argumentos
        arg_values = {}
        evaluated_args = []
        for i, arg in enumerate(args):
            arg_val = self.environment.evaluate_expression(arg)
            evaluated_args.append(arg_val)
            arg_values[f"arg_{i}"] = arg_val
        
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
            for i, param in enumerate(formal_params):
                param_name = param.get("name") if isinstance(param, dict) else param
                if i < len(evaluated_args):
                    params_map[param_name] = evaluated_args[i]
            
            # Guardar estado del environment actual
            saved_terminated = self.terminated
            self.terminated = False
            
            # Crear un nuevo scope para la llamada (importante para recursión)
            self.environment.push_scope()
            
            # Establecer variables de parámetros en el nuevo scope
            for param_name, param_value in params_map.items():
                self.environment.set_variable(param_name, param_value)
            
            # Ejecutar el procedimiento
            return_value = self._execute_procedure(proc_def, params_map)
            
            # Restaurar el scope anterior (importante para recursión)
            self.environment.pop_scope()
            
            # Restaurar estado
            self.terminated = saved_terminated
            
            return return_value
        else:
            # Si no encontramos la definición, solo registrar la llamada
            self.trace_builder.add_step(
                line=node.get("pos", {}).get("line", 0),
                kind="call",
                variables=self.environment.get_variables_snapshot(),
                description=f"Llamada a {proc_name}"
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
            description=f"PRINT: {', '.join(arg_strs)}"
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
            op = condition.get("operator", "") or condition.get("op", "")
            
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
            call_name = node.get("name", "")
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

