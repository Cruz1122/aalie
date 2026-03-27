import type { DocumentModel } from "../renderers/document-model-builder";
import { renderTraceDiagramSvg } from "../infrastructure/diagram/renderTraceDiagramSvg";
import { convertSvgToPdfBuffer } from "../infrastructure/diagram/svg-to-pdf";

export interface TraceDiagramAsset {
  filename: string;
  mimeType: string;
  content: string | Buffer;
}

export async function buildTraceDiagramAssets(model: DocumentModel): Promise<TraceDiagramAsset[]> {
  const assetsByFilename = new Map<string, TraceDiagramAsset>();

  for (const section of model.sections) {
    for (const block of section.blocks) {
      if (block.kind !== "executionTraceDiagram") {
        continue;
      }

      const svgRendered = renderTraceDiagramSvg({
        graph: block.diagram.graph,
        title: block.diagram.title,
        locale: model.locale,
        caseName: model.locale === "es" ? "Peor caso" : "Worst case",
        summary: block.diagram.summary,
        diagnostics: block.diagram.diagnostics,
      });

      assetsByFilename.set(block.diagram.assetSvgPath, {
        filename: block.diagram.assetSvgPath,
        mimeType: "image/svg+xml",
        content: svgRendered.svg,
      });

      const pdfBuffer = await convertSvgToPdfBuffer(svgRendered.svg, {
        width: svgRendered.width,
        height: svgRendered.height,
      });

      assetsByFilename.set(block.diagram.assetPdfPath, {
        filename: block.diagram.assetPdfPath,
        mimeType: "application/pdf",
        content: pdfBuffer,
      });
    }
  }

  return Array.from(assetsByFilename.values()).sort((a, b) => a.filename.localeCompare(b.filename));
}
