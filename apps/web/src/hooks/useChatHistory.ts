import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type {
  AssistantSurface,
  ChatMessage as Message,
} from "@/lib/assistant/types";

/**
 * Interfaz para mensajes del chat.
 */
const STORAGE_KEY = "aa_chat_messages";
const EMBEDDED_ASSISTANT_STORAGE_KEY = "aa_embedded_assistant_messages";

type ChatHistoryStorageMode = "session" | "local";

interface UseChatHistoryOptions {
  storage?: ChatHistoryStorageMode;
  fallbackStorage?: ChatHistoryStorageMode;
}

interface UseChatHistoryResult {
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  isReady: boolean;
}

function getStorage(mode: ChatHistoryStorageMode): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return mode === "local" ? window.localStorage : window.sessionStorage;
}

export function getAssistantChatStorageKey(surface: AssistantSurface) {
  void surface;
  return EMBEDDED_ASSISTANT_STORAGE_KEY;
}

export function getEmbeddedAssistantChatStorageKey() {
  return EMBEDDED_ASSISTANT_STORAGE_KEY;
}

/**
 * Hook para gestionar el historial de mensajes del chat con persistencia configurable.
 * Restaura el historial al montar y lo guarda automáticamente en cada cambio.
 *
 * @returns Objeto con los mensajes y función para actualizarlos
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 *
 * @example
 * ```tsx
 * const { messages, setMessages } = useChatHistory();
 * ```
 */
export function useChatHistory(
  storageKey = STORAGE_KEY,
  options: UseChatHistoryOptions = {},
): UseChatHistoryResult {
  const storageMode = options.storage ?? "session";
  const fallbackStorageMode = options.fallbackStorage;
  const [messages, setMessages] = useState<Message[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Restaurar historial desde el storage configurado al montar
  useEffect(() => {
    setIsReady(false);

    try {
      const storage = getStorage(storageMode);
      const fallbackStorage =
        fallbackStorageMode != null ? getStorage(fallbackStorageMode) : null;

      let raw = storage?.getItem(storageKey) ?? null;
      if (!raw && fallbackStorage) {
        raw = fallbackStorage.getItem(storageKey);
        if (raw && storage) {
          storage.setItem(storageKey, raw);
        }
      }

      if (!raw) {
        setMessages([]);
        setIsReady(true);
        return;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        setMessages([]);
        setIsReady(true);
        return;
      }

      setMessages(
        parsed.map((m: unknown) => {
          const message = m as Record<string, unknown>;
          return {
            id: message.id as string,
            content: message.content as string,
            sender: message.sender as "user" | "bot",
            timestamp: new Date(message.timestamp as string),
            isError: message.isError as boolean | undefined,
            retryMessageId: message.retryMessageId as string | undefined,
          } as Message;
        }),
      );
    } catch {
      setMessages([]);
    } finally {
      setIsReady(true);
    }
  }, [fallbackStorageMode, storageKey, storageMode]);

  // Guardar historial en el storage configurado en cada cambio
  useEffect(() => {
    if (!isReady) {
      return;
    }

    try {
      const storage = getStorage(storageMode);
      if (!storage) {
        return;
      }

      const serializable = messages.map((m: Message) => ({
        ...m,
        timestamp:
          m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
      }));
      storage.setItem(storageKey, JSON.stringify(serializable));
    } catch {
      // noop
    }
  }, [isReady, messages, storageKey, storageMode]);

  return { messages, setMessages, isReady };
}
