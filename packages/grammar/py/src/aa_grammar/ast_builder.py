from __future__ import annotations
from typing import Any, Dict, List
from antlr4 import ParserRuleContext  # type: ignore
from .generated.LanguageVisitor import LanguageVisitor  # type: ignore
from .generated.LanguageParser import LanguageParser  # type: ignore

# Helpers simples de construcción
def lit(value: Any) -> Dict[str, Any]:
    return {"type": "Literal", "value": value}

def ident(name: str) -> Dict[str, Any]:
    return {"type": "Identifier", "name": name}

def unary(op: str, arg: Dict[str, Any]) -> Dict[str, Any]:
    return {"type": "Unary", "op": op, "arg": arg}

def binary(op: str, left: Dict[str, Any], right: Dict[str, Any]) -> Dict[str, Any]:
    return {"type": "Binary", "op": op, "left": left, "right": right}

class ASTBuilder(LanguageVisitor):
    # ---- programa y sentencias ----
    def visitProgram(self, ctx: LanguageParser.ProgramContext):
        body = [self.visit(s) for s in ctx.stmt()]
        return {"type": "Program", "body": body}

    def visitBlock(self, ctx: LanguageParser.BlockContext):
        body = [self.visit(s) for s in ctx.stmt()]
        return {"type": "Block", "body": body}

    def visitAssignmentStmt(self, ctx: LanguageParser.AssignmentStmtContext):
        target = self.visit(ctx.lvalue())
        value = self.visit(ctx.expr())
        return {"type": "Assign", "target": target, "value": value}

    def visitDeclVectorStmt(self, ctx: LanguageParser.DeclVectorStmtContext):
        name = ctx.ID().getText()
        dims = [self.visit(ix) for ix in ctx.indexSuffix()]
        return {"type": "DeclVector", "id": name, "dims": dims}

    def visitCallStmt(self, ctx: LanguageParser.CallStmtContext):
        callee = ctx.ID().getText()
        args = self._visit_arglist(ctx.argList())
        return {"type": "Call", "callee": callee, "args": args, "statement": True}

    def visitIfStmt(self, ctx: LanguageParser.IfStmtContext):
        test = self.visit(ctx.expr())
        cons = self.visit(ctx.block(0))
        alt = self.visit(ctx.block(1)) if ctx.block(1) else None
        return {"type": "If", "test": test, "consequent": cons, "alternate": alt}

    def visitWhileStmt(self, ctx: LanguageParser.WhileStmtContext):
        test = self.visit(ctx.expr())
        body = self.visit(ctx.block())
        return {"type": "While", "test": test, "body": body}

    def visitForStmt(self, ctx: LanguageParser.ForStmtContext):
        var = ctx.ID().getText()
        start = self.visit(ctx.expr(0))
        end = self.visit(ctx.expr(1))
        body = self.visit(ctx.block())
        return {"type": "For", "var": var, "start": start, "end": end, "body": body}

    # ---- lvalues ----
    def visitLvalue(self, ctx: LanguageParser.LvalueContext):
        node: Dict[str, Any] = ident(ctx.ID().getText())
        # Walk suffixes in order
        for i in range(1, ctx.getChildCount()):
            child = ctx.getChild(i)
            text = child.getText()
            # indexSuffix or .ID
            if isinstance(child, LanguageParser.IndexSuffixContext):
                idx = self.visitIndexSuffix(child)
                node = {"type": "Index", "target": node, **idx}
            elif text.startswith("."):
                # next child is ID token
                name = ctx.getChild(i + 1).getText() if (i + 1) < ctx.getChildCount() else text[1:]
                node = {"type": "Field", "target": node, "name": name}
        return node

    def visitIndexSuffix(self, ctx: LanguageParser.IndexSuffixContext):
        # [expr] or [a..b]
        if ctx.RANGE():
            return {"range": {"start": self.visit(ctx.expr(0)), "end": self.visit(ctx.expr(1))}}
        return {"index": self.visit(ctx.expr(0))}

    # ---- expresiones (precedencia) ----
    def visitPrimary(self, ctx: LanguageParser.PrimaryContext):
        if ctx.INT():
            return lit(int(ctx.INT().getText()))
        if ctx.TRUE_KW():
            return lit(True)
        if ctx.FALSE_KW():
            return lit(False)
        if ctx.NULL_KW():
            return lit(None)
        if ctx.lengthCall():
            return self.visit(ctx.lengthCall())
        if ctx.callExpr():
            return self.visit(ctx.callExpr())
        if ctx.lvalue():
            return self.visit(ctx.lvalue())
        # (expr)
        return self.visit(ctx.expr())

    def visitLengthCall(self, ctx: LanguageParser.LengthCallContext):
        return {"type": "Call", "callee": "length", "args": [self.visit(ctx.expr())], "builtIn": True}

    def visitCallExpr(self, ctx: LanguageParser.CallExprContext):
        callee = ctx.ID().getText()
        args = self._visit_arglist(ctx.argList())
        return {"type": "Call", "callee": callee, "args": args}

    def _visit_arglist(self, ctx):
        if not ctx:
            return []
        return [self.visit(e) for e in ctx.expr()]

    def visitUnaryExpr(self, ctx: LanguageParser.UnaryExprContext):
        if ctx.NOT_KW():
            return unary("not", self.visit(ctx.unaryExpr()))
        if ctx.MINUS():
            return unary("-", self.visit(ctx.unaryExpr()))
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
        for i in range(1, ctx.getChildCount(), 2):
            ops.append(ctx.getChild(i).getText().lower())
        node = nodes[0]
        for op, rhs in zip(ops, nodes[1:]):
            # Map textual tokens
            if op in {"and"}:
                node = binary("and", node, rhs)
            elif op in {"or"}:
                node = binary("or", node, rhs)
            elif op in {"=", "=="}:
                node = binary("==", node, rhs)
            elif op in {"<>", "≠", "!="}:
                node = binary("!=", node, rhs)
            elif op in {"<=","≤"}:
                node = binary("<=", node, rhs)
            elif op in {">=","≥"}:
                node = binary(">=", node, rhs)
            elif op in {"<",">"}:
                node = binary(op, node, rhs)
            elif op in {"+","-","*","/","div","mod"}:
                node = binary(op, node, rhs)
            else:
                node = binary(op, node, rhs)
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
