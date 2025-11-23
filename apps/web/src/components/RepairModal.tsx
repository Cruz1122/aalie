"use client";

import { useState, useEffect } from "react";
import type { ParseError } from "@aa/types";

interface RepairModalProps {
  open: boolean;
  onClose: () => void;
  onAccept: (repairedCode: string) => void;
  originalCode: string;
  parseErrors?: ParseError[];
}

/**
 * Calcula el LCS (Longest Common Subsequence) para encontrar las líneas comunes.
 * Retorna una matriz de coincidencias.
 */
function computeLCS(originalLines: string[], repairedLines: string[]): number[][] {
  const m = originalLines.length;
  const n = repairedLines.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (originalLines[i - 1] === repairedLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp;
}

/**
 * Reconstruye el diff usando el LCS para identificar líneas eliminadas y agregadas.
 */
function reconstructDiff(originalLines: string[], repairedLines: string[], dp: number[][]): Array<{
  type: 'same' | 'removed' | 'added' | 'modified';
  originalLine?: string;
  repairedLine?: string;
  originalLineNumber?: number;
  repairedLineNumber?: number;
}> {
  const diff: Array<{
    type: 'same' | 'removed' | 'added' | 'modified';
    originalLine?: string;
    repairedLine?: string;
    originalLineNumber?: number;
    repairedLineNumber?: number;
  }> = [];

  let i = originalLines.length;
  let j = repairedLines.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && originalLines[i - 1] === repairedLines[j - 1]) {
      // Línea igual
      diff.unshift({
        type: 'same',
        originalLine: originalLines[i - 1],
        repairedLine: repairedLines[j - 1],
        originalLineNumber: i,
        repairedLineNumber: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      // Línea agregada
      diff.unshift({
        type: 'added',
        repairedLine: repairedLines[j - 1],
        repairedLineNumber: j,
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      // Línea eliminada
      diff.unshift({
        type: 'removed',
        originalLine: originalLines[i - 1],
        originalLineNumber: i,
      });
      i--;
    } else {
      // Caso de seguridad
      if (i > 0) {
        diff.unshift({
          type: 'removed',
          originalLine: originalLines[i - 1],
          originalLineNumber: i,
        });
        i--;
      }
      if (j > 0) {
        diff.unshift({
          type: 'added',
          repairedLine: repairedLines[j - 1],
          repairedLineNumber: j,
        });
        j--;
      }
    }
  }

  return diff;
}

/**
 * Calcula las diferencias entre dos códigos usando algoritmo LCS.
 * Retorna un array con información sobre cada línea: 'same', 'removed', 'added'
 */
function calculateDiff(original: string, repaired: string): Array<{
  type: 'same' | 'removed' | 'added' | 'modified';
  originalLine?: string;
  repairedLine?: string;
  originalLineNumber?: number;
  repairedLineNumber?: number;
}> {
  const originalLines = original.split('\n');
  const repairedLines = repaired.split('\n');

  // Calcular LCS
  const dp = computeLCS(originalLines, repairedLines);

  // Reconstruir diff
  return reconstructDiff(originalLines, repairedLines, dp);
}

export default function RepairModal({
  open,
  onClose,
  onAccept,
  originalCode,
  parseErrors,
}: Readonly<RepairModalProps>) {
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairedCode, setRepairedCode] = useState<string | null>(null);
  const [removedLines, setRemovedLines] = useState<number[]>([]);
  const [addedLines, setAddedLines] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  // Resetear estado cuando se abre el modal
  useEffect(() => {
    if (open) {
      setIsRepairing(true);
      setRepairedCode(null);
      setRemovedLines([]);
      setAddedLines([]);
      setError(null);
      setShowComparison(false);
      repairCode();
    }
  }, [open]);

  const repairCode = async () => {
    try {
      setIsRepairing(true);
      setError(null);

      // Construir prompt con código y errores
      const errorMessages = parseErrors
        ? parseErrors.map((e) => `Línea ${e.line}:${e.column} - ${e.message}`).join('\n')
        : 'Error de sintaxis detectado';

      const prompt = `Necesito reparar un error de sintaxis en mi código de pseudocódigo.

**CÓDIGO CON ERROR:**
\`\`\`pseudocode
${originalCode}
\`\`\`

**ERRORES DETECTADOS:**
\`\`\`error
${errorMessages}
\`\`\`

**SOLICITUD:**
Repara el código corrigiendo todos los errores de sintaxis. Retorna ÚNICAMENTE el código corregido en un bloque \`\`\`pseudocode, sin explicaciones adicionales.`;

      // Obtener API_KEY
      const { getApiKey } = await import("@/hooks/useApiKey");
      const apiKey = getApiKey();

      // Llamar al LLM
      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job: 'repair',
          prompt,
          apiKey: apiKey || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result?.error || 'Error desconocido del LLM');
      }

      // Extraer JSON de la respuesta
      const content = result?.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (!content || String(content).trim().length === 0) {
        throw new Error('Respuesta vacía del LLM');
      }

      // Intentar parsear como JSON
      let repairData: { code: string; removedLines: number[]; addedLines: number[] };
      try {
        repairData = JSON.parse(String(content).trim());
      } catch (e) {
        // Si no es JSON válido, intentar extraer de un bloque de código
        const codeBlockRegex = /```(?:json|pseudocode)?\s*([\s\S]*?)```/;
        const match = String(content).match(codeBlockRegex);
        if (match && match[1]) {
          try {
            repairData = JSON.parse(match[1].trim());
          } catch (e2) {
            // Si aún falla, usar el contenido como código sin diff
            setRepairedCode(String(content).trim());
            setRemovedLines([]);
            setAddedLines([]);
            setIsRepairing(false);
            setShowComparison(true);
            return;
          }
        } else {
          throw new Error('No se pudo parsear la respuesta como JSON');
        }
      }

      // Validar estructura
      if (!repairData.code || typeof repairData.code !== 'string') {
        throw new Error('La respuesta no contiene código válido');
      }

      setRepairedCode(repairData.code);
      setRemovedLines(Array.isArray(repairData.removedLines) ? repairData.removedLines : []);
      setAddedLines(Array.isArray(repairData.addedLines) ? repairData.addedLines : []);

      setIsRepairing(false);
      setShowComparison(true);
    } catch (err) {
      console.error('Error reparando código:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al reparar código');
      setIsRepairing(false);
    }
  };

  const handleAccept = () => {
    if (repairedCode) {
      onAccept(repairedCode);
      onClose();
    }
  };

  // Construir diff basado en las líneas eliminadas y agregadas del LLM
  const originalLines = originalCode.split('\n');
  const repairedLines = repairedCode ? repairedCode.split('\n') : [];
  const diff: Array<{
    type: 'same' | 'removed' | 'added' | 'modified';
    originalLine?: string;
    repairedLine?: string;
    originalLineNumber?: number;
    repairedLineNumber?: number;
  }> = [];

  // Crear un mapa de líneas eliminadas y agregadas
  const removedSet = new Set(removedLines);
  const addedSet = new Set(addedLines);

  // Procesar todas las líneas
  let origIdx = 0;
  let repIdx = 0;

  while (origIdx < originalLines.length || repIdx < repairedLines.length) {
    const origLineNum = origIdx + 1;
    const repLineNum = repIdx + 1;
    const origLine = originalLines[origIdx];
    const repLine = repairedLines[repIdx];

    const isRemoved = removedSet.has(origLineNum);
    const isAdded = addedSet.has(repLineNum);

    if (origIdx >= originalLines.length) {
      // Solo quedan líneas nuevas
      diff.push({
        type: 'added',
        repairedLine: repLine,
        repairedLineNumber: repLineNum,
      });
      repIdx++;
    } else if (repIdx >= repairedLines.length) {
      // Solo quedan líneas eliminadas
      diff.push({
        type: 'removed',
        originalLine: origLine,
        originalLineNumber: origLineNum,
      });
      origIdx++;
    } else if (isRemoved && isAdded) {
      // Línea modificada
      diff.push({
        type: 'modified',
        originalLine: origLine,
        repairedLine: repLine,
        originalLineNumber: origLineNum,
        repairedLineNumber: repLineNum,
      });
      origIdx++;
      repIdx++;
    } else if (isRemoved) {
      // Línea eliminada
      diff.push({
        type: 'removed',
        originalLine: origLine,
        originalLineNumber: origLineNum,
      });
      origIdx++;
    } else if (isAdded) {
      // Línea agregada
      diff.push({
        type: 'added',
        repairedLine: repLine,
        repairedLineNumber: repLineNum,
      });
      repIdx++;
    } else {
      // Línea igual
      diff.push({
        type: 'same',
        originalLine: origLine,
        repairedLine: repLine,
        originalLineNumber: origLineNum,
        repairedLineNumber: repLineNum,
      });
      origIdx++;
      repIdx++;
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center glass-modal-overlay modal-animate-in">
      <div className="glass-modal-container rounded-2xl shadow-xl max-w-6xl w-[95vw] h-[85vh] flex flex-col m-4 modal-animate-in">
        {/* Header */}
        <div className="glass-modal-header flex items-center justify-between px-6 py-4 rounded-t-2xl border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">
            Reparar con IA
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-3xl leading-none transition-colors hover:rotate-90 transform duration-200"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {isRepairing && (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="flex flex-col items-center justify-center">
                <span 
                  className="material-symbols-outlined text-purple-400 animate-pulse mb-6"
                  style={{ fontSize: '128px', width: '128px', height: '128px' }}
                >
                  auto_awesome
                </span>
                <p className="text-2xl text-slate-300 font-medium mb-2">Reparando algoritmo...</p>
                <p className="text-sm text-slate-400">Esto puede tardar unos segundos</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 max-w-2xl w-full">
                <p className="text-sm font-medium">{error}</p>
                <button
                  onClick={repairCode}
                  className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm font-semibold transition-colors"
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {showComparison && repairedCode && (
            <div className="flex-1 flex flex-col overflow-hidden p-6 min-h-0">
              <h3 className="text-lg font-semibold text-white mb-4 flex-shrink-0">Comparación de código</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
                {/* Código original */}
                <div className="flex flex-col min-h-0">
                  <div className="text-sm font-semibold text-red-300 mb-2 flex-shrink-0">Código Original</div>
                  <div className="bg-slate-900/80 rounded-lg border border-red-500/30 p-3 flex-1 overflow-auto min-h-0 scrollbar-custom">
                    <table className="text-sm w-full">
                      <tbody>
                        {diff.map((item, idx) => {
                          if (item.type === 'added') return null;
                          return (
                            <tr key={idx} className="align-top">
                              <td className="pr-3 text-right text-slate-400 select-none w-8 py-1">{item.originalLineNumber || ''}</td>
                              <td className={`font-mono text-[12px] whitespace-pre py-1 ${
                                item.type === 'removed' || item.type === 'modified'
                                  ? 'text-red-400 bg-red-500/10'
                                  : 'text-slate-200'
                              }`}>
                                {item.originalLine || ' '}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Código reparado */}
                <div className="flex flex-col min-h-0">
                  <div className="text-sm font-semibold text-blue-300 mb-2 flex-shrink-0">Código Reparado</div>
                  <div className="bg-slate-900/80 rounded-lg border border-blue-500/30 p-3 flex-1 overflow-auto min-h-0 scrollbar-custom">
                    <table className="text-sm w-full">
                      <tbody>
                        {diff.map((item, idx) => {
                          if (item.type === 'removed') return null;
                          return (
                            <tr key={idx} className="align-top">
                              <td className="pr-3 text-right text-slate-400 select-none w-8 py-1">{item.repairedLineNumber || ''}</td>
                              <td className={`font-mono text-[12px] whitespace-pre py-1 ${
                                item.type === 'added' || item.type === 'modified'
                                  ? 'text-blue-400 bg-blue-500/10'
                                  : 'text-slate-200'
                              }`}>
                                {item.repairedLine || ' '}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {showComparison && repairedCode && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10 rounded-b-2xl">
            <button
              onClick={onClose}
              className="glass-secondary px-5 py-2.5 text-sm font-semibold text-slate-200 rounded-lg transition-all hover:scale-105"
            >
              Cancelar
            </button>
            <button
              onClick={handleAccept}
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-all hover:scale-105 bg-gradient-to-br from-purple-500/20 to-purple-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-purple-500/30"
            >
              Aceptar cambios
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

