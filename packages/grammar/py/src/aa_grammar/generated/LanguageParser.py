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
        4,1,45,235,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,
        6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,13,7,13,
        2,14,7,14,2,15,7,15,2,16,7,16,2,17,7,17,2,18,7,18,2,19,7,19,2,20,
        7,20,2,21,7,21,2,22,7,22,1,0,5,0,48,8,0,10,0,12,0,51,9,0,1,0,1,0,
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,1,63,8,1,1,2,1,2,5,2,67,8,2,10,
        2,12,2,70,9,2,1,2,1,2,1,2,5,2,75,8,2,10,2,12,2,78,9,2,1,2,3,2,81,
        8,2,1,3,1,3,1,3,1,3,3,3,87,8,3,1,4,1,4,4,4,91,8,4,11,4,12,4,92,1,
        4,3,4,96,8,4,1,5,1,5,1,5,1,5,3,5,102,8,5,1,5,1,5,3,5,106,8,5,1,6,
        1,6,1,6,5,6,111,8,6,10,6,12,6,114,9,6,1,7,1,7,1,7,1,7,1,7,1,7,1,
        7,1,7,3,7,124,8,7,1,8,1,8,1,8,1,8,1,8,1,8,1,8,1,9,1,9,1,9,1,9,1,
        9,1,9,1,9,1,9,1,9,1,10,1,10,1,10,5,10,145,8,10,10,10,12,10,148,9,
        10,1,11,1,11,1,11,1,12,1,12,1,12,1,12,3,12,157,8,12,1,12,1,12,1,
        13,1,13,1,14,1,14,1,14,5,14,166,8,14,10,14,12,14,169,9,14,1,15,1,
        15,1,15,5,15,174,8,15,10,15,12,15,177,9,15,1,16,1,16,1,16,5,16,182,
        8,16,10,16,12,16,185,9,16,1,17,1,17,1,17,5,17,190,8,17,10,17,12,
        17,193,9,17,1,18,1,18,1,18,5,18,198,8,18,10,18,12,18,201,9,18,1,
        19,1,19,1,19,1,19,1,19,3,19,208,8,19,1,20,1,20,1,20,1,20,1,20,1,
        20,1,20,1,20,1,20,1,20,1,20,3,20,221,8,20,1,21,1,21,1,21,1,21,1,
        21,1,22,1,22,1,22,3,22,231,8,22,1,22,1,22,1,22,0,0,23,0,2,4,6,8,
        10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,0,3,1,0,16,
        21,1,0,12,13,2,0,14,15,39,40,247,0,49,1,0,0,0,2,62,1,0,0,0,4,80,
        1,0,0,0,6,82,1,0,0,0,8,88,1,0,0,0,10,97,1,0,0,0,12,107,1,0,0,0,14,
        115,1,0,0,0,16,125,1,0,0,0,18,132,1,0,0,0,20,141,1,0,0,0,22,149,
        1,0,0,0,24,152,1,0,0,0,26,160,1,0,0,0,28,162,1,0,0,0,30,170,1,0,
        0,0,32,178,1,0,0,0,34,186,1,0,0,0,36,194,1,0,0,0,38,207,1,0,0,0,
        40,220,1,0,0,0,42,222,1,0,0,0,44,227,1,0,0,0,46,48,3,2,1,0,47,46,
        1,0,0,0,48,51,1,0,0,0,49,47,1,0,0,0,49,50,1,0,0,0,50,52,1,0,0,0,
        51,49,1,0,0,0,52,53,5,0,0,1,53,1,1,0,0,0,54,63,3,6,3,0,55,63,3,10,
        5,0,56,63,3,14,7,0,57,63,3,16,8,0,58,63,3,18,9,0,59,63,3,4,2,0,60,
        63,3,8,4,0,61,63,5,10,0,0,62,54,1,0,0,0,62,55,1,0,0,0,62,56,1,0,
        0,0,62,57,1,0,0,0,62,58,1,0,0,0,62,59,1,0,0,0,62,60,1,0,0,0,62,61,
        1,0,0,0,63,3,1,0,0,0,64,68,5,5,0,0,65,67,3,2,1,0,66,65,1,0,0,0,67,
        70,1,0,0,0,68,66,1,0,0,0,68,69,1,0,0,0,69,71,1,0,0,0,70,68,1,0,0,
        0,71,81,5,6,0,0,72,76,5,27,0,0,73,75,3,2,1,0,74,73,1,0,0,0,75,78,
        1,0,0,0,76,74,1,0,0,0,76,77,1,0,0,0,77,79,1,0,0,0,78,76,1,0,0,0,
        79,81,5,28,0,0,80,64,1,0,0,0,80,72,1,0,0,0,81,5,1,0,0,0,82,83,3,
        20,10,0,83,84,5,11,0,0,84,86,3,26,13,0,85,87,5,10,0,0,86,85,1,0,
        0,0,86,87,1,0,0,0,87,7,1,0,0,0,88,90,5,41,0,0,89,91,3,24,12,0,90,
        89,1,0,0,0,91,92,1,0,0,0,92,90,1,0,0,0,92,93,1,0,0,0,93,95,1,0,0,
        0,94,96,5,10,0,0,95,94,1,0,0,0,95,96,1,0,0,0,96,9,1,0,0,0,97,98,
        5,31,0,0,98,99,5,41,0,0,99,101,5,3,0,0,100,102,3,12,6,0,101,100,
        1,0,0,0,101,102,1,0,0,0,102,103,1,0,0,0,103,105,5,4,0,0,104,106,
        5,10,0,0,105,104,1,0,0,0,105,106,1,0,0,0,106,11,1,0,0,0,107,112,
        3,26,13,0,108,109,5,1,0,0,109,111,3,26,13,0,110,108,1,0,0,0,111,
        114,1,0,0,0,112,110,1,0,0,0,112,113,1,0,0,0,113,13,1,0,0,0,114,112,
        1,0,0,0,115,116,5,24,0,0,116,117,5,3,0,0,117,118,3,26,13,0,118,119,
        5,4,0,0,119,120,5,25,0,0,120,123,3,4,2,0,121,122,5,26,0,0,122,124,
        3,4,2,0,123,121,1,0,0,0,123,124,1,0,0,0,124,15,1,0,0,0,125,126,5,
        23,0,0,126,127,5,3,0,0,127,128,3,26,13,0,128,129,5,4,0,0,129,130,
        5,30,0,0,130,131,3,4,2,0,131,17,1,0,0,0,132,133,5,22,0,0,133,134,
        5,41,0,0,134,135,5,11,0,0,135,136,3,26,13,0,136,137,5,29,0,0,137,
        138,3,26,13,0,138,139,5,30,0,0,139,140,3,4,2,0,140,19,1,0,0,0,141,
        146,5,41,0,0,142,145,3,22,11,0,143,145,3,24,12,0,144,142,1,0,0,0,
        144,143,1,0,0,0,145,148,1,0,0,0,146,144,1,0,0,0,146,147,1,0,0,0,
        147,21,1,0,0,0,148,146,1,0,0,0,149,150,5,2,0,0,150,151,5,41,0,0,
        151,23,1,0,0,0,152,153,5,7,0,0,153,156,3,26,13,0,154,155,5,9,0,0,
        155,157,3,26,13,0,156,154,1,0,0,0,156,157,1,0,0,0,157,158,1,0,0,
        0,158,159,5,8,0,0,159,25,1,0,0,0,160,161,3,28,14,0,161,27,1,0,0,
        0,162,167,3,30,15,0,163,164,5,33,0,0,164,166,3,30,15,0,165,163,1,
        0,0,0,166,169,1,0,0,0,167,165,1,0,0,0,167,168,1,0,0,0,168,29,1,0,
        0,0,169,167,1,0,0,0,170,175,3,32,16,0,171,172,5,32,0,0,172,174,3,
        32,16,0,173,171,1,0,0,0,174,177,1,0,0,0,175,173,1,0,0,0,175,176,
        1,0,0,0,176,31,1,0,0,0,177,175,1,0,0,0,178,183,3,34,17,0,179,180,
        7,0,0,0,180,182,3,34,17,0,181,179,1,0,0,0,182,185,1,0,0,0,183,181,
        1,0,0,0,183,184,1,0,0,0,184,33,1,0,0,0,185,183,1,0,0,0,186,191,3,
        36,18,0,187,188,7,1,0,0,188,190,3,36,18,0,189,187,1,0,0,0,190,193,
        1,0,0,0,191,189,1,0,0,0,191,192,1,0,0,0,192,35,1,0,0,0,193,191,1,
        0,0,0,194,199,3,38,19,0,195,196,7,2,0,0,196,198,3,38,19,0,197,195,
        1,0,0,0,198,201,1,0,0,0,199,197,1,0,0,0,199,200,1,0,0,0,200,37,1,
        0,0,0,201,199,1,0,0,0,202,203,5,34,0,0,203,208,3,38,19,0,204,205,
        5,13,0,0,205,208,3,38,19,0,206,208,3,40,20,0,207,202,1,0,0,0,207,
        204,1,0,0,0,207,206,1,0,0,0,208,39,1,0,0,0,209,221,5,42,0,0,210,
        221,5,35,0,0,211,221,5,36,0,0,212,221,5,37,0,0,213,221,3,42,21,0,
        214,221,3,44,22,0,215,221,3,20,10,0,216,217,5,3,0,0,217,218,3,26,
        13,0,218,219,5,4,0,0,219,221,1,0,0,0,220,209,1,0,0,0,220,210,1,0,
        0,0,220,211,1,0,0,0,220,212,1,0,0,0,220,213,1,0,0,0,220,214,1,0,
        0,0,220,215,1,0,0,0,220,216,1,0,0,0,221,41,1,0,0,0,222,223,5,38,
        0,0,223,224,5,3,0,0,224,225,3,26,13,0,225,226,5,4,0,0,226,43,1,0,
        0,0,227,228,5,41,0,0,228,230,5,3,0,0,229,231,3,12,6,0,230,229,1,
        0,0,0,230,231,1,0,0,0,231,232,1,0,0,0,232,233,5,4,0,0,233,45,1,0,
        0,0,23,49,62,68,76,80,86,92,95,101,105,112,123,144,146,156,167,175,
        183,191,199,207,220,230
    ]

class LanguageParser ( Parser ):

    grammarFileName = "Language.g4"

    atn = ATNDeserializer().deserialize(serializedATN())

    decisionsToDFA = [ DFA(ds, i) for i, ds in enumerate(atn.decisionToState) ]

    sharedContextCache = PredictionContextCache()

    literalNames = [ "<INVALID>", "','", "'.'", "'('", "')'", "'{'", "'}'", 
                     "'['", "']'", "'..'", "';'", "<INVALID>", "'+'", "'-'", 
                     "'*'", "'/'", "'='", "<INVALID>", "<INVALID>", "<INVALID>", 
                     "'<'", "'>'" ]

    symbolicNames = [ "<INVALID>", "<INVALID>", "<INVALID>", "LPAREN", "RPAREN", 
                      "LBRACE", "RBRACE", "LBRACK", "RBRACK", "RANGE", "SEMI", 
                      "ASSIGN", "PLUS", "MINUS", "MUL", "DIVOP", "EQ", "NEQ", 
                      "LE", "GE", "LT", "GT", "FOR_KW", "WHILE_KW", "IF_KW", 
                      "THEN_KW", "ELSE_KW", "BEGIN_KW", "END_KW", "TO_KW", 
                      "DO_KW", "CALL_KW", "AND_KW", "OR_KW", "NOT_KW", "TRUE_KW", 
                      "FALSE_KW", "NULL_KW", "LENGTH_KW", "DIV_KW", "MOD_KW", 
                      "ID", "INT", "WS", "LINE_COMMENT", "SL_COMMENT" ]

    RULE_program = 0
    RULE_stmt = 1
    RULE_block = 2
    RULE_assignmentStmt = 3
    RULE_declVectorStmt = 4
    RULE_callStmt = 5
    RULE_argList = 6
    RULE_ifStmt = 7
    RULE_whileStmt = 8
    RULE_forStmt = 9
    RULE_lvalue = 10
    RULE_fieldAccess = 11
    RULE_indexSuffix = 12
    RULE_expr = 13
    RULE_orExpr = 14
    RULE_andExpr = 15
    RULE_relExpr = 16
    RULE_addExpr = 17
    RULE_mulExpr = 18
    RULE_unaryExpr = 19
    RULE_primary = 20
    RULE_lengthCall = 21
    RULE_callExpr = 22

    ruleNames =  [ "program", "stmt", "block", "assignmentStmt", "declVectorStmt", 
                   "callStmt", "argList", "ifStmt", "whileStmt", "forStmt", 
                   "lvalue", "fieldAccess", "indexSuffix", "expr", "orExpr", 
                   "andExpr", "relExpr", "addExpr", "mulExpr", "unaryExpr", 
                   "primary", "lengthCall", "callExpr" ]

    EOF = Token.EOF
    T__0=1
    T__1=2
    LPAREN=3
    RPAREN=4
    LBRACE=5
    RBRACE=6
    LBRACK=7
    RBRACK=8
    RANGE=9
    SEMI=10
    ASSIGN=11
    PLUS=12
    MINUS=13
    MUL=14
    DIVOP=15
    EQ=16
    NEQ=17
    LE=18
    GE=19
    LT=20
    GT=21
    FOR_KW=22
    WHILE_KW=23
    IF_KW=24
    THEN_KW=25
    ELSE_KW=26
    BEGIN_KW=27
    END_KW=28
    TO_KW=29
    DO_KW=30
    CALL_KW=31
    AND_KW=32
    OR_KW=33
    NOT_KW=34
    TRUE_KW=35
    FALSE_KW=36
    NULL_KW=37
    LENGTH_KW=38
    DIV_KW=39
    MOD_KW=40
    ID=41
    INT=42
    WS=43
    LINE_COMMENT=44
    SL_COMMENT=45

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

        def stmt(self, i:int=None):
            if i is None:
                return self.getTypedRuleContexts(LanguageParser.StmtContext)
            else:
                return self.getTypedRuleContext(LanguageParser.StmtContext,i)


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
            self.state = 49
            self._errHandler.sync(self)
            _la = self._input.LA(1)
            while (((_la) & ~0x3f) == 0 and ((1 << _la) & 2201334318112) != 0):
                self.state = 46
                self.stmt()
                self.state = 51
                self._errHandler.sync(self)
                _la = self._input.LA(1)

            self.state = 52
            self.match(LanguageParser.EOF)
        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx


    class StmtContext(ParserRuleContext):
        __slots__ = 'parser'

        def __init__(self, parser, parent:ParserRuleContext=None, invokingState:int=-1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def assignmentStmt(self):
            return self.getTypedRuleContext(LanguageParser.AssignmentStmtContext,0)


        def callStmt(self):
            return self.getTypedRuleContext(LanguageParser.CallStmtContext,0)


        def ifStmt(self):
            return self.getTypedRuleContext(LanguageParser.IfStmtContext,0)


        def whileStmt(self):
            return self.getTypedRuleContext(LanguageParser.WhileStmtContext,0)


        def forStmt(self):
            return self.getTypedRuleContext(LanguageParser.ForStmtContext,0)


        def block(self):
            return self.getTypedRuleContext(LanguageParser.BlockContext,0)


        def declVectorStmt(self):
            return self.getTypedRuleContext(LanguageParser.DeclVectorStmtContext,0)


        def SEMI(self):
            return self.getToken(LanguageParser.SEMI, 0)

        def getRuleIndex(self):
            return LanguageParser.RULE_stmt

        def enterRule(self, listener:ParseTreeListener):
            if hasattr( listener, "enterStmt" ):
                listener.enterStmt(self)

        def exitRule(self, listener:ParseTreeListener):
            if hasattr( listener, "exitStmt" ):
                listener.exitStmt(self)

        def accept(self, visitor:ParseTreeVisitor):
            if hasattr( visitor, "visitStmt" ):
                return visitor.visitStmt(self)
            else:
                return visitor.visitChildren(self)




    def stmt(self):

        localctx = LanguageParser.StmtContext(self, self._ctx, self.state)
        self.enterRule(localctx, 2, self.RULE_stmt)
        try:
            self.state = 62
            self._errHandler.sync(self)
            la_ = self._interp.adaptivePredict(self._input,1,self._ctx)
            if la_ == 1:
                self.enterOuterAlt(localctx, 1)
                self.state = 54
                self.assignmentStmt()
                pass

            elif la_ == 2:
                self.enterOuterAlt(localctx, 2)
                self.state = 55
                self.callStmt()
                pass

            elif la_ == 3:
                self.enterOuterAlt(localctx, 3)
                self.state = 56
                self.ifStmt()
                pass

            elif la_ == 4:
                self.enterOuterAlt(localctx, 4)
                self.state = 57
                self.whileStmt()
                pass

            elif la_ == 5:
                self.enterOuterAlt(localctx, 5)
                self.state = 58
                self.forStmt()
                pass

            elif la_ == 6:
                self.enterOuterAlt(localctx, 6)
                self.state = 59
                self.block()
                pass

            elif la_ == 7:
                self.enterOuterAlt(localctx, 7)
                self.state = 60
                self.declVectorStmt()
                pass

            elif la_ == 8:
                self.enterOuterAlt(localctx, 8)
                self.state = 61
                self.match(LanguageParser.SEMI)
                pass


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

        def LBRACE(self):
            return self.getToken(LanguageParser.LBRACE, 0)

        def RBRACE(self):
            return self.getToken(LanguageParser.RBRACE, 0)

        def stmt(self, i:int=None):
            if i is None:
                return self.getTypedRuleContexts(LanguageParser.StmtContext)
            else:
                return self.getTypedRuleContext(LanguageParser.StmtContext,i)


        def BEGIN_KW(self):
            return self.getToken(LanguageParser.BEGIN_KW, 0)

        def END_KW(self):
            return self.getToken(LanguageParser.END_KW, 0)

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
            self.state = 80
            self._errHandler.sync(self)
            token = self._input.LA(1)
            if token in [5]:
                self.enterOuterAlt(localctx, 1)
                self.state = 64
                self.match(LanguageParser.LBRACE)
                self.state = 68
                self._errHandler.sync(self)
                _la = self._input.LA(1)
                while (((_la) & ~0x3f) == 0 and ((1 << _la) & 2201334318112) != 0):
                    self.state = 65
                    self.stmt()
                    self.state = 70
                    self._errHandler.sync(self)
                    _la = self._input.LA(1)

                self.state = 71
                self.match(LanguageParser.RBRACE)
                pass
            elif token in [27]:
                self.enterOuterAlt(localctx, 2)
                self.state = 72
                self.match(LanguageParser.BEGIN_KW)
                self.state = 76
                self._errHandler.sync(self)
                _la = self._input.LA(1)
                while (((_la) & ~0x3f) == 0 and ((1 << _la) & 2201334318112) != 0):
                    self.state = 73
                    self.stmt()
                    self.state = 78
                    self._errHandler.sync(self)
                    _la = self._input.LA(1)

                self.state = 79
                self.match(LanguageParser.END_KW)
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


    class AssignmentStmtContext(ParserRuleContext):
        __slots__ = 'parser'

        def __init__(self, parser, parent:ParserRuleContext=None, invokingState:int=-1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def lvalue(self):
            return self.getTypedRuleContext(LanguageParser.LvalueContext,0)


        def ASSIGN(self):
            return self.getToken(LanguageParser.ASSIGN, 0)

        def expr(self):
            return self.getTypedRuleContext(LanguageParser.ExprContext,0)


        def SEMI(self):
            return self.getToken(LanguageParser.SEMI, 0)

        def getRuleIndex(self):
            return LanguageParser.RULE_assignmentStmt

        def enterRule(self, listener:ParseTreeListener):
            if hasattr( listener, "enterAssignmentStmt" ):
                listener.enterAssignmentStmt(self)

        def exitRule(self, listener:ParseTreeListener):
            if hasattr( listener, "exitAssignmentStmt" ):
                listener.exitAssignmentStmt(self)

        def accept(self, visitor:ParseTreeVisitor):
            if hasattr( visitor, "visitAssignmentStmt" ):
                return visitor.visitAssignmentStmt(self)
            else:
                return visitor.visitChildren(self)




    def assignmentStmt(self):

        localctx = LanguageParser.AssignmentStmtContext(self, self._ctx, self.state)
        self.enterRule(localctx, 6, self.RULE_assignmentStmt)
        try:
            self.enterOuterAlt(localctx, 1)
            self.state = 82
            self.lvalue()
            self.state = 83
            self.match(LanguageParser.ASSIGN)
            self.state = 84
            self.expr()
            self.state = 86
            self._errHandler.sync(self)
            la_ = self._interp.adaptivePredict(self._input,5,self._ctx)
            if la_ == 1:
                self.state = 85
                self.match(LanguageParser.SEMI)


        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx


    class DeclVectorStmtContext(ParserRuleContext):
        __slots__ = 'parser'

        def __init__(self, parser, parent:ParserRuleContext=None, invokingState:int=-1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def ID(self):
            return self.getToken(LanguageParser.ID, 0)

        def indexSuffix(self, i:int=None):
            if i is None:
                return self.getTypedRuleContexts(LanguageParser.IndexSuffixContext)
            else:
                return self.getTypedRuleContext(LanguageParser.IndexSuffixContext,i)


        def SEMI(self):
            return self.getToken(LanguageParser.SEMI, 0)

        def getRuleIndex(self):
            return LanguageParser.RULE_declVectorStmt

        def enterRule(self, listener:ParseTreeListener):
            if hasattr( listener, "enterDeclVectorStmt" ):
                listener.enterDeclVectorStmt(self)

        def exitRule(self, listener:ParseTreeListener):
            if hasattr( listener, "exitDeclVectorStmt" ):
                listener.exitDeclVectorStmt(self)

        def accept(self, visitor:ParseTreeVisitor):
            if hasattr( visitor, "visitDeclVectorStmt" ):
                return visitor.visitDeclVectorStmt(self)
            else:
                return visitor.visitChildren(self)




    def declVectorStmt(self):

        localctx = LanguageParser.DeclVectorStmtContext(self, self._ctx, self.state)
        self.enterRule(localctx, 8, self.RULE_declVectorStmt)
        self._la = 0 # Token type
        try:
            self.enterOuterAlt(localctx, 1)
            self.state = 88
            self.match(LanguageParser.ID)
            self.state = 90 
            self._errHandler.sync(self)
            _la = self._input.LA(1)
            while True:
                self.state = 89
                self.indexSuffix()
                self.state = 92 
                self._errHandler.sync(self)
                _la = self._input.LA(1)
                if not (_la==7):
                    break

            self.state = 95
            self._errHandler.sync(self)
            la_ = self._interp.adaptivePredict(self._input,7,self._ctx)
            if la_ == 1:
                self.state = 94
                self.match(LanguageParser.SEMI)


        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx


    class CallStmtContext(ParserRuleContext):
        __slots__ = 'parser'

        def __init__(self, parser, parent:ParserRuleContext=None, invokingState:int=-1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def CALL_KW(self):
            return self.getToken(LanguageParser.CALL_KW, 0)

        def ID(self):
            return self.getToken(LanguageParser.ID, 0)

        def LPAREN(self):
            return self.getToken(LanguageParser.LPAREN, 0)

        def RPAREN(self):
            return self.getToken(LanguageParser.RPAREN, 0)

        def argList(self):
            return self.getTypedRuleContext(LanguageParser.ArgListContext,0)


        def SEMI(self):
            return self.getToken(LanguageParser.SEMI, 0)

        def getRuleIndex(self):
            return LanguageParser.RULE_callStmt

        def enterRule(self, listener:ParseTreeListener):
            if hasattr( listener, "enterCallStmt" ):
                listener.enterCallStmt(self)

        def exitRule(self, listener:ParseTreeListener):
            if hasattr( listener, "exitCallStmt" ):
                listener.exitCallStmt(self)

        def accept(self, visitor:ParseTreeVisitor):
            if hasattr( visitor, "visitCallStmt" ):
                return visitor.visitCallStmt(self)
            else:
                return visitor.visitChildren(self)




    def callStmt(self):

        localctx = LanguageParser.CallStmtContext(self, self._ctx, self.state)
        self.enterRule(localctx, 10, self.RULE_callStmt)
        self._la = 0 # Token type
        try:
            self.enterOuterAlt(localctx, 1)
            self.state = 97
            self.match(LanguageParser.CALL_KW)
            self.state = 98
            self.match(LanguageParser.ID)
            self.state = 99
            self.match(LanguageParser.LPAREN)
            self.state = 101
            self._errHandler.sync(self)
            _la = self._input.LA(1)
            if (((_la) & ~0x3f) == 0 and ((1 << _la) & 7129645719560) != 0):
                self.state = 100
                self.argList()


            self.state = 103
            self.match(LanguageParser.RPAREN)
            self.state = 105
            self._errHandler.sync(self)
            la_ = self._interp.adaptivePredict(self._input,9,self._ctx)
            if la_ == 1:
                self.state = 104
                self.match(LanguageParser.SEMI)


        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx


    class ArgListContext(ParserRuleContext):
        __slots__ = 'parser'

        def __init__(self, parser, parent:ParserRuleContext=None, invokingState:int=-1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def expr(self, i:int=None):
            if i is None:
                return self.getTypedRuleContexts(LanguageParser.ExprContext)
            else:
                return self.getTypedRuleContext(LanguageParser.ExprContext,i)


        def getRuleIndex(self):
            return LanguageParser.RULE_argList

        def enterRule(self, listener:ParseTreeListener):
            if hasattr( listener, "enterArgList" ):
                listener.enterArgList(self)

        def exitRule(self, listener:ParseTreeListener):
            if hasattr( listener, "exitArgList" ):
                listener.exitArgList(self)

        def accept(self, visitor:ParseTreeVisitor):
            if hasattr( visitor, "visitArgList" ):
                return visitor.visitArgList(self)
            else:
                return visitor.visitChildren(self)




    def argList(self):

        localctx = LanguageParser.ArgListContext(self, self._ctx, self.state)
        self.enterRule(localctx, 12, self.RULE_argList)
        self._la = 0 # Token type
        try:
            self.enterOuterAlt(localctx, 1)
            self.state = 107
            self.expr()
            self.state = 112
            self._errHandler.sync(self)
            _la = self._input.LA(1)
            while _la==1:
                self.state = 108
                self.match(LanguageParser.T__0)
                self.state = 109
                self.expr()
                self.state = 114
                self._errHandler.sync(self)
                _la = self._input.LA(1)

        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx


    class IfStmtContext(ParserRuleContext):
        __slots__ = 'parser'

        def __init__(self, parser, parent:ParserRuleContext=None, invokingState:int=-1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def IF_KW(self):
            return self.getToken(LanguageParser.IF_KW, 0)

        def LPAREN(self):
            return self.getToken(LanguageParser.LPAREN, 0)

        def expr(self):
            return self.getTypedRuleContext(LanguageParser.ExprContext,0)


        def RPAREN(self):
            return self.getToken(LanguageParser.RPAREN, 0)

        def THEN_KW(self):
            return self.getToken(LanguageParser.THEN_KW, 0)

        def block(self, i:int=None):
            if i is None:
                return self.getTypedRuleContexts(LanguageParser.BlockContext)
            else:
                return self.getTypedRuleContext(LanguageParser.BlockContext,i)


        def ELSE_KW(self):
            return self.getToken(LanguageParser.ELSE_KW, 0)

        def getRuleIndex(self):
            return LanguageParser.RULE_ifStmt

        def enterRule(self, listener:ParseTreeListener):
            if hasattr( listener, "enterIfStmt" ):
                listener.enterIfStmt(self)

        def exitRule(self, listener:ParseTreeListener):
            if hasattr( listener, "exitIfStmt" ):
                listener.exitIfStmt(self)

        def accept(self, visitor:ParseTreeVisitor):
            if hasattr( visitor, "visitIfStmt" ):
                return visitor.visitIfStmt(self)
            else:
                return visitor.visitChildren(self)




    def ifStmt(self):

        localctx = LanguageParser.IfStmtContext(self, self._ctx, self.state)
        self.enterRule(localctx, 14, self.RULE_ifStmt)
        self._la = 0 # Token type
        try:
            self.enterOuterAlt(localctx, 1)
            self.state = 115
            self.match(LanguageParser.IF_KW)
            self.state = 116
            self.match(LanguageParser.LPAREN)
            self.state = 117
            self.expr()
            self.state = 118
            self.match(LanguageParser.RPAREN)
            self.state = 119
            self.match(LanguageParser.THEN_KW)
            self.state = 120
            self.block()
            self.state = 123
            self._errHandler.sync(self)
            _la = self._input.LA(1)
            if _la==26:
                self.state = 121
                self.match(LanguageParser.ELSE_KW)
                self.state = 122
                self.block()


        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx


    class WhileStmtContext(ParserRuleContext):
        __slots__ = 'parser'

        def __init__(self, parser, parent:ParserRuleContext=None, invokingState:int=-1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def WHILE_KW(self):
            return self.getToken(LanguageParser.WHILE_KW, 0)

        def LPAREN(self):
            return self.getToken(LanguageParser.LPAREN, 0)

        def expr(self):
            return self.getTypedRuleContext(LanguageParser.ExprContext,0)


        def RPAREN(self):
            return self.getToken(LanguageParser.RPAREN, 0)

        def DO_KW(self):
            return self.getToken(LanguageParser.DO_KW, 0)

        def block(self):
            return self.getTypedRuleContext(LanguageParser.BlockContext,0)


        def getRuleIndex(self):
            return LanguageParser.RULE_whileStmt

        def enterRule(self, listener:ParseTreeListener):
            if hasattr( listener, "enterWhileStmt" ):
                listener.enterWhileStmt(self)

        def exitRule(self, listener:ParseTreeListener):
            if hasattr( listener, "exitWhileStmt" ):
                listener.exitWhileStmt(self)

        def accept(self, visitor:ParseTreeVisitor):
            if hasattr( visitor, "visitWhileStmt" ):
                return visitor.visitWhileStmt(self)
            else:
                return visitor.visitChildren(self)




    def whileStmt(self):

        localctx = LanguageParser.WhileStmtContext(self, self._ctx, self.state)
        self.enterRule(localctx, 16, self.RULE_whileStmt)
        try:
            self.enterOuterAlt(localctx, 1)
            self.state = 125
            self.match(LanguageParser.WHILE_KW)
            self.state = 126
            self.match(LanguageParser.LPAREN)
            self.state = 127
            self.expr()
            self.state = 128
            self.match(LanguageParser.RPAREN)
            self.state = 129
            self.match(LanguageParser.DO_KW)
            self.state = 130
            self.block()
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

        def FOR_KW(self):
            return self.getToken(LanguageParser.FOR_KW, 0)

        def ID(self):
            return self.getToken(LanguageParser.ID, 0)

        def ASSIGN(self):
            return self.getToken(LanguageParser.ASSIGN, 0)

        def expr(self, i:int=None):
            if i is None:
                return self.getTypedRuleContexts(LanguageParser.ExprContext)
            else:
                return self.getTypedRuleContext(LanguageParser.ExprContext,i)


        def TO_KW(self):
            return self.getToken(LanguageParser.TO_KW, 0)

        def DO_KW(self):
            return self.getToken(LanguageParser.DO_KW, 0)

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
        self.enterRule(localctx, 18, self.RULE_forStmt)
        try:
            self.enterOuterAlt(localctx, 1)
            self.state = 132
            self.match(LanguageParser.FOR_KW)
            self.state = 133
            self.match(LanguageParser.ID)
            self.state = 134
            self.match(LanguageParser.ASSIGN)
            self.state = 135
            self.expr()
            self.state = 136
            self.match(LanguageParser.TO_KW)
            self.state = 137
            self.expr()
            self.state = 138
            self.match(LanguageParser.DO_KW)
            self.state = 139
            self.block()
        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx


    class LvalueContext(ParserRuleContext):
        __slots__ = 'parser'

        def __init__(self, parser, parent:ParserRuleContext=None, invokingState:int=-1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def ID(self):
            return self.getToken(LanguageParser.ID, 0)

        def fieldAccess(self, i:int=None):
            if i is None:
                return self.getTypedRuleContexts(LanguageParser.FieldAccessContext)
            else:
                return self.getTypedRuleContext(LanguageParser.FieldAccessContext,i)


        def indexSuffix(self, i:int=None):
            if i is None:
                return self.getTypedRuleContexts(LanguageParser.IndexSuffixContext)
            else:
                return self.getTypedRuleContext(LanguageParser.IndexSuffixContext,i)


        def getRuleIndex(self):
            return LanguageParser.RULE_lvalue

        def enterRule(self, listener:ParseTreeListener):
            if hasattr( listener, "enterLvalue" ):
                listener.enterLvalue(self)

        def exitRule(self, listener:ParseTreeListener):
            if hasattr( listener, "exitLvalue" ):
                listener.exitLvalue(self)

        def accept(self, visitor:ParseTreeVisitor):
            if hasattr( visitor, "visitLvalue" ):
                return visitor.visitLvalue(self)
            else:
                return visitor.visitChildren(self)




    def lvalue(self):

        localctx = LanguageParser.LvalueContext(self, self._ctx, self.state)
        self.enterRule(localctx, 20, self.RULE_lvalue)
        self._la = 0 # Token type
        try:
            self.enterOuterAlt(localctx, 1)
            self.state = 141
            self.match(LanguageParser.ID)
            self.state = 146
            self._errHandler.sync(self)
            _la = self._input.LA(1)
            while _la==2 or _la==7:
                self.state = 144
                self._errHandler.sync(self)
                token = self._input.LA(1)
                if token in [2]:
                    self.state = 142
                    self.fieldAccess()
                    pass
                elif token in [7]:
                    self.state = 143
                    self.indexSuffix()
                    pass
                else:
                    raise NoViableAltException(self)

                self.state = 148
                self._errHandler.sync(self)
                _la = self._input.LA(1)

        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx


    class FieldAccessContext(ParserRuleContext):
        __slots__ = 'parser'

        def __init__(self, parser, parent:ParserRuleContext=None, invokingState:int=-1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def ID(self):
            return self.getToken(LanguageParser.ID, 0)

        def getRuleIndex(self):
            return LanguageParser.RULE_fieldAccess

        def enterRule(self, listener:ParseTreeListener):
            if hasattr( listener, "enterFieldAccess" ):
                listener.enterFieldAccess(self)

        def exitRule(self, listener:ParseTreeListener):
            if hasattr( listener, "exitFieldAccess" ):
                listener.exitFieldAccess(self)

        def accept(self, visitor:ParseTreeVisitor):
            if hasattr( visitor, "visitFieldAccess" ):
                return visitor.visitFieldAccess(self)
            else:
                return visitor.visitChildren(self)




    def fieldAccess(self):

        localctx = LanguageParser.FieldAccessContext(self, self._ctx, self.state)
        self.enterRule(localctx, 22, self.RULE_fieldAccess)
        try:
            self.enterOuterAlt(localctx, 1)
            self.state = 149
            self.match(LanguageParser.T__1)
            self.state = 150
            self.match(LanguageParser.ID)
        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx


    class IndexSuffixContext(ParserRuleContext):
        __slots__ = 'parser'

        def __init__(self, parser, parent:ParserRuleContext=None, invokingState:int=-1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def LBRACK(self):
            return self.getToken(LanguageParser.LBRACK, 0)

        def expr(self, i:int=None):
            if i is None:
                return self.getTypedRuleContexts(LanguageParser.ExprContext)
            else:
                return self.getTypedRuleContext(LanguageParser.ExprContext,i)


        def RBRACK(self):
            return self.getToken(LanguageParser.RBRACK, 0)

        def RANGE(self):
            return self.getToken(LanguageParser.RANGE, 0)

        def getRuleIndex(self):
            return LanguageParser.RULE_indexSuffix

        def enterRule(self, listener:ParseTreeListener):
            if hasattr( listener, "enterIndexSuffix" ):
                listener.enterIndexSuffix(self)

        def exitRule(self, listener:ParseTreeListener):
            if hasattr( listener, "exitIndexSuffix" ):
                listener.exitIndexSuffix(self)

        def accept(self, visitor:ParseTreeVisitor):
            if hasattr( visitor, "visitIndexSuffix" ):
                return visitor.visitIndexSuffix(self)
            else:
                return visitor.visitChildren(self)




    def indexSuffix(self):

        localctx = LanguageParser.IndexSuffixContext(self, self._ctx, self.state)
        self.enterRule(localctx, 24, self.RULE_indexSuffix)
        self._la = 0 # Token type
        try:
            self.enterOuterAlt(localctx, 1)
            self.state = 152
            self.match(LanguageParser.LBRACK)
            self.state = 153
            self.expr()
            self.state = 156
            self._errHandler.sync(self)
            _la = self._input.LA(1)
            if _la==9:
                self.state = 154
                self.match(LanguageParser.RANGE)
                self.state = 155
                self.expr()


            self.state = 158
            self.match(LanguageParser.RBRACK)
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

        def orExpr(self):
            return self.getTypedRuleContext(LanguageParser.OrExprContext,0)


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




    def expr(self):

        localctx = LanguageParser.ExprContext(self, self._ctx, self.state)
        self.enterRule(localctx, 26, self.RULE_expr)
        try:
            self.enterOuterAlt(localctx, 1)
            self.state = 160
            self.orExpr()
        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx


    class OrExprContext(ParserRuleContext):
        __slots__ = 'parser'

        def __init__(self, parser, parent:ParserRuleContext=None, invokingState:int=-1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def andExpr(self, i:int=None):
            if i is None:
                return self.getTypedRuleContexts(LanguageParser.AndExprContext)
            else:
                return self.getTypedRuleContext(LanguageParser.AndExprContext,i)


        def OR_KW(self, i:int=None):
            if i is None:
                return self.getTokens(LanguageParser.OR_KW)
            else:
                return self.getToken(LanguageParser.OR_KW, i)

        def getRuleIndex(self):
            return LanguageParser.RULE_orExpr

        def enterRule(self, listener:ParseTreeListener):
            if hasattr( listener, "enterOrExpr" ):
                listener.enterOrExpr(self)

        def exitRule(self, listener:ParseTreeListener):
            if hasattr( listener, "exitOrExpr" ):
                listener.exitOrExpr(self)

        def accept(self, visitor:ParseTreeVisitor):
            if hasattr( visitor, "visitOrExpr" ):
                return visitor.visitOrExpr(self)
            else:
                return visitor.visitChildren(self)




    def orExpr(self):

        localctx = LanguageParser.OrExprContext(self, self._ctx, self.state)
        self.enterRule(localctx, 28, self.RULE_orExpr)
        self._la = 0 # Token type
        try:
            self.enterOuterAlt(localctx, 1)
            self.state = 162
            self.andExpr()
            self.state = 167
            self._errHandler.sync(self)
            _la = self._input.LA(1)
            while _la==33:
                self.state = 163
                self.match(LanguageParser.OR_KW)
                self.state = 164
                self.andExpr()
                self.state = 169
                self._errHandler.sync(self)
                _la = self._input.LA(1)

        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx


    class AndExprContext(ParserRuleContext):
        __slots__ = 'parser'

        def __init__(self, parser, parent:ParserRuleContext=None, invokingState:int=-1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def relExpr(self, i:int=None):
            if i is None:
                return self.getTypedRuleContexts(LanguageParser.RelExprContext)
            else:
                return self.getTypedRuleContext(LanguageParser.RelExprContext,i)


        def AND_KW(self, i:int=None):
            if i is None:
                return self.getTokens(LanguageParser.AND_KW)
            else:
                return self.getToken(LanguageParser.AND_KW, i)

        def getRuleIndex(self):
            return LanguageParser.RULE_andExpr

        def enterRule(self, listener:ParseTreeListener):
            if hasattr( listener, "enterAndExpr" ):
                listener.enterAndExpr(self)

        def exitRule(self, listener:ParseTreeListener):
            if hasattr( listener, "exitAndExpr" ):
                listener.exitAndExpr(self)

        def accept(self, visitor:ParseTreeVisitor):
            if hasattr( visitor, "visitAndExpr" ):
                return visitor.visitAndExpr(self)
            else:
                return visitor.visitChildren(self)




    def andExpr(self):

        localctx = LanguageParser.AndExprContext(self, self._ctx, self.state)
        self.enterRule(localctx, 30, self.RULE_andExpr)
        self._la = 0 # Token type
        try:
            self.enterOuterAlt(localctx, 1)
            self.state = 170
            self.relExpr()
            self.state = 175
            self._errHandler.sync(self)
            _la = self._input.LA(1)
            while _la==32:
                self.state = 171
                self.match(LanguageParser.AND_KW)
                self.state = 172
                self.relExpr()
                self.state = 177
                self._errHandler.sync(self)
                _la = self._input.LA(1)

        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx


    class RelExprContext(ParserRuleContext):
        __slots__ = 'parser'

        def __init__(self, parser, parent:ParserRuleContext=None, invokingState:int=-1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def addExpr(self, i:int=None):
            if i is None:
                return self.getTypedRuleContexts(LanguageParser.AddExprContext)
            else:
                return self.getTypedRuleContext(LanguageParser.AddExprContext,i)


        def EQ(self, i:int=None):
            if i is None:
                return self.getTokens(LanguageParser.EQ)
            else:
                return self.getToken(LanguageParser.EQ, i)

        def NEQ(self, i:int=None):
            if i is None:
                return self.getTokens(LanguageParser.NEQ)
            else:
                return self.getToken(LanguageParser.NEQ, i)

        def LT(self, i:int=None):
            if i is None:
                return self.getTokens(LanguageParser.LT)
            else:
                return self.getToken(LanguageParser.LT, i)

        def LE(self, i:int=None):
            if i is None:
                return self.getTokens(LanguageParser.LE)
            else:
                return self.getToken(LanguageParser.LE, i)

        def GT(self, i:int=None):
            if i is None:
                return self.getTokens(LanguageParser.GT)
            else:
                return self.getToken(LanguageParser.GT, i)

        def GE(self, i:int=None):
            if i is None:
                return self.getTokens(LanguageParser.GE)
            else:
                return self.getToken(LanguageParser.GE, i)

        def getRuleIndex(self):
            return LanguageParser.RULE_relExpr

        def enterRule(self, listener:ParseTreeListener):
            if hasattr( listener, "enterRelExpr" ):
                listener.enterRelExpr(self)

        def exitRule(self, listener:ParseTreeListener):
            if hasattr( listener, "exitRelExpr" ):
                listener.exitRelExpr(self)

        def accept(self, visitor:ParseTreeVisitor):
            if hasattr( visitor, "visitRelExpr" ):
                return visitor.visitRelExpr(self)
            else:
                return visitor.visitChildren(self)




    def relExpr(self):

        localctx = LanguageParser.RelExprContext(self, self._ctx, self.state)
        self.enterRule(localctx, 32, self.RULE_relExpr)
        self._la = 0 # Token type
        try:
            self.enterOuterAlt(localctx, 1)
            self.state = 178
            self.addExpr()
            self.state = 183
            self._errHandler.sync(self)
            _la = self._input.LA(1)
            while (((_la) & ~0x3f) == 0 and ((1 << _la) & 4128768) != 0):
                self.state = 179
                _la = self._input.LA(1)
                if not((((_la) & ~0x3f) == 0 and ((1 << _la) & 4128768) != 0)):
                    self._errHandler.recoverInline(self)
                else:
                    self._errHandler.reportMatch(self)
                    self.consume()
                self.state = 180
                self.addExpr()
                self.state = 185
                self._errHandler.sync(self)
                _la = self._input.LA(1)

        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx


    class AddExprContext(ParserRuleContext):
        __slots__ = 'parser'

        def __init__(self, parser, parent:ParserRuleContext=None, invokingState:int=-1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def mulExpr(self, i:int=None):
            if i is None:
                return self.getTypedRuleContexts(LanguageParser.MulExprContext)
            else:
                return self.getTypedRuleContext(LanguageParser.MulExprContext,i)


        def PLUS(self, i:int=None):
            if i is None:
                return self.getTokens(LanguageParser.PLUS)
            else:
                return self.getToken(LanguageParser.PLUS, i)

        def MINUS(self, i:int=None):
            if i is None:
                return self.getTokens(LanguageParser.MINUS)
            else:
                return self.getToken(LanguageParser.MINUS, i)

        def getRuleIndex(self):
            return LanguageParser.RULE_addExpr

        def enterRule(self, listener:ParseTreeListener):
            if hasattr( listener, "enterAddExpr" ):
                listener.enterAddExpr(self)

        def exitRule(self, listener:ParseTreeListener):
            if hasattr( listener, "exitAddExpr" ):
                listener.exitAddExpr(self)

        def accept(self, visitor:ParseTreeVisitor):
            if hasattr( visitor, "visitAddExpr" ):
                return visitor.visitAddExpr(self)
            else:
                return visitor.visitChildren(self)




    def addExpr(self):

        localctx = LanguageParser.AddExprContext(self, self._ctx, self.state)
        self.enterRule(localctx, 34, self.RULE_addExpr)
        self._la = 0 # Token type
        try:
            self.enterOuterAlt(localctx, 1)
            self.state = 186
            self.mulExpr()
            self.state = 191
            self._errHandler.sync(self)
            _la = self._input.LA(1)
            while _la==12 or _la==13:
                self.state = 187
                _la = self._input.LA(1)
                if not(_la==12 or _la==13):
                    self._errHandler.recoverInline(self)
                else:
                    self._errHandler.reportMatch(self)
                    self.consume()
                self.state = 188
                self.mulExpr()
                self.state = 193
                self._errHandler.sync(self)
                _la = self._input.LA(1)

        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx


    class MulExprContext(ParserRuleContext):
        __slots__ = 'parser'

        def __init__(self, parser, parent:ParserRuleContext=None, invokingState:int=-1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def unaryExpr(self, i:int=None):
            if i is None:
                return self.getTypedRuleContexts(LanguageParser.UnaryExprContext)
            else:
                return self.getTypedRuleContext(LanguageParser.UnaryExprContext,i)


        def MUL(self, i:int=None):
            if i is None:
                return self.getTokens(LanguageParser.MUL)
            else:
                return self.getToken(LanguageParser.MUL, i)

        def DIV_KW(self, i:int=None):
            if i is None:
                return self.getTokens(LanguageParser.DIV_KW)
            else:
                return self.getToken(LanguageParser.DIV_KW, i)

        def MOD_KW(self, i:int=None):
            if i is None:
                return self.getTokens(LanguageParser.MOD_KW)
            else:
                return self.getToken(LanguageParser.MOD_KW, i)

        def DIVOP(self, i:int=None):
            if i is None:
                return self.getTokens(LanguageParser.DIVOP)
            else:
                return self.getToken(LanguageParser.DIVOP, i)

        def getRuleIndex(self):
            return LanguageParser.RULE_mulExpr

        def enterRule(self, listener:ParseTreeListener):
            if hasattr( listener, "enterMulExpr" ):
                listener.enterMulExpr(self)

        def exitRule(self, listener:ParseTreeListener):
            if hasattr( listener, "exitMulExpr" ):
                listener.exitMulExpr(self)

        def accept(self, visitor:ParseTreeVisitor):
            if hasattr( visitor, "visitMulExpr" ):
                return visitor.visitMulExpr(self)
            else:
                return visitor.visitChildren(self)




    def mulExpr(self):

        localctx = LanguageParser.MulExprContext(self, self._ctx, self.state)
        self.enterRule(localctx, 36, self.RULE_mulExpr)
        self._la = 0 # Token type
        try:
            self.enterOuterAlt(localctx, 1)
            self.state = 194
            self.unaryExpr()
            self.state = 199
            self._errHandler.sync(self)
            _la = self._input.LA(1)
            while (((_la) & ~0x3f) == 0 and ((1 << _la) & 1649267490816) != 0):
                self.state = 195
                _la = self._input.LA(1)
                if not((((_la) & ~0x3f) == 0 and ((1 << _la) & 1649267490816) != 0)):
                    self._errHandler.recoverInline(self)
                else:
                    self._errHandler.reportMatch(self)
                    self.consume()
                self.state = 196
                self.unaryExpr()
                self.state = 201
                self._errHandler.sync(self)
                _la = self._input.LA(1)

        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx


    class UnaryExprContext(ParserRuleContext):
        __slots__ = 'parser'

        def __init__(self, parser, parent:ParserRuleContext=None, invokingState:int=-1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def NOT_KW(self):
            return self.getToken(LanguageParser.NOT_KW, 0)

        def unaryExpr(self):
            return self.getTypedRuleContext(LanguageParser.UnaryExprContext,0)


        def MINUS(self):
            return self.getToken(LanguageParser.MINUS, 0)

        def primary(self):
            return self.getTypedRuleContext(LanguageParser.PrimaryContext,0)


        def getRuleIndex(self):
            return LanguageParser.RULE_unaryExpr

        def enterRule(self, listener:ParseTreeListener):
            if hasattr( listener, "enterUnaryExpr" ):
                listener.enterUnaryExpr(self)

        def exitRule(self, listener:ParseTreeListener):
            if hasattr( listener, "exitUnaryExpr" ):
                listener.exitUnaryExpr(self)

        def accept(self, visitor:ParseTreeVisitor):
            if hasattr( visitor, "visitUnaryExpr" ):
                return visitor.visitUnaryExpr(self)
            else:
                return visitor.visitChildren(self)




    def unaryExpr(self):

        localctx = LanguageParser.UnaryExprContext(self, self._ctx, self.state)
        self.enterRule(localctx, 38, self.RULE_unaryExpr)
        try:
            self.state = 207
            self._errHandler.sync(self)
            token = self._input.LA(1)
            if token in [34]:
                self.enterOuterAlt(localctx, 1)
                self.state = 202
                self.match(LanguageParser.NOT_KW)
                self.state = 203
                self.unaryExpr()
                pass
            elif token in [13]:
                self.enterOuterAlt(localctx, 2)
                self.state = 204
                self.match(LanguageParser.MINUS)
                self.state = 205
                self.unaryExpr()
                pass
            elif token in [3, 35, 36, 37, 38, 41, 42]:
                self.enterOuterAlt(localctx, 3)
                self.state = 206
                self.primary()
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


    class PrimaryContext(ParserRuleContext):
        __slots__ = 'parser'

        def __init__(self, parser, parent:ParserRuleContext=None, invokingState:int=-1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def INT(self):
            return self.getToken(LanguageParser.INT, 0)

        def TRUE_KW(self):
            return self.getToken(LanguageParser.TRUE_KW, 0)

        def FALSE_KW(self):
            return self.getToken(LanguageParser.FALSE_KW, 0)

        def NULL_KW(self):
            return self.getToken(LanguageParser.NULL_KW, 0)

        def lengthCall(self):
            return self.getTypedRuleContext(LanguageParser.LengthCallContext,0)


        def callExpr(self):
            return self.getTypedRuleContext(LanguageParser.CallExprContext,0)


        def lvalue(self):
            return self.getTypedRuleContext(LanguageParser.LvalueContext,0)


        def LPAREN(self):
            return self.getToken(LanguageParser.LPAREN, 0)

        def expr(self):
            return self.getTypedRuleContext(LanguageParser.ExprContext,0)


        def RPAREN(self):
            return self.getToken(LanguageParser.RPAREN, 0)

        def getRuleIndex(self):
            return LanguageParser.RULE_primary

        def enterRule(self, listener:ParseTreeListener):
            if hasattr( listener, "enterPrimary" ):
                listener.enterPrimary(self)

        def exitRule(self, listener:ParseTreeListener):
            if hasattr( listener, "exitPrimary" ):
                listener.exitPrimary(self)

        def accept(self, visitor:ParseTreeVisitor):
            if hasattr( visitor, "visitPrimary" ):
                return visitor.visitPrimary(self)
            else:
                return visitor.visitChildren(self)




    def primary(self):

        localctx = LanguageParser.PrimaryContext(self, self._ctx, self.state)
        self.enterRule(localctx, 40, self.RULE_primary)
        try:
            self.state = 220
            self._errHandler.sync(self)
            la_ = self._interp.adaptivePredict(self._input,21,self._ctx)
            if la_ == 1:
                self.enterOuterAlt(localctx, 1)
                self.state = 209
                self.match(LanguageParser.INT)
                pass

            elif la_ == 2:
                self.enterOuterAlt(localctx, 2)
                self.state = 210
                self.match(LanguageParser.TRUE_KW)
                pass

            elif la_ == 3:
                self.enterOuterAlt(localctx, 3)
                self.state = 211
                self.match(LanguageParser.FALSE_KW)
                pass

            elif la_ == 4:
                self.enterOuterAlt(localctx, 4)
                self.state = 212
                self.match(LanguageParser.NULL_KW)
                pass

            elif la_ == 5:
                self.enterOuterAlt(localctx, 5)
                self.state = 213
                self.lengthCall()
                pass

            elif la_ == 6:
                self.enterOuterAlt(localctx, 6)
                self.state = 214
                self.callExpr()
                pass

            elif la_ == 7:
                self.enterOuterAlt(localctx, 7)
                self.state = 215
                self.lvalue()
                pass

            elif la_ == 8:
                self.enterOuterAlt(localctx, 8)
                self.state = 216
                self.match(LanguageParser.LPAREN)
                self.state = 217
                self.expr()
                self.state = 218
                self.match(LanguageParser.RPAREN)
                pass


        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx


    class LengthCallContext(ParserRuleContext):
        __slots__ = 'parser'

        def __init__(self, parser, parent:ParserRuleContext=None, invokingState:int=-1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def LENGTH_KW(self):
            return self.getToken(LanguageParser.LENGTH_KW, 0)

        def LPAREN(self):
            return self.getToken(LanguageParser.LPAREN, 0)

        def expr(self):
            return self.getTypedRuleContext(LanguageParser.ExprContext,0)


        def RPAREN(self):
            return self.getToken(LanguageParser.RPAREN, 0)

        def getRuleIndex(self):
            return LanguageParser.RULE_lengthCall

        def enterRule(self, listener:ParseTreeListener):
            if hasattr( listener, "enterLengthCall" ):
                listener.enterLengthCall(self)

        def exitRule(self, listener:ParseTreeListener):
            if hasattr( listener, "exitLengthCall" ):
                listener.exitLengthCall(self)

        def accept(self, visitor:ParseTreeVisitor):
            if hasattr( visitor, "visitLengthCall" ):
                return visitor.visitLengthCall(self)
            else:
                return visitor.visitChildren(self)




    def lengthCall(self):

        localctx = LanguageParser.LengthCallContext(self, self._ctx, self.state)
        self.enterRule(localctx, 42, self.RULE_lengthCall)
        try:
            self.enterOuterAlt(localctx, 1)
            self.state = 222
            self.match(LanguageParser.LENGTH_KW)
            self.state = 223
            self.match(LanguageParser.LPAREN)
            self.state = 224
            self.expr()
            self.state = 225
            self.match(LanguageParser.RPAREN)
        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx


    class CallExprContext(ParserRuleContext):
        __slots__ = 'parser'

        def __init__(self, parser, parent:ParserRuleContext=None, invokingState:int=-1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def ID(self):
            return self.getToken(LanguageParser.ID, 0)

        def LPAREN(self):
            return self.getToken(LanguageParser.LPAREN, 0)

        def RPAREN(self):
            return self.getToken(LanguageParser.RPAREN, 0)

        def argList(self):
            return self.getTypedRuleContext(LanguageParser.ArgListContext,0)


        def getRuleIndex(self):
            return LanguageParser.RULE_callExpr

        def enterRule(self, listener:ParseTreeListener):
            if hasattr( listener, "enterCallExpr" ):
                listener.enterCallExpr(self)

        def exitRule(self, listener:ParseTreeListener):
            if hasattr( listener, "exitCallExpr" ):
                listener.exitCallExpr(self)

        def accept(self, visitor:ParseTreeVisitor):
            if hasattr( visitor, "visitCallExpr" ):
                return visitor.visitCallExpr(self)
            else:
                return visitor.visitChildren(self)




    def callExpr(self):

        localctx = LanguageParser.CallExprContext(self, self._ctx, self.state)
        self.enterRule(localctx, 44, self.RULE_callExpr)
        self._la = 0 # Token type
        try:
            self.enterOuterAlt(localctx, 1)
            self.state = 227
            self.match(LanguageParser.ID)
            self.state = 228
            self.match(LanguageParser.LPAREN)
            self.state = 230
            self._errHandler.sync(self)
            _la = self._input.LA(1)
            if (((_la) & ~0x3f) == 0 and ((1 << _la) & 7129645719560) != 0):
                self.state = 229
                self.argList()


            self.state = 232
            self.match(LanguageParser.RPAREN)
        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx





