"use client";

import type { LearningObjective } from "@aa/content-catalog";

interface LearningObjectivesPanelProps {
  title: string;
  objectives?: LearningObjective[];
}

export function LearningObjectivesPanel({
  title,
  objectives = [],
}: LearningObjectivesPanelProps) {
  if (!objectives.length) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-100/90">
        {title}
      </h3>
      <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-100">
        {objectives.map((objective) => (
          <li key={objective.objectiveId} className="flex gap-2">
            <span className="text-emerald-300">•</span>
            <span>{objective.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
