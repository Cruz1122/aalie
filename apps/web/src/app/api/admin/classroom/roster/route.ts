import type { NextRequest } from "next/server";

import { POLICIES } from "@/lib/bff/policies";
import { proxyApiRequest } from "@/lib/bff/proxy";

export async function GET(request: NextRequest) {
  return proxyApiRequest(request, {
    path: "/admin/classroom/roster",
    policy: POLICIES.admin,
    method: "GET",
  });
}
