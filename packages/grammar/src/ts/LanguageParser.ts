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
	public static readonly T__2 = 3;
	public static readonly T__3 = 4;
	public static readonly T__4 = 5;
	public static readonly T__5 = 6;
	public static readonly T__6 = 7;
	public static readonly T__7 = 8;
	public static readonly T__8 = 9;
	public static readonly T__9 = 10;
	public static readonly T__10 = 11;
	public static readonly T__11 = 12;
	public static readonly T__12 = 13;
	public static readonly T__13 = 14;
	public static readonly T__14 = 15;
	public static readonly ArrayAccess = 16;
	public static readonly Identifier = 17;
	public static readonly Number = 18;
	public static readonly WS = 19;
	public static readonly RULE_program = 0;
	public static readonly RULE_functionDecl = 1;
	public static readonly RULE_block = 2;
	public static readonly RULE_statement = 3;
	public static readonly RULE_variableDecl = 4;
	public static readonly RULE_forStmt = 5;
	public static readonly RULE_returnStmt = 6;
	public static readonly RULE_assign = 7;
	public static readonly RULE_expr = 8;
	// tslint:disable:no-trailing-whitespace
	public static readonly ruleNames: string[] = [
		"program", "functionDecl", "block", "statement", "variableDecl", "forStmt", 
		"returnStmt", "assign", "expr",
	];

	private static readonly _LITERAL_NAMES: Array<string | undefined> = [
		undefined, "'function'", "'('", "','", "')'", "'{'", "'}'", "';'", "'let'", 
		"'='", "'for'", "'return'", "'+'", "'-'", "'*'", "'/'",
	];
	private static readonly _SYMBOLIC_NAMES: Array<string | undefined> = [
		undefined, undefined, undefined, undefined, undefined, undefined, undefined, 
		undefined, undefined, undefined, undefined, undefined, undefined, undefined, 
		undefined, undefined, "ArrayAccess", "Identifier", "Number", "WS",
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
			this.state = 21;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === LanguageParser.T__0) {
				{
				{
				this.state = 18;
				this.functionDecl();
				}
				}
				this.state = 23;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 24;
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
	public functionDecl(): FunctionDeclContext {
		let _localctx: FunctionDeclContext = new FunctionDeclContext(this._ctx, this.state);
		this.enterRule(_localctx, 2, LanguageParser.RULE_functionDecl);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 26;
			this.match(LanguageParser.T__0);
			this.state = 27;
			this.match(LanguageParser.Identifier);
			this.state = 28;
			this.match(LanguageParser.T__1);
			this.state = 37;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === LanguageParser.Identifier) {
				{
				this.state = 29;
				this.match(LanguageParser.Identifier);
				this.state = 34;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while (_la === LanguageParser.T__2) {
					{
					{
					this.state = 30;
					this.match(LanguageParser.T__2);
					this.state = 31;
					this.match(LanguageParser.Identifier);
					}
					}
					this.state = 36;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				}
			}

			this.state = 39;
			this.match(LanguageParser.T__3);
			this.state = 40;
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
	public block(): BlockContext {
		let _localctx: BlockContext = new BlockContext(this._ctx, this.state);
		this.enterRule(_localctx, 4, LanguageParser.RULE_block);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 42;
			this.match(LanguageParser.T__4);
			this.state = 46;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while ((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << LanguageParser.T__7) | (1 << LanguageParser.T__9) | (1 << LanguageParser.T__10))) !== 0)) {
				{
				{
				this.state = 43;
				this.statement();
				}
				}
				this.state = 48;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 49;
			this.match(LanguageParser.T__5);
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
	public statement(): StatementContext {
		let _localctx: StatementContext = new StatementContext(this._ctx, this.state);
		this.enterRule(_localctx, 6, LanguageParser.RULE_statement);
		try {
			this.state = 58;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case LanguageParser.T__7:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 51;
				this.variableDecl();
				this.state = 52;
				this.match(LanguageParser.T__6);
				}
				break;
			case LanguageParser.T__9:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 54;
				this.forStmt();
				}
				break;
			case LanguageParser.T__10:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 55;
				this.returnStmt();
				this.state = 56;
				this.match(LanguageParser.T__6);
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
	public variableDecl(): VariableDeclContext {
		let _localctx: VariableDeclContext = new VariableDeclContext(this._ctx, this.state);
		this.enterRule(_localctx, 8, LanguageParser.RULE_variableDecl);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 60;
			this.match(LanguageParser.T__7);
			this.state = 61;
			this.match(LanguageParser.Identifier);
			this.state = 62;
			this.match(LanguageParser.T__8);
			this.state = 63;
			this.expr(0);
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
		this.enterRule(_localctx, 10, LanguageParser.RULE_forStmt);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 65;
			this.match(LanguageParser.T__9);
			this.state = 66;
			this.match(LanguageParser.T__1);
			this.state = 67;
			this.variableDecl();
			this.state = 68;
			this.match(LanguageParser.T__6);
			this.state = 69;
			this.expr(0);
			this.state = 70;
			this.match(LanguageParser.T__6);
			this.state = 71;
			this.assign();
			this.state = 72;
			this.match(LanguageParser.T__3);
			this.state = 73;
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
	public returnStmt(): ReturnStmtContext {
		let _localctx: ReturnStmtContext = new ReturnStmtContext(this._ctx, this.state);
		this.enterRule(_localctx, 12, LanguageParser.RULE_returnStmt);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 75;
			this.match(LanguageParser.T__10);
			this.state = 76;
			this.expr(0);
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
	public assign(): AssignContext {
		let _localctx: AssignContext = new AssignContext(this._ctx, this.state);
		this.enterRule(_localctx, 14, LanguageParser.RULE_assign);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 78;
			this.match(LanguageParser.Identifier);
			this.state = 79;
			this.match(LanguageParser.T__8);
			this.state = 80;
			this.expr(0);
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

	public expr(): ExprContext;
	public expr(_p: number): ExprContext;
	// @RuleVersion(0)
	public expr(_p?: number): ExprContext {
		if (_p === undefined) {
			_p = 0;
		}

		let _parentctx: ParserRuleContext = this._ctx;
		let _parentState: number = this.state;
		let _localctx: ExprContext = new ExprContext(this._ctx, _parentState);
		let _prevctx: ExprContext = _localctx;
		let _startState: number = 16;
		this.enterRecursionRule(_localctx, 16, LanguageParser.RULE_expr, _p);
		let _la: number;
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 90;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case LanguageParser.Identifier:
				{
				this.state = 83;
				this.match(LanguageParser.Identifier);
				}
				break;
			case LanguageParser.Number:
				{
				this.state = 84;
				this.match(LanguageParser.Number);
				}
				break;
			case LanguageParser.ArrayAccess:
				{
				this.state = 85;
				this.match(LanguageParser.ArrayAccess);
				}
				break;
			case LanguageParser.T__1:
				{
				this.state = 86;
				this.match(LanguageParser.T__1);
				this.state = 87;
				this.expr(0);
				this.state = 88;
				this.match(LanguageParser.T__3);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
			this._ctx._stop = this._input.tryLT(-1);
			this.state = 100;
			this._errHandler.sync(this);
			_alt = this.interpreter.adaptivePredict(this._input, 7, this._ctx);
			while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
				if (_alt === 1) {
					if (this._parseListeners != null) {
						this.triggerExitRuleEvent();
					}
					_prevctx = _localctx;
					{
					this.state = 98;
					this._errHandler.sync(this);
					switch ( this.interpreter.adaptivePredict(this._input, 6, this._ctx) ) {
					case 1:
						{
						_localctx = new ExprContext(_parentctx, _parentState);
						this.pushNewRecursionContext(_localctx, _startState, LanguageParser.RULE_expr);
						this.state = 92;
						if (!(this.precpred(this._ctx, 6))) {
							throw this.createFailedPredicateException("this.precpred(this._ctx, 6)");
						}
						this.state = 93;
						_la = this._input.LA(1);
						if (!(_la === LanguageParser.T__11 || _la === LanguageParser.T__12)) {
						this._errHandler.recoverInline(this);
						} else {
							if (this._input.LA(1) === Token.EOF) {
								this.matchedEOF = true;
							}

							this._errHandler.reportMatch(this);
							this.consume();
						}
						this.state = 94;
						this.expr(7);
						}
						break;

					case 2:
						{
						_localctx = new ExprContext(_parentctx, _parentState);
						this.pushNewRecursionContext(_localctx, _startState, LanguageParser.RULE_expr);
						this.state = 95;
						if (!(this.precpred(this._ctx, 5))) {
							throw this.createFailedPredicateException("this.precpred(this._ctx, 5)");
						}
						this.state = 96;
						_la = this._input.LA(1);
						if (!(_la === LanguageParser.T__13 || _la === LanguageParser.T__14)) {
						this._errHandler.recoverInline(this);
						} else {
							if (this._input.LA(1) === Token.EOF) {
								this.matchedEOF = true;
							}

							this._errHandler.reportMatch(this);
							this.consume();
						}
						this.state = 97;
						this.expr(6);
						}
						break;
					}
					}
				}
				this.state = 102;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input, 7, this._ctx);
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
			this.unrollRecursionContexts(_parentctx);
		}
		return _localctx;
	}

	public sempred(_localctx: RuleContext, ruleIndex: number, predIndex: number): boolean {
		switch (ruleIndex) {
		case 8:
			return this.expr_sempred(_localctx as ExprContext, predIndex);
		}
		return true;
	}
	private expr_sempred(_localctx: ExprContext, predIndex: number): boolean {
		switch (predIndex) {
		case 0:
			return this.precpred(this._ctx, 6);

		case 1:
			return this.precpred(this._ctx, 5);
		}
		return true;
	}

	public static readonly _serializedATN: string =
		"\x03\uC91D\uCABA\u058D\uAFBA\u4F53\u0607\uEA8B\uC241\x03\x15j\x04\x02" +
		"\t\x02\x04\x03\t\x03\x04\x04\t\x04\x04\x05\t\x05\x04\x06\t\x06\x04\x07" +
		"\t\x07\x04\b\t\b\x04\t\t\t\x04\n\t\n\x03\x02\x07\x02\x16\n\x02\f\x02\x0E" +
		"\x02\x19\v\x02\x03\x02\x03\x02\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03" +
		"\x03\x03\x07\x03#\n\x03\f\x03\x0E\x03&\v\x03\x05\x03(\n\x03\x03\x03\x03" +
		"\x03\x03\x03\x03\x04\x03\x04\x07\x04/\n\x04\f\x04\x0E\x042\v\x04\x03\x04" +
		"\x03\x04\x03\x05\x03\x05\x03\x05\x03\x05\x03\x05\x03\x05\x03\x05\x05\x05" +
		"=\n\x05\x03\x06\x03\x06\x03\x06\x03\x06\x03\x06\x03\x07\x03\x07\x03\x07" +
		"\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\b\x03\b\x03" +
		"\b\x03\t\x03\t\x03\t\x03\t\x03\n\x03\n\x03\n\x03\n\x03\n\x03\n\x03\n\x03" +
		"\n\x05\n]\n\n\x03\n\x03\n\x03\n\x03\n\x03\n\x03\n\x07\ne\n\n\f\n\x0E\n" +
		"h\v\n\x03\n\x02\x02\x03\x12\v\x02\x02\x04\x02\x06\x02\b\x02\n\x02\f\x02" +
		"\x0E\x02\x10\x02\x12\x02\x02\x04\x03\x02\x0E\x0F\x03\x02\x10\x11\x02k" +
		"\x02\x17\x03\x02\x02\x02\x04\x1C\x03\x02\x02\x02\x06,\x03\x02\x02\x02" +
		"\b<\x03\x02\x02\x02\n>\x03\x02\x02\x02\fC\x03\x02\x02\x02\x0EM\x03\x02" +
		"\x02\x02\x10P\x03\x02\x02\x02\x12\\\x03\x02\x02\x02\x14\x16\x05\x04\x03" +
		"\x02\x15\x14\x03\x02\x02\x02\x16\x19\x03\x02\x02\x02\x17\x15\x03\x02\x02" +
		"\x02\x17\x18\x03\x02\x02\x02\x18\x1A\x03\x02\x02\x02\x19\x17\x03\x02\x02" +
		"\x02\x1A\x1B\x07\x02\x02\x03\x1B\x03\x03\x02\x02\x02\x1C\x1D\x07\x03\x02" +
		"\x02\x1D\x1E\x07\x13\x02\x02\x1E\'\x07\x04\x02\x02\x1F$\x07\x13\x02\x02" +
		" !\x07\x05\x02\x02!#\x07\x13\x02\x02\" \x03\x02\x02\x02#&\x03\x02\x02" +
		"\x02$\"\x03\x02\x02\x02$%\x03\x02\x02\x02%(\x03\x02\x02\x02&$\x03\x02" +
		"\x02\x02\'\x1F\x03\x02\x02\x02\'(\x03\x02\x02\x02()\x03\x02\x02\x02)*" +
		"\x07\x06\x02\x02*+\x05\x06\x04\x02+\x05\x03\x02\x02\x02,0\x07\x07\x02" +
		"\x02-/\x05\b\x05\x02.-\x03\x02\x02\x02/2\x03\x02\x02\x020.\x03\x02\x02" +
		"\x0201\x03\x02\x02\x0213\x03\x02\x02\x0220\x03\x02\x02\x0234\x07\b\x02" +
		"\x024\x07\x03\x02\x02\x0256\x05\n\x06\x0267\x07\t\x02\x027=\x03\x02\x02" +
		"\x028=\x05\f\x07\x029:\x05\x0E\b\x02:;\x07\t\x02\x02;=\x03\x02\x02\x02" +
		"<5\x03\x02\x02\x02<8\x03\x02\x02\x02<9\x03\x02\x02\x02=\t\x03\x02\x02" +
		"\x02>?\x07\n\x02\x02?@\x07\x13\x02\x02@A\x07\v\x02\x02AB\x05\x12\n\x02" +
		"B\v\x03\x02\x02\x02CD\x07\f\x02\x02DE\x07\x04\x02\x02EF\x05\n\x06\x02" +
		"FG\x07\t\x02\x02GH\x05\x12\n\x02HI\x07\t\x02\x02IJ\x05\x10\t\x02JK\x07" +
		"\x06\x02\x02KL\x05\x06\x04\x02L\r\x03\x02\x02\x02MN\x07\r\x02\x02NO\x05" +
		"\x12\n\x02O\x0F\x03\x02\x02\x02PQ\x07\x13\x02\x02QR\x07\v\x02\x02RS\x05" +
		"\x12\n\x02S\x11\x03\x02\x02\x02TU\b\n\x01\x02U]\x07\x13\x02\x02V]\x07" +
		"\x14\x02\x02W]\x07\x12\x02\x02XY\x07\x04\x02\x02YZ\x05\x12\n\x02Z[\x07" +
		"\x06\x02\x02[]\x03\x02\x02\x02\\T\x03\x02\x02\x02\\V\x03\x02\x02\x02\\" +
		"W\x03\x02\x02\x02\\X\x03\x02\x02\x02]f\x03\x02\x02\x02^_\f\b\x02\x02_" +
		"`\t\x02\x02\x02`e\x05\x12\n\tab\f\x07\x02\x02bc\t\x03\x02\x02ce\x05\x12" +
		"\n\bd^\x03\x02\x02\x02da\x03\x02\x02\x02eh\x03\x02\x02\x02fd\x03\x02\x02" +
		"\x02fg\x03\x02\x02\x02g\x13\x03\x02\x02\x02hf\x03\x02\x02\x02\n\x17$\'" +
		"0<\\df";
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
	public functionDecl(): FunctionDeclContext[];
	public functionDecl(i: number): FunctionDeclContext;
	public functionDecl(i?: number): FunctionDeclContext | FunctionDeclContext[] {
		if (i === undefined) {
			return this.getRuleContexts(FunctionDeclContext);
		} else {
			return this.getRuleContext(i, FunctionDeclContext);
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


export class FunctionDeclContext extends ParserRuleContext {
	public Identifier(): TerminalNode[];
	public Identifier(i: number): TerminalNode;
	public Identifier(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(LanguageParser.Identifier);
		} else {
			return this.getToken(LanguageParser.Identifier, i);
		}
	}
	public block(): BlockContext {
		return this.getRuleContext(0, BlockContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_functionDecl; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterFunctionDecl) {
			listener.enterFunctionDecl(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitFunctionDecl) {
			listener.exitFunctionDecl(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitFunctionDecl) {
			return visitor.visitFunctionDecl(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class BlockContext extends ParserRuleContext {
	public statement(): StatementContext[];
	public statement(i: number): StatementContext;
	public statement(i?: number): StatementContext | StatementContext[] {
		if (i === undefined) {
			return this.getRuleContexts(StatementContext);
		} else {
			return this.getRuleContext(i, StatementContext);
		}
	}
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


export class StatementContext extends ParserRuleContext {
	public variableDecl(): VariableDeclContext | undefined {
		return this.tryGetRuleContext(0, VariableDeclContext);
	}
	public forStmt(): ForStmtContext | undefined {
		return this.tryGetRuleContext(0, ForStmtContext);
	}
	public returnStmt(): ReturnStmtContext | undefined {
		return this.tryGetRuleContext(0, ReturnStmtContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_statement; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterStatement) {
			listener.enterStatement(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitStatement) {
			listener.exitStatement(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitStatement) {
			return visitor.visitStatement(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class VariableDeclContext extends ParserRuleContext {
	public Identifier(): TerminalNode { return this.getToken(LanguageParser.Identifier, 0); }
	public expr(): ExprContext {
		return this.getRuleContext(0, ExprContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_variableDecl; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterVariableDecl) {
			listener.enterVariableDecl(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitVariableDecl) {
			listener.exitVariableDecl(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitVariableDecl) {
			return visitor.visitVariableDecl(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ForStmtContext extends ParserRuleContext {
	public variableDecl(): VariableDeclContext {
		return this.getRuleContext(0, VariableDeclContext);
	}
	public expr(): ExprContext {
		return this.getRuleContext(0, ExprContext);
	}
	public assign(): AssignContext {
		return this.getRuleContext(0, AssignContext);
	}
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


export class ReturnStmtContext extends ParserRuleContext {
	public expr(): ExprContext {
		return this.getRuleContext(0, ExprContext);
	}
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


export class AssignContext extends ParserRuleContext {
	public Identifier(): TerminalNode { return this.getToken(LanguageParser.Identifier, 0); }
	public expr(): ExprContext {
		return this.getRuleContext(0, ExprContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return LanguageParser.RULE_assign; }
	// @Override
	public enterRule(listener: LanguageListener): void {
		if (listener.enterAssign) {
			listener.enterAssign(this);
		}
	}
	// @Override
	public exitRule(listener: LanguageListener): void {
		if (listener.exitAssign) {
			listener.exitAssign(this);
		}
	}
	// @Override
	public accept<Result>(visitor: LanguageVisitor<Result>): Result {
		if (visitor.visitAssign) {
			return visitor.visitAssign(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ExprContext extends ParserRuleContext {
	public expr(): ExprContext[];
	public expr(i: number): ExprContext;
	public expr(i?: number): ExprContext | ExprContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ExprContext);
		} else {
			return this.getRuleContext(i, ExprContext);
		}
	}
	public Identifier(): TerminalNode | undefined { return this.tryGetToken(LanguageParser.Identifier, 0); }
	public Number(): TerminalNode | undefined { return this.tryGetToken(LanguageParser.Number, 0); }
	public ArrayAccess(): TerminalNode | undefined { return this.tryGetToken(LanguageParser.ArrayAccess, 0); }
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


