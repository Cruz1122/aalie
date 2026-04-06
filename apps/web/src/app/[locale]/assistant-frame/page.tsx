"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useEffect, useMemo, useState } from "react";

import ChatBot from "@/components/ChatBot";
import {
  getEmbeddedAssistantChatStorageKey,
  useChatHistory,
} from "@/hooks/useChatHistory";
import {
  createAssistantFrameReadyMessage,
  createAssistantRequestAnalyzeCodeMessage,
  createAssistantRequestCloseMessage,
  isAssistantFrameMessage,
} from "@/lib/assistant/frame-messages";
import type { AssistantContext } from "@/lib/assistant/types";
import { isAssistantSurface } from "@/lib/assistant/types";
import { createBotMessage } from "@/lib/chatbot-core";

function AssistantFramePageContent() {
  const searchParams = useSearchParams();
  const t = useTranslations("chat");
  const rawSurface = searchParams.get("surface");
  const surface = isAssistantSurface(rawSurface) ? rawSurface : "analyzer";
  const storageKey = useMemo(() => getEmbeddedAssistantChatStorageKey(), []);
  const { messages, setMessages, isReady } = useChatHistory(storageKey, {
    storage: "local",
    fallbackStorage: "session",
  });
  const [assistantContext, setAssistantContext] =
    useState<AssistantContext | null>(null);

  useEffect(() => {
    if (isReady && messages.length === 0) {
      setMessages([createBotMessage(t("embeddedWelcome"))]);
    }
  }, [isReady, messages.length, setMessages, t]);

  useEffect(() => {
    const targetOrigin = globalThis.window.location.origin;
    globalThis.window.parent.postMessage(
      createAssistantFrameReadyMessage(surface),
      targetOrigin,
    );

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== targetOrigin) {
        return;
      }
      if (!isAssistantFrameMessage(event.data)) {
        return;
      }
      if (event.data.type !== "ASSISTANT_CONTEXT_SYNC") {
        return;
      }

      setAssistantContext(event.data.context);
    };

    globalThis.window.addEventListener("message", handleMessage);
    return () => {
      globalThis.window.removeEventListener("message", handleMessage);
    };
  }, [surface]);

  const postToParent = (message: unknown) => {
    globalThis.window.parent.postMessage(
      message,
      globalThis.window.location.origin,
    );
  };

  return (
    <div className="h-screen w-full bg-[#101a23]">
      <ChatBot
        isOpen
        onClose={() =>
          postToParent(createAssistantRequestCloseMessage(surface))
        }
        messages={messages}
        setMessages={setMessages}
        assistantContext={assistantContext}
        variant="embedded"
        welcomeMessage={t("embeddedWelcome")}
        closeTitle={t("closeAssistant")}
        availabilityOverride={{
          hasAny: true,
          hasLocalStorage: false,
          hasServer: false,
          isChecking: false,
        }}
        onAnalyzeCode={(code) =>
          postToParent(createAssistantRequestAnalyzeCodeMessage(surface, code))
        }
      />
    </div>
  );
}

export default function AssistantFramePage() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-[#101a23]" />}>
      <AssistantFramePageContent />
    </Suspense>
  );
}
