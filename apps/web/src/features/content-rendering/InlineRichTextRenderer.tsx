"use client";

import type { RichText, TermIndexEntry } from "@aa/content-catalog/types";
import { useTranslations } from "next-intl";
import React, { useMemo } from "react";

import { Link } from "@/i18n/navigation";
import type { ContentTargetMap } from "@/lib/content/types";
import Formula from "./Formula";
import { MaterialIcon } from "./MaterialIcon";
import { TermInline } from "./TermInline";

interface TermDefinition {
  termId?: string;
  label: string;
  definition: string;
  primarySectionRef?: {
    moduleId: string;
    sectionId: string;
  };
}

interface InlineRichTextRendererProps {
  content?: RichText;
  targetMap: ContentTargetMap;
  termsById?: Record<string, TermDefinition>;
  termsIndex?: TermIndexEntry[];
  allowAutoLink?: boolean;
  className?: string;
}

const colorTokenClassNames: Record<string, string> = {
  primary: "text-sky-300",
  success: "text-emerald-300",
  warning: "text-amber-300",
  danger: "text-rose-300",
  muted: "text-slate-400",
};

function renderLink(text: string, href: string, key: string, title?: string) {
  const className =
    "text-sky-300 underline decoration-sky-500/60 underline-offset-2 transition-colors hover:text-sky-200";

  if (href.startsWith("http://") || href.startsWith("https://")) {
    return (
      <a
        key={key}
        href={href}
        title={title}
        target="_blank"
        rel="noreferrer"
        className={className}
      >
        {text}
      </a>
    );
  }

  return (
    <Link key={key} href={href} title={title} className={className}>
      {text}
    </Link>
  );
}

/**
 * Normalizes text by converting to lowercase and removing accents.
 */
function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function autoEnhanceTextWithTerms(
  text: string,
  termsIndex: TermIndexEntry[],
  targetMap: ContentTargetMap,
  shouldAutoLink: (termId: string) => boolean,
): (string | JSX.Element)[] {
  if (!text || termsIndex.length === 0) return [text];

  const patterns = termsIndex.flatMap((entry) =>
    entry.patterns.map((p) => ({
      pattern: p,
      entry,
    })),
  );
  patterns.sort((a, b) => b.pattern.length - a.pattern.length);

  let parts: (string | JSX.Element)[] = [text];

  for (const { pattern, entry } of patterns) {
    const newParts: (string | JSX.Element)[] = [];

    for (const part of parts) {
      if (typeof part !== "string") {
        newParts.push(part);
        continue;
      }

      const normalizedPart = normalizeForMatch(part);
      const index = normalizedPart.indexOf(pattern);

      if (
        index !== -1 &&
        shouldAutoLink(entry.termId)
      ) {
        const originalText = part.substring(index, index + pattern.length);
        const prefix = part.substring(0, index);
        const suffix = part.substring(index + pattern.length);

        if (prefix) newParts.push(prefix);

        const href = entry.primarySectionRef
          ? targetMap[`section:${entry.primarySectionRef.sectionId}`]?.href
          : undefined;

        newParts.push(
          <TermInline
            key={`${entry.termId}-${index}`}
            text={originalText}
            term={entry}
            href={href}
          />,
        );

        if (suffix) newParts.push(suffix);
      } else {
        newParts.push(part);
      }
    }
    parts = newParts;
  }

  return parts;
}

export function InlineRichTextRenderer({
  content = [],
  targetMap,
  termsById = {},
  termsIndex = [],
  allowAutoLink = false,
  className = "",
}: InlineRichTextRendererProps) {
  const t = useTranslations("contentUi");
  const explicitTermIds = useMemo(
    () =>
      new Set(
        content.flatMap((span) => (span.type === "term" ? [span.termRef] : [])),
      ),
    [content],
  );
  const autoLinkedOccurrences: Record<string, number> = {};

  const shouldAutoLink = (termId: string): boolean => {
    if (explicitTermIds.has(termId)) {
      return false;
    }

    const count = autoLinkedOccurrences[termId] || 0;
    if (count >= 1) {
      return false;
    }

    autoLinkedOccurrences[termId] = count + 1;
    return true;
  };

  return (
    <span className={className}>
      {content.map((span, index) => {
        const key = `${span.type}-${index}`;

        switch (span.type) {
          case "text": {
            if (allowAutoLink && termsIndex.length > 0) {
              return (
                <React.Fragment key={key}>
                  {autoEnhanceTextWithTerms(
                    span.text,
                    termsIndex,
                    targetMap,
                    shouldAutoLink,
                  )}
                </React.Fragment>
              );
            }
            return <span key={key}>{span.text}</span>;
          }
          case "strong":
            return (
              <strong key={key} className="font-semibold text-white">
                {span.text}
              </strong>
            );
          case "emphasis":
            return (
              <em key={key} className="italic text-slate-100">
                {span.text}
              </em>
            );
          case "underline":
            return (
              <span
                key={key}
                className="underline decoration-slate-400/70 underline-offset-2"
              >
                {span.text}
              </span>
            );
          case "highlight":
            return (
              <mark
                key={key}
                className="rounded bg-amber-300/15 px-1 py-0.5 text-amber-100"
              >
                {span.text}
              </mark>
            );
          case "inlineCode":
            return (
              <code
                key={key}
                className="rounded bg-slate-900/80 px-1.5 py-0.5 text-[0.92em] text-cyan-200"
              >
                {span.text}
              </code>
            );
          case "inlineMath":
            return (
              <Formula key={key} latex={span.latex} className="align-middle" />
            );
          case "link": {
            const href =
              span.target.kind === "external"
                ? span.target.ref
                : targetMap[`${span.target.kind}:${span.target.ref}`]?.href;

            if (href) {
              return renderLink(span.text, href, key);
            }

            const unavailable = t("brokenLinkTooltip");
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 text-slate-500"
                title={unavailable}
              >
                <MaterialIcon name="error_outline" className="text-slate-500" />
                <span>{span.text}</span>
              </span>
            );
          }
          case "term": {
            const term = termsById[span.termRef];

            const href = term?.primarySectionRef
              ? targetMap[`section:${term.primarySectionRef.sectionId}`]?.href
              : undefined;

            return (
              <TermInline
                key={key}
                text={span.text}
                term={term ?? { label: span.text, definition: span.text }}
                display={span.display}
                href={href}
              />
            );
          }
          case "tooltip":
            return (
              <span
                key={key}
                className="border-b border-dashed border-slate-400/70 text-slate-100"
                title={span.tooltip}
              >
                {span.text}
              </span>
            );
          case "color":
            return (
              <span
                key={key}
                className={
                  colorTokenClassNames[span.token] ?? colorTokenClassNames.muted
                }
              >
                {span.text}
              </span>
            );
          default:
            return null;
        }
      })}
    </span>
  );
}
