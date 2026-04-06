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

function buildEmptyProgressSnapshot(modules: ContentModuleSummary[]): ProgressSnapshot {
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

export function useContentProgress(
  spaceId: string,
  modules: ContentModuleSummary[],
) {
  const clientSnapshotRef = useRef<ProgressSnapshot | null>(null);
  const serverSnapshotRef = useRef<ProgressSnapshot | null>(null);

  const subscribe = useCallback(
    (onStoreChange: () => void) => subscribeToProgressChanges(onStoreChange),
    [],
  );

  const getSnapshot = useCallback(() => {
    const next = buildProgressSnapshot(spaceId, modules);
    const prev = clientSnapshotRef.current;
    if (prev && snapshotsEqual(prev, next)) {
      return prev;
    }
    clientSnapshotRef.current = next;
    return next;
  }, [spaceId, modules]);

  const getServerSnapshot = useCallback(() => {
    const next = buildEmptyProgressSnapshot(modules);
    const prev = serverSnapshotRef.current;
    if (prev && snapshotsEqual(prev, next)) {
      return prev;
    }
    serverSnapshotRef.current = next;
    return next;
  }, [modules]);

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
  const [version, setVersion] = useState(0);
  const [activeSectionId, setActiveSectionId] = useState<string | undefined>(
    sections[0]?.sectionId,
  );

  useEffect(
    () =>
      subscribeToProgressChanges(() => {
        setVersion((current) => current + 1);
      }),
    [],
  );

  useEffect(() => {
    if (typeof globalThis.window === "undefined" || sections.length === 0) {
      return;
    }

    const ratios = new Map<string, number>();
    const timers = new Map<string, number>();
    const sectionById = new Map(sections.map((section) => [section.sectionId, section]));
    const elements = Array.from(
      globalThis.document.querySelectorAll<HTMLElement>("[data-content-section-id]"),
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
          const sectionId = entry.target.getAttribute("data-content-section-id");
          if (!sectionId) {
            continue;
          }

          ratios.set(sectionId, entry.intersectionRatio);
          const section = sectionById.get(sectionId);

          if (section?.trackProgress && entry.intersectionRatio >= 0.5) {
            if (!timers.has(sectionId)) {
              const timeoutId = globalThis.window.setTimeout(() => {
                markSectionCompleted(spaceId, module.moduleId, sectionId);
                timers.delete(sectionId);
              }, 1000);
              timers.set(sectionId, timeoutId);
            }
          } else {
            const timeoutId = timers.get(sectionId);
            if (timeoutId) {
              globalThis.window.clearTimeout(timeoutId);
              timers.delete(sectionId);
            }
          }
        }

        syncActiveSection();
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin: "-12% 0px -45% 0px",
      },
    );

    for (const element of elements) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
      for (const timeoutId of timers.values()) {
        globalThis.window.clearTimeout(timeoutId);
      }
    };
  }, [module.moduleId, sections, spaceId]);

  const completedSectionIds = useMemo(
    () => Array.from(getCompletedSectionIds(spaceId, module.moduleId)),
    [module.moduleId, spaceId, version],
  );

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
