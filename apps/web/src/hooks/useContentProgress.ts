"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {
  computeModuleProgress,
  computeSpaceProgress,
  getCompletedSectionIds,
  markSectionCompleted,
  subscribeToProgressChanges,
} from "@/lib/content/progress";
import type {
  ContentModuleSummary,
  ContentSectionSummary,
} from "@/lib/content/types";

interface ProgressSnapshot {
  moduleProgressById: Record<string, number>;
  spaceProgress: number;
}

function buildProgressSnapshot(
  spaceId: string,
  modules: ContentModuleSummary[],
): ProgressSnapshot {
  const moduleProgressById = Object.fromEntries(
    modules.map((module) => [
      module.moduleId,
      computeModuleProgress(
        module,
        getCompletedSectionIds(spaceId, module.moduleId),
      ),
    ]),
  ) as Record<string, number>;

  return {
    moduleProgressById,
    spaceProgress: computeSpaceProgress(spaceId, modules),
  };
}

function buildEmptyProgressSnapshot(
  modules: ContentModuleSummary[],
): ProgressSnapshot {
  const moduleProgressById = Object.fromEntries(
    modules.map((module) => [module.moduleId, 0]),
  ) as Record<string, number>;
  return { moduleProgressById, spaceProgress: 0 };
}

function snapshotsEqual(a: ProgressSnapshot, b: ProgressSnapshot): boolean {
  if (a.spaceProgress !== b.spaceProgress) {
    return false;
  }
  const aKeys = Object.keys(a.moduleProgressById);
  const bKeys = Object.keys(b.moduleProgressById);
  if (aKeys.length !== bKeys.length) {
    return false;
  }
  for (const key of aKeys) {
    if (a.moduleProgressById[key] !== b.moduleProgressById[key]) {
      return false;
    }
  }
  return true;
}

function sectionIdsSnapshotEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((id, i) => id === sortedB[i]);
}

const EMPTY_COMPLETED_SECTION_IDS: string[] = [];

export function useContentProgress(
  spaceId: string,
  modules: ContentModuleSummary[],
) {
  const modulesRef = useRef(modules);
  modulesRef.current = modules;

  const clientSnapshotRef = useRef<ProgressSnapshot | null>(null);
  const serverSnapshotRef = useRef<ProgressSnapshot | null>(null);

  const subscribe = useCallback(
    (onStoreChange: () => void) => subscribeToProgressChanges(onStoreChange),
    [],
  );

  const getSnapshot = useCallback(() => {
    const next = buildProgressSnapshot(spaceId, modulesRef.current);
    const prev = clientSnapshotRef.current;
    if (prev && snapshotsEqual(prev, next)) {
      return prev;
    }
    clientSnapshotRef.current = next;
    return next;
  }, [spaceId]);

  const getServerSnapshot = useCallback(() => {
    const next = buildEmptyProgressSnapshot(modulesRef.current);
    const prev = serverSnapshotRef.current;
    if (prev && snapshotsEqual(prev, next)) {
      return prev;
    }
    serverSnapshotRef.current = next;
    return next;
  }, []);

  const { moduleProgressById, spaceProgress } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return {
    moduleProgressById,
    spaceProgress,
  };
}

interface UseSectionCompletionTrackingOptions {
  spaceId: string;
  module: ContentModuleSummary;
  sections: ContentSectionSummary[];
}

export function useSectionCompletionTracking({
  spaceId,
  module,
  sections,
}: UseSectionCompletionTrackingOptions) {
  const MIN_VISIBLE_PIXELS_TO_COMPLETE = 120;
  const [activeSectionId, setActiveSectionId] = useState<string | undefined>(
    sections[0]?.sectionId,
  );

  const completedSectionIdsRef = useRef<string[]>(EMPTY_COMPLETED_SECTION_IDS);

  const getCompletedSectionIdsSnapshot = useCallback((): string[] => {
    const next = Array.from(getCompletedSectionIds(spaceId, module.moduleId));
    const prev = completedSectionIdsRef.current;
    if (prev && sectionIdsSnapshotEqual(prev, next)) {
      return prev;
    }
    completedSectionIdsRef.current = next;
    return next;
  }, [spaceId, module.moduleId]);

  const completedSectionIds = useSyncExternalStore(
    subscribeToProgressChanges,
    getCompletedSectionIdsSnapshot,
    () => EMPTY_COMPLETED_SECTION_IDS,
  );

  useEffect(() => {
    if (typeof globalThis.window === "undefined" || sections.length === 0) {
      return;
    }

    const ratios = new Map<string, number>();
    const attemptedSectionIds = new Set(
      getCompletedSectionIds(spaceId, module.moduleId),
    );
    const sectionById = new Map(
      sections.map((section) => [section.sectionId, section]),
    );
    const elements = Array.from(
      globalThis.document.querySelectorAll<HTMLElement>(
        "[data-content-section-id]",
      ),
    );

    const syncActiveSection = () => {
      const next = Array.from(ratios.entries())
        .sort((left, right) => right[1] - left[1])
        .find((entry) => entry[1] > 0)?.[0];

      if (next) {
        setActiveSectionId(next);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const sectionId = entry.target.getAttribute(
            "data-content-section-id",
          );
          if (!sectionId) {
            continue;
          }

          ratios.set(sectionId, entry.intersectionRatio);
          const section = sectionById.get(sectionId);

          if (
            section?.trackProgress &&
            entry.isIntersecting &&
            (entry.intersectionRatio >= 0.15 ||
              entry.intersectionRect.height >= MIN_VISIBLE_PIXELS_TO_COMPLETE)
          ) {
            if (!attemptedSectionIds.has(sectionId)) {
              attemptedSectionIds.add(sectionId);
              markSectionCompleted(spaceId, module.moduleId, sectionId);
            }
          }
        }

        syncActiveSection();
      },
      {
        threshold: [
          0, 0.01, 0.02, 0.03, 0.05, 0.08, 0.1, 0.12, 0.15, 0.2, 0.25, 0.5,
          0.75, 1,
        ],
        rootMargin: "-12% 0px -45% 0px",
      },
    );

    for (const element of elements) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, [module.moduleId, module.totalTrackableSections, sections, spaceId]);
  const percentage = useMemo(
    () => computeModuleProgress(module, completedSectionIds),
    [completedSectionIds, module],
  );
  return {
    activeSectionId,
    completedSectionIds,
    percentage,
  };
}
