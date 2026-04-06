"use client";

import { useLocale, useTranslations } from "next-intl";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import AALIEIcon from "@/components/AALIEIcon";
import { useAssistantAvailability } from "@/hooks/useAssistantAvailability";
import {
  createAssistantContextSyncMessage,
  isAssistantFrameMessage,
} from "@/lib/assistant/frame-messages";
import type { AssistantContext, AssistantSurface } from "@/lib/assistant/types";

interface EmbeddedAssistantLauncherProps {
  surface: AssistantSurface;
  assistantContext: AssistantContext;
  onAnalyzeCode?: (code: string) => void;
}

export function EmbeddedAssistantLauncher({
  surface,
  assistantContext,
  onAnalyzeCode,
}: EmbeddedAssistantLauncherProps) {
  const locale = useLocale();
  const t = useTranslations("chat");
  const availability = useAssistantAvailability();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hasMountedFrame, setHasMountedFrame] = useState(false);
  const [frameReady, setFrameReady] = useState(false);
  const targetOrigin =
    typeof window === "undefined" ? "" : globalThis.window.location.origin;

  const frameSrc = useMemo(
    () => `/${locale}/assistant-frame?surface=${surface}`,
    [locale, surface],
  );

  const syncContext = useCallback(() => {
    if (
      !frameReady ||
      !isOpen ||
      !iframeRef.current?.contentWindow ||
      !targetOrigin
    ) {
      return;
    }

    iframeRef.current.contentWindow.postMessage(
      createAssistantContextSyncMessage(surface, assistantContext),
      targetOrigin,
    );
  }, [assistantContext, frameReady, isOpen, surface, targetOrigin]);

  useEffect(() => {
    if (frameReady && isOpen) {
      syncContext();
    }
  }, [frameReady, isOpen, syncContext]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!targetOrigin || event.origin !== targetOrigin) {
        return;
      }
      if (event.source !== iframeRef.current?.contentWindow) {
        return;
      }
      if (!isAssistantFrameMessage(event.data)) {
        return;
      }

      switch (event.data.type) {
        case "ASSISTANT_FRAME_READY":
          setFrameReady(true);
          break;
        case "ASSISTANT_REQUEST_CLOSE":
          setIsOpen(false);
          break;
        case "ASSISTANT_REQUEST_ANALYZE_CODE":
          onAnalyzeCode?.(event.data.code);
          break;
        default:
          break;
      }
    };

    globalThis.window.addEventListener("message", handleMessage);
    return () => {
      globalThis.window.removeEventListener("message", handleMessage);
    };
  }, [onAnalyzeCode, targetOrigin]);

  useEffect(() => {
    if (isOpen) {
      setHasMountedFrame(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!availability.hasAny && !isOpen) {
      setFrameReady(false);
    }
  }, [availability.hasAny, isOpen]);

  if (!availability.hasAny && !isOpen) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-16 left-4 right-4 z-[10020] flex flex-col items-end gap-3 sm:bottom-20 sm:left-auto sm:right-6">
      {hasMountedFrame && (
        <div
          hidden={!isOpen}
          aria-hidden={!isOpen}
          className={`pointer-events-auto w-full origin-bottom-right sm:w-[392px] ${
            isOpen ? "animate-[chatBubbleEnter_0.24s_ease-out_forwards]" : ""
          }`}
        >
          <div className="h-[min(72vh,580px)] overflow-hidden rounded-[28px] border border-white/10 bg-[#101a23] shadow-2xl shadow-black/40 isolate transform-gpu [backface-visibility:hidden] [contain:paint] sm:h-[560px]">
            <iframe
              ref={iframeRef}
              title={t("embeddedFrameTitle")}
              src={frameSrc}
              className="block h-full w-full border-0 bg-transparent [transform:translateZ(0)] [backface-visibility:hidden]"
              allow="clipboard-write"
            />
          </div>
        </div>
      )}

      {availability.hasAny && (
        <button
          type="button"
          aria-label={t("launcherAriaLabel")}
          title={t("launcherAriaLabel")}
          onClick={() => setIsOpen((previous) => !previous)}
          className={`pointer-events-auto group relative inline-flex h-16 w-16 items-center justify-center rounded-full border border-purple-400/30 bg-[#162433]/95 shadow-xl shadow-black/40 transition-all duration-300 hover:scale-105 hover:border-purple-300/40 ${
            isOpen ? "ring-2 ring-purple-400/40" : ""
          }`}
        >
          <div className="absolute inset-1 rounded-full bg-gradient-to-br from-purple-500/20 via-blue-500/10 to-cyan-500/20" />
          <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-purple-500/10 to-cyan-500/10" />
          <AALIEIcon
            className="relative z-10 text-purple-200 transition-colors group-hover:text-white"
            size={30}
          />
        </button>
      )}
    </div>
  );
}
