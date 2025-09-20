# Generated from grammar/Language.g4 by ANTLR 4.13.2
# encoding: utf-8
from antlr4 import *
from io import StringIO
import sys
if sys.version_info[1] > 5:
	from typing import TextIO
else:
	from typing.io import TextIO

def serializedATN():
    return [
        4,1,19,104,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,
        6,2,7,7,7,2,8,7,8,1,0,5,0,20,8,0,10,0,12,0,23,9,0,1,0,1,0,1,1,1,
        1,1,1,1,1,1,1,1,1,5,1,33,8,1,10,1,12,1,36,9,1,3,1,38,8,1,1,1,1,1,
        1,1,1,2,1,2,5,2,45,8,2,10,2,12,2,48,9,2,1,2,1,2,1,3,1,3,1,3,1,3,
        1,3,1,3,1,3,3,3,59,8,3,1,4,1,4,1,4,1,4,1,4,1,5,1,5,1,5,1,5,1,5,1,
        5,1,5,1,5,1,5,1,5,1,6,1,6,1,6,1,7,1,7,1,7,1,7,1,8,1,8,1,8,1,8,1,
        8,1,8,1,8,1,8,3,8,91,8,8,1,8,1,8,1,8,1,8,1,8,1,8,5,8,99,8,8,10,8,
        12,8,102,9,8,1,8,0,1,16,9,0,2,4,6,8,10,12,14,16,0,2,1,0,12,13,1,
        0,14,15,105,0,21,1,0,0,0,2,26,1,0,0,0,4,42,1,0,0,0,6,58,1,0,0,0,
        8,60,1,0,0,0,10,65,1,0,0,0,12,75,1,0,0,0,14,78,1,0,0,0,16,90,1,0,
        0,0,18,20,3,2,1,0,19,18,1,0,0,0,20,23,1,0,0,0,21,19,1,0,0,0,21,22,
        1,0,0,0,22,24,1,0,0,0,23,21,1,0,0,0,24,25,5,0,0,1,25,1,1,0,0,0,26,
        27,5,1,0,0,27,28,5,17,0,0,28,37,5,2,0,0,29,34,5,17,0,0,30,31,5,3,
        0,0,31,33,5,17,0,0,32,30,1,0,0,0,33,36,1,0,0,0,34,32,1,0,0,0,34,
        35,1,0,0,0,35,38,1,0,0,0,36,34,1,0,0,0,37,29,1,0,0,0,37,38,1,0,0,
        0,38,39,1,0,0,0,39,40,5,4,0,0,40,41,3,4,2,0,41,3,1,0,0,0,42,46,5,
        5,0,0,43,45,3,6,3,0,44,43,1,0,0,0,45,48,1,0,0,0,46,44,1,0,0,0,46,
        47,1,0,0,0,47,49,1,0,0,0,48,46,1,0,0,0,49,50,5,6,0,0,50,5,1,0,0,
        0,51,52,3,8,4,0,52,53,5,7,0,0,53,59,1,0,0,0,54,59,3,10,5,0,55,56,
        3,12,6,0,56,57,5,7,0,0,57,59,1,0,0,0,58,51,1,0,0,0,58,54,1,0,0,0,
        58,55,1,0,0,0,59,7,1,0,0,0,60,61,5,8,0,0,61,62,5,17,0,0,62,63,5,
        9,0,0,63,64,3,16,8,0,64,9,1,0,0,0,65,66,5,10,0,0,66,67,5,2,0,0,67,
        68,3,8,4,0,68,69,5,7,0,0,69,70,3,16,8,0,70,71,5,7,0,0,71,72,3,14,
        7,0,72,73,5,4,0,0,73,74,3,4,2,0,74,11,1,0,0,0,75,76,5,11,0,0,76,
        77,3,16,8,0,77,13,1,0,0,0,78,79,5,17,0,0,79,80,5,9,0,0,80,81,3,16,
        8,0,81,15,1,0,0,0,82,83,6,8,-1,0,83,91,5,17,0,0,84,91,5,18,0,0,85,
        91,5,16,0,0,86,87,5,2,0,0,87,88,3,16,8,0,88,89,5,4,0,0,89,91,1,0,
        0,0,90,82,1,0,0,0,90,84,1,0,0,0,90,85,1,0,0,0,90,86,1,0,0,0,91,100,
        1,0,0,0,92,93,10,6,0,0,93,94,7,0,0,0,94,99,3,16,8,7,95,96,10,5,0,
        0,96,97,7,1,0,0,97,99,3,16,8,6,98,92,1,0,0,0,98,95,1,0,0,0,99,102,
        1,0,0,0,100,98,1,0,0,0,100,101,1,0,0,0,101,17,1,0,0,0,102,100,1,
        0,0,0,8,21,34,37,46,58,90,98,100
    ]

class LanguageParser ( Parser ):

    grammarFileName = "Language.g4"

    atn = ATNDeserializer().deserialize(serializedATN())

    decisionsToDFA = [ DFA(ds, i) for i, ds in enumerate(atn.decisionToState) ]

    sharedContextCache = PredictionContextCache()

    literalNames = [ "<INVALID>", "'function'", "'('", "','", "')'", "'{'", 
                     "'}'", "';'", "'let'", "'='", "'for'", "'return'", 
                     "'+'", "'-'", "'*'", "'/'" ]

    symbolicNames = [ "<INVALID>", "<INVALID>", "<INVALID>", "<INVALID>", 
                      "<INVALID>", "<INVALID>", "<INVALID>", "<INVALID>", 
                      "<INVALID>", "<INVALID>", "<INVALID>", "<INVALID>", 
                      "<INVALID>", "<INVALID>", "<INVALID>", "<INVALID>", 
                      "ArrayAccess", "Identifier", "Number", "WS" ]

    RULE_program = 0
    RULE_functionDecl = 1
    RULE_block = 2
    RULE_statement = 3
    RULE_variableDecl = 4
    RULE_forStmt = 5
    RULE_returnStmt = 6
    RULE_assign = 7
    RULE_expr = 8

    ruleNames =  [ "program", "functionDecl", "block", "statement", "variableDecl", 
                   "forStmt", "returnStmt", "assign", "expr" ]

    EOF = Token.EOF
    T__0=1
    T__1=2
    T__2=3
    T__3=4
    T__4=5
    T__5=6
    T__6=7
    T__7=8
    T__8=9
    T__9=10
    T__10=11
    T__11=12
    T__12=13
    T__13=14
    T__14=15
    ArrayAccess=16
    Identifier=17
    Number=18
    WS=19

    def __init__(self, input:TokenStream, output:TextIO = sys.stdout):
        super().__init__(input, output)
        self.checkVersion("4.13.2")
        self._interp = ParserATNSimulator(self, self.atn, self.decisionsToDFA, self.sharedContextCache)
        self._predicates = None




    class ProgramContext(ParserRuleContext):
        __slots__ = 'parser'

        def __init__(self, parser, parent:ParserRuleContext=None, invokingState:int=-1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def EOF(self):
            return self.getToken(LanguageParser.EOF, 0)

        def functionDecl(self, i:int=None):
            if i is None:
                return self.getTypedRuleContexts(LanguageParser.FunctionDeclContext)
            else:
                return self.getTypedRuleContext(LanguageParser.FunctionDeclContext,i)


        def getRuleIndex(self):
            return LanguageParser.RULE_program

        def enterRule(self, listener:ParseTreeListener):
            if hasattr( listener, "enterProgram" ):
                listener.enterProgram(self)

        def exitRule(self, listener:ParseTreeListener):
            if hasattr( listener, "exitProgram" ):
                listener.exitProgram(self)

        def accept(self, visitor:ParseTreeVisitor):
            if hasattr( visitor, "visitProgram" ):
                return visitor.visitProgram(self)
            else:
                return visitor.visitChildren(self)




    def program(self):

        localctx = LanguageParser.ProgramContext(self, self._ctx, self.state)
        self.enterRule(localctx, 0, self.RULE_program)
        self._la = 0 # Token type
        try:
            self.enterOuterAlt(localctx, 1)
            self.state = 21
            self._errHandler.sync(self)
            _la = self._input.LA(1)
            while _la==1:
                self.state = 18
                self.functionDecl()
                self.state = 23
                self._errHandler.sync(self)
                _la = self._input.LA(1)

            self.state = 24
            self.match(LanguageParser.EOF)
        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx


    class FunctionDeclContext(ParserRuleContext):
        __slots__ = 'parser'

        def __init__(self, parser, parent:ParserRuleContext=None, invokingState:int=-1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def Identifier(self, i:int=None):
            if i is None:
                return self.getTokens(LanguageParser.Identifier)
            else:
                return self.getToken(LanguageParser.Identifier, i)

        def block(self):
            return self.getTypedRuleContext(LanguageParser.BlockContext,0)


        def getRuleIndex(self):
            return LanguageParser.RULE_functionDecl

        def enterRule(self, listener:ParseTreeListener):
            if hasattr( listener, "enterFunctionDecl" ):
                listener.enterFunctionDecl(self)

        def exitRule(self, listener:ParseTreeListener):
            if hasattr( listener, "exitFunctionDecl" ):
                listener.exitFunctionDecl(self)

        def accept(self, visitor:ParseTreeVisitor):
            if hasattr( visitor, "visitFunctionDecl" ):
                return visitor.visitFunctionDecl(self)
            else:
                return visitor.visitChildren(self)




    def functionDecl(self):

        localctx = LanguageParser.FunctionDeclContext(self, self._ctx, self.state)
        self.enterRule(localctx, 2, self.RULE_functionDecl)
        self._la = 0 # Token type
        try:
            self.enterOuterAlt(localctx, 1)
            self.state = 26
            self.match(LanguageParser.T__0)
            self.state = 27
            self.match(LanguageParser.Identifier)
            self.state = 28
            self.match(LanguageParser.T__1)
            self.state = 37
            self._errHandler.sync(self)
            _la = self._input.LA(1)
            if _la==17:
                self.state = 29
                self.match(LanguageParser.Identifier)
                self.state = 34
                self._errHandler.sync(self)
                _la = self._input.LA(1)
                while _la==3:
                    self.state = 30
                    self.match(LanguageParser.T__2)
                    self.state = 31
                    self.match(LanguageParser.Identifier)
                    self.state = 36
                    self._errHandler.sync(self)
                    _la = self._input.LA(1)



            self.state = 39
            self.match(LanguageParser.T__3)
            self.state = 40
            self.block()
        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx


    class BlockContext(ParserRuleContext):
        __slots__ = 'parser'

        def __init__(self, parser, parent:ParserRuleContext=None, invokingState:int=-1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def statement(self, i:int=None):
            if i is None:
                return self.getTypedRuleContexts(LanguageParser.StatementContext)
            else:
                return self.getTypedRuleContext(LanguageParser.StatementContext,i)


        def getRuleIndex(self):
            return LanguageParser.RULE_block

        def enterRule(self, listener:ParseTreeListener):
            if hasattr( listener, "enterBlock" ):
                listener.enterBlock(self)

        def exitRule(self, listener:ParseTreeListener):
            if hasattr( listener, "exitBlock" ):
                listener.exitBlock(self)

        def accept(self, visitor:ParseTreeVisitor):
            if hasattr( visitor, "visitBlock" ):
                return visitor.visitBlock(self)
            else:
                return visitor.visitChildren(self)




    def block(self):

        localctx = LanguageParser.BlockContext(self, self._ctx, self.state)
        self.enterRule(localctx, 4, self.RULE_block)
        self._la = 0 # Token type
        try:
            self.enterOuterAlt(localctx, 1)
            self.state = 42
            self.match(LanguageParser.T__4)
            self.state = 46
            self._errHandler.sync(self)
            _la = self._input.LA(1)
            while (((_la) & ~0x3f) == 0 and ((1 << _la) & 3328) != 0):
                self.state = 43
                self.statement()
                self.state = 48
                self._errHandler.sync(self)
                _la = self._input.LA(1)

            self.state = 49
            self.match(LanguageParser.T__5)
        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx


    class StatementContext(ParserRuleContext):
        __slots__ = 'parser'

        def __init__(self, parser, parent:ParserRuleContext=None, invokingState:int=-1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def variableDecl(self):
            return self.getTypedRuleContext(LanguageParser.VariableDeclContext,0)


        def forStmt(self):
            return self.getTypedRuleContext(LanguageParser.ForStmtContext,0)


        def returnStmt(self):
            return self.getTypedRuleContext(LanguageParser.ReturnStmtContext,0)


        def getRuleIndex(self):
            return LanguageParser.RULE_statement

        def enterRule(self, listener:ParseTreeListener):
            if hasattr( listener, "enterStatement" ):
                listener.enterStatement(self)

        def exitRule(self, listener:ParseTreeListener):
            if hasattr( listener, "exitStatement" ):
                listener.exitStatement(self)

        def accept(self, visitor:ParseTreeVisitor):
            if hasattr( visitor, "visitStatement" ):
                return visitor.visitStatement(self)
            else:
                return visitor.visitChildren(self)




    def statement(self):

        localctx = LanguageParser.StatementContext(self, self._ctx, self.state)
        self.enterRule(localctx, 6, self.RULE_statement)
        try:
            self.state = 58
            self._errHandler.sync(self)
            token = self._input.LA(1)
            if token in [8]:
                self.enterOuterAlt(localctx, 1)
                self.state = 51
                self.variableDecl()
                self.state = 52
                self.match(LanguageParser.T__6)
                pass
            elif token in [10]:
                self.enterOuterAlt(localctx, 2)
                self.state = 54
                self.forStmt()
                pass
            elif token in [11]:
                self.enterOuterAlt(localctx, 3)
                self.state = 55
                self.returnStmt()
                self.state = 56
                self.match(LanguageParser.T__6)
                pass
            else:
                raise NoViableAltException(self)

        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx


    class VariableDeclContext(ParserRuleContext):
        __slots__ = 'parser'

        def __init__(self, parser, parent:ParserRuleContext=None, invokingState:int=-1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def Identifier(self):
            return self.getToken(LanguageParser.Identifier, 0)

        def expr(self):
            return self.getTypedRuleContext(LanguageParser.ExprContext,0)


        def getRuleIndex(self):
            return LanguageParser.RULE_variableDecl

        def enterRule(self, listener:ParseTreeListener):
            if hasattr( listener, "enterVariableDecl" ):
                listener.enterVariableDecl(self)

        def exitRule(self, listener:ParseTreeListener):
            if hasattr( listener, "exitVariableDecl" ):
                listener.exitVariableDecl(self)

        def accept(self, visitor:ParseTreeVisitor):
            if hasattr( visitor, "visitVariableDecl" ):
                return visitor.visitVariableDecl(self)
            else:
                return visitor.visitChildren(self)




    def variableDecl(self):

        localctx = LanguageParser.VariableDeclContext(self, self._ctx, self.state)
        self.enterRule(localctx, 8, self.RULE_variableDecl)
        try:
            self.enterOuterAlt(localctx, 1)
            self.state = 60
            self.match(LanguageParser.T__7)
            self.state = 61
            self.match(LanguageParser.Identifier)
            self.state = 62
            self.match(LanguageParser.T__8)
            self.state = 63
            self.expr(0)
        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx


    class ForStmtContext(ParserRuleContext):
        __slots__ = 'parser'

        def __init__(self, parser, parent:ParserRuleContext=None, invokingState:int=-1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def variableDecl(self):
            return self.getTypedRuleContext(LanguageParser.VariableDeclContext,0)


        def expr(self):
            return self.getTypedRuleContext(LanguageParser.ExprContext,0)


        def assign(self):
            return self.getTypedRuleContext(LanguageParser.AssignContext,0)


        def block(self):
            return self.getTypedRuleContext(LanguageParser.BlockContext,0)


        def getRuleIndex(self):
            return LanguageParser.RULE_forStmt

        def enterRule(self, listener:ParseTreeListener):
            if hasattr( listener, "enterForStmt" ):
                listener.enterForStmt(self)

        def exitRule(self, listener:ParseTreeListener):
            if hasattr( listener, "exitForStmt" ):
                listener.exitForStmt(self)

        def accept(self, visitor:ParseTreeVisitor):
            if hasattr( visitor, "visitForStmt" ):
                return visitor.visitForStmt(self)
            else:
                return visitor.visitChildren(self)




    def forStmt(self):

        localctx = LanguageParser.ForStmtContext(self, self._ctx, self.state)
        self.enterRule(localctx, 10, self.RULE_forStmt)
        try:
            self.enterOuterAlt(localctx, 1)
            self.state = 65
            self.match(LanguageParser.T__9)
            self.state = 66
            self.match(LanguageParser.T__1)
            self.state = 67
            self.variableDecl()
            self.state = 68
            self.match(LanguageParser.T__6)
            self.state = 69
            self.expr(0)
            self.state = 70
            self.match(LanguageParser.T__6)
            self.state = 71
            self.assign()
            self.state = 72
            self.match(LanguageParser.T__3)
            self.state = 73
            self.block()
        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx


    class ReturnStmtContext(ParserRuleContext):
        __slots__ = 'parser'

        def __init__(self, parser, parent:ParserRuleContext=None, invokingState:int=-1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def expr(self):
            return self.getTypedRuleContext(LanguageParser.ExprContext,0)


        def getRuleIndex(self):
            return LanguageParser.RULE_returnStmt

        def enterRule(self, listener:ParseTreeListener):
            if hasattr( listener, "enterReturnStmt" ):
                listener.enterReturnStmt(self)

        def exitRule(self, listener:ParseTreeListener):
            if hasattr( listener, "exitReturnStmt" ):
                listener.exitReturnStmt(self)

        def accept(self, visitor:ParseTreeVisitor):
            if hasattr( visitor, "visitReturnStmt" ):
                return visitor.visitReturnStmt(self)
            else:
                return visitor.visitChildren(self)




    def returnStmt(self):

        localctx = LanguageParser.ReturnStmtContext(self, self._ctx, self.state)
        self.enterRule(localctx, 12, self.RULE_returnStmt)
        try:
            self.enterOuterAlt(localctx, 1)
            self.state = 75
            self.match(LanguageParser.T__10)
            self.state = 76
            self.expr(0)
        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx


    class AssignContext(ParserRuleContext):
        __slots__ = 'parser'

        def __init__(self, parser, parent:ParserRuleContext=None, invokingState:int=-1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def Identifier(self):
            return self.getToken(LanguageParser.Identifier, 0)

        def expr(self):
            return self.getTypedRuleContext(LanguageParser.ExprContext,0)


        def getRuleIndex(self):
            return LanguageParser.RULE_assign

        def enterRule(self, listener:ParseTreeListener):
            if hasattr( listener, "enterAssign" ):
                listener.enterAssign(self)

        def exitRule(self, listener:ParseTreeListener):
            if hasattr( listener, "exitAssign" ):
                listener.exitAssign(self)

        def accept(self, visitor:ParseTreeVisitor):
            if hasattr( visitor, "visitAssign" ):
                return visitor.visitAssign(self)
            else:
                return visitor.visitChildren(self)




    def assign(self):

        localctx = LanguageParser.AssignContext(self, self._ctx, self.state)
        self.enterRule(localctx, 14, self.RULE_assign)
        try:
            self.enterOuterAlt(localctx, 1)
            self.state = 78
            self.match(LanguageParser.Identifier)
            self.state = 79
            self.match(LanguageParser.T__8)
            self.state = 80
            self.expr(0)
        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx


    class ExprContext(ParserRuleContext):
        __slots__ = 'parser'

        def __init__(self, parser, parent:ParserRuleContext=None, invokingState:int=-1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def Identifier(self):
            return self.getToken(LanguageParser.Identifier, 0)

        def Number(self):
            return self.getToken(LanguageParser.Number, 0)

        def ArrayAccess(self):
            return self.getToken(LanguageParser.ArrayAccess, 0)

        def expr(self, i:int=None):
            if i is None:
                return self.getTypedRuleContexts(LanguageParser.ExprContext)
            else:
                return self.getTypedRuleContext(LanguageParser.ExprContext,i)


        def getRuleIndex(self):
            return LanguageParser.RULE_expr

        def enterRule(self, listener:ParseTreeListener):
            if hasattr( listener, "enterExpr" ):
                listener.enterExpr(self)

        def exitRule(self, listener:ParseTreeListener):
            if hasattr( listener, "exitExpr" ):
                listener.exitExpr(self)

        def accept(self, visitor:ParseTreeVisitor):
            if hasattr( visitor, "visitExpr" ):
                return visitor.visitExpr(self)
            else:
                return visitor.visitChildren(self)



    def expr(self, _p:int=0):
        _parentctx = self._ctx
        _parentState = self.state
        localctx = LanguageParser.ExprContext(self, self._ctx, _parentState)
        _prevctx = localctx
        _startState = 16
        self.enterRecursionRule(localctx, 16, self.RULE_expr, _p)
        self._la = 0 # Token type
        try:
            self.enterOuterAlt(localctx, 1)
            self.state = 90
            self._errHandler.sync(self)
            token = self._input.LA(1)
            if token in [17]:
                self.state = 83
                self.match(LanguageParser.Identifier)
                pass
            elif token in [18]:
                self.state = 84
                self.match(LanguageParser.Number)
                pass
            elif token in [16]:
                self.state = 85
                self.match(LanguageParser.ArrayAccess)
                pass
            elif token in [2]:
                self.state = 86
                self.match(LanguageParser.T__1)
                self.state = 87
                self.expr(0)
                self.state = 88
                self.match(LanguageParser.T__3)
                pass
            else:
                raise NoViableAltException(self)

            self._ctx.stop = self._input.LT(-1)
            self.state = 100
            self._errHandler.sync(self)
            _alt = self._interp.adaptivePredict(self._input,7,self._ctx)
            while _alt!=2 and _alt!=ATN.INVALID_ALT_NUMBER:
                if _alt==1:
                    if self._parseListeners is not None:
                        self.triggerExitRuleEvent()
                    _prevctx = localctx
                    self.state = 98
                    self._errHandler.sync(self)
                    la_ = self._interp.adaptivePredict(self._input,6,self._ctx)
                    if la_ == 1:
                        localctx = LanguageParser.ExprContext(self, _parentctx, _parentState)
                        self.pushNewRecursionContext(localctx, _startState, self.RULE_expr)
                        self.state = 92
                        if not self.precpred(self._ctx, 6):
                            from antlr4.error.Errors import FailedPredicateException
                            raise FailedPredicateException(self, "self.precpred(self._ctx, 6)")
                        self.state = 93
                        _la = self._input.LA(1)
                        if not(_la==12 or _la==13):
                            self._errHandler.recoverInline(self)
                        else:
                            self._errHandler.reportMatch(self)
                            self.consume()
                        self.state = 94
                        self.expr(7)
                        pass

                    elif la_ == 2:
                        localctx = LanguageParser.ExprContext(self, _parentctx, _parentState)
                        self.pushNewRecursionContext(localctx, _startState, self.RULE_expr)
                        self.state = 95
                        if not self.precpred(self._ctx, 5):
                            from antlr4.error.Errors import FailedPredicateException
                            raise FailedPredicateException(self, "self.precpred(self._ctx, 5)")
                        self.state = 96
                        _la = self._input.LA(1)
                        if not(_la==14 or _la==15):
                            self._errHandler.recoverInline(self)
                        else:
                            self._errHandler.reportMatch(self)
                            self.consume()
                        self.state = 97
                        self.expr(6)
                        pass

             
                self.state = 102
                self._errHandler.sync(self)
                _alt = self._interp.adaptivePredict(self._input,7,self._ctx)

        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.unrollRecursionContexts(_parentctx)
        return localctx



    def sempred(self, localctx:RuleContext, ruleIndex:int, predIndex:int):
        if self._predicates == None:
            self._predicates = dict()
        self._predicates[8] = self.expr_sempred
        pred = self._predicates.get(ruleIndex, None)
        if pred is None:
            raise Exception("No predicate with index:" + str(ruleIndex))
        else:
            return pred(localctx, predIndex)

    def expr_sempred(self, localctx:ExprContext, predIndex:int):
            if predIndex == 0:
                return self.precpred(self._ctx, 6)
         

            if predIndex == 1:
                return self.precpred(self._ctx, 5)
         




