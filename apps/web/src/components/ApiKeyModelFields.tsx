"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  CUSTOM_MODEL_VALUE,
  getLlmProviderLabel,
  getProviderCatalog,
  type ApiKeyProvider,
  type ModelTier,
} from "@/lib/llm-model-catalog";

const MODEL_TIERS: ModelTier[] = ["fast", "balanced", "best"];

interface ApiKeyModelFieldsProps {
  readonly provider: ApiKeyProvider | null;
  readonly modelChoice: string;
  readonly customModel: string;
  readonly onModelChoiceChange: (choice: string) => void;
  readonly idPrefix: string;
  readonly compact?: boolean;
}

/**
 * Compact model selector used beside the provider API-key field.
 *
 * It intentionally follows the same portal/dropdown pattern as the footer's
 * language selector so the AI settings row remains as small as the rest of
 * the footer. The custom model value is typed in the parent API-key field;
 * that lets the field switch its placeholder without adding a second large
 * form row.
 */
export default function ApiKeyModelFields({
  provider,
  modelChoice,
  customModel,
  onModelChoiceChange,
  idPrefix,
  compact = true,
}: ApiKeyModelFieldsProps) {
  const tApiKey = useTranslations("footer.apiKey");
  const providerCatalog = getProviderCatalog(provider);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);

  const updatePosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setPosition({
        top: rect.top,
        left: rect.left,
      });
    }
  };

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const inTrigger = triggerRef.current?.contains(target);
      const inPanel = panelRef.current?.contains(target);
      if (!inTrigger && !inPanel) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  if (!provider || !providerCatalog) return null;

  const modelSelectId = `${idPrefix}-model-select`;
  const selectedModel =
    modelChoice === CUSTOM_MODEL_VALUE ? customModel.trim() : modelChoice;
  const selectedOption = providerCatalog.models.find(
    (model) => model.id === modelChoice,
  );
  const selectedLabel =
    modelChoice === CUSTOM_MODEL_VALUE
      ? selectedModel || tApiKey("customModelOption")
      : selectedOption?.label || modelChoice || tApiKey("modelLabel");

  const handleModelChange = (choice: string) => {
    onModelChoiceChange(choice);
    setIsOpen(false);
  };

  const dropdownPanel = isOpen && (
    <ul
      ref={panelRef}
      className="fixed z-[99999] min-w-[230px] max-w-[min(90vw,340px)] rounded-lg border border-white/10 bg-slate-900/98 py-1 shadow-xl backdrop-blur-sm"
      style={{
        bottom: `calc(100vh - ${position.top}px + 4px)`,
        left: position.left,
      }}
      role="listbox"
      aria-labelledby={modelSelectId}
    >
      {MODEL_TIERS.map((tier) => {
        const tierModels = providerCatalog.models.filter(
          (model) => model.tier === tier,
        );
        if (tierModels.length === 0) return null;

        return (
          <li key={tier} role="presentation">
            <p className="px-2 pb-1 pt-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
              {tApiKey(`tier.${tier}`)}
            </p>
            {tierModels.map((model) => {
              const isSelected = modelChoice === model.id;
              return (
                <button
                  key={model.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleModelChange(model.id);
                  }}
                  className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                    isSelected
                      ? "bg-slate-900/40 text-slate-200"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <span
                    className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${isSelected ? "bg-slate-400" : "bg-slate-500"}`}
                  />
                  <span className="min-w-0">
                    <span className="block truncate">{model.label}</span>
                    <span className="block truncate text-[10px] text-slate-500">
                      {model.id}
                    </span>
                  </span>
                </button>
              );
            })}
          </li>
        );
      })}
      <li className="mt-1 border-t border-white/10 pt-1" role="presentation">
        <button
          type="button"
          role="option"
          aria-selected={modelChoice === CUSTOM_MODEL_VALUE}
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            handleModelChange(CUSTOM_MODEL_VALUE);
          }}
          className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
            modelChoice === CUSTOM_MODEL_VALUE
              ? "bg-slate-900/40 text-slate-200"
              : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
          }`}
        >
          <span
            className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${modelChoice === CUSTOM_MODEL_VALUE ? "bg-slate-400" : "bg-slate-500"}`}
          />
          <span className="min-w-0 truncate">
            {tApiKey("customModelOption")}
          </span>
        </button>
      </li>
    </ul>
  );

  return (
    <div
      className={`${compact ? "inline-flex shrink-0" : "flex w-full justify-center"} relative`}
      role="group"
      aria-label={`${tApiKey("modelLabel")}: ${getLlmProviderLabel(provider)}`}
    >
      <button
        id={modelSelectId}
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (!isOpen) updatePosition();
          setIsOpen((open) => !open);
        }}
        className="inline-flex max-w-[min(48vw,220px)] items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs text-dark-text transition-colors hover:bg-white/10 hover:text-white"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`${tApiKey("modelLabel")}: ${selectedLabel}`}
        title={`${selectedLabel} · ${getLlmProviderLabel(provider)}`}
      >
        <span className="material-symbols-outlined footer-icon">tune</span>
        <span className="truncate">{selectedLabel}</span>
      </button>

      {typeof document !== "undefined" &&
        isOpen &&
        createPortal(dropdownPanel, document.body)}
    </div>
  );
}
