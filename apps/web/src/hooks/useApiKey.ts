// Hook para manejar API_KEY de Gemini en localStorage

const API_KEY_STORAGE_KEY = "gemini_api_key";
const API_KEY_REGEX = /^AIza[0-9A-Za-z_-]{35,40}$/;

/**
 * Valida el formato de una API_KEY de Gemini.
 * @param key - La API_KEY a validar
 * @returns true si el formato es válido, false en caso contrario
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
export function validateApiKey(key: string): boolean {
  if (!key || typeof key !== "string") {
    return false;
  }
  return API_KEY_REGEX.test(key.trim());
}

/**
 * Obtiene la API_KEY del localStorage.
 * @returns La API_KEY si existe y es válida, null en caso contrario
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
export function getApiKey(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    // Validar formato antes de retornar
    if (validateApiKey(stored)) {
      return stored.trim();
    }

    // Si no es válida, eliminarla del localStorage
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    return null;
  } catch (error) {
    console.error(
      "[useApiKey] Error obteniendo API_KEY del localStorage:",
      error,
    );
    return null;
  }
}

/**
 * Guarda la API_KEY en el localStorage.
 * @param key - La API_KEY a guardar
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
    localStorage.setItem(API_KEY_STORAGE_KEY, trimmed);
    // Disparar evento personalizado para notificar a otros componentes (misma ventana)
    if (typeof window !== "undefined") {
      globalThis.window.dispatchEvent(new Event("apiKeyChanged"));
    }
    return true;
  } catch (error) {
    console.error(
      "[useApiKey] Error guardando API_KEY en localStorage:",
      error,
    );
    return false;
  }
}

/**
 * Elimina la API_KEY del localStorage.
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
export function removeApiKey(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    // Disparar evento personalizado para notificar a otros componentes (misma ventana)
    if (typeof window !== "undefined") {
      globalThis.window.dispatchEvent(new Event("apiKeyChanged"));
    }
  } catch (error) {
    console.error(
      "[useApiKey] Error eliminando API_KEY del localStorage:",
      error,
    );
  }
}

/**
 * Verifica si el servidor tiene API_KEY disponible en variables de entorno.
 * @returns true si el servidor tiene API_KEY disponible, false en caso contrario
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
 * Obtiene el estado completo de API_KEY.
 * @returns Objeto con información sobre el estado de API_KEY en localStorage y servidor
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
export async function getApiKeyStatus(): Promise<{
  hasLocalStorage: boolean;
  hasServer: boolean;
  hasAny: boolean;
}> {
  const hasLocalStorage = getApiKey() !== null;
  const hasServer = await checkServerApiKey();

  return {
    hasLocalStorage,
    hasServer,
    hasAny: hasLocalStorage || hasServer,
  };
}
