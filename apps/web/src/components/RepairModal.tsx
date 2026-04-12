"use client";

import type { ParseError } from "@aa/types";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { AAProgressLoader } from "@/components/AAProgressLoader";
import { getApiKey } from "@/hooks/useApiKey";
import { getNormalizedLlmStructured, getNormalizedLlmText, parseJsonFromText } from "@/lib/llm-response";
import { translateLlmError } from "@/lib/llm-error-translator";

interface RepairModalProps {
  open: boolean;
  onClose: () => void;
  onAccept: (repairedCode: string) => void;
  originalCode: string;
  parseErrors?: ParseError[];
}

function normalizeLineNumbers(values: unknown, maxLine: number): number[] {
  if (!Array.isArray(values)) {
    return [];
  }

  const normalized = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
    .map((value) => Math.trunc(value))
    .filter((value) => value >= 1 && value <= maxLine);

  return Array.from(new Set(normalized)).sort((a, b) => a - b);
}

function normalizeLineTextForMatch(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function resolveLineReferences(
  references: unknown,
  lines: string[],
): number[] {
  if (!Array.isArray(references) || references.length === 0) {
    return [];
  }

  const numericLines = normalizeLineNumbers(references, lines.length);
  if (numericLines.length > 0) {
    return numericLines;
  }

  const textRefs = references
    .filter((value): value is string => typeof value === "string")
    .map((value) => normalizeLineTextForMatch(value))
    .filter((value) => value.length > 0);

  if (textRefs.length === 0) {
    return [];
  }

  const normalizedLines = lines.map((line) => normalizeLineTextForMatch(line));
  const usedIndices = new Set<number>();
  const matches: number[] = [];

  for (const ref of textRefs) {
    let found = -1;

    for (let i = 0; i < normalizedLines.length; i += 1) {
      if (usedIndices.has(i)) continue;
      if (normalizedLines[i] === ref) {
        found = i;
        break;
      }
    }

    if (found === -1) {
      for (let i = 0; i < normalizedLines.length; i += 1) {
        if (usedIndices.has(i)) continue;
        if (normalizedLines[i].includes(ref) || ref.includes(normalizedLines[i])) {
          found = i;
          break;
        }
      }
    }

    if (found !== -1) {
      usedIndices.add(found);
      matches.push(found + 1);
    }
  }

  return Array.from(new Set(matches)).sort((a, b) => a - b);
}

function getLineListFromAliases(
  payload: Record<string, unknown> | null | undefined,
  aliases: string[],
  maxLine: number,
): number[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  for (const alias of aliases) {
    const lineList = normalizeLineNumbers(payload[alias], maxLine);
    if (lineList.length > 0) {
      return lineList;
    }
  }

  return [];
}

function buildAutoLineDiff(
  originalLines: string[],
  repairedLines: string[],
): { removedLines: number[]; addedLines: number[] } {
  const removedLines: number[] = [];
  const addedLines: number[] = [];
  const commonLength = Math.min(originalLines.length, repairedLines.length);

  for (let i = 0; i < commonLength; i += 1) {
    if (originalLines[i] !== repairedLines[i]) {
      removedLines.push(i + 1);
      addedLines.push(i + 1);
    }
  }

  for (let i = commonLength; i < originalLines.length; i += 1) {
    removedLines.push(i + 1);
  }

  for (let i = commonLength; i < repairedLines.length; i += 1) {
    addedLines.push(i + 1);
  }

  return {
    removedLines,
    addedLines,
  };
}

function normalizeRepairedCodeText(code: string): string {
  let normalized = code.trim();

  // Algunos modelos devuelven saltos escapados ("\\n") en lugar de saltos reales.
  if (!normalized.includes("\n") && normalized.includes("\\n")) {
    normalized = normalized
      .replace(/\\r\\n/g, "\n")
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t");
  }

  // Si el modelo devuelve todo en una sola linea, reconstruimos lineas para visualizacion y diff.
  if (!normalized.includes("\n")) {
    normalized = normalized
      .replace(/\bBEGIN\s+/g, "BEGIN\n")
      .replace(/;\s*/g, ";\n")
      .replace(/\bEND\s+(?=(ELSE|RETURN|IF|WHILE|FOR|REPEAT|CALL|[A-Za-z_]))/g, "END\n");
  }

  return normalized.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function formatPseudocodeIndentation(code: string): string {
  const INDENT = "    ";
  const rawLines = code
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let indentLevel = 0;
  const formatted: string[] = [];

  for (const line of rawLines) {
    const upperLine = line.toUpperCase();

    if (upperLine.startsWith("END")) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    if (upperLine.startsWith("ELSE")) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    formatted.push(`${INDENT.repeat(indentLevel)}${line}`);

    if (upperLine.startsWith("ELSE") && upperLine.includes("BEGIN")) {
      indentLevel += 1;
      continue;
    }

    if (upperLine.includes("BEGIN") && !upperLine.startsWith("END")) {
      indentLevel += 1;
    }
  }

  return formatted.join("\n");
}

export default function RepairModal({
  open,
  onClose,
  onAccept,
  originalCode,
  parseErrors,
}: Readonly<RepairModalProps>) {
  const locale = useLocale();
  const t = useTranslations("analyzer.messages");
  const tView = useTranslations("analyzer.view");
  const tRepair = useTranslations("analyzer.repairModal");
  const tCommon = useTranslations("common");
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairProgress, setRepairProgress] = useState(0);
  const [repairedCode, setRepairedCode] = useState<string | null>(null);
  const [removedLines, setRemovedLines] = useState<number[]>([]);
  const [addedLines, setAddedLines] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const repairAbortRef = useRef<AbortController | null>(null);
  const repairProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const repairRequestIdRef = useRef(0);

  const normalizeToAnalyzerGrammar = (code: string): string => {
    const cleaned = normalizeRepairedCodeText(code);
    // La gramática del analizador espera: nombreProcedimiento(args) BEGIN ... END
    // Si el LLM antepone palabras clave tipo PROCEDURE/FUNCTION, se eliminan.
    const normalizedHeader = cleaned.replace(
      /^\s*(?:PROCEDURE|FUNCTION|FUNCION|PROCEDIMIENTO)\s+([A-Za-z_][\w]*)\s*\(/i,
      "$1(",
    );

    return formatPseudocodeIndentation(normalizedHeader);
  };

  const clearRepairProgressAnimation = () => {
    if (repairProgressIntervalRef.current) {
      clearInterval(repairProgressIntervalRef.current);
      repairProgressIntervalRef.current = null;
    }
  };

  const startRepairProgressAnimation = () => {
    clearRepairProgressAnimation();
    setRepairProgress(5);

    // Animación aproximada sin progreso granular del backend.
    // Ajustada para durar ~15s hasta un máximo de 90%.
    const DURATION_MS = 15000;
    const start = Date.now();

    repairProgressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const ratio = Math.min(1, elapsed / DURATION_MS);
      const next = 5 + (90 - 5) * ratio;

      setRepairProgress(next);

      if (ratio >= 1) {
        clearRepairProgressAnimation();
        setRepairProgress(90);
      }
    }, 100);
  };

  // Resetear estado cuando se abre el modal
  useEffect(() => {
    if (open) {
      setIsRepairing(true);
      setRepairProgress(0);
      setRepairedCode(null);
      setRemovedLines([]);
      setAddedLines([]);
      setError(null);
      setShowComparison(false);
      startRepairProgressAnimation();
      repairCode();
    }
    return () => {
      repairAbortRef.current?.abort();
      repairAbortRef.current = null;
      clearRepairProgressAnimation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const repairCode = async () => {
    // Cancelación real: AbortController para cortar la llamada al LLM si el usuario cierra.
    repairAbortRef.current?.abort();
    const abortController = new AbortController();
    repairAbortRef.current = abortController;
    const requestId = ++repairRequestIdRef.current;

    try {
      setIsRepairing(true);
      setError(null);
      startRepairProgressAnimation();

      // Construir prompt con código y errores
      const errorMessages = parseErrors
        ? parseErrors
            .map((e) =>
              t("lineErrorFormat", {
                line: e.line,
                column: e.column,
                message: e.message,
              }),
            )
            .join("\n")
        : t("parseErrorDetected");

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
Repara el código corrigiendo todos los errores de sintaxis y devuélvelo como JSON válido con este formato exacto:
{
  "code": "...",
  "removedLines": [],
  "addedLines": []
}
Sin texto extra, sin explicaciones, sin markdown.`;

      const strictGrammarRules = `

**RESTRICCIONES DE GRAMÁTICA (OBLIGATORIAS):**
1) NO uses prefijos como ALGORITHM, PROCEDURE, FUNCTION, FUNCION o PROCEDIMIENTO.
2) La primera línea DEBE iniciar con: nombreProcedimiento(parametros) BEGIN
3) Para cerrar IF/WHILE/FOR usa solamente END. NO uses END IF, END WHILE ni END FOR.
4) IF debe ser: IF (condicion) THEN BEGIN ... END (y ELSE BEGIN ... END si aplica).
5) WHILE/FOR deben incluir DO antes del bloque: WHILE (...) DO BEGIN ... END / FOR ... DO BEGIN ... END.
6) Conserva asignación con <- y termina sentencias internas con ;
7) No agregues texto fuera del JSON solicitado.
`;

      const finalPrompt = `${prompt}${strictGrammarRules}`;
      const apiKey = getApiKey();

      // Llamar al LLM
      const response = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortController.signal,
        body: JSON.stringify({
          job: "repair",
          prompt: finalPrompt,
          locale,
          apiKey: apiKey || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData?.error || `HTTP error! status: ${response.status}`,
        );
      }

      const result = await response.json();

      if (!result.ok) {
        const rawErr = result?.error || t("unknownLlmError");
        throw new Error(
          typeof rawErr === "string" ? rawErr : t("unknownLlmError"),
        );
      }

      const structuredRepair =
        getNormalizedLlmStructured<{
          code?: string;
          removedLines?: number[];
          addedLines?: number[];
        }>(result) || parseJsonFromText(getNormalizedLlmText(result));

      const content = getNormalizedLlmText(result);

      if (
        abortController.signal.aborted ||
        repairRequestIdRef.current !== requestId
      ) {
        if (repairRequestIdRef.current === requestId) {
          clearRepairProgressAnimation();
        }
        return;
      }

      if (!content || String(content).trim().length === 0) {
        throw new Error(t("emptyLlmResponse"));
      }

      // Intentar parsear como JSON
      let repairData: {
        code: string;
        removedLines: unknown[];
        addedLines: unknown[];
      } | null = structuredRepair && typeof structuredRepair === "object"
        ? (() => {
            const structuredObj = structuredRepair as Record<string, unknown>;
            const code =
              typeof structuredObj.code === "string"
                ? structuredObj.code
                : "";

            return {
              code,
              removedLines: Array.isArray(structuredObj.removedLines)
                ? structuredObj.removedLines
                : Array.isArray(structuredObj.removed_lines)
                  ? (structuredObj.removed_lines as unknown[])
                  : Array.isArray(structuredObj.lineas_eliminadas)
                    ? (structuredObj.lineas_eliminadas as unknown[])
                    : [],
              addedLines: Array.isArray(structuredObj.addedLines)
                ? structuredObj.addedLines
                : Array.isArray(structuredObj.added_lines)
                  ? (structuredObj.added_lines as unknown[])
                  : Array.isArray(structuredObj.lineas_agregadas)
                    ? (structuredObj.lineas_agregadas as unknown[])
                    : [],
            };
          })()
        : null;

      if (!repairData || !repairData.code) {
        try {
          const parsedFromText = parseJsonFromText<{
            code?: string;
            removedLines?: number[];
            addedLines?: number[];
            codigo_corregido?: string;
          }>(content);

          const codeFromText =
            parsedFromText?.code || parsedFromText?.codigo_corregido || "";

          if (codeFromText) {
            const parsedObj = (parsedFromText as Record<string, unknown>) || null;
            repairData = {
              code: codeFromText,
              removedLines: Array.isArray(parsedObj?.removedLines)
                ? (parsedObj.removedLines as unknown[])
                : Array.isArray(parsedObj?.removed_lines)
                  ? (parsedObj.removed_lines as unknown[])
                  : Array.isArray(parsedObj?.lineas_eliminadas)
                    ? (parsedObj.lineas_eliminadas as unknown[])
                    : [],
              addedLines: Array.isArray(parsedObj?.addedLines)
                ? (parsedObj.addedLines as unknown[])
                : Array.isArray(parsedObj?.added_lines)
                  ? (parsedObj.added_lines as unknown[])
                  : Array.isArray(parsedObj?.lineas_agregadas)
                    ? (parsedObj.lineas_agregadas as unknown[])
                    : [],
            };
          }
        } catch {
          repairData = null;
        }
      }

      if (!repairData || !repairData.code) {
        if (
          abortController.signal.aborted ||
          repairRequestIdRef.current !== requestId
        ) {
          if (repairRequestIdRef.current === requestId) {
            clearRepairProgressAnimation();
          }
          return;
        }
        setRepairedCode(normalizeToAnalyzerGrammar(content));
        setRemovedLines([]);
        setAddedLines([]);
        setIsRepairing(false);
        clearRepairProgressAnimation();
        setRepairProgress(100);
        setShowComparison(true);
        return;
      }

      // Validar estructura
      if (!repairData.code || typeof repairData.code !== "string") {
        throw new Error(t("invalidCodeResponse"));
      }

      if (
        abortController.signal.aborted ||
        repairRequestIdRef.current !== requestId
      ) {
        if (repairRequestIdRef.current === requestId) {
          clearRepairProgressAnimation();
        }
        return;
      }

      const normalizedRepairedCode = normalizeToAnalyzerGrammar(repairData.code);
      const originalLinesList = originalCode.split("\n");
      const repairedLinesList = normalizedRepairedCode.split("\n");
      const normalizedRemovedLines = resolveLineReferences(
        repairData.removedLines,
        originalLinesList,
      );
      const normalizedAddedLines = resolveLineReferences(
        repairData.addedLines,
        repairedLinesList,
      );

      if (normalizedRemovedLines.length === 0 && normalizedAddedLines.length === 0) {
        const autoDiff = buildAutoLineDiff(
          originalLinesList,
          repairedLinesList,
        );
        setRemovedLines(autoDiff.removedLines);
        setAddedLines(autoDiff.addedLines);
      } else {
        setRemovedLines(normalizedRemovedLines);
        setAddedLines(normalizedAddedLines);
      }
      setRepairedCode(normalizedRepairedCode);

      setIsRepairing(false);
      clearRepairProgressAnimation();
      setRepairProgress(100);
      setShowComparison(true);
    } catch (err) {
      if (
        abortController.signal.aborted ||
        repairRequestIdRef.current !== requestId
      ) {
        clearRepairProgressAnimation();
        return;
      }
      console.error("Error reparando código:", err);
      const rawMsg = err instanceof Error ? err.message : String(err);
      const key = translateLlmError(rawMsg);
      setError(key === "unknownLlmError" ? t("repairUnknownError") : t(key));
      setIsRepairing(false);
      clearRepairProgressAnimation();
      setRepairProgress(0);
    }
  };

  const handleAccept = () => {
    if (repairedCode) {
      onAccept(repairedCode);
      onClose();
    }
  };

  // Construir diff basado en las líneas eliminadas y agregadas del LLM
  const originalLines = originalCode.split("\n");
  const repairedLines = repairedCode ? repairedCode.split("\n") : [];
  const diff: Array<{
    type: "same" | "removed" | "added" | "modified";
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
        type: "added",
        repairedLine: repLine,
        repairedLineNumber: repLineNum,
      });
      repIdx++;
    } else if (repIdx >= repairedLines.length) {
      // Solo quedan líneas eliminadas
      diff.push({
        type: "removed",
        originalLine: origLine,
        originalLineNumber: origLineNum,
      });
      origIdx++;
    } else if (isRemoved && isAdded) {
      // Línea modificada
      diff.push({
        type: "modified",
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
        type: "removed",
        originalLine: origLine,
        originalLineNumber: origLineNum,
      });
      origIdx++;
    } else if (isAdded) {
      // Línea agregada
      diff.push({
        type: "added",
        repairedLine: repLine,
        repairedLineNumber: repLineNum,
      });
      repIdx++;
    } else {
      // Línea igual
      diff.push({
        type: "same",
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
  if (typeof document === "undefined") return null;

  // Durante la reparación mostramos un overlay propio (nuevo modal) con el loader unificado.
  if (isRepairing) {
    const handleCloseRepairOverlay = () => {
      repairAbortRef.current?.abort();
      repairAbortRef.current = null;
      clearRepairProgressAnimation();
      onClose();
    };

    return createPortal(
      <AAProgressLoader
        mode="repair"
        progress={repairProgress}
        message={tRepair("repairing")}
        isComplete={false}
        error={null}
        onClose={handleCloseRepairOverlay}
        showCloseButton
        allowPointerEvents={true}
      />,
      document.body,
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center glass-modal-overlay glass-modal-overlay-fixed modal-animate-in">
      <div className="glass-modal-container rounded-2xl shadow-xl max-w-6xl w-[95vw] h-[85vh] flex flex-col m-4 modal-animate-in">
        {/* Header */}
        <div className="glass-modal-header flex items-center justify-between px-6 py-4 rounded-t-2xl border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">
            {tView("repairWithAI")}
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
          {error && (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 max-w-2xl w-full">
                <p className="text-sm font-medium">{error}</p>
                <button
                  onClick={repairCode}
                  className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm font-semibold transition-colors"
                >
                  {tRepair("retry")}
                </button>
              </div>
            </div>
          )}

          {showComparison && repairedCode && (
            <div className="flex-1 flex flex-col overflow-hidden p-6 min-h-0">
              <h3 className="text-lg font-semibold text-white mb-4 flex-shrink-0">
                {tRepair("comparisonTitle")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
                {/* Código original */}
                <div className="flex flex-col min-h-0">
                  <div className="text-sm font-semibold text-red-300 mb-2 flex-shrink-0">
                    {tRepair("originalCode")}
                  </div>
                  <div className="bg-slate-900/80 rounded-lg border border-red-500/30 p-3 flex-1 overflow-auto min-h-0 scrollbar-custom">
                    <table className="text-sm w-full">
                      <tbody>
                        {diff.map((item, idx) => {
                          if (item.type === "added") return null;
                          return (
                            <tr key={idx} className="align-top">
                              <td className="pr-3 text-right text-slate-400 select-none w-8 py-1">
                                {item.originalLineNumber || ""}
                              </td>
                              <td
                                className={`font-mono text-[12px] whitespace-pre py-1 ${
                                  item.type === "removed" ||
                                  item.type === "modified"
                                    ? "text-red-400 bg-red-500/10"
                                    : "text-slate-200"
                                }`}
                              >
                                {item.originalLine || " "}
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
                  <div className="text-sm font-semibold text-blue-300 mb-2 flex-shrink-0">
                    {tRepair("repairedCode")}
                  </div>
                  <div className="bg-slate-900/80 rounded-lg border border-blue-500/30 p-3 flex-1 overflow-auto min-h-0 scrollbar-custom">
                    <table className="text-sm w-full">
                      <tbody>
                        {diff.map((item, idx) => {
                          if (item.type === "removed") return null;
                          return (
                            <tr key={idx} className="align-top">
                              <td className="pr-3 text-right text-slate-400 select-none w-8 py-1">
                                {item.repairedLineNumber || ""}
                              </td>
                              <td
                                className={`font-mono text-[12px] whitespace-pre py-1 ${
                                  item.type === "added" ||
                                  item.type === "modified"
                                    ? "text-blue-400 bg-blue-500/10"
                                    : "text-slate-200"
                                }`}
                              >
                                {item.repairedLine || " "}
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
              {tCommon("cancel")}
            </button>
            <button
              onClick={handleAccept}
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-all hover:scale-105 bg-gradient-to-br from-purple-500/20 to-purple-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-purple-500/30"
            >
              {tRepair("acceptChanges")}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
