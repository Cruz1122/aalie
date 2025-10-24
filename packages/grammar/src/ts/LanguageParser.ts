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
	public static readonly CLASS_KW = 41;
	public static readonly RETURN_KW = 42;
	public static readonly REPEAT_KW = 43;
	public static readonly UNTIL_KW = 44;
	public static readonly ID = 45;
	public static readonly INT = 46;
	public static readonly WS = 47;
	public static readonly LINE_COMMENT = 48;
	public static readonly SL_COMMENT = 49;
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
	public static readonly RULE_argList = 15;
	public static readonly RULE_repeatStmt = 16;
	public static readonly RULE_returnStmt = 17;
	public static readonly RULE_ifStmt = 18;
	public static readonly RULE_whileStmt = 19;
	public static readonly RULE_forStmt = 20;
	public static readonly RULE_lvalue = 21;
	public static readonly RULE_fieldAccess = 22;
	public static readonly RULE_indexSuffix = 23;
	public static readonly RULE_expr = 24;
	public static readonly RULE_orExpr = 25;
	public static readonly RULE_andExpr = 26;
	public static readonly RULE_relExpr = 27;
	public static readonly RULE_addExpr = 28;
	public static readonly RULE_mulExpr = 29;
	public static readonly RULE_unaryExpr = 30;
	public static readonly RULE_primary = 31;
	public static readonly RULE_lengthCall = 32;
	public static readonly RULE_callExpr = 33;
	// tslint:disable:no-trailing-whitespace
	public static readonly ruleNames: string[] = [
		"program", "classDef", "attrList", "procDef", "paramList", "param", "arrayParam", 
		"arrayIndex", "arrayDim", "objectParam", "stmt", "block", "assignmentStmt", 
		"declVectorStmt", "callStmt", "argList", "repeatStmt", "returnStmt", "ifStmt", 
		"whileStmt", "forStmt", "lvalue", "fieldAccess", "indexSuffix", "expr", 
		"orExpr", "andExpr", "relExpr", "addExpr", "mulExpr", "unaryExpr", "primary", 
		"lengthCall", "callExpr",
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
		"DIV_KW", "MOD_KW", "CLASS_KW", "RETURN_KW", "REPEAT_KW", "UNTIL_KW", 
		"ID", "INT", "WS", "LINE_COMMENT", "SL_COMMENT",
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
			this.state = 71;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === LanguageParser.CLASS_KW) {
				{
				{
				this.state = 68;
				this.classDef();
				}
				}
				this.state = 73;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 78;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while ((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << LanguageParser.LBRACE) | (1 << LanguageParser.SEMI) | (1 << LanguageParser.FOR_KW) | (1 << LanguageParser.WHILE_KW) | (1 << LanguageParser.IF_KW) | (1 << LanguageParser.BEGIN_KW) | (1 << LanguageParser.CALL_KW))) !== 0) || ((((_la - 42)) & ~0x1F) === 0 && ((1 << (_la - 42)) & ((1 << (LanguageParser.RETURN_KW - 42)) | (1 << (LanguageParser.REPEAT_KW - 42)) | (1 << (LanguageParser.ID - 42)))) !== 0)) {
				{
				this.state = 76;
				this._errHandler.sync(this);
				switch ( this.interpreter.adaptivePredict(this._input, 1, this._ctx) ) {
				case 1:
					{
					this.state = 74;
					this.procDef();
					}
					break;

				case 2:
					{
					this.state = 75;
					this.stmt();
					}
					break;
				}
				}
				this.state = 80;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 81;
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
			this.state = 83;
			this.match(LanguageParser.CLASS_KW);
			this.state = 84;
			this.match(LanguageParser.ID);
			this.state = 85;
			this.match(LanguageParser.LBRACE);
			this.state = 87;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === LanguageParser.ID) {
				{
				this.state = 86;
				this.attrList();
				}
			}

			this.state = 89;
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
			this.state = 92;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			do {
				{
				{
				this.state = 91;
				this.match(LanguageParser.ID);
				}
				}
				this.state = 94;
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
			this.state = 96;
			this.match(LanguageParser.ID);
			this.state = 97;
			this.match(LanguageParser.LPAREN);
			this.state = 99;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === LanguageParser.ID) {
				{
				this.state = 98;
				this.paramList();
				}
			}

			this.state = 101;
			this.match(LanguageParser.RPAREN);
			this.state = 102;
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
			this.state = 104;
			this.param();
			this.state = 109;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === LanguageParser.T__0) {
				{
				{
				this.state = 105;
				this.match(LanguageParser.T__0);
				this.state = 106;
				this.param();
				}
				}
				this.state = 111;
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
			this.state = 115;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 7, this._ctx) ) {
			case 1:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 112;
				this.arrayParam();
				}
				break;

			case 2:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 113;
				this.objectParam();
				}
				break;

			case 3:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 114;
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
			this.state = 117;
			this.match(LanguageParser.ID);
			this.state = 118;
			this.match(LanguageParser.LBRACK);
			this.state = 119;
			this.arrayIndex();
			this.state = 120;
			this.match(LanguageParser.RBRACK);
			this.state = 126;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === LanguageParser.RANGE) {
				{
				this.state = 121;
				this.match(LanguageParser.RANGE);
				this.state = 122;
				this.match(LanguageParser.LBRACK);
				this.state = 123;
				this.arrayIndex();
				this.state = 124;
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
			this.state = 128;
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
			this.state = 130;
			this.match(LanguageParser.LBRACK);
			this.state = 131;
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
			this.state = 132;
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
			this.state = 134;
			this.match(LanguageParser.ID);
			this.state = 135;
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
			this.state = 147;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 9, this._ctx) ) {
			case 1:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 137;
				this.assignmentStmt();
				}
				break;

			case 2:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 138;
				this.callStmt();
				}
				break;

			case 3:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 139;
				this.ifStmt();
				}
				break;

			case 4:
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 140;
				this.whileStmt();
				}
				break;

			case 5:
				this.enterOuterAlt(_localctx, 5);
				{
				this.state = 141;
				this.repeatStmt();
				}
				break;

			case 6:
				this.enterOuterAlt(_localctx, 6);
				{
				this.state = 142;
				this.forStmt();
				}
				break;

			case 7:
				this.enterOuterAlt(_localctx, 7);
				{
				this.state = 143;
				this.returnStmt();
				}
				break;

			case 8:
				this.enterOuterAlt(_localctx, 8);
				{
				this.state = 144;
				this.block();
				}
				break;

			case 9:
				this.enterOuterAlt(_localctx, 9);
				{
				this.state = 145;
				this.declVectorStmt();
				}
				break;

			case 10:
				this.enterOuterAlt(_localctx, 10);
				{
				this.state = 146;
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
			this.state = 165;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case LanguageParser.LBRACE:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 149;
				this.match(LanguageParser.LBRACE);
				this.state = 153;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while ((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << LanguageParser.LBRACE) | (1 << LanguageParser.SEMI) | (1 << LanguageParser.FOR_KW) | (1 << LanguageParser.WHILE_KW) | (1 << LanguageParser.IF_KW) | (1 << LanguageParser.BEGIN_KW) | (1 << LanguageParser.CALL_KW))) !== 0) || ((((_la - 42)) & ~0x1F) === 0 && ((1 << (_la - 42)) & ((1 << (LanguageParser.RETURN_KW - 42)) | (1 << (LanguageParser.REPEAT_KW - 42)) | (1 << (LanguageParser.ID - 42)))) !== 0)) {
					{
					{
					this.state = 150;
					this.stmt();
					}
					}
					this.state = 155;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				this.state = 156;
				this.match(LanguageParser.RBRACE);
				}
				break;
			case LanguageParser.BEGIN_KW:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 157;
				this.match(LanguageParser.BEGIN_KW);
				this.state = 161;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while ((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << LanguageParser.LBRACE) | (1 << LanguageParser.SEMI) | (1 << LanguageParser.FOR_KW) | (1 << LanguageParser.WHILE_KW) | (1 << LanguageParser.IF_KW) | (1 << LanguageParser.BEGIN_KW) | (1 << LanguageParser.CALL_KW))) !== 0) || ((((_la - 42)) & ~0x1F) === 0 && ((1 << (_la - 42)) & ((1 << (LanguageParser.RETURN_KW - 42)) | (1 << (LanguageParser.REPEAT_KW - 42)) | (1 << (LanguageParser.ID - 42)))) !== 0)) {
					{
					{
					this.state = 158;
					this.stmt();
					}
					}
					this.state = 163;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				this.state = 164;
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
			this.state = 167;
			this.lvalue();
			this.state = 168;
			this.match(LanguageParser.ASSIGN);
			this.state = 169;
			this.expr();
			this.state = 171;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 13, this._ctx) ) {
			case 1:
				{
				this.state = 170;
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
			this.state = 173;
			this.match(LanguageParser.ID);
			this.state = 175;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			do {
				{
				{
				this.state = 174;
				this.indexSuffix();
				}
				}
				this.state = 177;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			} while (_la === LanguageParser.LBRACK);
			this.state = 180;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 15, this._ctx) ) {
			case 1:
				{
				this.state = 179;
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
			this.state = 182;
			this.match(LanguageParser.CALL_KW);
			this.state = 183;
			this.match(LanguageParser.ID);
			this.state = 184;
			this.match(LanguageParser.LPAREN);
			this.state = 186;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === LanguageParser.LPAREN || _la === LanguageParser.MINUS || ((((_la - 34)) & ~0x1F) === 0 && ((1 << (_la - 34)) & ((1 << (LanguageParser.NOT_KW - 34)) | (1 << (LanguageParser.TRUE_KW - 34)) | (1 << (LanguageParser.FALSE_KW - 34)) | (1 << (LanguageParser.NULL_KW - 34)) | (1 << (LanguageParser.LENGTH_KW - 34)) | (1 << (LanguageParser.ID - 34)) | (1 << (LanguageParser.INT - 34)))) !== 0)) {
				{
				this.state = 185;
				this.argList();
				}
			}

			this.state = 188;
			this.match(LanguageParser.RPAREN);
			this.state = 190;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 17, this._ctx) ) {
			case 1:
				{
				this.state = 189;
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
		this.enterRule(_localctx, 30, LanguageParser.RULE_argList);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 192;
			this.expr();
			this.state = 197;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === LanguageParser.T__0) {
				{
				{
				this.state = 193;
				this.match(LanguageParser.T__0);
				this.state = 194;
				this.expr();
				}
				}
				this.state = 199;
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
		this.enterRule(_localctx, 32, LanguageParser.RULE_repeatStmt);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 200;
			this.match(LanguageParser.REPEAT_KW);
			this.state = 202;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			do {
				{
				{
				this.state = 201;
				this.stmt();
				}
				}
				this.state = 204;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			} while ((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << LanguageParser.LBRACE) | (1 << LanguageParser.SEMI) | (1 << LanguageParser.FOR_KW) | (1 << LanguageParser.WHILE_KW) | (1 << LanguageParser.IF_KW) | (1 << LanguageParser.BEGIN_KW) | (1 << LanguageParser.CALL_KW))) !== 0) || ((((_la - 42)) & ~0x1F) === 0 && ((1 << (_la - 42)) & ((1 << (LanguageParser.RETURN_KW - 42)) | (1 << (LanguageParser.REPEAT_KW - 42)) | (1 << (LanguageParser.ID - 42)))) !== 0));
			this.state = 206;
			this.match(LanguageParser.UNTIL_KW);
			this.state = 207;
			this.match(LanguageParser.LPAREN);
			this.state = 208;
			this.expr();
			this.state = 209;
			this.match(LanguageParser.RPAREN);
			this.state = 211;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 20, this._ctx) ) {
			case 1:
				{
				this.state = 210;
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
		this.enterRule(_localctx, 34, LanguageParser.RULE_returnStmt);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 213;
			this.match(LanguageParser.RETURN_KW);
			this.state = 214;
			this.expr();
			this.state = 215;
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
		this.enterRule(_localctx, 36, LanguageParser.RULE_ifStmt);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 217;
			this.match(LanguageParser.IF_KW);
			this.state = 218;
			this.match(LanguageParser.LPAREN);
			this.state = 219;
			this.expr();
			this.state = 220;
			this.match(LanguageParser.RPAREN);
			this.state = 221;
			this.match(LanguageParser.THEN_KW);
			this.state = 222;
			this.block();
			this.state = 225;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === LanguageParser.ELSE_KW) {
				{
				this.state = 223;
				this.match(LanguageParser.ELSE_KW);
				this.state = 224;
				this.block();
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
		this.enterRule(_localctx, 38, LanguageParser.RULE_whileStmt);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 227;
			this.match(LanguageParser.WHILE_KW);
			this.state = 228;
			this.match(LanguageParser.LPAREN);
			this.state = 229;
			this.expr();
			this.state = 230;
			this.match(LanguageParser.RPAREN);
			this.state = 231;
			this.match(LanguageParser.DO_KW);
			this.state = 232;
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
		this.enterRule(_localctx, 40, LanguageParser.RULE_forStmt);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 234;
			this.match(LanguageParser.FOR_KW);
			this.state = 235;
			this.match(LanguageParser.ID);
			this.state = 236;
			this.match(LanguageParser.ASSIGN);
			this.state = 237;
			this.expr();
			this.state = 238;
			this.match(LanguageParser.TO_KW);
			this.state = 239;
			this.expr();
			this.state = 240;
			this.match(LanguageParser.DO_KW);
			this.state = 241;
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
		this.enterRule(_localctx, 42, LanguageParser.RULE_lvalue);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 243;
			this.match(LanguageParser.ID);
			this.state = 248;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === LanguageParser.T__1 || _la === LanguageParser.LBRACK) {
				{
				this.state = 246;
				this._errHandler.sync(this);
				switch (this._input.LA(1)) {
				case LanguageParser.T__1:
					{
					this.state = 244;
					this.fieldAccess();
					}
					break;
				case LanguageParser.LBRACK:
					{
					this.state = 245;
					this.indexSuffix();
					}
					break;
				default:
					throw new NoViableAltException(this);
				}
				}
				this.state = 250;
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
		this.enterRule(_localctx, 44, LanguageParser.RULE_fieldAccess);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 251;
			this.match(LanguageParser.T__1);
			this.state = 252;
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
		this.enterRule(_localctx, 46, LanguageParser.RULE_indexSuffix);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 254;
			this.match(LanguageParser.LBRACK);
			this.state = 255;
			this.expr();
			this.state = 258;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === LanguageParser.RANGE) {
				{
				this.state = 256;
				this.match(LanguageParser.RANGE);
				this.state = 257;
				this.expr();
				}
			}

			this.state = 260;
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
		this.enterRule(_localctx, 48, LanguageParser.RULE_expr);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 262;
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
		this.enterRule(_localctx, 50, LanguageParser.RULE_orExpr);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 264;
			this.andExpr();
			this.state = 269;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === LanguageParser.OR_KW) {
				{
				{
				this.state = 265;
				this.match(LanguageParser.OR_KW);
				this.state = 266;
				this.andExpr();
				}
				}
				this.state = 271;
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
		this.enterRule(_localctx, 52, LanguageParser.RULE_andExpr);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 272;
			this.relExpr();
			this.state = 277;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === LanguageParser.AND_KW) {
				{
				{
				this.state = 273;
				this.match(LanguageParser.AND_KW);
				this.state = 274;
				this.relExpr();
				}
				}
				this.state = 279;
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
		this.enterRule(_localctx, 54, LanguageParser.RULE_relExpr);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 280;
			this.addExpr();
			this.state = 285;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while ((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << LanguageParser.EQ) | (1 << LanguageParser.NEQ) | (1 << LanguageParser.LE) | (1 << LanguageParser.GE) | (1 << LanguageParser.LT) | (1 << LanguageParser.GT))) !== 0)) {
				{
				{
				this.state = 281;
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
				this.state = 282;
				this.addExpr();
				}
				}
				this.state = 287;
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
		this.enterRule(_localctx, 56, LanguageParser.RULE_addExpr);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 288;
			this.mulExpr();
			this.state = 293;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === LanguageParser.PLUS || _la === LanguageParser.MINUS) {
				{
				{
				this.state = 289;
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
				this.state = 290;
				this.mulExpr();
				}
				}
				this.state = 295;
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
		this.enterRule(_localctx, 58, LanguageParser.RULE_mulExpr);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 296;
			this.unaryExpr();
			this.state = 301;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (((((_la - 14)) & ~0x1F) === 0 && ((1 << (_la - 14)) & ((1 << (LanguageParser.MUL - 14)) | (1 << (LanguageParser.DIVOP - 14)) | (1 << (LanguageParser.DIV_KW - 14)) | (1 << (LanguageParser.MOD_KW - 14)))) !== 0)) {
				{
				{
				this.state = 297;
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
				this.state = 298;
				this.unaryExpr();
				}
				}
				this.state = 303;
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
		this.enterRule(_localctx, 60, LanguageParser.RULE_unaryExpr);
		try {
			this.state = 309;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case LanguageParser.NOT_KW:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 304;
				this.match(LanguageParser.NOT_KW);
				this.state = 305;
				this.unaryExpr();
				}
				break;
			case LanguageParser.MINUS:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 306;
				this.match(LanguageParser.MINUS);
				this.state = 307;
				this.unaryExpr();
				}
				break;
			case LanguageParser.LPAREN:
			case LanguageParser.TRUE_KW:
			case LanguageParser.FALSE_KW:
			case LanguageParser.NULL_KW:
			case LanguageParser.LENGTH_KW:
			case LanguageParser.ID:
			case LanguageParser.INT:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 308;
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
		this.enterRule(_localctx, 62, LanguageParser.RULE_primary);
		try {
			this.state = 322;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 31, this._ctx) ) {
			case 1:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 311;
				this.match(LanguageParser.INT);
				}
				break;

			case 2:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 312;
				this.match(LanguageParser.TRUE_KW);
				}
				break;

			case 3:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 313;
				this.match(LanguageParser.FALSE_KW);
				}
				break;

			case 4:
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 314;
				this.match(LanguageParser.NULL_KW);
				}
				break;

			case 5:
				this.enterOuterAlt(_localctx, 5);
				{
				this.state = 315;
				this.lengthCall();
				}
				break;

			case 6:
				this.enterOuterAlt(_localctx, 6);
				{
				this.state = 316;
				this.callExpr();
				}
				break;

			case 7:
				this.enterOuterAlt(_localctx, 7);
				{
				this.state = 317;
				this.lvalue();
				}
				break;

			case 8:
				this.enterOuterAlt(_localctx, 8);
				{
				this.state = 318;
				this.match(LanguageParser.LPAREN);
				this.state = 319;
				this.expr();
				this.state = 320;
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
		this.enterRule(_localctx, 64, LanguageParser.RULE_lengthCall);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 324;
			this.match(LanguageParser.LENGTH_KW);
			this.state = 325;
			this.match(LanguageParser.LPAREN);
			this.state = 326;
			this.expr();
			this.state = 327;
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
		this.enterRule(_localctx, 66, LanguageParser.RULE_callExpr);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 329;
			this.match(LanguageParser.ID);
			this.state = 330;
			this.match(LanguageParser.LPAREN);
			this.state = 332;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === LanguageParser.LPAREN || _la === LanguageParser.MINUS || ((((_la - 34)) & ~0x1F) === 0 && ((1 << (_la - 34)) & ((1 << (LanguageParser.NOT_KW - 34)) | (1 << (LanguageParser.TRUE_KW - 34)) | (1 << (LanguageParser.FALSE_KW - 34)) | (1 << (LanguageParser.NULL_KW - 34)) | (1 << (LanguageParser.LENGTH_KW - 34)) | (1 << (LanguageParser.ID - 34)) | (1 << (LanguageParser.INT - 34)))) !== 0)) {
				{
				this.state = 331;
				this.argList();
				}
			}

			this.state = 334;
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
		"\x03\uC91D\uCABA\u058D\uAFBA\u4F53\u0607\uEA8B\uC241\x033\u0153\x04\x02" +
		"\t\x02\x04\x03\t\x03\x04\x04\t\x04\x04\x05\t\x05\x04\x06\t\x06\x04\x07" +
		"\t\x07\x04\b\t\b\x04\t\t\t\x04\n\t\n\x04\v\t\v\x04\f\t\f\x04\r\t\r\x04" +
		"\x0E\t\x0E\x04\x0F\t\x0F\x04\x10\t\x10\x04\x11\t\x11\x04\x12\t\x12\x04" +
		"\x13\t\x13\x04\x14\t\x14\x04\x15\t\x15\x04\x16\t\x16\x04\x17\t\x17\x04" +
		"\x18\t\x18\x04\x19\t\x19\x04\x1A\t\x1A\x04\x1B\t\x1B\x04\x1C\t\x1C\x04" +
		"\x1D\t\x1D\x04\x1E\t\x1E\x04\x1F\t\x1F\x04 \t \x04!\t!\x04\"\t\"\x04#" +
		"\t#\x03\x02\x07\x02H\n\x02\f\x02\x0E\x02K\v\x02\x03\x02\x03\x02\x07\x02" +
		"O\n\x02\f\x02\x0E\x02R\v\x02\x03\x02\x03\x02\x03\x03\x03\x03\x03\x03\x03" +
		"\x03\x05\x03Z\n\x03\x03\x03\x03\x03\x03\x04\x06\x04_\n\x04\r\x04\x0E\x04" +
		"`\x03\x05\x03\x05\x03\x05\x05\x05f\n\x05\x03\x05\x03\x05\x03\x05\x03\x06" +
		"\x03\x06\x03\x06\x07\x06n\n\x06\f\x06\x0E\x06q\v\x06\x03\x07\x03\x07\x03" +
		"\x07\x05\x07v\n\x07\x03\b\x03\b\x03\b\x03\b\x03\b\x03\b\x03\b\x03\b\x03" +
		"\b\x05\b\x81\n\b\x03\t\x03\t\x03\n\x03\n\x03\n\x03\n\x03\v\x03\v\x03\v" +
		"\x03\f\x03\f\x03\f\x03\f\x03\f\x03\f\x03\f\x03\f\x03\f\x03\f\x05\f\x96" +
		"\n\f\x03\r\x03\r\x07\r\x9A\n\r\f\r\x0E\r\x9D\v\r\x03\r\x03\r\x03\r\x07" +
		"\r\xA2\n\r\f\r\x0E\r\xA5\v\r\x03\r\x05\r\xA8\n\r\x03\x0E\x03\x0E\x03\x0E" +
		"\x03\x0E\x05\x0E\xAE\n\x0E\x03\x0F\x03\x0F\x06\x0F\xB2\n\x0F\r\x0F\x0E" +
		"\x0F\xB3\x03\x0F\x05\x0F\xB7\n\x0F\x03\x10\x03\x10\x03\x10\x03\x10\x05" +
		"\x10\xBD\n\x10\x03\x10\x03\x10\x05\x10\xC1\n\x10\x03\x11\x03\x11\x03\x11" +
		"\x07\x11\xC6\n\x11\f\x11\x0E\x11\xC9\v\x11\x03\x12\x03\x12\x06\x12\xCD" +
		"\n\x12\r\x12\x0E\x12\xCE\x03\x12\x03\x12\x03\x12\x03\x12\x03\x12\x05\x12" +
		"\xD6\n\x12\x03\x13\x03\x13\x03\x13\x03\x13\x03\x14\x03\x14\x03\x14\x03" +
		"\x14\x03\x14\x03\x14\x03\x14\x03\x14\x05\x14\xE4\n\x14\x03\x15\x03\x15" +
		"\x03\x15\x03\x15\x03\x15\x03\x15\x03\x15\x03\x16\x03\x16\x03\x16\x03\x16" +
		"\x03\x16\x03\x16\x03\x16\x03\x16\x03\x16\x03\x17\x03\x17\x03\x17\x07\x17" +
		"\xF9\n\x17\f\x17\x0E\x17\xFC\v\x17\x03\x18\x03\x18\x03\x18\x03\x19\x03" +
		"\x19\x03\x19\x03\x19\x05\x19\u0105\n\x19\x03\x19\x03\x19\x03\x1A\x03\x1A" +
		"\x03\x1B\x03\x1B\x03\x1B\x07\x1B\u010E\n\x1B\f\x1B\x0E\x1B\u0111\v\x1B" +
		"\x03\x1C\x03\x1C\x03\x1C\x07\x1C\u0116\n\x1C\f\x1C\x0E\x1C\u0119\v\x1C" +
		"\x03\x1D\x03\x1D\x03\x1D\x07\x1D\u011E\n\x1D\f\x1D\x0E\x1D\u0121\v\x1D" +
		"\x03\x1E\x03\x1E\x03\x1E\x07\x1E\u0126\n\x1E\f\x1E\x0E\x1E\u0129\v\x1E" +
		"\x03\x1F\x03\x1F\x03\x1F\x07\x1F\u012E\n\x1F\f\x1F\x0E\x1F\u0131\v\x1F" +
		"\x03 \x03 \x03 \x03 \x03 \x05 \u0138\n \x03!\x03!\x03!\x03!\x03!\x03!" +
		"\x03!\x03!\x03!\x03!\x03!\x05!\u0145\n!\x03\"\x03\"\x03\"\x03\"\x03\"" +
		"\x03#\x03#\x03#\x05#\u014F\n#\x03#\x03#\x03#\x02\x02\x02$\x02\x02\x04" +
		"\x02\x06\x02\b\x02\n\x02\f\x02\x0E\x02\x10\x02\x12\x02\x14\x02\x16\x02" +
		"\x18\x02\x1A\x02\x1C\x02\x1E\x02 \x02\"\x02$\x02&\x02(\x02*\x02,\x02." +
		"\x020\x022\x024\x026\x028\x02:\x02<\x02>\x02@\x02B\x02D\x02\x02\x06\x03" +
		"\x02/0\x03\x02\x12\x17\x03\x02\x0E\x0F\x04\x02\x10\x11)*\x02\u0161\x02" +
		"I\x03\x02\x02\x02\x04U\x03\x02\x02\x02\x06^\x03\x02\x02\x02\bb\x03\x02" +
		"\x02\x02\nj\x03\x02\x02\x02\fu\x03\x02\x02\x02\x0Ew\x03\x02\x02\x02\x10" +
		"\x82\x03\x02\x02\x02\x12\x84\x03\x02\x02\x02\x14\x88\x03\x02\x02\x02\x16" +
		"\x95\x03\x02\x02\x02\x18\xA7\x03\x02\x02\x02\x1A\xA9\x03\x02\x02\x02\x1C" +
		"\xAF\x03\x02\x02\x02\x1E\xB8\x03\x02\x02\x02 \xC2\x03\x02\x02\x02\"\xCA" +
		"\x03\x02\x02\x02$\xD7\x03\x02\x02\x02&\xDB\x03\x02\x02\x02(\xE5\x03\x02" +
		"\x02\x02*\xEC\x03\x02\x02\x02,\xF5\x03\x02\x02\x02.\xFD\x03\x02\x02\x02" +
		"0\u0100\x03\x02\x02\x022\u0108\x03\x02\x02\x024\u010A\x03\x02\x02\x02" +
		"6\u0112\x03\x02\x02\x028\u011A\x03\x02\x02\x02:\u0122\x03\x02\x02\x02" +
		"<\u012A\x03\x02\x02\x02>\u0137\x03\x02\x02\x02@\u0144\x03\x02\x02\x02" +
		"B\u0146\x03\x02\x02\x02D\u014B\x03\x02\x02\x02FH\x05\x04\x03\x02GF\x03" +
		"\x02\x02\x02HK\x03\x02\x02\x02IG\x03\x02\x02\x02IJ\x03\x02\x02\x02JP\x03" +
		"\x02\x02\x02KI\x03\x02\x02\x02LO\x05\b\x05\x02MO\x05\x16\f\x02NL\x03\x02" +
		"\x02\x02NM\x03\x02\x02\x02OR\x03\x02\x02\x02PN\x03\x02\x02\x02PQ\x03\x02" +
		"\x02\x02QS\x03\x02\x02\x02RP\x03\x02\x02\x02ST\x07\x02\x02\x03T\x03\x03" +
		"\x02\x02\x02UV\x07+\x02\x02VW\x07/\x02\x02WY\x07\x07\x02\x02XZ\x05\x06" +
		"\x04\x02YX\x03\x02\x02\x02YZ\x03\x02\x02\x02Z[\x03\x02\x02\x02[\\\x07" +
		"\b\x02\x02\\\x05\x03\x02\x02\x02]_\x07/\x02\x02^]\x03\x02\x02\x02_`\x03" +
		"\x02\x02\x02`^\x03\x02\x02\x02`a\x03\x02\x02\x02a\x07\x03\x02\x02\x02" +
		"bc\x07/\x02\x02ce\x07\x05\x02\x02df\x05\n\x06\x02ed\x03\x02\x02\x02ef" +
		"\x03\x02\x02\x02fg\x03\x02\x02\x02gh\x07\x06\x02\x02hi\x05\x18\r\x02i" +
		"\t\x03\x02\x02\x02jo\x05\f\x07\x02kl\x07\x03\x02\x02ln\x05\f\x07\x02m" +
		"k\x03\x02\x02\x02nq\x03\x02\x02\x02om\x03\x02\x02\x02op\x03\x02\x02\x02" +
		"p\v\x03\x02\x02\x02qo\x03\x02\x02\x02rv\x05\x0E\b\x02sv\x05\x14\v\x02" +
		"tv\x07/\x02\x02ur\x03\x02\x02\x02us\x03\x02\x02\x02ut\x03\x02\x02\x02" +
		"v\r\x03\x02\x02\x02wx\x07/\x02\x02xy\x07\t\x02\x02yz\x05\x10\t\x02z\x80" +
		"\x07\n\x02\x02{|\x07\v\x02\x02|}\x07\t\x02\x02}~\x05\x10\t\x02~\x7F\x07" +
		"\n\x02\x02\x7F\x81\x03\x02\x02\x02\x80{\x03\x02\x02\x02\x80\x81\x03\x02" +
		"\x02\x02\x81\x0F\x03\x02\x02\x02\x82\x83\t\x02\x02\x02\x83\x11\x03\x02" +
		"\x02\x02\x84\x85\x07\t\x02\x02\x85\x86\t\x02\x02\x02\x86\x87\x07\n\x02" +
		"\x02\x87\x13\x03\x02\x02\x02\x88\x89\x07/\x02\x02\x89\x8A\x07/\x02\x02" +
		"\x8A\x15\x03\x02\x02\x02\x8B\x96\x05\x1A\x0E\x02\x8C\x96\x05\x1E\x10\x02" +
		"\x8D\x96\x05&\x14\x02\x8E\x96\x05(\x15\x02\x8F\x96\x05\"\x12\x02\x90\x96" +
		"\x05*\x16\x02\x91\x96\x05$\x13\x02\x92\x96\x05\x18\r\x02\x93\x96\x05\x1C" +
		"\x0F\x02\x94\x96\x07\f\x02\x02\x95\x8B\x03\x02\x02\x02\x95\x8C\x03\x02" +
		"\x02\x02\x95\x8D\x03\x02\x02\x02\x95\x8E\x03\x02\x02\x02\x95\x8F\x03\x02" +
		"\x02\x02\x95\x90\x03\x02\x02\x02\x95\x91\x03\x02\x02\x02\x95\x92\x03\x02" +
		"\x02\x02\x95\x93\x03\x02\x02\x02\x95\x94\x03\x02\x02\x02\x96\x17\x03\x02" +
		"\x02\x02\x97\x9B\x07\x07\x02\x02\x98\x9A\x05\x16\f\x02\x99\x98\x03\x02" +
		"\x02\x02\x9A\x9D\x03\x02\x02\x02\x9B\x99\x03\x02\x02\x02\x9B\x9C\x03\x02" +
		"\x02\x02\x9C\x9E\x03\x02\x02\x02\x9D\x9B\x03\x02\x02\x02\x9E\xA8\x07\b" +
		"\x02\x02\x9F\xA3\x07\x1D\x02\x02\xA0\xA2\x05\x16\f\x02\xA1\xA0\x03\x02" +
		"\x02\x02\xA2\xA5\x03\x02\x02\x02\xA3\xA1\x03\x02\x02\x02\xA3\xA4\x03\x02" +
		"\x02\x02\xA4\xA6\x03\x02\x02\x02\xA5\xA3\x03\x02\x02\x02\xA6\xA8\x07\x1E" +
		"\x02\x02\xA7\x97\x03\x02\x02\x02\xA7\x9F\x03\x02\x02\x02\xA8\x19\x03\x02" +
		"\x02\x02\xA9\xAA\x05,\x17\x02\xAA\xAB\x07\r\x02\x02\xAB\xAD\x052\x1A\x02" +
		"\xAC\xAE\x07\f\x02\x02\xAD\xAC\x03\x02\x02\x02\xAD\xAE\x03\x02\x02\x02" +
		"\xAE\x1B\x03\x02\x02\x02\xAF\xB1\x07/\x02\x02\xB0\xB2\x050\x19\x02\xB1" +
		"\xB0\x03\x02\x02\x02\xB2\xB3\x03\x02\x02\x02\xB3\xB1\x03\x02\x02\x02\xB3" +
		"\xB4\x03\x02\x02\x02\xB4\xB6\x03\x02\x02\x02\xB5\xB7\x07\f\x02\x02\xB6" +
		"\xB5\x03\x02\x02\x02\xB6\xB7\x03\x02\x02\x02\xB7\x1D\x03\x02\x02\x02\xB8" +
		"\xB9\x07!\x02\x02\xB9\xBA\x07/\x02\x02\xBA\xBC\x07\x05\x02\x02\xBB\xBD" +
		"\x05 \x11\x02\xBC\xBB\x03\x02\x02\x02\xBC\xBD\x03\x02\x02\x02\xBD\xBE" +
		"\x03\x02\x02\x02\xBE\xC0\x07\x06\x02\x02\xBF\xC1\x07\f\x02\x02\xC0\xBF" +
		"\x03\x02\x02\x02\xC0\xC1\x03\x02\x02\x02\xC1\x1F\x03\x02\x02\x02\xC2\xC7" +
		"\x052\x1A\x02\xC3\xC4\x07\x03\x02\x02\xC4\xC6\x052\x1A\x02\xC5\xC3\x03" +
		"\x02\x02\x02\xC6\xC9\x03\x02\x02\x02\xC7\xC5\x03\x02\x02\x02\xC7\xC8\x03" +
		"\x02\x02\x02\xC8!\x03\x02\x02\x02\xC9\xC7\x03\x02\x02\x02\xCA\xCC\x07" +
		"-\x02\x02\xCB\xCD\x05\x16\f\x02\xCC\xCB\x03\x02\x02\x02\xCD\xCE\x03\x02" +
		"\x02\x02\xCE\xCC\x03\x02\x02\x02\xCE\xCF\x03\x02\x02\x02\xCF\xD0\x03\x02" +
		"\x02\x02\xD0\xD1\x07.\x02\x02\xD1\xD2\x07\x05\x02\x02\xD2\xD3\x052\x1A" +
		"\x02\xD3\xD5\x07\x06\x02\x02\xD4\xD6\x07\f\x02\x02\xD5\xD4\x03\x02\x02" +
		"\x02\xD5\xD6\x03\x02\x02\x02\xD6#\x03\x02\x02\x02\xD7\xD8\x07,\x02\x02" +
		"\xD8\xD9\x052\x1A\x02\xD9\xDA\x07\f\x02\x02\xDA%\x03\x02\x02\x02\xDB\xDC" +
		"\x07\x1A\x02\x02\xDC\xDD\x07\x05\x02\x02\xDD\xDE\x052\x1A\x02\xDE\xDF" +
		"\x07\x06\x02\x02\xDF\xE0\x07\x1B\x02\x02\xE0\xE3\x05\x18\r\x02\xE1\xE2" +
		"\x07\x1C\x02\x02\xE2\xE4\x05\x18\r\x02\xE3\xE1\x03\x02\x02\x02\xE3\xE4" +
		"\x03\x02\x02\x02\xE4\'\x03\x02\x02\x02\xE5\xE6\x07\x19\x02\x02\xE6\xE7" +
		"\x07\x05\x02\x02\xE7\xE8\x052\x1A\x02\xE8\xE9\x07\x06\x02\x02\xE9\xEA" +
		"\x07 \x02\x02\xEA\xEB\x05\x18\r\x02\xEB)\x03\x02\x02\x02\xEC\xED\x07\x18" +
		"\x02\x02\xED\xEE\x07/\x02\x02\xEE\xEF\x07\r\x02\x02\xEF\xF0\x052\x1A\x02" +
		"\xF0\xF1\x07\x1F\x02\x02\xF1\xF2\x052\x1A\x02\xF2\xF3\x07 \x02\x02\xF3" +
		"\xF4\x05\x18\r\x02\xF4+\x03\x02\x02\x02\xF5\xFA\x07/\x02\x02\xF6\xF9\x05" +
		".\x18\x02\xF7\xF9\x050\x19\x02\xF8\xF6\x03\x02\x02\x02\xF8\xF7\x03\x02" +
		"\x02\x02\xF9\xFC\x03\x02\x02\x02\xFA\xF8\x03\x02\x02\x02\xFA\xFB\x03\x02" +
		"\x02\x02\xFB-\x03\x02\x02\x02\xFC\xFA\x03\x02\x02\x02\xFD\xFE\x07\x04" +
		"\x02\x02\xFE\xFF\x07/\x02\x02\xFF/\x03\x02\x02\x02\u0100\u0101\x07\t\x02" +
		"\x02\u0101\u0104\x052\x1A\x02\u0102\u0103\x07\v\x02\x02\u0103\u0105\x05" +
		"2\x1A\x02\u0104\u0102\x03\x02\x02\x02\u0104\u0105\x03\x02\x02\x02\u0105" +
		"\u0106\x03\x02\x02\x02\u0106\u0107\x07\n\x02\x02\u01071\x03\x02\x02\x02" +
		"\u0108\u0109\x054\x1B\x02\u01093\x03\x02\x02\x02\u010A\u010F\x056\x1C" +
		"\x02\u010B\u010C\x07#\x02\x02\u010C\u010E\x056\x1C\x02\u010D\u010B\x03" +
		"\x02\x02\x02\u010E\u0111\x03\x02\x02\x02\u010F\u010D\x03\x02\x02\x02\u010F" +
		"\u0110\x03\x02\x02\x02\u01105\x03\x02\x02\x02\u0111\u010F\x03\x02\x02" +
		"\x02\u0112\u0117\x058\x1D\x02\u0113\u0114\x07\"\x02\x02\u0114\u0116\x05" +
		"8\x1D\x02\u0115\u0113\x03\x02\x02\x02\u0116\u0119\x03\x02\x02\x02\u0117" +
		"\u0115\x03\x02\x02\x02\u0117\u0118\x03\x02\x02\x02\u01187\x03\x02\x02" +
		"\x02\u0119\u0117\x03\x02\x02\x02\u011A\u011F\x05:\x1E\x02\u011B\u011C" +
		"\t\x03\x02\x02\u011C\u011E\x05:\x1E\x02\u011D\u011B\x03\x02\x02\x02\u011E" +
		"\u0121\x03\x02\x02\x02\u011F\u011D\x03\x02\x02\x02\u011F\u0120\x03\x02" +
		"\x02\x02\u01209\x03\x02\x02\x02\u0121\u011F\x03\x02\x02\x02\u0122\u0127" +
		"\x05<\x1F\x02\u0123\u0124\t\x04\x02\x02\u0124\u0126\x05<\x1F\x02\u0125" +
		"\u0123\x03\x02\x02\x02\u0126\u0129\x03\x02\x02\x02\u0127\u0125\x03\x02" +
		"\x02\x02\u0127\u0128\x03\x02\x02\x02\u0128;\x03\x02\x02\x02\u0129\u0127" +
		"\x03\x02\x02\x02\u012A\u012F\x05> \x02\u012B\u012C\t\x05\x02\x02\u012C" +
		"\u012E\x05> \x02\u012D\u012B\x03\x02\x02\x02\u012E\u0131\x03\x02\x02\x02" +
		"\u012F\u012D\x03\x02\x02\x02\u012F\u0130\x03\x02\x02\x02\u0130=\x03\x02" +
		"\x02\x02\u0131\u012F\x03\x02\x02\x02\u0132\u0133\x07$\x02\x02\u0133\u0138" +
		"\x05> \x02\u0134\u0135\x07\x0F\x02\x02\u0135\u0138\x05> \x02\u0136\u0138" +
		"\x05@!\x02\u0137\u0132\x03\x02\x02\x02\u0137\u0134\x03\x02\x02\x02\u0137" +
		"\u0136\x03\x02\x02\x02\u0138?\x03\x02\x02\x02\u0139\u0145\x070\x02\x02" +
		"\u013A\u0145\x07%\x02\x02\u013B\u0145\x07&\x02\x02\u013C\u0145\x07\'\x02" +
		"\x02\u013D\u0145\x05B\"\x02\u013E\u0145\x05D#\x02\u013F\u0145\x05,\x17" +
		"\x02\u0140\u0141\x07\x05\x02\x02\u0141\u0142\x052\x1A\x02\u0142\u0143" +
		"\x07\x06\x02\x02\u0143\u0145\x03\x02\x02\x02\u0144\u0139\x03\x02\x02\x02" +
		"\u0144\u013A\x03\x02\x02\x02\u0144\u013B\x03\x02\x02\x02\u0144\u013C\x03" +
		"\x02\x02\x02\u0144\u013D\x03\x02\x02\x02\u0144\u013E\x03\x02\x02\x02\u0144" +
		"\u013F\x03\x02\x02\x02\u0144\u0140\x03\x02\x02\x02\u0145A\x03\x02\x02" +
		"\x02\u0146\u0147\x07(\x02\x02\u0147\u0148\x07\x05\x02\x02\u0148\u0149" +
		"\x052\x1A\x02\u0149\u014A\x07\x06\x02\x02\u014AC\x03\x02\x02\x02\u014B" +
		"\u014C\x07/\x02\x02\u014C\u014E\x07\x05\x02\x02\u014D\u014F\x05 \x11\x02" +
		"\u014E\u014D\x03\x02\x02\x02\u014E\u014F\x03\x02\x02\x02\u014F\u0150\x03" +
		"\x02\x02\x02\u0150\u0151\x07\x06\x02\x02\u0151E\x03\x02\x02\x02#INPY`" +
		"eou\x80\x95\x9B\xA3\xA7\xAD\xB3\xB6\xBC\xC0\xC7\xCE\xD5\xE3\xF8\xFA\u0104" +
		"\u010F\u0117\u011F\u0127\u012F\u0137\u0144\u014E";
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


