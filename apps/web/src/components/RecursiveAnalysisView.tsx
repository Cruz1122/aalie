"use client";

import type { AnalyzeOpenResponse } from "@aa/types";
import React, { useEffect, useMemo, useState } from "react";

import CharacteristicEquationModal from "./CharacteristicEquationModal";
import DPVersionModal from "./DPVersionModal";
import Formula from "./Formula";
import IterationProcedureModal from "./IterationProcedureModal";
import RecursionTreeModal from "./RecursionTreeModal";
import RecursionTreeProcedureModal from "./RecursionTreeProcedureModal";
import RecursionTreeStepsModal from "./RecursionTreeStepsModal";
import RecursiveProcedureModal from "./RecursiveProcedureModal";

type RecurrenceType = AnalyzeOpenResponse["totals"]["recurrence"];
type CharacteristicEquationType =
  AnalyzeOpenResponse["totals"]["characteristic_equation"];
type IterationType = AnalyzeOpenResponse["totals"]["iteration"];
type RecursionTreeType = AnalyzeOpenResponse["totals"]["recursion_tree"];
type MasterType = AnalyzeOpenResponse["totals"]["master"];
type ProofType = AnalyzeOpenResponse["totals"]["proof"];

type CaseType = "worst" | "best" | "average";

/**
 * Obtiene la etiqueta en español para un tipo de caso.
 * @param caseType - Tipo de caso (worst, best, average)
 * @returns Etiqueta en español del caso
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const getCaseLabel = (caseType: CaseType): string => {
  switch (caseType) {
    case "worst":
      return "Peor caso";
    case "best":
      return "Mejor caso";
    case "average":
      return "Caso promedio";
  }
};

/**
 * Obtiene las clases CSS para el badge de un tipo de caso.
 * @param caseType - Tipo de caso (worst, best, average)
 * @returns String con las clases CSS para el badge
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const getCaseBadgeStyle = (caseType: CaseType): string => {
  switch (caseType) {
    case "worst":
      return "bg-red-500/20 text-red-300 border-red-500/30";
    case "best":
      return "bg-green-500/20 text-green-300 border-green-500/30";
    case "average":
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
  }
};

/**
 * Obtiene las clases CSS para el botón selector de caso.
 * @param caseType - Tipo de caso (worst, best, average)
 * @param isSelected - Indica si el caso está seleccionado
 * @returns String con las clases CSS para el botón
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const getSelectorButtonStyle = (
  caseType: CaseType,
  isSelected: boolean,
): string => {
  const baseStyle = "transition-colors duration-150";
  if (isSelected) {
    switch (caseType) {
      case "worst":
        return `${baseStyle} bg-red-500/30 text-red-200 border border-red-500/50`;
      case "best":
        return `${baseStyle} bg-green-500/30 text-green-200 border border-green-500/50`;
      case "average":
        return `${baseStyle} bg-yellow-500/30 text-yellow-200 border border-yellow-500/50`;
    }
  }
  return `${baseStyle} text-slate-400 hover:text-slate-200`;
};

/**
 * Obtiene el color del icono según el método de análisis utilizado.
 * @param isCharacteristicMethod - Indica si es método de ecuación característica
 * @param isIterationMethod - Indica si es método de iteración
 * @param isRecursionTreeMethod - Indica si es método de árbol de recursión
 * @returns String con la clase CSS del color del icono
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const getMethodIconColor = (
  isCharacteristicMethod: boolean,
  isIterationMethod: boolean,
  isRecursionTreeMethod: boolean,
): string => {
  if (isCharacteristicMethod) return "text-blue-400";
  if (isIterationMethod) return "text-purple-400";
  if (isRecursionTreeMethod) return "text-cyan-400";
  return "text-orange-400";
};

/**
 * Obtiene el nombre del icono según el método de análisis utilizado.
 * @param isCharacteristicMethod - Indica si es método de ecuación característica
 * @param isIterationMethod - Indica si es método de iteración
 * @param isRecursionTreeMethod - Indica si es método de árbol de recursión
 * @returns String con el nombre del icono Material Symbols
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const getMethodIconName = (
  isCharacteristicMethod: boolean,
  isIterationMethod: boolean,
  isRecursionTreeMethod: boolean,
): string => {
  if (isCharacteristicMethod) return "calculate";
  if (isIterationMethod) return "unfold_more";
  if (isRecursionTreeMethod) return "account_tree";
  return "science";
};

/**
 * Obtiene las clases CSS para el badge del método de análisis.
 * @param isCharacteristicMethod - Indica si es método de ecuación característica
 * @param isIterationMethod - Indica si es método de iteración
 * @param isRecursionTreeMethod - Indica si es método de árbol de recursión
 * @returns String con las clases CSS para el badge
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const getMethodBadgeStyle = (
  isCharacteristicMethod: boolean,
  isIterationMethod: boolean,
  isRecursionTreeMethod: boolean,
): string => {
  if (isCharacteristicMethod)
    return "bg-blue-500/20 text-blue-300 border-blue-500/30";
  if (isIterationMethod)
    return "bg-purple-500/20 text-purple-300 border-purple-500/30";
  if (isRecursionTreeMethod)
    return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
  return "bg-orange-500/20 text-orange-300 border-orange-500/30";
};

/**
 * Obtiene el texto del badge según el método de análisis utilizado.
 * @param isCharacteristicMethod - Indica si es método de ecuación característica
 * @param isIterationMethod - Indica si es método de iteración
 * @param isRecursionTreeMethod - Indica si es método de árbol de recursión
 * @returns String con el texto del badge en español
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const getMethodBadgeText = (
  isCharacteristicMethod: boolean,
  isIterationMethod: boolean,
  isRecursionTreeMethod: boolean,
): string => {
  if (isCharacteristicMethod) return "Ecuación Característica";
  if (isIterationMethod) return "Método de Iteración";
  if (isRecursionTreeMethod) return "Árbol de Recursión";
  return "Teorema Maestro";
};

/**
 * Obtiene los datos de análisis para el caso seleccionado.
 * @param selectedCase - Tipo de caso seleccionado
 * @param worstData - Datos del peor caso
 * @param bestData - Datos del mejor caso
 * @param avgData - Datos del caso promedio
 * @returns Datos de análisis correspondientes al caso seleccionado, o fallback si no están disponibles
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const getDataForSelectedCase = (
  selectedCase: CaseType,
  worstData: AnalyzeOpenResponse | null | undefined,
  bestData: AnalyzeOpenResponse | null | undefined,
  avgData: AnalyzeOpenResponse | null | undefined,
): AnalyzeOpenResponse | null | undefined => {
  if (selectedCase === "worst") return worstData;
  if (selectedCase === "best") return bestData;
  return avgData || worstData || bestData;
};

/**
 * Extrae los parámetros de una recurrencia divide-and-conquer con método.
 * @param recurrence - Recurrencia divide-and-conquer con método opcional
 * @returns Objeto con los parámetros de la recurrencia y el método (iteration o master)
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const extractDivideConquerRecurrence = (recurrence: {
  type: "divide_conquer";
  form: string;
  a: number;
  b: number;
  f: string;
  n0: number;
  applicable: boolean;
  notes: string[];
  method?: "master" | "iteration" | "recursion_tree";
}): {
  form: string;
  a: number;
  b: number;
  f: string;
  n0: number;
  applicable: boolean;
  notes: string[];
  method: "iteration" | "master";
} => {
  const method: "iteration" | "master" =
    recurrence.method === "iteration" ? "iteration" : "master";
  return {
    form: recurrence.form,
    a: recurrence.a,
    b: recurrence.b,
    f: recurrence.f,
    n0: recurrence.n0,
    applicable: recurrence.applicable,
    notes: recurrence.notes,
    method,
  };
};

/**
 * Extrae los parámetros de una recurrencia divide-and-conquer sin el método.
 * @param recurrence - Recurrencia divide-and-conquer sin método
 * @returns Objeto con los parámetros de la recurrencia (sin método)
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const extractDivideConquerRecurrenceWithoutMethod = (recurrence: {
  type: "divide_conquer";
  form: string;
  a: number;
  b: number;
  f: string;
  n0: number;
  applicable: boolean;
  notes: string[];
}) => {
  return {
    form: recurrence.form,
    a: recurrence.a,
    b: recurrence.b,
    f: recurrence.f,
    n0: recurrence.n0,
    applicable: recurrence.applicable,
    notes: recurrence.notes,
  };
};

/**
 * Renderiza la ecuación de eficiencia según el método y si hay diferentes complejidades.
 * @param isMasterMethod - Indica si es método del teorema maestro
 * @param hasDifferentComplexities - Indica si hay diferentes complejidades entre casos
 * @param currentTheta - Theta del caso actual (para teorema maestro)
 * @param bestT - Ecuación del mejor caso
 * @param avgT - Ecuación del caso promedio
 * @param worstT - Ecuación del peor caso
 * @param theta - Theta general (fallback)
 * @returns Elemento React con la(s) ecuación(es) de eficiencia renderizada(s)
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const renderEfficiencyEquation = (
  isMasterMethod: boolean,
  hasDifferentComplexities: boolean,
  currentTheta: string | null | undefined,
  bestT: string,
  avgT: string,
  worstT: string,
  theta: string | null | undefined,
): React.JSX.Element => {
  if (isMasterMethod && hasDifferentComplexities) {
    // Para teorema maestro con diferentes complejidades, mostrar solo la ecuación del caso seleccionado
    return (
      <Formula
        latex={`T(n) = ${roundLatexNumbers(currentTheta || "N/A")}`}
        display
      />
    );
  }

  if (hasDifferentComplexities) {
    // Para otros métodos con diferentes complejidades, mostrar todas en la misma línea
    return (
      <div className="flex flex-row gap-4 items-center justify-center flex-wrap">
        <div className="text-center">
          <div className="text-xs text-green-300 mb-1">Mejor caso:</div>
          <Formula latex={`T(n) = ${roundLatexNumbers(bestT)}`} display />
        </div>
        <div className="text-center">
          <div className="text-xs text-yellow-300 mb-1">Caso promedio:</div>
          <Formula latex={`T(n) = ${roundLatexNumbers(avgT)}`} display />
        </div>
        <div className="text-center">
          <div className="text-xs text-red-300 mb-1">Peor caso:</div>
          <Formula latex={`T(n) = ${roundLatexNumbers(worstT)}`} display />
        </div>
      </div>
    );
  }

  // Sin diferencias, mostrar una sola ecuación
  return (
    <Formula
      latex={`T(n) = ${roundLatexNumbers(theta || bestT || worstT || avgT || "N/A")}`}
      display
    />
  );
};

interface ProcedureModalProps {
  readonly isCharacteristicMethod: boolean;
  readonly isIterationMethod: boolean;
  readonly isRecursionTreeMethod: boolean;
  readonly showCharacteristicModal: boolean;
  readonly showProcedureModal: boolean;
  readonly setShowCharacteristicModal: (show: boolean) => void;
  readonly setShowProcedureModal: (show: boolean) => void;
  readonly recurrence: RecurrenceType;
  readonly characteristicEquation: CharacteristicEquationType;
  readonly worstData: AnalyzeOpenResponse | null | undefined;
  readonly bestData: AnalyzeOpenResponse | null | undefined;
  readonly avgData: AnalyzeOpenResponse | null | undefined;
  readonly iteration: IterationType;
  readonly recursionTree: RecursionTreeType;
  readonly master: MasterType;
  readonly currentMaster: MasterType;
  readonly proof: ProofType;
  readonly currentProof: ProofType;
  readonly theta: string | null | undefined;
  readonly T_open: string | null | undefined;
  readonly selectedCase: CaseType;
  readonly currentTheta: string | null | undefined;
}

/**
 * Renderiza el modal de ecuación característica.
 * @param props - Propiedades del modal de procedimiento
 * @returns Elemento React del modal de ecuación característica
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const renderCharacteristicModal = (
  props: ProcedureModalProps,
): React.JSX.Element => {
  return (
    <CharacteristicEquationModal
      open={props.showCharacteristicModal}
      onClose={() => props.setShowCharacteristicModal(false)}
      recurrence={props.recurrence}
      characteristicEquation={props.characteristicEquation}
      proof={props.proof}
      theta={props.theta || props.T_open}
    />
  );
};

/**
 * Renderiza el modal de método de iteración.
 * @param props - Propiedades del modal de procedimiento
 * @returns Elemento React del modal de método de iteración
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const renderIterationModal = (
  props: ProcedureModalProps,
): React.JSX.Element => {
  const divideConquerRecurrence =
    props.recurrence?.type === "divide_conquer"
      ? extractDivideConquerRecurrence(
          props.recurrence as {
            type: "divide_conquer";
            form: string;
            a: number;
            b: number;
            f: string;
            n0: number;
            applicable: boolean;
            notes: string[];
            method?: "master" | "iteration" | "recursion_tree";
          },
        )
      : null;

  return (
    <IterationProcedureModal
      open={props.showProcedureModal}
      onClose={() => props.setShowProcedureModal(false)}
      data={props.worstData || props.bestData || props.avgData}
      recurrence={divideConquerRecurrence}
      iteration={props.iteration}
      proof={props.proof}
      theta={props.theta || props.T_open}
    />
  );
};

/**
 * Renderiza el modal de árbol de recursión.
 * @param props - Propiedades del modal de procedimiento
 * @returns Elemento React del modal de árbol de recursión
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const renderRecursionTreeModal = (
  props: ProcedureModalProps,
): React.JSX.Element => {
  const divideConquerRecurrence =
    props.recurrence?.type === "divide_conquer"
      ? extractDivideConquerRecurrenceWithoutMethod(
          props.recurrence as {
            type: "divide_conquer";
            form: string;
            a: number;
            b: number;
            f: string;
            n0: number;
            applicable: boolean;
            notes: string[];
          },
        )
      : null;

  return (
    <RecursionTreeProcedureModal
      open={props.showProcedureModal}
      onClose={() => props.setShowProcedureModal(false)}
      data={props.worstData || props.bestData || props.avgData}
      recurrence={divideConquerRecurrence}
      recursionTree={props.recursionTree}
      proof={props.proof}
      theta={props.theta || props.T_open}
    />
  );
};

/**
 * Renderiza el modal del teorema maestro.
 * @param props - Propiedades del modal de procedimiento
 * @returns Elemento React del modal del teorema maestro
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const renderMasterModal = (props: ProcedureModalProps): React.JSX.Element => {
  const divideConquerRecurrence =
    props.recurrence?.type === "divide_conquer"
      ? extractDivideConquerRecurrenceWithoutMethod(
          props.recurrence as {
            type: "divide_conquer";
            form: string;
            a: number;
            b: number;
            f: string;
            n0: number;
            applicable: boolean;
            notes: string[];
          },
        )
      : null;

  return (
    <RecursiveProcedureModal
      open={props.showProcedureModal}
      onClose={() => props.setShowProcedureModal(false)}
      data={getDataForSelectedCase(
        props.selectedCase,
        props.worstData,
        props.bestData,
        props.avgData,
      )}
      recurrence={divideConquerRecurrence}
      master={props.currentMaster || props.master}
      proof={props.currentProof ?? props.proof}
      theta={props.currentTheta || props.theta || props.T_open}
    />
  );
};

/**
 * Renderiza el modal de procedimiento según el método de análisis utilizado.
 * @param props - Propiedades del modal de procedimiento
 * @returns Elemento React del modal correspondiente o null
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const renderProcedureModal = (
  props: ProcedureModalProps,
): React.JSX.Element | null => {
  if (props.isCharacteristicMethod) {
    return renderCharacteristicModal(props);
  }

  if (props.isIterationMethod) {
    return renderIterationModal(props);
  }

  if (props.isRecursionTreeMethod) {
    return renderRecursionTreeModal(props);
  }

  return renderMasterModal(props);
};

/**
 * Renderiza los badges informativos de la ecuación característica (homogénea/no homogénea, DP).
 * @param characteristicEquation - Datos de la ecuación característica
 * @returns Elemento React con los badges o null si no hay ecuación característica
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const renderCharacteristicBadges = (
  characteristicEquation: CharacteristicEquationType,
): React.JSX.Element | null => {
  if (!characteristicEquation) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Badge de Homogénea/No Homogénea */}
      {characteristicEquation.particular_solution ? (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-semibold border bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
          <span className="material-symbols-outlined text-xs mr-1">
            functions
          </span>{" "}
          No Homogénea
        </span>
      ) : (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-semibold border bg-blue-500/20 text-blue-300 border-blue-500/30">
          <span className="material-symbols-outlined text-xs mr-1">
            functions
          </span>{" "}
          Homogénea
        </span>
      )}
      {/* Badge de DP si aplica */}
      {characteristicEquation.is_dp_linear && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-semibold border bg-green-500/20 text-green-300 border-green-500/30">
          <span className="material-symbols-outlined text-xs mr-1">memory</span>{" "}
          DP Lineal Detectada
        </span>
      )}
    </div>
  );
};

/**
 * Renderiza los parámetros de la recurrencia según su tipo (divide_conquer o linear_shift).
 * @param recurrence - Datos de la recurrencia
 * @returns Elemento React con los parámetros renderizados como fórmulas LaTeX
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const renderRecurrenceParameters = (
  recurrence: NonNullable<RecurrenceType>,
): React.JSX.Element => {
  if (recurrence.type === "divide_conquer") {
    return (
      <>
        <Formula latex={`a = ${recurrence.a}`} />
        <span className="text-slate-300">,</span>
        <Formula latex={`b = ${recurrence.b}`} />
        <span className="text-slate-300">,</span>
        <Formula latex={`f(n) = ${recurrence.f}`} />
        <span className="text-slate-300">,</span>
        <Formula latex={`n_0 = ${recurrence.n0}`} />
      </>
    );
  }

  return (
    <>
      {recurrence["g(n)"] && (
        <>
          <Formula latex={`g(n) = ${recurrence["g(n)"]}`} />
          <span className="text-slate-300">,</span>
        </>
      )}
      <Formula latex={`orden = ${recurrence.order}`} />
      <span className="text-slate-300">,</span>
      <Formula latex={`desplazamientos = [${recurrence.shifts.join(", ")}]`} />
      <span className="text-slate-300">,</span>
      <Formula latex={`n_0 = ${recurrence.n0}`} />
    </>
  );
};

interface ActionButtonsProps {
  readonly isCharacteristicMethod: boolean;
  readonly isRecursionTreeMethod: boolean;
  readonly proof: ProofType;
  readonly setShowCharacteristicModal: (show: boolean) => void;
  readonly setShowProcedureModal: (show: boolean) => void;
  readonly setShowStepsModal: (show: boolean) => void;
  readonly setShowDPModal: (show: boolean) => void;
  readonly characteristicEquation: CharacteristicEquationType;
}

/**
 * Renderiza los botones de acción (Ver Detalles, Ver Paso a Paso, Ver Versión DP).
 * @param props - Propiedades de los botones de acción
 * @returns Elemento React con los botones de acción
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const renderActionButtons = (props: ActionButtonsProps): React.JSX.Element => {
  const showGrid =
    (props.isRecursionTreeMethod && props.proof && props.proof.length > 0) ||
    props.isCharacteristicMethod;

  const handleDetailsClick = () => {
    if (props.isCharacteristicMethod) {
      props.setShowCharacteristicModal(true);
    } else {
      props.setShowProcedureModal(true);
    }
  };

  return (
    <div className={`mb-4 ${showGrid ? "grid grid-cols-2 gap-3" : ""}`}>
      <button
        onClick={handleDetailsClick}
        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold text-white glass-secondary hover:bg-sky-500/20 transition-colors ${showGrid ? "" : "w-full"}`}
      >
        <span className="material-symbols-outlined text-sm">info</span>
        <span>Ver Detalles</span>
      </button>
      {props.isRecursionTreeMethod && props.proof && props.proof.length > 0 && (
        <button
          onClick={() => props.setShowStepsModal(true)}
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold text-white glass-secondary hover:bg-purple-500/20 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">description</span>
          <span>Ver Paso a Paso</span>
        </button>
      )}
      {props.isCharacteristicMethod &&
        props.characteristicEquation?.is_dp_linear && (
          <button
            onClick={() => props.setShowDPModal(true)}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold text-white glass-secondary hover:bg-green-500/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">memory</span>
            <span>Ver Versión DP</span>
          </button>
        )}
    </div>
  );
};

/**
 * Determina si se debe mostrar el botón de árbol de recurrencia.
 * @param isRecursionTreeMethod - Indica si es método de árbol de recursión
 * @param isCharacteristicMethod - Indica si es método de ecuación característica
 * @param isMasterMethod - Indica si es método del teorema maestro
 * @param isIterationMethod - Indica si es método de iteración
 * @param recurrence - Datos de la recurrencia
 * @returns true si se debe mostrar el botón, false en caso contrario
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const shouldShowTreeButton = (
  isRecursionTreeMethod: boolean,
  isCharacteristicMethod: boolean,
  isMasterMethod: boolean,
  isIterationMethod: boolean,
  recurrence: RecurrenceType,
): boolean => {
  if (isRecursionTreeMethod && recurrence?.type === "divide_conquer")
    return true;
  if (isCharacteristicMethod && recurrence?.type === "linear_shift")
    return true;
  if (isMasterMethod && recurrence?.type === "divide_conquer") return true;
  if (isIterationMethod && recurrence?.type === "divide_conquer") return true;
  return false;
};

interface EmptyStateProps {
  readonly recurrence: RecurrenceType;
  readonly master: MasterType;
  readonly iteration: IterationType;
  readonly recursionTree: RecursionTreeType;
  readonly worstData: AnalyzeOpenResponse | null | undefined;
  readonly bestData: AnalyzeOpenResponse | null | undefined;
  readonly avgData: AnalyzeOpenResponse | null | undefined;
}

/**
 * Renderiza el estado vacío cuando no hay datos de análisis disponibles.
 * @param props - Propiedades del estado vacío
 * @returns Elemento React del estado vacío
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const renderEmptyState = (props: EmptyStateProps): React.JSX.Element => {
  return (
    <div className="flex-1 flex items-center justify-center text-slate-400">
      <div className="text-center">
        <span className="material-symbols-outlined text-4xl mb-2 block">
          hourglass_empty
        </span>
        <p>Ejecuta el análisis para ver los resultados</p>
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 text-xs text-red-400">
            <p>
              Debug: recurrence={props.recurrence ? "✓" : "✗"}, master=
              {props.master ? "✓" : "✗"}, iteration=
              {props.iteration ? "✓" : "✗"}, recursionTree=
              {props.recursionTree ? "✓" : "✗"}
            </p>
            <p>
              Data structure:{" "}
              {JSON.stringify({
                hasWorst: !!props.worstData,
                hasBest: !!props.bestData,
                hasAvg: !!props.avgData,
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface RecursionTreeCardsProps {
  readonly recursionTree: RecursionTreeType;
  readonly hasDifferentComplexities: boolean;
  readonly bestT: string;
  readonly avgT: string;
  readonly worstT: string;
  readonly theta: string | null | undefined;
}

/**
 * Renderiza las tarjetas de información del método de árbol de recursión (nivel dominante y ecuación de eficiencia).
 * @param props - Propiedades de las tarjetas de árbol de recursión
 * @returns Elemento React con las tarjetas renderizadas
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const renderRecursionTreeCards = (
  props: RecursionTreeCardsProps,
): React.JSX.Element => {
  /**
   * Obtiene el texto descriptivo del nivel dominante en el árbol de recursión.
   * @param level - Nivel dominante (leaves, root, all, o undefined)
   * @returns Texto en español que describe el nivel dominante
   * @author Juan Camilo Cruz Parra (@Cruz1122)
   */
  const getDominatingLevelText = (
    level: string | number | undefined,
  ): string => {
    if (level === "leaves") return "Dominan las hojas";
    if (level === "root") return "Domina la raíz";
    if (level === "all") return "Trabajo equilibrado";
    return "Nivel dominante";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Nivel Dominante */}
      <div className="glass-card p-3 rounded-lg shadow-[0_8px_32px_0_rgba(6,182,212,0.3)] hover:shadow-[0_12px_40px_0_rgba(6,182,212,0.4)] h-full flex flex-col">
        <div className="flex flex-col gap-2 flex-1">
          <h3 className="font-semibold text-cyan-300 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-base">
              trending_up
            </span>
            <span>Nivel Dominante</span>
          </h3>
          <div className="bg-slate-800/60 p-3 rounded border border-white/10 flex flex-col items-center justify-center gap-2 flex-1 min-h-[120px]">
            <div className="text-base font-semibold text-cyan-300 text-center">
              {getDominatingLevelText(
                props.recursionTree?.dominating_level?.level,
              )}
            </div>
            <div className="text-center overflow-x-auto w-full max-w-full">
              <div className="text-xs scale-85">
                <Formula
                  latex={props.recursionTree?.dominating_level?.reason || ""}
                  display
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ecuación de Eficiencia */}
      <div className="glass-card p-3 rounded-lg shadow-[0_8px_32px_0_rgba(6,182,212,0.3)] hover:shadow-[0_12px_40px_0_rgba(6,182,212,0.4)] h-full flex flex-col">
        <div className="flex flex-col gap-2 flex-1">
          <h3 className="font-semibold text-cyan-300 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-base">
              functions
            </span>
            <span>Ecuación de Eficiencia</span>
          </h3>
          <div className="bg-slate-800/60 p-3 rounded border border-white/10 flex flex-col items-center justify-center gap-3 overflow-x-auto flex-1 min-h-[120px]">
            {props.hasDifferentComplexities ? (
              <div className="flex flex-row gap-4 items-center justify-center flex-wrap">
                <div className="text-center">
                  <div className="text-xs text-green-300 mb-1">Mejor caso:</div>
                  <Formula latex={`T(n) = ${props.bestT}`} display />
                </div>
                <div className="text-center">
                  <div className="text-xs text-yellow-300 mb-1">
                    Caso promedio:
                  </div>
                  <Formula latex={`T(n) = ${props.avgT}`} display />
                </div>
                <div className="text-center">
                  <div className="text-xs text-red-300 mb-1">Peor caso:</div>
                  <Formula latex={`T(n) = ${props.worstT}`} display />
                </div>
              </div>
            ) : (
              <Formula
                latex={`T(n) = ${roundLatexNumbers(props.theta || props.recursionTree?.theta || props.worstT || "N/A")}`}
                display
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface EfficiencyCardProps {
  readonly isMasterMethod: boolean;
  readonly isIterationMethod: boolean;
  readonly hasDifferentComplexities: boolean;
  readonly selectedCase: CaseType;
  readonly setSelectedCase: (caseType: CaseType) => void;
  readonly currentTheta: string | null | undefined;
  readonly bestT: string;
  readonly avgT: string;
  readonly worstT: string;
  readonly theta: string | null | undefined;
}

/**
 * Renderiza la tarjeta de ecuación de eficiencia con selector de casos (para teorema maestro).
 * @param props - Propiedades de la tarjeta de eficiencia
 * @returns Elemento React con la tarjeta de eficiencia renderizada
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const renderEfficiencyCard = (
  props: EfficiencyCardProps,
): React.JSX.Element => {
  return (
    <div className="glass-card p-7 rounded-lg shadow-[0_8px_32px_0_rgba(59,130,246,0.3)] hover:shadow-[0_12px_40px_0_rgba(59,130,246,0.4)] border border-blue-500/20 flex-shrink-0">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-blue-400">
            functions
          </span>
          Ecuación de Eficiencia
          {props.isMasterMethod && props.hasDifferentComplexities && (
            <span
              className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border tracking-wide ${getCaseBadgeStyle(props.selectedCase)}`}
            >
              {getCaseLabel(props.selectedCase)}
            </span>
          )}
        </h3>
        {/* Switch de casos (solo para teorema maestro con diferentes complejidades) */}
        {props.isMasterMethod && props.hasDifferentComplexities && (
          <div className="flex items-center gap-1 bg-slate-800/60 border border-white/10 rounded-lg p-1">
            <button
              onClick={() => props.setSelectedCase("best")}
              className={`px-2 py-1 text-xs rounded-md ${getSelectorButtonStyle("best", props.selectedCase === "best")}`}
            >
              Mejor
            </button>
            <button
              onClick={() => props.setSelectedCase("average")}
              className={`px-2 py-1 text-xs rounded-md ${getSelectorButtonStyle("average", props.selectedCase === "average")}`}
            >
              Promedio
            </button>
            <button
              onClick={() => props.setSelectedCase("worst")}
              className={`px-2 py-1 text-xs rounded-md ${getSelectorButtonStyle("worst", props.selectedCase === "worst")}`}
            >
              Peor
            </button>
          </div>
        )}
      </div>
      <div
        className={`rounded-lg bg-slate-800/60 border border-blue-500/30 flex justify-center items-center overflow-x-auto ${
          props.isIterationMethod ? "p-7 min-h-[140px]" : "p-6 min-h-[120px]"
        }`}
      >
        {renderEfficiencyEquation(
          props.isMasterMethod,
          props.hasDifferentComplexities,
          props.currentTheta,
          props.bestT,
          props.avgT,
          props.worstT,
          props.theta,
        )}
      </div>
    </div>
  );
};

/**
 * Redondea los valores numéricos en una expresión LaTeX a 3 decimales.
 * @param latex - La expresión LaTeX que puede contener números
 * @returns La expresión LaTeX con números redondeados a 3 decimales
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
function roundLatexNumbers(latex: string): string {
  if (!latex || latex === "N/A") return latex;

  // Patrón para encontrar números decimales (incluyendo negativos)
  // Busca números como: 1.234, 0.123, -1.234, etc.
  // Evita capturar números dentro de comandos LaTeX como \frac{1}{2}
  return latex.replaceAll(/(-?\d+\.\d+)/g, (match) => {
    const num = Number.parseFloat(match);
    if (Number.isNaN(num)) return match;

    // Redondear a 3 decimales
    const rounded = Math.round(num * 1000) / 1000;

    // Si es entero después de redondear, retornar sin decimales
    if (rounded % 1 === 0) {
      return rounded.toString();
    }

    // Retornar con hasta 3 decimales (eliminar ceros al final)
    return rounded.toFixed(3).replace(/\.?0+$/, "");
  });
}

interface RecursiveAnalysisViewProps {
  readonly data: {
    worst: AnalyzeOpenResponse | null;
    best: AnalyzeOpenResponse | "same_as_worst" | null;
    avg: AnalyzeOpenResponse | "same_as_worst" | null;
  } | null;
}

/**
 * Componente principal para visualizar el análisis de algoritmos recursivos.
 * Muestra información sobre el método de análisis utilizado, parámetros de la recurrencia,
 * ecuación de eficiencia y permite acceder a modales con detalles del procedimiento.
 *
 * @param data - Datos de análisis para worst, best y average case
 * @returns Componente React con la visualización del análisis recursivo
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 *
 * @example
 * ```tsx
 * <RecursiveAnalysisView
 *   data={{
 *     worst: worstCaseData,
 *     best: bestCaseData,
 *     avg: avgCaseData
 *   }}
 * />
 * ```
 */
export default function RecursiveAnalysisView({
  data,
}: RecursiveAnalysisViewProps) {
  // Memoizar los datos para evitar recálculos innecesarios
  const analysisData = useMemo(() => {
    const worstData = data?.worst;
    const bestData = data?.best === "same_as_worst" ? data?.worst : data?.best;
    const avgData = data?.avg === "same_as_worst" ? data?.worst : data?.avg;

    const recurrence =
      worstData?.totals?.recurrence ||
      bestData?.totals?.recurrence ||
      avgData?.totals?.recurrence;
    const master =
      worstData?.totals?.master ||
      bestData?.totals?.master ||
      avgData?.totals?.master;
    const iteration =
      worstData?.totals?.iteration ||
      bestData?.totals?.iteration ||
      avgData?.totals?.iteration;
    const recursionTree =
      worstData?.totals?.recursion_tree ||
      bestData?.totals?.recursion_tree ||
      avgData?.totals?.recursion_tree;
    const characteristicEquation =
      worstData?.totals?.characteristic_equation ||
      bestData?.totals?.characteristic_equation ||
      avgData?.totals?.characteristic_equation;
    const proof =
      worstData?.totals?.proof ||
      bestData?.totals?.proof ||
      avgData?.totals?.proof;
    const theta =
      characteristicEquation?.theta ||
      recursionTree?.theta ||
      iteration?.theta ||
      worstData?.totals?.master?.theta ||
      bestData?.totals?.master?.theta ||
      avgData?.totals?.master?.theta;
    const T_open =
      worstData?.totals?.T_open ||
      bestData?.totals?.T_open ||
      avgData?.totals?.T_open;

    return {
      worstData,
      bestData,
      avgData,
      recurrence,
      master,
      iteration,
      recursionTree,
      characteristicEquation,
      proof,
      theta,
      T_open,
    };
  }, [data]);

  const {
    worstData,
    bestData,
    avgData,
    recurrence,
    master,
    iteration,
    recursionTree,
    characteristicEquation,
    proof,
    theta,
    T_open,
  } = analysisData;
  const [showProcedureModal, setShowProcedureModal] = useState(false);
  const [showStepsModal, setShowStepsModal] = useState(false);
  const [showTreeModal, setShowTreeModal] = useState(false);
  const [showCharacteristicModal, setShowCharacteristicModal] = useState(false);
  const [showDPModal, setShowDPModal] = useState(false);

  // Estado para el caso seleccionado (solo para teorema maestro)
  const [selectedCase, setSelectedCase] = useState<CaseType>("worst");

  // Detectar método usado (PRIORIDAD: characteristic_equation > iteration > recursion_tree > master)
  const isCharacteristicMethod =
    recurrence?.method === "characteristic_equation";
  const isIterationMethod = recurrence?.method === "iteration";
  const isRecursionTreeMethod = recurrence?.method === "recursion_tree";
  const isMasterMethod =
    !isCharacteristicMethod &&
    !isIterationMethod &&
    !isRecursionTreeMethod &&
    !!master;

  // Obtener T_open para cada caso
  const bestT =
    bestData?.totals?.T_open ||
    bestData?.totals?.recursion_tree?.theta ||
    bestData?.totals?.iteration?.theta ||
    bestData?.totals?.master?.theta ||
    theta ||
    "N/A";
  const worstT =
    worstData?.totals?.T_open ||
    worstData?.totals?.recursion_tree?.theta ||
    worstData?.totals?.iteration?.theta ||
    worstData?.totals?.master?.theta ||
    theta ||
    "N/A";
  const avgT =
    avgData?.totals?.T_open ||
    avgData?.totals?.recursion_tree?.theta ||
    avgData?.totals?.iteration?.theta ||
    avgData?.totals?.master?.theta ||
    theta ||
    "N/A";

  // Obtener master según el caso seleccionado (solo para teorema maestro)
  const currentMaster = useMemo(() => {
    if (!isMasterMethod) return master;
    switch (selectedCase) {
      case "worst":
        return worstData?.totals?.master || master;
      case "best":
        return bestData?.totals?.master || master;
      case "average":
        return avgData?.totals?.master || master;
    }
  }, [selectedCase, isMasterMethod, worstData, bestData, avgData, master]);

  const currentProof = useMemo(() => {
    switch (selectedCase) {
      case "worst":
        return worstData?.totals?.proof || undefined;
      case "best":
        return bestData?.totals?.proof || undefined;
      case "average":
        return avgData?.totals?.proof || undefined;
      default:
        return worstData?.totals?.proof || bestData?.totals?.proof || avgData?.totals?.proof || undefined;
    }
  }, [selectedCase, worstData, bestData, avgData]);

  // Obtener theta según el caso seleccionado (solo para teorema maestro)
  const currentTheta = useMemo(() => {
    if (!isMasterMethod) return theta || T_open;
    switch (selectedCase) {
      case "worst":
        return worstT;
      case "best":
        return bestT;
      case "average":
        return avgT;
    }
  }, [selectedCase, isMasterMethod, worstT, bestT, avgT, theta, T_open]);

  // Detectar si hay diferencias entre los casos
  const hasDifferentComplexities =
    bestT !== worstT || bestT !== avgT || worstT !== avgT;

  // Debug: log solo una vez cuando cambian los datos
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && recurrence) {
      console.log("[RecursiveAnalysisView] Datos cargados:", {
        hasRecurrence: !!recurrence,
        hasMaster: !!master,
        hasIteration: !!iteration,
        hasRecursionTree: !!recursionTree,
        hasProof: !!proof,
        method: recurrence.method,
        theta,
        T_open,
      });
    }
  }, [recurrence, master, iteration, recursionTree, proof, theta, T_open]);

  if (
    !recurrence ||
    (!master && !iteration && !recursionTree && !characteristicEquation)
  ) {
    return renderEmptyState({
      recurrence,
      master,
      iteration,
      recursionTree,
      worstData,
      bestData,
      avgData,
    });
  }

  // Mostrar mensaje educativo si no hay variabilidad entre worst/best/avg
  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Card principal: Método y Parámetros */}
      <div className="glass-card p-6 rounded-lg">
        <div className="mb-4">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <h2 className="text-white font-semibold flex items-center gap-3">
              <span
                className={`material-symbols-outlined ${getMethodIconColor(isCharacteristicMethod, isIterationMethod, isRecursionTreeMethod)}`}
              >
                {getMethodIconName(
                  isCharacteristicMethod,
                  isIterationMethod,
                  isRecursionTreeMethod,
                )}
              </span>
              <span>Método de Análisis</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border tracking-wide ${getMethodBadgeStyle(isCharacteristicMethod, isIterationMethod, isRecursionTreeMethod)}`}
              >
                {getMethodBadgeText(
                  isCharacteristicMethod,
                  isIterationMethod,
                  isRecursionTreeMethod,
                )}
              </span>
            </h2>

            {/* Badges de información (solo para ecuación característica) */}
            {isCharacteristicMethod &&
              renderCharacteristicBadges(characteristicEquation)}
          </div>
        </div>

        {/* Parámetros de la recurrencia */}
        <div className="mb-4">
          <h3 className="text-white font-semibold text-sm mb-3">
            Parámetros de la Recurrencia
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-1">
            {recurrence && renderRecurrenceParameters(recurrence)}
          </div>
        </div>

        {/* Ecuación de Recurrencia */}
        <div className="mb-4">
          <h3 className="text-white font-semibold text-sm mb-2">
            Ecuación de Recurrencia
          </h3>
          <div className="p-3 rounded-lg bg-slate-800/60 border border-white/10 flex justify-center">
            <Formula latex={recurrence.form} />
          </div>
        </div>

        {/* Botones para ver detalles, pasos y árbol */}
        {(() => {
          const showTreeButton = shouldShowTreeButton(
            isRecursionTreeMethod,
            isCharacteristicMethod,
            isMasterMethod,
            isIterationMethod,
            recurrence,
          );

          // Si es ecuación característica y hay botón de árbol, mostrar los tres botones en la misma línea
          if (isCharacteristicMethod && showTreeButton) {
            const hasDPButton = characteristicEquation?.is_dp_linear;
            return (
              <div
                className={`mb-4 grid gap-3 ${hasDPButton ? "grid-cols-3" : "grid-cols-2"}`}
              >
                <button
                  onClick={() => setShowCharacteristicModal(true)}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold text-white glass-secondary hover:bg-sky-500/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">
                    info
                  </span>
                  <span>Ver Detalles</span>
                </button>
                {hasDPButton && (
                  <button
                    onClick={() => setShowDPModal(true)}
                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold text-white glass-secondary hover:bg-green-500/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">
                      memory
                    </span>
                    <span>Ver Versión DP</span>
                  </button>
                )}
                <button
                  onClick={() => setShowTreeModal(true)}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold text-white glass-secondary hover:bg-purple-500/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">
                    account_tree
                  </span>
                  <span>Ver Árbol de Recurrencia</span>
                </button>
              </div>
            );
          }

          // Si hay botón de árbol y es método maestro o iteración, ponerlos en la misma línea
          if (showTreeButton && (isMasterMethod || isIterationMethod)) {
            return (
              <div className="mb-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowProcedureModal(true)}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold text-white glass-secondary hover:bg-sky-500/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">
                    info
                  </span>
                  <span>Ver Detalles</span>
                </button>
                <button
                  onClick={() => setShowTreeModal(true)}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold text-white glass-secondary hover:bg-purple-500/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">
                    account_tree
                  </span>
                  <span>Ver Árbol de Recurrencia</span>
                </button>
              </div>
            );
          }

          // Caso normal: botones de acción primero, luego botón de árbol si aplica
          return (
            <>
              {renderActionButtons({
                isCharacteristicMethod,
                isRecursionTreeMethod,
                proof,
                setShowCharacteristicModal,
                setShowProcedureModal,
                setShowStepsModal,
                setShowDPModal,
                characteristicEquation,
              })}
              {showTreeButton && (
                <div className="mb-4">
                  <button
                    onClick={() => setShowTreeModal(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold text-white glass-secondary hover:bg-purple-500/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">
                      account_tree
                    </span>
                    <span>Ver Árbol de Recurrencia</span>
                  </button>
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* Card de costos o información del método de Árbol de Recursión */}
      {isRecursionTreeMethod && recursionTree
        ? renderRecursionTreeCards({
            recursionTree,
            hasDifferentComplexities,
            bestT,
            avgT,
            worstT,
            theta,
          })
        : renderEfficiencyCard({
            isMasterMethod,
            isIterationMethod,
            hasDifferentComplexities,
            selectedCase,
            setSelectedCase,
            currentTheta,
            bestT,
            avgT,
            worstT,
            theta,
          })}

      {/* Modal de procedimiento completo */}
      {renderProcedureModal({
        isCharacteristicMethod,
        isIterationMethod,
        isRecursionTreeMethod,
        showCharacteristicModal,
        showProcedureModal,
        setShowCharacteristicModal,
        setShowProcedureModal,
        recurrence,
        characteristicEquation,
        worstData,
        bestData,
        avgData,
        iteration,
        recursionTree,
        master,
        currentMaster,
        proof,
        currentProof,
        theta,
        T_open,
        selectedCase,
        currentTheta,
      })}

      {/* Modal de versión DP */}
      {isCharacteristicMethod && characteristicEquation?.is_dp_linear && (
        <DPVersionModal
          open={showDPModal}
          onClose={() => setShowDPModal(false)}
          characteristicEquation={characteristicEquation}
        />
      )}

      {/* Modal del árbol de recursión - para recursion_tree, characteristic_equation, master e iteration */}
      {((isRecursionTreeMethod && recurrence?.type === "divide_conquer") ||
        (isCharacteristicMethod && recurrence?.type === "linear_shift") ||
        (isMasterMethod && recurrence?.type === "divide_conquer") ||
        (isIterationMethod && recurrence?.type === "divide_conquer")) && (
        <RecursionTreeModal
          open={showTreeModal}
          onClose={() => setShowTreeModal(false)}
          recurrence={recurrence}
          recursionTreeData={recursionTree}
          characteristicEquation={characteristicEquation}
        />
      )}

      {/* Modal de pasos del método de Árbol de Recursión */}
      {isRecursionTreeMethod && (
        <RecursionTreeStepsModal
          open={showStepsModal}
          onClose={() => setShowStepsModal(false)}
          proof={proof}
        />
      )}
    </div>
  );
}
