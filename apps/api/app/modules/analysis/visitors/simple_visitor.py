# apps/api/app/analysis/visitors/simple_visitor.py

from typing import Any, Dict

from sympy import Integer


class SimpleVisitor:
    """
    Visitor que implementa las reglas específicas para líneas "simples".

    Cubre:
    - Asignaciones (target <- expr)
    - Llamadas (CALL f(args) o call-expr)
    - Return (return expr)
    - Declaraciones (Decl/declVectorStmt)
    - Otras líneas simples

    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """

    def _expr_to_str(self, expr: Any) -> str:
        """Delega a expr_to_str del módulo ir.expr_utils."""
        from ..ir.expr_utils import expr_to_str

        return expr_to_str(expr)

    def visitAssign(self, node: Dict[str, Any], _mode: str = "worst") -> None:
        """
        Visita una asignación y aplica las reglas de análisis.

        Args:
            node: Nodo de asignación del AST
            _mode: Modo de análisis (no utilizado en asignaciones)

        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        line = node.get("pos", {}).get("line", 0)
        ops = (
            self._ops_of_lvalue(node.get("target", {}))
            + self._ops_of_expr(node.get("value"))
            + 1
        )  # +1 asignación
        ck = self.C()
        self.add_row(line, "assign", ck, Integer(1), ops=ops)

    def visitCallStmt(self, node: Dict[str, Any], _mode: str = "worst") -> None:
        """
        Visita una llamada como sentencia y aplica las reglas de análisis.

        Args:
            node: Nodo de llamada del AST
            _mode: Modo de análisis (no utilizado en llamadas)

        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        line = node.get("pos", {}).get("line", 0)
        ops = 1 + sum(
            self._ops_of_expr(arg) for arg in node.get("args", [])
        )  # 1 llamada + args
        ck = self.C()
        self.add_row(line, "call", ck, Integer(1), ops=ops)

    def visitReturn(self, node: Dict[str, Any], mode: str = "worst") -> None:
        """
        Visita un return y aplica las reglas de análisis.

        Args:
            node: Nodo de return del AST
            mode: Modo de análisis ("worst", "best", "avg")

        Author: Juan Camilo Cruz Parra (@Cruz1122)
        """
        line = node.get("pos", {}).get("line", 0)
        ops = self._ops_of_expr(node.get("value")) + 1  # +1 return
        ck = self.C()

        # En caso promedio con early return en bucle:
        # - return i (éxito): 1 (siempre ocurre en Modelo A, no multiplicado por E[iter])
        # - return -1 (fracaso): 0 (nunca ocurre en Modelo A)
        count = Integer(1)
        note = None

        if mode == "avg":
            # Detectar si es return de éxito o fracaso
            value_expr = node.get("value")
            is_success = False
            is_failure = False

            # Verificar si el return es -1 (fracaso)
            if isinstance(value_expr, dict):
                value_type = value_expr.get("type", "").lower()
                # Verificar Unary con op="-"
                if value_type in ("unary", "Unary") and value_expr.get("op") == "-":
                    arg = value_expr.get("arg", {})
                    if isinstance(arg, dict):
                        arg_type = arg.get("type", "").lower()
                        # Verificar si el argumento es un literal/number con value=1
                        if (
                            arg_type in ("literal", "number", "Literal", "Number")
                            and arg.get("value") == 1
                        ):
                            is_failure = True
                # Verificar si es directamente un número -1
                elif (
                    value_type in ("number", "Number", "literal", "Literal")
                    and value_expr.get("value") == -1
                ):
                    is_failure = True
                # Verificar si es un identificador (éxito)
                elif value_type in ("identifier", "Identifier"):
                    # return i (éxito) - variable positiva
                    is_success = True

            # Verificar si estamos dentro de un bucle con early return
            has_active_loop = hasattr(self, "loop_stack") and len(self.loop_stack) > 0

            # En Modelo A (uniforme condicionado a éxito):
            # - return i (éxito dentro del bucle): 1 (siempre ocurre, no multiplicado por E[iter])
            # - return -1 (fracaso, dentro o fuera del bucle): 0 (nunca ocurre)
            if is_failure:
                count = Integer(0)
                note = self._note("avg_failure")
            elif is_success and has_active_loop:
                # return i dentro del bucle: siempre ocurre exactamente una vez (no multiplicado por E[iter])
                count = Integer(1)
                # La nota se agregará en IfVisitor si es necesario, aquí solo marcamos éxito
                note = self._note("avg_success")

        self.add_row(line, "return", ck, count, note=note, ops=ops)

    def visitPrint(self, node: Dict[str, Any], _mode: str = "worst") -> None:
        """
        Visita un print y aplica las reglas de análisis.

        El coste es constante como una asignación, aunque puede depender
        de los parámetros/operaciones en los argumentos.

        Args:
            node: Nodo de print del AST
            mode: Modo de análisis
        """
        line = node.get("pos", {}).get("line", 0)
        ops = 1 + sum(
            self._ops_of_expr(arg) for arg in node.get("args", [])
        )  # 1 print + args
        ck = self.C()
        self.add_row(line, "print", ck, Integer(1), ops=ops)

    def visitDecl(self, node: Dict[str, Any], _mode: str = "worst") -> None:
        """
        Visita una declaración y aplica las reglas de análisis.

        Args:
            node: Nodo de declaración del AST
            mode: Modo de análisis
        """
        line = node.get("pos", {}).get("line", 0)
        ops = 1 + (
            self._ops_of_expr(node["size"]) if "size" in node else 0
        )  # 1 decl + size si existe
        ck = self.C()
        self.add_row(line, "decl", ck, Integer(1), ops=ops)

    def _ops_of_lvalue(self, lv: Dict[str, Any]) -> int:
        """
        Calcula el número de operaciones elementales de un lvalue (lado izquierdo de una asignación).

        Args:
            lv: Lvalue del AST

        Returns:
            Número de operaciones elementales
        """
        if not isinstance(lv, dict):
            return 0

        t = lv.get("type", "")

        # ID simple: no agrega nada
        if t.lower() == "identifier":
            return 0

        # A[i] o anidado: solo ops del índice (la asignación es la escritura, no se cuenta acceso extra)
        elif t.lower() == "index":
            ops = self._ops_of_expr(lv.get("index", {}))
            target = lv.get("target", {})
            if target.get("type", "").lower() in ("index", "field"):
                ops += self._ops_of_lvalue(target)
            return ops

        # Acceso a campo x.f: solo ops del target (la asignación es la escritura)
        elif t.lower() == "field":
            ops = 0
            target = lv.get("target", {})
            if target.get("type", "").lower() in ("index", "field"):
                ops += self._ops_of_lvalue(target)
            return ops

        return 0

    def _ops_of_expr(self, e: Any) -> int:
        """
        Calcula el número de operaciones elementales de una expresión.

        Args:
            e: Expresión del AST

        Returns:
            Número de operaciones elementales
        """
        if e is None:
            return 0

        if not isinstance(e, dict):
            return 0

        t = e.get("type", "")

        # Literales y identificadores simples: no tienen costo
        if t.lower() in (
            "literal",
            "identifier",
            "number",
            "string",
            "true",
            "false",
            "null",
        ):
            return 0

        # Acceso a índice A[i]
        elif t.lower() == "index":
            ops = 1 + self._ops_of_expr(e.get("index", {}))
            target = e.get("target", {})
            if target.get("type", "").lower() == "index":
                ops += self._ops_of_expr(target)
            return ops

        # Acceso a campo x.f
        elif t.lower() == "field":
            return 1 + self._ops_of_expr(e.get("target", {}))

        # Operación binaria: left + right + 1 (op)
        elif t.lower() == "binary":
            return (
                self._ops_of_expr(e.get("left", {}))
                + self._ops_of_expr(e.get("right", {}))
                + 1
            )

        # Operación unaria
        elif t.lower() == "unary":
            arg_ops = self._ops_of_expr(e.get("arg", {}))
            arg_type = e.get("arg", {}).get("type", "").lower()
            if arg_type not in ("literal", "number", "identifier"):
                arg_ops += 1
            return arg_ops

        # Llamada a función
        elif t.lower() == "call":
            return 1 + sum(self._ops_of_expr(arg) for arg in e.get("args", []))

        # Otros tipos: fallback prudente
        else:
            return 1

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
            # Si el statement es un While, pasar el bloque actual como contexto padre
            if isinstance(stmt, dict) and stmt.get("type") == "While":
                # Verificar si el visitor tiene el método visitWhile con parent_context
                if hasattr(self, "visitWhile"):
                    try:
                        self.visitWhile(stmt, mode, parent_context=node)
                    except TypeError:
                        # Si visitWhile no acepta parent_context, llamar sin él
                        self.visitWhile(stmt, mode)
                else:
                    self.visit(stmt, mode)
            else:
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
            count=Integer(1),
            note=self._note("statement", node_type=node_type),
        )
