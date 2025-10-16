# Generated from grammar/Language.g4 by ANTLR 4.13.2
from antlr4 import *
if "." in __name__:
    from .LanguageParser import LanguageParser
else:
    from LanguageParser import LanguageParser

# This class defines a complete generic visitor for a parse tree produced by LanguageParser.

class LanguageVisitor(ParseTreeVisitor):

    # Visit a parse tree produced by LanguageParser#program.
    def visitProgram(self, ctx:LanguageParser.ProgramContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by LanguageParser#stmt.
    def visitStmt(self, ctx:LanguageParser.StmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by LanguageParser#block.
    def visitBlock(self, ctx:LanguageParser.BlockContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by LanguageParser#assignmentStmt.
    def visitAssignmentStmt(self, ctx:LanguageParser.AssignmentStmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by LanguageParser#declVectorStmt.
    def visitDeclVectorStmt(self, ctx:LanguageParser.DeclVectorStmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by LanguageParser#callStmt.
    def visitCallStmt(self, ctx:LanguageParser.CallStmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by LanguageParser#argList.
    def visitArgList(self, ctx:LanguageParser.ArgListContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by LanguageParser#ifStmt.
    def visitIfStmt(self, ctx:LanguageParser.IfStmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by LanguageParser#whileStmt.
    def visitWhileStmt(self, ctx:LanguageParser.WhileStmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by LanguageParser#forStmt.
    def visitForStmt(self, ctx:LanguageParser.ForStmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by LanguageParser#lvalue.
    def visitLvalue(self, ctx:LanguageParser.LvalueContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by LanguageParser#fieldAccess.
    def visitFieldAccess(self, ctx:LanguageParser.FieldAccessContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by LanguageParser#indexSuffix.
    def visitIndexSuffix(self, ctx:LanguageParser.IndexSuffixContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by LanguageParser#expr.
    def visitExpr(self, ctx:LanguageParser.ExprContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by LanguageParser#orExpr.
    def visitOrExpr(self, ctx:LanguageParser.OrExprContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by LanguageParser#andExpr.
    def visitAndExpr(self, ctx:LanguageParser.AndExprContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by LanguageParser#relExpr.
    def visitRelExpr(self, ctx:LanguageParser.RelExprContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by LanguageParser#addExpr.
    def visitAddExpr(self, ctx:LanguageParser.AddExprContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by LanguageParser#mulExpr.
    def visitMulExpr(self, ctx:LanguageParser.MulExprContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by LanguageParser#unaryExpr.
    def visitUnaryExpr(self, ctx:LanguageParser.UnaryExprContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by LanguageParser#primary.
    def visitPrimary(self, ctx:LanguageParser.PrimaryContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by LanguageParser#lengthCall.
    def visitLengthCall(self, ctx:LanguageParser.LengthCallContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by LanguageParser#callExpr.
    def visitCallExpr(self, ctx:LanguageParser.CallExprContext):
        return self.visitChildren(ctx)



del LanguageParser