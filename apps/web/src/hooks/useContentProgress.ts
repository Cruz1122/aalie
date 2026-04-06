"use client";

import { useEffect, useMemo, useState } from "react";

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

export function useContentProgress(
  spaceId: string,
  modules: ContentModuleSummary[],
) {
  const [version, setVersion] = useState(0);

  useEffect(
    () =>
      subscribeToProgressChanges(() => {
        setVersion((current) => current + 1);
      }),
    [],
  );

  const moduleProgressById = useMemo(
    () =>
      Object.fromEntries(
        modules.map((module) => [
          module.moduleId,
          computeModuleProgress(
            module,
            getCompletedSectionIds(spaceId, module.moduleId),
          ),
        ]),
      ) as Record<string, number>,
    [modules, spaceId, version],
  );

  const spaceProgress = useMemo(
    () => computeSpaceProgress(spaceId, modules),
    [modules, spaceId, version],
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
