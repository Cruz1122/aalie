import { useEffect, useState } from "react";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isError?: boolean;
  retryMessageId?: string;
}

const STORAGE_KEY = "aa_chat_messages";

export function useChatHistory() {
  const [messages, setMessages] = useState<Message[]>([]);

  // Restaurar historial desde sessionStorage al montar
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      setMessages(parsed.map((m: unknown) => {
        const message = m as Record<string, unknown>;
        return {
          id: message.id as string,
          content: message.content as string,
          sender: message.sender as 'user' | 'bot',
          timestamp: new Date(message.timestamp as string),
          isError: message.isError as boolean | undefined,
          retryMessageId: message.retryMessageId as string | undefined,
        } as Message;
      }));
    } catch {
      // noop
    }
  }, []);

  // Guardar historial en sessionStorage en cada cambio
  useEffect(() => {
    try {
      const serializable = messages.map((m: Message) => ({ 
        ...m, 
        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp 
      }));
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    } catch {
      // noop
    }
  }, [messages]);

  return { messages, setMessages };
}

