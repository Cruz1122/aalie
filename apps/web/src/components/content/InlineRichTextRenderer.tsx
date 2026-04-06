"use client";

import type { RichText } from "@aa/content-catalog";
import { useTranslations } from "next-intl";

import { MaterialIcon } from "@/components/content/MaterialIcon";
import Formula from "@/components/Formula";
import { Link } from "@/i18n/navigation";
import type { ContentTargetMap } from "@/lib/content/types";

interface TermDefinition {
  label: string;
  definition: string;
}

interface InlineRichTextRendererProps {
  content: RichText;
  targetMap: ContentTargetMap;
  termsById?: Record<string, TermDefinition>;
  className?: string;
}

const colorTokenClassNames: Record<string, string> = {
  primary: "text-sky-300",
  success: "text-sky-300",
  warning: "text-amber-300",
  danger: "text-rose-300",
  muted: "text-slate-400",
};

function renderLink(text: string, href: string, key: string, title?: string) {
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return (
      <a
        key={key}
        href={href}
        title={title}
        target="_blank"
        rel="noreferrer"
        className="text-sky-300 underline decoration-sky-500/60 underline-offset-2 transition-colors hover:text-sky-200"
      >
        {text}
      </a>
    );
  }

  return (
    <Link
      key={key}
      href={href}
      title={title}
      className="text-sky-300 underline decoration-sky-500/60 underline-offset-2 transition-colors hover:text-sky-200"
    >
      {text}
    </Link>
  );
}

export function InlineRichTextRenderer({
  content,
  targetMap,
  termsById = {},
  className = "",
}: InlineRichTextRendererProps) {
  const t = useTranslations("contentUi");

  return (
    <span className={className}>
      {content.map((span, index) => {
        const key = `${span.type}-${index}`;

        switch (span.type) {
          case "text":
            return <span key={key}>{span.text}</span>;
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

            if (span.target.kind === "external") {
              return <span key={key}>{span.text}</span>;
            }

            const unavailable = t("brokenLinkTooltip");
            return (
              <span
                key={key}
                className="inline-flex max-w-full items-center gap-1 text-slate-500 pointer-events-none"
                aria-disabled="true"
                title={unavailable}
              >
                <MaterialIcon
                  name="error_outline"
                  fontSize="small"
                  className="shrink-0 text-slate-500"
                  aria-hidden
                />
                <span className="min-w-0">{span.text}</span>
              </span>
            );
          }
          case "term": {
            const term = termsById[span.termRef];
            const className =
              span.display === "highlight"
                ? "rounded bg-sky-400/10 px-1 py-0.5 text-sky-100"
                : "border-b border-dashed border-sky-400/60 text-sky-100";
            return (
              <span
                key={key}
                className={className}
                title={term?.definition ?? term?.label}
              >
                {span.text}
              </span>
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
