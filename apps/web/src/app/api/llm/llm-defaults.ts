export const DEFAULT_GEMINI_ENDPOINT_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

export const DEFAULT_GEMINI_MODELS = {
  classify: "gemini-2.0-flash-lite",
  parser_assist: "gemini-2.5-flash",
  general: "gemini-2.5-flash",
  repair: "gemini-2.5-flash",
  compare: "gemini-2.5-pro",
} as const;

export const DEFAULT_GEMINI_DIAGRAM_MODELS = {
  recursion_diagram: "gemini-2.0-flash",
  generate_diagram: "gemini-2.0-flash",
} as const;
