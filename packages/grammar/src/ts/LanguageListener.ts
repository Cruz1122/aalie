// Generated from grammar/Language.g4 by ANTLR 4.9.0-SNAPSHOT


import { ParseTreeListener } from "antlr4ts/tree/ParseTreeListener";

import { ProgramContext } from "./LanguageParser";
import { ClassDefContext } from "./LanguageParser";
import { AttrListContext } from "./LanguageParser";
import { ProcDefContext } from "./LanguageParser";
import { ParamListContext } from "./LanguageParser";
import { ParamContext } from "./LanguageParser";
import { ArrayParamContext } from "./LanguageParser";
import { ArrayIndexContext } from "./LanguageParser";
import { ArrayDimContext } from "./LanguageParser";
import { ObjectParamContext } from "./LanguageParser";
import { StmtContext } from "./LanguageParser";
import { BlockContext } from "./LanguageParser";
import { AssignmentStmtContext } from "./LanguageParser";
import { DeclVectorStmtContext } from "./LanguageParser";
import { CallStmtContext } from "./LanguageParser";
import { PrintStmtContext } from "./LanguageParser";
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
	 * Enter a parse tree produced by `LanguageParser.classDef`.
	 * @param ctx the parse tree
	 */
	enterClassDef?: (ctx: ClassDefContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.classDef`.
	 * @param ctx the parse tree
	 */
	exitClassDef?: (ctx: ClassDefContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.attrList`.
	 * @param ctx the parse tree
	 */
	enterAttrList?: (ctx: AttrListContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.attrList`.
	 * @param ctx the parse tree
	 */
	exitAttrList?: (ctx: AttrListContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.procDef`.
	 * @param ctx the parse tree
	 */
	enterProcDef?: (ctx: ProcDefContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.procDef`.
	 * @param ctx the parse tree
	 */
	exitProcDef?: (ctx: ProcDefContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.paramList`.
	 * @param ctx the parse tree
	 */
	enterParamList?: (ctx: ParamListContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.paramList`.
	 * @param ctx the parse tree
	 */
	exitParamList?: (ctx: ParamListContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.param`.
	 * @param ctx the parse tree
	 */
	enterParam?: (ctx: ParamContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.param`.
	 * @param ctx the parse tree
	 */
	exitParam?: (ctx: ParamContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.arrayParam`.
	 * @param ctx the parse tree
	 */
	enterArrayParam?: (ctx: ArrayParamContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.arrayParam`.
	 * @param ctx the parse tree
	 */
	exitArrayParam?: (ctx: ArrayParamContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.arrayIndex`.
	 * @param ctx the parse tree
	 */
	enterArrayIndex?: (ctx: ArrayIndexContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.arrayIndex`.
	 * @param ctx the parse tree
	 */
	exitArrayIndex?: (ctx: ArrayIndexContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.arrayDim`.
	 * @param ctx the parse tree
	 */
	enterArrayDim?: (ctx: ArrayDimContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.arrayDim`.
	 * @param ctx the parse tree
	 */
	exitArrayDim?: (ctx: ArrayDimContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.objectParam`.
	 * @param ctx the parse tree
	 */
	enterObjectParam?: (ctx: ObjectParamContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.objectParam`.
	 * @param ctx the parse tree
	 */
	exitObjectParam?: (ctx: ObjectParamContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.stmt`.
	 * @param ctx the parse tree
	 */
	enterStmt?: (ctx: StmtContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.stmt`.
	 * @param ctx the parse tree
	 */
	exitStmt?: (ctx: StmtContext) => void;

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
	 * Enter a parse tree produced by `LanguageParser.assignmentStmt`.
	 * @param ctx the parse tree
	 */
	enterAssignmentStmt?: (ctx: AssignmentStmtContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.assignmentStmt`.
	 * @param ctx the parse tree
	 */
	exitAssignmentStmt?: (ctx: AssignmentStmtContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.declVectorStmt`.
	 * @param ctx the parse tree
	 */
	enterDeclVectorStmt?: (ctx: DeclVectorStmtContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.declVectorStmt`.
	 * @param ctx the parse tree
	 */
	exitDeclVectorStmt?: (ctx: DeclVectorStmtContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.callStmt`.
	 * @param ctx the parse tree
	 */
	enterCallStmt?: (ctx: CallStmtContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.callStmt`.
	 * @param ctx the parse tree
	 */
	exitCallStmt?: (ctx: CallStmtContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.printStmt`.
	 * @param ctx the parse tree
	 */
	enterPrintStmt?: (ctx: PrintStmtContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.printStmt`.
	 * @param ctx the parse tree
	 */
	exitPrintStmt?: (ctx: PrintStmtContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.argList`.
	 * @param ctx the parse tree
	 */
	enterArgList?: (ctx: ArgListContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.argList`.
	 * @param ctx the parse tree
	 */
	exitArgList?: (ctx: ArgListContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.repeatStmt`.
	 * @param ctx the parse tree
	 */
	enterRepeatStmt?: (ctx: RepeatStmtContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.repeatStmt`.
	 * @param ctx the parse tree
	 */
	exitRepeatStmt?: (ctx: RepeatStmtContext) => void;

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
	 * Enter a parse tree produced by `LanguageParser.ifStmt`.
	 * @param ctx the parse tree
	 */
	enterIfStmt?: (ctx: IfStmtContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.ifStmt`.
	 * @param ctx the parse tree
	 */
	exitIfStmt?: (ctx: IfStmtContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.whileStmt`.
	 * @param ctx the parse tree
	 */
	enterWhileStmt?: (ctx: WhileStmtContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.whileStmt`.
	 * @param ctx the parse tree
	 */
	exitWhileStmt?: (ctx: WhileStmtContext) => void;

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
	 * Enter a parse tree produced by `LanguageParser.lvalue`.
	 * @param ctx the parse tree
	 */
	enterLvalue?: (ctx: LvalueContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.lvalue`.
	 * @param ctx the parse tree
	 */
	exitLvalue?: (ctx: LvalueContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.fieldAccess`.
	 * @param ctx the parse tree
	 */
	enterFieldAccess?: (ctx: FieldAccessContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.fieldAccess`.
	 * @param ctx the parse tree
	 */
	exitFieldAccess?: (ctx: FieldAccessContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.indexSuffix`.
	 * @param ctx the parse tree
	 */
	enterIndexSuffix?: (ctx: IndexSuffixContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.indexSuffix`.
	 * @param ctx the parse tree
	 */
	exitIndexSuffix?: (ctx: IndexSuffixContext) => void;

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

	/**
	 * Enter a parse tree produced by `LanguageParser.orExpr`.
	 * @param ctx the parse tree
	 */
	enterOrExpr?: (ctx: OrExprContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.orExpr`.
	 * @param ctx the parse tree
	 */
	exitOrExpr?: (ctx: OrExprContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.andExpr`.
	 * @param ctx the parse tree
	 */
	enterAndExpr?: (ctx: AndExprContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.andExpr`.
	 * @param ctx the parse tree
	 */
	exitAndExpr?: (ctx: AndExprContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.relExpr`.
	 * @param ctx the parse tree
	 */
	enterRelExpr?: (ctx: RelExprContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.relExpr`.
	 * @param ctx the parse tree
	 */
	exitRelExpr?: (ctx: RelExprContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.addExpr`.
	 * @param ctx the parse tree
	 */
	enterAddExpr?: (ctx: AddExprContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.addExpr`.
	 * @param ctx the parse tree
	 */
	exitAddExpr?: (ctx: AddExprContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.mulExpr`.
	 * @param ctx the parse tree
	 */
	enterMulExpr?: (ctx: MulExprContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.mulExpr`.
	 * @param ctx the parse tree
	 */
	exitMulExpr?: (ctx: MulExprContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.unaryExpr`.
	 * @param ctx the parse tree
	 */
	enterUnaryExpr?: (ctx: UnaryExprContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.unaryExpr`.
	 * @param ctx the parse tree
	 */
	exitUnaryExpr?: (ctx: UnaryExprContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.primary`.
	 * @param ctx the parse tree
	 */
	enterPrimary?: (ctx: PrimaryContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.primary`.
	 * @param ctx the parse tree
	 */
	exitPrimary?: (ctx: PrimaryContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.lengthCall`.
	 * @param ctx the parse tree
	 */
	enterLengthCall?: (ctx: LengthCallContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.lengthCall`.
	 * @param ctx the parse tree
	 */
	exitLengthCall?: (ctx: LengthCallContext) => void;

	/**
	 * Enter a parse tree produced by `LanguageParser.callExpr`.
	 * @param ctx the parse tree
	 */
	enterCallExpr?: (ctx: CallExprContext) => void;
	/**
	 * Exit a parse tree produced by `LanguageParser.callExpr`.
	 * @param ctx the parse tree
	 */
	exitCallExpr?: (ctx: CallExprContext) => void;
}

