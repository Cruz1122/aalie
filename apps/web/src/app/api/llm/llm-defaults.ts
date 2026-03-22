export const DEFAULT_GEMINI_ENDPOINT_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

export const DEFAULT_GEMINI_MODELS = {
  parser_assist: "gemini-2.5-flash",
  general: "gemini-3-flash-preview",
  repair: "gemini-2.5-flash",
  compare: "gemini-2.5-flash",
  explain: "gemini-2.5-flash",
} as const;
