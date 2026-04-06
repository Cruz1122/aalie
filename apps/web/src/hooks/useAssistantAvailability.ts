"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiKey, getApiKeyStatus } from "@/hooks/useApiKey";

export interface AssistantAvailabilityState {
  hasAny: boolean;
  hasLocalStorage: boolean;
  hasServer: boolean;
  isChecking: boolean;
}

let hasCheckedServerAvailability = false;
let cachedHasServerAvailability = false;
let pendingServerAvailabilityCheck: Promise<boolean> | null = null;

function buildAvailabilityState(
  hasLocalStorage: boolean,
  enabled: boolean,
): AssistantAvailabilityState {
  const hasServer = hasCheckedServerAvailability
    ? cachedHasServerAvailability
    : false;

  return {
    hasAny: hasLocalStorage || hasServer,
    hasLocalStorage,
    hasServer,
    isChecking: enabled && !hasLocalStorage && !hasCheckedServerAvailability,
  };
}

export function useAssistantAvailability(enabled = true) {
  const [state, setState] = useState<AssistantAvailabilityState>(() =>
    buildAvailabilityState(false, enabled),
  );

  const refresh = useCallback(async () => {
    if (!enabled) {
      setState((previous) => ({
        ...previous,
        isChecking: false,
      }));
      return;
    }

    const hasLocalStorage = getApiKey() !== null;

    if (hasLocalStorage) {
      setState(buildAvailabilityState(true, false));
      return;
    }

    if (hasCheckedServerAvailability) {
      setState(buildAvailabilityState(false, false));
      return;
    }

    setState((previous) => ({
      ...previous,
      hasAny: false,
      hasLocalStorage: false,
      isChecking: true,
    }));

    try {
      if (!pendingServerAvailabilityCheck) {
        pendingServerAvailabilityCheck = getApiKeyStatus()
          .then((status) => {
            cachedHasServerAvailability = status.hasServer;
            hasCheckedServerAvailability = true;
            return status.hasServer;
          })
          .finally(() => {
            pendingServerAvailabilityCheck = null;
          });
      }

      const hasServer = await pendingServerAvailabilityCheck;
      setState({
        hasAny: hasServer,
        hasLocalStorage: false,
        hasServer,
        isChecking: false,
      });
    } catch (error) {
      console.error(
        "[useAssistantAvailability] Error verificando disponibilidad:",
        error,
      );
      cachedHasServerAvailability = false;
      hasCheckedServerAvailability = true;
      setState({
        hasAny: false,
        hasLocalStorage: false,
        hasServer: false,
        isChecking: false,
      });
    }
  }, [enabled]);

  useEffect(() => {
    setState(buildAvailabilityState(getApiKey() !== null, enabled));

    if (!enabled) {
      return;
    }

    void refresh();
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "gemini_api_key" || event.key === null) {
        void refresh();
      }
    };

    const handleApiKeyChange = () => {
      void refresh();
    };

    globalThis.window.addEventListener("storage", handleStorageChange);
    globalThis.window.addEventListener("apiKeyChanged", handleApiKeyChange);

    return () => {
      globalThis.window.removeEventListener("storage", handleStorageChange);
      globalThis.window.removeEventListener(
        "apiKeyChanged",
        handleApiKeyChange,
      );
    };
  }, [enabled, refresh]);

  return {
    ...state,
    refresh,
  };
}
