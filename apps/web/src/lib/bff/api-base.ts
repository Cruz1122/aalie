import "server-only";

export function getApiBase(): string {
  const configured = process.env.API_INTERNAL_BASE_URL?.trim().replace(/\/+$/, "");
  if (configured) {
    return /^https?:\/\//i.test(configured) ? configured : `http://${configured}`;
  }
  return process.env.DOCKER ? "http://api:8000" : "http://localhost:8000";
}
