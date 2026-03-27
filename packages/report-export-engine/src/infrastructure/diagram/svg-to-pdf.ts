import PDFDocument from "pdfkit";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const SVGtoPDF = require("svg-to-pdfkit") as (
  doc: PDFKit.PDFDocument,
  svg: string,
  x?: number,
  y?: number,
  options?: {
    width?: number;
    height?: number;
    preserveAspectRatio?: string;
  },
) => PDFKit.PDFDocument;

export interface ConvertSvgToPdfOptions {
  width?: number;
  height?: number;
}

export async function convertSvgToPdfBuffer(
  svg: string,
  options: ConvertSvgToPdfOptions = {},
): Promise<Buffer> {
  const width = Math.max(200, Math.round(options.width || 1200));
  const height = Math.max(150, Math.round(options.height || 800));

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: [width, height],
      margin: 0,
      autoFirstPage: true,
      compress: true,
      info: {
        Title: "AALIE Recursive Trace Diagram",
        Creator: "AALIE Export Engine",
      },
    });

    doc.on("data", (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err: Error) => reject(err));

    SVGtoPDF(doc, svg, 0, 0, {
      width,
      height,
      preserveAspectRatio: "xMidYMid meet",
    });

    doc.end();
  });
}
