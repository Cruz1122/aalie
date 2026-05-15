export type ApiErrorType = "connection" | "backend" | null;

export function getApiErrorType(
  res: Record<string, unknown>,
): ApiErrorType {
  if (typeof res.ok !== "boolean" || res.ok) return null;
  if (typeof res.error === "string" && !Array.isArray(res.errors)) {
    return "connection";
  }
  if (Array.isArray(res.errors)) return "backend";
  return null;
}
