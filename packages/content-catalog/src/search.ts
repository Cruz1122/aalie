import { deriveModuleRoute } from "./utils.js";
import type {
  CatalogModule,
  CatalogSpace,
  ContentBlock,
  InlineSpan,
  LoadedSpaceBundle,
  RichText,
  SearchIndexEntry,
} from "./types.js";
import { flattenInlineText } from "./utils.js";

function unique(values: string[]): string[] {
  return Array.from(
    new Set(
      values.map((value) => value.trim()).filter((value) => value.length > 0),
    ),
  );
}

function collectBlockSearchText(block: ContentBlock): string[] {
  const collectListTexts = (
    items: Extract<ContentBlock, { type: "list" }>["items"],
  ): string[] =>
    items.flatMap((item) => [
      flattenInlineText(item.content),
      ...(item.children ? collectListTexts(item.children) : []),
    ]);

  switch (block.type) {
    case "heading":
    case "paragraph":
    case "quote":
      return [flattenInlineText(block.content)];
    case "list":
      return collectListTexts(block.items);
    case "note":
    case "callout":
    case "definition":
    case "theorem":
    case "proof":
    case "example":
    case "exerciseSolution":
      return [
        "title" in block && typeof block.title === "string" ? block.title : "",
        ...block.blocks.flatMap(collectBlockSearchText),
      ];
    case "evidenceBlock":
      return [
        block.variant,
        block.icon,
        block.title ?? "",
        ...block.blocks.flatMap(collectBlockSearchText),
      ];
    case "exercise":
      return [block.title ?? "", flattenInlineText(block.prompt)];
    case "algorithm":
    case "code":
      return [block.title ?? "", block.caption ?? ""];
    case "table":
    case "complexityTable":
    case "formulaComparisonTable":
      return [
        block.title ?? "",
        ...block.columns.map((column) => column.label),
        ...block.rows.flatMap((row) => row.cells.map(flattenInlineText)),
      ];
    case "image":
    case "figure":
      return [];
    case "latex":
    case "equationBlock":
      return [block.latex];
    case "latexSteps":
      return [
        block.title ?? "",
        ...block.steps.flatMap((step) => [
          step.title ?? "",
          flattenInlineText(step.explanation),
          step.latex,
        ]),
      ];
    case "mermaid":
      return [block.title ?? "", block.code, block.caption ?? ""];
    case "recursionTree":
      return [
        block.title ?? "",
        ...block.nodes.flatMap((node) => [node.label, node.edgeLabel ?? ""]),
        block.caption ?? "",
      ];
    case "graph":
      return [
        block.title ?? "",
        ...block.nodes.map((node) => node.label),
        ...block.edges.map((edge) => edge.label ?? ""),
        block.caption ?? "",
      ];
    case "methodCard":
      return [
        block.title,
        flattenInlineText(block.summary),
        ...(block.whenToUse ?? []).map(flattenInlineText),
        ...(block.steps ?? []).map(flattenInlineText),
        ...(block.pitfalls ?? []).map(flattenInlineText),
      ];
    case "stepByStepMethod":
    case "proofSteps":
      return [
        block.title,
        ...block.steps.flatMap((step) => [
          step.title,
          ...step.blocks.flatMap(collectBlockSearchText),
        ]),
      ];
    case "warningTrap":
      return [
        block.title,
        flattenInlineText(block.misconception),
        flattenInlineText(block.whyItFails),
        flattenInlineText(block.fix),
      ];
    case "exampleSolved":
      return [
        block.title,
        flattenInlineText(block.problem),
        ...block.steps.flatMap((step) => [
          step.title,
          flattenInlineText(step.explanation),
          step.latex ?? "",
        ]),
        flattenInlineText(block.answer),
      ];
    case "quizCheckpoint":
      return [block.title ?? "", flattenInlineText(block.prompt), block.quizId];
    case "cheatsheet":
      return [
        block.title ?? "",
        ...block.items.flatMap((item) => [
          item.label,
          flattenInlineText(item.value),
        ]),
      ];
    case "referenceList":
      return block.references;
    case "buttonRow":
      return block.buttons.map((button) => button.label);
    case "divider":
      return [];
    default:
      return [];
  }
}

export function buildModuleSearchIndex(
  space: CatalogSpace,
  module: CatalogModule,
): SearchIndexEntry[] {
  const moduleRoute = deriveModuleRoute(space, module);
  const moduleTerms = module.terms ?? [];
  const moduleReferences = module.resources?.references ?? [];
  const mediaCaptions = [
    ...(module.resources?.images ?? []).map(
      (resource) => resource.caption ?? "",
    ),
    ...(module.resources?.figures ?? []).map(
      (resource) => resource.caption ?? "",
    ),
  ];

  const entries: SearchIndexEntry[] = [
    {
      id: module.moduleId,
      kind: "module",
      route: moduleRoute,
      locale: module.locale,
      spaceId: space.spaceId,
      moduleId: module.moduleId,
      title: module.title,
      text: unique([
        module.summary ?? "",
        ...moduleTerms.flatMap((term) => [
          term.label,
          term.definition,
          ...(term.aliases ?? []),
        ]),
        ...moduleReferences.flatMap((reference) => [
          reference.label,
          ...(reference.authors ?? []),
        ]),
        ...mediaCaptions,
      ]).join(" "),
      tags: unique(module.tags ?? []),
      aliases: unique(module.searchMeta?.aliases ?? []),
      keywords: unique(module.searchMeta?.keywords ?? []),
    },
  ];

  for (const chapter of module.chapters) {
    for (const section of chapter.sections) {
      entries.push({
        id: section.sectionId,
        kind: "section",
        route: `${moduleRoute}#${section.slug}`,
        locale: module.locale,
        spaceId: space.spaceId,
        moduleId: module.moduleId,
        chapterId: chapter.chapterId,
        sectionId: section.sectionId,
        title: section.title,
        text: unique(section.blocks.flatMap(collectBlockSearchText)).join(" "),
        tags: unique(module.tags ?? []),
        aliases: unique(section.searchMeta?.aliases ?? []),
        keywords: unique([
          ...(module.searchMeta?.keywords ?? []),
          ...(section.searchMeta?.keywords ?? []),
        ]),
      });
    }
  }

  return entries;
}

export interface BuildSpaceSearchIndexOptions {
  moduleId?: string;
}

export function buildSpaceSearchIndex(
  bundle: LoadedSpaceBundle,
  options: BuildSpaceSearchIndexOptions = {},
): SearchIndexEntry[] {
  const { moduleId } = options;

  return bundle.modules.flatMap(({ module }) => {
    if (moduleId && module.moduleId !== moduleId) {
      return [];
    }

    return buildModuleSearchIndex(bundle.space, module);
  });
}
