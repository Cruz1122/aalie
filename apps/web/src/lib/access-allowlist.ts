import "server-only";

import { getAuthPool } from "@/lib/auth";
import { restrictedAccessEnabled } from "@/lib/restricted-access";

const ALLOWLIST_TTL_MS = 30_000;

export type AccessGate = "open" | "login" | "denied";

let cachedAllowlist: { expiresAt: number; emails: ReadonlySet<string> } | null =
  null;

export function clearAllowlistCache(): void {
  cachedAllowlist = null;
}

async function loadAllowlist(): Promise<ReadonlySet<string>> {
  const now = Date.now();
  if (cachedAllowlist && cachedAllowlist.expiresAt > now) {
    return cachedAllowlist.emails;
  }

  const result = await getAuthPool().query<{ email: string }>(
    "SELECT email FROM access_allowlist",
  );
  const emails = new Set(
    result.rows.map((row) => row.email.trim().toLowerCase()),
  );
  cachedAllowlist = { expiresAt: now + ALLOWLIST_TTL_MS, emails };
  return emails;
}

export async function isEmailAllowlisted(
  email: string | null | undefined,
): Promise<boolean> {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return false;

  try {
    const allowlist = await loadAllowlist();
    return allowlist.has(normalized);
  } catch (error) {
    console.error("access allowlist lookup failed", error);
    return false;
  }
}

export async function resolveAccessGate(
  email: string | null | undefined,
): Promise<AccessGate> {
  if (!restrictedAccessEnabled()) return "open";
  if (!email?.trim()) return "login";
  return (await isEmailAllowlisted(email)) ? "open" : "denied";
}
