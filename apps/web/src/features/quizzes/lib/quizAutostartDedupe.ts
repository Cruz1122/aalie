const PREFIX = "aalie:quizDashAutostart:";

function buildKeyParts(options: {
  moduleId?: string;
  moduleTitle?: string;
  questionCount?: number;
  selectedTopicIds?: string[];
  selectedSkillIds?: string[];
}): string {
  const topics = (options.selectedTopicIds ?? []).join(",");
  const skills = (options.selectedSkillIds ?? []).join(",");
  return [
    options.moduleId ?? "",
    options.moduleTitle ?? "",
    String(options.questionCount ?? ""),
    topics,
    skills,
  ].join("|");
}

export function quizAutostartDedupeKey(options: {
  moduleId?: string;
  moduleTitle?: string;
  questionCount?: number;
  selectedTopicIds?: string[];
  selectedSkillIds?: string[];
}): string {
  return `${PREFIX}${buildKeyParts(options)}`;
}

/** Evita segundo auto-start (p. ej. React StrictMode remount) dentro de la ventana. */
export function shouldSkipQuizAutostart(
  key: string,
  windowMs: number = 2500,
): boolean {
  if (typeof window === "undefined") return false;
  const raw = window.sessionStorage.getItem(key);
  if (!raw) return false;
  const ts = Number.parseInt(raw, 10);
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts < windowMs;
}

export function markQuizAutostartAttempt(key: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(key, String(Date.now()));
}

export function clearQuizAutostartDedupeKeys(): void {
  if (typeof window === "undefined") return;
  for (let i = window.sessionStorage.length - 1; i >= 0; i -= 1) {
    const k = window.sessionStorage.key(i);
    if (k?.startsWith(PREFIX)) {
      window.sessionStorage.removeItem(k);
    }
  }
}
