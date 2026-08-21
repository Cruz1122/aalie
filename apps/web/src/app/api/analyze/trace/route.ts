import type { NextRequest } from "next/server";

import { POLICIES } from "@/lib/bff/policies";
import { proxyJsonRequest } from "@/lib/bff/proxy";

export async function POST(request: NextRequest) {
  return proxyJsonRequest(request, {
    path: "/analyze/trace",
    policy: POLICIES.trace,
    transformBody: (raw) => {
      const body =
        raw && typeof raw === "object"
          ? (raw as Record<string, unknown>)
          : {};
      return {
        ...body,
        case: body.case || "worst",
        input_size: body.input_size || null,
        initial_variables: body.initial_variables || null,
        locale: body.locale || "en",
      };
    },
  });
}
