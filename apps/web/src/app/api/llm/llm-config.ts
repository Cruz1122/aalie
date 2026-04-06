// Configuración centralizada para modelos LLM de Gemini

import {
  DEFAULT_GEMINI_ENDPOINT_BASE,
  DEFAULT_GEMINI_MODELS,
} from "./llm-defaults";
import { getPrompt as getPromptByLocale } from "./prompts";

export type LLMJob =
  | "parser_assist"
  | "general"
  | "repair"
  | "compare"
  | "explain";

function getEnvOrDefault(name: string, fallback: string): string {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

const GEMINI_MODELS = {
  parser_assist: getEnvOrDefault(
    "LLM_MODEL_PARSER_ASSIST",
    DEFAULT_GEMINI_MODELS.parser_assist,
  ),
  general: getEnvOrDefault("LLM_MODEL_GENERAL", DEFAULT_GEMINI_MODELS.general),
  repair: getEnvOrDefault("LLM_MODEL_REPAIR", DEFAULT_GEMINI_MODELS.repair),
  compare: getEnvOrDefault("LLM_MODEL_COMPARE", DEFAULT_GEMINI_MODELS.compare),
  explain: getEnvOrDefault("LLM_MODEL_EXPLAIN", DEFAULT_GEMINI_MODELS.explain),
};

export const GEMINI_ENDPOINT_BASE = getEnvOrDefault(
  "GEMINI_ENDPOINT_BASE",
  DEFAULT_GEMINI_ENDPOINT_BASE,
);

const STEP_MATH_ITEM_SCHEMA = {
  type: "object",
  properties: {
    id: { type: "string" },
    kind: { type: "string" },
    latex: { type: "string" },
  },
};

const STEP_SCHEMA = {
  type: "object",
  properties: {
    id: { type: "string" },
    index: { type: "number" },
    kind: { type: "string" },
    title: { type: "string" },
    status: { type: "string" },
    summary: { type: "string" },
    conceptNote: { type: "string" },
    warning: { type: "string" },
    confidence: { type: "string" },
    math: {
      type: "object",
      properties: {
        primaryLatex: { type: "string" },
        items: { type: "array", items: STEP_MATH_ITEM_SCHEMA },
      },
    },
  },
};

const STEP_BUNDLE_SCHEMA = {
  type: "object",
  properties: {
    method: { type: "string" },
    version: { type: "string" },
    overallStatus: { type: "string" },
    steps: { type: "array", items: STEP_SCHEMA },
  },
};

const ITERATIVE_CASE_SCHEMA = {
  type: "object",
  properties: {
    T_open: { type: "string" },
    T_polynomial: { type: "string" },
    big_o: { type: "string" },
    big_omega: { type: "string" },
    big_theta: { type: "string" },
    step_by_step: STEP_BUNDLE_SCHEMA,
  },
};

// Parámetros por job (temperatura, tokens). Los prompts se obtienen de ./prompts según locale.
const JOB_CONFIG = {
  parser_assist: {
    temperature: 0.7,
    maxTokens: 16000,
  },
  general: {
    temperature: 0.7,
    maxTokens: 16000,
  },
  repair: {
    temperature: 0.5,
    maxTokens: 16000,
    schema: {
      type: "object",
      properties: {
        code: { type: "string" },
        removedLines: { type: "array", items: { type: "number" } },
        addedLines: { type: "array", items: { type: "number" } },
      },
      required: ["code", "removedLines", "addedLines"],
    },
  },
  compare: {
    temperature: 0.1,
    maxTokens: 8000,
    schema: {
      type: "object",
      properties: {
        analysis: {
          type: "object",
          properties: {
            worst: ITERATIVE_CASE_SCHEMA,
            best: ITERATIVE_CASE_SCHEMA,
            avg: ITERATIVE_CASE_SCHEMA,
            T_open: { type: "string" },
            T_polynomial: { type: "string" },
            big_o: { type: "string" },
            big_omega: { type: "string" },
            big_theta: { type: "string" },
            step_by_step: STEP_BUNDLE_SCHEMA,
            recurrence: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["divide_conquer", "linear_shift"],
                },
                form: { type: "string" },
                a: { type: "number" },
                b: { type: "number" },
                f: { type: "string" },
                order: { type: "number" },
                shifts: { type: "array", items: { type: "number" } },
                coefficients: { type: "array", items: { type: "number" } },
                "g(n)": { type: "string" },
                n0: { type: "number" },
              },
            },
            method: { type: "string" },
            theta: { type: "string" },
            characteristic_equation: {
              type: "object",
              properties: {
                equation: { type: "string" },
                roots: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      root: { type: "string" },
                      multiplicity: { type: "number" },
                    },
                  },
                },
                dominant_root: { type: "string" },
                growth_rate: { type: "number" },
                homogeneous_solution: { type: "string" },
                particular_solution: { type: "string" },
                general_solution: { type: "string" },
                closed_form: { type: "string" },
                theta: { type: "string" },
                step_by_step: STEP_BUNDLE_SCHEMA,
              },
            },
            master: {
              type: "object",
              properties: {
                case: { type: "number", enum: [1, 2, 3] },
                nlogba: { type: "string" },
                comparison: {
                  type: "string",
                  enum: ["smaller", "equal", "larger"],
                },
                theta: { type: "string" },
                step_by_step: STEP_BUNDLE_SCHEMA,
              },
            },
            iteration: {
              type: "object",
              properties: {
                g_function: { type: "string" },
                expansions: { type: "array", items: { type: "string" } },
                general_form: { type: "string" },
                base_case: {
                  type: "object",
                  properties: {
                    condition: { type: "string" },
                    k: { type: "string" },
                  },
                },
                summation: {
                  type: "object",
                  properties: {
                    expression: { type: "string" },
                    evaluated: { type: "string" },
                  },
                },
                theta: { type: "string" },
                step_by_step: STEP_BUNDLE_SCHEMA,
              },
            },
            recursion_tree: {
              type: "object",
              properties: {
                levels: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      level: { type: "number" },
                      num_nodes: { type: "number" },
                      num_nodes_latex: { type: "string" },
                      subproblem_size_latex: { type: "string" },
                      cost_per_node_latex: { type: "string" },
                      total_cost_latex: { type: "string" },
                    },
                  },
                },
                height: { type: "string" },
                summation: {
                  type: "object",
                  properties: {
                    expression: { type: "string" },
                    evaluated: { type: "string" },
                    theta: { type: "string" },
                  },
                },
                dominating_level: {
                  type: "object",
                  properties: {
                    level: { type: "string" },
                    reason: { type: "string" },
                  },
                },
                theta: { type: "string" },
                step_by_step: STEP_BUNDLE_SCHEMA,
              },
            },
          },
        },
        note: { type: "string" },
      },
      required: ["analysis", "note"],
    },
  },
  explain: {
    temperature: 0.35,
    maxTokens: 1800,
  },
};

// Helper para obtener modelo por job
function getModel(job: LLMJob): string {
  return GEMINI_MODELS[job];
}

export interface JSONSchemaProperty {
  type: string;
  description?: string;
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
}

export interface JobResolvedConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  schema?: {
    type: string;
    properties?: Record<string, JSONSchemaProperty>;
    required?: string[];
  };
}

interface JobConfigWithSchema {
  temperature: number;
  maxTokens: number;
  schema?: {
    type: string;
    properties?: Record<string, JSONSchemaProperty>;
    required?: string[];
  };
}

export function getJobConfig(job: LLMJob, locale?: string): JobResolvedConfig {
  const jobConfig = JOB_CONFIG[job] as JobConfigWithSchema;
  return {
    model: getModel(job),
    temperature: jobConfig.temperature,
    maxTokens: jobConfig.maxTokens,
    systemPrompt: getPromptByLocale(job, locale),
    schema: jobConfig.schema,
  };
}

// Export estructuras para endpoints/status fácilmente
export const LLM_EXPORTABLE_CONFIG = {
  endpoint: GEMINI_ENDPOINT_BASE,
  models: Object.values(GEMINI_MODELS),
  description: "Modelos Gemini Google AI Studio",
  jobs: GEMINI_MODELS,
};
