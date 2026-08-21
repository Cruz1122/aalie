export type RateLimitScope =
  | "parse"
  | "analysis"
  | "trace"
  | "quiz"
  | "export_text"
  | "export_pdf"
  | "llm";

export interface BffPolicy {
  bodyLimitBytes: number;
  timeoutMs: number;
  rateScope: RateLimitScope;
  failClosedRateLimit?: boolean;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

const KIB = 1024;

export const POLICIES = {
  parse: { bodyLimitBytes: 128 * KIB, timeoutMs: 10_000, rateScope: "parse" },
  classify: { bodyLimitBytes: 128 * KIB, timeoutMs: 10_000, rateScope: "parse" },
  analysis: { bodyLimitBytes: 128 * KIB, timeoutMs: 30_000, rateScope: "analysis" },
  trace: { bodyLimitBytes: 128 * KIB, timeoutMs: 30_000, rateScope: "trace" },
  quiz: { bodyLimitBytes: 128 * KIB, timeoutMs: 15_000, rateScope: "quiz" },
  llm: {
    bodyLimitBytes: 256 * KIB,
    timeoutMs: 60_000,
    rateScope: "llm",
    failClosedRateLimit: true,
  },
  exportText: { bodyLimitBytes: 512 * KIB, timeoutMs: 130_000, rateScope: "export_text" },
  exportPdf: {
    bodyLimitBytes: 512 * KIB,
    timeoutMs: 130_000,
    rateScope: "export_pdf",
    failClosedRateLimit: true,
  },
  study: { bodyLimitBytes: 64 * KIB, timeoutMs: 15_000, rateScope: "quiz", requireAuth: true },
  admin: {
    bodyLimitBytes: 64 * KIB,
    timeoutMs: 130_000,
    rateScope: "export_text",
    requireAuth: true,
    requireAdmin: true,
  },
} satisfies Record<string, BffPolicy>;

export function exportPolicy(body: unknown): BffPolicy {
  const format =
    body && typeof body === "object" && "format" in body
      ? String((body as Record<string, unknown>).format ?? "").toLowerCase()
      : "";
  return format === "pdf" || format === "zip" ? POLICIES.exportPdf : POLICIES.exportText;
}
