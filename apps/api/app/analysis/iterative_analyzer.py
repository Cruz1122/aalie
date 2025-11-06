# apps/api/app/analysis/iterative_analyzer.py

from typing import Any, Dict, List, Optional
from .base import BaseAnalyzer
from .visitors.for_visitor import ForVisitor
from .visitors.if_visitor import IfVisitor
from .visitors.while_repeat_visitor import WhileRepeatVisitor
from .visitors.simple_visitor import SimpleVisitor
from .llm_simplifier import simplify_counts_with_llm


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
    
    def analyze(self, ast: Dict[str, Any], mode: str = "worst") -> Dict[str, Any]:
        """
        Analiza un AST completo y retorna el resultado.
        
        Args:
            ast: AST del algoritmo a analizar
            mode: Modo de análisis ("worst", "best", "avg")
            
        Returns:
            Resultado del análisis con byLine, T_open, procedure, etc.
        """
        # Limpiar estado previo
        self.clear()
        
        # Agregar pasos básicos del procedimiento
        self.procedure = [
            r"1) Se asignan costos constantes C_{1}, C_{2}, \ldots",
            r"2) Se extraen por línea los costos C_{k} y los conteos #ejecuciones",
            r"3) Se multiplican los conteos por los iteradores activos (for/while/repeat)",
            r"4) Se suman los términos para formar T_{\text{open}}"
        ]
        
        # Visitar el AST completo
        self.visit(ast, mode)
        
        # Simplificar counts usando LLM
        llm_result = simplify_counts_with_llm(self.rows)
        
        if llm_result:
            # Actualizar counts con los simplificados del LLM
            counts = llm_result.get("counts", [])
            if len(counts) == len(self.rows):
                for i, row in enumerate(self.rows):
                    row["count"] = counts[i]
                
                # Guardar T_polynomial
                t_polynomial = llm_result.get("T_polynomial")
                if t_polynomial:
                    self.t_polynomial = t_polynomial
            else:
                print(f"[IterativeAnalyzer] Número de counts del LLM ({len(counts)}) no coincide con número de filas ({len(self.rows)})")
        else:
            # Si el LLM falla, usar count_raw como count (ya está así por defecto)
            print("[IterativeAnalyzer] LLM falló, usando count_raw como count")
        
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
            count="1",
            note=f"Statement {node_type}"
        )
