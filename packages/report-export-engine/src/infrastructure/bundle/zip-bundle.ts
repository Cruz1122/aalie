import JSZip from "jszip";

export interface ExportBundleFile {
  filename: string;
  content: string | Buffer;
}

export interface ExportBundleMetadata {
  snapshotId: string;
  contentHash: string;
  createdAt: string;
  formats: string[];
}

export interface ExportZipBundleResult {
  buffer: Buffer;
  filename: string;
}

export async function createZipBundle(
  files: ExportBundleFile[],
  metadata: ExportBundleMetadata,
): Promise<ExportZipBundleResult> {
  const zip = new JSZip();
  const order = new Map([
    ["report.md", 0],
    ["report.tex", 1],
    ["report.pdf", 2],
    ["snapshot.json", 3],
  ]);

  const sortedFiles = [...files].sort((a, b) => {
    const aPriority = order.get(a.filename) ?? 4;
    const bPriority = order.get(b.filename) ?? 4;
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    return a.filename.localeCompare(b.filename);
  });

  for (const file of sortedFiles) {
    zip.file(file.filename, file.content);
  }

  zip.file(
    "manifest.json",
    JSON.stringify(
      {
        snapshotId: metadata.snapshotId,
        contentHash: metadata.contentHash,
        createdAt: metadata.createdAt,
        formats: metadata.formats,
      },
      null,
      2,
    ),
  );

  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

  return {
    buffer,
    filename: `aalie-export-${metadata.snapshotId}.zip`,
  };
}
