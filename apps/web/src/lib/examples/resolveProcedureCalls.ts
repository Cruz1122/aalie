import { examplesCatalog } from "./catalog";

const KEYWORDS = new Set([
  "if",
  "for",
  "while",
  "return",
  "then",
  "else",
  "do",
  "and",
  "or",
  "not",
  "mod",
  "div",
  "to",
  "begin",
  "end",
  "repeat",
  "until",
  "switch",
  "case",
  "break",
  "continue",
  "call",
]);

const PROC_DEF_REGEX = /^(\w+)\s*\([^)]*\)\s+BEGIN/gm;
const PROC_CALL_REGEX = /(\w+)\s*\(/g;

export function findProcedureDefinitions(source: string): string[] {
  const names: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = PROC_DEF_REGEX.exec(source)) !== null) {
    names.push(match[1]);
  }
  return names;
}

export function findProcedureCalls(source: string): string[] {
  const defined = new Set(findProcedureDefinitions(source));
  const calls: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = PROC_CALL_REGEX.exec(source)) !== null) {
    const name = match[1];
    if (!KEYWORDS.has(name.toLowerCase()) && !defined.has(name)) {
      calls.push(name);
    }
  }
  return [...new Set(calls)];
}

export function findMatchingExampleSource(procName: string): string | null {
  for (const item of examplesCatalog) {
    for (const source of Object.values(item.sourceCodeByLocale)) {
      const defs = findProcedureDefinitions(source);
      if (defs.includes(procName)) {
        return source;
      }
    }
  }
  return null;
}

export function resolveProcedureCalls(source: string): string {
  const undefinedCalls = findProcedureCalls(source);
  const seen = new Set(findProcedureDefinitions(source));
  const appended: string[] = [];

  for (const name of undefinedCalls) {
    const defSource = findMatchingExampleSource(name);
    if (defSource) {
      const defs = findProcedureDefinitions(defSource);
      const newDefs = defs.filter((d) => !seen.has(d));
      if (newDefs.length > 0) {
        appended.push(defSource);
        for (const d of newDefs) {
          seen.add(d);
        }
      }
    }
  }

  if (appended.length === 0) return source;
  return source + "\n" + appended.join("\n");
}
