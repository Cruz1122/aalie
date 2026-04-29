import type { Assign, AstNode, Block, Call, If, Return } from "@aa/types";

import type {
  AstEvidenceNode,
  LoopAstNode,
  TechniqueEvidenceSnippet,
  TechniqueId,
} from "./techniqueTypes";

export function buildEvidenceSnippet(
  technique: TechniqueId,
  evidenceNode: AstEvidenceNode | null,
): TechniqueEvidenceSnippet {
  if (!evidenceNode) {
    return {
      kind: "none",
      code: "",
    };
  }

  if (
    (technique === "iterative" ||
      technique === "dp_bottom_up" ||
      technique === "greedy") &&
    evidenceNode.kind === "loop"
  ) {
    return compactLoopSnippet(evidenceNode.node, evidenceNode.nestedNode);
  }

  if (
    technique === "divide_and_conquer" ||
    technique === "decrease_and_conquer" ||
    technique === "decrease_and_be_conquered"
  ) {
    return recursiveCallSnippet(evidenceNode);
  }

  if (technique === "dp_top_down") {
    return memoizationSnippet(evidenceNode);
  }

  if (technique === "backtracking" || technique === "branch_and_bound") {
    return compactRecursiveSearchSnippet(evidenceNode);
  }

  return fallbackSnippet(evidenceNode);
}

function compactLoopSnippet(
  node: LoopAstNode,
  nestedNode?: LoopAstNode,
): TechniqueEvidenceSnippet {
  if (nestedNode) {
    return {
      kind: "nested_block",
      code: [
        renderLoopHeader(node),
        `  ${renderLoopHeader(nestedNode)}`,
        "    ...",
        `  ${renderLoopFooter(nestedNode)}`,
        renderLoopFooter(node),
      ].join("\n"),
      startLine: node.pos.line,
      endLine: maxLine(node),
      omittedBody: true,
    };
  }

  if (node.type === "Repeat") {
    return {
      kind: "block",
      code: ["REPEAT", "  ...", `UNTIL ${renderExpression(node.test)}`].join(
        "\n",
      ),
      startLine: node.pos.line,
      endLine: maxLine(node),
      omittedBody: true,
    };
  }

  return {
    kind: "block",
    code: [renderLoopHeader(node), "  ...", renderLoopFooter(node)].join("\n"),
    startLine: node.pos.line,
    endLine: maxLine(node),
    omittedBody: true,
  };
}

function recursiveCallSnippet(
  evidenceNode: AstEvidenceNode,
): TechniqueEvidenceSnippet {
  switch (evidenceNode.kind) {
    case "return":
      return lineSnippet(renderReturn(evidenceNode.node), evidenceNode.node);
    case "assign":
      return lineSnippet(renderAssign(evidenceNode.node), evidenceNode.node);
    case "call":
      return lineSnippet(renderCall(evidenceNode.node), evidenceNode.node);
    default:
      return fallbackSnippet(evidenceNode);
  }
}

function memoizationSnippet(
  evidenceNode: AstEvidenceNode,
): TechniqueEvidenceSnippet {
  if (evidenceNode.kind === "if") {
    const returnLine = findFirstReturnLine(evidenceNode.node);
    const lines = [renderIfHeader(evidenceNode.node)];

    if (returnLine) {
      lines.push(`  ${returnLine}`);
    } else {
      lines.push("  ...");
    }

    lines.push("ENDIF");

    if (evidenceNode.secondaryNode) {
      lines.push("...");
      lines.push(renderStatement(evidenceNode.secondaryNode));
    }

    return {
      kind: "multiple_lines",
      code: lines.join("\n"),
      startLine: evidenceNode.node.pos.line,
      endLine: evidenceNode.secondaryNode
        ? maxLine(evidenceNode.secondaryNode)
        : maxLine(evidenceNode.node),
      omittedBody: true,
    };
  }

  return fallbackSnippet(evidenceNode);
}

function compactRecursiveSearchSnippet(
  evidenceNode: AstEvidenceNode,
): TechniqueEvidenceSnippet {
  if (evidenceNode.kind === "block") {
    const interestingLines = collectInterestingBlockLines(evidenceNode.node);
    return {
      kind: "multiple_lines",
      code:
        interestingLines.length > 0
          ? interestingLines.join("\n")
          : renderCompactBlock(evidenceNode.node),
      startLine: evidenceNode.node.pos.line,
      endLine: maxLine(evidenceNode.node),
      omittedBody: true,
    };
  }

  return fallbackSnippet(evidenceNode);
}

function fallbackSnippet(
  evidenceNode: AstEvidenceNode,
): TechniqueEvidenceSnippet {
  switch (evidenceNode.kind) {
    case "loop":
      return compactLoopSnippet(evidenceNode.node, evidenceNode.nestedNode);
    case "return":
      return lineSnippet(renderReturn(evidenceNode.node), evidenceNode.node);
    case "assign":
      return lineSnippet(renderAssign(evidenceNode.node), evidenceNode.node);
    case "call":
      return lineSnippet(renderCall(evidenceNode.node), evidenceNode.node);
    case "if":
      return {
        kind: "block",
        code: [renderIfHeader(evidenceNode.node), "  ...", "ENDIF"].join("\n"),
        startLine: evidenceNode.node.pos.line,
        endLine: maxLine(evidenceNode.node),
        omittedBody: true,
      };
    case "block":
      return {
        kind: "block",
        code: renderCompactBlock(evidenceNode.node),
        startLine: evidenceNode.node.pos.line,
        endLine: maxLine(evidenceNode.node),
        omittedBody: true,
      };
  }
}

function lineSnippet(code: string, node: AstNode): TechniqueEvidenceSnippet {
  return {
    kind: "line",
    code,
    startLine: node.pos.line,
    endLine: maxLine(node),
  };
}

function renderCompactBlock(node: Block): string {
  const first = node.body[0];
  const last = node.body[node.body.length - 1];

  if (!first) {
    return "{ ... }";
  }

  if (node.body.length === 1) {
    return renderStatement(first);
  }

  return [renderStatement(first), "...", renderStatement(last)].join("\n");
}

function collectInterestingBlockLines(node: Block): string[] {
  const lines: string[] = [];

  for (const stmt of node.body) {
    if (
      stmt.type === "Assign" ||
      stmt.type === "Return" ||
      stmt.type === "Call"
    ) {
      lines.push(renderStatement(stmt));
      continue;
    }

    if (stmt.type === "If") {
      lines.push(renderIfHeader(stmt));
      lines.push("  ...");
      lines.push("ENDIF");
    }
  }

  return uniqueLines(lines).slice(0, 6);
}

function findFirstReturnLine(node: If): string | null {
  const consequentReturn = findReturnInBlock(node.consequent);
  if (consequentReturn) {
    return consequentReturn;
  }

  const alternateReturn = node.alternate
    ? findReturnInBlock(node.alternate)
    : null;
  return alternateReturn;
}

function findReturnInBlock(node: Block): string | null {
  for (const stmt of node.body) {
    if (stmt.type === "Return") {
      return renderReturn(stmt);
    }

    if (stmt.type === "If") {
      const nestedReturn = findFirstReturnLine(stmt);
      if (nestedReturn) {
        return nestedReturn;
      }
    }
  }

  return null;
}

function renderStatement(node: AstNode): string {
  switch (node.type) {
    case "Assign":
      return renderAssign(node);
    case "Return":
      return renderReturn(node);
    case "Call":
      return renderCall(node);
    case "If":
      return renderIfHeader(node);
    case "For":
    case "While":
    case "Repeat":
      return renderLoopHeader(node);
    default:
      return renderExpression(node);
  }
}

function renderAssign(node: Assign): string {
  return `${renderExpression(node.target)} <- ${renderExpression(node.value)}`;
}

function renderReturn(node: Return): string {
  return `RETURN ${renderExpression(node.value)}`;
}

function renderCall(node: Call): string {
  return `${node.callee}(${node.args.map(renderExpression).join(", ")})`;
}

function renderIfHeader(node: If): string {
  return `IF ${renderCondition(node.test)} THEN`;
}

function renderLoopHeader(node: LoopAstNode): string {
  switch (node.type) {
    case "For":
      return `FOR ${node.var} <- ${renderExpression(node.start)} TO ${renderExpression(node.end)} DO`;
    case "While":
      return `WHILE (${renderExpression(node.test)}) DO`;
    case "Repeat":
      return "REPEAT";
  }
}

function renderLoopFooter(node: LoopAstNode): string {
  switch (node.type) {
    case "For":
      return "ENDFOR";
    case "While":
      return "ENDWHILE";
    case "Repeat":
      return `UNTIL ${renderExpression(node.test)}`;
  }
}

function renderCondition(node: AstNode): string {
  return renderExpression(node);
}

function renderExpression(node: AstNode): string {
  switch (node.type) {
    case "Identifier":
      return node.name;
    case "Literal":
      if (typeof node.value === "boolean") {
        return node.value ? "TRUE" : "FALSE";
      }
      if (node.value === null) {
        return "NULL";
      }
      if (typeof node.value === "string") {
        return `"${node.value}"`;
      }
      return String(node.value);
    case "Binary":
      return `${wrapBinarySide(node.left)} ${renderOperator(node.op)} ${wrapBinarySide(node.right)}`;
    case "Unary":
      return node.op === "-"
        ? `-${renderExpression(node.arg)}`
        : `NOT ${renderExpression(node.arg)}`;
    case "Call":
      return renderCall(node);
    case "Index":
      if (node.index) {
        return `${renderExpression(node.target)}[${renderExpression(node.index)}]`;
      }
      if (node.range) {
        return `${renderExpression(node.target)}[${renderExpression(node.range.start)}:${renderExpression(node.range.end)}]`;
      }
      return `${renderExpression(node.target)}[]`;
    case "Field":
      return `${renderExpression(node.target)}.${node.name}`;
    case "Param":
      return node.name;
    case "ArrayParam":
      return node.end
        ? `${node.name}[${renderExpression(node.start)}:${renderExpression(node.end)}]`
        : `${node.name}[${renderExpression(node.start)}]`;
    case "ObjectParam":
      return `${node.className} ${node.name}`;
    default:
      return node.type.toUpperCase();
  }
}

function wrapBinarySide(node: AstNode): string {
  if (node.type === "Binary") {
    return `(${renderExpression(node)})`;
  }

  return renderExpression(node);
}

function renderOperator(op: string): string {
  switch (op) {
    case "!=":
      return "<>";
    case "and":
      return "AND";
    case "or":
      return "OR";
    case "div":
      return "DIV";
    case "mod":
      return "MOD";
    default:
      return op;
  }
}

function maxLine(node: AstNode): number {
  let currentMax = node.pos.line;

  traverseNode(node, (candidate) => {
    currentMax = Math.max(currentMax, candidate.pos.line);
  });

  return currentMax;
}

function traverseNode(node: AstNode, visit: (node: AstNode) => void) {
  visit(node);

  switch (node.type) {
    case "Program":
    case "Block":
      node.body.forEach((child) => traverseNode(child, visit));
      return;
    case "ProcDef":
      traverseNode(node.body, visit);
      return;
    case "Assign":
      traverseNode(node.target, visit);
      traverseNode(node.value, visit);
      return;
    case "DeclVector":
      node.dims.forEach((child) => traverseNode(child, visit));
      return;
    case "If":
      traverseNode(node.test, visit);
      traverseNode(node.consequent, visit);
      if (node.alternate) traverseNode(node.alternate, visit);
      return;
    case "While":
      traverseNode(node.test, visit);
      traverseNode(node.body, visit);
      return;
    case "For":
      traverseNode(node.start, visit);
      traverseNode(node.end, visit);
      traverseNode(node.body, visit);
      return;
    case "Repeat":
      traverseNode(node.body, visit);
      traverseNode(node.test, visit);
      return;
    case "Return":
      traverseNode(node.value, visit);
      return;
    case "Print":
      node.args.forEach((child) => traverseNode(child, visit));
      return;
    case "Call":
      node.args.forEach((child) => traverseNode(child, visit));
      return;
    case "Binary":
      traverseNode(node.left, visit);
      traverseNode(node.right, visit);
      return;
    case "Unary":
      traverseNode(node.arg, visit);
      return;
    case "Index":
      traverseNode(node.target, visit);
      if (node.index) traverseNode(node.index, visit);
      if (node.range) {
        traverseNode(node.range.start, visit);
        traverseNode(node.range.end, visit);
      }
      return;
    case "Field":
      traverseNode(node.target, visit);
      return;
    case "ArrayParam":
      traverseNode(node.start, visit);
      if (node.end) traverseNode(node.end, visit);
      return;
    case "Literal":
    case "Identifier":
    case "Param":
    case "ObjectParam":
      return;
  }
}

function uniqueLines(lines: string[]): string[] {
  return Array.from(new Set(lines.filter((line) => line.trim().length > 0)));
}
