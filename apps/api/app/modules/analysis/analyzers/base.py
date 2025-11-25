from typing import List, Dict, Any, Optional, Union
from sympy import Symbol, Sum, Integer, Expr, latex, sympify
import json
import hashlib
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
    - Memoización (Programación Dinámica) por nodo+contexto para optimización
    
    **Memoización (PD):**
    La clase incluye un sistema de memoización que cachea resultados de análisis
    de nodos AST para evitar trabajo repetido. Esto es especialmente útil cuando:
    - El mismo bloque de código aparece múltiples veces
    - Hay bucles anidados que analizan estructuras similares
    - Se analizan múltiples casos (worst/best/avg) del mismo algoritmo
    
    La memoización se activa automáticamente en nodos que se benefician de ella
    (Block, For, If, While, etc.) y usa una clave compuesta por:
    - Identificador estable del nodo (posición o hash)
    - Modo de análisis (worst/best/avg)
    - Contexto actual (hash del loop_stack)
    
    El cache se limpia automáticamente cuando se llama a clear().
    
    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """
    
    def __init__(self):
        """
        Inicializa una instancia de BaseAnalyzer.
        
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
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
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
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
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
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
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
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
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        return self.expr_converter.ast_to_sympy(expr)

    # --- util 2: gestionar contexto de bucles ---
    def push_multiplier(self, m: Union[str, Expr]):
        """
        Activa un multiplicador (p.ej., iteraciones de un for).
        
        Args:
            m: Multiplicador (puede ser string LaTeX o Expr de SymPy)
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
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
        """
        Desactiva el último multiplicador.
        
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        if self.loop_stack:
            self.loop_stack.pop()

    # --- util 3: ensamblar T_open (o A(n) para promedio) ---
    def build_t_open(self) -> str:
        """
        Construye la ecuación T_open = Σ C_{k}·count_{k} (o A(n) = Σ C_{k}·E[N_{k}] para promedio) en formato KaTeX.
        Usa simplificación inteligente: preserva constantes cuando hay pocas operaciones, simplifica cuando hay muchas.
        
        Returns:
            String con la ecuación de eficiencia en formato KaTeX
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        if not self.rows:
            return "0"
        
        # Decidir si preservar constantes o simplificar
        if self._should_preserve_constants():
            return self._build_t_open_with_constants()
        else:
            return self._build_t_open_simplified()
    
    def _build_t_open_simplified(self) -> str:
        """
        Construye T_open simplificado (versión original que suma directamente los count_expr).
        
        Returns:
            String con la ecuación de eficiencia simplificada en formato KaTeX
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
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
                
                # MEJORA: Si count es 0 (línea nunca ejecutada), saltar esta fila
                # Esto evita términos que no contribuyen a la complejidad
                if count_expr == Integer(0):
                    continue
                
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
        
        # VALIDACIÓN: Verificar que solo contenga n y constantes C_k
        # Se permiten: n, C_k (con cualquier k), números, operadores básicos
        from sympy import Symbol
        free_symbols = total_expr.free_symbols
        n_symbol = Symbol('n')
        
        # Filtrar símbolos no permitidos (no son n, ni constantes C_k)
        invalid_symbols = []
        for sym in free_symbols:
            sym_name = str(sym)
            # Permitir: n, C_k (donde k es un número), t_for, t_while, t_if, t_repeat, t_block
            if sym_name not in ['n'] and not sym_name.startswith('C_') and not sym_name.startswith('t_'):
                invalid_symbols.append(sym_name)
        
        if invalid_symbols:
            # Log de advertencia: la expresión contiene variables no permitidas
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(
                f"T_open contiene variables no permitidas: {invalid_symbols}. "
                f"Solo se permiten 'n' y constantes C_k. Expresión: {total_expr}"
            )
        
        # Convertir a LaTeX
        return latex(total_expr)
    
    def _build_t_open_with_constants(self) -> str:
        """
        Construye T_open preservando las constantes C_k en la expresión.
        Formato: "C_1 · count_1 + C_2 · count_2 + ..."
        
        Returns:
            String con la ecuación de eficiencia preservando constantes en formato KaTeX
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        if not self.rows:
            return "0"
        
        import re
        from sympy import latex, Integer
        
        terms_latex = []
        
        for r in self.rows:
            if r.get('ck') != "—" and r.get('count') != "—":
                ck_str = r.get('ck', '')
                count_str = r.get('count', '1')
                
                # Parsear ck para obtener todas las constantes C_k
                # ck puede ser "C_{1}", "C_{1} + C_{2}", etc.
                # IMPORTANTE: Cada C_k debe tener su propio término separado
                ck_pattern = r'C_\{(\d+)\}'
                ck_matches = re.findall(ck_pattern, ck_str)
                
                # Si no se encontraron matches, intentar sin llaves (formato alternativo)
                if not ck_matches:
                    ck_pattern_alt = r'C_(\d+)'
                    ck_matches = re.findall(ck_pattern_alt, ck_str)
                
                # Obtener count_expr para simplificar sumatorias si es necesario
                count_expr = r.get('count_expr')
                if count_expr is None:
                    count_expr = r.get('count_raw_expr')
                if count_expr is None:
                    count_expr = self._str_to_sympy(r.get('count_raw', '1'))
                
                # Simplificar count_expr (evaluar sumatorias) pero mantener como expresión
                from sympy import simplify as sympy_simplify, expand
                from ..utils.summation_closer import SummationCloser
                
                closer = SummationCloser()
                count_expr_simplified = closer._evaluate_all_sums_sympy(count_expr)
                try:
                    count_expr_simplified = expand(count_expr_simplified)
                    count_expr_simplified = sympy_simplify(count_expr_simplified)
                except Exception:
                    count_expr_simplified = sympy_simplify(count_expr_simplified)
                
                # MEJORA: Si count es 0 (línea nunca ejecutada), saltar esta fila
                # Esto evita términos como "C_4 · 0" en T_open que no aportan información
                if count_expr_simplified == Integer(0):
                    continue
                
                # Convertir count a LaTeX
                count_latex = latex(count_expr_simplified)
                
                # Si count es 1, no mostrar "· 1"
                if count_expr_simplified == Integer(1):
                    count_latex = ""
                    separator = ""
                else:
                    separator = " \\cdot "
                    # Agregar paréntesis si la expresión no es un simple símbolo o número
                    # Esto evita problemas como "C_3 \cdot n - 1" que debería ser "C_3 \cdot (n - 1)"
                    from sympy import Symbol, Add, Mul, Pow
                    # Verificar si necesita paréntesis
                    needs_parens = False
                    if isinstance(count_expr_simplified, Add):
                        # Expresiones de suma/resta siempre necesitan paréntesis cuando se multiplican
                        needs_parens = True
                    elif isinstance(count_expr_simplified, Mul):
                        # Multiplicaciones con más de un término también
                        if len(count_expr_simplified.args) > 1:
                            needs_parens = True
                    elif not isinstance(count_expr_simplified, (Integer, Symbol, Pow)):
                        # Cualquier otra expresión compuesta
                        needs_parens = True
                    
                    if needs_parens:
                        count_latex = f"({count_latex})"
                
                # Crear términos para cada C_k en esta fila
                for ck_num in ck_matches:
                    ck_latex = f"C_{{{ck_num}}}"
                    if count_latex:
                        term = f"{ck_latex}{separator}{count_latex}"
                    else:
                        term = ck_latex
                    terms_latex.append(term)
        
        if not terms_latex:
            return "0"
        
        # Verificar si todos los count son constantes (1) y no hay variables
        # Si es así, simplificar a "C" en lugar de mostrar todas las constantes
        all_counts_are_constant = True
        has_variables = False
        
        from sympy import Symbol, preorder_traversal, simplify as sympy_simplify, expand
        from ..utils.summation_closer import SummationCloser
        
        closer = SummationCloser()
        
        for r in self.rows:
            if r.get('ck') != "—" and r.get('count') != "—":
                count_expr = r.get('count_expr')
                if count_expr is None:
                    count_expr = r.get('count_raw_expr')
                if count_expr is None:
                    count_expr = self._str_to_sympy(r.get('count_raw', '1'))
                
                # Simplificar para verificar si es constante
                count_expr_simplified = closer._evaluate_all_sums_sympy(count_expr)
                try:
                    count_expr_simplified = expand(count_expr_simplified)
                    count_expr_simplified = sympy_simplify(count_expr_simplified)
                except Exception:
                    count_expr_simplified = sympy_simplify(count_expr_simplified)
                
                # Verificar si es constante (Integer) y si tiene variables
                if not isinstance(count_expr_simplified, Integer):
                    all_counts_are_constant = False
                
                # Verificar si hay variables (como n) en el count
                for subexpr in preorder_traversal(count_expr):
                    if isinstance(subexpr, Symbol) and subexpr.name not in ['i', 'j', 'k']:
                        # Si el símbolo es 'n' o similar, hay variables
                        has_variables = True
                        break
                
                if not all_counts_are_constant or has_variables:
                    break
        
        # CAMBIO: Ya no simplificar a "C" incluso si todos son constantes
        # Siempre mostrar la expresión completa con las constantes individuales
        # Esto da más información al usuario sobre la estructura del algoritmo
        # Ejemplo: "2 \cdot C_1 + C_2 + C_3" en lugar de solo "C"
        
        # Unir todos los términos con "+"
        return " + ".join(terms_latex)
    
    def _should_preserve_constants(self) -> bool:
        """
        Decide si debería preservar las constantes C_k en T_open o simplificar.
        
        Criterios:
        - Si hay ≤ 5 términos únicos de C_k → preservar
        - Si hay > 5 términos → simplificar
        - Si hay sumatorias anidadas complejas → simplificar
        - Si todos los count son constantes simples (1, 2, n, n-1) → preservar
        
        Returns:
            True si debería preservar constantes, False si debería simplificar
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        if not self.rows:
            return False
        
        import re
        from sympy import Symbol, Integer, preorder_traversal
        
        # Contar términos únicos de C_k
        unique_ck_terms = set()
        total_ck_count = 0
        has_complex_summations = False
        
        for r in self.rows:
            if r.get('ck') != "—" and r.get('count') != "—":
                ck_str = r.get('ck', '')
                
                # Parsear todas las constantes C_k en esta fila
                ck_pattern = r'C_\{(\d+)\}'
                ck_matches = re.findall(ck_pattern, ck_str)
                unique_ck_terms.update(ck_matches)
                total_ck_count += len(ck_matches)
                
                # Verificar si hay sumatorias complejas en count_expr
                count_expr = r.get('count_expr')
                if count_expr is None:
                    count_expr = r.get('count_raw_expr')
                if count_expr is None:
                    count_expr = self._str_to_sympy(r.get('count_raw', '1'))
                
                # Verificar complejidad: contar sumatorias anidadas
                if count_expr is not None:
                    from sympy import Sum
                    summation_count = 0
                    for subexpr in preorder_traversal(count_expr):
                        if isinstance(subexpr, Sum):
                            summation_count += 1
                            # Si hay más de 2 sumatorias anidadas, considerar complejo
                            if summation_count > 2:
                                has_complex_summations = True
                                break
        
        # Criterio 1: Si hay más de 8 términos únicos de C_k, simplificar
        # Aumentado de 5 a 8 para acomodar algoritmos con asignaciones compuestas
        if len(unique_ck_terms) > 8:
            return False
        
        # Criterio 2: Si hay más de 15 términos totales de C_k, simplificar
        # Aumentado de 10 a 15 para dar más flexibilidad
        if total_ck_count > 15:
            return False
        
        # Criterio 3: Si hay sumatorias complejas, simplificar
        if has_complex_summations:
            return False
        
        # Criterio 4: Si todos los count son constantes simples, preservar
        # (esto se verifica implícitamente si no hay sumatorias complejas y hay pocos términos)
        
        # Si llegamos aquí, preservar constantes
        return True
    
    def build_t_open_expr(self) -> Optional[Expr]:
        """
        Construye la expresión SymPy de T_open = Σ C_{k}·count_{k}.
        
        Returns:
            Expresión SymPy simplificada o None si no hay términos
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
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
                
                # MEJORA: Si count es 0 (línea nunca ejecutada), saltar esta fila
                # Esto evita términos que no contribuyen a la complejidad
                if count_expr == Integer(0):
                    continue
                
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
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
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
    def _get_node_id(self, node: Any) -> str:
        """
        Obtiene un identificador estable para un nodo del AST.
        
        Prioridad:
        1. Posición (línea, columna) si está disponible
        2. Hash del contenido del nodo (tipo + estructura)
        3. ID del objeto como fallback
        
        Args:
            node: Nodo del AST
            
        Returns:
            String identificador estable del nodo
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        if node is None:
            return "null"
        
        # Intentar usar posición si está disponible
        if isinstance(node, dict):
            pos = node.get("pos", {})
            if pos and isinstance(pos, dict):
                line = pos.get("line")
                column = pos.get("column")
                if line is not None:
                    # Usar posición como identificador
                    node_type = node.get("type", "unknown")
                    if column is not None:
                        return f"{node_type}:{line}:{column}"
                    return f"{node_type}:{line}"
            
            # Si no hay posición, usar hash del contenido
            try:
                # Crear una representación estable del nodo (sin objetos no serializables)
                node_repr = {
                    "type": node.get("type"),
                    "name": node.get("name"),
                    "body": "..." if "body" in node else None,  # Solo indicar presencia, no contenido
                }
                node_str = json.dumps(node_repr, sort_keys=True)
                node_hash = hashlib.md5(node_str.encode()).hexdigest()[:8]
                return f"{node.get('type', 'unknown')}:{node_hash}"
            except Exception:
                pass
        
        # Fallback: usar ID del objeto
        return str(id(node))
    
    def _should_memoize(self, node: Any) -> bool:
        """
        Determina si un nodo debe ser cacheado usando memoización.
        
        Estrategia:
        - Cachear nodos que pueden aparecer múltiples veces (Block, For, If, While, etc.)
        - No cachear nodos simples (Assign, Return, etc.) que son únicos por línea
        - No cachear si el nodo es None o no tiene estructura
        
        Args:
            node: Nodo del AST a evaluar
            
        Returns:
            True si el nodo debe ser cacheado, False en caso contrario
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        if node is None:
            return False
        
        if not isinstance(node, dict):
            return False
        
        node_type = node.get("type", "").lower()
        
        # Nodos que se benefician de memoización (estructuras que pueden repetirse)
        memoizable_types = {
            "block", "for", "while", "repeat", "if", "procdef", "program"
        }
        
        return node_type in memoizable_types
    
    def memo_key(self, node: Any, mode: str, ctx_hash: str) -> str:
        """
        Genera clave estable para cachear filas de un subárbol bajo un contexto.
        
        La clave combina:
        - Identificador estable del nodo (posición o hash)
        - Modo de análisis (worst/best/avg)
        - Hash del contexto actual (loop_stack)
        
        Args:
            node: Nodo del AST
            mode: Modo de análisis ("worst", "best", "avg")
            ctx_hash: Hash del contexto actual (obtenido con get_context_hash())
            
        Returns:
            Clave única para el cache en formato: "{node_id}|{mode}|{ctx_hash}"
            
        Example:
            >>> analyzer = BaseAnalyzer()
            >>> node = {"type": "Block", "pos": {"line": 5, "column": 10}}
            >>> ctx_hash = analyzer.get_context_hash()
            >>> key = analyzer.memo_key(node, "worst", ctx_hash)
            >>> cached = analyzer.memo_get(key)
            >>> if cached is None:
            ...     # Analizar nodo...
            ...     analyzer.memo_set(key, rows)
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        nid = self._get_node_id(node)
        return f"{nid}|{mode}|{ctx_hash}"

    def memo_get(self, key: str) -> Optional[List[LineCost]]:
        """
        Obtiene filas del cache usando la clave proporcionada.
        
        Args:
            key: Clave del cache (generada con memo_key())
            
        Returns:
            Lista de filas cacheadas o None si no existe en el cache
            
        Example:
            >>> analyzer = BaseAnalyzer()
            >>> key = analyzer.memo_key(node, "worst", analyzer.get_context_hash())
            >>> cached_rows = analyzer.memo_get(key)
            >>> if cached_rows:
            ...     analyzer.rows.extend(cached_rows)
            ...     return  # Usar resultados cacheados
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        return self.memo.get(key)

    def memo_set(self, key: str, rows: List[LineCost]):
        """
        Guarda filas en el cache para reutilización posterior.
        
        Crea una copia superficial de las filas para evitar aliasing accidental
        y asegurar que los cambios posteriores no afecten el cache.
        
        Args:
            key: Clave del cache (generada con memo_key())
            rows: Lista de filas a cachear (LineCost)
            
        Example:
            >>> analyzer = BaseAnalyzer()
            >>> rows_before = len(analyzer.rows)
            >>> # ... analizar nodo ...
            >>> rows_added = analyzer.rows[rows_before:]
            >>> key = analyzer.memo_key(node, "worst", analyzer.get_context_hash())
            >>> analyzer.memo_set(key, rows_added)
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
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
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        self.symbols[symbol] = description

    def add_note(self, note: str):
        """
        Agrega una nota al análisis.
        
        Args:
            note: Nota descriptiva
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        self.notes.append(note)


    def clear(self):
        """
        Limpia todos los datos del analizador.
        
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        self.rows.clear()
        self.loop_stack.clear()
        self.symbols.clear()
        self.notes.clear()
        self.memo.clear()
        self.t_polynomial = None
        self.procedure_steps = None

    def add_procedure_step(self, step: str) -> None:
        """
        Agrega un paso al procedimiento para caso promedio.
        
        Args:
            step: String con el paso del procedimiento (puede contener LaTeX)
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        if self.procedure_steps is None:
            self.procedure_steps = []
        self.procedure_steps.append(step)

    def get_context_hash(self) -> str:
        """
        Genera un hash del contexto actual (loop_stack).
        
        Returns:
            String hash del contexto
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
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
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        self.counter += 1
        return f"C_{{{self.counter}}}"
