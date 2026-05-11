import {
  buildSpaceSearchIndex,
  deriveModuleRoute,
  deriveSpaceRoute,
  flattenInlineText,
  walkBlocks,
} from "@aa/content-catalog";
import { getModuleBySlug } from "@aa/content-catalog/server";
import { buildTermsIndex } from "@aa/content-catalog/terms";
import type {
  CatalogModule,
  CatalogSection,
  ContentBlock,
  LoadedSpaceBundle,
} from "@aa/content-catalog/types";

import type {
  ContentChapterData,
  ContentChapterSummary,
  ContentLandingData,
  ContentModuleData,
  ContentModuleSummary,
  ContentSectionSummary,
  ContentSpaceSummary,
  ContentTargetMap,
} from "./types";

interface TransformOptions {
  chapterRouteMode?: "module-anchor" | "chapter-route";
}

function truncateText(value: string, maxChars = 220): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }
  return normalized.length <= maxChars
    ? normalized
    : `${normalized.slice(0, maxChars - 1).trimEnd()}...`;
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
    case "stepByStepMethod":
    case "proofSteps":
      return block.steps.flatMap((step) => [
        step.title,
        ...step.blocks.flatMap(summarizeBlock),
      ]);
    case "exercise":
      return [flattenInlineText(block.prompt)];
    case "algorithm":
    case "code":
      return [block.title ?? "", block.caption ?? ""];
    case "table":
    case "complexityTable":
    case "formulaComparisonTable":
      return [block.title ?? ""];
    case "latex":
    case "equationBlock":
      return [block.title ?? "", block.latex, block.caption ?? ""];
    case "latexSteps":
      return block.steps.flatMap((step) => [
        step.title ?? "",
        flattenInlineText(step.explanation),
        step.latex,
      ]);
    case "mermaid":
      return [block.title ?? "", block.code, block.caption ?? ""];
    case "recursionTree":
      return [block.title ?? "", ...block.nodes.map((node) => node.label)];
    case "graph":
      return [block.title ?? "", ...block.nodes.map((node) => node.label)];
    case "methodCard":
      return [
        block.title,
        flattenInlineText(block.summary),
        ...(block.whenToUse ?? []).map(flattenInlineText),
        ...(block.steps ?? []).map(flattenInlineText),
        ...(block.pitfalls ?? []).map(flattenInlineText),
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
      return [block.title ?? "", flattenInlineText(block.prompt)];
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

export function toContentSpaceSummary(
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

export function toContentModuleSummary(
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

export function buildContentTargetMap(
  bundle: LoadedSpaceBundle,
  options: TransformOptions = {},
): ContentTargetMap {
  const { chapterRouteMode = "chapter-route" } = options;
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
      const chapterHref =
        chapterRouteMode === "module-anchor"
          ? `${moduleRoute}#${chapter.slug}`
          : `${moduleRoute}/${chapter.slug}`;
      targetMap[`chapter:${chapter.chapterId}`] = {
        href: chapterHref,
        title: chapter.title,
      };

      for (const section of chapter.sections) {
        targetMap[`section:${section.sectionId}`] = {
          href:
            chapterRouteMode === "module-anchor"
              ? `${moduleRoute}#${section.slug}`
              : `${chapterHref}#${section.slug}`,
          title: section.title,
        };

        for (const block of walkBlocks(section.blocks)) {
          targetMap[`block:${block.id}`] = {
            href:
              chapterRouteMode === "module-anchor"
                ? `${moduleRoute}#${block.id}`
                : `${chapterHref}#${block.id}`,
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

export function buildContentSectionSummaries(
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

export function buildContentChapterSummaries(
  module: CatalogModule,
): ContentChapterSummary[] {
  return module.chapters.map((chapter) => ({
    chapterId: chapter.chapterId,
    slug: chapter.slug,
    title: chapter.title,
    order: chapter.order,
    summary: chapter.summary,
  }));
}

export function buildContentLandingDataFromBundle(
  bundle: LoadedSpaceBundle,
  options: TransformOptions = {},
): ContentLandingData {
  return {
    space: toContentSpaceSummary(bundle),
    modules: bundle.modules.map(({ module }) =>
      toContentModuleSummary(bundle, module),
    ),
    searchIndex: buildSpaceSearchIndex(bundle),
    targetMap: buildContentTargetMap(bundle, options),
  };
}

export function buildContentModuleDataFromBundle(
  bundle: LoadedSpaceBundle,
  moduleSlug: string,
  options: TransformOptions = {},
): ContentModuleData | null {
  const loadedModule = getModuleBySlug(bundle, moduleSlug);

  if (!loadedModule) {
    return null;
  }

  const allModules = bundle.modules.map(({ module }) =>
    toContentModuleSummary(bundle, module),
  );
  const currentIndex = allModules.findIndex(
    (module) => module.moduleId === loadedModule.module.moduleId,
  );

  const allTerms = bundle.modules.flatMap(({ module }) => module.terms ?? []);

  return {
    space: toContentSpaceSummary(bundle),
    module: loadedModule.module,
    moduleSummary: allModules[currentIndex],
    allModules,
    courseTermsIndex: buildTermsIndex(allTerms),
    previousModule: currentIndex > 0 ? allModules[currentIndex - 1] : undefined,
    nextModule:
      currentIndex >= 0 && currentIndex < allModules.length - 1
        ? allModules[currentIndex + 1]
        : undefined,
    chapters: buildContentChapterSummaries(loadedModule.module),
    sectionSummaries: buildContentSectionSummaries(loadedModule.module),
    searchIndex: buildSpaceSearchIndex(bundle, {
      moduleId: loadedModule.module.moduleId,
    }),
    targetMap: buildContentTargetMap(bundle, options),
  };
}

export function buildContentChapterDataFromBundle(
  bundle: LoadedSpaceBundle,
  moduleSlug: string,
  chapterSlug: string,
  options: TransformOptions = {},
): ContentChapterData | null {
  const moduleData = buildContentModuleDataFromBundle(
    bundle,
    moduleSlug,
    options,
  );

  if (!moduleData) {
    return null;
  }

  const chapter = moduleData.module.chapters.find(
    (entry) => entry.slug === chapterSlug,
  );

  if (!chapter) {
    return null;
  }

  const chapterSummary = moduleData.chapters.find(
    (entry) => entry.chapterId === chapter.chapterId,
  );

  if (!chapterSummary) {
    return null;
  }

  return {
    ...moduleData,
    chapter,
    chapterSummary,
  };
}
