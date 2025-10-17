// AST Builder for TypeScript (similar to Python version)
import { AbstractParseTreeVisitor } from "antlr4ts/tree/AbstractParseTreeVisitor";
import type { 
  ArrayParam,
  Assign,
  AstNode, 
  Binary,
  Block,
  Identifier,
  Literal,
  ObjectParam,
  Param,
  ParamNode,
  Position,
  ProcDef,
  Program, 
  Unary,
} from "@aa/types";
import type { LanguageVisitor } from "./LanguageVisitor";
import type {
  ProgramContext,
  ProcDefContext,
  ParamListContext,
  ParamContext,
  ArrayParamContext,
  ArrayIndexContext,
  ObjectParamContext,
  BlockContext,
  AssignmentStmtContext,
  DeclVectorStmtContext,
  CallStmtContext,
  IfStmtContext,
  WhileStmtContext,
  ForStmtContext,
  RepeatStmtContext,
  ReturnStmtContext,
  LvalueContext,
  IndexSuffixContext,
  PrimaryContext,
  LengthCallContext,
  CallExprContext,
  ArgListContext,
  UnaryExprContext,
  OrExprContext,
  AndExprContext,
  RelExprContext,
  AddExprContext,
  MulExprContext,
} from "./LanguageParser";
import { ParserRuleContext, Token } from "antlr4ts";

// Helper para extraer posición de un contexto o token
export function getPos(ctxOrToken: ParserRuleContext | Token | null | undefined): Position {
  if (!ctxOrToken) {
    return { line: 0, column: 0 };
  }
  
  // Check if it's a Token by checking for Token-specific properties
  if ('line' in ctxOrToken && 'charPositionInLine' in ctxOrToken && !('start' in ctxOrToken)) {
    return { line: ctxOrToken.line, column: (ctxOrToken as Token).charPositionInLine };
  }
  
  // Check if it's a ParserRuleContext
  if ('start' in ctxOrToken && ctxOrToken.start) {
    const token = (ctxOrToken as ParserRuleContext).start;
    return { line: token.line, column: token.charPositionInLine };
  }
  
  return { line: 0, column: 0 };
}

// Helpers de construcción
export function lit(value: number | boolean | null, ctx?: ParserRuleContext | Token): Literal {
  return {
    type: "Literal",
    value,
    pos: getPos(ctx),
  };
}

export function ident(name: string, ctx?: ParserRuleContext | Token): Identifier {
  return {
    type: "Identifier",
    name,
    pos: getPos(ctx),
  };
}

export function unary(op: "not" | "-", arg: AstNode, ctx?: ParserRuleContext | Token): Unary {
  return {
    type: "Unary",
    op,
    arg,
    pos: getPos(ctx),
  };
}

export function binary(
  op: "==" | "!=" | "<" | "<=" | ">" | ">=" | "+" | "-" | "*" | "/" | "div" | "mod" | "and" | "or",
  left: AstNode,
  right: AstNode,
  ctx?: ParserRuleContext | Token
): Binary {
  return {
    type: "Binary",
    op,
    left,
    right,
    pos: getPos(ctx),
  };
}

// Normalización de operadores
export function normalizeOp(rawOp: string): string {
  const opLower = rawOp.toLowerCase();
  
  // Operadores de comparación
  if (opLower === "=" || opLower === "==") return "==";
  if (opLower === "<>" || opLower === "≠" || opLower === "!=") return "!=";
  if (opLower === "<=" || opLower === "≤") return "<=";
  if (opLower === ">=" || opLower === "≥") return ">=";
  if (opLower === "<") return "<";
  if (opLower === ">") return ">";
  
  // Operadores aritméticos
  if (opLower === "+") return "+";
  if (opLower === "-") return "-";
  if (opLower === "*") return "*";
  if (opLower === "/" || opLower === "divop") return "/";
  if (opLower === "div") return "div";
  if (opLower === "mod") return "mod";
  
  // Operadores lógicos
  if (opLower === "and") return "and";
  if (opLower === "or") return "or";
  if (opLower === "not" || opLower === "!") return "not";
  
  // Fallback
  return opLower;
}

export class ASTBuilder extends AbstractParseTreeVisitor<AstNode> implements LanguageVisitor<AstNode> {
  // ---- Programa y sentencias ----
  visitProgram(ctx: ProgramContext): Program {
    const procs = ctx.procDef().map(p => this.visit(p) as any);
    const stmts = ctx.stmt().map(s => this.visit(s) as AstNode);
    const body = [...procs, ...stmts];
    
    return {
      type: "Program",
      body,
      pos: getPos(ctx),
    };
  }

  visitProcDef(ctx: ProcDefContext): ProcDef {
    const name = ctx.ID().text;
    const params = ctx.paramList() ? this._visitParamList(ctx.paramList()!) : [];
    const body = this.visit(ctx.block()) as Block;
    
    return {
      type: "ProcDef",
      name,
      params,
      body,
      pos: getPos(ctx),
    };
  }

  private _visitParamList(ctx: ParamListContext): ParamNode[] {
    return ctx.param().map(p => this._visitParam(p));
  }

  private _visitParam(ctx: ParamContext): ParamNode {
    if (ctx.arrayParam()) {
      return this._visitArrayParam(ctx.arrayParam()!);
    } else if (ctx.objectParam()) {
      return this._visitObjectParam(ctx.objectParam()!);
    } else {
      // ID simple (escalar)
      return {
        type: "Param",
        name: ctx.ID()!.text,
        pos: getPos(ctx),
      };
    }
  }

  private _visitArrayParam(ctx: ArrayParamContext): ArrayParam {
    const name = ctx.ID().text;
    const indices = ctx.arrayIndex();
    const start = this._visitArrayIndex(indices[0]);
    const end = indices.length > 1 ? this._visitArrayIndex(indices[1]) : undefined;
    
    return {
      type: "ArrayParam",
      name,
      start,
      end,
      pos: getPos(ctx),
    };
  }

  private _visitArrayIndex(ctx: ArrayIndexContext): Identifier | Literal {
    if (ctx.ID()) {
      return ident(ctx.ID()!.text, ctx.ID()!.symbol);
    } else {
      return lit(parseInt(ctx.INT()!.text), ctx.INT()!.symbol);
    }
  }

  private _visitObjectParam(ctx: ObjectParamContext): ObjectParam {
    const ids = ctx.ID();
    return {
      type: "ObjectParam",
      className: ids[0].text,
      name: ids[1].text,
      pos: getPos(ctx),
    };
  }

  visitBlock(ctx: BlockContext): Block {
    const body = ctx.stmt().map(s => this.visit(s) as AstNode);
    return {
      type: "Block",
      body,
      pos: getPos(ctx),
    };
  }

  visitAssignmentStmt(ctx: AssignmentStmtContext): Assign {
    const target = this.visit(ctx.lvalue()) as AstNode;
    const value = this.visit(ctx.expr()) as AstNode;
    
    return {
      type: "Assign",
      target,
      value,
      pos: getPos(ctx),
    };
  }

  visitDeclVectorStmt(ctx: DeclVectorStmtContext): AstNode {
    const name = ctx.ID().text;
    const dims = ctx.indexSuffix().map(ix => this._visitIndexSuffix(ix));
    
    return {
      type: "DeclVector",
      id: name,
      dims: dims.map(d => (d as any).index) as AstNode[],
      pos: getPos(ctx),
    };
  }

  visitCallStmt(ctx: CallStmtContext): AstNode {
    const callee = ctx.ID().text;
    const args = ctx.argList() ? this._visitArgList(ctx.argList()!) : [];
    
    return {
      type: "Call",
      callee,
      args,
      statement: true,
      pos: getPos(ctx),
    };
  }

  visitIfStmt(ctx: IfStmtContext): AstNode {
    const test = this.visit(ctx.expr()) as AstNode;
    const blocks = ctx.block();
    const consequent = this.visit(blocks[0]) as Block;
    const alternate = blocks.length > 1 ? (this.visit(blocks[1]) as Block) : undefined;
    
    return {
      type: "If",
      test,
      consequent,
      alternate,
      pos: getPos(ctx),
    };
  }

  visitWhileStmt(ctx: WhileStmtContext): AstNode {
    const test = this.visit(ctx.expr()) as AstNode;
    const body = this.visit(ctx.block()) as Block;
    
    return {
      type: "While",
      test,
      body,
      pos: getPos(ctx),
    };
  }

  visitForStmt(ctx: ForStmtContext): AstNode {
    const varName = ctx.ID().text;
    const exprs = ctx.expr();
    const start = this.visit(exprs[0]) as AstNode;
    const end = this.visit(exprs[1]) as AstNode;
    const body = this.visit(ctx.block()) as Block;
    
    return {
      type: "For",
      var: varName,
      start,
      end,
      body,
      pos: getPos(ctx),
    };
  }

  visitRepeatStmt(ctx: RepeatStmtContext): AstNode {
    const bodyStmts = ctx.stmt().map(s => this.visit(s) as AstNode);
    const test = this.visit(ctx.expr()) as AstNode;
    const bodyBlock: Block = {
      type: "Block",
      body: bodyStmts,
      pos: getPos(ctx),
    };
    
    return {
      type: "Repeat",
      body: bodyBlock,
      test,
      pos: getPos(ctx),
    };
  }

  visitReturnStmt(ctx: ReturnStmtContext): AstNode {
    const value = this.visit(ctx.expr()) as AstNode;
    
    return {
      type: "Return",
      value,
      pos: getPos(ctx),
    };
  }

  // ---- lvalues ----
  visitLvalue(ctx: LvalueContext): AstNode {
    let node: AstNode = ident(ctx.ID().text, ctx.ID().symbol);
    
    // Walk suffixes
    const children = ctx.children || [];
    for (let i = 1; i < children.length; i++) {
      const child = children[i];
      const text = child.text;
      
      if (child.constructor.name.includes("IndexSuffix")) {
        const idxData = this._visitIndexSuffix(child as any);
        node = {
          type: "Index",
          target: node,
          ...idxData,
          pos: getPos(child as any),
        } as any;
      } else if (text.startsWith(".")) {
        const name = i + 1 < children.length ? children[i + 1].text : text.slice(1);
        node = {
          type: "Field",
          target: node,
          name,
          pos: getPos(child as any),
        } as any;
      }
    }
    
    return node;
  }

  private _visitIndexSuffix(ctx: IndexSuffixContext): any {
    const exprs = ctx.expr();
    if (ctx.RANGE()) {
      return {
        range: {
          start: this.visit(exprs[0]) as AstNode,
          end: this.visit(exprs[1]) as AstNode,
        },
      };
    }
    return { index: this.visit(exprs[0]) as AstNode };
  }

  // ---- Expresiones ----
  visitPrimary(ctx: PrimaryContext): AstNode {
    if (ctx.INT()) {
      return lit(parseInt(ctx.INT()!.text), ctx.INT()!.symbol);
    }
    if (ctx.TRUE_KW()) {
      return lit(true, ctx.TRUE_KW()!.symbol);
    }
    if (ctx.FALSE_KW()) {
      return lit(false, ctx.FALSE_KW()!.symbol);
    }
    if (ctx.NULL_KW()) {
      return lit(null, ctx.NULL_KW()!.symbol);
    }
    if (ctx.lengthCall()) {
      return this.visitLengthCall(ctx.lengthCall()!);
    }
    if (ctx.callExpr()) {
      return this.visitCallExpr(ctx.callExpr()!);
    }
    if (ctx.lvalue()) {
      return this.visit(ctx.lvalue()!);
    }
    // (expr)
    return this.visit(ctx.expr()!);
  }

  visitLengthCall(ctx: LengthCallContext): AstNode {
    return {
      type: "Call",
      callee: "length",
      args: [this.visit(ctx.expr()) as AstNode],
      builtIn: true,
      statement: false,
      pos: getPos(ctx),
    };
  }

  visitCallExpr(ctx: CallExprContext): AstNode {
    const callee = ctx.ID().text;
    const args = ctx.argList() ? this._visitArgList(ctx.argList()!) : [];
    
    return {
      type: "Call",
      callee,
      args,
      statement: false,
      pos: getPos(ctx),
    };
  }

  private _visitArgList(ctx: ArgListContext): AstNode[] {
    return ctx.expr().map(e => this.visit(e) as AstNode);
  }

  visitUnaryExpr(ctx: UnaryExprContext): AstNode {
    if (ctx.NOT_KW()) {
      return unary("not", this.visit(ctx.unaryExpr()!) as AstNode, ctx);
    }
    if (ctx.MINUS()) {
      return unary("-", this.visit(ctx.unaryExpr()!) as AstNode, ctx);
    }
    return this.visit(ctx.primary()!);
  }

  // Helpers binarios
  private foldBinary(
    ctx: ParserRuleContext,
    children: ParserRuleContext[],
    opTexts: string[]
  ): AstNode {
    const nodes = children.map(c => this.visit(c) as AstNode);
    if (nodes.length === 1) {
      return nodes[0];
    }
    
    // Operators at odd positions
    const ops: string[] = [];
    const opPositions: any[] = [];
    const ctxChildren = ctx.children || [];
    
    for (let i = 1; i < ctxChildren.length; i += 2) {
      const opToken = ctxChildren[i];
      ops.push(opToken.text);
      opPositions.push(opToken);
    }
    
    let node = nodes[0];
    for (let i = 0; i < ops.length; i++) {
      const normalizedOp = normalizeOp(ops[i]) as any;
      node = binary(normalizedOp, node, nodes[i + 1], opPositions[i]);
    }
    
    return node;
  }

  visitOrExpr(ctx: OrExprContext): AstNode {
    return this.foldBinary(ctx, ctx.andExpr(), ["or"]);
  }

  visitAndExpr(ctx: AndExprContext): AstNode {
    return this.foldBinary(ctx, ctx.relExpr(), ["and"]);
  }

  visitRelExpr(ctx: RelExprContext): AstNode {
    return this.foldBinary(ctx, ctx.addExpr(), ["==", "!=", "<", "<=", ">", ">="]);
  }

  visitAddExpr(ctx: AddExprContext): AstNode {
    return this.foldBinary(ctx, ctx.mulExpr(), ["+", "-"]);
  }

  visitMulExpr(ctx: MulExprContext): AstNode {
    return this.foldBinary(ctx, ctx.unaryExpr(), ["*", "/", "div", "mod"]);
  }

  protected defaultResult(): AstNode {
    return lit(null);
  }
}

