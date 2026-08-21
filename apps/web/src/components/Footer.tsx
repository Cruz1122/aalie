// path: apps/web/src/components/Footer.tsx
"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback, useRef } from "react";

import {
  getApiKey,
  setApiKey,
  validateApiKey,
  removeApiKey,
  getApiKeyStatus,
} from "@/hooks/useApiKey";
import { Link, usePathname } from "@/i18n/navigation";

import AuthControls from "./AuthControls";
import HealthStatus from "./HealthStatus";
import LocaleSwitcher from "./LocaleSwitcher";

type ApiKeyStatus = "none" | "invalid" | "valid" | "server" | "local";
type ExpandedSetting = "server" | null;

export default function Footer() {
  const pathname = usePathname();
  const footerRef = useRef<HTMLElement>(null);
  const t = useTranslations("footer");
  const tCommon = useTranslations("common");
  const tApiKey = useTranslations("footer.apiKey");
  const [apiKey, setApiKeyValue] = useState<string>("");
  const [status, setStatus] = useState<ApiKeyStatus>("none");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showInput, setShowInput] = useState<boolean>(false);
  const [hasServerApiKey, setHasServerApiKey] = useState<boolean>(false);
  const [hasLocalApiKey, setHasLocalApiKey] = useState<boolean>(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedSetting, setExpandedSetting] = useState<ExpandedSetting>(null);

  const openSettings = () => {
    setExpandedSetting(null);
    setShowSettings(true);
  };

  const closeSettings = () => {
    setShowSettings(false);
    setExpandedSetting(null);
  };

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

  // #region agent log
  useEffect(() => {
    if (!pathname?.includes("/analyzer")) return;

    const send = (
      hypothesisId: string,
      message: string,
      data: Record<string, unknown>,
    ) => {
      fetch(
        "http://127.0.0.1:7615/ingest/f8bbb90c-5683-490d-938c-8e69fd8876e2",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "6773fb",
          },
          body: JSON.stringify({
            sessionId: "6773fb",
            runId: "analyzer-footer-layout",
            hypothesisId,
            location: "Footer.tsx:layoutProbe",
            message,
            data,
            timestamp: Date.now(),
          }),
        },
      ).catch(() => {});
    };

    const probe = () => {
      const el = footerRef.current;
      if (!el) return;
      const fr = el.getBoundingClientRect();
      const vv = window.visualViewport;
      const main = document.querySelector("main");
      const mr = main?.getBoundingClientRect();
      const de = document.documentElement;
      const body = document.body;
      const m = main as HTMLElement | null;
      const rootChain: { tag: string; cls: string; h: number; minH: string }[] =
        [];
      let p: HTMLElement | null = el;
      for (let i = 0; i < 6 && p; i++) {
        const cs = window.getComputedStyle(p);
        rootChain.push({
          tag: p.tagName,
          cls: (p.className && String(p.className).slice(0, 120)) || "",
          h: p.offsetHeight,
          minH: cs.minHeight,
        });
        p = p.parentElement;
      }
      const ih = window.innerHeight;
      const gapBottom = ih - fr.bottom;
      const footerVerticalCenterRatio = (fr.top + fr.height / 2) / ih;
      send("H1-H5", "analyzer footer layout", {
        pathname,
        scrollY: window.scrollY,
        innerHeight: ih,
        visualViewportH: vv?.height ?? null,
        visualViewportOffsetTop: vv?.offsetTop ?? null,
        docClientH: de.clientHeight,
        docScrollH: de.scrollHeight,
        bodyOffsetH: body.offsetHeight,
        mainScrollH: m?.scrollHeight ?? null,
        mainClientH: m?.clientHeight ?? null,
        mainScrollTop: m?.scrollTop ?? null,
        footerTop: fr.top,
        footerBottom: fr.bottom,
        footerH: fr.height,
        gapBottomViewport: gapBottom,
        footerVerticalCenterRatio,
        mainBottom: mr?.bottom ?? null,
        gapMainToFooterTop: mr ? fr.top - mr.bottom : null,
        ancestorChain: rootChain,
      });
    };

    probe();
    const tmr = window.setTimeout(probe, 400);
    window.addEventListener("resize", probe);
    const vvRoot = window.visualViewport;
    vvRoot?.addEventListener("resize", probe);
    vvRoot?.addEventListener("scroll", probe);
    return () => {
      window.clearTimeout(tmr);
      window.removeEventListener("resize", probe);
      vvRoot?.removeEventListener("resize", probe);
      vvRoot?.removeEventListener("scroll", probe);
    };
  }, [pathname]);
  // #endregion

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
      return tApiKey("checking");
    }

    if (hasServerApiKey) {
      return tApiKey("inEnv");
    }

    if (hasLocalApiKey) {
      return tApiKey("inLocalStorage");
    }

    switch (status) {
      case "none":
        return tApiKey("notConfigured");
      case "invalid":
        return tApiKey("invalid");
      case "valid":
        return tApiKey("configured");
      default:
        return tApiKey("notConfigured");
    }
  };

  return (
    <footer
      ref={footerRef}
      className="glass-header relative z-40 min-h-[44px] shrink-0 px-3 py-3 sm:px-4 md:px-6"
    >
      {showInput ? (
        /* Input de API_KEY - reemplaza el contenido del footer cuando está activo */
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="flex h-5 flex-wrap items-center justify-center gap-1.5 text-xs w-full max-w-2xl min-w-0 px-2 sm:px-0">
            <input
              type="password"
              value={apiKey}
              onChange={handleChange}
              placeholder={tApiKey("placeholder")}
              className={`px-2 py-1 rounded-lg bg-white/5 border flex-1 min-w-[140px] sm:min-w-[180px] ${
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
              } transition-all flex-1 min-w-[180px] h-5`}
              autoFocus
            />
            {isEditing && (
              <button
                onClick={handleSave}
                disabled={status !== "valid"}
                className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all h-5 ${
                  status === "valid"
                    ? "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                    : "bg-slate-500/20 text-slate-500 border border-slate-500/30 cursor-not-allowed"
                }`}
              >
                {tCommon("save")}
              </button>
            )}
            {hasLocalApiKey && (
              <button
                onClick={handleClear}
                className="px-2 py-0.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all h-5"
              >
                {tCommon("delete")}
              </button>
            )}
            <button
              onClick={() => setShowInput(false)}
              className="px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-500/20 text-slate-400 border border-slate-500/30 hover:bg-slate-500/30 transition-all h-5"
            >
              {tCommon("close")}
            </button>
          </div>
          {apiKey && !validateApiKey(apiKey) && (
            <p className="text-red-400 text-[10px] text-center leading-tight mt-0.5">
              {tApiKey("invalidHint")}
            </p>
          )}
        </div>
      ) : (
        /* Enlaces y badges - contenido normal del footer */
        <div className="grid">
          <div
            className={`col-start-1 row-start-1 flex min-h-5 flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs leading-none transition-opacity duration-300 ${showSettings ? "pointer-events-none opacity-0" : "opacity-100"}`}
            aria-hidden={showSettings}
          >
            <Link
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs text-dark-text transition-colors hover:bg-white/10 hover:text-white"
              href="/privacy"
            >
              <span className="material-symbols-outlined footer-icon">
                policy
              </span>
              {t("privacyPolicy")}
            </Link>
            <Link
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs text-dark-text transition-colors hover:bg-white/10 hover:text-white"
              href="/terms"
            >
              <span className="material-symbols-outlined footer-icon">
                gavel
              </span>
              {t("termsOfService")}
            </Link>
            <button
              type="button"
              onClick={openSettings}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs text-dark-text transition-colors hover:bg-white/10 hover:text-white"
              aria-label={t("settings")}
            >
              <span className="material-symbols-outlined footer-icon">
                settings
              </span>
              <span>{t("settings")}</span>
            </button>
            <AuthControls variant="footer" />
          </div>
          <div
            className={`col-start-1 row-start-1 flex min-h-5 flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs leading-none transition-opacity duration-300 ${showSettings ? "opacity-100" : "pointer-events-none opacity-0"}`}
            aria-hidden={!showSettings}
          >
            <button
              type="button"
              onClick={closeSettings}
              className="inline-flex h-5 w-5 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={t("back")}
              title={t("back")}
            >
              <span className="material-symbols-outlined footer-icon">
                arrow_back
              </span>
            </button>
            <LocaleSwitcher showLabel />
            <button
              type="button"
              onClick={() => setShowInput(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs text-dark-text transition-colors hover:bg-white/10 hover:text-white"
              title={getStatusText()}
              aria-label={`${t("artificialIntelligence")}: ${getStatusText()}`}
            >
              <span className="material-symbols-outlined footer-icon">
                smart_toy
              </span>
              <span>{t("artificialIntelligence")}</span>
            </button>
            {expandedSetting === "server" ? (
              <HealthStatus
                icon="dns"
                onClick={() => setExpandedSetting(null)}
                className="w-[150px] justify-center"
              />
            ) : (
              <button
                type="button"
                onClick={() => setExpandedSetting("server")}
                className="inline-flex w-[150px] items-center justify-center gap-1.5 rounded-lg px-2 py-0.5 text-xs text-dark-text transition-colors hover:bg-white/10 hover:text-white"
                aria-label={t("serverStatus")}
              >
                <span className="material-symbols-outlined footer-icon">
                  dns
                </span>
                <span>{t("serverStatus")}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </footer>
  );
}
