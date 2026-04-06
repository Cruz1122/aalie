import type { ContentModuleSummary, LocalProgressSnapshot } from "./types";

export const CONTENT_PROGRESS_STORAGE_KEY = "aalie.contentProgress.v1";
const CONTENT_PROGRESS_EVENT = "aalie-content-progress-updated";

interface ProgressStore {
  [spaceId: string]: LocalProgressSnapshot;
}

function isBrowser(): boolean {
  return typeof globalThis.window !== "undefined";
}

function readStore(): ProgressStore {
  if (!isBrowser()) {
    return {};
  }

  const raw = globalThis.window.localStorage.getItem(CONTENT_PROGRESS_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as ProgressStore;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: ProgressStore): void {
  if (!isBrowser()) {
    return;
  }

  globalThis.window.localStorage.setItem(
    CONTENT_PROGRESS_STORAGE_KEY,
    JSON.stringify(store),
  );
  globalThis.window.dispatchEvent(new CustomEvent(CONTENT_PROGRESS_EVENT));
}

export function getCompletedSectionIds(
  spaceId: string,
  moduleId: string,
): Set<string> {
  const store = readStore();
  return new Set(store[spaceId]?.[moduleId] ?? []);
}

export function markSectionCompleted(
  spaceId: string,
  moduleId: string,
  sectionId: string,
): void {
  const store = readStore();
  const current = new Set(store[spaceId]?.[moduleId] ?? []);
  if (current.has(sectionId)) {
    return;
  }

  current.add(sectionId);
  store[spaceId] = {
    ...(store[spaceId] ?? {}),
    [moduleId]: Array.from(current).sort(),
  };
  writeStore(store);
}

export function subscribeToProgressChanges(
  onChange: () => void,
): () => void {
  if (!isBrowser()) {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === CONTENT_PROGRESS_STORAGE_KEY) {
      onChange();
    }
  };

  globalThis.window.addEventListener("storage", handleStorage);
  globalThis.window.addEventListener(CONTENT_PROGRESS_EVENT, onChange);

  return () => {
    globalThis.window.removeEventListener("storage", handleStorage);
    globalThis.window.removeEventListener(CONTENT_PROGRESS_EVENT, onChange);
  };
}

export function computeModuleProgress(
  module: ContentModuleSummary,
  completedSectionIds: Iterable<string>,
): number {
  if (module.totalTrackableSections <= 0) {
    return 0;
  }

  const completed = new Set(completedSectionIds);
  const ratio =
    Math.min(completed.size, module.totalTrackableSections) /
    module.totalTrackableSections;
  return Math.round(ratio * 100);
}

export function computeSpaceProgress(
  spaceId: string,
  modules: ContentModuleSummary[],
): number {
  const totals = modules.reduce(
    (acc, module) => {
      acc.trackable += module.totalTrackableSections;
      acc.completed += getCompletedSectionIds(spaceId, module.moduleId).size;
      return acc;
    },
    { trackable: 0, completed: 0 },
  );

  if (totals.trackable <= 0) {
    return 0;
  }

  return Math.round((totals.completed / totals.trackable) * 100);
}
