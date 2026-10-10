import { beforeEach, describe, expect, it, vi } from "vitest";

const query = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  getAuthPool: () => ({ query }),
}));

import {
  clearAllowlistCache,
  isEmailAllowlisted,
  resolveAccessGate,
} from "../access-allowlist";

beforeEach(() => {
  query.mockReset();
  clearAllowlistCache();
  vi.unstubAllEnvs();
});

describe("access allowlist", () => {
  it("keeps the application open when the evaluation flag is off", async () => {
    await expect(resolveAccessGate(null)).resolves.toBe("open");
    expect(query).not.toHaveBeenCalled();
  });

  it("asks for login and denies emails outside the list", async () => {
    vi.stubEnv("AALIE_RESTRICTED_ACCESS", "true");
    query.mockResolvedValue({
      rows: [{ email: "student@ucaldas.edu.co" }],
    });

    await expect(resolveAccessGate(null)).resolves.toBe("login");
    await expect(resolveAccessGate("other@ucaldas.edu.co")).resolves.toBe(
      "denied",
    );
    await expect(resolveAccessGate(" Student@UCALDAS.EDU.CO ")).resolves.toBe(
      "open",
    );
  });

  it("fails closed when the allowlist cannot be read", async () => {
    vi.stubEnv("AALIE_RESTRICTED_ACCESS", "true");
    query.mockRejectedValue(new Error("database unavailable"));

    await expect(isEmailAllowlisted("student@ucaldas.edu.co")).resolves.toBe(
      false,
    );
    await expect(resolveAccessGate("student@ucaldas.edu.co")).resolves.toBe(
      "denied",
    );
  });
});
