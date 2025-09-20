// Generated from grammar/Language.g4 by ANTLR 4.9.0-SNAPSHOT


import { ParseTreeListener } from "antlr4ts/tree/ParseTreeListener";

import { ProgramContext } from "./LanguageParser";
import { FunctionDeclContext } from "./LanguageParser";
import { BlockContext } from "./LanguageParser";
import { StatementContext } from "./LanguageParser";
import { VariableDeclContext } from "./LanguageParser";
import { ForStmtContext } from "./LanguageParser";
import { ReturnStmtContext } from "./LanguageParser";
import { AssignContext } from "./LanguageParser";
import { ExprContext } from "./LanguageParser";


/**
 * This interface defines a complete listener for a parse tree produced by
 * `LanguageParser`.
 */
export interface LanguageListener extends ParseTreeListener {
	/**
	 * Enter a parse tree produced by `LanguageParser.program`.
	 * @param ctx the parse tree
	 */
	enterProgram?: (ctx: ProgramContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.program`.
	 * @param ctx the parse tree
	 */
	exitProgram?: (ctx: ProgramContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.functionDecl`.
	 * @param ctx the parse tree
	 */
	enterFunctionDecl?: (ctx: FunctionDeclContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.functionDecl`.
	 * @param ctx the parse tree
	 */
	exitFunctionDecl?: (ctx: FunctionDeclContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.block`.
	 * @param ctx the parse tree
	 */
	enterBlock?: (ctx: BlockContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.block`.
	 * @param ctx the parse tree
	 */
	exitBlock?: (ctx: BlockContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.statement`.
	 * @param ctx the parse tree
	 */
	enterStatement?: (ctx: StatementContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.statement`.
	 * @param ctx the parse tree
	 */
	exitStatement?: (ctx: StatementContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.variableDecl`.
	 * @param ctx the parse tree
	 */
	enterVariableDecl?: (ctx: VariableDeclContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.variableDecl`.
	 * @param ctx the parse tree
	 */
	exitVariableDecl?: (ctx: VariableDeclContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.forStmt`.
	 * @param ctx the parse tree
	 */
	enterForStmt?: (ctx: ForStmtContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.forStmt`.
	 * @param ctx the parse tree
	 */
	exitForStmt?: (ctx: ForStmtContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.returnStmt`.
	 * @param ctx the parse tree
	 */
	enterReturnStmt?: (ctx: ReturnStmtContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.returnStmt`.
	 * @param ctx the parse tree
	 */
	exitReturnStmt?: (ctx: ReturnStmtContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.assign`.
	 * @param ctx the parse tree
	 */
	enterAssign?: (ctx: AssignContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.assign`.
	 * @param ctx the parse tree
	 */
	exitAssign?: (ctx: AssignContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.expr`.
	 * @param ctx the parse tree
	 */
	enterExpr?: (ctx: ExprContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.expr`.
	 * @param ctx the parse tree
	 */
	exitExpr?: (ctx: ExprContext) => void;
}

