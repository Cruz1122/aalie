declare module "svg-to-pdfkit" {
  import type PDFDocument from "pdfkit";

  interface SVGToPDFOptions {
    width?: number;
    height?: number;
    preserveAspectRatio?: string;
    useCSS?: boolean;
  }

  export default function SVGtoPDF(
    doc: PDFKit.PDFDocument,
    svg: string,
    x?: number,
    y?: number,
    options?: SVGToPDFOptions,
  ): PDFDocument;
}
