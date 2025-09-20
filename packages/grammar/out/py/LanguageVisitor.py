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


    # Visit a parse tree produced by LanguageParser#functionDecl.
    def visitFunctionDecl(self, ctx:LanguageParser.FunctionDeclContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by LanguageParser#block.
    def visitBlock(self, ctx:LanguageParser.BlockContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by LanguageParser#statement.
    def visitStatement(self, ctx:LanguageParser.StatementContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by LanguageParser#variableDecl.
    def visitVariableDecl(self, ctx:LanguageParser.VariableDeclContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by LanguageParser#forStmt.
    def visitForStmt(self, ctx:LanguageParser.ForStmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by LanguageParser#returnStmt.
    def visitReturnStmt(self, ctx:LanguageParser.ReturnStmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by LanguageParser#assign.
    def visitAssign(self, ctx:LanguageParser.AssignContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by LanguageParser#expr.
    def visitExpr(self, ctx:LanguageParser.ExprContext):
        return self.visitChildren(ctx)



del LanguageParser