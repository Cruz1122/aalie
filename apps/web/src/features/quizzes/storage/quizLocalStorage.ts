export function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.warn(`Failed to parse local storage key: ${key}`, error);
    return fallback;
  }
}

export function safeSet<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to set local storage key: ${key}`, error);
  }
}
