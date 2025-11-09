# apps/api/app/analysis/iterative_analyzer.py

from typing import Any, Dict, List, Optional, Union
from sympy import Expr, latex, Integer
from .base import BaseAnalyzer
from .visitors.for_visitor import ForVisitor
from .visitors.if_visitor import IfVisitor
from .visitors.while_repeat_visitor import WhileRepeatVisitor
from .visitors.simple_visitor import SimpleVisitor
from .summation_closer import SummationCloser
from .complexity_classes import ComplexityClasses


class IterativeAnalyzer(BaseAnalyzer, ForVisitor, IfVisitor, WhileRepeatVisitor, SimpleVisitor):
    """
    Analizador iterativo unificado que combina todos los visitors.
    
    Implementa el análisis completo de algoritmos con:
    - Bucles FOR con multiplicadores
    - Condicionales IF con selección de rama dominante
    - Bucles WHILE y REPEAT con símbolos de iteración
    - Líneas simples (asignaciones, llamadas, returns)
    - Dispatcher unificado para todos los tipos de nodos
    """
    
    def __init__(self):
        super().__init__()
    
    def _expr_to_str(self, expr: Any) -> str:
        """
        Convierte una expresión del AST a string.
        
        Args:
            expr: Expresión del AST
            
        Returns:
            String representando la expresión
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
        """
        if not s:
            return s
        
        # Mejorar formato de rangos
        s = s.replace("i=1\\ldotsn", "i=1..n")
        s = s.replace("i=1\\ldots n", "i=1..n")
        
        return s
    
    def analyze(self, ast: Dict[str, Any], mode: str = "worst", api_key: Optional[str] = None) -> Dict[str, Any]:
        """
        Analiza un AST completo y retorna el resultado.
        
        Args:
            ast: AST del algoritmo a analizar
            mode: Modo de análisis ("worst", "best", "avg")
            api_key: API Key (ignorado, mantenido por compatibilidad)
            
        Returns:
            Resultado del análisis con byLine, T_open, procedure, etc.
        """
        # Limpiar estado previo
        self.clear()
        
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
            
            # Preferir usar count_raw_expr directamente si está disponible
            if count_raw_expr is not None:
                try:
                    # Pasar el objeto SymPy directamente a close_summation
                    closed_count, steps = closer.close_summation(count_raw_expr, variable)
                    row["count"] = closed_count
                    
                    # Generar procedimiento paso a paso
                    if steps:
                        row["procedure"] = steps
                    else:
                        # Si no hay pasos, crear uno básico
                        count_raw_latex_str = latex(count_raw_expr) if hasattr(count_raw_expr, '__str__') else str(count_raw_expr)
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
                        count_raw_latex = "1"
            
            # Asegurar que count_raw_latex sea un string
            if not isinstance(count_raw_latex, str):
                count_raw_latex = str(count_raw_latex) if count_raw_latex is not None else "1"
            
            # Cerrar sumatoria (trabaja con LaTeX por ahora, pero recibe SymPy internamente)
            try:
                closed_count, steps = closer.close_summation(count_raw_latex, variable)
                row["count"] = closed_count
                
                # Generar procedimiento paso a paso
                if steps:
                    row["procedure"] = steps
                else:
                    # Si no hay pasos, crear uno básico
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
        
        # Calcular T_polynomial sumando términos cerrados
        # Construir expresión total: Σ C_k · count_k
        if self.rows:
            # Agrupar términos similares
            terms_by_count = {}
            for row in self.rows:
                ck = row.get("ck", "")
                count = row.get("count", "1")
                
                if count not in terms_by_count:
                    terms_by_count[count] = []
                terms_by_count[count].append(ck)
            
            # Construir T_polynomial
            polynomial_terms = []
            for count, cks in terms_by_count.items():
                if len(cks) == 1:
                    polynomial_terms.append(f"({cks[0]}) \\cdot ({count})")
                else:
                    ck_sum = " + ".join(cks)
                    polynomial_terms.append(f"({ck_sum}) \\cdot ({count})")
            
            # Simplificar usando SymPy para obtener forma polinómica
            try:
                # Construir expresión total
                total_expr = " + ".join(polynomial_terms)
                
                # Extraer forma polinómica usando ComplexityClasses
                # Por ahora, usar la expresión agrupada
                self.t_polynomial = total_expr
            except Exception as e:
                print(f"[IterativeAnalyzer] Error calculando T_polynomial: {e}")
                self.t_polynomial = " + ".join(polynomial_terms)

        # Retornar resultado
        return self.result()
    
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
            self.visit(stmt, mode)
    
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
