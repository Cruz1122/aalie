from typing import Any, Dict, Optional
from sympy import Expr, latex, Integer
from .base import BaseAnalyzer
from ..visitors.for_visitor import ForVisitor
from ..visitors.if_visitor import IfVisitor
from ..visitors.while_repeat_visitor import WhileRepeatVisitor
from ..visitors.simple_visitor import SimpleVisitor
from ..utils.summation_closer import SummationCloser
from ..utils.complexity_classes import ComplexityClasses
from ..models.avg_model import AvgModel


class IterativeAnalyzer(BaseAnalyzer, ForVisitor, IfVisitor, WhileRepeatVisitor, SimpleVisitor):
    """
    Analizador iterativo unificado que combina todos los visitors.
    
    Implementa el análisis completo de algoritmos con:
    - Bucles FOR con multiplicadores
    - Condicionales IF con selección de rama dominante
    - Bucles WHILE y REPEAT con símbolos de iteración
    - Líneas simples (asignaciones, llamadas, returns)
    - Dispatcher unificado para todos los tipos de nodos
    
    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """
    
    def __init__(self):
        """
        Inicializa una instancia de IterativeAnalyzer.
        
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        super().__init__()
        self.big_o: Optional[str] = None
        self.big_omega: Optional[str] = None
        self.big_theta: Optional[str] = None
    
    def _expr_to_str(self, expr: Any) -> str:
        """
        Convierte una expresión del AST a string.
        
        Args:
            expr: Expresión del AST
            
        Returns:
            String representando la expresión
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        if expr is None:
            return ""
        elif isinstance(expr, str):
            return expr
        elif isinstance(expr, (int, float)):
            return str(expr)
        elif isinstance(expr, dict):
            expr_type = expr.get("type", "")
            
            if expr_type.lower() == "identifier":
                return expr.get("name", "unknown")
            elif expr_type.lower() == "number":
                return str(expr.get("value", "0"))
            elif expr_type.lower() == "literal":
                return str(expr.get("value", "0"))
            elif expr_type.lower() == "binary":
                left = self._expr_to_str(expr.get("left", ""))
                right = self._expr_to_str(expr.get("right", ""))
                op = expr.get("operator", "")
                # Asegurar que el operador no se pierda
                if not op:
                    op = "-"  # fallback para operadores perdidos
                return f"({left}) {op} ({right})"
            elif expr_type.lower() == "index":
                target = self._expr_to_str(expr.get("target", ""))
                index = self._expr_to_str(expr.get("index", ""))
                return f"{target}[{index}]"
            elif expr_type.lower() == "unary":
                arg = self._expr_to_str(expr.get("arg", ""))
                op = expr.get("operator", "")
                return f"{op}({arg})"
            else:
                # Fallback para tipos desconocidos
                return str(expr.get("value", str(expr)))
        else:
            return str(expr)
    
    def _normalize_string(self, s: str) -> str:
        """
        Normaliza strings con formato básico (solo formato, no simplificación).
        
        Args:
            s: String a normalizar
            
        Returns:
            String normalizado
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        if not s:
            return s
        
        # Mejorar formato de rangos
        s = s.replace("i=1\\ldotsn", "i=1..n")
        s = s.replace("i=1\\ldots n", "i=1..n")
        
        return s
    
    def analyze(self, ast: Dict[str, Any], mode: str = "worst", api_key: Optional[str] = None, avg_model: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Analiza un AST completo y retorna el resultado.
        
        Args:
            ast: AST del algoritmo a analizar
            mode: Modo de análisis ("worst", "best", "avg")
            api_key: API Key (ignorado, mantenido por compatibilidad)
            avg_model: Diccionario con configuración del modelo probabilístico para caso promedio
                      {"mode": "uniform"|"symbolic", "predicates": {...}}
            
        Returns:
            Resultado del análisis con byLine, T_open, procedure, etc.
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        # Limpiar estado previo
        self.clear()
        
        # Establecer modo
        self.mode = mode
        
        # Crear instancia de AvgModel si mode == "avg"
        if mode == "avg":
            if avg_model:
                self.avg_model = AvgModel(
                    mode=avg_model.get("mode", "uniform"),
                    predicates=avg_model.get("predicates", {})
                )
            else:
                # Por defecto, modelo uniforme sin predicados
                self.avg_model = AvgModel(mode="uniform", predicates={})
        else:
            self.avg_model = None
        
        # Visitar el AST completo
        self.visit(ast, mode)
        
        # Usar SymPy para cerrar sumatorias y generar procedimientos
        closer = SummationCloser()
        complexity = ComplexityClasses()
        
        # Detectar variable principal (n por defecto)
        variable = "n"
        
        # Cerrar sumatorias y generar procedimientos para cada fila
        for row in self.rows:
            # Obtener expresión SymPy si está disponible
            count_raw_expr = row.get("count_raw_expr")
            count_raw_latex = row.get("count_raw", "1")
            
            # En caso promedio con early return, ajustar returns ANTES de procesar
            # return i (éxito): siempre ocurre exactamente 1 vez, no E[iter] veces
            # return -1 (fracaso): nunca ocurre (0)
            if mode == "avg" and row.get("kind") == "return":
                note = row.get("note", "")
                from sympy import Integer
                # Verificar fracaso PRIMERO (más específico)
                # return -1: nunca ocurre (0)
                if note and ("fracaso" in note or "nunca ocurre" in note):
                    # return -1: nunca ocurre (0)
                    row["count_raw_expr"] = Integer(0)
                    row["count_raw"] = "0"
                    row["count"] = "0"
                    row["expectedRuns"] = "0"
                    # Generar procedimiento
                    row["procedure"] = [
                        f"\\text{{Esperanza de ejecuciones para línea {row.get('line', '?')}: }} E[N_{{{row.get('line', '?')}}}] = 0",
                        "\\text{Resultado: } 0"
                    ]
                    continue  # Saltar procesamiento normal
                # Verificar éxito (dentro o fuera del bucle)
                # Verificar que sea éxito real, no "éxito seguro" en contexto de fracaso
                elif note and ("éxito seguro" in note or ("éxito" in note and "siempre ocurre" in note and "fracaso" not in note)):
                    # return i: siempre ocurre 1 vez, no multiplicado por E[iter]
                    row["count_raw_expr"] = Integer(1)
                    row["count_raw"] = "1"
                    row["count"] = "1"
                    row["expectedRuns"] = "1"
                    # Generar procedimiento
                    row["procedure"] = [
                        f"\\text{{Esperanza de ejecuciones para línea {row.get('line', '?')}: }} E[N_{{{row.get('line', '?')}}}] = 1",
                        "\\text{Resultado: } 1"
                    ]
                    continue  # Saltar procesamiento normal
            
            # Preferir usar count_raw_expr directamente si está disponible
            if count_raw_expr is not None:
                try:
                    # Actualizar count_raw para reflejar count_raw_expr (puede incluir probabilidades)
                    # Esto asegura que count_raw muestre la expresión con probabilidad antes del cierre
                    try:
                        count_raw_latex_from_expr = latex(count_raw_expr)
                        if isinstance(count_raw_latex_from_expr, str):
                            row["count_raw"] = count_raw_latex_from_expr
                            # También actualizar expectedRuns en modo promedio para que refleje la probabilidad
                            if mode == "avg":
                                row["expectedRuns"] = count_raw_latex_from_expr
                    except Exception:
                        pass  # Si falla, mantener count_raw original
                    
                    # Pasar el objeto SymPy directamente a close_summation
                    closed_count, steps = closer.close_summation(count_raw_expr, variable)
                    row["count"] = closed_count
                    
                    # En modo promedio, actualizar expectedRuns con la expresión cerrada
                    if mode == "avg":
                        row["expectedRuns"] = closed_count
                    
                    # Guardar la expresión SymPy evaluada para usar en build_t_open_expr
                    from sympy import simplify
                    # Si contiene símbolos iterativos, no intentar evaluar sumatorias
                    # (ya se manejan en close_summation)
                    if closer._has_iterative_symbols(count_raw_expr) and not closer._has_summations(count_raw_expr):
                        # Es un símbolo iterativo puro, usar la expresión tal cual
                        count_evaluated = simplify(count_raw_expr)
                    else:
                        # Evaluar sumatorias si las hay
                        count_evaluated = closer._evaluate_all_sums_sympy(count_raw_expr)
                        count_evaluated = simplify(count_evaluated)
                    row["count_expr"] = count_evaluated  # Expresión SymPy evaluada
                    
                    # Generar procedimiento paso a paso (consistente entre modos)
                    count_raw_latex_str = row.get("count_raw", latex(count_raw_expr) if hasattr(count_raw_expr, '__str__') else str(count_raw_expr))
                    
                    if mode == "avg":
                        # Para caso promedio, agregar explicación de E[N_ℓ]
                        procedure_steps = [
                            f"\\text{{Esperanza de ejecuciones para línea {row.get('line', '?')}: }} E[N_{{{row.get('line', '?')}}}] = {count_raw_latex_str}"
                        ]
                        if steps:
                            procedure_steps.extend(steps)
                        else:
                            procedure_steps.append(f"\\text{{Resultado: }} E[N_{{{row.get('line', '?')}}}] = {closed_count}")
                        row["procedure"] = procedure_steps
                    else:
                        # Para worst/best, procedimiento normal
                        # Si hay pasos generados (incluyendo para símbolos iterativos), usarlos
                        if steps:
                            row["procedure"] = steps
                        else:
                            # Si no hay pasos, generar procedimiento básico
                            row["procedure"] = [
                                f"\\text{{Expresión original: }} {count_raw_latex_str}",
                                f"\\text{{Resultado: }} {closed_count}"
                            ]
                    continue
                except Exception as e:
                    print(f"[IterativeAnalyzer] Error cerrando sumatoria con Expr para {count_raw_expr}: {e}")
                    import traceback
                    traceback.print_exc()
                    # Fallback: convertir a LaTeX y procesar normalmente
            
            # Fallback: procesar desde LaTeX
            # Asegurar que siempre tengamos un string LaTeX para close_summation
            if count_raw_expr is not None:
                try:
                    # Convertir expresión SymPy a LaTeX para procesamiento
                    count_raw_latex = latex(count_raw_expr)
                    # Verificar que el resultado sea un string
                    if not isinstance(count_raw_latex, str):
                        count_raw_latex = str(count_raw_latex)
                except Exception as e:
                    print(f"[IterativeAnalyzer] Error convirtiendo count_raw_expr a LaTeX: {e}")
                    # Fallback: usar count_raw si está disponible
                    if not isinstance(count_raw_latex, str):
                        # Si count_raw_expr es 0, mantener "0"
                        if count_raw_expr == 0 or (hasattr(count_raw_expr, '__eq__') and count_raw_expr == 0):
                            count_raw_latex = "0"
                        else:
                            count_raw_latex = "1"
            
            # Asegurar que count_raw_latex sea un string
            # Si count_raw es "0", mantener "0", no convertir a "1"
            if not isinstance(count_raw_latex, str):
                if count_raw_latex == 0 or (hasattr(count_raw_latex, '__eq__') and count_raw_latex == 0):
                    count_raw_latex = "0"
                else:
                    count_raw_latex = str(count_raw_latex) if count_raw_latex is not None else "1"
            
            # Cerrar sumatoria (trabaja con LaTeX por ahora, pero recibe SymPy internamente)
            try:
                closed_count, steps = closer.close_summation(count_raw_latex, variable)
                row["count"] = closed_count
                
                # En modo promedio, actualizar expectedRuns con la expresión cerrada
                if mode == "avg":
                    row["expectedRuns"] = closed_count
                
                # Generar procedimiento paso a paso
                if mode == "avg":
                    # Para caso promedio, agregar explicación de E[N_ℓ]
                    procedure_steps = [
                        f"\\text{{Esperanza de ejecuciones para línea {row.get('line', '?')}: }} E[N_{{{row.get('line', '?')}}}] = {count_raw_latex}"
                    ]
                    if steps:
                        procedure_steps.extend(steps)
                    else:
                        procedure_steps.append(f"\\text{{Resultado: }} E[N_{{{row.get('line', '?')}}}] = {closed_count}")
                    row["procedure"] = procedure_steps
                else:
                    # Para worst/best, procedimiento normal
                    if steps:
                        row["procedure"] = steps
                    else:
                        row["procedure"] = [
                            f"\\text{{Expresión original: }} {count_raw_latex}",
                            f"\\text{{Resultado: }} {closed_count}"
                        ]
            except Exception as e:
                print(f"[IterativeAnalyzer] Error cerrando sumatoria para {count_raw_latex}: {e}")
                import traceback
                traceback.print_exc()
                # Fallback: usar expresión original
                row["count"] = count_raw_latex
                row["procedure"] = [f"\\text{{Error al simplificar: }} {count_raw_latex}"]
        
        # Calcular T_polynomial y notaciones asintóticas usando SymPy
        # Obtener expresión SymPy de T_open directamente (más robusto que parsear LaTeX)
        t_open_expr = self.build_t_open_expr()
        
        # Calcular T_polynomial: agrupar términos con C_k (para mostrar estructura)
        self._calculate_t_polynomial_fallback()
        
        # Generar procedimiento general para caso promedio
        if mode == "avg":
            self._generate_avg_procedure()
        
        # Calcular notaciones asintóticas usando la expresión SymPy directamente
        if t_open_expr is not None:
            try:
                from sympy import latex as sympy_latex, Symbol, expand, simplify
                
                # Primero, asegurarse de que la expresión esté completamente simplificada
                t_open_expr = expand(t_open_expr)
                t_open_expr = simplify(t_open_expr)
                
                # Verificar y eliminar variables de iteración que no deberían estar
                iteration_vars = ['i', 'j', 'k']
                for var_name in iteration_vars:
                    var_symbol = Symbol(var_name, integer=True)
                    if t_open_expr.has(var_symbol):
                        # Intentar expandir y simplificar para eliminar la variable
                        t_open_expr = expand(t_open_expr)
                        t_open_expr = simplify(t_open_expr)
                
                n_sym = Symbol(variable, integer=True, positive=True)
                
                # Método robusto: buscar término con mayor potencia de n
                try:
                    # Expandir completamente y buscar manualmente
                    expanded = expand(t_open_expr)
                    
                    # Si es una expresión Add (suma de términos), analizar cada término
                    if hasattr(expanded, 'args') and len(expanded.args) > 0:
                        terms = expanded.args
                        max_degree = -1
                        dominant_term = None
                        
                        for term in terms:
                            # Calcular el grado de este término respecto a n
                            # Método directo: buscar potencias de n en el término
                            term_degree = 0
                            
                            # Buscar todas las potencias de n en el término
                            # No confiar en has() ya que puede fallar en algunos casos
                            from sympy import preorder_traversal, Pow
                            
                            # Recorrer todos los subexpresiones buscando n y n^k
                            for subexpr in preorder_traversal(term):
                                # Comparar por nombre del símbolo, no por identidad (pueden tener diferentes propiedades)
                                if isinstance(subexpr, Symbol) and subexpr.name == n_sym.name:
                                    # Encontramos n directamente
                                    term_degree = max(term_degree, 1)
                                elif isinstance(subexpr, Pow):
                                    # Verificar si es una potencia de n (comparar por nombre)
                                    try:
                                        if isinstance(subexpr.base, Symbol) and subexpr.base.name == n_sym.name:
                                            exp_val = subexpr.exp
                                            if exp_val.is_number:
                                                exp_int = int(float(exp_val))
                                                term_degree = max(term_degree, exp_int)
                                    except Exception:
                                        pass
                            
                            if term_degree > max_degree:
                                max_degree = term_degree
                                dominant_term = term
                        
                        if dominant_term is not None and max_degree >= 0:
                            # Simplificar el término dominante
                            dominant_term = simplify(dominant_term)
                            
                            # Para notación asintótica, simplificar el coeficiente: O(5n²/2) -> O(n²)
                            # Extraer solo la potencia de n sin el coeficiente
                            if max_degree > 0:
                                # Crear solo n^max_degree para la notación asintótica
                                from sympy import Symbol as SymSymbol
                                n_for_notation = SymSymbol(variable, integer=True, positive=True)
                                if max_degree == 1:
                                    dominant_latex = sympy_latex(n_for_notation)
                                else:
                                    dominant_latex = sympy_latex(n_for_notation**max_degree)
                            else:
                                # Si es constante (grado 0), mostrar como "1" en notación asintótica
                                # En notación asintótica, todas las constantes son equivalentes a 1
                                dominant_latex = "1"
                            
                            # Construir notaciones asintóticas
                            # Para caso promedio con símbolos, agregar hipótesis
                            if mode == "avg" and self.avg_model and self.avg_model.has_symbols():
                                # Verificar si hay símbolos probabilísticos en la expresión
                                from sympy import Symbol as SymSymbol
                                prob_symbols = ['p', 'q', 'r', 's', 't']
                                has_prob_symbols = False
                                for sym_name in prob_symbols:
                                    sym = SymSymbol(sym_name, real=True)
                                    if t_open_expr.has(sym):
                                        has_prob_symbols = True
                                        break
                                
                                if has_prob_symbols:
                                    # Notación condicionada
                                    self.big_o = f"O({dominant_latex}) \\text{{ (para }} p > 0 \\text{{ constante)}}"
                                    self.big_omega = f"\\Omega({dominant_latex}) \\text{{ (para }} p > 0 \\text{{ constante)}}"
                                    self.big_theta = f"\\Theta({dominant_latex}) \\text{{ (para }} p > 0 \\text{{ constante)}}"
                                else:
                                    self.big_o = f"O({dominant_latex})"
                                    self.big_omega = f"\\Omega({dominant_latex})"
                                    self.big_theta = f"\\Theta({dominant_latex})"
                            else:
                                self.big_o = f"O({dominant_latex})"
                                self.big_omega = f"\\Omega({dominant_latex})"
                                self.big_theta = f"\\Theta({dominant_latex})"
                        else:
                            # Fallback: usar ComplexityClasses
                            t_open_latex = sympy_latex(t_open_expr)
                            self.big_o = complexity.calculate_big_o(t_open_latex, variable)
                            self.big_omega = complexity.calculate_big_omega(t_open_latex, variable)
                            self.big_theta = complexity.calculate_big_theta(t_open_latex, variable)
                    else:
                        # Expresión simple, verificar si es constante
                        simplified = simplify(t_open_expr)
                        # Verificar si la expresión es constante (no depende de n)
                        n_sym = Symbol(variable, integer=True, positive=True)
                        if not simplified.has(n_sym):
                            # Es constante, mostrar como "1"
                            dominant_latex = "1"
                        else:
                            # No es constante, usar la expresión
                            dominant_latex = sympy_latex(simplified)
                        self.big_o = f"O({dominant_latex})"
                        self.big_omega = f"\\Omega({dominant_latex})"
                        self.big_theta = f"\\Theta({dominant_latex})"
                except Exception as e:
                    print(f"[IterativeAnalyzer] Error calculando término dominante: {e}")
                    import traceback
                    traceback.print_exc()
                    # Fallback: usar ComplexityClasses con LaTeX
                    t_open_latex = sympy_latex(t_open_expr)
                    self.big_o = complexity.calculate_big_o(t_open_latex, variable)
                    self.big_omega = complexity.calculate_big_omega(t_open_latex, variable)
                    self.big_theta = complexity.calculate_big_theta(t_open_latex, variable)
            except Exception as e:
                print(f"[IterativeAnalyzer] Error calculando notaciones asintóticas desde expresión SymPy: {e}")
                import traceback
                traceback.print_exc()
                # Valores por defecto
                self.big_o = "O(1)"
                self.big_omega = "\\Omega(1)"
                self.big_theta = "\\Theta(1)"
        else:
            # Si no hay expresión, usar valores por defecto
            self.big_o = "O(1)"
            self.big_omega = "\\Omega(1)"
            self.big_theta = "\\Theta(1)"

        # Retornar resultado
        return self.result()
    
    def _generate_avg_procedure(self):
        """
        Genera los pasos del procedimiento para caso promedio.
        Almacena los pasos en self.procedure_steps para incluirlos en totals.procedure.
        """
        if self.mode != "avg" or not self.avg_model:
            return
        
        procedure_steps = []
        
        # Paso 1: Definición de caso promedio
        procedure_steps.append(
            "\\text{Paso 1: Definición de caso promedio}"
        )
        procedure_steps.append(
            "A(n) = \\sum_{I \\in I_n} T(I) \\cdot p(I)"
        )
        
        # Paso 2: Si es uniforme, mostrar fórmula uniforme
        if self.avg_model.mode == "uniform":
            procedure_steps.append(
                "\\text{Paso 2: Modelo uniforme}"
            )
            procedure_steps.append(
                "A(n) = \\frac{1}{|I_n|} \\sum_{I \\in I_n} T(I)"
            )
        
        # Paso 3: Linealidad de la esperanza
        procedure_steps.append(
            "\\text{Paso 3: Linealidad de la esperanza}"
        )
        procedure_steps.append(
            "A(n) = \\sum_{\\ell} C_{\\ell} \\cdot E[N_{\\ell}]"
        )
        
        # Paso 4: Cálculo de E[N_ℓ] por constructo
        procedure_steps.append(
            "\\text{Paso 4: Cálculo de } E[N_{\\ell}] \\text{ por constructo}"
        )
        
        # Agregar explicaciones por tipo de constructo encontrado
        constructos_encontrados = set()
        for row in self.rows:
            kind = row.get("kind", "")
            if kind in ["for", "if", "while", "repeat"]:
                constructos_encontrados.add(kind)
        
        if "for" in constructos_encontrados:
            # Verificar si hay early return para mostrar regla correcta
            has_early_return_avg = False
            for row in self.rows:
                if row.get("kind") == "for" and "E[iter]" in str(row.get("note", "")):
                    has_early_return_avg = True
                    break
            if has_early_return_avg:
                procedure_steps.append(
                    "\\text{- FOR con early return: } E[iter] = \\frac{n+1}{2} \\text{ (uniforme condicionado a éxito)}"
                )
            else:
                procedure_steps.append(
                    "\\text{- FOR: } E[N_{cuerpo}] = b - a + 1 \\text{ (determinista)}"
                )
        if "if" in constructos_encontrados:
            # Verificar si hay early return para mostrar regla correcta
            has_early_return_avg = False
            has_success_return = False
            for row in self.rows:
                if row.get("kind") == "return" and row.get("note") and "éxito seguro" in row.get("note", ""):
                    has_early_return_avg = True
                    has_success_return = True
                    break
            if has_early_return_avg and has_success_return:
                procedure_steps.append(
                    "\\text{- IF con early return: siempre entra en THEN (éxito seguro), no aplicar probabilidades}"
                )
            else:
                model_info = self.avg_model.get_model_info()
                p_str = self.avg_model.get_default_probability()
                procedure_steps.append(
                    f"\\text{{- IF: }} E[N_{{then}}] = p \\cdot \\#visitas, E[N_{{else}}] = (1-p) \\cdot \\#visitas \\text{{ (con }} p = {p_str} \\text{{ por defecto)}}"
                )
        if "while" in constructos_encontrados:
            procedure_steps.append(
                "\\text{- WHILE: } E[\\#iteraciones] = \\frac{1}{p} \\text{ (geométrico) o símbolo } \\bar{{t}}_{{while}}"
            )
        
        # Paso 5: Cierre de sumatorias
        procedure_steps.append(
            "\\text{Paso 5: Cierre de sumatorias}"
        )
        t_open = self.build_t_open()
        procedure_steps.append(
            f"A(n) = {t_open}"
        )
        
        # Paso 6: Resultado y modelo
        procedure_steps.append(
            "\\text{Paso 6: Resultado y modelo usado}"
        )
        # Detectar si estamos en Modelo A (éxito seguro con early return)
        has_success_return = False
        has_failure_return = False
        for row in self.rows:
            if row.get("kind") == "return":
                note = row.get("note", "")
                if note and ("éxito seguro" in note or ("éxito" in note and "siempre ocurre" in note)):
                    has_success_return = True
                if note and ("fracaso" in note or "nunca ocurre" in note):
                    has_failure_return = True
        # Si hay early return en bucle y éxito seguro, es Modelo A
        if has_success_return and has_failure_return:
            model_note = "uniforme (éxito)"
        else:
            model_info = self.avg_model.get_model_info()
            model_note = model_info['note']
        procedure_steps.append(
            f"\\text{{Modelo: {model_note}}}"
        )
        
        # Agregar hipótesis si hay símbolos
        if self.avg_model.has_symbols():
            procedure_steps.append(
                "\\text{Hipótesis: Probabilidades simbólicas (p, q, etc.) son constantes > 0}"
            )
        
        # Almacenar en un campo separado para totals.procedure (no en notes)
        self.procedure_steps = procedure_steps
    
    def _calculate_t_polynomial_fallback(self):
        """
        Calcula T_polynomial de forma determinista usando SymPy Poly.
        
        Agrupa términos por potencias de n (n², n¹, n⁰) preservando las constantes C_k.
        Usa Poly para extraer coeficientes de todas las potencias de n de forma determinista.
        
        Returns:
            None (establece self.t_polynomial)
            
        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        from sympy import Symbol, Integer, latex, expand, simplify, Poly
        from ..utils.summation_closer import SummationCloser
        import re
        
        n_sym = Symbol(self.variable, integer=True, positive=True)
        
        # Función auxiliar para parsear ck_str que puede contener múltiples C_k
        def parse_ck_string(ck_str):
            """Parsea un string como 'C_3 + C_4' en una lista de C_k individuales."""
            ck_pattern = r'C_\{(\d+)\}'
            ck_matches = re.findall(ck_pattern, ck_str)
            return [f"C_{{{num}}}" for num in ck_matches]
        
        # Estructura para agrupar C_k por grado del polinomio
        # {degree: {coeff_tuple: [lista de C_k strings]}}
        # coeff_tuple es una tupla normalizada para comparación determinista
        degree_to_coeffs = {}  # {degree: {coeff_tuple: [C_k strings]}}
        
        closer = SummationCloser()
        
        # Procesar cada fila y extraer coeficientes polinomiales
        for row in self.rows:
            if row.get('ck') != "—" and row.get('count') != "—":
                ck_str = row.get('ck', '')
                count_expr = row.get('count_expr')
                if count_expr is None:
                    count_expr = row.get('count_raw_expr')
                if count_expr is None:
                    count_expr = self._str_to_sympy(row.get('count_raw', '1'))
                
                # Evaluar sumatorias y simplificar
                count_expr = closer._evaluate_all_sums_sympy(count_expr)
                count_expr = expand(count_expr)
                count_expr = simplify(count_expr)
                
                # Convertir a Poly para extraer coeficientes de todas las potencias
                try:
                    # Intentar crear Poly (puede fallar si hay símbolos no numéricos)
                    poly = Poly(count_expr, n_sym)
                    all_coeffs = poly.all_coeffs()  # Lista de coeficientes [coeff_n^max, ..., coeff_n^1, coeff_n^0]
                    max_degree = poly.degree()
                    
                    # Procesar cada coeficiente (de mayor a menor grado)
                    for degree in range(max_degree, -1, -1):
                        coeff_idx = max_degree - degree
                        if coeff_idx < len(all_coeffs):
                            coeff = all_coeffs[coeff_idx]
                            coeff = simplify(coeff)
                            
                            # Verificar si el coeficiente es cero (saltar términos nulos)
                            try:
                                if coeff.is_zero if hasattr(coeff, 'is_zero') else (coeff == 0 or coeff == Integer(0)):
                                    continue
                            except:
                                # Si hay error, intentar simplificar y verificar de nuevo
                                try:
                                    coeff = simplify(expand(coeff))
                                    if coeff.is_zero if hasattr(coeff, 'is_zero') else (coeff == 0 or coeff == Integer(0)):
                                        continue
                                except:
                                    pass
                            
                            # Normalizar coeficiente para comparación determinista
                            # Usar una representación canónica (expandida y simplificada)
                            coeff_normalized = expand(coeff)
                            coeff_normalized = simplify(coeff_normalized)
                            
                            # Verificar nuevamente después de normalizar (por si se simplificó a 0)
                            try:
                                if coeff_normalized.is_zero if hasattr(coeff_normalized, 'is_zero') else (coeff_normalized == 0 or coeff_normalized == Integer(0)):
                                    continue
                            except:
                                pass
                            
                            # Crear tupla para comparación determinista
                            # Convertir a string canónico para evitar problemas de comparación
                            coeff_key = str(coeff_normalized)
                            
                            # Inicializar estructura si es necesario
                            if degree not in degree_to_coeffs:
                                degree_to_coeffs[degree] = {}
                            
                            if coeff_key not in degree_to_coeffs[degree]:
                                degree_to_coeffs[degree][coeff_key] = {
                                    'coeff': coeff_normalized,
                                    'cks': []
                                }
                            
                            # Agregar C_k a este coeficiente
                            degree_to_coeffs[degree][coeff_key]['cks'].append(ck_str)
                            
                except (ValueError, TypeError, AttributeError):
                    # Si Poly falla (p.ej., expresión no es polinómica), tratar como constante
                    # Esto puede pasar con expresiones complejas, pero intentamos manejarlo
                    try:
                        # Intentar extraer como constante (grado 0)
                        const_value = simplify(count_expr.subs(n_sym, 0))
                        
                        # Verificar si la constante es cero
                        try:
                            if const_value.is_zero if hasattr(const_value, 'is_zero') else (const_value == 0 or const_value == Integer(0)):
                                continue
                        except:
                            pass
                        
                        const_key = str(const_value)
                        
                        if 0 not in degree_to_coeffs:
                            degree_to_coeffs[0] = {}
                        
                        if const_key not in degree_to_coeffs[0]:
                            degree_to_coeffs[0][const_key] = {
                                'coeff': const_value,
                                'cks': []
                            }
                        
                        degree_to_coeffs[0][const_key]['cks'].append(ck_str)
                    except:
                        # Si todo falla, ignorar esta fila
                        continue
        
        if not degree_to_coeffs:
            self.t_polynomial = "0"
            return
        
        # Construir T_polynomial en orden descendente de grado (n², n¹, n⁰)
        polynomial_terms = []
        
        # Ordenar grados de mayor a menor
        sorted_degrees = sorted(degree_to_coeffs.keys(), reverse=True)
        
        for degree in sorted_degrees:
            coeff_dict = degree_to_coeffs[degree]
            
            # Para cada coeficiente único en este grado, crear un término
            # Ordenar coeficientes de forma determinista (por representación string)
            sorted_coeffs = sorted(coeff_dict.items(), key=lambda x: str(x[0]))
            
            for coeff_key, data in sorted_coeffs:
                coeff = data['coeff']
                cks_list = data['cks']
                
                # Verificar si el coeficiente es cero (eliminar términos nulos)
                try:
                    if coeff.is_zero if hasattr(coeff, 'is_zero') else (coeff == 0 or coeff == Integer(0)):
                        continue
                except:
                    # Si hay error al verificar, intentar simplificar y verificar de nuevo
                    try:
                        coeff_simplified = simplify(coeff)
                        if coeff_simplified.is_zero if hasattr(coeff_simplified, 'is_zero') else (coeff_simplified == 0 or coeff_simplified == Integer(0)):
                            continue
                        coeff = coeff_simplified
                    except:
                        pass
                
                # Parsear y combinar todas las C_k
                all_cks = []
                for ck in cks_list:
                    parsed = parse_ck_string(ck)
                    all_cks.extend(parsed)
                
                # Ordenar C_k numéricamente para determinismo
                def get_ck_number(ck_str):
                    match = re.search(r'C_\{(\d+)\}', ck_str)
                    return int(match.group(1)) if match else 0
                
                all_cks.sort(key=get_ck_number)
                ck_combined = " + ".join(all_cks) if len(all_cks) > 1 else all_cks[0] if all_cks else ""
                
                if not ck_combined:
                    continue
                
                # Formatear término según el grado y coeficiente
                if degree == 0:
                    # Término constante
                    if coeff == Integer(1):
                        polynomial_terms.append(f"({ck_combined})")
                    elif coeff == Integer(-1):
                        polynomial_terms.append(f"-({ck_combined})")
                    else:
                        coeff_latex = latex(coeff)
                        polynomial_terms.append(f"({ck_combined}) \\cdot {coeff_latex}")
                elif degree == 1:
                    # Término lineal
                    if coeff == Integer(1):
                        polynomial_terms.append(f"({ck_combined}) \\cdot n")
                    elif coeff == Integer(-1):
                        polynomial_terms.append(f"-({ck_combined}) \\cdot n")
                    else:
                        coeff_latex = latex(coeff)
                        polynomial_terms.append(f"({ck_combined}) \\cdot {coeff_latex} \\cdot n")
                else:
                    # Términos de grado superior (n², n³, etc.)
                    if coeff == Integer(1):
                        polynomial_terms.append(f"({ck_combined}) \\cdot n^{{{degree}}}")
                    elif coeff == Integer(-1):
                        polynomial_terms.append(f"-({ck_combined}) \\cdot n^{{{degree}}}")
                    else:
                        coeff_latex = latex(coeff)
                        polynomial_terms.append(f"({ck_combined}) \\cdot {coeff_latex} \\cdot n^{{{degree}}}")
        
        if polynomial_terms:
            result = " + ".join(polynomial_terms)
            result = result.replace("+ -", "- ")
            self.t_polynomial = result
        else:
            self.t_polynomial = "0"
    
    def _latex_to_sympy_expr(self, latex_str: str, variable: str = "n") -> Optional[Expr]:
        """
        Convierte una expresión LaTeX a SymPy Expr.
        
        Args:
            latex_str: Expresión en formato LaTeX
            variable: Variable principal (por defecto "n")
            
        Returns:
            Expresión SymPy o None si hay error
        """
        try:
            from sympy import sympify, Symbol
            import re
            
            # Normalizar LaTeX a formato SymPy
            expr_str = latex_str
            
            # Reemplazar operadores LaTeX
            expr_str = expr_str.replace('\\cdot', '*')
            expr_str = expr_str.replace(' ', '')
            
            # Manejar fracciones LaTeX: \frac{a}{b} -> (a)/(b)
            expr_str = re.sub(r'\\frac\{([^}]+)\}\{([^}]+)\}', r'(\1)/(\2)', expr_str)
            
            # Reemplazar potencias LaTeX: n^2 -> n**2, n^{2} -> n**2
            expr_str = re.sub(r'(\w+)\^(\d+)', r'\1**\2', expr_str)
            expr_str = re.sub(r'(\w+)\^\{(\d+)\}', r'\1**\2', expr_str)
            
            # Reemplazar logaritmos: \log(n) -> log(n)
            expr_str = re.sub(r'\\log\((\w+)\)', r'log(\1)', expr_str)
            expr_str = re.sub(r'\\log\{(\w+)\}', r'log(\1)', expr_str)
            
            # Crear símbolos
            n = Symbol(variable, integer=True, positive=True)
            from sympy import log
            syms = {variable: n, 'log': log}
            
            return sympify(expr_str, locals=syms)
        except Exception as e:
            print(f"[IterativeAnalyzer] Error en _latex_to_sympy_expr para {latex_str}: {e}")
            return None
    
    def visit(self, node: Any, mode: str = "worst") -> None:
        """
        Dispatcher principal que visita cualquier nodo del AST.
        
        Args:
            node: Nodo del AST
            mode: Modo de análisis
        """
        if node is None:
            return
        
        if not isinstance(node, dict):
            return
        
        node_type = node.get("type", "unknown")
        
        # Dispatch por tipo de nodo
        if node_type == "Program":
            self.visitProgram(node, mode)
        elif node_type == "Block":
            self.visitBlock(node, mode)
        elif node_type == "ProcDef":
            self.visitProcDef(node, mode)
        elif node_type == "For":
            self.visitFor(node, mode)
        elif node_type == "If":
            self.visitIf(node, mode)
        elif node_type == "While":
            self.visitWhile(node, mode)
        elif node_type == "Repeat":
            self.visitRepeat(node, mode)
        elif node_type == "Assign":
            self.visitAssign(node, mode)
        elif node_type == "Call":
            self.visitCallStmt(node, mode)
        elif node_type == "Print":
            self.visitPrint(node, mode)
        elif node_type == "Return":
            self.visitReturn(node, mode)
        elif node_type == "Decl":
            self.visitDecl(node, mode)
        else:
            self.visitOther(node, mode)
    
    def visitProgram(self, node: Dict[str, Any], mode: str = "worst") -> None:
        """
        Visita un programa (nodo raíz).
        
        Args:
            node: Nodo Program del AST
            mode: Modo de análisis
        """
        for item in node.get("body", []):
            self.visit(item, mode)
    
    def visitBlock(self, node: Dict[str, Any], mode: str = "worst") -> None:
        """
        Visita un bloque de código.
        
        Args:
            node: Nodo Block del AST
            mode: Modo de análisis
        """
        for stmt in node.get("body", []):
            # Guardar el número de rows antes de visitar el statement
            rows_before = len(self.rows)
            
            # Si el statement es un While, pasar el bloque actual como contexto padre
            if isinstance(stmt, dict) and stmt.get("type") == "While":
                self.visitWhile(stmt, mode, parent_context=node)
            else:
                self.visit(stmt, mode)
            
            # En modo "best", verificar si se ejecutó un return que termina la función
            if mode == "best":
                should_stop = False
                
                # Verificar si el statement que acabamos de visitar es un return
                # y si no hay bucles activos (lo que significa que termina la función)
                if (isinstance(stmt, dict) and stmt.get("type") == "Return" and 
                    len(self.loop_stack) == 0):
                    # Un return fuera de bucles termina la función
                    should_stop = True
                
                # Verificar si acabamos de visitar un for que ejecutó un return
                # Cuando un for tiene un return en su cuerpo y se ejecuta en best case,
                # el return termina la función después de que el for termina
                elif (isinstance(stmt, dict) and stmt.get("type") == "For" and 
                      len(self.loop_stack) == 0):
                    # El for terminó (loop_stack está vacío ahora)
                    # Buscar si hay un return reciente con nota "early-exit"
                    # que se agregó durante la visita del for
                    for row in self.rows[rows_before:]:
                        if (row.get("kind") == "return" and 
                            row.get("note") and 
                            "early-exit" in row.get("note", "").lower()):
                            # Se ejecutó un return dentro del for que termina la función
                            should_stop = True
                            break
                
                # Si debemos detener, salir del bucle
                if should_stop:
                    break
    
    def visitProcDef(self, node: Dict[str, Any], mode: str = "worst") -> None:
        """
        Visita una definición de procedimiento.
        
        Args:
            node: Nodo ProcDef del AST
            mode: Modo de análisis
        """
        # Visitar el cuerpo del procedimiento
        body = node.get("body")
        if body:
            self.visit(body, mode)
    
    def visitOther(self, node: Dict[str, Any], mode: str = "worst") -> None:
        """
        Visita un nodo desconocido (fallback).
        
        Args:
            node: Nodo del AST
            mode: Modo de análisis
        """
        line = node.get("pos", {}).get("line", 0)
        node_type = node.get("type", "unknown")
        
        ck = self.C()
        self.add_row(
            line=line,
            kind="other",
            ck=ck,
            count=Integer(1),  # Usar Integer(1) de SymPy
            note=f"Statement {node_type}"
        )
