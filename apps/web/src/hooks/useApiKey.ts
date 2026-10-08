import {
  getDefaultLlmModel,
  type ApiKeyProvider,
  validateLlmModelId,
} from "@/lib/llm-model-catalog";

export const API_KEY_STORAGE_KEY = "llm_api_key";
export const LEGACY_API_KEY_STORAGE_KEY = "gemini_api_key";
export const MODEL_PREFERENCES_STORAGE_KEY = "llm_model_preferences";

const GEMINI_API_KEY_REGEX = /^AIza[0-9A-Za-z_-]{35,40}$/;
const OPENAI_API_KEY_REGEX = /^sk-(?:proj-)?[A-Za-z0-9_-]{20,}$/;
const ANTHROPIC_API_KEY_REGEX = /^sk-ant-[A-Za-z0-9_-]{20,}$/;
const OPENROUTER_API_KEY_REGEX = /^sk-or-v1-[A-Za-z0-9_-]{20,}$/;
const XAI_API_KEY_REGEX = /^xai-[A-Za-z0-9_-]{20,}$/;
const GROQ_API_KEY_REGEX = /^gsk_[A-Za-z0-9_-]{20,}$/;

function readStoredApiKey(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const sessionKey =
      sessionStorage.getItem(API_KEY_STORAGE_KEY) ??
      sessionStorage.getItem(LEGACY_API_KEY_STORAGE_KEY);
    if (sessionKey) return sessionKey;

    // Migrate keys written by older versions without leaving the secret in
    // persistent storage after the first read.
    const legacyKey =
      localStorage.getItem(API_KEY_STORAGE_KEY) ??
      localStorage.getItem(LEGACY_API_KEY_STORAGE_KEY);
    if (legacyKey) {
      sessionStorage.setItem(API_KEY_STORAGE_KEY, legacyKey);
      localStorage.removeItem(API_KEY_STORAGE_KEY);
      localStorage.removeItem(LEGACY_API_KEY_STORAGE_KEY);
    }
    return legacyKey;
  } catch {
    return null;
  }
}

function readModelPreferences(): Partial<Record<ApiKeyProvider, string>> {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(MODEL_PREFERENCES_STORAGE_KEY);
    if (!raw) return {};

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([, value]) => typeof value === "string" && validateLlmModelId(value),
      ),
    ) as Partial<Record<ApiKeyProvider, string>>;
  } catch {
    return {};
  }
}

function writeModelPreferences(
  preferences: Partial<Record<ApiKeyProvider, string>>,
): boolean {
  if (typeof window === "undefined") return false;

  try {
    localStorage.setItem(
      MODEL_PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences),
    );
    globalThis.window.dispatchEvent(new Event("apiKeyChanged"));
    return true;
  } catch (error) {
    console.error("[useApiKey] Error guardando preferencias LLM:", error);
    return false;
  }
}

/** Detects the provider from a key prefix without sending the key anywhere. */
export function detectApiKeyProvider(key: string): ApiKeyProvider | null {
  const normalized = key.trim();
  if (GEMINI_API_KEY_REGEX.test(normalized)) return "gemini";
  if (OPENROUTER_API_KEY_REGEX.test(normalized)) return "openrouter";
  if (ANTHROPIC_API_KEY_REGEX.test(normalized)) return "anthropic";
  if (XAI_API_KEY_REGEX.test(normalized)) return "xai";
  if (GROQ_API_KEY_REGEX.test(normalized)) return "groq";
  if (OPENAI_API_KEY_REGEX.test(normalized)) return "openai";
  return null;
}

/**
 * Valida el formato de una API key reconocida por un proveedor compatible.
 * @param key - La API_KEY a validar
 * @returns true si el formato es válido, false en caso contrario
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
export function validateApiKey(key: string): boolean {
  if (!key || typeof key !== "string") {
    return false;
  }
  return detectApiKeyProvider(key) !== null;
}

/**
 * Obtiene la API key del almacenamiento de sesión del navegador.
 * @returns La API key si existe y es válida, null en caso contrario
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
export function getApiKey(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = readStoredApiKey();
    if (!stored) {
      return null;
    }

    // Validar formato antes de retornar.
    if (validateApiKey(stored)) {
      return stored.trim();
    }

    // Si no es válida, eliminarla de ambos almacenes.
    sessionStorage.removeItem(API_KEY_STORAGE_KEY);
    sessionStorage.removeItem(LEGACY_API_KEY_STORAGE_KEY);
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    localStorage.removeItem(LEGACY_API_KEY_STORAGE_KEY);
    return null;
  } catch (error) {
    console.error(
      "[useApiKey] Error obteniendo API_KEY del almacenamiento de sesión:",
      error,
    );
    return null;
  }
}

/**
 * Guarda la API key en el almacenamiento de sesión del navegador.
 * @param key - La API key a guardar
 * @returns true si se guardó correctamente, false si la clave es inválida
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
export function setApiKey(key: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const trimmed = key.trim();

  if (!validateApiKey(trimmed)) {
    return false;
  }

  try {
    sessionStorage.setItem(API_KEY_STORAGE_KEY, trimmed);
    sessionStorage.removeItem(LEGACY_API_KEY_STORAGE_KEY);
    // Remove secrets left by versions that persisted them across sessions.
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    localStorage.removeItem(LEGACY_API_KEY_STORAGE_KEY);
    // Disparar evento personalizado para notificar a otros componentes (misma ventana)
    if (typeof window !== "undefined") {
      globalThis.window.dispatchEvent(new Event("apiKeyChanged"));
    }
    return true;
  } catch (error) {
    console.error(
      "[useApiKey] Error guardando API_KEY en el almacenamiento de sesión:",
      error,
    );
    return false;
  }
}

/**
 * Elimina la API key del almacenamiento del navegador.
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
export function removeApiKey(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    sessionStorage.removeItem(API_KEY_STORAGE_KEY);
    sessionStorage.removeItem(LEGACY_API_KEY_STORAGE_KEY);
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    localStorage.removeItem(LEGACY_API_KEY_STORAGE_KEY);
    localStorage.removeItem(MODEL_PREFERENCES_STORAGE_KEY);
    // Disparar evento personalizado para notificar a otros componentes (misma ventana)
    if (typeof window !== "undefined") {
      globalThis.window.dispatchEvent(new Event("apiKeyChanged"));
    }
  } catch (error) {
    console.error(
      "[useApiKey] Error eliminando API_KEY del almacenamiento del navegador:",
      error,
    );
  }
}

export function getSelectedApiModel(
  provider: ApiKeyProvider | null = detectApiKeyProvider(getApiKey() ?? ""),
): string | null {
  if (!provider) return null;

  const preferences = readModelPreferences();
  return preferences[provider] ?? getDefaultLlmModel(provider);
}

export function setSelectedApiModel(
  model: string,
  provider: ApiKeyProvider | null = detectApiKeyProvider(getApiKey() ?? ""),
): boolean {
  const normalized = model.trim();
  if (!provider || !validateLlmModelId(normalized)) return false;

  const preferences = readModelPreferences();
  preferences[provider] = normalized;
  return writeModelPreferences(preferences);
}

/**
 * Verifica si el servidor tiene una API key disponible en variables de entorno.
 * @returns true si el servidor tiene una API key disponible, false en caso contrario
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
async function checkServerApiKey(): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const response = await fetch("/api/llm/status", {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data?.ok === true && data?.status?.apiKey?.serverAvailable === true;
  } catch (error) {
    console.error("[useApiKey] Error verificando API_KEY del servidor:", error);
    return false;
  }
}

/**
 * Obtiene el estado completo de la API key.
 * @returns Objeto con información sobre la key del cliente y el servidor
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
export async function getApiKeyStatus(): Promise<{
  hasLocalStorage: boolean;
  hasServer: boolean;
  hasAny: boolean;
  provider: ApiKeyProvider | null;
  model: string | null;
}> {
  const hasLocalStorage = getApiKey() !== null;
  const hasServer = await checkServerApiKey();
  const provider = detectApiKeyProvider(getApiKey() ?? "");

  return {
    hasLocalStorage,
    hasServer,
    hasAny: hasLocalStorage || hasServer,
    provider,
    model: getSelectedApiModel(provider),
  };
}
