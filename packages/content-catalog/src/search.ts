import { deriveModuleRoute } from "./load.js";
import type {
  CatalogModule,
  CatalogSpace,
  ContentBlock,
  InlineSpan,
  LoadedSpaceBundle,
  RichText,
  SearchIndexEntry,
} from "./types.js";

function unique(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter((value) => value.length > 0)),
  );
}

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
      return [
        block.title ?? "",
        ...block.columns.map((column) => column.label),
        ...block.rows.flatMap((row) => row.cells.map(flattenInlineText)),
      ];
    case "image":
    case "figure":
      return [];
    case "equationBlock":
      return [block.latex];
    case "cheatsheet":
      return [
        block.title ?? "",
        ...block.items.flatMap((item) => [item.label, flattenInlineText(item.value)]),
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
    ...(module.resources?.images ?? []).map((resource) => resource.caption ?? ""),
    ...(module.resources?.figures ?? []).map((resource) => resource.caption ?? ""),
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
        ...moduleTerms.flatMap((term) => [term.label, term.definition, ...(term.aliases ?? [])]),
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
