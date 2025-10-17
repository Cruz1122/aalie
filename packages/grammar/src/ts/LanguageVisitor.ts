// Generated from grammar/Language.g4 by ANTLR 4.9.0-SNAPSHOT


import { ParseTreeVisitor } from "antlr4ts/tree/ParseTreeVisitor";

import { ProgramContext } from "./LanguageParser";
import { ClassDefContext } from "./LanguageParser";
import { AttrListContext } from "./LanguageParser";
import { ProcDefContext } from "./LanguageParser";
import { ParamListContext } from "./LanguageParser";
import { ParamContext } from "./LanguageParser";
import { ArrayParamContext } from "./LanguageParser";
import { ArrayDimContext } from "./LanguageParser";
import { ObjectParamContext } from "./LanguageParser";
import { StmtContext } from "./LanguageParser";
import { BlockContext } from "./LanguageParser";
import { AssignmentStmtContext } from "./LanguageParser";
import { DeclVectorStmtContext } from "./LanguageParser";
import { CallStmtContext } from "./LanguageParser";
import { ArgListContext } from "./LanguageParser";
import { RepeatStmtContext } from "./LanguageParser";
import { ReturnStmtContext } from "./LanguageParser";
import { IfStmtContext } from "./LanguageParser";
import { WhileStmtContext } from "./LanguageParser";
import { ForStmtContext } from "./LanguageParser";
import { LvalueContext } from "./LanguageParser";
import { FieldAccessContext } from "./LanguageParser";
import { IndexSuffixContext } from "./LanguageParser";
import { ExprContext } from "./LanguageParser";
import { OrExprContext } from "./LanguageParser";
import { AndExprContext } from "./LanguageParser";
import { RelExprContext } from "./LanguageParser";
import { AddExprContext } from "./LanguageParser";
import { MulExprContext } from "./LanguageParser";
import { UnaryExprContext } from "./LanguageParser";
import { PrimaryContext } from "./LanguageParser";
import { LengthCallContext } from "./LanguageParser";
import { CallExprContext } from "./LanguageParser";


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
	 * Visit a parse tree produced by `LanguageParser.classDef`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitClassDef?: (ctx: ClassDefContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.attrList`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitAttrList?: (ctx: AttrListContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.procDef`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitProcDef?: (ctx: ProcDefContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.paramList`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitParamList?: (ctx: ParamListContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.param`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitParam?: (ctx: ParamContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.arrayParam`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitArrayParam?: (ctx: ArrayParamContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.arrayDim`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitArrayDim?: (ctx: ArrayDimContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.objectParam`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitObjectParam?: (ctx: ObjectParamContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.stmt`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitStmt?: (ctx: StmtContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.block`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitBlock?: (ctx: BlockContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.assignmentStmt`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitAssignmentStmt?: (ctx: AssignmentStmtContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.declVectorStmt`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitDeclVectorStmt?: (ctx: DeclVectorStmtContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.callStmt`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitCallStmt?: (ctx: CallStmtContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.argList`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitArgList?: (ctx: ArgListContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.repeatStmt`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitRepeatStmt?: (ctx: RepeatStmtContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.returnStmt`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitReturnStmt?: (ctx: ReturnStmtContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.ifStmt`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitIfStmt?: (ctx: IfStmtContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.whileStmt`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitWhileStmt?: (ctx: WhileStmtContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.forStmt`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitForStmt?: (ctx: ForStmtContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.lvalue`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitLvalue?: (ctx: LvalueContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.fieldAccess`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitFieldAccess?: (ctx: FieldAccessContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.indexSuffix`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitIndexSuffix?: (ctx: IndexSuffixContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.expr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitExpr?: (ctx: ExprContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.orExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitOrExpr?: (ctx: OrExprContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.andExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitAndExpr?: (ctx: AndExprContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.relExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitRelExpr?: (ctx: RelExprContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.addExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitAddExpr?: (ctx: AddExprContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.mulExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitMulExpr?: (ctx: MulExprContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.unaryExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitUnaryExpr?: (ctx: UnaryExprContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.primary`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitPrimary?: (ctx: PrimaryContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.lengthCall`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitLengthCall?: (ctx: LengthCallContext) => Result;

	/**
	 * Visit a parse tree produced by `LanguageParser.callExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitCallExpr?: (ctx: CallExprContext) => Result;
}

