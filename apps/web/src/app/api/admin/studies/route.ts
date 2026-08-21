import type { NextRequest } from "next/server";

import { POLICIES } from "@/lib/bff/policies";
import { proxyApiRequest } from "@/lib/bff/proxy";

export async function GET(request: NextRequest) {
  return proxyApiRequest(request, {
    path: "/admin/studies",
    policy: POLICIES.admin,
    method: "GET",
  });
}

export async function POST(request: NextRequest) {
  return proxyApiRequest(request, {
    path: "/admin/studies",
    policy: POLICIES.admin,
  });
}
