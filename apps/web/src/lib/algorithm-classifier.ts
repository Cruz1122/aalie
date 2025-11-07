import type { Program } from "@aa/types";

export type AlgorithmKind = "iterative" | "recursive" | "hybrid" | "unknown";

/**
 * Función recursiva para buscar nodos de un tipo específico en el AST
 */
export function findNodeType(node: unknown, targetTypes: string[]): boolean {
  if (!node || typeof node !== 'object') return false;
  
  // Verificar si el nodo actual es de uno de los tipos buscados
  const nodeObj = node as Record<string, unknown>;
  const nodeType = (nodeObj.type || nodeObj.Type || '') as string;
  if (targetTypes.some(type => nodeType.toLowerCase() === type.toLowerCase())) {
    return true;
  }
  
  // Buscar recursivamente en todos los hijos
  for (const key in nodeObj) {
    if (key === 'type' || key === 'Type' || key === 'pos') continue;
    const value = nodeObj[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (findNodeType(item, targetTypes)) return true;
      }
    } else if (value && typeof value === 'object') {
      if (findNodeType(value, targetTypes)) return true;
    }
  }
  
  return false;
}

/**
 * Función heurística para clasificar algoritmos basándose en el AST
 * Busca recursivamente bucles iterativos y llamadas recursivas
 */
export function heuristicKind(ast: Program | null | unknown): AlgorithmKind {
  try {
    if (!ast) return "unknown";
    
    // Buscar bucles iterativos recursivamente
    const hasIterative = findNodeType(ast, ['For', 'While', 'Repeat', 'for', 'while', 'repeat']);
    
    // Buscar llamadas recursivas
    let hasRecursive = false;
    const astStr = JSON.stringify(ast);
    const procMatch = /"type":"ProcDef"[^}]*"name":"([^"]+)"/i.exec(astStr);
    if (procMatch) {
      const procName = procMatch[1];
      // Buscar llamadas a la misma función
      const callPattern = new RegExp(`"type":"Call"[^}]*"callee":"${procName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'i');
      hasRecursive = callPattern.test(astStr);
    }
    
    // También buscar cualquier llamada (puede ser recursiva)
    if (!hasRecursive) {
      hasRecursive = findNodeType(ast, ['Call', 'call']);
    }
    
    // Clasificar
    if (hasIterative && hasRecursive) return "hybrid";
    if (hasRecursive) return "recursive";
    if (hasIterative) return "iterative";
    return "unknown";
  } catch { 
    return "unknown"; 
  }
}

