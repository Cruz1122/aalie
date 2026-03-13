"use client";

import { useLocale, useTranslations } from "next-intl";
import React from "react";

import { translateBackendContent } from "@/lib/backend-content-translator";

import Formula from "./Formula";
import BaseModalContainer from "./modals/BaseModalContainer";

interface RecursionTreeStepsModalProps {
  open: boolean;
  onClose: () => void;
  proof:
    | Array<{
        id: string;
        text: string;
      }>
    | null
    | undefined;
}

export default function RecursionTreeStepsModal({
  open,
  onClose,
  proof,
}: Readonly<RecursionTreeStepsModalProps>) {
  const t = useTranslations("analyzer.recursionTreeStepsModal");
  const locale = useLocale() as "en" | "es";

  if (!open) return null;

  return (
    <BaseModalContainer
      open={open}
      onClose={onClose}
      title={t("title")}
      titleIcon="list"
      closeAriaLabel={t("closeModal")}
      sizeClassName="w-[min(95vw,1400px)] max-h-[75vh]"
      panelClassName="rounded-xl bg-slate-900 ring-1 ring-white/10"
      headerClassName="p-4"
      contentClassName="p-6"
    >
          {proof && proof.length > 0 ? (
            <div className="space-y-4">
              {proof.map((step, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg bg-slate-800/50 border border-white/10"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                      <span className="text-purple-300 font-semibold text-sm">
                        {idx + 1}
                      </span>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                      <Formula
                        latex={translateBackendContent(step.text, locale)}
                        display
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <p>{t("noStepsAvailable")}</p>
            </div>
          )}
    </BaseModalContainer>
  );
}
