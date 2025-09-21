// Generated from grammar/Language.g4 by ANTLR 4.9.0-SNAPSHOT


import { ATN } from "antlr4ts/atn/ATN";
import { ATNDeserializer } from "antlr4ts/atn/ATNDeserializer";
import { CharStream } from "antlr4ts/CharStream";
import { Lexer } from "antlr4ts/Lexer";
import { LexerATNSimulator } from "antlr4ts/atn/LexerATNSimulator";
import { NotNull } from "antlr4ts/Decorators";
import { Override } from "antlr4ts/Decorators";
import { RuleContext } from "antlr4ts/RuleContext";
import { Vocabulary } from "antlr4ts/Vocabulary";
import { VocabularyImpl } from "antlr4ts/VocabularyImpl";

import * as Utils from "antlr4ts/misc/Utils";


export class LanguageLexer extends Lexer {
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

	// tslint:disable:no-trailing-whitespace
	public static readonly channelNames: string[] = [
		"DEFAULT_TOKEN_CHANNEL", "HIDDEN",
	];

	// tslint:disable:no-trailing-whitespace
	public static readonly modeNames: string[] = [
		"DEFAULT_MODE",
	];

	public static readonly ruleNames: string[] = [
		"T__0", "T__1", "T__2", "T__3", "T__4", "T__5", "T__6", "T__7", "T__8", 
		"T__9", "T__10", "T__11", "T__12", "T__13", "T__14", "ArrayAccess", "Identifier", 
		"Number", "WS",
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
	public static readonly VOCABULARY: Vocabulary = new VocabularyImpl(LanguageLexer._LITERAL_NAMES, LanguageLexer._SYMBOLIC_NAMES, []);

	// @Override
	// @NotNull
	public get vocabulary(): Vocabulary {
		return LanguageLexer.VOCABULARY;
	}
	// tslint:enable:no-trailing-whitespace


	constructor(input: CharStream) {
		super(input);
		this._interp = new LexerATNSimulator(LanguageLexer._ATN, this);
	}

	// @Override
	public get grammarFileName(): string { return "Language.g4"; }

	// @Override
	public get ruleNames(): string[] { return LanguageLexer.ruleNames; }

	// @Override
	public get serializedATN(): string { return LanguageLexer._serializedATN; }

	// @Override
	public get channelNames(): string[] { return LanguageLexer.channelNames; }

	// @Override
	public get modeNames(): string[] { return LanguageLexer.modeNames; }

	public static readonly _serializedATN: string =
		"\x03\uC91D\uCABA\u058D\uAFBA\u4F53\u0607\uEA8B\uC241\x02\x15o\b\x01\x04" +
		"\x02\t\x02\x04\x03\t\x03\x04\x04\t\x04\x04\x05\t\x05\x04\x06\t\x06\x04" +
		"\x07\t\x07\x04\b\t\b\x04\t\t\t\x04\n\t\n\x04\v\t\v\x04\f\t\f\x04\r\t\r" +
		"\x04\x0E\t\x0E\x04\x0F\t\x0F\x04\x10\t\x10\x04\x11\t\x11\x04\x12\t\x12" +
		"\x04\x13\t\x13\x04\x14\t\x14\x03\x02\x03\x02\x03\x02\x03\x02\x03\x02\x03" +
		"\x02\x03\x02\x03\x02\x03\x02\x03\x03\x03\x03\x03\x04\x03\x04\x03\x05\x03" +
		"\x05\x03\x06\x03\x06\x03\x07\x03\x07\x03\b\x03\b\x03\t\x03\t\x03\t\x03" +
		"\t\x03\n\x03\n\x03\v\x03\v\x03\v\x03\v\x03\f\x03\f\x03\f\x03\f\x03\f\x03" +
		"\f\x03\f\x03\r\x03\r\x03\x0E\x03\x0E\x03\x0F\x03\x0F\x03\x10\x03\x10\x03" +
		"\x11\x03\x11\x03\x11\x03\x11\x03\x11\x03\x12\x03\x12\x07\x12_\n\x12\f" +
		"\x12\x0E\x12b\v\x12\x03\x13\x06\x13e\n\x13\r\x13\x0E\x13f\x03\x14\x06" +
		"\x14j\n\x14\r\x14\x0E\x14k\x03\x14\x03\x14\x02\x02\x02\x15\x03\x02\x03" +
		"\x05\x02\x04\x07\x02\x05\t\x02\x06\v\x02\x07\r\x02\b\x0F\x02\t\x11\x02" +
		"\n\x13\x02\v\x15\x02\f\x17\x02\r\x19\x02\x0E\x1B\x02\x0F\x1D\x02\x10\x1F" +
		"\x02\x11!\x02\x12#\x02\x13%\x02\x14\'\x02\x15\x03\x02\x06\x05\x02C\\a" +
		"ac|\x06\x022;C\\aac|\x03\x022;\x05\x02\v\f\x0F\x0F\"\"\x02q\x02\x03\x03" +
		"\x02\x02\x02\x02\x05\x03\x02\x02\x02\x02\x07\x03\x02\x02\x02\x02\t\x03" +
		"\x02\x02\x02\x02\v\x03\x02\x02\x02\x02\r\x03\x02\x02\x02\x02\x0F\x03\x02" +
		"\x02\x02\x02\x11\x03\x02\x02\x02\x02\x13\x03\x02\x02\x02\x02\x15\x03\x02" +
		"\x02\x02\x02\x17\x03\x02\x02\x02\x02\x19\x03\x02\x02\x02\x02\x1B\x03\x02" +
		"\x02\x02\x02\x1D\x03\x02\x02\x02\x02\x1F\x03\x02\x02\x02\x02!\x03\x02" +
		"\x02\x02\x02#\x03\x02\x02\x02\x02%\x03\x02\x02\x02\x02\'\x03\x02\x02\x02" +
		"\x03)\x03\x02\x02\x02\x052\x03\x02\x02\x02\x074\x03\x02\x02\x02\t6\x03" +
		"\x02\x02\x02\v8\x03\x02\x02\x02\r:\x03\x02\x02\x02\x0F<\x03\x02\x02\x02" +
		"\x11>\x03\x02\x02\x02\x13B\x03\x02\x02\x02\x15D\x03\x02\x02\x02\x17H\x03" +
		"\x02\x02\x02\x19O\x03\x02\x02\x02\x1BQ\x03\x02\x02\x02\x1DS\x03\x02\x02" +
		"\x02\x1FU\x03\x02\x02\x02!W\x03\x02\x02\x02#\\\x03\x02\x02\x02%d\x03\x02" +
		"\x02\x02\'i\x03\x02\x02\x02)*\x07h\x02\x02*+\x07w\x02\x02+,\x07p\x02\x02" +
		",-\x07e\x02\x02-.\x07v\x02\x02./\x07k\x02\x02/0\x07q\x02\x0201\x07p\x02" +
		"\x021\x04\x03\x02\x02\x0223\x07*\x02\x023\x06\x03\x02\x02\x0245\x07.\x02" +
		"\x025\b\x03\x02\x02\x0267\x07+\x02\x027\n\x03\x02\x02\x0289\x07}\x02\x02" +
		"9\f\x03\x02\x02\x02:;\x07\x7F\x02\x02;\x0E\x03\x02\x02\x02<=\x07=\x02" +
		"\x02=\x10\x03\x02\x02\x02>?\x07n\x02\x02?@\x07g\x02\x02@A\x07v\x02\x02" +
		"A\x12\x03\x02\x02\x02BC\x07?\x02\x02C\x14\x03\x02\x02\x02DE\x07h\x02\x02" +
		"EF\x07q\x02\x02FG\x07t\x02\x02G\x16\x03\x02\x02\x02HI\x07t\x02\x02IJ\x07" +
		"g\x02\x02JK\x07v\x02\x02KL\x07w\x02\x02LM\x07t\x02\x02MN\x07p\x02\x02" +
		"N\x18\x03\x02\x02\x02OP\x07-\x02\x02P\x1A\x03\x02\x02\x02QR\x07/\x02\x02" +
		"R\x1C\x03\x02\x02\x02ST\x07,\x02\x02T\x1E\x03\x02\x02\x02UV\x071\x02\x02" +
		"V \x03\x02\x02\x02WX\x05#\x12\x02XY\x07]\x02\x02YZ\x05#\x12\x02Z[\x07" +
		"_\x02\x02[\"\x03\x02\x02\x02\\`\t\x02\x02\x02]_\t\x03\x02\x02^]\x03\x02" +
		"\x02\x02_b\x03\x02\x02\x02`^\x03\x02\x02\x02`a\x03\x02\x02\x02a$\x03\x02" +
		"\x02\x02b`\x03\x02\x02\x02ce\t\x04\x02\x02dc\x03\x02\x02\x02ef\x03\x02" +
		"\x02\x02fd\x03\x02\x02\x02fg\x03\x02\x02\x02g&\x03\x02\x02\x02hj\t\x05" +
		"\x02\x02ih\x03\x02\x02\x02jk\x03\x02\x02\x02ki\x03\x02\x02\x02kl\x03\x02" +
		"\x02\x02lm\x03\x02\x02\x02mn\b\x14\x02\x02n(\x03\x02\x02\x02\x06\x02`" +
		"fk\x03\b\x02\x02";
	public static __ATN: ATN;
	public static get _ATN(): ATN {
		if (!LanguageLexer.__ATN) {
			LanguageLexer.__ATN = new ATNDeserializer().deserialize(Utils.toCharArray(LanguageLexer._serializedATN));
		}

		return LanguageLexer.__ATN;
	}

}

