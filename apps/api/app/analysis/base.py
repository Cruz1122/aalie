# apps/api/app/analysis/base.py

from typing import List, Dict, Any, Optional, Union
from sympy import Symbol, Sum, Integer, Expr, latex, sympify
from .expr_converter import ExprConverter

# Tipos de datos que espejan el contrato ya implementado
LineCost = Dict[str, Any]
AnalyzeOpenResponse = Dict[str, Any]


class BaseAnalyzer:
    """
    Clase base con utilidades para análisis de algoritmos.
    
    Proporciona funcionalidades para:
    - Agregar filas de la tabla por línea
    - Aplicar multiplicadores de bucles (stack)
    - Construir la ecuación de eficiencia T_open = Σ C_{k}·count_{k}
    - Registrar el procedimiento (pasos) que llevaron a T_open
    - Memoización sencilla (PD) por nodo+contexto
    """
    
    def __init__(self):
        self.rows: List[LineCost] = []      # tabla por línea
        self.loop_stack: List[Expr] = []    # multiplicadores activos (expresiones SymPy)
        self.symbols: Dict[str, str] = {}   # ej: { "n": "length(A)" }
        self.notes: List[str] = []          # reglas aplicadas / comentarios
        self.memo: Dict[str, List[LineCost]] = {}  # PD: cache de filas por nodo+contexto
        self.counter = 0                    # contador para generar constantes C_k
        self.t_polynomial: Optional[str] = None  # forma polinómica T(n) = an² + bn + c
        self.variable = "n"                  # variable principal del algoritmo
        self.expr_converter = ExprConverter(self.variable)

    # --- util 1: agregar fila ---
    def add_row(self, line: int, kind: str, ck: str, count: Union[str, Expr], note: Optional[str] = None):
        """
        Inserta una fila aplicando el multiplicador del contexto de bucles.
        
        Args:
            line: Número de línea
            kind: Tipo de instrucción (assign, for, while, if, etc.)
            ck: Costo individual de la línea (string KaTeX)
            count: Número de ejecuciones (puede ser string o Expr de SymPy)
            note: Nota opcional sobre la línea
        """
        # Convertir count a SymPy si es string
        if isinstance(count, str):
            count_expr = self._str_to_sympy(count)
        else:
            count_expr = count
        
        # Aplicar multiplicadores del stack
        count_raw_expr = self._apply_loop_multipliers(count_expr)
        
        # Normalizar strings si el método está disponible (solo formato básico)
        if hasattr(self, '_normalize_string'):
            if note:
                note = self._normalize_string(note)
        
        # Convertir a LaTeX para almacenar (mantener compatibilidad con formato actual)
        try:
            count_raw_latex = latex(count_raw_expr)
            # Asegurar que sea un string
            if not isinstance(count_raw_latex, str):
                count_raw_latex = str(count_raw_latex)
        except Exception as e:
            print(f"[BaseAnalyzer] Error convirtiendo count_raw_expr a LaTeX: {e}")
            # Fallback: convertir a string directamente
            count_raw_latex = str(count_raw_expr) if count_raw_expr is not None else "1"
        
        count_latex = count_raw_latex  # Inicialmente igual, se simplificará después
        
        row = {
            "line": line,
            "kind": kind,
            "ck": ck,              # Ej: "C_{2} + C_{3}"
            "count": count_latex,   # LaTeX para compatibilidad, se actualizará después
            "count_raw": count_raw_latex,  # LaTeX de la expresión con sumatorias
            "count_raw_expr": count_raw_expr,  # Expresión SymPy (nuevo campo interno)
            "note": note
        }
        
        self.rows.append(row)

    def _apply_loop_multipliers(self, base_count: Expr) -> Expr:
        """
        Envuelve el conteo base con los multiplicadores activos del stack.
        
        Args:
            base_count: Expresión SymPy base
            
        Returns:
            Expresión SymPy con multiplicadores aplicados
        """
        from sympy import Symbol, preorder_traversal
        
        expr = base_count if base_count is not None else Integer(1)
        
        # Recolectar todas las variables ya usadas en la expresión
        used_vars = set()
        for subexpr in preorder_traversal(expr):
            if isinstance(subexpr, Symbol):
                used_vars.add(subexpr.name)
        
        # Aplicar multiplicadores del stack (de más externo a más interno)
        # NOTA: En SymPy, cuando construimos Sum(expr, (var, a, b)), el nuevo límite
        # se agrega al final, pero SymPy interpreta el PRIMER límite como el más EXTERNO.
        # Por lo tanto, debemos procesar loop_stack en orden directo (no reversed),
        # porque loop_stack[0] es el bucle más externo y loop_stack[-1] es el más interno.
        for multiplier in self.loop_stack:
            if isinstance(multiplier, Sum):
                # Es una sumatoria, envolver la expresión
                var_sym = multiplier.args[1][0]  # Variable de la sumatoria
                start_expr = multiplier.args[1][1]  # Límite inferior
                end_expr = multiplier.args[1][2]  # Límite superior
                
                # Verificar si la variable ya está en uso
                var_name = var_sym.name if isinstance(var_sym, Symbol) else str(var_sym)
                if var_name in used_vars:
                    # Renombrar la variable para evitar colisión
                    # Usar convención: i -> j -> k -> l -> m -> ...
                    var_names = ['i', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't']
                    # Encontrar el siguiente nombre disponible
                    new_var_name = None
                    for candidate in var_names:
                        if candidate not in used_vars:
                            new_var_name = candidate
                            break
                    
                    # Si no hay más nombres disponibles, usar var_name con índice
                    if new_var_name is None:
                        idx = 0
                        while f"{var_name}_{idx}" in used_vars:
                            idx += 1
                        new_var_name = f"{var_name}_{idx}"
                    
                    # Crear nuevo símbolo con el nombre renombrado
                    var_sym = Symbol(new_var_name, integer=True)
                
                # Agregar la variable a las usadas
                used_vars.add(var_sym.name)
                
                # Crear la sumatoria con la variable (posiblemente renombrada)
                expr = Sum(expr, (var_sym, start_expr, end_expr))
                
                # Actualizar used_vars para incluir todas las variables en la nueva expresión
                for subexpr in preorder_traversal(expr):
                    if isinstance(subexpr, Symbol):
                        used_vars.add(subexpr.name)
            else:
                # Es una expresión multiplicativa
                if expr == Integer(1):
                    expr = multiplier
                else:
                    expr = expr * multiplier
        
        return expr
    
    def _str_to_sympy(self, expr_str: str) -> Expr:
        """
        Convierte un string a expresión SymPy.
        
        Args:
            expr_str: String representando una expresión
            
        Returns:
            Expresión SymPy
        """
        if not expr_str or expr_str.strip() == "":
            return Integer(1)
        
        expr_str = expr_str.strip()
        
        # Intentar parsear directamente
        try:
            # Crear contexto con símbolos comunes
            n = Symbol(self.variable, integer=True, positive=True)
            i = Symbol('i', integer=True)
            j = Symbol('j', integer=True)
            k = Symbol('k', integer=True)
            m = Symbol('m', integer=True, positive=True)
            
            syms = {
                self.variable: n,
                'i': i,
                'j': j,
                'k': k,
                'm': m
            }
            
            return sympify(expr_str, locals=syms)
        except:
            # Fallback: retornar 1
            return Integer(1)
    
    def _expr_to_sympy(self, expr: Any) -> Expr:
        """
        Convierte una expresión del AST a SymPy usando ExprConverter.
        
        Args:
            expr: Expresión del AST
            
        Returns:
            Expresión SymPy
        """
        return self.expr_converter.ast_to_sympy(expr)

    # --- util 2: gestionar contexto de bucles ---
    def push_multiplier(self, m: Union[str, Expr]):
        """
        Activa un multiplicador (p.ej., iteraciones de un for).
        
        Args:
            m: Multiplicador (puede ser string LaTeX o Expr de SymPy)
        """
        if isinstance(m, str):
            # Convertir string LaTeX a SymPy
            # Intentar parsear como sumatoria: \sum_{var=start}^{end} 1
            import re
            pattern = r"\\sum_\{([^=}]+)=([^}]*)\}\^\{([^}]*)\}\s*1"
            match = re.match(pattern, m.strip())
            if match:
                var_name, start_str, end_str = match.groups()
                var_sym = Symbol(var_name.strip(), integer=True)
                start_expr = self._str_to_sympy(start_str.strip())
                end_expr = self._str_to_sympy(end_str.strip())
                m = Sum(Integer(1), (var_sym, start_expr, end_expr))
            else:
                # No es una sumatoria, convertir a expresión SymPy
                m = self._str_to_sympy(m)
        
        self.loop_stack.append(m)

    def pop_multiplier(self):
        """Desactiva el último multiplicador."""
        if self.loop_stack:
            self.loop_stack.pop()

    # --- util 3: ensamblar T_open ---
    def build_t_open(self) -> str:
        """
        Construye la ecuación T_open = Σ C_{k}·count_{k} en formato KaTeX.
        
        Returns:
            String con la ecuación de eficiencia en formato KaTeX
        """
        if not self.rows:
            return "0"
        
        # Construir expresión SymPy
        from sympy import Add, Mul, Symbol as SymSymbol
        
        terms = []
        for r in self.rows:
            if r.get('ck') != "—" and r.get('count') != "—":
                # Obtener expresión SymPy si está disponible
                count_expr = r.get('count_raw_expr')
                if count_expr is None:
                    # Fallback: convertir desde LaTeX
                    count_expr = self._str_to_sympy(r.get('count_raw', '1'))
                
                # Crear término: C_k * count_expr
                # C_k es solo un símbolo para mostrar, no afecta la expresión SymPy
                # Multiplicamos directamente
                terms.append(count_expr)
        
        if not terms:
            return "0"
        
        # Sumar todos los términos
        total_expr = Add(*terms) if len(terms) > 1 else terms[0]
        
        # Simplificar completamente: evaluar todas las sumatorias
        from sympy import preorder_traversal
        from sympy import simplify as sympy_simplify, expand
        
        # Evaluar todas las sumatorias en la expresión
        def evaluate_sums_in_expr(expr):
            """Evalúa todas las sumatorias en la expresión."""
            # Verificar si hay Sum sin evaluar
            has_sum = False
            for subexpr in preorder_traversal(expr):
                if isinstance(subexpr, Sum):
                    has_sum = True
                    break
            
            if has_sum:
                # Reemplazar todas las Sum con su evaluación
                expr = expr.replace(lambda x: isinstance(x, Sum), lambda x: x.doit())
                expr = sympy_simplify(expr)
                # Verificar recursivamente si aún hay Sum
                return evaluate_sums_in_expr(expr)
            
            return expr
        
        # Evaluar todas las sumatorias
        total_expr = evaluate_sums_in_expr(total_expr)
        
        # Simplificar y expandir para obtener la forma más simple
        try:
            total_expr = expand(total_expr)
            total_expr = sympy_simplify(total_expr)
        except:
            total_expr = sympy_simplify(total_expr)
        
        # Convertir a LaTeX
        return latex(total_expr)
    
    def build_t_open_expr(self) -> Optional[Expr]:
        """
        Construye la expresión SymPy de T_open = Σ C_{k}·count_{k}.
        
        Returns:
            Expresión SymPy simplificada o None si no hay términos
        """
        if not self.rows:
            return None
        
        # Construir expresión SymPy
        from sympy import Add
        
        terms = []
        for r in self.rows:
            if r.get('ck') != "—" and r.get('count') != "—":
                # Obtener expresión SymPy si está disponible
                count_expr = r.get('count_raw_expr')
                if count_expr is None:
                    # Fallback: convertir desde LaTeX
                    count_expr = self._str_to_sympy(r.get('count_raw', '1'))
                
                # Crear término: C_k * count_expr
                # C_k es solo un símbolo para mostrar, no afecta la expresión SymPy
                # Multiplicamos directamente
                terms.append(count_expr)
        
        if not terms:
            return None
        
        # Sumar todos los términos
        total_expr = Add(*terms) if len(terms) > 1 else terms[0]
        
        # Simplificar completamente: evaluar todas las sumatorias
        from sympy import preorder_traversal
        from sympy import simplify as sympy_simplify, expand
        
        # Evaluar todas las sumatorias en la expresión
        def evaluate_sums_in_expr(expr):
            """Evalúa todas las sumatorias en la expresión."""
            # Verificar si hay Sum sin evaluar
            has_sum = False
            for subexpr in preorder_traversal(expr):
                if isinstance(subexpr, Sum):
                    has_sum = True
                    break
            
            if has_sum:
                # Reemplazar todas las Sum con su evaluación
                expr = expr.replace(lambda x: isinstance(x, Sum), lambda x: x.doit())
                expr = sympy_simplify(expr)
                # Verificar recursivamente si aún hay Sum
                return evaluate_sums_in_expr(expr)
            
            return expr
        
        # Evaluar todas las sumatorias
        total_expr = evaluate_sums_in_expr(total_expr)
        
        # Simplificar y expandir para obtener la forma más simple
        try:
            total_expr = expand(total_expr)
            total_expr = sympy_simplify(total_expr)
        except:
            total_expr = sympy_simplify(total_expr)
        
        return total_expr

    # --- util 4: emitir respuesta estándar ---
    def result(self) -> AnalyzeOpenResponse:
        """
        Genera la respuesta estándar del análisis.
        
        Returns:
            Diccionario que cumple el contrato AnalyzeOpenResponse
        """
        totals = {
            "T_open": self.build_t_open(),
            "symbols": self.symbols if self.symbols else None,
            "notes": self.notes if self.notes else None
        }
        
        # Agregar T_polynomial si está disponible
        if self.t_polynomial:
            totals["T_polynomial"] = self.t_polynomial
        
        # Agregar notaciones asintóticas si están disponibles (solo en IterativeAnalyzer)
        if hasattr(self, 'big_o') and self.big_o:
            totals["big_o"] = self.big_o
        if hasattr(self, 'big_omega') and self.big_omega:
            totals["big_omega"] = self.big_omega
        if hasattr(self, 'big_theta') and self.big_theta:
            totals["big_theta"] = self.big_theta
        
        # Limpiar filas: eliminar objetos SymPy y asegurar que todo sea serializable
        clean_rows = []
        for row in self.rows:
            clean_row = dict(row)
            # Eliminar count_raw_expr (objeto SymPy no serializable)
            if 'count_raw_expr' in clean_row:
                del clean_row['count_raw_expr']
            # Asegurar que count y count_raw sean strings
            if 'count' in clean_row and not isinstance(clean_row['count'], str):
                clean_row['count'] = str(clean_row['count'])
            if 'count_raw' in clean_row and not isinstance(clean_row['count_raw'], str):
                clean_row['count_raw'] = str(clean_row['count_raw'])
            clean_rows.append(clean_row)
        
        return {
            "ok": True,
            "byLine": clean_rows,
            "totals": totals
        }

    # --- util 5: memoización (PD) ---
    def memo_key(self, node: Any, mode: str, ctx_hash: str) -> str:
        """
        Genera clave estable para cachear filas de un subárbol bajo un contexto.
        
        Args:
            node: Nodo del AST
            mode: Modo de análisis (ej: "recursive", "iterative")
            ctx_hash: Hash del contexto actual
            
        Returns:
            Clave única para el cache
        """
        nid = getattr(node, "id", None) or str(id(node))
        return f"{nid}|{mode}|{ctx_hash}"

    def memo_get(self, key: str) -> Optional[List[LineCost]]:
        """
        Obtiene filas del cache.
        
        Args:
            key: Clave del cache
            
        Returns:
            Lista de filas cacheadas o None si no existe
        """
        return self.memo.get(key)

    def memo_set(self, key: str, rows: List[LineCost]):
        """
        Guarda filas en el cache.
        
        Args:
            key: Clave del cache
            rows: Lista de filas a cachear
        """
        # Guardar una copia superficial para evitar aliasing accidental
        self.memo[key] = [dict(r) for r in rows]

    # --- utilidades adicionales ---
    def add_symbol(self, symbol: str, description: str):
        """
        Agrega un símbolo con su descripción.
        
        Args:
            symbol: Símbolo matemático (ej: "n", "m", "k")
            description: Descripción del símbolo (ej: "length(A)", "number of iterations")
        """
        self.symbols[symbol] = description

    def add_note(self, note: str):
        """
        Agrega una nota al análisis.
        
        Args:
            note: Nota descriptiva
        """
        self.notes.append(note)


    def clear(self):
        """Limpia todos los datos del analizador."""
        self.rows.clear()
        self.loop_stack.clear()
        self.symbols.clear()
        self.notes.clear()
        self.memo.clear()
        self.t_polynomial = None

    def get_context_hash(self) -> str:
        """
        Genera un hash del contexto actual (loop_stack).
        
        Returns:
            String hash del contexto
        """
        # Convertir expresiones SymPy a strings para el hash
        if not self.loop_stack:
            return "root"
        # Usar representación LaTeX de las expresiones
        return "|".join([latex(expr) for expr in self.loop_stack])

    def C(self) -> str:
        """
        Genera la siguiente constante C_k.
        
        Returns:
            String con la siguiente constante (ej: "C_{1}", "C_{2}", etc.)
        """
        self.counter += 1
        return f"C_{{{self.counter}}}"
