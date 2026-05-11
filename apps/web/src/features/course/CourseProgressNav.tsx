"use client";

import { NavigationFooter } from "@/components/NavigationFooter";
import type { ContentModuleSummary } from "@/lib/content/types";

interface CourseProgressNavProps {
  previousModule?: ContentModuleSummary;
  nextModule?: ContentModuleSummary;
}

export function CourseProgressNav({
  previousModule,
  nextModule,
}: CourseProgressNavProps) {
  return (
    <NavigationFooter
      namespace="contentUi"
      prev={
        previousModule
          ? {
              href: previousModule.route,
              labelKey: "previousModule",
            }
          : undefined
      }
      next={
        nextModule
          ? {
              href: nextModule.route,
              labelKey: "nextModule",
            }
          : undefined
      }
    />
  );
}
