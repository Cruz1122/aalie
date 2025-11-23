import type { AnalyzeOpenResponse } from "@aa/types";

/**
 * Datos core extraídos de un análisis para comparación.
 */
export interface CoreAnalysisData {
  // Datos comunes
  T_open?: string;
  T_polynomial?: string;
  big_o?: string;
  big_omega?: string;
  big_theta?: string;
  
  // Datos específicos de recursivo
  recurrence?: {
    type: "divide_conquer" | "linear_shift";
    form: string;
    a?: number;
    b?: number;
    f?: string;
    order?: number;
    shifts?: number[];
    coefficients?: number[];
    "g(n)"?: string;
    n0?: number;
    method?: string;
  };
  method?: string;
  characteristic_equation?: {
    equation: string;
    roots?: Array<{ root: string; multiplicity: number }>;
    dominant_root?: string;
    growth_rate?: number;
    homogeneous_solution: string;
    particular_solution?: string;
    general_solution?: string;
    closed_form: string;
    theta: string;
  };
  master?: {
    case: 1 | 2 | 3 | null;
    nlogba: string;
    comparison: "smaller" | "equal" | "larger" | null;
    theta: string | null;
  };
  iteration?: {
    g_function: string;
    expansions: string[];
    general_form: string;
    base_case: {
      condition: string;
      k: string;
    };
    summation: {
      expression: string;
      evaluated: string;
    };
    theta: string;
  };
  recursion_tree?: {
    levels: Array<{
      level: number;
      num_nodes: number;
      num_nodes_latex: string;
      subproblem_size_latex: string;
      cost_per_node_latex: string;
      total_cost_latex: string;
    }>;
    height: string;
    summation: {
      expression: string;
      evaluated: string;
      theta: string;
    };
    dominating_level: {
      level: string | number;
      reason: string;
    };
    theta: string;
  };
  
  // Resumen de tabla de costos (solo para iterativo)
  lineCostsSummary?: {
    totalLines: number;
    linesWithCost: number;
  };
}

/**
 * Extrae los datos core de un análisis para comparación con LLM.
 * 
 * @param data - Datos del análisis (AnalyzeOpenResponse)
 * @returns Datos core extraídos del análisis
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
export function extractCoreData(data: AnalyzeOpenResponse | null): CoreAnalysisData | null {
  if (!data || !data.ok || !data.totals) {
    return null;
  }

  const totals = data.totals;
  const coreData: CoreAnalysisData = {};

  // Datos comunes (iterativo y recursivo)
  if (totals.T_open) {
    coreData.T_open = totals.T_open;
  }
  if (totals.T_polynomial) {
    coreData.T_polynomial = totals.T_polynomial;
  }
  if (totals.big_o) {
    coreData.big_o = totals.big_o;
  }
  if (totals.big_omega) {
    coreData.big_omega = totals.big_omega;
  }
  if (totals.big_theta) {
    coreData.big_theta = totals.big_theta;
  }

  // Determinar si es recursivo (tiene recurrence)
  const isRecursive = !!totals.recurrence;

  if (isRecursive) {
    // Datos específicos de recursivo
    if (totals.recurrence) {
      coreData.recurrence = {
        type: totals.recurrence.type,
        form: totals.recurrence.form,
        n0: totals.recurrence.n0,
        method: totals.recurrence.method,
      };

      if (totals.recurrence.type === "divide_conquer") {
        coreData.recurrence.a = totals.recurrence.a;
        coreData.recurrence.b = totals.recurrence.b;
        coreData.recurrence.f = totals.recurrence.f;
      } else if (totals.recurrence.type === "linear_shift") {
        coreData.recurrence.order = totals.recurrence.order;
        coreData.recurrence.shifts = totals.recurrence.shifts;
        coreData.recurrence.coefficients = totals.recurrence.coefficients;
        if ("g(n)" in totals.recurrence) {
          coreData.recurrence["g(n)"] = totals.recurrence["g(n)"];
        }
      }
    }

    // Determinar método usado y extraer datos correspondientes
    if (totals.characteristic_equation) {
      coreData.method = "characteristic_equation";
      coreData.characteristic_equation = {
        equation: totals.characteristic_equation.equation,
        roots: totals.characteristic_equation.roots,
        dominant_root: totals.characteristic_equation.dominant_root,
        growth_rate: totals.characteristic_equation.growth_rate,
        homogeneous_solution: totals.characteristic_equation.homogeneous_solution,
        particular_solution: totals.characteristic_equation.particular_solution,
        general_solution: totals.characteristic_equation.general_solution,
        closed_form: totals.characteristic_equation.closed_form,
        theta: totals.characteristic_equation.theta,
      };
      // Usar theta de characteristic_equation si está disponible
      if (totals.characteristic_equation.theta) {
        coreData.big_theta = totals.characteristic_equation.theta;
      }
    } else if (totals.master && totals.master.theta) {
      coreData.method = "master";
      coreData.master = {
        case: totals.master.case,
        nlogba: totals.master.nlogba,
        comparison: totals.master.comparison,
        theta: totals.master.theta,
      };
      if (totals.master.theta) {
        coreData.big_theta = totals.master.theta;
      }
    } else if (totals.iteration) {
      coreData.method = "iteration";
      coreData.iteration = {
        g_function: totals.iteration.g_function,
        expansions: totals.iteration.expansions,
        general_form: totals.iteration.general_form,
        base_case: {
          condition: totals.iteration.base_case.condition,
          k: totals.iteration.base_case.k,
        },
        summation: {
          expression: totals.iteration.summation.expression,
          evaluated: totals.iteration.summation.evaluated,
        },
        theta: totals.iteration.theta,
      };
      if (totals.iteration.theta) {
        coreData.big_theta = totals.iteration.theta;
      }
    } else if (totals.recursion_tree) {
      coreData.method = "recursion_tree";
      coreData.recursion_tree = {
        levels: totals.recursion_tree.levels.map(level => ({
          level: level.level,
          num_nodes: level.num_nodes,
          num_nodes_latex: level.num_nodes_latex,
          subproblem_size_latex: level.subproblem_size_latex,
          cost_per_node_latex: level.cost_per_node_latex,
          total_cost_latex: level.total_cost_latex,
        })),
        height: totals.recursion_tree.height,
        summation: {
          expression: totals.recursion_tree.summation.expression,
          evaluated: totals.recursion_tree.summation.evaluated,
          theta: totals.recursion_tree.summation.theta,
        },
        dominating_level: {
          level: totals.recursion_tree.dominating_level.level,
          reason: totals.recursion_tree.dominating_level.reason,
        },
        theta: totals.recursion_tree.theta,
      };
      if (totals.recursion_tree.theta) {
        coreData.big_theta = totals.recursion_tree.theta;
      }
    }
  } else {
    // Para iterativo, agregar resumen de tabla de costos
    if (data.byLine && data.byLine.length > 0) {
      coreData.lineCostsSummary = {
        totalLines: data.byLine.length,
        linesWithCost: data.byLine.filter(line => line.count && line.count !== "0" && line.count !== "").length,
      };
    }
  }

  return coreData;
}

/**
 * Determina si un análisis es recursivo basado en los datos.
 * 
 * @param data - Datos del análisis
 * @returns true si es recursivo, false si es iterativo
 */
export function isRecursiveAnalysis(data: AnalyzeOpenResponse | null): boolean {
  if (!data || !data.ok || !data.totals) {
    return false;
  }
  return !!data.totals.recurrence;
}

