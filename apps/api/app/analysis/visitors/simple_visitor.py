# apps/api/app/analysis/visitors/simple_visitor.py

from typing import Any, Dict, List, Optional


class SimpleVisitor:
    """
    Visitor que implementa las reglas específicas para líneas "simples".
    
    Cubre:
    - Asignaciones (target <- expr)
    - Llamadas (CALL f(args) o call-expr)
    - Return (return expr)
    - Declaraciones (Decl/declVectorStmt)
    - Otras líneas simples
    """
    
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
            
            if expr_type == "identifier":
                return expr.get("name", "unknown")
            elif expr_type == "number":
                return str(expr.get("value", "0"))
            elif expr_type == "literal":
                return str(expr.get("value", "0"))
            elif expr_type == "binary":
                left = self._expr_to_str(expr.get("left", ""))
                right = self._expr_to_str(expr.get("right", ""))
                op = expr.get("operator", "")
                # Asegurar que el operador no se pierda
                if not op:
                    op = "-"  # fallback para operadores perdidos
                return f"({left}) {op} ({right})"
            elif expr_type == "index":
                target = self._expr_to_str(expr.get("target", ""))
                index = self._expr_to_str(expr.get("index", ""))
                return f"{target}[{index}]"
            elif expr_type == "unary":
                arg = self._expr_to_str(expr.get("arg", ""))
                op = expr.get("operator", "")
                return f"{op}({arg})"
            else:
                # Fallback para tipos desconocidos
                return str(expr.get("value", str(expr)))
        else:
            return str(expr)
    
    def visitAssign(self, node: Dict[str, Any], _mode: str = "worst") -> None:
        """
        Visita una asignación y aplica las reglas de análisis.
        
        Args:
            node: Nodo de asignación del AST
            mode: Modo de análisis
        """
        line = node.get("pos", {}).get("line", 0)
        ck_terms = []
        
        # target (p.ej., A[i] o x.f)
        ck_terms += self._cost_of_lvalue(node.get("target", {}))
        
        # expr (recorre y collecciona constantes)
        ck_terms += self._cost_of_expr(node.get("value"))
        
        # constante de la propia asignación
        ck_terms.append(self.C())  # -> "C_{k}"
        
        ck = " + ".join(ck_terms)
        self.add_row(line, "assign", ck, "1")
    
    def visitCallStmt(self, node: Dict[str, Any], _mode: str = "worst") -> None:
        """
        Visita una llamada como sentencia y aplica las reglas de análisis.
        
        Args:
            node: Nodo de llamada del AST
            mode: Modo de análisis
        """
        line = node.get("pos", {}).get("line", 0)
        ck_terms = [self.C()]  # costo de la llamada
        
        for arg in node.get("args", []):
            ck_terms += self._cost_of_expr(arg)
        
        ck = " + ".join(ck_terms)
        self.add_row(line, "call", ck, "1")
    
    def visitReturn(self, node: Dict[str, Any], _mode: str = "worst") -> None:
        """
        Visita un return y aplica las reglas de análisis.
        
        Args:
            node: Nodo de return del AST
            mode: Modo de análisis
        """
        line = node.get("pos", {}).get("line", 0)
        ck_terms = self._cost_of_expr(node.get("value"))
        ck_terms.append(self.C())  # costo del return
        
        ck = " + ".join(ck_terms)
        self.add_row(line, "return", ck, "1")
    
    def visitDecl(self, node: Dict[str, Any], _mode: str = "worst") -> None:
        """
        Visita una declaración y aplica las reglas de análisis.
        
        Args:
            node: Nodo de declaración del AST
            mode: Modo de análisis
        """
        line = node.get("pos", {}).get("line", 0)
        ck_terms = [self.C()]  # costo de la declaración
        
        # Si la declaración incluye tamaños con expresiones
        if "size" in node:
            ck_terms += self._cost_of_expr(node["size"])
        
        ck = " + ".join(ck_terms)
        self.add_row(line, "decl", ck, "1")
    
    def _cost_of_lvalue(self, lv: Dict[str, Any]) -> List[str]:
        """
        Calcula el costo de un lvalue (lado izquierdo de una asignación).
        
        Args:
            lv: Lvalue del AST
            
        Returns:
            Lista de términos de costo
        """
        terms = []
        
        if not isinstance(lv, dict):
            return terms
        
        t = lv.get("type", "")
        
        # ID simple: no agrega nada
        if t.lower() == "identifier":
            return terms
        
        # A[i] o anidado
        elif t.lower() == "index":
            terms.append(self.C())  # costo de indexación
            terms += self._cost_of_expr(lv.get("index", {}))
            # Si el target es también un índice o campo, calcular su costo
            target = lv.get("target", {})
            if target.get("type", "").lower() in ("index", "field"):
                terms += self._cost_of_lvalue(target)
        
        # Acceso a campo x.f
        elif t.lower() == "field":
            terms.append(self.C())  # costo de acceso a campo
            # Si el target es también un índice o campo, calcular su costo
            target = lv.get("target", {})
            if target.get("type", "").lower() in ("index", "field"):
                terms += self._cost_of_lvalue(target)
        
        return terms
    
    def _cost_of_expr(self, e: Any) -> List[str]:
        """
        Calcula el costo de una expresión.
        
        Args:
            e: Expresión del AST
            
        Returns:
            Lista de términos de costo
        """
        if e is None:
            return []
        
        if not isinstance(e, dict):
            return []
        
        t = e.get("type", "")
        
        # Literales y identificadores simples: no tienen costo
        if t.lower() in ("literal", "identifier", "number", "string", "true", "false", "null"):
            return []
        
        # Acceso a índice A[i]
        elif t.lower() == "index":
            terms = [self.C()]  # costo del acceso
            terms += self._cost_of_expr(e.get("index", {}))
            # Si el target es también un índice, calcular su costo
            target = e.get("target", {})
            if target.get("type", "").lower() == "index":
                terms += self._cost_of_expr(target)
            return terms
        
        # Acceso a campo x.f
        elif t.lower() == "field":
            terms = [self.C()]  # costo del acceso a campo
            terms += self._cost_of_expr(e.get("target", {}))
            return terms
        
        # Operación binaria
        elif t.lower() == "binary":
            terms = []
            terms += self._cost_of_expr(e.get("left", {}))
            terms += self._cost_of_expr(e.get("right", {}))
            terms.append(self.C())  # costo de la operación
            return terms
        
        # Operación unaria
        elif t.lower() == "unary":
            terms = self._cost_of_expr(e.get("arg", {}))
            # Solo agregar costo si la operación es compleja (no simple negación de literal)
            arg_type = e.get("arg", {}).get("type", "").lower()
            if arg_type not in ("literal", "number", "identifier"):
                terms.append(self.C())  # costo de la operación
            return terms
        
        # Llamada a función
        elif t.lower() == "call":
            terms = [self.C()]  # costo de la llamada
            for arg in e.get("args", []):
                terms += self._cost_of_expr(arg)
            return terms
        
        # Otros tipos: fallback prudente
        else:
            return [self.C()]
    
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
