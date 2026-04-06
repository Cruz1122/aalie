"use client";

import { useTranslations } from "next-intl";
import React, { useState } from "react";

export type ExportFormatType = "markdown" | "pdf";

const EXPORT_FORMATS: ExportFormatType[] = ["markdown", "pdf"];

interface FormatInfo {
  id: ExportFormatType;
  icon: string;
  color: string;
  borderColor: string;
  bgColor: string;
}

const formats: Record<ExportFormatType, FormatInfo> = {
  markdown: {
    id: "markdown",
    icon: "markdown",
    color: "text-blue-300",
    borderColor: "border-blue-500/30",
    bgColor: "bg-blue-500/20",
  },
  pdf: {
    id: "pdf",
    icon: "picture_as_pdf",
    color: "text-red-300",
    borderColor: "border-red-500/30",
    bgColor: "bg-red-500/20",
  },
};

interface ExportFormatSelectorProps {
  onSelect: (formats: ExportFormatType[]) => void;
  onCancel: () => void;
}

export default function ExportFormatSelector({
  onSelect,
  onCancel,
}: ExportFormatSelectorProps) {
  const t = useTranslations("analyzer.exportSelector");
  const tCommon = useTranslations("common");
  const [selectedFormats, setSelectedFormats] = useState<Set<ExportFormatType>>(
    new Set([]),
  );

  const toggleFormat = (formatId: ExportFormatType) => {
    setSelectedFormats((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(formatId)) {
        newSet.delete(formatId);
      } else {
        newSet.add(formatId);
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    onSelect(Array.from(selectedFormats));
  };

  const isSelectionValid = selectedFormats.size > 0;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center transition-opacity duration-300 opacity-100"
      style={{ pointerEvents: "auto" }}
    >
      <div
        className="absolute inset-0 glass-modal-overlay"
        onClick={onCancel}
      />
      <div className="relative z-10 glass-modal-container rounded-2xl p-8 w-[600px] h-[400px] mx-4 shadow-2xl flex flex-col">
        <div className="flex-1 flex flex-col">
          <div className="mb-8 shrink-0">
            <h2 className="mt-1 text-xl font-semibold text-white text-center">
              {t("title")}
            </h2>
            <p className="mt-2 text-sm text-slate-300 text-center">
              {t("description")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 px-4 flex-1">
            {EXPORT_FORMATS.map((formatId) => {
              const format = formats[formatId];
              const isSelected = selectedFormats.has(formatId);

              return (
                <button
                  key={formatId}
                  onClick={() => toggleFormat(formatId)}
                  className={`relative w-full p-4 rounded-xl border-2 transition-all text-left h-full ${
                    isSelected
                      ? `${format.borderColor} ${format.bgColor} border-2 scale-[1.02]`
                      : "border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50"
                  } hover:z-40 focus-within:z-40`}
                >
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected
                          ? `${format.bgColor} border border-white/20 shadow-lg`
                          : "bg-slate-700/50 border border-slate-600/50"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-3xl ${
                          isSelected ? format.color : "text-slate-400"
                        }`}
                      >
                        {format.icon}
                      </span>
                    </div>
                    <span
                      className={`font-medium text-sm text-center ${
                        isSelected ? format.color : "text-slate-300/90"
                      }`}
                    >
                      {t(`formats.${formatId}`)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 mt-2 flex gap-3 justify-end shrink-0 relative z-20">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700/70 transition-colors text-sm font-semibold"
          >
            {tCommon("cancel")}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isSelectionValid}
            className="px-6 py-2 rounded-lg bg-slate-600/50 text-white border border-slate-500/50 hover:bg-slate-600/80 transition-colors text-sm font-semibold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-600/50"
          >
            <span className="material-symbols-outlined text-base">
              download
            </span>
            {t("download")}
          </button>
        </div>
      </div>
    </div>
  );
}
