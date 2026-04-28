"use client";

import type { QuizPair, QuizQuestion } from "@aa/types";
import { useTranslations } from "next-intl";

import RenderableContent from "@/components/content/RenderableContent";

import { Dropdown } from "./Dropdown";

interface Props {
  question: QuizQuestion;
  value: QuizPair[];
  onChange: (value: QuizPair[]) => void;
  disabled?: boolean;
}

function toMap(pairs: QuizPair[]): Record<string, string> {
  return Object.fromEntries(pairs.map((pair) => [pair.leftId, pair.rightId]));
}

export function DefinitionsConceptsQuestion({
  question,
  value,
  onChange,
  disabled = false,
}: Props) {
  const t = useTranslations("quizzes");
  const selectedMap = toMap(value);

  return (
    <div className="space-y-2">
      {(question.leftItems ?? []).map((leftItem) => (
        <div
          key={leftItem.leftId}
          className="glass-card grid items-stretch gap-2 rounded-xl border border-slate-700/55 bg-white/5 p-2.5 hover:!border-slate-700/55 hover:!bg-white/5 sm:grid-cols-2"
        >
          <div className="flex h-11 items-center rounded-lg border border-white/10 bg-[#182431] px-3">
            <RenderableContent
              content={leftItem.content}
              className="w-full text-sm leading-relaxed text-slate-100"
            />
          </div>
          <div className="h-11">
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
              triggerClassName="h-full rounded-lg"
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
      ))}
    </div>
  );
}
