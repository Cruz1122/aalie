"use client";

import type { QuizQuestion } from "@aa/types";
import { useMemo, useState } from "react";

import RenderableContent from "@/components/content/RenderableContent";

interface Props {
  question: QuizQuestion;
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

function reorderByTarget(
  items: string[],
  dragId: string,
  targetId: string,
): string[] {
  if (dragId === targetId) return items;
  const fromIndex = items.indexOf(dragId);
  const toIndex = items.indexOf(targetId);
  if (fromIndex < 0 || toIndex < 0) return items;
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function OrderingQuestion({
  question,
  value,
  onChange,
  disabled = false,
}: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const ordered = useMemo(
    () =>
      value.length > 0
        ? value
        : (question.options ?? []).map((item) => item.optionId),
    [question.options, value],
  );

  return (
    <div className="space-y-2.5">
      {ordered.map((optionId) => {
        const option = (question.options ?? []).find(
          (item) => item.optionId === optionId,
        );
        if (!option) return null;
        const isDragging = dragId === optionId;

        return (
          <article
            key={optionId}
            draggable={!disabled}
            className={`glass-card rounded-xl border border-white/10 p-3 transition-colors ${
              isDragging
                ? "!border-primary/40 !bg-primary/10 hover:!border-primary/40 hover:!bg-primary/10"
                : "bg-white/5 hover:!border-white/10 hover:!bg-white/5"
            } ${disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
            onDragStart={(event) => {
              setDragId(optionId);
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", optionId);
              const article = event.currentTarget;
              const rect = article.getBoundingClientRect();
              event.dataTransfer.setDragImage(
                article,
                Math.max(8, rect.width * 0.08),
                Math.max(8, rect.height * 0.2),
              );
            }}
            onDragOver={(event) => {
              if (disabled || !dragId || dragId === optionId) return;
              event.preventDefault();
            }}
            onDragEnter={(event) => {
              if (disabled || !dragId || dragId === optionId) return;
              event.preventDefault();
              const next = reorderByTarget(ordered, dragId, optionId);
              onChange(next);
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (disabled || !dragId) return;
              setDragId(null);
            }}
            onDragEnd={() => setDragId(null)}
          >
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className={`inline-flex h-6 w-6 shrink-0 items-center justify-center text-slate-400 transition-colors ${disabled ? "opacity-50" : "hover:text-slate-200"}`}
              >
                <span className="material-symbols-outlined text-[18px] leading-none">
                  drag_indicator
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <RenderableContent
                  content={option.content}
                  className="[&>*]:mb-0 text-sm text-slate-100"
                />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
