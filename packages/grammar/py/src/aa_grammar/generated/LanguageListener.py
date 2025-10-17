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


    # Enter a parse tree produced by LanguageParser#classDef.
    def enterClassDef(self, ctx:LanguageParser.ClassDefContext):
        pass

    # Exit a parse tree produced by LanguageParser#classDef.
    def exitClassDef(self, ctx:LanguageParser.ClassDefContext):
        pass


    # Enter a parse tree produced by LanguageParser#attrList.
    def enterAttrList(self, ctx:LanguageParser.AttrListContext):
        pass

    # Exit a parse tree produced by LanguageParser#attrList.
    def exitAttrList(self, ctx:LanguageParser.AttrListContext):
        pass


    # Enter a parse tree produced by LanguageParser#procDef.
    def enterProcDef(self, ctx:LanguageParser.ProcDefContext):
        pass

    # Exit a parse tree produced by LanguageParser#procDef.
    def exitProcDef(self, ctx:LanguageParser.ProcDefContext):
        pass


    # Enter a parse tree produced by LanguageParser#paramList.
    def enterParamList(self, ctx:LanguageParser.ParamListContext):
        pass

    # Exit a parse tree produced by LanguageParser#paramList.
    def exitParamList(self, ctx:LanguageParser.ParamListContext):
        pass


    # Enter a parse tree produced by LanguageParser#param.
    def enterParam(self, ctx:LanguageParser.ParamContext):
        pass

    # Exit a parse tree produced by LanguageParser#param.
    def exitParam(self, ctx:LanguageParser.ParamContext):
        pass


    # Enter a parse tree produced by LanguageParser#arrayParam.
    def enterArrayParam(self, ctx:LanguageParser.ArrayParamContext):
        pass

    # Exit a parse tree produced by LanguageParser#arrayParam.
    def exitArrayParam(self, ctx:LanguageParser.ArrayParamContext):
        pass


    # Enter a parse tree produced by LanguageParser#arrayIndex.
    def enterArrayIndex(self, ctx:LanguageParser.ArrayIndexContext):
        pass

    # Exit a parse tree produced by LanguageParser#arrayIndex.
    def exitArrayIndex(self, ctx:LanguageParser.ArrayIndexContext):
        pass


    # Enter a parse tree produced by LanguageParser#arrayDim.
    def enterArrayDim(self, ctx:LanguageParser.ArrayDimContext):
        pass

    # Exit a parse tree produced by LanguageParser#arrayDim.
    def exitArrayDim(self, ctx:LanguageParser.ArrayDimContext):
        pass


    # Enter a parse tree produced by LanguageParser#objectParam.
    def enterObjectParam(self, ctx:LanguageParser.ObjectParamContext):
        pass

    # Exit a parse tree produced by LanguageParser#objectParam.
    def exitObjectParam(self, ctx:LanguageParser.ObjectParamContext):
        pass


    # Enter a parse tree produced by LanguageParser#stmt.
    def enterStmt(self, ctx:LanguageParser.StmtContext):
        pass

    # Exit a parse tree produced by LanguageParser#stmt.
    def exitStmt(self, ctx:LanguageParser.StmtContext):
        pass


    # Enter a parse tree produced by LanguageParser#block.
    def enterBlock(self, ctx:LanguageParser.BlockContext):
        pass

    # Exit a parse tree produced by LanguageParser#block.
    def exitBlock(self, ctx:LanguageParser.BlockContext):
        pass


    # Enter a parse tree produced by LanguageParser#assignmentStmt.
    def enterAssignmentStmt(self, ctx:LanguageParser.AssignmentStmtContext):
        pass

    # Exit a parse tree produced by LanguageParser#assignmentStmt.
    def exitAssignmentStmt(self, ctx:LanguageParser.AssignmentStmtContext):
        pass


    # Enter a parse tree produced by LanguageParser#declVectorStmt.
    def enterDeclVectorStmt(self, ctx:LanguageParser.DeclVectorStmtContext):
        pass

    # Exit a parse tree produced by LanguageParser#declVectorStmt.
    def exitDeclVectorStmt(self, ctx:LanguageParser.DeclVectorStmtContext):
        pass


    # Enter a parse tree produced by LanguageParser#callStmt.
    def enterCallStmt(self, ctx:LanguageParser.CallStmtContext):
        pass

    # Exit a parse tree produced by LanguageParser#callStmt.
    def exitCallStmt(self, ctx:LanguageParser.CallStmtContext):
        pass


    # Enter a parse tree produced by LanguageParser#argList.
    def enterArgList(self, ctx:LanguageParser.ArgListContext):
        pass

    # Exit a parse tree produced by LanguageParser#argList.
    def exitArgList(self, ctx:LanguageParser.ArgListContext):
        pass


    # Enter a parse tree produced by LanguageParser#repeatStmt.
    def enterRepeatStmt(self, ctx:LanguageParser.RepeatStmtContext):
        pass

    # Exit a parse tree produced by LanguageParser#repeatStmt.
    def exitRepeatStmt(self, ctx:LanguageParser.RepeatStmtContext):
        pass


    # Enter a parse tree produced by LanguageParser#returnStmt.
    def enterReturnStmt(self, ctx:LanguageParser.ReturnStmtContext):
        pass

    # Exit a parse tree produced by LanguageParser#returnStmt.
    def exitReturnStmt(self, ctx:LanguageParser.ReturnStmtContext):
        pass


    # Enter a parse tree produced by LanguageParser#ifStmt.
    def enterIfStmt(self, ctx:LanguageParser.IfStmtContext):
        pass

    # Exit a parse tree produced by LanguageParser#ifStmt.
    def exitIfStmt(self, ctx:LanguageParser.IfStmtContext):
        pass


    # Enter a parse tree produced by LanguageParser#whileStmt.
    def enterWhileStmt(self, ctx:LanguageParser.WhileStmtContext):
        pass

    # Exit a parse tree produced by LanguageParser#whileStmt.
    def exitWhileStmt(self, ctx:LanguageParser.WhileStmtContext):
        pass


    # Enter a parse tree produced by LanguageParser#forStmt.
    def enterForStmt(self, ctx:LanguageParser.ForStmtContext):
        pass

    # Exit a parse tree produced by LanguageParser#forStmt.
    def exitForStmt(self, ctx:LanguageParser.ForStmtContext):
        pass


    # Enter a parse tree produced by LanguageParser#lvalue.
    def enterLvalue(self, ctx:LanguageParser.LvalueContext):
        pass

    # Exit a parse tree produced by LanguageParser#lvalue.
    def exitLvalue(self, ctx:LanguageParser.LvalueContext):
        pass


    # Enter a parse tree produced by LanguageParser#fieldAccess.
    def enterFieldAccess(self, ctx:LanguageParser.FieldAccessContext):
        pass

    # Exit a parse tree produced by LanguageParser#fieldAccess.
    def exitFieldAccess(self, ctx:LanguageParser.FieldAccessContext):
        pass


    # Enter a parse tree produced by LanguageParser#indexSuffix.
    def enterIndexSuffix(self, ctx:LanguageParser.IndexSuffixContext):
        pass

    # Exit a parse tree produced by LanguageParser#indexSuffix.
    def exitIndexSuffix(self, ctx:LanguageParser.IndexSuffixContext):
        pass


    # Enter a parse tree produced by LanguageParser#expr.
    def enterExpr(self, ctx:LanguageParser.ExprContext):
        pass

    # Exit a parse tree produced by LanguageParser#expr.
    def exitExpr(self, ctx:LanguageParser.ExprContext):
        pass


    # Enter a parse tree produced by LanguageParser#orExpr.
    def enterOrExpr(self, ctx:LanguageParser.OrExprContext):
        pass

    # Exit a parse tree produced by LanguageParser#orExpr.
    def exitOrExpr(self, ctx:LanguageParser.OrExprContext):
        pass


    # Enter a parse tree produced by LanguageParser#andExpr.
    def enterAndExpr(self, ctx:LanguageParser.AndExprContext):
        pass

    # Exit a parse tree produced by LanguageParser#andExpr.
    def exitAndExpr(self, ctx:LanguageParser.AndExprContext):
        pass


    # Enter a parse tree produced by LanguageParser#relExpr.
    def enterRelExpr(self, ctx:LanguageParser.RelExprContext):
        pass

    # Exit a parse tree produced by LanguageParser#relExpr.
    def exitRelExpr(self, ctx:LanguageParser.RelExprContext):
        pass


    # Enter a parse tree produced by LanguageParser#addExpr.
    def enterAddExpr(self, ctx:LanguageParser.AddExprContext):
        pass

    # Exit a parse tree produced by LanguageParser#addExpr.
    def exitAddExpr(self, ctx:LanguageParser.AddExprContext):
        pass


    # Enter a parse tree produced by LanguageParser#mulExpr.
    def enterMulExpr(self, ctx:LanguageParser.MulExprContext):
        pass

    # Exit a parse tree produced by LanguageParser#mulExpr.
    def exitMulExpr(self, ctx:LanguageParser.MulExprContext):
        pass


    # Enter a parse tree produced by LanguageParser#unaryExpr.
    def enterUnaryExpr(self, ctx:LanguageParser.UnaryExprContext):
        pass

    # Exit a parse tree produced by LanguageParser#unaryExpr.
    def exitUnaryExpr(self, ctx:LanguageParser.UnaryExprContext):
        pass


    # Enter a parse tree produced by LanguageParser#primary.
    def enterPrimary(self, ctx:LanguageParser.PrimaryContext):
        pass

    # Exit a parse tree produced by LanguageParser#primary.
    def exitPrimary(self, ctx:LanguageParser.PrimaryContext):
        pass


    # Enter a parse tree produced by LanguageParser#lengthCall.
    def enterLengthCall(self, ctx:LanguageParser.LengthCallContext):
        pass

    # Exit a parse tree produced by LanguageParser#lengthCall.
    def exitLengthCall(self, ctx:LanguageParser.LengthCallContext):
        pass


    # Enter a parse tree produced by LanguageParser#callExpr.
    def enterCallExpr(self, ctx:LanguageParser.CallExprContext):
        pass

    # Exit a parse tree produced by LanguageParser#callExpr.
    def exitCallExpr(self, ctx:LanguageParser.CallExprContext):
        pass



del LanguageParser