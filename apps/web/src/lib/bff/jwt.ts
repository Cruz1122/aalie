import "server-only";

import { getAuth } from "@/lib/auth";

export async function mintInternalJwt(headers: Headers): Promise<string> {
  const result = await getAuth().api.getToken({ headers });
  const token =
    result && typeof result === "object" && "token" in result
      ? String(result.token)
      : "";
  if (!token || token.split(".").length !== 3) {
    throw new Error("Better Auth did not issue an internal JWT");
  }
  return token;
}
