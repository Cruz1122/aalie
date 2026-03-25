"use client";

import type { ParseResponse, Program } from "@aa/types";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useRef } from "react";

import {
  detectAndSelectMethod,
  type GetAnalysisMessage,
} from "@/app/[locale]/analyzer/analyzer-helpers";
import type { MethodType } from "@/components/MethodSelector";
import { useAnalysisProgressContext } from "@/contexts/AnalysisProgressContext";
import { useAnalysisProgress } from "@/hooks/useAnalysisProgress";
import { getApiKey } from "@/hooks/useApiKey";
import { useRouter } from "@/i18n/navigation";

type AlgorithmKind = "iterative" | "recursive" | "hybrid" | "unknown";

export interface RunAnalysisOptions {
  /** Si true, navega a /analyzer al completar (default: true para flujos que vienen de manual/examples/chat) */
  navigateToAnalyzer?: boolean;
}

/**
 * Hook para ejecutar el análisis de complejidad con loader unificado.
 * Usa AnalysisProgressContext para mostrar progreso persistente durante navegación.
 *
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 * Version: 0.1.0
 */
export function useRunAnalysis(options?: {
  blurScope?: "full" | "container";
  onParseFail?: () => void;
  onComplete?: () => void;
}) {
  const locale = useLocale();
  const router = useRouter();
  const tProgress = useTranslations("analyzer.progress");
  const tAlgorithmType = useTranslations("analyzer.algorithmType");
  const tMessages = useTranslations("analyzer.messages");
  const { animateProgress } = useAnalysisProgress();
  const {
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
    setMethodMetadata,
    methodSelectionPromiseRef,
    minProgressRef,
  } = useAnalysisProgressContext();

  const isRunningRef = useRef(false);

  const getMessage: GetAnalysisMessage = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      if (params) {
        return tProgress(key as "algorithmIdentified", params as { type: string });
      }
      return tProgress(key as "init");
    },
    [tProgress],
  );

  const formatAlgorithmKindLabel = useCallback(
    (value: AlgorithmKind): string =>
      tAlgorithmType(value === "unknown" ? "unknown" : value),
    [tAlgorithmType],
  );

  const runAnalysis = useCallback(
    async (
      sourceCode: string,
      runOptions?: RunAnalysisOptions,
    ): Promise<{
      ok: boolean;
      worst?: unknown;
      best?: unknown;
      avg?: unknown;
      errors?: Array<{ message: string; line?: number; column?: number }>;
    } | null> => {
      if (!sourceCode.trim()) return null;
      if (isRunningRef.current) return null;

      isRunningRef.current = true;
      const navigateToAnalyzer = runOptions?.navigateToAnalyzer ?? true;
      const blurScope = options?.blurScope ?? "full";

      show("analysis", { blurScope });
      updateProgress(0);
      updateMessage(getMessage("init"));
      setAlgorithmType(undefined);
      setError(null);

      const resetAndHide = () => {
        isRunningRef.current = false;
        hide();
      };

      const handleError = (errorMsg: string) => {
        setError(errorMsg);
        setTimeout(resetAndHide, 3000);
      };

      try {
        updateMessage(getMessage("parsing"));
        const parsePromise = fetch("/api/grammar/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source: sourceCode }),
        }).then((r) => r.json());

        const parseRes = (await animateProgress(
          0,
          20,
          800,
          updateProgress,
          parsePromise,
        )) as ParseResponse & { ok: boolean; ast?: Program; errors?: unknown[] };

        if (!parseRes.ok) {
          const msg =
            parseRes.errors
              ?.map(
                (e: { line?: number; column?: number; message?: string }) =>
                  tMessages("lineErrorFormat", {
                    line: e.line ?? 0,
                    column: e.column ?? 0,
                    message: e.message ?? "",
                  }),
              )
              .join("\n") || tMessages("parseError");
          handleError(`${tMessages("syntaxErrors")}\n${msg}`);
          options?.onParseFail?.();
          return null;
        }

        updateMessage(getMessage("classifying"));
        let kind: AlgorithmKind;
        try {
          const apiKey = getApiKey();
          const clsPromise = fetch("/api/llm/classify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              source: sourceCode,
              mode: "local",
              apiKey: apiKey || undefined,
            }),
          });

          const clsResponse = (await animateProgress(
            20,
            40,
            1200,
            updateProgress,
            clsPromise,
          )) as Response;

          if (clsResponse.ok) {
            const cls = (await clsResponse.json()) as {
              kind: string;
              method?: string;
              mode?: string;
            };
            kind = cls.kind as AlgorithmKind;
            setAlgorithmType(kind);
            updateMessage(
              tProgress("algorithmIdentified", {
                type: formatAlgorithmKindLabel(kind),
              }),
            );
          } else {
            throw new Error(`HTTP ${clsResponse.status}`);
          }
        } catch (error) {
          console.error("[useRunAnalysis] Classifier request failed:", error);
          handleError(tProgress("classifyError"));
          return null;
        }

        const isRecursive = kind === "recursive" || kind === "hybrid";
        let selectedMethod: MethodType | undefined | null = undefined;

        if (isRecursive) {
          updateMessage(getMessage("verifyingConditions"));
          await animateProgress(40, 50, 300, updateProgress);
          updateMessage(getMessage("extractingRecurrence"));
          await animateProgress(50, 65, 400, updateProgress);
          updateMessage(getMessage("normalizingRecurrence"));
          await animateProgress(65, 75, 300, updateProgress);
          updateMessage(getMessage("detectingMethod"));
          await animateProgress(75, 85, 500, updateProgress);

          const progressBeforeMethodSelection = 85;
          selectedMethod = await detectAndSelectMethod(
            sourceCode,
            kind,
            locale === "es" ? "es" : "en",
            progressBeforeMethodSelection,
            updateMessage,
            updateProgress,
            setApplicableMethods,
            setDefaultMethod,
            setMethodMetadata,
            setShowMethodSelector,
            minProgressRef,
            methodSelectionPromiseRef,
            animateProgress,
            getMessage,
          );
          if (selectedMethod === null) {
            updateMessage(getMessage("analysisStopped"));
            setTimeout(resetAndHide, 150);
            return null;
          }
        } else {
          updateMessage(getMessage("findingSums"));
          await animateProgress(40, 50, 200, updateProgress);
          updateMessage(getMessage("closingSums"));
          await animateProgress(50, 55, 200, updateProgress);
        }

        const apiKey = getApiKey();
        const analyzeBody: Record<string, unknown> = {
          source: sourceCode,
          mode: "all",
          avgModel: { mode: "uniform", predicates: {} },
          algorithm_kind: kind,
          locale: locale === "es" ? "es" : "en",
        };
        if (isRecursive && selectedMethod) {
          analyzeBody.preferred_method = selectedMethod;
        }
        if (apiKey) {
          analyzeBody.api_key = apiKey;
        }

        const analyzePromise = fetch("/api/analyze/open", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(analyzeBody),
        }).then((r) => r.json());

        const progressBeforeAnalysis = isRecursive ? 55 : 55;
        const analyzeRes = (await animateProgress(
          progressBeforeAnalysis,
          70,
          2000,
          updateProgress,
          analyzePromise,
        )) as {
          ok: boolean;
          worst?: unknown;
          best?: unknown;
          avg?: unknown;
          errors?: Array<{
            message: string;
            line?: number;
            column?: number;
          }>;
        };

        updateMessage(getMessage("generatingPolynomial"));
        await animateProgress(70, 80, 200, updateProgress);

        if (!analyzeRes.ok) {
          const errorMsg =
            analyzeRes.errors
              ?.map(
                (e: { message: string; line?: number; column?: number }) =>
                  e.message || `Error en línea ${e.line ?? "?"}`,
              )
              .join("\n") || "No se pudo analizar el algoritmo";
          handleError(errorMsg);
          return null;
        }

        updateMessage(getMessage("finalizing"));
        await animateProgress(80, 100, 200, updateProgress);

        if (typeof globalThis.window !== "undefined") {
          globalThis.window.sessionStorage.setItem(
            "analyzerCode",
            sourceCode,
          );
          globalThis.window.sessionStorage.setItem(
            "analyzerResults",
            JSON.stringify(analyzeRes),
          );
        }

        updateMessage(getMessage("complete"));
        setComplete();

        if (navigateToAnalyzer) {
          router.push("/analyzer");
        }

        isRunningRef.current = false;
        options?.onComplete?.();
        return analyzeRes;
      } catch (error) {
        console.error("[useRunAnalysis] Error inesperado:", error);
        const errorMsg =
          error instanceof Error
            ? error.message
            : "Error inesperado durante el análisis";
        handleError(errorMsg);
        return null;
      }
    },
    [
      animateProgress,
      formatAlgorithmKindLabel,
      getMessage,
      hide,
      locale,
      options,
      router,
      setAlgorithmType,
      setApplicableMethods,
      setComplete,
      setDefaultMethod,
      setError,
      setShowMethodSelector,
      show,
      setMethodMetadata,
      tMessages,
      tProgress,
      updateMessage,
      updateProgress,
      methodSelectionPromiseRef,
      minProgressRef,
    ],
  );

  return { runAnalysis };
}
