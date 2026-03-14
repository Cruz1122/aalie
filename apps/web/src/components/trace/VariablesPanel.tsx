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
  recursionDiagram,
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
    const nodes = (recursionDiagram?.graph?.nodes ?? []) as Array<{
      id: string;
      data?: { label?: string };
    }>;

    const hasNodes = nodes.length > 0;
    const firstNode = hasNodes ? nodes[0] : null;
    const initialLabel =
      (firstNode && typeof firstNode.data?.label === "string"
        ? firstNode.data.label
        : "") || t("notAvailable");

    // Intentar primero con el id canónico "end_node"
    let endNode = nodes.find((n) => n.id === "end_node") || null;

    // Fallback heurístico por si el modelo no respetó exactamente el id
    if (!endNode && hasNodes) {
      endNode =
        nodes.find(
          (n) =>
            typeof n.data?.label === "string" &&
            (n.id.toLowerCase().includes("end") ||
              n.id.toLowerCase().includes("final") ||
              n.data.label.includes("Resultado") ||
              n.data.label.includes("→")),
        ) || null;
    }

    return (
      <div className="mb-3 grid grid-cols-1 gap-2">
        <div className="glass-card p-2 rounded-lg bg-slate-800/60 border border-white/10 h-[92px] overflow-y-auto">
          <div className="text-[11px] text-slate-400 mb-1 font-semibold">
            {t("initialVariables")}
          </div>
          <p className="text-[11px] text-slate-200 font-mono whitespace-pre-wrap">
            {initialLabel}
          </p>
        </div>
        {endNode ? (
          <div className="glass-card p-2 rounded-lg bg-slate-800/60 border border-white/10 h-[92px] overflow-y-auto">
            <div className="text-[11px] text-slate-400 mb-1 font-semibold">
              {t("finalVariables")}
            </div>
            <p className="text-[11px] text-slate-200 font-mono whitespace-pre-wrap">
              {endNode.data?.label}
            </p>
          </div>
        ) : (
          <div className="glass-card p-2 rounded-lg bg-slate-800/60 border border-white/10 h-[92px] overflow-y-auto">
            <div className="text-[11px] text-slate-400 mb-1 font-semibold">
              {t("finalVariables")}
            </div>
            <p className="text-[11px] text-slate-400">
              {t("noResultNode")}
            </p>
          </div>
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
              {t("lengthFixedHint", { names: lengthParamNames.join(", "), array: arrayKey })}
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

