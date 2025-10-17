from __future__ import annotations
from typing import Any, Dict, List
from antlr4 import ParserRuleContext, Token  # type: ignore
from .generated.LanguageVisitor import LanguageVisitor  # type: ignore
from .generated.LanguageParser import LanguageParser  # type: ignore

# Helper para extraer posición de un contexto o token
def get_pos(ctx_or_token) -> Dict[str, int]:
    """Extrae line y column de un contexto de parser o token."""
    if isinstance(ctx_or_token, Token):
        return {"line": ctx_or_token.line, "column": ctx_or_token.column}
    elif isinstance(ctx_or_token, ParserRuleContext):
        token = ctx_or_token.start
        return {"line": token.line, "column": token.column}
    return {"line": 0, "column": 0}

# Helpers simples de construcción
def lit(value: Any, ctx=None) -> Dict[str, Any]:
    node = {"type": "Literal", "value": value}
    if ctx:
        node["pos"] = get_pos(ctx)
    return node

def ident(name: str, ctx=None) -> Dict[str, Any]:
    node = {"type": "Identifier", "name": name}
    if ctx:
        node["pos"] = get_pos(ctx)
    return node

def unary(op: str, arg: Dict[str, Any], ctx=None) -> Dict[str, Any]:
    node = {"type": "Unary", "op": op, "arg": arg}
    if ctx:
        node["pos"] = get_pos(ctx)
    return node

def binary(op: str, left: Dict[str, Any], right: Dict[str, Any], ctx=None) -> Dict[str, Any]:
    node = {"type": "Binary", "op": op, "left": left, "right": right}
    if ctx:
        node["pos"] = get_pos(ctx)
    return node

# Normalización de operadores
def normalize_op(raw_op: str) -> str:
    """Normaliza operadores a un conjunto cerrado."""
    op_lower = raw_op.lower()
    # Operadores de comparación
    if op_lower in {"=", "=="}:
        return "=="
    if op_lower in {"<>", "≠", "!="}:
        return "!="
    if op_lower in {"<=", "≤"}:
        return "<="
    if op_lower in {">=", "≥"}:
        return ">="
    if op_lower == "<":
        return "<"
    if op_lower == ">":
        return ">"
    # Operadores aritméticos
    if op_lower == "+":
        return "+"
    if op_lower == "-":
        return "-"
    if op_lower == "*":
        return "*"
    if op_lower in {"/", "divop"}:
        return "/"
    if op_lower == "div":
        return "div"
    if op_lower == "mod":
        return "mod"
    # Operadores lógicos
    if op_lower == "and":
        return "and"
    if op_lower == "or":
        return "or"
    if op_lower in {"not", "!"}:
        return "not"
    # Fallback
    return op_lower

class ASTBuilder(LanguageVisitor):
    # ---- programa y sentencias ----
    def visitProgram(self, ctx: LanguageParser.ProgramContext):
        # Procesar definiciones de procedimientos
        procs = [self.visit(p) for p in ctx.procDef()] if ctx.procDef() else []
        # Procesar statements
        stmts = [self.visit(s) for s in ctx.stmt()] if ctx.stmt() else []
        body = procs + stmts
        return {"type": "Program", "body": body, "pos": get_pos(ctx)}
    
    def visitProcDef(self, ctx: LanguageParser.ProcDefContext):
        name = ctx.ID().getText()
        params = self._visit_paramlist(ctx.paramList()) if ctx.paramList() else []
        body = self.visit(ctx.block())
        return {"type": "ProcDef", "name": name, "params": params, "body": body, "pos": get_pos(ctx)}
    
    def _visit_paramlist(self, ctx):
        if not ctx:
            return []
        return [self.visit(p) for p in ctx.param()]
    
    def visitParam(self, ctx: LanguageParser.ParamContext):
        # Puede ser arrayParam, objectParam o ID simple
        if ctx.arrayParam():
            return self.visit(ctx.arrayParam())
        elif ctx.objectParam():
            return self.visit(ctx.objectParam())
        else:
            # ID simple (escalar)
            return {"type": "Param", "name": ctx.ID().getText(), "pos": get_pos(ctx)}
    
    def visitArrayParam(self, ctx: LanguageParser.ArrayParamContext):
        name = ctx.ID().getText()
        start = self.visit(ctx.arrayIndex(0))
        end = self.visit(ctx.arrayIndex(1)) if ctx.arrayIndex(1) else None
        return {"type": "ArrayParam", "name": name, "start": start, "end": end, "pos": get_pos(ctx)}
    
    def visitArrayIndex(self, ctx: LanguageParser.ArrayIndexContext):
        if ctx.ID():
            return ident(ctx.ID().getText(), ctx.ID())
        else:
            return lit(int(ctx.INT().getText()), ctx.INT())
    
    def visitObjectParam(self, ctx: LanguageParser.ObjectParamContext):
        ids = [id_token.getText() for id_token in ctx.ID()]
        return {"type": "ObjectParam", "className": ids[0], "name": ids[1], "pos": get_pos(ctx)}

    def visitBlock(self, ctx: LanguageParser.BlockContext):
        body = [self.visit(s) for s in ctx.stmt()]
        return {"type": "Block", "body": body, "pos": get_pos(ctx)}

    def visitAssignmentStmt(self, ctx: LanguageParser.AssignmentStmtContext):
        target = self.visit(ctx.lvalue())
        value = self.visit(ctx.expr())
        return {"type": "Assign", "target": target, "value": value, "pos": get_pos(ctx)}

    def visitDeclVectorStmt(self, ctx: LanguageParser.DeclVectorStmtContext):
        name = ctx.ID().getText()
        dims = [self.visit(ix) for ix in ctx.indexSuffix()]
        return {"type": "DeclVector", "id": name, "dims": dims, "pos": get_pos(ctx)}

    def visitCallStmt(self, ctx: LanguageParser.CallStmtContext):
        callee = ctx.ID().getText()
        args = self._visit_arglist(ctx.argList())
        return {"type": "Call", "callee": callee, "args": args, "statement": True, "pos": get_pos(ctx)}

    def visitIfStmt(self, ctx: LanguageParser.IfStmtContext):
        test = self.visit(ctx.expr())
        cons = self.visit(ctx.block(0))
        alt = self.visit(ctx.block(1)) if ctx.block(1) else None
        return {"type": "If", "test": test, "consequent": cons, "alternate": alt, "pos": get_pos(ctx)}

    def visitWhileStmt(self, ctx: LanguageParser.WhileStmtContext):
        test = self.visit(ctx.expr())
        body = self.visit(ctx.block())
        return {"type": "While", "test": test, "body": body, "pos": get_pos(ctx)}

    def visitForStmt(self, ctx: LanguageParser.ForStmtContext):
        var = ctx.ID().getText()
        start = self.visit(ctx.expr(0))
        end = self.visit(ctx.expr(1))
        body = self.visit(ctx.block())
        return {"type": "For", "var": var, "start": start, "end": end, "body": body, "pos": get_pos(ctx)}
    
    def visitRepeatStmt(self, ctx: LanguageParser.RepeatStmtContext):
        body_stmts = [self.visit(s) for s in ctx.stmt()]
        test = self.visit(ctx.expr())
        body_block = {"type": "Block", "body": body_stmts, "pos": get_pos(ctx)}
        return {"type": "Repeat", "body": body_block, "test": test, "pos": get_pos(ctx)}
    
    def visitReturnStmt(self, ctx: LanguageParser.ReturnStmtContext):
        value = self.visit(ctx.expr())
        return {"type": "Return", "value": value, "pos": get_pos(ctx)}

    # ---- lvalues ----
    def visitLvalue(self, ctx: LanguageParser.LvalueContext):
        node: Dict[str, Any] = ident(ctx.ID().getText(), ctx.ID())
        # Walk suffixes in order
        for i in range(1, ctx.getChildCount()):
            child = ctx.getChild(i)
            text = child.getText()
            # indexSuffix or .ID
            if isinstance(child, LanguageParser.IndexSuffixContext):
                idx = self.visitIndexSuffix(child)
                node = {"type": "Index", "target": node, "pos": get_pos(child), **idx}
            elif text.startswith("."):
                # next child is ID token
                name = ctx.getChild(i + 1).getText() if (i + 1) < ctx.getChildCount() else text[1:]
                node = {"type": "Field", "target": node, "name": name, "pos": get_pos(child)}
        return node

    def visitIndexSuffix(self, ctx: LanguageParser.IndexSuffixContext):
        # [expr] or [a..b]
        if ctx.RANGE():
            return {"range": {"start": self.visit(ctx.expr(0)), "end": self.visit(ctx.expr(1))}}
        return {"index": self.visit(ctx.expr(0))}

    # ---- expresiones (precedencia) ----
    def visitPrimary(self, ctx: LanguageParser.PrimaryContext):
        if ctx.INT():
            return lit(int(ctx.INT().getText()), ctx.INT())
        if ctx.TRUE_KW():
            return lit(True, ctx.TRUE_KW())
        if ctx.FALSE_KW():
            return lit(False, ctx.FALSE_KW())
        if ctx.NULL_KW():
            return lit(None, ctx.NULL_KW())
        if ctx.lengthCall():
            return self.visit(ctx.lengthCall())
        if ctx.callExpr():
            return self.visit(ctx.callExpr())
        if ctx.lvalue():
            return self.visit(ctx.lvalue())
        # (expr)
        return self.visit(ctx.expr())

    def visitLengthCall(self, ctx: LanguageParser.LengthCallContext):
        return {"type": "Call", "callee": "length", "args": [self.visit(ctx.expr())], "builtIn": True, "statement": False, "pos": get_pos(ctx)}

    def visitCallExpr(self, ctx: LanguageParser.CallExprContext):
        callee = ctx.ID().getText()
        args = self._visit_arglist(ctx.argList())
        return {"type": "Call", "callee": callee, "args": args, "statement": False, "pos": get_pos(ctx)}

    def _visit_arglist(self, ctx):
        if not ctx:
            return []
        return [self.visit(e) for e in ctx.expr()]

    def visitUnaryExpr(self, ctx: LanguageParser.UnaryExprContext):
        if ctx.NOT_KW():
            return unary("not", self.visit(ctx.unaryExpr()), ctx)
        if ctx.MINUS():
            return unary("-", self.visit(ctx.unaryExpr()), ctx)
        return self.visit(ctx.primary())

    # Helpers binarios genéricos
    def _fold_binary(self, ctx: ParserRuleContext, child_rule: str, op_texts: List[str]):
        # child_rule: e.g. "mulExpr" for addExpr
        children = getattr(ctx, child_rule)()
        nodes = [self.visit(c) for c in children]
        if len(nodes) == 1:
            return nodes[0]
        # operators live at odd positions: 1,3,5...
        ops: List[str] = []
        op_positions: List[Any] = []
        for i in range(1, ctx.getChildCount(), 2):
            op_token = ctx.getChild(i)
            ops.append(op_token.getText())
            op_positions.append(op_token)
        node = nodes[0]
        for raw_op, op_pos, rhs in zip(ops, op_positions, nodes[1:]):
            # Normalizar operador a conjunto cerrado
            normalized_op = normalize_op(raw_op)
            node = binary(normalized_op, node, rhs, op_pos)
        return node

    def visitOrExpr(self, ctx: LanguageParser.OrExprContext):
        return self._fold_binary(ctx, "andExpr", ["or"])

    def visitAndExpr(self, ctx: LanguageParser.AndExprContext):
        return self._fold_binary(ctx, "relExpr", ["and"])

    def visitRelExpr(self, ctx: LanguageParser.RelExprContext):
        return self._fold_binary(ctx, "addExpr", ["==","!=", "<", "<=", ">", ">="])

    def visitAddExpr(self, ctx: LanguageParser.AddExprContext):
        return self._fold_binary(ctx, "mulExpr", ["+","-"])

    def visitMulExpr(self, ctx: LanguageParser.MulExprContext):
        return self._fold_binary(ctx, "unaryExpr", ["*","/","div","mod"])
