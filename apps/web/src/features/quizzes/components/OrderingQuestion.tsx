"use client";

import type { QuizQuestion } from "@aa/types";
import { useMemo, useRef, useState } from "react";

import RenderableContent from "@/components/content/RenderableContent";

import { surfaceClassesForQuizOptionState } from "./quizOptionSurface";
import type { QuizOptionState } from "./types";

interface Props {
  question: QuizQuestion;
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  optionStateById?: Record<string, QuizOptionState>;
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
  optionStateById,
}: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const pointerCaptureRef = useRef<{ el: Element; id: number } | null>(null);

  const ordered = useMemo(
    () =>
      value.length > 0
        ? value
        : (question.options ?? []).map((item) => item.optionId),
    [question.options, value],
  );

  function endDrag() {
    if (pointerCaptureRef.current) {
      try {
        (pointerCaptureRef.current.el as HTMLElement).releasePointerCapture(
          pointerCaptureRef.current.id,
        );
      } catch {
        // already released
      }
      pointerCaptureRef.current = null;
    }
    setDragId(null);
  }

  function handlePointerDown(e: React.PointerEvent<HTMLElement>, optionId: string) {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerCaptureRef.current = { el: e.currentTarget, id: e.pointerId };
    setDragId(optionId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLElement>, currentDragId: string) {
    if (!dragId || disabled) return;
    // Temporarily release to hit-test, then recapture
    const el = e.currentTarget;
    el.releasePointerCapture(e.pointerId);
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    el.setPointerCapture(e.pointerId);

    const article = hit?.closest("article[data-option-id]");
    const targetId = article?.getAttribute("data-option-id");
    if (targetId && targetId !== currentDragId) {
      onChange(reorderByTarget(ordered, currentDragId, targetId));
    }
  }

  return (
    <div className="space-y-2.5">
      {ordered.map((optionId) => {
        const option = (question.options ?? []).find(
          (item) => item.optionId === optionId,
        );
        if (!option) return null;
        const isDragging = dragId === optionId;
        const reviewMode = Boolean(disabled && optionStateById);
        const rowState = optionStateById?.[optionId] ?? "idle";
        const reviewSurface = surfaceClassesForQuizOptionState(rowState);
        const practiceSurface = isDragging
          ? "!border-primary/40 !bg-primary/10"
          : surfaceClassesForQuizOptionState("idle");
        const articleSurface = reviewMode ? reviewSurface : practiceSurface;

        return (
          <article
            key={optionId}
            data-option-id={optionId}
            className={`rounded-xl border border-solid p-3 transition-colors select-none sm:p-3.5 ${articleSurface}`}
            style={{
              cursor: disabled ? "default" : isDragging ? "grabbing" : "grab",
              touchAction: disabled ? "auto" : "none",
            }}
            onPointerDown={(e) => handlePointerDown(e, optionId)}
            onPointerMove={(e) => handlePointerMove(e, optionId)}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className={`inline-flex h-6 w-6 shrink-0 items-center justify-center text-slate-400 transition-colors ${disabled ? "opacity-50" : ""}`}
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
