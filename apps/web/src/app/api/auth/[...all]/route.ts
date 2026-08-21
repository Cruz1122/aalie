import { toNextJsHandler } from "better-auth/next-js";

import { getAuth } from "@/lib/auth";

export const runtime = "nodejs";

let handlers: ReturnType<typeof toNextJsHandler> | undefined;

function getHandlers() {
  if (!handlers) handlers = toNextJsHandler(getAuth());
  return handlers;
}

async function requireAuthoritativeSession(request: Request) {
  if (new URL(request.url).pathname !== "/api/auth/token") return null;

  const session = await getAuth().api.getSession({
    headers: request.headers,
    query: { disableCookieCache: true },
  });
  if (session) return null;

  return Response.json(
    { code: "UNAUTHORIZED", message: "Session is no longer valid" },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(request: Request) {
  const denied = await requireAuthoritativeSession(request);
  if (denied) return denied;
  return getHandlers().GET(request);
}

export async function POST(request: Request) {
  return getHandlers().POST(request);
}
