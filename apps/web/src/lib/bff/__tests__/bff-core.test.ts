import { describe, expect, it } from "vitest";

import { readJsonBody } from "../body";
import {
  validStudySlug,
  validVisitorId,
  visitorCookieOptions,
} from "../identity";
import { buildBackendHeaders, copySafeResponseHeaders } from "../proxy";
import type { BffRequestContext } from "../request-context";

const context: BffRequestContext = {
  requestId: "request-1",
  authenticated: true,
  userId: "user-1",
  role: "USER",
  subject: "user:user-1",
  visitorId: "4a7a94e5-1a8e-4c80-a3e8-e1d8e5b7da4c",
  shouldSetVisitorCookie: false,
  studySlug: "study-v1",
};

describe("MF3 BFF boundary", () => {
  it("defines the visitor cookie as HttpOnly, Lax, path-wide and long-lived", () => {
    const options = visitorCookieOptions();
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
    expect(options.maxAge).toBe(60 * 60 * 24 * 90);
  });

  it("accepts UUID visitors and bounded study slugs only", () => {
    expect(validVisitorId(context.visitorId)).toBe(true);
    expect(validVisitorId("browser-fingerprint")).toBe(false);
    expect(validStudySlug("study-v1")).toBe(true);
    expect(validStudySlug("../admin")).toBe(false);
  });

  it("enforces the actual body size instead of trusting Content-Length", async () => {
    const request = new Request("http://aalie.test/api", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": "1",
      },
      body: JSON.stringify({ source: "x".repeat(512) }),
    });
    await expect(readJsonBody(request, 128)).rejects.toMatchObject({
      status: 413,
      code: "PAYLOAD_TOO_LARGE",
    });
  });

  it("constructs identity headers only from server context", () => {
    const headers = buildBackendHeaders(
      context,
      "signed.jwt.token",
      {},
      "/quizzes/attempts",
    );
    expect(headers.get("authorization")).toBe("Bearer signed.jwt.token");
    expect(headers.get("x-aalie-study-slug")).toBe("study-v1");
    expect(headers.has("x-aalie-user")).toBe(false);
    expect(headers.has("x-aalie-role")).toBe(false);
    expect(headers.has("x-aalie-participant")).toBe(false);
  });

  it("never exposes internal auth headers in the BFF response", () => {
    const source = new Headers({
      authorization: "Bearer secret",
      "set-auth-jwt": "secret.jwt",
      "content-type": "application/json",
      "x-content-hash": "abc",
    });
    const copied = copySafeResponseHeaders(source);
    expect(copied.get("content-type")).toBe("application/json");
    expect(copied.get("x-content-hash")).toBe("abc");
    expect(copied.has("authorization")).toBe(false);
    expect(copied.has("set-auth-jwt")).toBe(false);
  });
});
