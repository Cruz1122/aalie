import assert from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";

import type { AnalyzeOpenResponse } from "@aa/types";

import {
  createReportFromSource,
  createSnapshotFromSource,
} from "../export-service";

type FetchCall = { url: string; body: unknown };

const calls: FetchCall[] = [];

function sampleAnalyze(theta: string): AnalyzeOpenResponse {
  return {
    ok: true,
    byLine: [
      {
        line: 1,
        kind: "for",
        ck: "C_1",
        count: "n",
        count_raw: "\\sum_{i=1}^{n} 1",
      },
    ],
    totals: {
      T_open: "C_1 n + C_0",
      T_polynomial: "C_1 n + C_0",
      big_o: "O(n)",
      big_omega: "\\Omega(n)",
      big_theta: theta,
      recurrence: {
        type: "divide_conquer",
        form: "T(n)=2T(n/2)+n",
        a: 2,
        b: 2,
        f: "n",
        n0: 1,
        applicable: true,
        notes: ["ok"],
        method: "master",
      },
      master: {
        case: 2,
        nlogba: "n",
        comparison: "equal",
        regularity: { checked: true, note: "ok" },
        theta: "\\Theta(n \\log n)",
      },
    },
  };
}

function buildResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  calls.length = 0;
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    const href = String(url);
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    calls.push({ url: href, body });

    if (href.endsWith("/grammar/parse")) {
      return buildResponse({
        ok: true,
        available: true,
        runtime: "python",
        ast: {
          type: "Program",
          pos: { line: 1, column: 1 },
          body: [],
        },
        errors: [],
      });
    }

    if (href.endsWith("/classify")) {
      return buildResponse({ ok: true, kind: "recursive", method: "ast" });
    }

    if (href.endsWith("/analyze/open")) {
      return buildResponse({
        ok: true,
        has_case_variability: false,
        worst: sampleAnalyze("\\Theta(n \\log n)"),
        best: "same_as_worst",
        avg: "same_as_worst",
      });
    }

    if (href.endsWith("/analyze/detect-methods")) {
      return buildResponse({
        ok: true,
        applicable_methods: ["master", "iteration", "recursion_tree"],
        default_method: "master",
      });
    }

    if (href.endsWith("/analyze/trace")) {
      return buildResponse({
        ok: true,
        trace: {
          kind: "recursive",
          steps: [],
          summary: {
            totalSteps: 0,
            totalCalls: 0,
            maxRecursionDepth: 0,
            algorithmKind: "recursive",
          },
          diagnostics: {
            truncated: false,
            warnings: [],
          },
        },
      });
    }

    if (href.endsWith("/api/llm")) {
      return buildResponse({
        ok: true,
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      verdict: "match",
                      confidence: 0.91,
                      matches: ["theta"],
                      differences: [],
                      note: "ok",
                    }),
                  },
                ],
              },
            },
          ],
        },
      });
    }

    return buildResponse({ ok: false, error: `Unhandled URL ${href}` }, 404);
  }) as typeof fetch;
});

afterEach(() => {
  // no-op
});

describe("export-service integration", () => {
  it("construye snapshot desde artefactos reales y usa payload LLM preexistente", async () => {
    const snapshot = await createSnapshotFromSource({
      source: "factorial(n) BEGIN RETURN 1; END",
      locale: "es",
      includeLlm: true,
      llmPayload: { note: "preloaded" },
      requestOrigin: "http://localhost:3000",
    });

    assert.ok(snapshot.snapshotId);
    assert.strictEqual(snapshot.locale, "es");
    assert.strictEqual(snapshot.comparative.llm.status, "available");
    assert.ok(
      !calls.some((call) => call.url.endsWith("/api/llm")),
      "LLM endpoint should not be called when llmPayload is provided",
    );
  });

  it("genera bundle markdown+latex desde el mismo snapshot", async () => {
    const report = await createReportFromSource({
      source: "mergeSort(A, n) BEGIN RETURN 1; END",
      locale: "en",
      includeLlm: true,
      requestOrigin: "http://localhost:3000",
      formats: ["markdown", "latex"],
      includeZipBundle: true,
    });

    const markdown = report.artifacts.find((file) => file.format === "markdown");
    const latex = report.artifacts.find((file) => file.format === "latex");

    assert.ok(markdown);
    assert.ok(latex);
    assert.ok(report.bundle);
    assert.ok(calls.some((call) => call.url.endsWith("/api/llm")));
    assert.ok(
      typeof markdown?.content === "string" &&
        markdown.content.includes(report.snapshot.snapshotId),
    );
    assert.ok(
      typeof latex?.content === "string" &&
        latex.content.includes(report.snapshot.snapshotId),
    );
  });
});
