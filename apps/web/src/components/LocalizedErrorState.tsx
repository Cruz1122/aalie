"use client";

import { useLocale, useTranslations } from "next-intl";

import ErrorState from "./ErrorState";

type ErrorKind = "notFound" | "error";

export default function LocalizedErrorState({
  kind,
  reset,
}: {
  readonly kind: ErrorKind;
  readonly reset?: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("errorPages");
  const copy = t.raw(kind) as {
    eyebrow: string;
    title: string;
    homeLabel: string;
    retryLabel?: string;
  };

  return (
    <ErrorState
      icon={kind === "notFound" ? "search_off" : "error_outline"}
      accentClass={kind === "notFound" ? "text-cyan-300" : "text-rose-300"}
      copy={copy}
      homeHref={`/${locale}`}
      onRetry={reset}
    />
  );
}
