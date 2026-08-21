import type { NextRequest } from "next/server";

import { exportPolicy } from "@/lib/bff/policies";
import { proxyJsonRequest } from "@/lib/bff/proxy";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return proxyJsonRequest(request, {
    path: "/export/report",
    policy: exportPolicy,
  });
}
