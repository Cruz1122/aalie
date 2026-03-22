import { ExportArtifact, LatexCompilationError } from "@aa/exporter";
import { NextRequest, NextResponse } from "next/server";

import {
  createReportFromSource,
  type ExportReportRequest,
} from "@/server/export/export-service";

export const runtime = "nodejs";


export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<ExportReportRequest>;
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

    const result = await createReportFromSource({
      ...body,
      source,
      requestOrigin: request.nextUrl.origin,
      cachedParse: body.cachedParse,
      cachedClassify: body.cachedClassify,
      cachedAnalyze: body.cachedAnalyze,
      cachedTraceByCase: body.cachedTraceByCase,
    });

    const isBundle = !!result.bundle;
    const outputMatch = result.bundle || result.artifacts[0];
    if (!outputMatch) {
      throw new Error("No artifacts were generated.");
    }

    const mimeType = isBundle ? "application/zip" : (outputMatch as ExportArtifact).mimeType;

    return new NextResponse(outputMatch.content as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${outputMatch.filename}"`,
        "X-Snapshot-Id": result.snapshot.snapshotId,
        "X-Content-Hash": result.snapshot.contentHash,
      },
    });
  } catch (error) {
    if (error instanceof LatexCompilationError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          kind: error.kind,
          logs: error.logs.slice(-4000),
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
