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
	public static readonly ID = 41;
	public static readonly INT = 42;
	public static readonly WS = 43;
	public static readonly LINE_COMMENT = 44;
	public static readonly SL_COMMENT = 45;
	public static readonly RULE_program = 0;
	public static readonly RULE_stmt = 1;
	public static readonly RULE_block = 2;
	public static readonly RULE_assignmentStmt = 3;
	public static readonly RULE_declVectorStmt = 4;
	public static readonly RULE_callStmt = 5;
	public static readonly RULE_argList = 6;
	public static readonly RULE_ifStmt = 7;
	public static readonly RULE_whileStmt = 8;
	public static readonly RULE_forStmt = 9;
	public static readonly RULE_lvalue = 10;
	public static readonly RULE_fieldAccess = 11;
	public static readonly RULE_indexSuffix = 12;
	public static readonly RULE_expr = 13;
	public static readonly RULE_orExpr = 14;
	public static readonly RULE_andExpr = 15;
	public static readonly RULE_relExpr = 16;
	public static readonly RULE_addExpr = 17;
	public static readonly RULE_mulExpr = 18;
	public static readonly RULE_unaryExpr = 19;
	public static readonly RULE_primary = 20;
	public static readonly RULE_lengthCall = 21;
	public static readonly RULE_callExpr = 22;
	// tslint:disable:no-trailing-whitespace
	public static readonly ruleNames: string[] = [
		"program", "stmt", "block", "assignmentStmt", "declVectorStmt", "callStmt", 
		"argList", "ifStmt", "whileStmt", "forStmt", "lvalue", "fieldAccess", 
		"indexSuffix", "expr", "orExpr", "andExpr", "relExpr", "addExpr", "mulExpr", 
		"unaryExpr", "primary", "lengthCall", "callExpr",
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
		"DIV_KW", "MOD_KW", "ID", "INT", "WS", "LINE_COMMENT", "SL_COMMENT",
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
			this.state = 49;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while ((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << LanguageParser.LBRACE) | (1 << LanguageParser.SEMI) | (1 << LanguageParser.FOR_KW) | (1 << LanguageParser.WHILE_KW) | (1 << LanguageParser.IF_KW) | (1 << LanguageParser.BEGIN_KW) | (1 << LanguageParser.CALL_KW))) !== 0) || _la === LanguageParser.ID) {
				{
				{
				this.state = 46;
				this.stmt();
				}
				}
				this.state = 51;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 52;
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
	public stmt(): StmtContext {
		let _localctx: StmtContext = new StmtContext(this._ctx, this.state);
		this.enterRule(_localctx, 2, LanguageParser.RULE_stmt);
		try {
			this.state = 62;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 1, this._ctx) ) {
			case 1:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 54;
				this.assignmentStmt();
				}
				break;

			case 2:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 55;
				this.callStmt();
				}
				break;

			case 3:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 56;
				this.ifStmt();
				}
				break;

			case 4:
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 57;
				this.whileStmt();
				}
				break;

			case 5:
				this.enterOuterAlt(_localctx, 5);
				{
				this.state = 58;
				this.forStmt();
				}
				break;

			case 6:
				this.enterOuterAlt(_localctx, 6);
				{
				this.state = 59;
				this.block();
				}
				break;

			case 7:
				this.enterOuterAlt(_localctx, 7);
				{
				this.state = 60;
				this.declVectorStmt();
				}
				break;

			case 8:
				this.enterOuterAlt(_localctx, 8);
				{
				this.state = 61;
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
		this.enterRule(_localctx, 4, LanguageParser.RULE_block);
		let _la: number;
		try {
			this.state = 80;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case LanguageParser.LBRACE:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 64;
				this.match(LanguageParser.LBRACE);
				this.state = 68;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while ((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << LanguageParser.LBRACE) | (1 << LanguageParser.SEMI) | (1 << LanguageParser.FOR_KW) | (1 << LanguageParser.WHILE_KW) | (1 << LanguageParser.IF_KW) | (1 << LanguageParser.BEGIN_KW) | (1 << LanguageParser.CALL_KW))) !== 0) || _la === LanguageParser.ID) {
					{
					{
					this.state = 65;
					this.stmt();
					}
					}
					this.state = 70;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				this.state = 71;
				this.match(LanguageParser.RBRACE);
				}
				break;
			case LanguageParser.BEGIN_KW:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 72;
				this.match(LanguageParser.BEGIN_KW);
				this.state = 76;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while ((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << LanguageParser.LBRACE) | (1 << LanguageParser.SEMI) | (1 << LanguageParser.FOR_KW) | (1 << LanguageParser.WHILE_KW) | (1 << LanguageParser.IF_KW) | (1 << LanguageParser.BEGIN_KW) | (1 << LanguageParser.CALL_KW))) !== 0) || _la === LanguageParser.ID) {
					{
					{
					this.state = 73;
					this.stmt();
					}
					}
					this.state = 78;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				this.state = 79;
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
		this.enterRule(_localctx, 6, LanguageParser.RULE_assignmentStmt);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 82;
			this.lvalue();
			this.state = 83;
			this.match(LanguageParser.ASSIGN);
			this.state = 84;
			this.expr();
			this.state = 86;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 5, this._ctx) ) {
			case 1:
				{
				this.state = 85;
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
		this.enterRule(_localctx, 8, LanguageParser.RULE_declVectorStmt);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 88;
			this.match(LanguageParser.ID);
			this.state = 90;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			do {
				{
				{
				this.state = 89;
				this.indexSuffix();
				}
				}
				this.state = 92;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			} while (_la === LanguageParser.LBRACK);
			this.state = 95;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 7, this._ctx) ) {
			case 1:
				{
				this.state = 94;
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
		this.enterRule(_localctx, 10, LanguageParser.RULE_callStmt);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 97;
			this.match(LanguageParser.CALL_KW);
			this.state = 98;
			this.match(LanguageParser.ID);
			this.state = 99;
			this.match(LanguageParser.LPAREN);
			this.state = 101;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === LanguageParser.LPAREN || _la === LanguageParser.MINUS || ((((_la - 34)) & ~0x1F) === 0 && ((1 << (_la - 34)) & ((1 << (LanguageParser.NOT_KW - 34)) | (1 << (LanguageParser.TRUE_KW - 34)) | (1 << (LanguageParser.FALSE_KW - 34)) | (1 << (LanguageParser.NULL_KW - 34)) | (1 << (LanguageParser.LENGTH_KW - 34)) | (1 << (LanguageParser.ID - 34)) | (1 << (LanguageParser.INT - 34)))) !== 0)) {
				{
				this.state = 100;
				this.argList();
				}
			}

			this.state = 103;
			this.match(LanguageParser.RPAREN);
			this.state = 105;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 9, this._ctx) ) {
			case 1:
				{
				this.state = 104;
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
		this.enterRule(_localctx, 12, LanguageParser.RULE_argList);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 107;
			this.expr();
			this.state = 112;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === LanguageParser.T__0) {
				{
				{
				this.state = 108;
				this.match(LanguageParser.T__0);
				this.state = 109;
				this.expr();
				}
				}
				this.state = 114;
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
	public ifStmt(): IfStmtContext {
		let _localctx: IfStmtContext = new IfStmtContext(this._ctx, this.state);
		this.enterRule(_localctx, 14, LanguageParser.RULE_ifStmt);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 115;
			this.match(LanguageParser.IF_KW);
			this.state = 116;
			this.match(LanguageParser.LPAREN);
			this.state = 117;
			this.expr();
			this.state = 118;
			this.match(LanguageParser.RPAREN);
			this.state = 119;
			this.match(LanguageParser.THEN_KW);
			this.state = 120;
			this.block();
			this.state = 123;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === LanguageParser.ELSE_KW) {
				{
				this.state = 121;
				this.match(LanguageParser.ELSE_KW);
				this.state = 122;
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
		this.enterRule(_localctx, 16, LanguageParser.RULE_whileStmt);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 125;
			this.match(LanguageParser.WHILE_KW);
			this.state = 126;
			this.match(LanguageParser.LPAREN);
			this.state = 127;
			this.expr();
			this.state = 128;
			this.match(LanguageParser.RPAREN);
			this.state = 129;
			this.match(LanguageParser.DO_KW);
			this.state = 130;
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
		this.enterRule(_localctx, 18, LanguageParser.RULE_forStmt);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 132;
			this.match(LanguageParser.FOR_KW);
			this.state = 133;
			this.match(LanguageParser.ID);
			this.state = 134;
			this.match(LanguageParser.ASSIGN);
			this.state = 135;
			this.expr();
			this.state = 136;
			this.match(LanguageParser.TO_KW);
			this.state = 137;
			this.expr();
			this.state = 138;
			this.match(LanguageParser.DO_KW);
			this.state = 139;
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
		this.enterRule(_localctx, 20, LanguageParser.RULE_lvalue);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 141;
			this.match(LanguageParser.ID);
			this.state = 146;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === LanguageParser.T__1 || _la === LanguageParser.LBRACK) {
				{
				this.state = 144;
				this._errHandler.sync(this);
				switch (this._input.LA(1)) {
				case LanguageParser.T__1:
					{
					this.state = 142;
					this.fieldAccess();
					}
					break;
				case LanguageParser.LBRACK:
					{
					this.state = 143;
					this.indexSuffix();
					}
					break;
				default:
					throw new NoViableAltException(this);
				}
				}
				this.state = 148;
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
		this.enterRule(_localctx, 22, LanguageParser.RULE_fieldAccess);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 149;
			this.match(LanguageParser.T__1);
			this.state = 150;
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
		this.enterRule(_localctx, 24, LanguageParser.RULE_indexSuffix);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 152;
			this.match(LanguageParser.LBRACK);
			this.state = 153;
			this.expr();
			this.state = 156;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === LanguageParser.RANGE) {
				{
				this.state = 154;
				this.match(LanguageParser.RANGE);
				this.state = 155;
				this.expr();
				}
			}

			this.state = 158;
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
		this.enterRule(_localctx, 26, LanguageParser.RULE_expr);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 160;
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
		this.enterRule(_localctx, 28, LanguageParser.RULE_orExpr);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 162;
			this.andExpr();
			this.state = 167;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === LanguageParser.OR_KW) {
				{
				{
				this.state = 163;
				this.match(LanguageParser.OR_KW);
				this.state = 164;
				this.andExpr();
				}
				}
				this.state = 169;
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
		this.enterRule(_localctx, 30, LanguageParser.RULE_andExpr);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 170;
			this.relExpr();
			this.state = 175;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === LanguageParser.AND_KW) {
				{
				{
				this.state = 171;
				this.match(LanguageParser.AND_KW);
				this.state = 172;
				this.relExpr();
				}
				}
				this.state = 177;
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
		this.enterRule(_localctx, 32, LanguageParser.RULE_relExpr);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 178;
			this.addExpr();
			this.state = 183;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while ((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << LanguageParser.EQ) | (1 << LanguageParser.NEQ) | (1 << LanguageParser.LE) | (1 << LanguageParser.GE) | (1 << LanguageParser.LT) | (1 << LanguageParser.GT))) !== 0)) {
				{
				{
				this.state = 179;
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
				this.state = 180;
				this.addExpr();
				}
				}
				this.state = 185;
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
		this.enterRule(_localctx, 34, LanguageParser.RULE_addExpr);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 186;
			this.mulExpr();
			this.state = 191;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === LanguageParser.PLUS || _la === LanguageParser.MINUS) {
				{
				{
				this.state = 187;
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
				this.state = 188;
				this.mulExpr();
				}
				}
				this.state = 193;
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
		this.enterRule(_localctx, 36, LanguageParser.RULE_mulExpr);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 194;
			this.unaryExpr();
			this.state = 199;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (((((_la - 14)) & ~0x1F) === 0 && ((1 << (_la - 14)) & ((1 << (LanguageParser.MUL - 14)) | (1 << (LanguageParser.DIVOP - 14)) | (1 << (LanguageParser.DIV_KW - 14)) | (1 << (LanguageParser.MOD_KW - 14)))) !== 0)) {
				{
				{
				this.state = 195;
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
				this.state = 196;
				this.unaryExpr();
				}
				}
				this.state = 201;
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
		this.enterRule(_localctx, 38, LanguageParser.RULE_unaryExpr);
		try {
			this.state = 207;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case LanguageParser.NOT_KW:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 202;
				this.match(LanguageParser.NOT_KW);
				this.state = 203;
				this.unaryExpr();
				}
				break;
			case LanguageParser.MINUS:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 204;
				this.match(LanguageParser.MINUS);
				this.state = 205;
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
				this.state = 206;
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
		this.enterRule(_localctx, 40, LanguageParser.RULE_primary);
		try {
			this.state = 220;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 21, this._ctx) ) {
			case 1:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 209;
				this.match(LanguageParser.INT);
				}
				break;

			case 2:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 210;
				this.match(LanguageParser.TRUE_KW);
				}
				break;

			case 3:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 211;
				this.match(LanguageParser.FALSE_KW);
				}
				break;

			case 4:
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 212;
				this.match(LanguageParser.NULL_KW);
				}
				break;

			case 5:
				this.enterOuterAlt(_localctx, 5);
				{
				this.state = 213;
				this.lengthCall();
				}
				break;

			case 6:
				this.enterOuterAlt(_localctx, 6);
				{
				this.state = 214;
				this.callExpr();
				}
				break;

			case 7:
				this.enterOuterAlt(_localctx, 7);
				{
				this.state = 215;
				this.lvalue();
				}
				break;

			case 8:
				this.enterOuterAlt(_localctx, 8);
				{
				this.state = 216;
				this.match(LanguageParser.LPAREN);
				this.state = 217;
				this.expr();
				this.state = 218;
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
		this.enterRule(_localctx, 42, LanguageParser.RULE_lengthCall);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 222;
			this.match(LanguageParser.LENGTH_KW);
			this.state = 223;
			this.match(LanguageParser.LPAREN);
			this.state = 224;
			this.expr();
			this.state = 225;
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
		this.enterRule(_localctx, 44, LanguageParser.RULE_callExpr);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 227;
			this.match(LanguageParser.ID);
			this.state = 228;
			this.match(LanguageParser.LPAREN);
			this.state = 230;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === LanguageParser.LPAREN || _la === LanguageParser.MINUS || ((((_la - 34)) & ~0x1F) === 0 && ((1 << (_la - 34)) & ((1 << (LanguageParser.NOT_KW - 34)) | (1 << (LanguageParser.TRUE_KW - 34)) | (1 << (LanguageParser.FALSE_KW - 34)) | (1 << (LanguageParser.NULL_KW - 34)) | (1 << (LanguageParser.LENGTH_KW - 34)) | (1 << (LanguageParser.ID - 34)) | (1 << (LanguageParser.INT - 34)))) !== 0)) {
				{
				this.state = 229;
				this.argList();
				}
			}

			this.state = 232;
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
		"\x03\uC91D\uCABA\u058D\uAFBA\u4F53\u0607\uEA8B\uC241\x03/\xED\x04\x02" +
		"\t\x02\x04\x03\t\x03\x04\x04\t\x04\x04\x05\t\x05\x04\x06\t\x06\x04\x07" +
		"\t\x07\x04\b\t\b\x04\t\t\t\x04\n\t\n\x04\v\t\v\x04\f\t\f\x04\r\t\r\x04" +
		"\x0E\t\x0E\x04\x0F\t\x0F\x04\x10\t\x10\x04\x11\t\x11\x04\x12\t\x12\x04" +
		"\x13\t\x13\x04\x14\t\x14\x04\x15\t\x15\x04\x16\t\x16\x04\x17\t\x17\x04" +
		"\x18\t\x18\x03\x02\x07\x022\n\x02\f\x02\x0E\x025\v\x02\x03\x02\x03\x02" +
		"\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03\x05\x03" +
		"A\n\x03\x03\x04\x03\x04\x07\x04E\n\x04\f\x04\x0E\x04H\v\x04\x03\x04\x03" +
		"\x04\x03\x04\x07\x04M\n\x04\f\x04\x0E\x04P\v\x04\x03\x04\x05\x04S\n\x04" +
		"\x03\x05\x03\x05\x03\x05\x03\x05\x05\x05Y\n\x05\x03\x06\x03\x06\x06\x06" +
		"]\n\x06\r\x06\x0E\x06^\x03\x06\x05\x06b\n\x06\x03\x07\x03\x07\x03\x07" +
		"\x03\x07\x05\x07h\n\x07\x03\x07\x03\x07\x05\x07l\n\x07\x03\b\x03\b\x03" +
		"\b\x07\bq\n\b\f\b\x0E\bt\v\b\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t" +
		"\x03\t\x05\t~\n\t\x03\n\x03\n\x03\n\x03\n\x03\n\x03\n\x03\n\x03\v\x03" +
		"\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\f\x03\f\x03\f\x07\f\x93" +
		"\n\f\f\f\x0E\f\x96\v\f\x03\r\x03\r\x03\r\x03\x0E\x03\x0E\x03\x0E\x03\x0E" +
		"\x05\x0E\x9F\n\x0E\x03\x0E\x03\x0E\x03\x0F\x03\x0F\x03\x10\x03\x10\x03" +
		"\x10\x07\x10\xA8\n\x10\f\x10\x0E\x10\xAB\v\x10\x03\x11\x03\x11\x03\x11" +
		"\x07\x11\xB0\n\x11\f\x11\x0E\x11\xB3\v\x11\x03\x12\x03\x12\x03\x12\x07" +
		"\x12\xB8\n\x12\f\x12\x0E\x12\xBB\v\x12\x03\x13\x03\x13\x03\x13\x07\x13" +
		"\xC0\n\x13\f\x13\x0E\x13\xC3\v\x13\x03\x14\x03\x14\x03\x14\x07\x14\xC8" +
		"\n\x14\f\x14\x0E\x14\xCB\v\x14\x03\x15\x03\x15\x03\x15\x03\x15\x03\x15" +
		"\x05\x15\xD2\n\x15\x03\x16\x03\x16\x03\x16\x03\x16\x03\x16\x03\x16\x03" +
		"\x16\x03\x16\x03\x16\x03\x16\x03\x16\x05\x16\xDF\n\x16\x03\x17\x03\x17" +
		"\x03\x17\x03\x17\x03\x17\x03\x18\x03\x18\x03\x18\x05\x18\xE9\n\x18\x03" +
		"\x18\x03\x18\x03\x18\x02\x02\x02\x19\x02\x02\x04\x02\x06\x02\b\x02\n\x02" +
		"\f\x02\x0E\x02\x10\x02\x12\x02\x14\x02\x16\x02\x18\x02\x1A\x02\x1C\x02" +
		"\x1E\x02 \x02\"\x02$\x02&\x02(\x02*\x02,\x02.\x02\x02\x05\x03\x02\x12" +
		"\x17\x03\x02\x0E\x0F\x04\x02\x10\x11)*\x02\xF9\x023\x03\x02\x02\x02\x04" +
		"@\x03\x02\x02\x02\x06R\x03\x02\x02\x02\bT\x03\x02\x02\x02\nZ\x03\x02\x02" +
		"\x02\fc\x03\x02\x02\x02\x0Em\x03\x02\x02\x02\x10u\x03\x02\x02\x02\x12" +
		"\x7F\x03\x02\x02\x02\x14\x86\x03\x02\x02\x02\x16\x8F\x03\x02\x02\x02\x18" +
		"\x97\x03\x02\x02\x02\x1A\x9A\x03\x02\x02\x02\x1C\xA2\x03\x02\x02\x02\x1E" +
		"\xA4\x03\x02\x02\x02 \xAC\x03\x02\x02\x02\"\xB4\x03\x02\x02\x02$\xBC\x03" +
		"\x02\x02\x02&\xC4\x03\x02\x02\x02(\xD1\x03\x02\x02\x02*\xDE\x03\x02\x02" +
		"\x02,\xE0\x03\x02\x02\x02.\xE5\x03\x02\x02\x0202\x05\x04\x03\x0210\x03" +
		"\x02\x02\x0225\x03\x02\x02\x0231\x03\x02\x02\x0234\x03\x02\x02\x0246\x03" +
		"\x02\x02\x0253\x03\x02\x02\x0267\x07\x02\x02\x037\x03\x03\x02\x02\x02" +
		"8A\x05\b\x05\x029A\x05\f\x07\x02:A\x05\x10\t\x02;A\x05\x12\n\x02<A\x05" +
		"\x14\v\x02=A\x05\x06\x04\x02>A\x05\n\x06\x02?A\x07\f\x02\x02@8\x03\x02" +
		"\x02\x02@9\x03\x02\x02\x02@:\x03\x02\x02\x02@;\x03\x02\x02\x02@<\x03\x02" +
		"\x02\x02@=\x03\x02\x02\x02@>\x03\x02\x02\x02@?\x03\x02\x02\x02A\x05\x03" +
		"\x02\x02\x02BF\x07\x07\x02\x02CE\x05\x04\x03\x02DC\x03\x02\x02\x02EH\x03" +
		"\x02\x02\x02FD\x03\x02\x02\x02FG\x03\x02\x02\x02GI\x03\x02\x02\x02HF\x03" +
		"\x02\x02\x02IS\x07\b\x02\x02JN\x07\x1D\x02\x02KM\x05\x04\x03\x02LK\x03" +
		"\x02\x02\x02MP\x03\x02\x02\x02NL\x03\x02\x02\x02NO\x03\x02\x02\x02OQ\x03" +
		"\x02\x02\x02PN\x03\x02\x02\x02QS\x07\x1E\x02\x02RB\x03\x02\x02\x02RJ\x03" +
		"\x02\x02\x02S\x07\x03\x02\x02\x02TU\x05\x16\f\x02UV\x07\r\x02\x02VX\x05" +
		"\x1C\x0F\x02WY\x07\f\x02\x02XW\x03\x02\x02\x02XY\x03\x02\x02\x02Y\t\x03" +
		"\x02\x02\x02Z\\\x07+\x02\x02[]\x05\x1A\x0E\x02\\[\x03\x02\x02\x02]^\x03" +
		"\x02\x02\x02^\\\x03\x02\x02\x02^_\x03\x02\x02\x02_a\x03\x02\x02\x02`b" +
		"\x07\f\x02\x02a`\x03\x02\x02\x02ab\x03\x02\x02\x02b\v\x03\x02\x02\x02" +
		"cd\x07!\x02\x02de\x07+\x02\x02eg\x07\x05\x02\x02fh\x05\x0E\b\x02gf\x03" +
		"\x02\x02\x02gh\x03\x02\x02\x02hi\x03\x02\x02\x02ik\x07\x06\x02\x02jl\x07" +
		"\f\x02\x02kj\x03\x02\x02\x02kl\x03\x02\x02\x02l\r\x03\x02\x02\x02mr\x05" +
		"\x1C\x0F\x02no\x07\x03\x02\x02oq\x05\x1C\x0F\x02pn\x03\x02\x02\x02qt\x03" +
		"\x02\x02\x02rp\x03\x02\x02\x02rs\x03\x02\x02\x02s\x0F\x03\x02\x02\x02" +
		"tr\x03\x02\x02\x02uv\x07\x1A\x02\x02vw\x07\x05\x02\x02wx\x05\x1C\x0F\x02" +
		"xy\x07\x06\x02\x02yz\x07\x1B\x02\x02z}\x05\x06\x04\x02{|\x07\x1C\x02\x02" +
		"|~\x05\x06\x04\x02}{\x03\x02\x02\x02}~\x03\x02\x02\x02~\x11\x03\x02\x02" +
		"\x02\x7F\x80\x07\x19\x02\x02\x80\x81\x07\x05\x02\x02\x81\x82\x05\x1C\x0F" +
		"\x02\x82\x83\x07\x06\x02\x02\x83\x84\x07 \x02\x02\x84\x85\x05\x06\x04" +
		"\x02\x85\x13\x03\x02\x02\x02\x86\x87\x07\x18\x02\x02\x87\x88\x07+\x02" +
		"\x02\x88\x89\x07\r\x02\x02\x89\x8A\x05\x1C\x0F\x02\x8A\x8B\x07\x1F\x02" +
		"\x02\x8B\x8C\x05\x1C\x0F\x02\x8C\x8D\x07 \x02\x02\x8D\x8E\x05\x06\x04" +
		"\x02\x8E\x15\x03\x02\x02\x02\x8F\x94\x07+\x02\x02\x90\x93\x05\x18\r\x02" +
		"\x91\x93\x05\x1A\x0E\x02\x92\x90\x03\x02\x02\x02\x92\x91\x03\x02\x02\x02" +
		"\x93\x96\x03\x02\x02\x02\x94\x92\x03\x02\x02\x02\x94\x95\x03\x02\x02\x02" +
		"\x95\x17\x03\x02\x02\x02\x96\x94\x03\x02\x02\x02\x97\x98\x07\x04\x02\x02" +
		"\x98\x99\x07+\x02\x02\x99\x19\x03\x02\x02\x02\x9A\x9B\x07\t\x02\x02\x9B" +
		"\x9E\x05\x1C\x0F\x02\x9C\x9D\x07\v\x02\x02\x9D\x9F\x05\x1C\x0F\x02\x9E" +
		"\x9C\x03\x02\x02\x02\x9E\x9F\x03\x02\x02\x02\x9F\xA0\x03\x02\x02\x02\xA0" +
		"\xA1\x07\n\x02\x02\xA1\x1B\x03\x02\x02\x02\xA2\xA3\x05\x1E\x10\x02\xA3" +
		"\x1D\x03\x02\x02\x02\xA4\xA9\x05 \x11\x02\xA5\xA6\x07#\x02\x02\xA6\xA8" +
		"\x05 \x11\x02\xA7\xA5\x03\x02\x02\x02\xA8\xAB\x03\x02\x02\x02\xA9\xA7" +
		"\x03\x02\x02\x02\xA9\xAA\x03\x02\x02\x02\xAA\x1F\x03\x02\x02\x02\xAB\xA9" +
		"\x03\x02\x02\x02\xAC\xB1\x05\"\x12\x02\xAD\xAE\x07\"\x02\x02\xAE\xB0\x05" +
		"\"\x12\x02\xAF\xAD\x03\x02\x02\x02\xB0\xB3\x03\x02\x02\x02\xB1\xAF\x03" +
		"\x02\x02\x02\xB1\xB2\x03\x02\x02\x02\xB2!\x03\x02\x02\x02\xB3\xB1\x03" +
		"\x02\x02\x02\xB4\xB9\x05$\x13\x02\xB5\xB6\t\x02\x02\x02\xB6\xB8\x05$\x13" +
		"\x02\xB7\xB5\x03\x02\x02\x02\xB8\xBB\x03\x02\x02\x02\xB9\xB7\x03\x02\x02" +
		"\x02\xB9\xBA\x03\x02\x02\x02\xBA#\x03\x02\x02\x02\xBB\xB9\x03\x02\x02" +
		"\x02\xBC\xC1\x05&\x14\x02\xBD\xBE\t\x03\x02\x02\xBE\xC0\x05&\x14\x02\xBF" +
		"\xBD\x03\x02\x02\x02\xC0\xC3\x03\x02\x02\x02\xC1\xBF\x03\x02\x02\x02\xC1" +
		"\xC2\x03\x02\x02\x02\xC2%\x03\x02\x02\x02\xC3\xC1\x03\x02\x02\x02\xC4" +
		"\xC9\x05(\x15\x02\xC5\xC6\t\x04\x02\x02\xC6\xC8\x05(\x15\x02\xC7\xC5\x03" +
		"\x02\x02\x02\xC8\xCB\x03\x02\x02\x02\xC9\xC7\x03\x02\x02\x02\xC9\xCA\x03" +
		"\x02\x02\x02\xCA\'\x03\x02\x02\x02\xCB\xC9\x03\x02\x02\x02\xCC\xCD\x07" +
		"$\x02\x02\xCD\xD2\x05(\x15\x02\xCE\xCF\x07\x0F\x02\x02\xCF\xD2\x05(\x15" +
		"\x02\xD0\xD2\x05*\x16\x02\xD1\xCC\x03\x02\x02\x02\xD1\xCE\x03\x02\x02" +
		"\x02\xD1\xD0\x03\x02\x02\x02\xD2)\x03\x02\x02\x02\xD3\xDF\x07,\x02\x02" +
		"\xD4\xDF\x07%\x02\x02\xD5\xDF\x07&\x02\x02\xD6\xDF\x07\'\x02\x02\xD7\xDF" +
		"\x05,\x17\x02\xD8\xDF\x05.\x18\x02\xD9\xDF\x05\x16\f\x02\xDA\xDB\x07\x05" +
		"\x02\x02\xDB\xDC\x05\x1C\x0F\x02\xDC\xDD\x07\x06\x02\x02\xDD\xDF\x03\x02" +
		"\x02\x02\xDE\xD3\x03\x02\x02\x02\xDE\xD4\x03\x02\x02\x02\xDE\xD5\x03\x02" +
		"\x02\x02\xDE\xD6\x03\x02\x02\x02\xDE\xD7\x03\x02\x02\x02\xDE\xD8\x03\x02" +
		"\x02\x02\xDE\xD9\x03\x02\x02\x02\xDE\xDA\x03\x02\x02\x02\xDF+\x03\x02" +
		"\x02\x02\xE0\xE1\x07(\x02\x02\xE1\xE2\x07\x05\x02\x02\xE2\xE3\x05\x1C" +
		"\x0F\x02\xE3\xE4\x07\x06\x02\x02\xE4-\x03\x02\x02\x02\xE5\xE6\x07+\x02" +
		"\x02\xE6\xE8\x07\x05\x02\x02\xE7\xE9\x05\x0E\b\x02\xE8\xE7\x03\x02\x02" +
		"\x02\xE8\xE9\x03\x02\x02\x02\xE9\xEA\x03\x02\x02\x02\xEA\xEB\x07\x06\x02" +
		"\x02\xEB/\x03\x02\x02\x02\x193@FNRX^agkr}\x92\x94\x9E\xA9\xB1\xB9\xC1" +
		"\xC9\xD1\xDE\xE8";
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
	public forStmt(): ForStmtContext | undefined {
		return this.tryGetRuleContext(0, ForStmtContext);
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


