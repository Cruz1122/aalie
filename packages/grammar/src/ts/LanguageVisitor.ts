// Generated from grammar/Language.g4 by ANTLR 4.9.0-SNAPSHOT


import { ParseTreeVisitor } from "antlr4ts/tree/ParseTreeVisitor";

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
 * This interface defines a complete generic visitor for a parse tree produced
 * by `LanguageParser`.
 *
 * @param <Result> The return type of the visit operation. Use `void` for
 * operations with no return type.
 */
export interface LanguageVisitor<Result> extends ParseTreeVisitor<Result> {
	/**
	 * Visit a parse tree produced by `LanguageParser.program`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitProgram?: (ctx: ProgramContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.functionDecl`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitFunctionDecl?: (ctx: FunctionDeclContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.block`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitBlock?: (ctx: BlockContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.statement`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitStatement?: (ctx: StatementContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.variableDecl`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitVariableDecl?: (ctx: VariableDeclContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.forStmt`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitForStmt?: (ctx: ForStmtContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.returnStmt`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitReturnStmt?: (ctx: ReturnStmtContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.assign`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitAssign?: (ctx: AssignContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.expr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitExpr?: (ctx: ExprContext) => Result;
}

