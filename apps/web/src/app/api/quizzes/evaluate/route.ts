import type { NextRequest } from "next/server";

import { POLICIES } from "@/lib/bff/policies";
import { proxyJsonRequest } from "@/lib/bff/proxy";

export async function POST(request: NextRequest) {
  return proxyJsonRequest(request, {
    path: "/quizzes/attempts/evaluate",
    policy: POLICIES.quiz,
  });
}
