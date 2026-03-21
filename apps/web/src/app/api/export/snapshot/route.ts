import { NextRequest, NextResponse } from "next/server";

import {
  createSnapshotFromSource,
  type ExportSnapshotRequest,
} from "@/server/export/export-service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<ExportSnapshotRequest>;
    const source = String(body.source || "");

    if (!source.trim()) {
      return NextResponse.json(
        {
          ok: false,
          error: "Field 'source' is required.",
        },
        { status: 400 },
      );
    }

    const snapshot = await createSnapshotFromSource({
      ...body,
      source,
      requestOrigin: request.nextUrl.origin,
    });

    return NextResponse.json(
      {
        ok: true,
        snapshot,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
