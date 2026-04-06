import type { AssistantContext, AssistantSurface } from "./types";

const ASSISTANT_FRAME_SOURCE = "aalie-embedded-assistant";
const ASSISTANT_FRAME_VERSION = 1;

interface AssistantFrameBaseMessage {
  source: typeof ASSISTANT_FRAME_SOURCE;
  version: typeof ASSISTANT_FRAME_VERSION;
  surface: AssistantSurface;
}

export interface AssistantFrameReadyMessage
  extends AssistantFrameBaseMessage {
  type: "ASSISTANT_FRAME_READY";
}

export interface AssistantContextSyncMessage
  extends AssistantFrameBaseMessage {
  type: "ASSISTANT_CONTEXT_SYNC";
  context: AssistantContext;
}

export interface AssistantRequestCloseMessage
  extends AssistantFrameBaseMessage {
  type: "ASSISTANT_REQUEST_CLOSE";
}

export interface AssistantRequestAnalyzeCodeMessage
  extends AssistantFrameBaseMessage {
  type: "ASSISTANT_REQUEST_ANALYZE_CODE";
  code: string;
}

export type AssistantFrameMessage =
  | AssistantFrameReadyMessage
  | AssistantContextSyncMessage
  | AssistantRequestCloseMessage
  | AssistantRequestAnalyzeCodeMessage;

export function createAssistantFrameReadyMessage(
  surface: AssistantSurface,
): AssistantFrameReadyMessage {
  return {
    source: ASSISTANT_FRAME_SOURCE,
    version: ASSISTANT_FRAME_VERSION,
    type: "ASSISTANT_FRAME_READY",
    surface,
  };
}

export function createAssistantContextSyncMessage(
  surface: AssistantSurface,
  context: AssistantContext,
): AssistantContextSyncMessage {
  return {
    source: ASSISTANT_FRAME_SOURCE,
    version: ASSISTANT_FRAME_VERSION,
    type: "ASSISTANT_CONTEXT_SYNC",
    surface,
    context,
  };
}

export function createAssistantRequestCloseMessage(
  surface: AssistantSurface,
): AssistantRequestCloseMessage {
  return {
    source: ASSISTANT_FRAME_SOURCE,
    version: ASSISTANT_FRAME_VERSION,
    type: "ASSISTANT_REQUEST_CLOSE",
    surface,
  };
}

export function createAssistantRequestAnalyzeCodeMessage(
  surface: AssistantSurface,
  code: string,
): AssistantRequestAnalyzeCodeMessage {
  return {
    source: ASSISTANT_FRAME_SOURCE,
    version: ASSISTANT_FRAME_VERSION,
    type: "ASSISTANT_REQUEST_ANALYZE_CODE",
    surface,
    code,
  };
}

export function isAssistantFrameMessage(
  data: unknown,
): data is AssistantFrameMessage {
  if (!data || typeof data !== "object") {
    return false;
  }

  const message = data as Record<string, unknown>;
  return (
    message.source === ASSISTANT_FRAME_SOURCE &&
    message.version === ASSISTANT_FRAME_VERSION &&
    typeof message.type === "string" &&
    typeof message.surface === "string"
  );
}
