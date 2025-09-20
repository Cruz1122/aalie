"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from "react";

import { LoaderConfig, GlobalLoaderContextType } from "@/types/loader";

const defaultConfig: LoaderConfig = {
  variant: "spinner",
  size: "md",
  message: "Cargando...",
  progress: 0,
  overlay: true,
  persistent: false,
};

const GlobalLoaderContext = createContext<GlobalLoaderContextType | undefined>(undefined);

interface GlobalLoaderProviderProps {
  children: ReactNode;
}

export const GlobalLoaderProvider: React.FC<GlobalLoaderProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<LoaderConfig>(defaultConfig);

  const show = useCallback((newConfig?: LoaderConfig) => {
    setConfig((prev) => ({ ...defaultConfig, ...prev, ...newConfig }));
    setIsLoading(true);
  }, []);

  const hide = useCallback(() => {
    setIsLoading(false);
  }, []);

  const updateProgress = useCallback((progress: number) => {
    setConfig((prev) => ({ ...prev, progress: Math.min(100, Math.max(0, progress)) }));
  }, []);

  const updateMessage = useCallback((message: string) => {
    setConfig((prev) => ({ ...prev, message }));
  }, []);

  const value: GlobalLoaderContextType = useMemo(
    () => ({
      isLoading,
      config,
      show,
      hide,
      updateProgress,
      updateMessage,
    }),
    [isLoading, config, show, hide, updateProgress, updateMessage],
  );

  return <GlobalLoaderContext.Provider value={value}>{children}</GlobalLoaderContext.Provider>;
};

export const useGlobalLoader = (): GlobalLoaderContextType => {
  const context = useContext(GlobalLoaderContext);
  if (!context) {
    throw new Error("useGlobalLoader must be used within a GlobalLoaderProvider");
  }
  return context;
};
