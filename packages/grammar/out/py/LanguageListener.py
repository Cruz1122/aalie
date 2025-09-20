# Generated from grammar/Language.g4 by ANTLR 4.13.2
from antlr4 import *
if "." in __name__:
    from .LanguageParser import LanguageParser
else:
    from LanguageParser import LanguageParser

# This class defines a complete listener for a parse tree produced by LanguageParser.
class LanguageListener(ParseTreeListener):

    # Enter a parse tree produced by LanguageParser#program.
    def enterProgram(self, ctx:LanguageParser.ProgramContext):
        pass

    # Exit a parse tree produced by LanguageParser#program.
    def exitProgram(self, ctx:LanguageParser.ProgramContext):
        pass


    # Enter a parse tree produced by LanguageParser#functionDecl.
    def enterFunctionDecl(self, ctx:LanguageParser.FunctionDeclContext):
        pass

    # Exit a parse tree produced by LanguageParser#functionDecl.
    def exitFunctionDecl(self, ctx:LanguageParser.FunctionDeclContext):
        pass


    # Enter a parse tree produced by LanguageParser#block.
    def enterBlock(self, ctx:LanguageParser.BlockContext):
        pass

    # Exit a parse tree produced by LanguageParser#block.
    def exitBlock(self, ctx:LanguageParser.BlockContext):
        pass


    # Enter a parse tree produced by LanguageParser#statement.
    def enterStatement(self, ctx:LanguageParser.StatementContext):
        pass

    # Exit a parse tree produced by LanguageParser#statement.
    def exitStatement(self, ctx:LanguageParser.StatementContext):
        pass


    # Enter a parse tree produced by LanguageParser#variableDecl.
    def enterVariableDecl(self, ctx:LanguageParser.VariableDeclContext):
        pass

    # Exit a parse tree produced by LanguageParser#variableDecl.
    def exitVariableDecl(self, ctx:LanguageParser.VariableDeclContext):
        pass


    # Enter a parse tree produced by LanguageParser#forStmt.
    def enterForStmt(self, ctx:LanguageParser.ForStmtContext):
        pass

    # Exit a parse tree produced by LanguageParser#forStmt.
    def exitForStmt(self, ctx:LanguageParser.ForStmtContext):
        pass


    # Enter a parse tree produced by LanguageParser#returnStmt.
    def enterReturnStmt(self, ctx:LanguageParser.ReturnStmtContext):
        pass

    # Exit a parse tree produced by LanguageParser#returnStmt.
    def exitReturnStmt(self, ctx:LanguageParser.ReturnStmtContext):
        pass


    # Enter a parse tree produced by LanguageParser#assign.
    def enterAssign(self, ctx:LanguageParser.AssignContext):
        pass

    # Exit a parse tree produced by LanguageParser#assign.
    def exitAssign(self, ctx:LanguageParser.AssignContext):
        pass


    # Enter a parse tree produced by LanguageParser#expr.
    def enterExpr(self, ctx:LanguageParser.ExprContext):
        pass

    # Exit a parse tree produced by LanguageParser#expr.
    def exitExpr(self, ctx:LanguageParser.ExprContext):
        pass



del LanguageParser