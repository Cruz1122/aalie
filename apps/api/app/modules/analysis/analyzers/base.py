from typing import List, Dict, Any, Optional, Union
from sympy import Symbol, Sum, Integer, Expr, latex, sympify
from ..utils.expr_converter import ExprConverter
from ..models.avg_model import AvgModel
from ...shared.types import LineCost, AnalyzeOpenResponse


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
        self.mode: str = "worst"            # modo de análisis: "worst", "best", "avg"
        self.avg_model: Optional[AvgModel] = None  # modelo probabilístico para caso promedio
        self.procedure_steps: Optional[List[str]] = None  # pasos del procedimiento para caso promedio

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
            # Si count_raw_expr es 0, mantener "0", no convertir a "1"
            if count_raw_expr is not None:
                count_raw_latex = str(count_raw_expr)
            else:
                count_raw_latex = "1"
        
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
        
        # En modo promedio, agregar expectedRuns (alias de count para E[#])
        if self.mode == "avg":
            row["expectedRuns"] = count_latex
        
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
                
                # NO renombrar la variable del multiplicador.
                # Si la expresión base usa la misma variable (ej: 'i'), es correcto:
                # significa que la expresión depende de la variable del bucle externo.
                # Renombrar causaría que la sumatoria use una variable incorrecta.
                # 
                # Ejemplo: Si base_count = "n - i + 1" y el multiplicador es Sum(1, (i, 1, n-1)),
                # el resultado debe ser Sum(n - i + 1, (i, 1, n-1)), NO Sum(n - i + 1, (j, 1, n-1)).
                
                var_name = var_sym.name if isinstance(var_sym, Symbol) else str(var_sym)
                
                # Agregar la variable a las usadas
                used_vars.add(var_name)
                
                # Crear la sumatoria con la variable original del multiplicador
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
        except Exception:
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

    # --- util 3: ensamblar T_open (o A(n) para promedio) ---
    def build_t_open(self) -> str:
        """
        Construye la ecuación T_open = Σ C_{k}·count_{k} (o A(n) = Σ C_{k}·E[N_{k}] para promedio) en formato KaTeX.
        
        Returns:
            String con la ecuación de eficiencia en formato KaTeX
        """
        if not self.rows:
            return "0"
        
        # Construir expresión SymPy
        from sympy import Add
        
        terms = []
        for r in self.rows:
            if r.get('ck') != "—" and r.get('count') != "—":
                # Preferir usar count_expr (ya evaluado) si está disponible
                count_expr = r.get('count_expr')
                if count_expr is None:
                    # Fallback: usar count_raw_expr
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
        from sympy import simplify as sympy_simplify, expand
        from ..utils.summation_closer import SummationCloser
        
        # Usar SummationCloser para evaluar todas las sumatorias correctamente
        closer = SummationCloser()
        total_expr = closer._evaluate_all_sums_sympy(total_expr)
        
        # Simplificar y expandir para obtener la forma más simple
        try:
            total_expr = expand(total_expr)
            total_expr = sympy_simplify(total_expr)
        except Exception:
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
                # Preferir usar count_expr (expresión SymPy evaluada) si está disponible
                count_expr = r.get('count_expr')
                if count_expr is None:
                    # Fallback: parsear desde count (LaTeX evaluado)
                    count_latex = r.get('count', '1')
                    count_expr = self._str_to_sympy(count_latex)
                
                # Crear término: C_k * count_expr
                # C_k es solo un símbolo para mostrar, no afecta la expresión SymPy
                # Multiplicamos directamente
                terms.append(count_expr)
        
        if not terms:
            return None
        
        # Sumar todos los términos
        total_expr = Add(*terms) if len(terms) > 1 else terms[0]
        
        # Simplificar completamente
        from sympy import simplify as sympy_simplify, expand
        from ..utils.summation_closer import SummationCloser
        
        # Usar SummationCloser para evaluar todas las sumatorias correctamente
        closer = SummationCloser()
        total_expr = closer._evaluate_all_sums_sympy(total_expr)
        
        # Simplificar y expandir para obtener la forma más simple
        try:
            total_expr = expand(total_expr)
            total_expr = sympy_simplify(total_expr)
        except Exception:
            total_expr = sympy_simplify(total_expr)
        
        return total_expr

    # --- util 4: emitir respuesta estándar ---
    def result(self) -> AnalyzeOpenResponse:
        """
        Genera la respuesta estándar del análisis.
        
        Returns:
            Diccionario que cumple el contrato AnalyzeOpenResponse
        """
        # Construir T_open (o A(n) para promedio)
        t_open_str = self.build_t_open()
        
        totals = {
            "T_open": t_open_str,
            "symbols": self.symbols if self.symbols else None,
            "notes": self.notes if self.notes else None
        }
        
        # Para caso promedio, agregar A_of_n y procedure
        if self.mode == "avg":
            totals["A_of_n"] = t_open_str
            # Agregar pasos del procedimiento a totals.procedure (no a notes)
            if hasattr(self, 'procedure_steps') and self.procedure_steps:
                totals["procedure"] = self.procedure_steps
        
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
            clean_row = {}
            for key, value in row.items():
                # Saltar objetos SymPy no serializables
                if key == 'count_raw_expr' or key == 'count_expr':
                    continue
                # Convertir cualquier objeto SymPy restante a string
                if hasattr(value, '__class__') and 'sympy' in str(type(value).__module__):
                    try:
                        from sympy import latex
                        clean_row[key] = latex(value)
                    except Exception:
                        clean_row[key] = str(value)
                # Asegurar que count, count_raw y expectedRuns sean strings
                elif key in ['count', 'count_raw', 'expectedRuns'] and not isinstance(value, str):
                    # Si el valor es 0, mantener "0", no convertir a "1"
                    if value == 0 or (hasattr(value, '__eq__') and value == 0):
                        clean_row[key] = "0"
                    else:
                        clean_row[key] = str(value) if value is not None else "1"
                else:
                    clean_row[key] = value
            
            # En modo promedio, asegurar que expectedRuns esté presente
            if self.mode == "avg" and "expectedRuns" not in clean_row:
                # Si count es "0", mantener "0", no convertir a "1"
                count_val = clean_row.get("count", "1")
                if count_val == "0" or count_val == 0:
                    clean_row["expectedRuns"] = "0"
                else:
                    clean_row["expectedRuns"] = count_val
            
            clean_rows.append(clean_row)
        
        # Agregar información del modelo promedio si está disponible
        if self.mode == "avg" and self.avg_model:
            # Detectar si estamos en Modelo A (éxito seguro con early return)
            has_success_return = False
            has_failure_return = False
            for row in clean_rows:
                if row.get("kind") == "return":
                    note = row.get("note", "")
                    if note and ("éxito seguro" in note or ("éxito" in note and "siempre ocurre" in note)):
                        has_success_return = True
                    if note and ("fracaso" in note or "nunca ocurre" in note):
                        has_failure_return = True
            # Si hay early return en bucle y éxito seguro, es Modelo A
            if has_success_return and has_failure_return:
                model_info = {
                    "mode": self.avg_model.mode,
                    "note": "uniforme (éxito)"
                }
            else:
                model_info = self.avg_model.get_model_info()
            totals["avg_model_info"] = model_info
            
            # Agregar hipótesis si hay símbolos
            if self.avg_model.has_symbols():
                hypotheses = []
                if self.avg_model.mode == "symbolic":
                    hypotheses.append("Probabilidades simbólicas (p, q, etc.) son constantes > 0")
                totals["hypotheses"] = hypotheses
        
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
        self.procedure_steps = None

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
