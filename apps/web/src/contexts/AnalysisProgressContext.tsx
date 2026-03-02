"use client";

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { AAProgressLoader } from "@/components/AAProgressLoader";
import type {
  AlgorithmType,
  BlurScope,
  ProgressLoaderMode,
} from "@/components/AAProgressLoader";
import MethodSelector, { MethodType } from "@/components/MethodSelector";

export interface AnalysisProgressState {
  visible: boolean;
  mode: ProgressLoaderMode;
  progress: number;
  message: string;
  algorithmType?: AlgorithmType;
  isComplete: boolean;
  error: string | null;
  blurScope: BlurScope;
  showMethodSelector: boolean;
  applicableMethods: MethodType[];
  defaultMethod: MethodType;
}

export interface AnalysisProgressContextType {
  state: AnalysisProgressState;
  show: (mode: ProgressLoaderMode, options?: { blurScope?: BlurScope }) => void;
  hide: () => void;
  updateProgress: (n: number | ((prev: number) => number)) => void;
  updateMessage: (s: string) => void;
  setAlgorithmType: (t?: AlgorithmType) => void;
  setComplete: () => void;
  setError: (s: string | null) => void;
  setShowMethodSelector: (show: boolean) => void;
  setApplicableMethods: (methods: MethodType[]) => void;
  setDefaultMethod: (method: MethodType) => void;
  methodSelectionPromiseRef: React.MutableRefObject<{
    resolve: (method: MethodType) => void;
    reject: () => void;
  } | null>;
  minProgressRef: React.MutableRefObject<number>;
}

const initialState: AnalysisProgressState = {
  visible: false,
  mode: "analysis",
  progress: 0,
  message: "",
  algorithmType: undefined,
  isComplete: false,
  error: null,
  blurScope: "full",
  showMethodSelector: false,
  applicableMethods: [],
  defaultMethod: "master",
};

const AnalysisProgressContext =
  createContext<AnalysisProgressContextType | undefined>(undefined);

interface AnalysisProgressProviderProps {
  children: ReactNode;
}

/**
 * Proveedor de estado para el loader de análisis/comparación.
 * Renderiza AAProgressLoader en el layout para que persista durante la navegación.
 *
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 * Version: 0.1.0
 */
export const AnalysisProgressProvider: React.FC<
  AnalysisProgressProviderProps
> = ({ children }) => {
  const [state, setState] = useState<AnalysisProgressState>(initialState);
  const methodSelectionPromiseRef = useRef<{
    resolve: (method: MethodType) => void;
    reject: () => void;
  } | null>(null);
  const minProgressRef = useRef<number>(0);

  const show = useCallback(
    (mode: ProgressLoaderMode, options?: { blurScope?: BlurScope }) => {
      setState({
        ...initialState,
        visible: true,
        mode,
        blurScope: options?.blurScope ?? "full",
      });
    },
    [],
  );

  const hide = useCallback(() => {
    setState(initialState);
  }, []);

  const updateProgress = useCallback(
    (n: number | ((prev: number) => number)) => {
      setState((prev) => {
        const next =
          typeof n === "function" ? n(prev.progress) : n;
        return {
          ...prev,
          progress: Math.min(100, Math.max(0, next)),
        };
      });
    },
    [],
  );

  const updateMessage = useCallback((s: string) => {
    setState((prev) => ({ ...prev, message: s }));
  }, []);

  const setAlgorithmType = useCallback((t?: AlgorithmType) => {
    setState((prev) => ({ ...prev, algorithmType: t }));
  }, []);

  const setComplete = useCallback(() => {
    setState((prev) => ({ ...prev, isComplete: true }));
  }, []);

  const setError = useCallback((s: string | null) => {
    setState((prev) => ({ ...prev, error: s, isComplete: false }));
  }, []);

  const setShowMethodSelector = useCallback((show: boolean) => {
    setState((prev) => ({ ...prev, showMethodSelector: show }));
  }, []);

  const setApplicableMethods = useCallback((methods: MethodType[]) => {
    setState((prev) => ({ ...prev, applicableMethods: methods }));
  }, []);

  const setDefaultMethod = useCallback((method: MethodType) => {
    setState((prev) => ({ ...prev, defaultMethod: method }));
  }, []);

  const handleClose = useCallback(() => {
    setState(initialState);
  }, []);

  const handleMethodSelect = useCallback((method: MethodType) => {
    if (methodSelectionPromiseRef.current) {
      methodSelectionPromiseRef.current.resolve(method);
      methodSelectionPromiseRef.current = null;
    }
    setState((prev) => ({ ...prev, showMethodSelector: false }));
  }, []);

  const handleMethodCancel = useCallback(() => {
    if (methodSelectionPromiseRef.current) {
      methodSelectionPromiseRef.current.resolve(state.defaultMethod);
      methodSelectionPromiseRef.current = null;
    }
    setState((prev) => ({ ...prev, showMethodSelector: false }));
  }, [state.defaultMethod]);

  // Mantener progreso mínimo cuando el selector está visible
  useEffect(() => {
    if (state.showMethodSelector && minProgressRef.current > 0) {
      setState((prev) => ({
        ...prev,
        progress: Math.max(prev.progress, minProgressRef.current),
      }));
      const intervalId = setInterval(() => {
        setState((prev) => {
          const min = minProgressRef.current;
          if (prev.progress < min) {
            return { ...prev, progress: min };
          }
          return prev;
        });
      }, 100);
      return () => clearInterval(intervalId);
    }
  }, [state.showMethodSelector]);

  const value: AnalysisProgressContextType = useMemo(
    () => ({
      state,
      show,
      hide,
      updateProgress,
      updateMessage,
      setAlgorithmType,
      setComplete,
      setError,
      setShowMethodSelector,
      setApplicableMethods,
      setDefaultMethod,
      methodSelectionPromiseRef,
      minProgressRef,
    }),
    [
      state,
      show,
      hide,
      updateProgress,
      updateMessage,
      setAlgorithmType,
      setComplete,
      setError,
      setShowMethodSelector,
      setApplicableMethods,
      setDefaultMethod,
    ],
  );

  return (
    <AnalysisProgressContext.Provider value={value}>
      {children}
      {state.visible && (
        <AAProgressLoader
          mode={state.mode}
          progress={state.progress}
          message={state.message}
          algorithmType={state.algorithmType}
          isComplete={state.isComplete}
          error={state.error}
          onClose={handleClose}
          blurScope={state.blurScope}
        />
      )}
      {state.showMethodSelector &&
        state.applicableMethods.length > 0 &&
        state.visible && (
          <MethodSelector
            applicableMethods={state.applicableMethods}
            defaultMethod={state.defaultMethod}
            onSelect={handleMethodSelect}
            onCancel={handleMethodCancel}
          />
        )}
    </AnalysisProgressContext.Provider>
  );
};

export function useAnalysisProgressContext(): AnalysisProgressContextType {
  const context = useContext(AnalysisProgressContext);
  if (!context) {
    throw new Error(
      "useAnalysisProgressContext must be used within an AnalysisProgressProvider",
    );
  }
  return context;
}
