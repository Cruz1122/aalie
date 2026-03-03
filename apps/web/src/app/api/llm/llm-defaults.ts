export const DEFAULT_GEMINI_ENDPOINT_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

export const DEFAULT_GEMINI_MODELS = {
  classify: "gemini-3-flash-preview",
  parser_assist: "gemini-2.5-flash",
  general: "gemini-3-flash-preview",
  repair: "gemini-2.5-flash",
  compare: "gemini-2.5-flash",
} as const;

export const DEFAULT_GEMINI_DIAGRAM_MODELS = {
  recursion_diagram: "gemini-3-flash-preview",
  generate_diagram: "gemini-3-flash-preview",
} as const;
