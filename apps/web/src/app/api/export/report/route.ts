import { LatexCompilationError } from "@aa/exporter";
import { NextRequest, NextResponse } from "next/server";

import {
  createReportFromSource,
  type ExportReportRequest,
} from "@/server/export/export-service";

export const runtime = "nodejs";

function encodeContent(
  value: string | Buffer,
): { encoding: "utf8" | "base64"; content: string } {
  if (typeof value === "string") {
    return {
      encoding: "utf8",
      content: value,
    };
  }

  return {
    encoding: "base64",
    content: value.toString("base64"),
  };
}

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
    });

    return NextResponse.json(
      {
        ok: true,
        snapshotMeta: {
          snapshotId: result.snapshot.snapshotId,
          contentHash: result.snapshot.contentHash,
          schemaVersion: result.snapshot.schemaVersion,
          createdAt: result.snapshot.createdAt,
        },
        files: result.artifacts.map((artifact) => ({
          format: artifact.format,
          filename: artifact.filename,
          mimeType: artifact.mimeType,
          ...encodeContent(artifact.content),
        })),
        bundle: result.bundle
          ? {
              filename: result.bundle.filename,
              encoding: "base64",
              content: result.bundle.content.toString("base64"),
            }
          : null,
      },
      { status: 200 },
    );
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
