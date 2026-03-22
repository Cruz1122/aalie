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

  for (const file of files) {
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
