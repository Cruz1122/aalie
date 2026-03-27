"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";

import type { TraceGraph } from "@/types/trace";

interface RecursionDiagram {
  graph: TraceGraph;
  explanation: string;
}

interface VariablesPanelProps {
  mode: "iterative" | "recursive";
  initialVariables?: Record<string, unknown>;
  finalVariables?: Record<string, unknown>;
  recursionDiagram?: RecursionDiagram | null;
  /** Modo editable: inputs para A (array) y x (número) en iterativos */
  editable?: boolean;
  onVariablesChange?: (vars: Record<string, unknown>) => void;
  onResetToAuto?: () => void;
  paramNames?: string[];
  arrayParamNames?: string[];
  scalarParamNames?: string[];
  /** Parámetros que son longitud del array (n, length, etc.): no editables, se fijan a len(A) */
  lengthParamNames?: string[];
}

export default function VariablesPanel({
  mode,
  initialVariables,
  finalVariables,
  editable = false,
  onVariablesChange,
  onResetToAuto,
  paramNames = [],
  arrayParamNames = [],
  scalarParamNames = [],
  lengthParamNames = [],
}: VariablesPanelProps) {
  const t = useTranslations("analyzer.executionTrace");
  if (mode === "recursive") {
    const filteredInitial = filterRecursiveVariables(initialVariables, paramNames);
    const filteredFinal = filterRecursiveVariables(finalVariables, paramNames);
    const hasInitial = Object.keys(filteredInitial).length > 0;
    const hasFinal = Object.keys(filteredFinal).length > 0;

    return (
      <div className="mb-3 grid grid-cols-1 gap-2">
        <div className="glass-card p-2 rounded-lg bg-slate-800/60 border border-white/10 h-[92px] overflow-y-auto">
          <div className="text-[11px] text-slate-400 mb-1 font-semibold">
            {t("initialVariables")}
          </div>
          {hasInitial ? (
            <div className="flex flex-wrap gap-1">
              {Object.entries(filteredInitial)
                .slice(0, 6)
                .map(([key, value]) => (
                  <span
                    key={`initial-${key}`}
                    className="text-[11px] text-slate-200 font-mono bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-700/60"
                  >
                    {key} = {formatVariableValue(value)}
                  </span>
                ))}
              {Object.keys(filteredInitial).length > 6 && (
                <span className="text-[11px] text-slate-400">{t("moreVariables")}</span>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400">{t("notAvailable")}</p>
          )}
        </div>
        <div className="glass-card p-2 rounded-lg bg-slate-800/60 border border-white/10 h-[92px] overflow-y-auto">
          <div className="text-[11px] text-slate-400 mb-1 font-semibold">
            {t("finalVariables")}
          </div>
          {hasFinal ? (
            <div className="flex flex-wrap gap-1">
              {Object.entries(filteredFinal)
                .slice(0, 6)
                .map(([key, value]) => (
                  <span
                    key={`final-${key}`}
                    className="text-[11px] text-slate-200 font-mono bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-700/60"
                  >
                    {key} = {formatVariableValue(value)}
                  </span>
                ))}
              {Object.keys(filteredFinal).length > 6 && (
                <span className="text-[11px] text-slate-400">{t("moreVariables")}</span>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400">{t("notAvailable")}</p>
          )}
        </div>
        {onVariablesChange && onResetToAuto && (
          <RecursiveJsonEditor
            initialVariables={filteredInitial}
            allowedKeys={paramNames}
            onVariablesChange={onVariablesChange}
            onResetToAuto={onResetToAuto}
            t={t}
          />
        )}
      </div>
    );
  }

  // Modo iterativo
  if (!initialVariables && !finalVariables && !editable) {
    return null;
  }

  // Modo editable iterativo: inputs para A (array) y x (número)
  if (mode === "iterative" && editable && onVariablesChange && onResetToAuto) {
    return (
      <IterativeEditableVariables
        initialVariables={initialVariables ?? {}}
        onVariablesChange={onVariablesChange}
        onResetToAuto={onResetToAuto}
        t={t}
        arrayParamNames={arrayParamNames}
        scalarParamNames={scalarParamNames}
        lengthParamNames={lengthParamNames}
      />
    );
  }

  const orderedEntries = (vars: Record<string, unknown> | undefined) => {
    if (!vars) return [] as Array<[string, unknown]>;
    if (paramNames.length === 0) return Object.entries(vars);
    const entries = Object.entries(vars);
    const byName = new Map(entries);
    const ordered: Array<[string, unknown]> = [];
    paramNames.forEach((name) => {
      if (byName.has(name)) {
        ordered.push([name, byName.get(name)]);
        byName.delete(name);
      }
    });
    byName.forEach((value, key) => ordered.push([key, value]));
    return ordered;
  };

  return (
    <div className="mb-3 grid grid-cols-1 gap-2">
      {/* Variables iniciales */}
      {initialVariables && Object.keys(initialVariables).length > 0 && (
        <div className="glass-card p-2 rounded-lg bg-slate-800/60 border border-white/10">
          <div className="text-[11px] text-slate-400 mb-1 font-semibold">
            {t("initialVariables")}
          </div>
          <div className="flex flex-wrap gap-1">
            {orderedEntries(initialVariables)
              .slice(0, 6)
              .map(([key, value]) => (
                <span
                  key={key}
                  className="text-[11px] text-slate-200 font-mono bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-700/60"
                >
                  {key} = {String(value)}
                </span>
              ))}
            {Object.keys(initialVariables).length > 6 && (
              <span className="text-[11px] text-slate-400">
                {t("moreVariables")}
              </span>
            )}
          </div>
        </div>
      )}
      {/* Variables finales */}
      {finalVariables && Object.keys(finalVariables).length > 0 && (
        <div className="glass-card p-2 rounded-lg bg-slate-800/60 border border-white/10">
          <div className="text-[11px] text-slate-400 mb-1 font-semibold">
            {t("finalVariables")}
          </div>
          <div className="flex flex-wrap gap-1">
            {orderedEntries(finalVariables)
              .slice(0, 6)
              .map(([key, value]) => (
                <span
                  key={key}
                  className="text-[11px] text-slate-200 font-mono bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-700/60"
                >
                  {key} = {String(value)}
                </span>
              ))}
            {Object.keys(finalVariables).length > 6 && (
              <span className="text-[11px] text-slate-400">
                {t("moreVariables")}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatVariableValue(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "undefined") return "undefined";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `[${value.map((v) => formatVariableValue(v)).join(", ")}]`;
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (("siguiente" in obj || "next" in obj) && ("valor" in obj || "value" in obj)) {
      const parts: string[] = [];
      let current: unknown = obj;
      let depth = 0;
      while (current && typeof current === "object" && depth < 5) {
        const node = current as Record<string, unknown>;
        const val = "valor" in node ? node.valor : node.value;
        parts.push(String(val));
        current = "siguiente" in node ? node.siguiente : node.next;
        depth += 1;
      }
      return current ? `${parts.join("→")}→...` : parts.join("→");
    }
    if ("valor" in obj && ("izquierda" in obj || "derecha" in obj || "left" in obj || "right" in obj)) {
      const val = obj.valor ?? obj.value;
      return `nodo(${String(val)})`;
    }
    return "{...}";
  }
  return String(value);
}

function filterRecursiveVariables(
  vars: Record<string, unknown> | undefined,
  paramNames: string[],
): Record<string, unknown> {
  if (!vars) return {};
  if (!paramNames || paramNames.length === 0) {
    return Object.fromEntries(
      Object.entries(vars).filter(([key]) => key && key !== "_" && key !== "n"),
    );
  }
  const nameSet = new Set(paramNames);
  const filtered = Object.fromEntries(
    Object.entries(vars).filter(([key]) => nameSet.has(key)),
  );
  return filtered;
}

function RecursiveJsonEditor({
  initialVariables,
  allowedKeys,
  onVariablesChange,
  onResetToAuto,
  t,
}: {
  initialVariables: Record<string, unknown>;
  allowedKeys: string[];
  onVariablesChange: (vars: Record<string, unknown>) => void;
  onResetToAuto: () => void;
  t: (key: string, values?: Record<string, string>) => string;
}) {
  const [jsonText, setJsonText] = useState<string>(
    JSON.stringify(initialVariables ?? {}, null, 2),
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    setJsonText(JSON.stringify(initialVariables ?? {}, null, 2));
    setJsonError(null);
  }, [initialVariables]);

  const handleApply = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        setJsonError(t("jsonVarsObjectRequired"));
        return;
      }
      let normalized = parsed as Record<string, unknown>;
      if (allowedKeys.length > 0) {
        const keySet = new Set(allowedKeys);
        normalized = Object.fromEntries(
          Object.entries(normalized).filter(([key]) => keySet.has(key)),
        );
      }
      setJsonError(null);
      onVariablesChange(normalized);
    } catch {
      setJsonError(t("jsonVarsInvalid"));
    }
  };

  return (
    <div className="glass-card p-2 rounded-lg bg-slate-800/60 border border-white/10">
      <div className="text-[11px] text-slate-400 mb-1 font-semibold">
        {t("editVariablesJson")}
      </div>
      <p className="text-[10px] text-slate-500 mb-2">{t("jsonEditableHint")}</p>
      <textarea
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        className="w-full min-h-[130px] bg-slate-900/80 border border-slate-600 rounded px-2 py-1 text-[11px] font-mono text-slate-200 resize-y"
        spellCheck={false}
      />
      {jsonError && <p className="mt-2 text-[11px] text-red-300">{jsonError}</p>}
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={handleApply}
          className="text-[11px] px-2 py-1 rounded bg-sky-500/30 text-sky-200 border border-sky-500/50 hover:bg-sky-500/40"
        >
          {t("apply")}
        </button>
        <button
          type="button"
          onClick={onResetToAuto}
          className="text-[11px] px-2 py-1 rounded bg-slate-600/40 text-slate-300 border border-slate-500/50 hover:bg-slate-600/60"
        >
          {t("resetToAuto")}
        </button>
      </div>
    </div>
  );
}

function IterativeEditableVariables({
  initialVariables,
  onVariablesChange,
  onResetToAuto,
  t,
  arrayParamNames,
  scalarParamNames,
  lengthParamNames = [],
}: {
  initialVariables: Record<string, unknown>;
  onVariablesChange: (vars: Record<string, unknown>) => void;
  onResetToAuto: () => void;
  t: (key: string) => string;
  arrayParamNames: string[];
  scalarParamNames: string[];
  lengthParamNames?: string[];
}) {
  const variableEntries = Object.entries(initialVariables);
  const arrayKey = arrayParamNames[0] ?? variableEntries.find(([, value]) => Array.isArray(value))?.[0] ?? "A";
  const arrayEntry = variableEntries.find(([key, value]) => key === arrayKey || Array.isArray(value));
  const arrVal = arrayEntry?.[1];
  const arrStr = Array.isArray(arrVal)
    ? (arrVal as number[]).join(", ")
    : typeof arrVal === "string"
      ? arrVal
      : "";

  const [arrayInput, setArrayInput] = useState(arrStr);
  const scalarInputs = scalarParamNames.reduce(
    (acc, name) => {
      const val = initialVariables[name];
      acc[name] = typeof val === "number" ? String(val) : typeof val === "string" ? val : "";
      return acc;
    },
    {} as Record<string, string>,
  );
  const [scalarState, setScalarState] = useState<Record<string, string>>(scalarInputs);

  useEffect(() => {
    setArrayInput(arrStr);
  }, [arrStr]);

  useEffect(() => {
    const next: Record<string, string> = {};
    scalarParamNames.forEach((name) => {
      const val = initialVariables[name];
      next[name] = typeof val === "number" ? String(val) : typeof val === "string" ? val : "";
    });
    setScalarState(next);
  }, [initialVariables, scalarParamNames]);

  const handleApply = () => {
    const vars: Record<string, unknown> = {};
    const parsed = arrayInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => parseFloat(s))
      .filter((num) => !Number.isNaN(num));
    const arr = parsed.length > 0 ? parsed : (Array.isArray(initialVariables[arrayKey]) ? (initialVariables[arrayKey] as number[]) : []);
    if (arr.length > 0) {
      vars[arrayKey] = arr;
      lengthParamNames.forEach((lenKey) => {
        vars[lenKey] = arr.length;
      });
    }
    scalarParamNames.forEach((key) => {
      const str = scalarState[key] ?? "";
      const num = parseFloat(str);
      if (!Number.isNaN(num)) vars[key] = num;
    });
    if (Object.keys(vars).length > 0) {
      onVariablesChange(vars);
    }
  };

  const handleReset = () => {
    onResetToAuto();
  };

  return (
    <div className="mb-3 grid grid-cols-1 gap-2">
      <div className="glass-card p-2 rounded-lg bg-slate-800/60 border border-white/10">
        <div className="text-[11px] text-slate-400 mb-1 font-semibold">
          {t("editVariables")}
        </div>
        <p className="text-[10px] text-slate-500 mb-2">{t("arrayEditableHint")}</p>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] text-slate-400">
            {arrayKey} (array):
            <input
              type="text"
              value={arrayInput}
              onChange={(e) => setArrayInput(e.target.value)}
              className="ml-1 w-full max-w-[200px] bg-slate-900/80 border border-slate-600 rounded px-2 py-1 text-[11px] font-mono text-slate-200"
              placeholder="1, 2, 3, 4"
            />
          </label>
          {lengthParamNames.length > 0 && (
            <p className="text-[10px] text-slate-500">
              {(t as (key: string, values?: Record<string, string>) => string)("lengthFixedHint", {
                names: lengthParamNames.join(", "),
                array: arrayKey,
              })}
            </p>
          )}
          {scalarParamNames.map((key) => (
            <label key={key} className="text-[11px] text-slate-400">
              {key}:
              <input
                type="text"
                value={scalarState[key] ?? ""}
                onChange={(e) => setScalarState((s) => ({ ...s, [key]: e.target.value }))}
                className="ml-1 w-full max-w-[80px] bg-slate-900/80 border border-slate-600 rounded px-2 py-1 text-[11px] font-mono text-slate-200"
                placeholder="1"
              />
            </label>
          ))}
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={handleApply}
              className="text-[11px] px-2 py-1 rounded bg-sky-500/30 text-sky-200 border border-sky-500/50 hover:bg-sky-500/40"
            >
              {t("apply")}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] px-2 py-1 rounded bg-slate-600/40 text-slate-300 border border-slate-500/50 hover:bg-slate-600/60"
            >
              {t("resetToAuto")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
