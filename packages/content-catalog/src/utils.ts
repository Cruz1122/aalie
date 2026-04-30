import type {
  CatalogModule,
  CatalogSpace,
  ContentBlock,
  InlineSpan,
  RichText,
} from "./types.js";

/**
 * Derives the URL path for a space.
 */
export function deriveSpaceRoute(space: CatalogSpace): string {
  return `/${space.slug}`;
}

/**
 * Derives the URL path for a module within a space.
 */
export function deriveModuleRoute(
  space: CatalogSpace,
  module: CatalogModule,
): string {
  return `${deriveSpaceRoute(space)}/${module.slug}`;
}

/**
 * Recursively walks through content blocks to find all nested blocks.
 */
export function walkBlocks(blocks: ContentBlock[]): ContentBlock[] {
  return blocks.flatMap((block) => {
    switch (block.type) {
      case "note":
      case "callout":
      case "definition":
      case "theorem":
      case "proof":
      case "example":
      case "exerciseSolution":
      case "evidenceBlock":
        return [block, ...walkBlocks(block.blocks)];
      case "stepByStepMethod":
      case "proofSteps":
        return [
          block,
          ...block.steps.flatMap((step) => walkBlocks(step.blocks)),
        ];
      case "exampleSolved":
        return [
          block,
          ...block.steps.flatMap((step) =>
            step.blocks ? walkBlocks(step.blocks) : [],
          ),
        ];
      default:
        return [block];
    }
  });
}

/**
 * Flattens RichText into a single string for search or preview.
 */
export function flattenInlineText(content: RichText | undefined): string {
  if (!content) {
    return "";
  }

  return content
    .map((span: InlineSpan) => {
      switch (span.type) {
        case "text":
        case "strong":
        case "emphasis":
        case "underline":
        case "highlight":
        case "inlineCode":
        case "link":
        case "term":
        case "color":
          return span.text;
        case "inlineMath":
          return span.latex;
        case "tooltip":
          return `${span.text} ${span.tooltip}`;
        default:
          return "";
      }
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
