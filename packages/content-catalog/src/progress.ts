import type { CatalogModule, ModuleProgress } from "./types.js";

export function getTrackableSectionIds(module: CatalogModule): string[] {
  return module.chapters.flatMap((chapter) =>
    chapter.sections
      .filter((section) => section.trackProgress)
      .map((section) => section.sectionId),
  );
}

export function computeModuleProgress(
  module: CatalogModule,
  completedSectionIds: Iterable<string>,
): ModuleProgress {
  const trackableSectionIds = getTrackableSectionIds(module);
  const totalTrackableSections = trackableSectionIds.length;

  if (totalTrackableSections === 0) {
    throw new Error(
      `Module ${module.moduleId} has no trackable sections; progress is not computable`,
    );
  }

  const completed = new Set(completedSectionIds);
  const completedTrackableSections = trackableSectionIds.filter((sectionId) =>
    completed.has(sectionId),
  ).length;
  const ratio = completedTrackableSections / totalTrackableSections;

  return {
    totalTrackableSections,
    completedTrackableSections,
    ratio,
    percentage: Math.round(ratio * 100),
  };
}
