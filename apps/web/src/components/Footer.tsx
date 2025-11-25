// path: apps/web/src/components/Footer.tsx
"use client";

import { useState, useEffect, useCallback } from "react";

import {
  getApiKey,
  setApiKey,
  validateApiKey,
  removeApiKey,
  getApiKeyStatus,
} from "@/hooks/useApiKey";

import HealthStatus from "./HealthStatus";

type ApiKeyStatus = "none" | "invalid" | "valid" | "server" | "local";

export default function Footer() {
  const [apiKey, setApiKeyValue] = useState<string>("");
  const [status, setStatus] = useState<ApiKeyStatus>("none");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showInput, setShowInput] = useState<boolean>(false);
  const [hasServerApiKey, setHasServerApiKey] = useState<boolean>(false);
  const [hasLocalApiKey, setHasLocalApiKey] = useState<boolean>(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(true);

  // Función para actualizar el estado de API_KEY (memoizada sin dependencias problemáticas)
  const updateApiKeyStatus = useCallback(async () => {
    // Verificar localStorage primero (sin hacer request)
    const stored = getApiKey();
    const hasLocal = stored !== null;
    setHasLocalApiKey(hasLocal);

    if (stored) {
      setApiKeyValue(stored);
    }

    // Solo verificar servidor si no hay en localStorage
    setIsCheckingStatus(true);
    try {
      if (!hasLocal) {
        // Solo hacer request si no hay en localStorage
        const status = await getApiKeyStatus();
        setHasServerApiKey(status.hasServer);

        // Determinar el estado principal (solo si no se está editando)
        setStatus((prevStatus) => {
          // No actualizar si se está editando o mostrando el input
          if (isEditing || showInput) {
            return prevStatus;
          }

          if (status.hasServer) {
            return "server";
          } else {
            return "none";
          }
        });
      } else {
        // Si hay en localStorage, no hacer request al servidor
        setHasServerApiKey(false);
        setStatus((prevStatus) => {
          if (isEditing || showInput) {
            return prevStatus;
          }
          return "valid";
        });
      }
    } catch (error) {
      console.error("[Footer] Error verificando estado de API_KEY:", error);
      setHasServerApiKey(false);
      if (!isEditing && !showInput) {
        setStatus(hasLocal ? "valid" : "none");
      }
    } finally {
      setIsCheckingStatus(false);
    }
  }, [isEditing, showInput]);

  // Cargar estado de API_KEY al montar el componente
  useEffect(() => {
    updateApiKeyStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo al montar

  // Escuchar cambios en localStorage (cuando se guarda API_KEY desde otros componentes)
  useEffect(() => {
    // Usar una función estable que no cause re-renders innecesarios
    const handleStorageChange = (e: StorageEvent) => {
      // Verificar si el cambio es en la API_KEY
      if (e.key === "gemini_api_key" || e.key === null) {
        // Solo actualizar si no se está editando
        if (!isEditing && !showInput) {
          updateApiKeyStatus();
        }
      }
    };

    // Escuchar evento storage (funciona entre tabs/ventanas)
    globalThis.window.addEventListener("storage", handleStorageChange);

    // También escuchar cambios en la misma ventana usando un evento personalizado
    const handleApiKeyChange = () => {
      // Solo actualizar si no se está editando en el Footer
      if (!showInput && !isEditing) {
        updateApiKeyStatus();
      }
    };

    // Crear un evento personalizado para cambios en la misma ventana
    globalThis.window.addEventListener("apiKeyChanged", handleApiKeyChange);

    return () => {
      globalThis.window.removeEventListener("storage", handleStorageChange);
      globalThis.window.removeEventListener(
        "apiKeyChanged",
        handleApiKeyChange,
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Sin dependencias para evitar re-crear listeners

  // Actualizar cuando se cierra el input (solo cuando se cierra, no cuando se abre)
  useEffect(() => {
    if (!showInput && !isEditing) {
      // Usar un pequeño delay para evitar múltiples actualizaciones
      const timeoutId = setTimeout(() => {
        updateApiKeyStatus();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInput]); // Solo cuando showInput cambia

  // Validar en tiempo real mientras se escribe
  useEffect(() => {
    if (isEditing && showInput) {
      if (!apiKey) {
        setStatus("none");
        return;
      }

      if (validateApiKey(apiKey)) {
        setStatus("valid");
      } else {
        setStatus("invalid");
      }
    }
  }, [apiKey, isEditing, showInput]);

  const handleSave = () => {
    if (validateApiKey(apiKey)) {
      const success = setApiKey(apiKey);
      if (success) {
        setIsEditing(false);
        setShowInput(false);
        // Actualizar estado local sin hacer request adicional
        // El evento 'apiKeyChanged' disparará la actualización
        const stored = getApiKey();
        setHasLocalApiKey(stored !== null);
        if (stored) {
          setApiKeyValue(stored);
          setStatus("valid");
        }
        // No hacer request adicional a getApiKeyStatus aquí
      }
    }
  };

  const handleClear = () => {
    removeApiKey();
    setApiKeyValue("");
    setIsEditing(false);
    setShowInput(false);
    // Actualizar estado local sin hacer request adicional
    setHasLocalApiKey(false);
    setStatus("none");
    // El evento 'apiKeyChanged' ya se disparó, no necesitamos otro request
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKeyValue(e.target.value);
    setIsEditing(true);
  };

  const getStatusText = () => {
    if (isCheckingStatus) {
      return "Verificando API Key...";
    }

    if (hasServerApiKey) {
      return "API Key en variables de entorno";
    }

    if (hasLocalApiKey) {
      return "API Key en el almacenamiento local";
    }

    switch (status) {
      case "none":
        return "API Key no configurada";
      case "invalid":
        return "API Key inválida";
      case "valid":
        return "API Key configurada";
      default:
        return "API Key no configurada";
    }
  };

  const getStatusStyle = () => {
    if (isCheckingStatus) {
      return "bg-blue-900/40 text-blue-300";
    }

    if (hasServerApiKey) {
      return "bg-green-900/40 text-green-300";
    }

    if (hasLocalApiKey) {
      return "bg-green-900/40 text-green-300";
    }

    switch (status) {
      case "none":
        return "bg-slate-900/40 text-slate-300";
      case "invalid":
        return "bg-red-900/40 text-red-300";
      case "valid":
        return "bg-green-900/40 text-green-300";
      default:
        return "bg-slate-900/40 text-slate-300";
    }
  };

  const getStatusDot = () => {
    if (isCheckingStatus) {
      return "bg-blue-400";
    }

    if (hasServerApiKey || hasLocalApiKey) {
      return "bg-green-400";
    }

    switch (status) {
      case "none":
        return "bg-slate-400";
      case "invalid":
        return "bg-red-400";
      case "valid":
        return "bg-green-400";
      default:
        return "bg-slate-400";
    }
  };

  return (
    <footer className="glass-header px-6 py-3">
      {showInput ? (
        /* Input de API_KEY - reemplaza el contenido del footer cuando está activo */
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs w-full max-w-2xl">
            <input
              type="password"
              value={apiKey}
              onChange={handleChange}
              placeholder="API Key de Gemini"
              className={`px-2 py-1 rounded-lg bg-white/5 border ${
                status === "invalid"
                  ? "border-red-500/50 focus:border-red-500"
                  : status === "valid"
                    ? "border-green-500/50 focus:border-green-500"
                    : "border-slate-600/50 focus:border-slate-500"
              } text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1 ${
                status === "invalid"
                  ? "focus:ring-red-500/50"
                  : status === "valid"
                    ? "focus:ring-green-500/50"
                    : "focus:ring-slate-500/50"
              } transition-all flex-1 min-w-[180px] h-6`}
              autoFocus
            />
            {isEditing && (
              <button
                onClick={handleSave}
                disabled={status !== "valid"}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-all h-6 ${
                  status === "valid"
                    ? "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                    : "bg-slate-500/20 text-slate-500 border border-slate-500/30 cursor-not-allowed"
                }`}
              >
                Guardar
              </button>
            )}
            {hasLocalApiKey && (
              <button
                onClick={handleClear}
                className="px-2 py-1 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all h-6"
              >
                Eliminar
              </button>
            )}
            <button
              onClick={() => setShowInput(false)}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-500/20 text-slate-400 border border-slate-500/30 hover:bg-slate-500/30 transition-all h-6"
            >
              Cerrar
            </button>
          </div>
          {apiKey && !validateApiKey(apiKey) && (
            <p className="text-red-400 text-[10px] text-center leading-tight mt-0.5">
              API Key inválida
            </p>
          )}
          {!hasServerApiKey && !hasLocalApiKey && (
            <p className="text-slate-400 text-[10px] text-center max-w-xl leading-tight mt-0.5">
              Ingresa tu API Key de Gemini para habilitar la simplificación de
              expresiones matemáticas. Puedes obtenerla en{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Google AI Studio
              </a>
              .
            </p>
          )}
        </div>
      ) : (
        /* Enlaces y badges - contenido normal del footer */
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
          <a
            className="text-dark-text hover:text-white transition-colors"
            href="https://ingenierias.ucaldas.edu.co"
          >
            Universidad de Caldas - 2025
          </a>
          <span className="text-slate-600">•</span>
          <a
            className="text-dark-text hover:text-white transition-colors"
            href="/privacy"
          >
            Política de Privacidad
          </a>
          <span className="text-slate-600">•</span>
          <button
            onClick={() => setShowInput(true)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs cursor-pointer hover:opacity-80 transition-opacity ${getStatusStyle()}`}
          >
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${getStatusDot()}`}
            />
            {getStatusText()}
          </button>
          <span className="text-slate-600">•</span>
          <HealthStatus />
        </div>
      )}
    </footer>
  );
}
