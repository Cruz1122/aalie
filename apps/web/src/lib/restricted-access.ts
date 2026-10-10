const TRUTHY = new Set(["1", "true", "yes", "on"]);

export function restrictedAccessEnabled(): boolean {
  const value = process.env["AALIE_RESTRICTED_ACCESS"]?.trim().toLowerCase();
  return Boolean(value && TRUTHY.has(value));
}
