"use client";

import type { QuizPair, QuizQuestion } from "@aa/types";
import { useTranslations } from "next-intl";

import RenderableContent from "@/components/content/RenderableContent";

import { Dropdown } from "./Dropdown";
import { surfaceClassesForQuizOptionState } from "./quizOptionSurface";
import type { QuizOptionState } from "./types";

interface Props {
  question: QuizQuestion;
  value: QuizPair[];
  onChange: (value: QuizPair[]) => void;
  disabled?: boolean;
  rowStateByLeftId?: Record<string, QuizOptionState>;
}

function toMap(pairs: QuizPair[]): Record<string, string> {
  return Object.fromEntries(pairs.map((pair) => [pair.leftId, pair.rightId]));
}

export function DefinitionsConceptsQuestion({
  question,
  value,
  onChange,
  disabled = false,
  rowStateByLeftId,
}: Props) {
  const t = useTranslations("quizzes");
  const selectedMap = toMap(value);

  return (
    <div className="space-y-2">
      {(question.leftItems ?? []).map((leftItem) => {
        const leftId = leftItem.leftId ?? "";
        const rowState = rowStateByLeftId?.[leftId] ?? "idle";
        const reviewRow = rowStateByLeftId !== undefined;
        const outerSurface = reviewRow
          ? surfaceClassesForQuizOptionState(rowState)
          : "!border-slate-600/55 !bg-[rgba(24,36,49,0.94)] hover:!border-slate-500/60 hover:!bg-[rgba(28,42,56,0.98)]";

        return (
          <div
            key={leftItem.leftId}
            className={`grid items-stretch gap-2 rounded-xl border border-solid p-2.5 sm:grid-cols-2 ${outerSurface}`}
          >
            <div className="flex min-h-11 items-center rounded-lg border border-solid border-slate-600/45 bg-[#182431] px-3 py-2">
              <RenderableContent
                content={leftItem.content}
                className="w-full text-sm leading-relaxed text-slate-100"
              />
            </div>
            <div className="min-h-11">
              <Dropdown
                id={`match-${leftItem.leftId ?? "unknown"}`}
                label={t("matching.selectOption")}
                items={(question.rightItems ?? []).map((rightItem) => ({
                  value: rightItem.rightId ?? "",
                  text: (
                    rightItem.content.blocks[0]?.content ??
                    rightItem.rightId ??
                    ""
                  ).slice(0, 80),
                }))}
                itemToString={(item) => item?.text ?? ""}
                itemToValue={(item) => item.value}
                className="h-full"
                invalid={reviewRow && rowState === "incorrect"}
                triggerClassName={`h-full rounded-lg ${
                  reviewRow && rowState === "correct"
                    ? "!border-emerald-300/45 !bg-emerald-500/15"
                    : !reviewRow
                      ? "!border-slate-600/50 !bg-[#182431] hover:!border-slate-500/55"
                      : ""
                }`}
                disabled={disabled}
                value={selectedMap[leftItem.leftId ?? ""] ?? ""}
                onChange={(rightId) => {
                  const leftId = leftItem.leftId;
                  if (!leftId) return;
                  const next = value.filter((pair) => pair.leftId !== leftId);
                  if (rightId) {
                    next.push({ leftId, rightId });
                  }
                  onChange(next);
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
