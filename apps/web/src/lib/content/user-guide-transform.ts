import {
  buildSpaceSearchIndex,
  deriveModuleRoute,
  deriveSpaceRoute,
  flattenInlineText,
  getModuleBySlug,
  walkBlocks,
  type CatalogModule,
  type CatalogSection,
  type ContentBlock,
  type LoadedSpaceBundle,
} from "@aa/content-catalog";

import type {
  ContentModuleSummary,
  ContentSectionSummary,
  ContentSpaceSummary,
  ContentTargetMap,
  UserGuideLandingData,
  UserGuideModuleData,
} from "./types";

function truncateText(value: string, maxChars = 220): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }
  return normalized.length <= maxChars
    ? normalized
    : `${normalized.slice(0, maxChars - 1).trimEnd()}…`;
}

function summarizeBlock(block: ContentBlock): string[] {
  switch (block.type) {
    case "heading":
    case "paragraph":
    case "quote":
      return [flattenInlineText(block.content)];
    case "list":
      return block.items.map((item) => flattenInlineText(item.content));
    case "note":
    case "callout":
    case "definition":
    case "theorem":
    case "proof":
    case "example":
    case "exerciseSolution":
    case "evidenceBlock":
      return block.blocks.flatMap(summarizeBlock);
    case "exercise":
      return [flattenInlineText(block.prompt)];
    case "algorithm":
    case "code":
      return [block.caption ?? ""];
    case "table":
      return [block.title ?? ""];
    case "equationBlock":
      return [block.latex];
    case "cheatsheet":
      return block.items.map(
        (item) => `${item.label}: ${flattenInlineText(item.value)}`,
      );
    case "referenceList":
      return block.references;
    case "buttonRow":
      return block.buttons.map((button) => button.label);
    case "image":
    case "figure":
    case "divider":
    default:
      return [];
  }
}

function summarizeSection(section: CatalogSection): string {
  return truncateText(
    section.blocks.flatMap(summarizeBlock).filter(Boolean).join(" "),
  );
}

export function toUserGuideSpaceSummary(
  bundle: LoadedSpaceBundle,
): ContentSpaceSummary {
  return {
    spaceId: bundle.space.spaceId,
    slug: bundle.space.slug,
    title: bundle.space.title,
    description: bundle.space.description,
    locale: bundle.space.locale,
    route: deriveSpaceRoute(bundle.space),
  };
}

export function toUserGuideModuleSummary(
  bundle: LoadedSpaceBundle,
  module: CatalogModule,
): ContentModuleSummary {
  return {
    moduleId: module.moduleId,
    slug: module.slug,
    title: module.title,
    shortTitle: module.shortTitle,
    summary: module.summary,
    difficulty: module.difficulty,
    estimatedMinutes: module.estimatedMinutes,
    tags: module.tags ?? [],
    order: module.order,
    route: deriveModuleRoute(bundle.space, module),
    totalSections: module.chapters.reduce(
      (total, chapter) => total + chapter.sections.length,
      0,
    ),
    totalTrackableSections: module.chapters.reduce(
      (total, chapter) =>
        total +
        chapter.sections.filter((section) => section.trackProgress).length,
      0,
    ),
  };
}

export function buildUserGuideTargetMap(
  bundle: LoadedSpaceBundle,
): ContentTargetMap {
  const targetMap: ContentTargetMap = {};

  for (const loadedModule of bundle.modules) {
    const moduleRoute = deriveModuleRoute(bundle.space, loadedModule.module);
    const { module } = loadedModule;

    targetMap[`module:${module.moduleId}`] = {
      href: moduleRoute,
      title: module.title,
    };

    for (const term of module.terms ?? []) {
      targetMap[`term:${term.termId}`] = {
        href: moduleRoute,
        title: term.label,
      };
    }

    for (const resource of [
      ...(module.resources?.images ?? []),
      ...(module.resources?.figures ?? []),
      ...(module.resources?.references ?? []),
    ]) {
      targetMap[`resource:${resource.resourceId}`] = {
        href: moduleRoute,
        title: "label" in resource ? resource.label : resource.caption,
      };
    }

    for (const chapter of module.chapters) {
      targetMap[`chapter:${chapter.chapterId}`] = {
        href: `${moduleRoute}#${chapter.slug}`,
        title: chapter.title,
      };

      for (const section of chapter.sections) {
        targetMap[`section:${section.sectionId}`] = {
          href: `${moduleRoute}#${section.slug}`,
          title: section.title,
        };

        for (const block of walkBlocks(section.blocks)) {
          targetMap[`block:${block.id}`] = {
            href: `${moduleRoute}#${block.id}`,
            title:
              "title" in block && typeof block.title === "string"
                ? block.title
                : section.title,
          };
        }
      }
    }
  }

  return targetMap;
}

export function buildUserGuideSectionSummaries(
  module: CatalogModule,
): ContentSectionSummary[] {
  return module.chapters.flatMap((chapter) =>
    chapter.sections.map((section) => ({
      chapterId: chapter.chapterId,
      chapterTitle: chapter.title,
      chapterSlug: chapter.slug,
      sectionId: section.sectionId,
      slug: section.slug,
      title: section.title,
      kind: section.kind,
      order: section.order,
      trackProgress: section.trackProgress,
      summary: summarizeSection(section),
    })),
  );
}

export function buildUserGuideLandingDataFromBundle(
  bundle: LoadedSpaceBundle,
): UserGuideLandingData {
  return {
    space: toUserGuideSpaceSummary(bundle),
    modules: bundle.modules.map(({ module }) =>
      toUserGuideModuleSummary(bundle, module),
    ),
    searchIndex: buildSpaceSearchIndex(bundle),
    targetMap: buildUserGuideTargetMap(bundle),
  };
}

export function buildUserGuideModuleDataFromBundle(
  bundle: LoadedSpaceBundle,
  moduleSlug: string,
): UserGuideModuleData | null {
  const loadedModule = getModuleBySlug(bundle, moduleSlug);

  if (!loadedModule) {
    return null;
  }

  const allModules = bundle.modules.map(({ module }) =>
    toUserGuideModuleSummary(bundle, module),
  );
  const currentIndex = allModules.findIndex(
    (module) => module.moduleId === loadedModule.module.moduleId,
  );

  return {
    space: toUserGuideSpaceSummary(bundle),
    module: loadedModule.module,
    moduleSummary: allModules[currentIndex],
    allModules,
    previousModule: currentIndex > 0 ? allModules[currentIndex - 1] : undefined,
    nextModule:
      currentIndex >= 0 && currentIndex < allModules.length - 1
        ? allModules[currentIndex + 1]
        : undefined,
    sectionSummaries: buildUserGuideSectionSummaries(loadedModule.module),
    searchIndex: buildSpaceSearchIndex(bundle, {
      moduleId: loadedModule.module.moduleId,
    }),
    targetMap: buildUserGuideTargetMap(bundle),
  };
}
