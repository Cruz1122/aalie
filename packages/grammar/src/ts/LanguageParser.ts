// Generated from grammar/Language.g4 by ANTLR 4.9.0-SNAPSHOT


import { ATN } from "antlr4ts/atn/ATN";
import { ATNDeserializer } from "antlr4ts/atn/ATNDeserializer";
import { FailedPredicateException } from "antlr4ts/FailedPredicateException";
import { NotNull } from "antlr4ts/Decorators";
import { NoViableAltException } from "antlr4ts/NoViableAltException";
import { Override } from "antlr4ts/Decorators";
import { Parser } from "antlr4ts/Parser";
import { ParserRuleContext } from "antlr4ts/ParserRuleContext";
import { ParserATNSimulator } from "antlr4ts/atn/ParserATNSimulator";
import { ParseTreeListener } from "antlr4ts/tree/ParseTreeListener";
import { ParseTreeVisitor } from "antlr4ts/tree/ParseTreeVisitor";
import { RecognitionException } from "antlr4ts/RecognitionException";
import { RuleContext } from "antlr4ts/RuleContext";
//import { RuleVersion } from "antlr4ts/RuleVersion";
import { TerminalNode } from "antlr4ts/tree/TerminalNode";
import { Token } from "antlr4ts/Token";
import { TokenStream } from "antlr4ts/TokenStream";
import { Vocabulary } from "antlr4ts/Vocabulary";
import { VocabularyImpl } from "antlr4ts/VocabularyImpl";

import * as Utils from "antlr4ts/misc/Utils";

import { LanguageListener } from "./LanguageListener";
import { LanguageVisitor } from "./LanguageVisitor";


export class LanguageParser extends Parser {
	public static readonly T__0 = 1;
	public static readonly T__1 = 2;
	public static readonly LPAREN = 3;
	public static readonly RPAREN = 4;
	public static readonly LBRACE = 5;
	public static readonly RBRACE = 6;
	public static readonly LBRACK = 7;
	public static readonly RBRACK = 8;
	public static readonly RANGE = 9;
	public static readonly SEMI = 10;
	public static readonly ASSIGN = 11;
	public static readonly PLUS = 12;
	public static readonly MINUS = 13;
	public static readonly MUL = 14;
	public static readonly DIVOP = 15;
	public static readonly EQ = 16;
	public static readonly NEQ = 17;
	public static readonly LE = 18;
	public static readonly GE = 19;
	public static readonly LT = 20;
	public static readonly GT = 21;
	public static readonly FOR_KW = 22;
	public static readonly WHILE_KW = 23;
	public static readonly IF_KW = 24;
	public static readonly THEN_KW = 25;
	public static readonly ELSE_KW = 26;
	public static readonly BEGIN_KW = 27;
	public static readonly END_KW = 28;
	public static readonly TO_KW = 29;
	public static readonly DO_KW = 30;
	public static readonly CALL_KW = 31;
	public static readonly AND_KW = 32;
	public static readonly OR_KW = 33;
	public static readonly NOT_KW = 34;
	public static readonly TRUE_KW = 35;
	public static readonly FALSE_KW = 36;
	public static readonly NULL_KW = 37;
	public static readonly LENGTH_KW = 38;
	public static readonly DIV_KW = 39;
	public static readonly MOD_KW = 40;
	public static readonly STRING = 41;
	public static readonly CLASS_KW = 42;
	public static readonly RETURN_KW = 43;
	public static readonly REPEAT_KW = 44;
	public static readonly UNTIL_KW = 45;
	public static readonly PRINT_KW = 46;
	public static readonly ID = 47;
	public static readonly INT = 48;
	public static readonly WS = 49;
	public static readonly LINE_COMMENT = 50;
	public static readonly SL_COMMENT = 51;
	public static readonly RULE_program = 0;
	public static readonly RULE_classDef = 1;
	public static readonly RULE_attrList = 2;
	public static readonly RULE_procDef = 3;
	public static readonly RULE_paramList = 4;
	public static readonly RULE_param = 5;
	public static readonly RULE_arrayParam = 6;
	public static readonly RULE_arrayIndex = 7;
	public static readonly RULE_arrayDim = 8;
	public static readonly RULE_objectParam = 9;
	public static readonly RULE_stmt = 10;
	public static readonly RULE_block = 11;
	public static readonly RULE_assignmentStmt = 12;
	public static readonly RULE_declVectorStmt = 13;
	public static readonly RULE_callStmt = 14;
	public static readonly RULE_printStmt = 15;
	public static readonly RULE_argList = 16;
	public static readonly RULE_repeatStmt = 17;
	public static readonly RULE_returnStmt = 18;
	public static readonly RULE_ifStmt = 19;
	public static readonly RULE_whileStmt = 20;
	public static readonly RULE_forStmt = 21;
	public static readonly RULE_lvalue = 22;
	public static readonly RULE_fieldAccess = 23;
	public static readonly RULE_indexSuffix = 24;
	public static readonly RULE_expr = 25;
	public static readonly RULE_orExpr = 26;
	public static readonly RULE_andExpr = 27;
	public static readonly RULE_relExpr = 28;
	public static readonly RULE_addExpr = 29;
	public static readonly RULE_mulExpr = 30;
	public static readonly RULE_unaryExpr = 31;
	public static readonly RULE_primary = 32;
	public static readonly RULE_lengthCall = 33;
	public static readonly RULE_callExpr = 34;
	// tslint:disable:no-trailing-whitespace
	public static readonly ruleNames: string[] = [
		"program", "classDef", "attrList", "procDef", "paramList", "param", "arrayParam", 
		"arrayIndex", "arrayDim", "objectParam", "stmt", "block", "assignmentStmt", 
		"declVectorStmt", "callStmt", "printStmt", "argList", "repeatStmt", "returnStmt", 
		"ifStmt", "whileStmt", "forStmt", "lvalue", "fieldAccess", "indexSuffix", 
		"expr", "orExpr", "andExpr", "relExpr", "addExpr", "mulExpr", "unaryExpr", 
		"primary", "lengthCall", "callExpr",
	];

	private static readonly _LITERAL_NAMES: Array<string | undefined> = [
		undefined, "','", "'.'", "'('", "')'", "'{'", "'}'", "'['", "']'", "'..'", 
		"';'", undefined, "'+'", "'-'", "'*'", "'/'", "'='", undefined, undefined, 
		undefined, "'<'", "'>'",
	];
	private static readonly _SYMBOLIC_NAMES: Array<string | undefined> = [
		undefined, undefined, undefined, "LPAREN", "RPAREN", "LBRACE", "RBRACE", 
		"LBRACK", "RBRACK", "RANGE", "SEMI", "ASSIGN", "PLUS", "MINUS", "MUL", 
		"DIVOP", "EQ", "NEQ", "LE", "GE", "LT", "GT", "FOR_KW", "WHILE_KW", "IF_KW", 
		"THEN_KW", "ELSE_KW", "BEGIN_KW", "END_KW", "TO_KW", "DO_KW", "CALL_KW", 
		"AND_KW", "OR_KW", "NOT_KW", "TRUE_KW", "FALSE_KW", "NULL_KW", "LENGTH_KW", 
		"DIV_KW", "MOD_KW", "STRING", "CLASS_KW", "RETURN_KW", "REPEAT_KW", "UNTIL_KW", 
		"PRINT_KW", "ID", "INT", "WS", "LINE_COMMENT", "SL_COMMENT",
	];
	public static readonly VOCABULARY: Vocabulary = new VocabularyImpl(LanguageParser._LITERAL_NAMES, LanguageParser._SYMBOLIC_NAMES, []);

	// @Override
	// @NotNull
	public get vocabulary(): Vocabulary {
		return LanguageParser.VOCABULARY;
	}
	// tslint:enable:no-trailing-whitespace

	// @Override
	public get grammarFileName(): string { return "Language.g4"; }

	// @Override
	public get ruleNames(): string[] { return LanguageParser.ruleNames; }

	// @Override
	public get serializedATN(): string { return LanguageParser._serializedATN; }

	protected createFailedPredicateException(predicate?: string, message?: string): FailedPredicateException {
		return new FailedPredicateException(this, predicate, message);
	}

	constructor(input: TokenStream) {
		super(input);
		this._interp = new ParserATNSimulator(LanguageParser._ATN, this);
	}
	// @RuleVersion(0)
	public program(): ProgramContext {
		let _localctx: ProgramContext = new ProgramContext(this._ctx, this.state);
		this.enterRule(_localctx, 0, LanguageParser.RULE_program);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 73;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === LanguageParser.CLASS_KW) {
				{
				{
				this.state = 70;
				this.classDef();
				}
				}
				this.state = 75;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 80;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while ((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << LanguageParser.LBRACE) | (1 << LanguageParser.SEMI) | (1 << LanguageParser.FOR_KW) | (1 << LanguageParser.WHILE_KW) | (1 << LanguageParser.IF_KW) | (1 << LanguageParser.BEGIN_KW) | (1 << LanguageParser.CALL_KW))) !== 0) || ((((_la - 43)) & ~0x1F) === 0 && ((1 << (_la - 43)) & ((1 << (LanguageParser.RETURN_KW - 43)) | (1 << (LanguageParser.REPEAT_KW - 43)) | (1 << (LanguageParser.PRINT_KW - 43)) | (1 << (LanguageParser.ID - 43)))) !== 0)) {
				{
				this.state = 78;
				this._errHandler.sync(this);
				switch ( this.interpreter.adaptivePredict(this._input, 1, this._ctx) ) {
				case 1:
					{
					this.state = 76;
					this.procDef();
					}
					break;

				case 2:
					{
					this.state = 77;
					this.stmt();
					}
					break;
				}
				}
				this.state = 82;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 83;
			this.match(LanguageParser.EOF);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public classDef(): ClassDefContext {
		let _localctx: ClassDefContext = new ClassDefContext(this._ctx, this.state);
		this.enterRule(_localctx, 2, LanguageParser.RULE_classDef);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 85;
			this.match(LanguageParser.CLASS_KW);
			this.state = 86;
			this.match(LanguageParser.ID);
			this.state = 87;
			this.match(LanguageParser.LBRACE);
			this.state = 89;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === LanguageParser.ID) {
				{
				this.state = 88;
				this.attrList();
				}
			}

			this.state = 91;
			this.match(LanguageParser.RBRACE);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public attrList(): AttrListContext {
		let _localctx: AttrListContext = new AttrListContext(this._ctx, this.state);
		this.enterRule(_localctx, 4, LanguageParser.RULE_attrList);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 94;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			do {
				{
				{
				this.state = 93;
				this.match(LanguageParser.ID);
				}
				}
				this.state = 96;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			} while (_la === LanguageParser.ID);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public procDef(): ProcDefContext {
		let _localctx: ProcDefContext = new ProcDefContext(this._ctx, this.state);
		this.enterRule(_localctx, 6, LanguageParser.RULE_procDef);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 98;
			this.match(LanguageParser.ID);
			this.state = 99;
			this.match(LanguageParser.LPAREN);
			this.state = 101;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === LanguageParser.ID) {
				{
				this.state = 100;
				this.paramList();
				}
			}

			this.state = 103;
			this.match(LanguageParser.RPAREN);
			this.state = 104;
			this.block();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public paramList(): ParamListContext {
		let _localctx: ParamListContext = new ParamListContext(this._ctx, this.state);
		this.enterRule(_localctx, 8, LanguageParser.RULE_paramList);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 106;
			this.param();
			this.state = 111;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === LanguageParser.T__0) {
				{
				{
				this.state = 107;
				this.match(LanguageParser.T__0);
				this.state = 108;
				this.param();
				}
				}
				this.state = 113;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public param(): ParamContext {
		let _localctx: ParamContext = new ParamContext(this._ctx, this.state);
		this.enterRule(_localctx, 10, LanguageParser.RULE_param);
		try {
			this.state = 117;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 7, this._ctx) ) {
			case 1:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 114;
				this.arrayParam();
				}
				break;

			case 2:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 115;
				this.objectParam();
				}
				break;

			case 3:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 116;
				this.match(LanguageParser.ID);
				}
				break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public arrayParam(): ArrayParamContext {
		let _localctx: ArrayParamContext = new ArrayParamContext(this._ctx, this.state);
		this.enterRule(_localctx, 12, LanguageParser.RULE_arrayParam);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 119;
			this.match(LanguageParser.ID);
			this.state = 120;
			this.match(LanguageParser.LBRACK);
			this.state = 121;
			this.arrayIndex();
			this.state = 122;
			this.match(LanguageParser.RBRACK);
			this.state = 128;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === LanguageParser.RANGE) {
				{
				this.state = 123;
				this.match(LanguageParser.RANGE);
				this.state = 124;
				this.match(LanguageParser.LBRACK);
				this.state = 125;
				this.arrayIndex();
				this.state = 126;
				this.match(LanguageParser.RBRACK);
				}
			}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public arrayIndex(): ArrayIndexContext {
		let _localctx: ArrayIndexContext = new ArrayIndexContext(this._ctx, this.state);
		this.enterRule(_localctx, 14, LanguageParser.RULE_arrayIndex);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 130;
			_la = this._input.LA(1);
			if (!(_la === LanguageParser.ID || _la === LanguageParser.INT)) {
			this._errHandler.recoverInline(this);
			} else {
				if (this._input.LA(1) === Token.EOF) {
					this.matchedEOF = true;
				}

				this._errHandler.reportMatch(this);
				this.consume();
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public arrayDim(): ArrayDimContext {
		let _localctx: ArrayDimContext = new ArrayDimContext(this._ctx, this.state);
		this.enterRule(_localctx, 16, LanguageParser.RULE_arrayDim);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 132;
			this.match(LanguageParser.LBRACK);
			this.state = 133;
			_la = this._input.LA(1);
			if (!(_la === LanguageParser.ID || _la === LanguageParser.INT)) {
			this._errHandler.recoverInline(this);
			} else {
				if (this._input.LA(1) === Token.EOF) {
					this.matchedEOF = true;
				}

				this._errHandler.reportMatch(this);
				this.consume();
			}
			this.state = 134;
			this.match(LanguageParser.RBRACK);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public objectParam(): ObjectParamContext {
		let _localctx: ObjectParamContext = new ObjectParamContext(this._ctx, this.state);
		this.enterRule(_localctx, 18, LanguageParser.RULE_objectParam);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 136;
			this.match(LanguageParser.ID);
			this.state = 137;
			this.match(LanguageParser.ID);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public stmt(): StmtContext {
		let _localctx: StmtContext = new StmtContext(this._ctx, this.state);
		this.enterRule(_localctx, 20, LanguageParser.RULE_stmt);
		try {
			this.state = 150;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 9, this._ctx) ) {
			case 1:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 139;
				this.assignmentStmt();
				}
				break;

			case 2:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 140;
				this.callStmt();
				}
				break;

			case 3:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 141;
				this.printStmt();
				}
				break;

			case 4:
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 142;
				this.ifStmt();
				}
				break;

			case 5:
				this.enterOuterAlt(_localctx, 5);
				{
				this.state = 143;
				this.whileStmt();
				}
				break;

			case 6:
				this.enterOuterAlt(_localctx, 6);
				{
				this.state = 144;
				this.repeatStmt();
				}
				break;

			case 7:
				this.enterOuterAlt(_localctx, 7);
				{
				this.state = 145;
				this.forStmt();
				}
				break;

			case 8:
				this.enterOuterAlt(_localctx, 8);
				{
				this.state = 146;
				this.returnStmt();
				}
				break;

			case 9:
				this.enterOuterAlt(_localctx, 9);
				{
				this.state = 147;
				this.block();
				}
				break;

			case 10:
				this.enterOuterAlt(_localctx, 10);
				{
				this.state = 148;
				this.declVectorStmt();
				}
				break;

			case 11:
				this.enterOuterAlt(_localctx, 11);
				{
				this.state = 149;
				this.match(LanguageParser.SEMI);
				}
				break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public block(): BlockContext {
		let _localctx: BlockContext = new BlockContext(this._ctx, this.state);
		this.enterRule(_localctx, 22, LanguageParser.RULE_block);
		let _la: number;
		try {
			this.state = 168;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case LanguageParser.LBRACE:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 152;
				this.match(LanguageParser.LBRACE);
				this.state = 156;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while ((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << LanguageParser.LBRACE) | (1 << LanguageParser.SEMI) | (1 << LanguageParser.FOR_KW) | (1 << LanguageParser.WHILE_KW) | (1 << LanguageParser.IF_KW) | (1 << LanguageParser.BEGIN_KW) | (1 << LanguageParser.CALL_KW))) !== 0) || ((((_la - 43)) & ~0x1F) === 0 && ((1 << (_la - 43)) & ((1 << (LanguageParser.RETURN_KW - 43)) | (1 << (LanguageParser.REPEAT_KW - 43)) | (1 << (LanguageParser.PRINT_KW - 43)) | (1 << (LanguageParser.ID - 43)))) !== 0)) {
					{
					{
					this.state = 153;
					this.stmt();
					}
					}
					this.state = 158;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				this.state = 159;
				this.match(LanguageParser.RBRACE);
				}
				break;
			case LanguageParser.BEGIN_KW:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 160;
				this.match(LanguageParser.BEGIN_KW);
				this.state = 164;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while ((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << LanguageParser.LBRACE) | (1 << LanguageParser.SEMI) | (1 << LanguageParser.FOR_KW) | (1 << LanguageParser.WHILE_KW) | (1 << LanguageParser.IF_KW) | (1 << LanguageParser.BEGIN_KW) | (1 << LanguageParser.CALL_KW))) !== 0) || ((((_la - 43)) & ~0x1F) === 0 && ((1 << (_la - 43)) & ((1 << (LanguageParser.RETURN_KW - 43)) | (1 << (LanguageParser.REPEAT_KW - 43)) | (1 << (LanguageParser.PRINT_KW - 43)) | (1 << (LanguageParser.ID - 43)))) !== 0)) {
					{
					{
					this.state = 161;
					this.stmt();
					}
					}
					this.state = 166;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				this.state = 167;
				this.match(LanguageParser.END_KW);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public assignmentStmt(): AssignmentStmtContext {
		let _localctx: AssignmentStmtContext = new AssignmentStmtContext(this._ctx, this.state);
		this.enterRule(_localctx, 24, LanguageParser.RULE_assignmentStmt);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 170;
			this.lvalue();
			this.state = 171;
			this.match(LanguageParser.ASSIGN);
			this.state = 172;
			this.expr();
			this.state = 174;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 13, this._ctx) ) {
			case 1:
				{
				this.state = 173;
				this.match(LanguageParser.SEMI);
				}
				break;
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public declVectorStmt(): DeclVectorStmtContext {
		let _localctx: DeclVectorStmtContext = new DeclVectorStmtContext(this._ctx, this.state);
		this.enterRule(_localctx, 26, LanguageParser.RULE_declVectorStmt);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 176;
			this.match(LanguageParser.ID);
			this.state = 178;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			do {
				{
				{
				this.state = 177;
				this.indexSuffix();
				}
				}
				this.state = 180;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			} while (_la === LanguageParser.LBRACK);
			this.state = 183;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 15, this._ctx) ) {
			case 1:
				{
				this.state = 182;
				this.match(LanguageParser.SEMI);
				}
				break;
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public callStmt(): CallStmtContext {
		let _localctx: CallStmtContext = new CallStmtContext(this._ctx, this.state);
		this.enterRule(_localctx, 28, LanguageParser.RULE_callStmt);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 185;
			this.match(LanguageParser.CALL_KW);
			this.state = 186;
			this.match(LanguageParser.ID);
			this.state = 187;
			this.match(LanguageParser.LPAREN);
			this.state = 189;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === LanguageParser.LPAREN || _la === LanguageParser.MINUS || ((((_la - 34)) & ~0x1F) === 0 && ((1 << (_la - 34)) & ((1 << (LanguageParser.NOT_KW - 34)) | (1 << (LanguageParser.TRUE_KW - 34)) | (1 << (LanguageParser.FALSE_KW - 34)) | (1 << (LanguageParser.NULL_KW - 34)) | (1 << (LanguageParser.LENGTH_KW - 34)) | (1 << (LanguageParser.STRING - 34)) | (1 << (LanguageParser.ID - 34)) | (1 << (LanguageParser.INT - 34)))) !== 0)) {
				{
				this.state = 188;
				this.argList();
				}
			}

			this.state = 191;
			this.match(LanguageParser.RPAREN);
			this.state = 193;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 17, this._ctx) ) {
			case 1:
				{
				this.state = 192;
				this.match(LanguageParser.SEMI);
				}
				break;
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public printStmt(): PrintStmtContext {
		let _localctx: PrintStmtContext = new PrintStmtContext(this._ctx, this.state);
		this.enterRule(_localctx, 30, LanguageParser.RULE_printStmt);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 195;
			this.match(LanguageParser.PRINT_KW);
			this.state = 196;
			this.match(LanguageParser.LPAREN);
			this.state = 198;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === LanguageParser.LPAREN || _la === LanguageParser.MINUS || ((((_la - 34)) & ~0x1F) === 0 && ((1 << (_la - 34)) & ((1 << (LanguageParser.NOT_KW - 34)) | (1 << (LanguageParser.TRUE_KW - 34)) | (1 << (LanguageParser.FALSE_KW - 34)) | (1 << (LanguageParser.NULL_KW - 34)) | (1 << (LanguageParser.LENGTH_KW - 34)) | (1 << (LanguageParser.STRING - 34)) | (1 << (LanguageParser.ID - 34)) | (1 << (LanguageParser.INT - 34)))) !== 0)) {
				{
				this.state = 197;
				this.argList();
				}
			}

			this.state = 200;
			this.match(LanguageParser.RPAREN);
			this.state = 202;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 19, this._ctx) ) {
			case 1:
				{
				this.state = 201;
				this.match(LanguageParser.SEMI);
				}
				break;
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public argList(): ArgListContext {
		let _localctx: ArgListContext = new ArgListContext(this._ctx, this.state);
		this.enterRule(_localctx, 32, LanguageParser.RULE_argList);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 204;
			this.expr();
			this.state = 209;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === LanguageParser.T__0) {
				{
				{
				this.state = 205;
				this.match(LanguageParser.T__0);
				this.state = 206;
				this.expr();
				}
				}
				this.state = 211;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public repeatStmt(): RepeatStmtContext {
		let _localctx: RepeatStmtContext = new RepeatStmtContext(this._ctx, this.state);
		this.enterRule(_localctx, 34, LanguageParser.RULE_repeatStmt);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 212;
			this.match(LanguageParser.REPEAT_KW);
			this.state = 214;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			do {
				{
				{
				this.state = 213;
				this.stmt();
				}
				}
				this.state = 216;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			} while ((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << LanguageParser.LBRACE) | (1 << LanguageParser.SEMI) | (1 << LanguageParser.FOR_KW) | (1 << LanguageParser.WHILE_KW) | (1 << LanguageParser.IF_KW) | (1 << LanguageParser.BEGIN_KW) | (1 << LanguageParser.CALL_KW))) !== 0) || ((((_la - 43)) & ~0x1F) === 0 && ((1 << (_la - 43)) & ((1 << (LanguageParser.RETURN_KW - 43)) | (1 << (LanguageParser.REPEAT_KW - 43)) | (1 << (LanguageParser.PRINT_KW - 43)) | (1 << (LanguageParser.ID - 43)))) !== 0));
			this.state = 218;
			this.match(LanguageParser.UNTIL_KW);
			this.state = 219;
			this.match(LanguageParser.LPAREN);
			this.state = 220;
			this.expr();
			this.state = 221;
			this.match(LanguageParser.RPAREN);
			this.state = 223;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 22, this._ctx) ) {
			case 1:
				{
				this.state = 222;
				this.match(LanguageParser.SEMI);
				}
				break;
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public returnStmt(): ReturnStmtContext {
		let _localctx: ReturnStmtContext = new ReturnStmtContext(this._ctx, this.state);
		this.enterRule(_localctx, 36, LanguageParser.RULE_returnStmt);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 225;
			this.match(LanguageParser.RETURN_KW);
			this.state = 226;
			this.expr();
			this.state = 227;
			this.match(LanguageParser.SEMI);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public ifStmt(): IfStmtContext {
		let _localctx: IfStmtContext = new IfStmtContext(this._ctx, this.state);
		this.enterRule(_localctx, 38, LanguageParser.RULE_ifStmt);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 229;
			this.match(LanguageParser.IF_KW);
			this.state = 230;
			this.match(LanguageParser.LPAREN);
			this.state = 231;
			this.expr();
			this.state = 232;
			this.match(LanguageParser.RPAREN);
			this.state = 233;
			this.match(LanguageParser.THEN_KW);
			this.state = 234;
			this.block();
			this.state = 240;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === LanguageParser.ELSE_KW) {
				{
				this.state = 235;
				this.match(LanguageParser.ELSE_KW);
				this.state = 238;
				this._errHandler.sync(this);
				switch (this._input.LA(1)) {
				case LanguageParser.IF_KW:
					{
					this.state = 236;
					this.ifStmt();
					}
					break;
				case LanguageParser.LBRACE:
				case LanguageParser.BEGIN_KW:
					{
					this.state = 237;
					this.block();
					}
					break;
				default:
					throw new NoViableAltException(this);
				}
				}
			}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public whileStmt(): WhileStmtContext {
		let _localctx: WhileStmtContext = new WhileStmtContext(this._ctx, this.state);
		this.enterRule(_localctx, 40, LanguageParser.RULE_whileStmt);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 242;
			this.match(LanguageParser.WHILE_KW);
			this.state = 243;
			this.match(LanguageParser.LPAREN);
			this.state = 244;
			this.expr();
			this.state = 245;
			this.match(LanguageParser.RPAREN);
			this.state = 246;
			this.match(LanguageParser.DO_KW);
			this.state = 247;
			this.block();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public forStmt(): ForStmtContext {
		let _localctx: ForStmtContext = new ForStmtContext(this._ctx, this.state);
		this.enterRule(_localctx, 42, LanguageParser.RULE_forStmt);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 249;
			this.match(LanguageParser.FOR_KW);
			this.state = 250;
			this.match(LanguageParser.ID);
			this.state = 251;
			this.match(LanguageParser.ASSIGN);
			this.state = 252;
			this.expr();
			this.state = 253;
			this.match(LanguageParser.TO_KW);
			this.state = 254;
			this.expr();
			this.state = 255;
			this.match(LanguageParser.DO_KW);
			this.state = 256;
			this.block();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public lvalue(): LvalueContext {
		let _localctx: LvalueContext = new LvalueContext(this._ctx, this.state);
		this.enterRule(_localctx, 44, LanguageParser.RULE_lvalue);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 258;
			this.match(LanguageParser.ID);
			this.state = 263;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === LanguageParser.T__1 || _la === LanguageParser.LBRACK) {
				{
				this.state = 261;
				this._errHandler.sync(this);
				switch (this._input.LA(1)) {
				case LanguageParser.T__1:
					{
					this.state = 259;
					this.fieldAccess();
					}
					break;
				case LanguageParser.LBRACK:
					{
					this.state = 260;
					this.indexSuffix();
					}
					break;
				default:
					throw new NoViableAltException(this);
				}
				}
				this.state = 265;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public fieldAccess(): FieldAccessContext {
		let _localctx: FieldAccessContext = new FieldAccessContext(this._ctx, this.state);
		this.enterRule(_localctx, 46, LanguageParser.RULE_fieldAccess);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 266;
			this.match(LanguageParser.T__1);
			this.state = 267;
			this.match(LanguageParser.ID);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public indexSuffix(): IndexSuffixContext {
		let _localctx: IndexSuffixContext = new IndexSuffixContext(this._ctx, this.state);
		this.enterRule(_localctx, 48, LanguageParser.RULE_indexSuffix);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 269;
			this.match(LanguageParser.LBRACK);
			this.state = 270;
			this.expr();
			this.state = 273;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === LanguageParser.RANGE) {
				{
				this.state = 271;
				this.match(LanguageParser.RANGE);
				this.state = 272;
				this.expr();
				}
			}

			this.state = 275;
			this.match(LanguageParser.RBRACK);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public expr(): ExprContext {
		let _localctx: ExprContext = new ExprContext(this._ctx, this.state);
		this.enterRule(_localctx, 50, LanguageParser.RULE_expr);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 277;
			this.orExpr();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public orExpr(): OrExprContext {
		let _localctx: OrExprContext = new OrExprContext(this._ctx, this.state);
		this.enterRule(_localctx, 52, LanguageParser.RULE_orExpr);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 279;
			this.andExpr();
			this.state = 284;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === LanguageParser.OR_KW) {
				{
				{
				this.state = 280;
				this.match(LanguageParser.OR_KW);
				this.state = 281;
				this.andExpr();
				}
				}
				this.state = 286;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public andExpr(): AndExprContext {
		let _localctx: AndExprContext = new AndExprContext(this._ctx, this.state);
		this.enterRule(_localctx, 54, LanguageParser.RULE_andExpr);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 287;
			this.relExpr();
			this.state = 292;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === LanguageParser.AND_KW) {
				{
				{
				this.state = 288;
				this.match(LanguageParser.AND_KW);
				this.state = 289;
				this.relExpr();
				}
				}
				this.state = 294;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public relExpr(): RelExprContext {
		let _localctx: RelExprContext = new RelExprContext(this._ctx, this.state);
		this.enterRule(_localctx, 56, LanguageParser.RULE_relExpr);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 295;
			this.addExpr();
			this.state = 300;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while ((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << LanguageParser.EQ) | (1 << LanguageParser.NEQ) | (1 << LanguageParser.LE) | (1 << LanguageParser.GE) | (1 << LanguageParser.LT) | (1 << LanguageParser.GT))) !== 0)) {
				{
				{
				this.state = 296;
				_la = this._input.LA(1);
				if (!((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << LanguageParser.EQ) | (1 << LanguageParser.NEQ) | (1 << LanguageParser.LE) | (1 << LanguageParser.GE) | (1 << LanguageParser.LT) | (1 << LanguageParser.GT))) !== 0))) {
				this._errHandler.recoverInline(this);
				} else {
					if (this._input.LA(1) === Token.EOF) {
						this.matchedEOF = true;
					}

					this._errHandler.reportMatch(this);
					this.consume();
				}
				this.state = 297;
				this.addExpr();
				}
				}
				this.state = 302;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public addExpr(): AddExprContext {
		let _localctx: AddExprContext = new AddExprContext(this._ctx, this.state);
		this.enterRule(_localctx, 58, LanguageParser.RULE_addExpr);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 303;
			this.mulExpr();
			this.state = 308;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === LanguageParser.PLUS || _la === LanguageParser.MINUS) {
				{
				{
				this.state = 304;
				_la = this._input.LA(1);
				if (!(_la === LanguageParser.PLUS || _la === LanguageParser.MINUS)) {
				this._errHandler.recoverInline(this);
				} else {
					if (this._input.LA(1) === Token.EOF) {
						this.matchedEOF = true;
					}

					this._errHandler.reportMatch(this);
					this.consume();
				}
				this.state = 305;
				this.mulExpr();
				}
				}
				this.state = 310;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public mulExpr(): MulExprContext {
		let _localctx: MulExprContext = new MulExprContext(this._ctx, this.state);
		this.enterRule(_localctx, 60, LanguageParser.RULE_mulExpr);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 311;
			this.unaryExpr();
			this.state = 316;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (((((_la - 14)) & ~0x1F) === 0 && ((1 << (_la - 14)) & ((1 << (LanguageParser.MUL - 14)) | (1 << (LanguageParser.DIVOP - 14)) | (1 << (LanguageParser.DIV_KW - 14)) | (1 << (LanguageParser.MOD_KW - 14)))) !== 0)) {
				{
				{
				this.state = 312;
				_la = this._input.LA(1);
				if (!(((((_la - 14)) & ~0x1F) === 0 && ((1 << (_la - 14)) & ((1 << (LanguageParser.MUL - 14)) | (1 << (LanguageParser.DIVOP - 14)) | (1 << (LanguageParser.DIV_KW - 14)) | (1 << (LanguageParser.MOD_KW - 14)))) !== 0))) {
				this._errHandler.recoverInline(this);
				} else {
					if (this._input.LA(1) === Token.EOF) {
						this.matchedEOF = true;
					}

					this._errHandler.reportMatch(this);
					this.consume();
				}
				this.state = 313;
				this.unaryExpr();
				}
				}
				this.state = 318;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public unaryExpr(): UnaryExprContext {
		let _localctx: UnaryExprContext = new UnaryExprContext(this._ctx, this.state);
		this.enterRule(_localctx, 62, LanguageParser.RULE_unaryExpr);
		try {
			this.state = 324;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case LanguageParser.NOT_KW:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 319;
				this.match(LanguageParser.NOT_KW);
				this.state = 320;
				this.unaryExpr();
				}
				break;
			case LanguageParser.MINUS:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 321;
				this.match(LanguageParser.MINUS);
				this.state = 322;
				this.unaryExpr();
				}
				break;
			case LanguageParser.LPAREN:
			case LanguageParser.TRUE_KW:
			case LanguageParser.FALSE_KW:
			case LanguageParser.NULL_KW:
			case LanguageParser.LENGTH_KW:
			case LanguageParser.STRING:
			case LanguageParser.ID:
			case LanguageParser.INT:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 323;
				this.primary();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public primary(): PrimaryContext {
		let _localctx: PrimaryContext = new PrimaryContext(this._ctx, this.state);
		this.enterRule(_localctx, 64, LanguageParser.RULE_primary);
		try {
			this.state = 338;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 34, this._ctx) ) {
			case 1:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 326;
				this.match(LanguageParser.INT);
				}
				break;

			case 2:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 327;
				this.match(LanguageParser.TRUE_KW);
				}
				break;

			case 3:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 328;
				this.match(LanguageParser.FALSE_KW);
				}
				break;

			case 4:
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 329;
				this.match(LanguageParser.NULL_KW);
				}
				break;

			case 5:
				this.enterOuterAlt(_localctx, 5);
				{
				this.state = 330;
				this.match(LanguageParser.STRING);
				}
				break;

			case 6:
				this.enterOuterAlt(_localctx, 6);
				{
				this.state = 331;
				this.lengthCall();
				}
				break;

			case 7:
				this.enterOuterAlt(_localctx, 7);
				{
				this.state = 332;
				this.callExpr();
				}
				break;

			case 8:
				this.enterOuterAlt(_localctx, 8);
				{
				this.state = 333;
				this.lvalue();
				}
				break;

			case 9:
				this.enterOuterAlt(_localctx, 9);
				{
				this.state = 334;
				this.match(LanguageParser.LPAREN);
				this.state = 335;
				this.expr();
				this.state = 336;
				this.match(LanguageParser.RPAREN);
				}
				break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public lengthCall(): LengthCallContext {
		let _localctx: LengthCallContext = new LengthCallContext(this._ctx, this.state);
		this.enterRule(_localctx, 66, LanguageParser.RULE_lengthCall);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 340;
			this.match(LanguageParser.LENGTH_KW);
			this.state = 341;
			this.match(LanguageParser.LPAREN);
			this.state = 342;
			this.expr();
			this.state = 343;
			this.match(LanguageParser.RPAREN);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public callExpr(): CallExprContext {
		let _localctx: CallExprContext = new CallExprContext(this._ctx, this.state);
		this.enterRule(_localctx, 68, LanguageParser.RULE_callExpr);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 345;
			this.match(LanguageParser.ID);
			this.state = 346;
			this.match(LanguageParser.LPAREN);
			this.state = 348;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === LanguageParser.LPAREN || _la === LanguageParser.MINUS || ((((_la - 34)) & ~0x1F) === 0 && ((1 << (_la - 34)) & ((1 << (LanguageParser.NOT_KW - 34)) | (1 << (LanguageParser.TRUE_KW - 34)) | (1 << (LanguageParser.FALSE_KW - 34)) | (1 << (LanguageParser.NULL_KW - 34)) | (1 << (LanguageParser.LENGTH_KW - 34)) | (1 << (LanguageParser.STRING - 34)) | (1 << (LanguageParser.ID - 34)) | (1 << (LanguageParser.INT - 34)))) !== 0)) {
				{
				this.state = 347;
				this.argList();
				}
			}

			this.state = 350;
			this.match(LanguageParser.RPAREN);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}

	public static readonly _serializedATN: string =
		"\x03\uC91D\uCABA\u058D\uAFBA\u4F53\u0607\uEA8B\uC241\x035\u0163\x04\x02" +
		"\t\x02\x04\x03\t\x03\x04\x04\t\x04\x04\x05\t\x05\x04\x06\t\x06\x04\x07" +
		"\t\x07\x04\b\t\b\x04\t\t\t\x04\n\t\n\x04\v\t\v\x04\f\t\f\x04\r\t\r\x04" +
		"\x0E\t\x0E\x04\x0F\t\x0F\x04\x10\t\x10\x04\x11\t\x11\x04\x12\t\x12\x04" +
		"\x13\t\x13\x04\x14\t\x14\x04\x15\t\x15\x04\x16\t\x16\x04\x17\t\x17\x04" +
		"\x18\t\x18\x04\x19\t\x19\x04\x1A\t\x1A\x04\x1B\t\x1B\x04\x1C\t\x1C\x04" +
		"\x1D\t\x1D\x04\x1E\t\x1E\x04\x1F\t\x1F\x04 \t \x04!\t!\x04\"\t\"\x04#" +
		"\t#\x04$\t$\x03\x02\x07\x02J\n\x02\f\x02\x0E\x02M\v\x02\x03\x02\x03\x02" +
		"\x07\x02Q\n\x02\f\x02\x0E\x02T\v\x02\x03\x02\x03\x02\x03\x03\x03\x03\x03" +
		"\x03\x03\x03\x05\x03\\\n\x03\x03\x03\x03\x03\x03\x04\x06\x04a\n\x04\r" +
		"\x04\x0E\x04b\x03\x05\x03\x05\x03\x05\x05\x05h\n\x05\x03\x05\x03\x05\x03" +
		"\x05\x03\x06\x03\x06\x03\x06\x07\x06p\n\x06\f\x06\x0E\x06s\v\x06\x03\x07" +
		"\x03\x07\x03\x07\x05\x07x\n\x07\x03\b\x03\b\x03\b\x03\b\x03\b\x03\b\x03" +
		"\b\x03\b\x03\b\x05\b\x83\n\b\x03\t\x03\t\x03\n\x03\n\x03\n\x03\n\x03\v" +
		"\x03\v\x03\v\x03\f\x03\f\x03\f\x03\f\x03\f\x03\f\x03\f\x03\f\x03\f\x03" +
		"\f\x03\f\x05\f\x99\n\f\x03\r\x03\r\x07\r\x9D\n\r\f\r\x0E\r\xA0\v\r\x03" +
		"\r\x03\r\x03\r\x07\r\xA5\n\r\f\r\x0E\r\xA8\v\r\x03\r\x05\r\xAB\n\r\x03" +
		"\x0E\x03\x0E\x03\x0E\x03\x0E\x05\x0E\xB1\n\x0E\x03\x0F\x03\x0F\x06\x0F" +
		"\xB5\n\x0F\r\x0F\x0E\x0F\xB6\x03\x0F\x05\x0F\xBA\n\x0F\x03\x10\x03\x10" +
		"\x03\x10\x03\x10\x05\x10\xC0\n\x10\x03\x10\x03\x10\x05\x10\xC4\n\x10\x03" +
		"\x11\x03\x11\x03\x11\x05\x11\xC9\n\x11\x03\x11\x03\x11\x05\x11\xCD\n\x11" +
		"\x03\x12\x03\x12\x03\x12\x07\x12\xD2\n\x12\f\x12\x0E\x12\xD5\v\x12\x03" +
		"\x13\x03\x13\x06\x13\xD9\n\x13\r\x13\x0E\x13\xDA\x03\x13\x03\x13\x03\x13" +
		"\x03\x13\x03\x13\x05\x13\xE2\n\x13\x03\x14\x03\x14\x03\x14\x03\x14\x03" +
		"\x15\x03\x15\x03\x15\x03\x15\x03\x15\x03\x15\x03\x15\x03\x15\x03\x15\x05" +
		"\x15\xF1\n\x15\x05\x15\xF3\n\x15\x03\x16\x03\x16\x03\x16\x03\x16\x03\x16" +
		"\x03\x16\x03\x16\x03\x17\x03\x17\x03\x17\x03\x17\x03\x17\x03\x17\x03\x17" +
		"\x03\x17\x03\x17\x03\x18\x03\x18\x03\x18\x07\x18\u0108\n\x18\f\x18\x0E" +
		"\x18\u010B\v\x18\x03\x19\x03\x19\x03\x19\x03\x1A\x03\x1A\x03\x1A\x03\x1A" +
		"\x05\x1A\u0114\n\x1A\x03\x1A\x03\x1A\x03\x1B\x03\x1B\x03\x1C\x03\x1C\x03" +
		"\x1C\x07\x1C\u011D\n\x1C\f\x1C\x0E\x1C\u0120\v\x1C\x03\x1D\x03\x1D\x03" +
		"\x1D\x07\x1D\u0125\n\x1D\f\x1D\x0E\x1D\u0128\v\x1D\x03\x1E\x03\x1E\x03" +
		"\x1E\x07\x1E\u012D\n\x1E\f\x1E\x0E\x1E\u0130\v\x1E\x03\x1F\x03\x1F\x03" +
		"\x1F\x07\x1F\u0135\n\x1F\f\x1F\x0E\x1F\u0138\v\x1F\x03 \x03 \x03 \x07" +
		" \u013D\n \f \x0E \u0140\v \x03!\x03!\x03!\x03!\x03!\x05!\u0147\n!\x03" +
		"\"\x03\"\x03\"\x03\"\x03\"\x03\"\x03\"\x03\"\x03\"\x03\"\x03\"\x03\"\x05" +
		"\"\u0155\n\"\x03#\x03#\x03#\x03#\x03#\x03$\x03$\x03$\x05$\u015F\n$\x03" +
		"$\x03$\x03$\x02\x02\x02%\x02\x02\x04\x02\x06\x02\b\x02\n\x02\f\x02\x0E" +
		"\x02\x10\x02\x12\x02\x14\x02\x16\x02\x18\x02\x1A\x02\x1C\x02\x1E\x02 " +
		"\x02\"\x02$\x02&\x02(\x02*\x02,\x02.\x020\x022\x024\x026\x028\x02:\x02" +
		"<\x02>\x02@\x02B\x02D\x02F\x02\x02\x06\x03\x0212\x03\x02\x12\x17\x03\x02" +
		"\x0E\x0F\x04\x02\x10\x11)*\x02\u0175\x02K\x03\x02\x02\x02\x04W\x03\x02" +
		"\x02\x02\x06`\x03\x02\x02\x02\bd\x03\x02\x02\x02\nl\x03\x02\x02\x02\f" +
		"w\x03\x02\x02\x02\x0Ey\x03\x02\x02\x02\x10\x84\x03\x02\x02\x02\x12\x86" +
		"\x03\x02\x02\x02\x14\x8A\x03\x02\x02\x02\x16\x98\x03\x02\x02\x02\x18\xAA" +
		"\x03\x02\x02\x02\x1A\xAC\x03\x02\x02\x02\x1C\xB2\x03\x02\x02\x02\x1E\xBB" +
		"\x03\x02\x02\x02 \xC5\x03\x02\x02\x02\"\xCE\x03\x02\x02\x02$\xD6\x03\x02" +
		"\x02\x02&\xE3\x03\x02\x02\x02(\xE7\x03\x02\x02\x02*\xF4\x03\x02\x02\x02" +
		",\xFB\x03\x02\x02\x02.\u0104\x03\x02\x02\x020\u010C\x03\x02\x02\x022\u010F" +
		"\x03\x02\x02\x024\u0117\x03\x02\x02\x026\u0119\x03\x02\x02\x028\u0121" +
		"\x03\x02\x02\x02:\u0129\x03\x02\x02\x02<\u0131\x03\x02\x02\x02>\u0139" +
		"\x03\x02\x02\x02@\u0146\x03\x02\x02\x02B\u0154\x03\x02\x02\x02D\u0156" +
		"\x03\x02\x02\x02F\u015B\x03\x02\x02\x02HJ\x05\x04\x03\x02IH\x03\x02\x02" +
		"\x02JM\x03\x02\x02\x02KI\x03\x02\x02\x02KL\x03\x02\x02\x02LR\x03\x02\x02" +
		"\x02MK\x03\x02\x02\x02NQ\x05\b\x05\x02OQ\x05\x16\f\x02PN\x03\x02\x02\x02" +
		"PO\x03\x02\x02\x02QT\x03\x02\x02\x02RP\x03\x02\x02\x02RS\x03\x02\x02\x02" +
		"SU\x03\x02\x02\x02TR\x03\x02\x02\x02UV\x07\x02\x02\x03V\x03\x03\x02\x02" +
		"\x02WX\x07,\x02\x02XY\x071\x02\x02Y[\x07\x07\x02\x02Z\\\x05\x06\x04\x02" +
		"[Z\x03\x02\x02\x02[\\\x03\x02\x02\x02\\]\x03\x02\x02\x02]^\x07\b\x02\x02" +
		"^\x05\x03\x02\x02\x02_a\x071\x02\x02`_\x03\x02\x02\x02ab\x03\x02\x02\x02" +
		"b`\x03\x02\x02\x02bc\x03\x02\x02\x02c\x07\x03\x02\x02\x02de\x071\x02\x02" +
		"eg\x07\x05\x02\x02fh\x05\n\x06\x02gf\x03\x02\x02\x02gh\x03\x02\x02\x02" +
		"hi\x03\x02\x02\x02ij\x07\x06\x02\x02jk\x05\x18\r\x02k\t\x03\x02\x02\x02" +
		"lq\x05\f\x07\x02mn\x07\x03\x02\x02np\x05\f\x07\x02om\x03\x02\x02\x02p" +
		"s\x03\x02\x02\x02qo\x03\x02\x02\x02qr\x03\x02\x02\x02r\v\x03\x02\x02\x02" +
		"sq\x03\x02\x02\x02tx\x05\x0E\b\x02ux\x05\x14\v\x02vx\x071\x02\x02wt\x03" +
		"\x02\x02\x02wu\x03\x02\x02\x02wv\x03\x02\x02\x02x\r\x03\x02\x02\x02yz" +
		"\x071\x02\x02z{\x07\t\x02\x02{|\x05\x10\t\x02|\x82\x07\n\x02\x02}~\x07" +
		"\v\x02\x02~\x7F\x07\t\x02\x02\x7F\x80\x05\x10\t\x02\x80\x81\x07\n\x02" +
		"\x02\x81\x83\x03\x02\x02\x02\x82}\x03\x02\x02\x02\x82\x83\x03\x02\x02" +
		"\x02\x83\x0F\x03\x02\x02\x02\x84\x85\t\x02\x02\x02\x85\x11\x03\x02\x02" +
		"\x02\x86\x87\x07\t\x02\x02\x87\x88\t\x02\x02\x02\x88\x89\x07\n\x02\x02" +
		"\x89\x13\x03\x02\x02\x02\x8A\x8B\x071\x02\x02\x8B\x8C\x071\x02\x02\x8C" +
		"\x15\x03\x02\x02\x02\x8D\x99\x05\x1A\x0E\x02\x8E\x99\x05\x1E\x10\x02\x8F" +
		"\x99\x05 \x11\x02\x90\x99\x05(\x15\x02\x91\x99\x05*\x16\x02\x92\x99\x05" +
		"$\x13\x02\x93\x99\x05,\x17\x02\x94\x99\x05&\x14\x02\x95\x99\x05\x18\r" +
		"\x02\x96\x99\x05\x1C\x0F\x02\x97\x99\x07\f\x02\x02\x98\x8D\x03\x02\x02" +
		"\x02\x98\x8E\x03\x02\x02\x02\x98\x8F\x03\x02\x02\x02\x98\x90\x03\x02\x02" +
		"\x02\x98\x91\x03\x02\x02\x02\x98\x92\x03\x02\x02\x02\x98\x93\x03\x02\x02" +
		"\x02\x98\x94\x03\x02\x02\x02\x98\x95\x03\x02\x02\x02\x98\x96\x03\x02\x02" +
		"\x02\x98\x97\x03\x02\x02\x02\x99\x17\x03\x02\x02\x02\x9A\x9E\x07\x07\x02" +
		"\x02\x9B\x9D\x05\x16\f\x02\x9C\x9B\x03\x02\x02\x02\x9D\xA0\x03\x02\x02" +
		"\x02\x9E\x9C\x03\x02\x02\x02\x9E\x9F\x03\x02\x02\x02\x9F\xA1\x03\x02\x02" +
		"\x02\xA0\x9E\x03\x02\x02\x02\xA1\xAB\x07\b\x02\x02\xA2\xA6\x07\x1D\x02" +
		"\x02\xA3\xA5\x05\x16\f\x02\xA4\xA3\x03\x02\x02\x02\xA5\xA8\x03\x02\x02" +
		"\x02\xA6\xA4\x03\x02\x02\x02\xA6\xA7\x03\x02\x02\x02\xA7\xA9\x03\x02\x02" +
		"\x02\xA8\xA6\x03\x02\x02\x02\xA9\xAB\x07\x1E\x02\x02\xAA\x9A\x03\x02\x02" +
		"\x02\xAA\xA2\x03\x02\x02\x02\xAB\x19\x03\x02\x02\x02\xAC\xAD\x05.\x18" +
		"\x02\xAD\xAE\x07\r\x02\x02\xAE\xB0\x054\x1B\x02\xAF\xB1\x07\f\x02\x02" +
		"\xB0\xAF\x03\x02\x02\x02\xB0\xB1\x03\x02\x02\x02\xB1\x1B\x03\x02\x02\x02" +
		"\xB2\xB4\x071\x02\x02\xB3\xB5\x052\x1A\x02\xB4\xB3\x03\x02\x02\x02\xB5" +
		"\xB6\x03\x02\x02\x02\xB6\xB4\x03\x02\x02\x02\xB6\xB7\x03\x02\x02\x02\xB7" +
		"\xB9\x03\x02\x02\x02\xB8\xBA\x07\f\x02\x02\xB9\xB8\x03\x02\x02\x02\xB9" +
		"\xBA\x03\x02\x02\x02\xBA\x1D\x03\x02\x02\x02\xBB\xBC\x07!\x02\x02\xBC" +
		"\xBD\x071\x02\x02\xBD\xBF\x07\x05\x02\x02\xBE\xC0\x05\"\x12\x02\xBF\xBE" +
		"\x03\x02\x02\x02\xBF\xC0\x03\x02\x02\x02\xC0\xC1\x03\x02\x02\x02\xC1\xC3" +
		"\x07\x06\x02\x02\xC2\xC4\x07\f\x02\x02\xC3\xC2\x03\x02\x02\x02\xC3\xC4" +
		"\x03\x02\x02\x02\xC4\x1F\x03\x02\x02\x02\xC5\xC6\x070\x02\x02\xC6\xC8" +
		"\x07\x05\x02\x02\xC7\xC9\x05\"\x12\x02\xC8\xC7\x03\x02\x02\x02\xC8\xC9" +
		"\x03\x02\x02\x02\xC9\xCA\x03\x02\x02\x02\xCA\xCC\x07\x06\x02\x02\xCB\xCD" +
		"\x07\f\x02\x02\xCC\xCB\x03\x02\x02\x02\xCC\xCD\x03\x02\x02\x02\xCD!\x03" +
		"\x02\x02\x02\xCE\xD3\x054\x1B\x02\xCF\xD0\x07\x03\x02\x02\xD0\xD2\x05" +
		"4\x1B\x02\xD1\xCF\x03\x02\x02\x02\xD2\xD5\x03\x02\x02\x02\xD3\xD1\x03" +
		"\x02\x02\x02\xD3\xD4\x03\x02\x02\x02\xD4#\x03\x02\x02\x02\xD5\xD3\x03" +
		"\x02\x02\x02\xD6\xD8\x07.\x02\x02\xD7\xD9\x05\x16\f\x02\xD8\xD7\x03\x02" +
		"\x02\x02\xD9\xDA\x03\x02\x02\x02\xDA\xD8\x03\x02\x02\x02\xDA\xDB\x03\x02" +
		"\x02\x02\xDB\xDC\x03\x02\x02\x02\xDC\xDD\x07/\x02\x02\xDD\xDE\x07\x05" +
		"\x02\x02\xDE\xDF\x054\x1B\x02\xDF\xE1\x07\x06\x02\x02\xE0\xE2\x07\f\x02" +
		"\x02\xE1\xE0\x03\x02\x02\x02\xE1\xE2\x03\x02\x02\x02\xE2%\x03\x02\x02" +
		"\x02\xE3\xE4\x07-\x02\x02\xE4\xE5\x054\x1B\x02\xE5\xE6\x07\f\x02\x02\xE6" +
		"\'\x03\x02\x02\x02\xE7\xE8\x07\x1A\x02\x02\xE8\xE9\x07\x05\x02\x02\xE9" +
		"\xEA\x054\x1B\x02\xEA\xEB\x07\x06\x02\x02\xEB\xEC\x07\x1B\x02\x02\xEC" +
		"\xF2\x05\x18\r\x02\xED\xF0\x07\x1C\x02\x02\xEE\xF1\x05(\x15\x02\xEF\xF1" +
		"\x05\x18\r\x02\xF0\xEE\x03\x02\x02\x02\xF0\xEF\x03\x02\x02\x02\xF1\xF3" +
		"\x03\x02\x02\x02\xF2\xED\x03\x02\x02\x02\xF2\xF3\x03\x02\x02\x02\xF3)" +
		"\x03\x02\x02\x02\xF4\xF5\x07\x19\x02\x02\xF5\xF6\x07\x05\x02\x02\xF6\xF7" +
		"\x054\x1B\x02\xF7\xF8\x07\x06\x02\x02\xF8\xF9\x07 \x02\x02\xF9\xFA\x05" +
		"\x18\r\x02\xFA+\x03\x02\x02\x02\xFB\xFC\x07\x18\x02\x02\xFC\xFD\x071\x02" +
		"\x02\xFD\xFE\x07\r\x02\x02\xFE\xFF\x054\x1B\x02\xFF\u0100\x07\x1F\x02" +
		"\x02\u0100\u0101\x054\x1B\x02\u0101\u0102\x07 \x02\x02\u0102\u0103\x05" +
		"\x18\r\x02\u0103-\x03\x02\x02\x02\u0104\u0109\x071\x02\x02\u0105\u0108" +
		"\x050\x19\x02\u0106\u0108\x052\x1A\x02\u0107\u0105\x03\x02\x02\x02\u0107" +
		"\u0106\x03\x02\x02\x02\u0108\u010B\x03\x02\x02\x02\u0109\u0107\x03\x02" +
		"\x02\x02\u0109\u010A\x03\x02\x02\x02\u010A/\x03\x02\x02\x02\u010B\u0109" +
		"\x03\x02\x02\x02\u010C\u010D\x07\x04\x02\x02\u010D\u010E\x071\x02\x02" +
		"\u010E1\x03\x02\x02\x02\u010F\u0110\x07\t\x02\x02\u0110\u0113\x054\x1B" +
		"\x02\u0111\u0112\x07\v\x02\x02\u0112\u0114\x054\x1B\x02\u0113\u0111\x03" +
		"\x02\x02\x02\u0113\u0114\x03\x02\x02\x02\u0114\u0115\x03\x02\x02\x02\u0115" +
		"\u0116\x07\n\x02\x02\u01163\x03\x02\x02\x02\u0117\u0118\x056\x1C\x02\u0118" +
		"5\x03\x02\x02\x02\u0119\u011E\x058\x1D\x02\u011A\u011B\x07#\x02\x02\u011B" +
		"\u011D\x058\x1D\x02\u011C\u011A\x03\x02\x02\x02\u011D\u0120\x03\x02\x02" +
		"\x02\u011E\u011C\x03\x02\x02\x02\u011E\u011F\x03\x02\x02\x02\u011F7\x03" +
		"\x02\x02\x02\u0120\u011E\x03\x02\x02\x02\u0121\u0126\x05:\x1E\x02\u0122" +
		"\u0123\x07\"\x02\x02\u0123\u0125\x05:\x1E\x02\u0124\u0122\x03\x02\x02" +
		"\x02\u0125\u0128\x03\x02\x02\x02\u0126\u0124\x03\x02\x02\x02\u0126\u0127" +
		"\x03\x02\x02\x02\u01279\x03\x02\x02\x02\u0128\u0126\x03\x02\x02\x02\u0129" +
		"\u012E\x05<\x1F\x02\u012A\u012B\t\x03\x02\x02\u012B\u012D\x05<\x1F\x02" +
		"\u012C\u012A\x03\x02\x02\x02\u012D\u0130\x03\x02\x02\x02\u012E\u012C\x03" +
		"\x02\x02\x02\u012E\u012F\x03\x02\x02\x02\u012F;\x03\x02\x02\x02\u0130" +
		"\u012E\x03\x02\x02\x02\u0131\u0136\x05> \x02\u0132\u0133\t\x04\x02\x02" +
		"\u0133\u0135\x05> \x02\u0134\u0132\x03\x02\x02\x02\u0135\u0138\x03\x02" +
		"\x02\x02\u0136\u0134\x03\x02\x02\x02\u0136\u0137\x03\x02\x02\x02\u0137" +
		"=\x03\x02\x02\x02\u0138\u0136\x03\x02\x02\x02\u0139\u013E\x05@!\x02\u013A" +
		"\u013B\t\x05\x02\x02\u013B\u013D\x05@!\x02\u013C\u013A\x03\x02\x02\x02" +
		"\u013D\u0140\x03\x02\x02\x02\u013E\u013C\x03\x02\x02\x02\u013E\u013F\x03" +
		"\x02\x02\x02\u013F?\x03\x02\x02\x02\u0140\u013E\x03\x02\x02\x02\u0141" +
		"\u0142\x07$\x02\x02\u0142\u0147\x05@!\x02\u0143\u0144\x07\x0F\x02\x02" +
		"\u0144\u0147\x05@!\x02\u0145\u0147\x05B\"\x02\u0146\u0141\x03\x02\x02" +
		"\x02\u0146\u0143\x03\x02\x02\x02\u0146\u0145\x03\x02\x02\x02\u0147A\x03" +
		"\x02\x02\x02\u0148\u0155\x072\x02\x02\u0149\u0155\x07%\x02\x02\u014A\u0155" +
		"\x07&\x02\x02\u014B\u0155\x07\'\x02\x02\u014C\u0155\x07+\x02\x02\u014D" +
		"\u0155\x05D#\x02\u014E\u0155\x05F$\x02\u014F\u0155\x05.\x18\x02\u0150" +
		"\u0151\x07\x05\x02\x02\u0151\u0152\x054\x1B\x02\u0152\u0153\x07\x06\x02" +
		"\x02\u0153\u0155\x03\x02\x02\x02\u0154\u0148\x03\x02\x02\x02\u0154\u0149" +
		"\x03\x02\x02\x02\u0154\u014A\x03\x02\x02\x02\u0154\u014B\x03\x02\x02\x02" +
		"\u0154\u014C\x03\x02\x02\x02\u0154\u014D\x03\x02\x02\x02\u0154\u014E\x03" +
		"\x02\x02\x02\u0154\u014F\x03\x02\x02\x02\u0154\u0150\x03\x02\x02\x02\u0155" +
		"C\x03\x02\x02\x02\u0156\u0157\x07(\x02\x02\u0157\u0158\x07\x05\x02\x02" +
		"\u0158\u0159\x054\x1B\x02\u0159\u015A\x07\x06\x02\x02\u015AE\x03\x02\x02" +
		"\x02\u015B\u015C\x071\x02\x02\u015C\u015E\x07\x05\x02\x02\u015D\u015F" +
		"\x05\"\x12\x02\u015E\u015D\x03\x02\x02\x02\u015E\u015F\x03\x02\x02\x02" +
		"\u015F\u0160\x03\x02\x02\x02\u0160\u0161\x07\x06\x02\x02\u0161G\x03\x02" +
		"\x02\x02&KPR[bgqw\x82\x98\x9E\xA6\xAA\xB0\xB6\xB9\xBF\xC3\xC8\xCC\xD3" +
		"\xDA\xE1\xF0\xF2\u0107\u0109\u0113\u011E\u0126\u012E\u0136\u013E\u0146" +
		"\u0154\u015E";
	public static __ATN: ATN;
	public static get _ATN(): ATN {
		if (!LanguageParser.__ATN) {
			LanguageParser.__ATN = new ATNDeserializer().deserialize(Utils.toCharArray(LanguageParser._serializedATN));
		}

		return LanguageParser.__ATN;
	}

}

export class ProgramContext extends ParserRuleContext {
	public EOF(): TerminalNode { return this.getToken(LanguageParser.EOF, 0); }
	public classDef(): ClassDefContext[];
	public classDef(i: number): ClassDefContext;
	public classDef(i?: number): ClassDefContext | ClassDefContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ClassDefContext);
		} else {
			return this.getRuleContext(i, ClassDefContext);
		}
	}
	public procDef(): ProcDefContext[];
	public procDef(i: number): ProcDefContext;
	public procDef(i?: number): ProcDefContext | ProcDefContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ProcDefContext);
		} else {
			return this.getRuleContext(i, ProcDefContext);
		}
	}
	public stmt(): StmtContext[];
	public stmt(i: number): StmtContext;
	public stmt(i?: number): StmtContext | StmtContext[] {
		if (i === undefined) {
			return this.getRuleContexts(StmtContext);
		} else {
			return this.getRuleContext(i, StmtContext);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_program; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterProgram) {
			listener.enterProgram(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitProgram) {
			listener.exitProgram(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitProgram) {
			return visitor.visitProgram(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ClassDefContext extends ParserRuleContext {
	public CLASS_KW(): TerminalNode { return this.getToken(LanguageParser.CLASS_KW, 0); }
	public ID(): TerminalNode { return this.getToken(LanguageParser.ID, 0); }
	public LBRACE(): TerminalNode { return this.getToken(LanguageParser.LBRACE, 0); }
	public RBRACE(): TerminalNode { return this.getToken(LanguageParser.RBRACE, 0); }
	public attrList(): AttrListContext | undefined {
		return this.tryGetRuleContext(0, AttrListContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_classDef; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterClassDef) {
			listener.enterClassDef(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitClassDef) {
			listener.exitClassDef(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitClassDef) {
			return visitor.visitClassDef(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class AttrListContext extends ParserRuleContext {
	public ID(): TerminalNode[];
	public ID(i: number): TerminalNode;
	public ID(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(LanguageParser.ID);
		} else {
			return this.getToken(LanguageParser.ID, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_attrList; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterAttrList) {
			listener.enterAttrList(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitAttrList) {
			listener.exitAttrList(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitAttrList) {
			return visitor.visitAttrList(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ProcDefContext extends ParserRuleContext {
	public ID(): TerminalNode { return this.getToken(LanguageParser.ID, 0); }
	public LPAREN(): TerminalNode { return this.getToken(LanguageParser.LPAREN, 0); }
	public RPAREN(): TerminalNode { return this.getToken(LanguageParser.RPAREN, 0); }
	public block(): BlockContext {
		return this.getRuleContext(0, BlockContext);
	}
	public paramList(): ParamListContext | undefined {
		return this.tryGetRuleContext(0, ParamListContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_procDef; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterProcDef) {
			listener.enterProcDef(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitProcDef) {
			listener.exitProcDef(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitProcDef) {
			return visitor.visitProcDef(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ParamListContext extends ParserRuleContext {
	public param(): ParamContext[];
	public param(i: number): ParamContext;
	public param(i?: number): ParamContext | ParamContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ParamContext);
		} else {
			return this.getRuleContext(i, ParamContext);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_paramList; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterParamList) {
			listener.enterParamList(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitParamList) {
			listener.exitParamList(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitParamList) {
			return visitor.visitParamList(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ParamContext extends ParserRuleContext {
	public arrayParam(): ArrayParamContext | undefined {
		return this.tryGetRuleContext(0, ArrayParamContext);
	}
	public objectParam(): ObjectParamContext | undefined {
		return this.tryGetRuleContext(0, ObjectParamContext);
	}
	public ID(): TerminalNode | undefined { return this.tryGetToken(LanguageParser.ID, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_param; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterParam) {
			listener.enterParam(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitParam) {
			listener.exitParam(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitParam) {
			return visitor.visitParam(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ArrayParamContext extends ParserRuleContext {
	public ID(): TerminalNode { return this.getToken(LanguageParser.ID, 0); }
	public LBRACK(): TerminalNode[];
	public LBRACK(i: number): TerminalNode;
	public LBRACK(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(LanguageParser.LBRACK);
		} else {
			return this.getToken(LanguageParser.LBRACK, i);
		}
	}
	public arrayIndex(): ArrayIndexContext[];
	public arrayIndex(i: number): ArrayIndexContext;
	public arrayIndex(i?: number): ArrayIndexContext | ArrayIndexContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ArrayIndexContext);
		} else {
			return this.getRuleContext(i, ArrayIndexContext);
		}
	}
	public RBRACK(): TerminalNode[];
	public RBRACK(i: number): TerminalNode;
	public RBRACK(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(LanguageParser.RBRACK);
		} else {
			return this.getToken(LanguageParser.RBRACK, i);
		}
	}
	public RANGE(): TerminalNode | undefined { return this.tryGetToken(LanguageParser.RANGE, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_arrayParam; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterArrayParam) {
			listener.enterArrayParam(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitArrayParam) {
			listener.exitArrayParam(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitArrayParam) {
			return visitor.visitArrayParam(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ArrayIndexContext extends ParserRuleContext {
	public ID(): TerminalNode | undefined { return this.tryGetToken(LanguageParser.ID, 0); }
	public INT(): TerminalNode | undefined { return this.tryGetToken(LanguageParser.INT, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_arrayIndex; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterArrayIndex) {
			listener.enterArrayIndex(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitArrayIndex) {
			listener.exitArrayIndex(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitArrayIndex) {
			return visitor.visitArrayIndex(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ArrayDimContext extends ParserRuleContext {
	public LBRACK(): TerminalNode { return this.getToken(LanguageParser.LBRACK, 0); }
	public RBRACK(): TerminalNode { return this.getToken(LanguageParser.RBRACK, 0); }
	public ID(): TerminalNode | undefined { return this.tryGetToken(LanguageParser.ID, 0); }
	public INT(): TerminalNode | undefined { return this.tryGetToken(LanguageParser.INT, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_arrayDim; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterArrayDim) {
			listener.enterArrayDim(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitArrayDim) {
			listener.exitArrayDim(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitArrayDim) {
			return visitor.visitArrayDim(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ObjectParamContext extends ParserRuleContext {
	public ID(): TerminalNode[];
	public ID(i: number): TerminalNode;
	public ID(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(LanguageParser.ID);
		} else {
			return this.getToken(LanguageParser.ID, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_objectParam; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterObjectParam) {
			listener.enterObjectParam(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitObjectParam) {
			listener.exitObjectParam(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitObjectParam) {
			return visitor.visitObjectParam(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class StmtContext extends ParserRuleContext {
	public assignmentStmt(): AssignmentStmtContext | undefined {
		return this.tryGetRuleContext(0, AssignmentStmtContext);
	}
	public callStmt(): CallStmtContext | undefined {
		return this.tryGetRuleContext(0, CallStmtContext);
	}
	public printStmt(): PrintStmtContext | undefined {
		return this.tryGetRuleContext(0, PrintStmtContext);
	}
	public ifStmt(): IfStmtContext | undefined {
		return this.tryGetRuleContext(0, IfStmtContext);
	}
	public whileStmt(): WhileStmtContext | undefined {
		return this.tryGetRuleContext(0, WhileStmtContext);
	}
	public repeatStmt(): RepeatStmtContext | undefined {
		return this.tryGetRuleContext(0, RepeatStmtContext);
	}
	public forStmt(): ForStmtContext | undefined {
		return this.tryGetRuleContext(0, ForStmtContext);
	}
	public returnStmt(): ReturnStmtContext | undefined {
		return this.tryGetRuleContext(0, ReturnStmtContext);
	}
	public block(): BlockContext | undefined {
		return this.tryGetRuleContext(0, BlockContext);
	}
	public declVectorStmt(): DeclVectorStmtContext | undefined {
		return this.tryGetRuleContext(0, DeclVectorStmtContext);
	}
	public SEMI(): TerminalNode | undefined { return this.tryGetToken(LanguageParser.SEMI, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_stmt; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterStmt) {
			listener.enterStmt(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitStmt) {
			listener.exitStmt(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitStmt) {
			return visitor.visitStmt(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class BlockContext extends ParserRuleContext {
	public LBRACE(): TerminalNode | undefined { return this.tryGetToken(LanguageParser.LBRACE, 0); }
	public RBRACE(): TerminalNode | undefined { return this.tryGetToken(LanguageParser.RBRACE, 0); }
	public stmt(): StmtContext[];
	public stmt(i: number): StmtContext;
	public stmt(i?: number): StmtContext | StmtContext[] {
		if (i === undefined) {
			return this.getRuleContexts(StmtContext);
		} else {
			return this.getRuleContext(i, StmtContext);
		}
	}
	public BEGIN_KW(): TerminalNode | undefined { return this.tryGetToken(LanguageParser.BEGIN_KW, 0); }
	public END_KW(): TerminalNode | undefined { return this.tryGetToken(LanguageParser.END_KW, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_block; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterBlock) {
			listener.enterBlock(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitBlock) {
			listener.exitBlock(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitBlock) {
			return visitor.visitBlock(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class AssignmentStmtContext extends ParserRuleContext {
	public lvalue(): LvalueContext {
		return this.getRuleContext(0, LvalueContext);
	}
	public ASSIGN(): TerminalNode { return this.getToken(LanguageParser.ASSIGN, 0); }
	public expr(): ExprContext {
		return this.getRuleContext(0, ExprContext);
	}
	public SEMI(): TerminalNode | undefined { return this.tryGetToken(LanguageParser.SEMI, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_assignmentStmt; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterAssignmentStmt) {
			listener.enterAssignmentStmt(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitAssignmentStmt) {
			listener.exitAssignmentStmt(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitAssignmentStmt) {
			return visitor.visitAssignmentStmt(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class DeclVectorStmtContext extends ParserRuleContext {
	public ID(): TerminalNode { return this.getToken(LanguageParser.ID, 0); }
	public indexSuffix(): IndexSuffixContext[];
	public indexSuffix(i: number): IndexSuffixContext;
	public indexSuffix(i?: number): IndexSuffixContext | IndexSuffixContext[] {
		if (i === undefined) {
			return this.getRuleContexts(IndexSuffixContext);
		} else {
			return this.getRuleContext(i, IndexSuffixContext);
		}
	}
	public SEMI(): TerminalNode | undefined { return this.tryGetToken(LanguageParser.SEMI, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_declVectorStmt; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterDeclVectorStmt) {
			listener.enterDeclVectorStmt(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitDeclVectorStmt) {
			listener.exitDeclVectorStmt(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitDeclVectorStmt) {
			return visitor.visitDeclVectorStmt(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class CallStmtContext extends ParserRuleContext {
	public CALL_KW(): TerminalNode { return this.getToken(LanguageParser.CALL_KW, 0); }
	public ID(): TerminalNode { return this.getToken(LanguageParser.ID, 0); }
	public LPAREN(): TerminalNode { return this.getToken(LanguageParser.LPAREN, 0); }
	public RPAREN(): TerminalNode { return this.getToken(LanguageParser.RPAREN, 0); }
	public argList(): ArgListContext | undefined {
		return this.tryGetRuleContext(0, ArgListContext);
	}
	public SEMI(): TerminalNode | undefined { return this.tryGetToken(LanguageParser.SEMI, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_callStmt; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterCallStmt) {
			listener.enterCallStmt(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitCallStmt) {
			listener.exitCallStmt(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitCallStmt) {
			return visitor.visitCallStmt(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class PrintStmtContext extends ParserRuleContext {
	public PRINT_KW(): TerminalNode { return this.getToken(LanguageParser.PRINT_KW, 0); }
	public LPAREN(): TerminalNode { return this.getToken(LanguageParser.LPAREN, 0); }
	public RPAREN(): TerminalNode { return this.getToken(LanguageParser.RPAREN, 0); }
	public argList(): ArgListContext | undefined {
		return this.tryGetRuleContext(0, ArgListContext);
	}
	public SEMI(): TerminalNode | undefined { return this.tryGetToken(LanguageParser.SEMI, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_printStmt; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterPrintStmt) {
			listener.enterPrintStmt(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitPrintStmt) {
			listener.exitPrintStmt(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitPrintStmt) {
			return visitor.visitPrintStmt(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ArgListContext extends ParserRuleContext {
	public expr(): ExprContext[];
	public expr(i: number): ExprContext;
	public expr(i?: number): ExprContext | ExprContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ExprContext);
		} else {
			return this.getRuleContext(i, ExprContext);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_argList; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterArgList) {
			listener.enterArgList(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitArgList) {
			listener.exitArgList(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitArgList) {
			return visitor.visitArgList(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class RepeatStmtContext extends ParserRuleContext {
	public REPEAT_KW(): TerminalNode { return this.getToken(LanguageParser.REPEAT_KW, 0); }
	public UNTIL_KW(): TerminalNode { return this.getToken(LanguageParser.UNTIL_KW, 0); }
	public LPAREN(): TerminalNode { return this.getToken(LanguageParser.LPAREN, 0); }
	public expr(): ExprContext {
		return this.getRuleContext(0, ExprContext);
	}
	public RPAREN(): TerminalNode { return this.getToken(LanguageParser.RPAREN, 0); }
	public stmt(): StmtContext[];
	public stmt(i: number): StmtContext;
	public stmt(i?: number): StmtContext | StmtContext[] {
		if (i === undefined) {
			return this.getRuleContexts(StmtContext);
		} else {
			return this.getRuleContext(i, StmtContext);
		}
	}
	public SEMI(): TerminalNode | undefined { return this.tryGetToken(LanguageParser.SEMI, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_repeatStmt; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterRepeatStmt) {
			listener.enterRepeatStmt(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitRepeatStmt) {
			listener.exitRepeatStmt(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitRepeatStmt) {
			return visitor.visitRepeatStmt(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ReturnStmtContext extends ParserRuleContext {
	public RETURN_KW(): TerminalNode { return this.getToken(LanguageParser.RETURN_KW, 0); }
	public expr(): ExprContext {
		return this.getRuleContext(0, ExprContext);
	}
	public SEMI(): TerminalNode { return this.getToken(LanguageParser.SEMI, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_returnStmt; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterReturnStmt) {
			listener.enterReturnStmt(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitReturnStmt) {
			listener.exitReturnStmt(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitReturnStmt) {
			return visitor.visitReturnStmt(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class IfStmtContext extends ParserRuleContext {
	public IF_KW(): TerminalNode { return this.getToken(LanguageParser.IF_KW, 0); }
	public LPAREN(): TerminalNode { return this.getToken(LanguageParser.LPAREN, 0); }
	public expr(): ExprContext {
		return this.getRuleContext(0, ExprContext);
	}
	public RPAREN(): TerminalNode { return this.getToken(LanguageParser.RPAREN, 0); }
	public THEN_KW(): TerminalNode { return this.getToken(LanguageParser.THEN_KW, 0); }
	public block(): BlockContext[];
	public block(i: number): BlockContext;
	public block(i?: number): BlockContext | BlockContext[] {
		if (i === undefined) {
			return this.getRuleContexts(BlockContext);
		} else {
			return this.getRuleContext(i, BlockContext);
		}
	}
	public ELSE_KW(): TerminalNode | undefined { return this.tryGetToken(LanguageParser.ELSE_KW, 0); }
	public ifStmt(): IfStmtContext | undefined {
		return this.tryGetRuleContext(0, IfStmtContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_ifStmt; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterIfStmt) {
			listener.enterIfStmt(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitIfStmt) {
			listener.exitIfStmt(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitIfStmt) {
			return visitor.visitIfStmt(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class WhileStmtContext extends ParserRuleContext {
	public WHILE_KW(): TerminalNode { return this.getToken(LanguageParser.WHILE_KW, 0); }
	public LPAREN(): TerminalNode { return this.getToken(LanguageParser.LPAREN, 0); }
	public expr(): ExprContext {
		return this.getRuleContext(0, ExprContext);
	}
	public RPAREN(): TerminalNode { return this.getToken(LanguageParser.RPAREN, 0); }
	public DO_KW(): TerminalNode { return this.getToken(LanguageParser.DO_KW, 0); }
	public block(): BlockContext {
		return this.getRuleContext(0, BlockContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_whileStmt; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterWhileStmt) {
			listener.enterWhileStmt(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitWhileStmt) {
			listener.exitWhileStmt(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitWhileStmt) {
			return visitor.visitWhileStmt(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ForStmtContext extends ParserRuleContext {
	public FOR_KW(): TerminalNode { return this.getToken(LanguageParser.FOR_KW, 0); }
	public ID(): TerminalNode { return this.getToken(LanguageParser.ID, 0); }
	public ASSIGN(): TerminalNode { return this.getToken(LanguageParser.ASSIGN, 0); }
	public expr(): ExprContext[];
	public expr(i: number): ExprContext;
	public expr(i?: number): ExprContext | ExprContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ExprContext);
		} else {
			return this.getRuleContext(i, ExprContext);
		}
	}
	public TO_KW(): TerminalNode { return this.getToken(LanguageParser.TO_KW, 0); }
	public DO_KW(): TerminalNode { return this.getToken(LanguageParser.DO_KW, 0); }
	public block(): BlockContext {
		return this.getRuleContext(0, BlockContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_forStmt; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterForStmt) {
			listener.enterForStmt(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitForStmt) {
			listener.exitForStmt(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitForStmt) {
			return visitor.visitForStmt(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class LvalueContext extends ParserRuleContext {
	public ID(): TerminalNode { return this.getToken(LanguageParser.ID, 0); }
	public fieldAccess(): FieldAccessContext[];
	public fieldAccess(i: number): FieldAccessContext;
	public fieldAccess(i?: number): FieldAccessContext | FieldAccessContext[] {
		if (i === undefined) {
			return this.getRuleContexts(FieldAccessContext);
		} else {
			return this.getRuleContext(i, FieldAccessContext);
		}
	}
	public indexSuffix(): IndexSuffixContext[];
	public indexSuffix(i: number): IndexSuffixContext;
	public indexSuffix(i?: number): IndexSuffixContext | IndexSuffixContext[] {
		if (i === undefined) {
			return this.getRuleContexts(IndexSuffixContext);
		} else {
			return this.getRuleContext(i, IndexSuffixContext);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_lvalue; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterLvalue) {
			listener.enterLvalue(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitLvalue) {
			listener.exitLvalue(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitLvalue) {
			return visitor.visitLvalue(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class FieldAccessContext extends ParserRuleContext {
	public ID(): TerminalNode { return this.getToken(LanguageParser.ID, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_fieldAccess; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterFieldAccess) {
			listener.enterFieldAccess(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitFieldAccess) {
			listener.exitFieldAccess(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitFieldAccess) {
			return visitor.visitFieldAccess(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class IndexSuffixContext extends ParserRuleContext {
	public LBRACK(): TerminalNode { return this.getToken(LanguageParser.LBRACK, 0); }
	public expr(): ExprContext[];
	public expr(i: number): ExprContext;
	public expr(i?: number): ExprContext | ExprContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ExprContext);
		} else {
			return this.getRuleContext(i, ExprContext);
		}
	}
	public RBRACK(): TerminalNode { return this.getToken(LanguageParser.RBRACK, 0); }
	public RANGE(): TerminalNode | undefined { return this.tryGetToken(LanguageParser.RANGE, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_indexSuffix; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterIndexSuffix) {
			listener.enterIndexSuffix(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitIndexSuffix) {
			listener.exitIndexSuffix(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitIndexSuffix) {
			return visitor.visitIndexSuffix(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ExprContext extends ParserRuleContext {
	public orExpr(): OrExprContext {
		return this.getRuleContext(0, OrExprContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_expr; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterExpr) {
			listener.enterExpr(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitExpr) {
			listener.exitExpr(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitExpr) {
			return visitor.visitExpr(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class OrExprContext extends ParserRuleContext {
	public andExpr(): AndExprContext[];
	public andExpr(i: number): AndExprContext;
	public andExpr(i?: number): AndExprContext | AndExprContext[] {
		if (i === undefined) {
			return this.getRuleContexts(AndExprContext);
		} else {
			return this.getRuleContext(i, AndExprContext);
		}
	}
	public OR_KW(): TerminalNode[];
	public OR_KW(i: number): TerminalNode;
	public OR_KW(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(LanguageParser.OR_KW);
		} else {
			return this.getToken(LanguageParser.OR_KW, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_orExpr; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterOrExpr) {
			listener.enterOrExpr(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitOrExpr) {
			listener.exitOrExpr(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitOrExpr) {
			return visitor.visitOrExpr(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class AndExprContext extends ParserRuleContext {
	public relExpr(): RelExprContext[];
	public relExpr(i: number): RelExprContext;
	public relExpr(i?: number): RelExprContext | RelExprContext[] {
		if (i === undefined) {
			return this.getRuleContexts(RelExprContext);
		} else {
			return this.getRuleContext(i, RelExprContext);
		}
	}
	public AND_KW(): TerminalNode[];
	public AND_KW(i: number): TerminalNode;
	public AND_KW(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(LanguageParser.AND_KW);
		} else {
			return this.getToken(LanguageParser.AND_KW, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_andExpr; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterAndExpr) {
			listener.enterAndExpr(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitAndExpr) {
			listener.exitAndExpr(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitAndExpr) {
			return visitor.visitAndExpr(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class RelExprContext extends ParserRuleContext {
	public addExpr(): AddExprContext[];
	public addExpr(i: number): AddExprContext;
	public addExpr(i?: number): AddExprContext | AddExprContext[] {
		if (i === undefined) {
			return this.getRuleContexts(AddExprContext);
		} else {
			return this.getRuleContext(i, AddExprContext);
		}
	}
	public EQ(): TerminalNode[];
	public EQ(i: number): TerminalNode;
	public EQ(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(LanguageParser.EQ);
		} else {
			return this.getToken(LanguageParser.EQ, i);
		}
	}
	public NEQ(): TerminalNode[];
	public NEQ(i: number): TerminalNode;
	public NEQ(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(LanguageParser.NEQ);
		} else {
			return this.getToken(LanguageParser.NEQ, i);
		}
	}
	public LT(): TerminalNode[];
	public LT(i: number): TerminalNode;
	public LT(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(LanguageParser.LT);
		} else {
			return this.getToken(LanguageParser.LT, i);
		}
	}
	public LE(): TerminalNode[];
	public LE(i: number): TerminalNode;
	public LE(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(LanguageParser.LE);
		} else {
			return this.getToken(LanguageParser.LE, i);
		}
	}
	public GT(): TerminalNode[];
	public GT(i: number): TerminalNode;
	public GT(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(LanguageParser.GT);
		} else {
			return this.getToken(LanguageParser.GT, i);
		}
	}
	public GE(): TerminalNode[];
	public GE(i: number): TerminalNode;
	public GE(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(LanguageParser.GE);
		} else {
			return this.getToken(LanguageParser.GE, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_relExpr; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterRelExpr) {
			listener.enterRelExpr(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitRelExpr) {
			listener.exitRelExpr(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitRelExpr) {
			return visitor.visitRelExpr(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class AddExprContext extends ParserRuleContext {
	public mulExpr(): MulExprContext[];
	public mulExpr(i: number): MulExprContext;
	public mulExpr(i?: number): MulExprContext | MulExprContext[] {
		if (i === undefined) {
			return this.getRuleContexts(MulExprContext);
		} else {
			return this.getRuleContext(i, MulExprContext);
		}
	}
	public PLUS(): TerminalNode[];
	public PLUS(i: number): TerminalNode;
	public PLUS(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(LanguageParser.PLUS);
		} else {
			return this.getToken(LanguageParser.PLUS, i);
		}
	}
	public MINUS(): TerminalNode[];
	public MINUS(i: number): TerminalNode;
	public MINUS(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(LanguageParser.MINUS);
		} else {
			return this.getToken(LanguageParser.MINUS, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_addExpr; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterAddExpr) {
			listener.enterAddExpr(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitAddExpr) {
			listener.exitAddExpr(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitAddExpr) {
			return visitor.visitAddExpr(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class MulExprContext extends ParserRuleContext {
	public unaryExpr(): UnaryExprContext[];
	public unaryExpr(i: number): UnaryExprContext;
	public unaryExpr(i?: number): UnaryExprContext | UnaryExprContext[] {
		if (i === undefined) {
			return this.getRuleContexts(UnaryExprContext);
		} else {
			return this.getRuleContext(i, UnaryExprContext);
		}
	}
	public MUL(): TerminalNode[];
	public MUL(i: number): TerminalNode;
	public MUL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(LanguageParser.MUL);
		} else {
			return this.getToken(LanguageParser.MUL, i);
		}
	}
	public DIV_KW(): TerminalNode[];
	public DIV_KW(i: number): TerminalNode;
	public DIV_KW(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(LanguageParser.DIV_KW);
		} else {
			return this.getToken(LanguageParser.DIV_KW, i);
		}
	}
	public MOD_KW(): TerminalNode[];
	public MOD_KW(i: number): TerminalNode;
	public MOD_KW(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(LanguageParser.MOD_KW);
		} else {
			return this.getToken(LanguageParser.MOD_KW, i);
		}
	}
	public DIVOP(): TerminalNode[];
	public DIVOP(i: number): TerminalNode;
	public DIVOP(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(LanguageParser.DIVOP);
		} else {
			return this.getToken(LanguageParser.DIVOP, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_mulExpr; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterMulExpr) {
			listener.enterMulExpr(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitMulExpr) {
			listener.exitMulExpr(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitMulExpr) {
			return visitor.visitMulExpr(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class UnaryExprContext extends ParserRuleContext {
	public NOT_KW(): TerminalNode | undefined { return this.tryGetToken(LanguageParser.NOT_KW, 0); }
	public unaryExpr(): UnaryExprContext | undefined {
		return this.tryGetRuleContext(0, UnaryExprContext);
	}
	public MINUS(): TerminalNode | undefined { return this.tryGetToken(LanguageParser.MINUS, 0); }
	public primary(): PrimaryContext | undefined {
		return this.tryGetRuleContext(0, PrimaryContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_unaryExpr; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterUnaryExpr) {
			listener.enterUnaryExpr(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitUnaryExpr) {
			listener.exitUnaryExpr(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitUnaryExpr) {
			return visitor.visitUnaryExpr(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class PrimaryContext extends ParserRuleContext {
	public INT(): TerminalNode | undefined { return this.tryGetToken(LanguageParser.INT, 0); }
	public TRUE_KW(): TerminalNode | undefined { return this.tryGetToken(LanguageParser.TRUE_KW, 0); }
	public FALSE_KW(): TerminalNode | undefined { return this.tryGetToken(LanguageParser.FALSE_KW, 0); }
	public NULL_KW(): TerminalNode | undefined { return this.tryGetToken(LanguageParser.NULL_KW, 0); }
	public STRING(): TerminalNode | undefined { return this.tryGetToken(LanguageParser.STRING, 0); }
	public lengthCall(): LengthCallContext | undefined {
		return this.tryGetRuleContext(0, LengthCallContext);
	}
	public callExpr(): CallExprContext | undefined {
		return this.tryGetRuleContext(0, CallExprContext);
	}
	public lvalue(): LvalueContext | undefined {
		return this.tryGetRuleContext(0, LvalueContext);
	}
	public LPAREN(): TerminalNode | undefined { return this.tryGetToken(LanguageParser.LPAREN, 0); }
	public expr(): ExprContext | undefined {
		return this.tryGetRuleContext(0, ExprContext);
	}
	public RPAREN(): TerminalNode | undefined { return this.tryGetToken(LanguageParser.RPAREN, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_primary; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterPrimary) {
			listener.enterPrimary(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitPrimary) {
			listener.exitPrimary(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitPrimary) {
			return visitor.visitPrimary(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class LengthCallContext extends ParserRuleContext {
	public LENGTH_KW(): TerminalNode { return this.getToken(LanguageParser.LENGTH_KW, 0); }
	public LPAREN(): TerminalNode { return this.getToken(LanguageParser.LPAREN, 0); }
	public expr(): ExprContext {
		return this.getRuleContext(0, ExprContext);
	}
	public RPAREN(): TerminalNode { return this.getToken(LanguageParser.RPAREN, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_lengthCall; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterLengthCall) {
			listener.enterLengthCall(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitLengthCall) {
			listener.exitLengthCall(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitLengthCall) {
			return visitor.visitLengthCall(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class CallExprContext extends ParserRuleContext {
	public ID(): TerminalNode { return this.getToken(LanguageParser.ID, 0); }
	public LPAREN(): TerminalNode { return this.getToken(LanguageParser.LPAREN, 0); }
	public RPAREN(): TerminalNode { return this.getToken(LanguageParser.RPAREN, 0); }
	public argList(): ArgListContext | undefined {
		return this.tryGetRuleContext(0, ArgListContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_callExpr; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterCallExpr) {
			listener.enterCallExpr(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitCallExpr) {
			listener.exitCallExpr(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitCallExpr) {
			return visitor.visitCallExpr(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


