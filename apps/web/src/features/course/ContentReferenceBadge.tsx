"use client";

import type { ContentReference } from "@aa/content-catalog";

import { Link } from "@/i18n/navigation";
import type { ContentTargetMap } from "@/lib/content/types";

interface ContentReferenceBadgeProps {
  reference: ContentReference;
  targetMap: ContentTargetMap;
}

const toneClassNames: Record<string, string> = {
  default: "border-white/15 bg-white/5 text-slate-100",
  primary: "border-sky-400/30 bg-sky-500/10 text-sky-100",
  success: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
  warning: "border-amber-400/30 bg-amber-500/10 text-amber-100",
};

export function ContentReferenceBadge({
  reference,
  targetMap,
}: ContentReferenceBadgeProps) {
  const resolved =
    targetMap[`${reference.target.kind}:${reference.target.ref}`];
  const className =
    toneClassNames[reference.tone ?? "default"] ?? toneClassNames.default;

  if (!resolved) {
    return (
      <span className={`rounded-full border px-3 py-1 text-xs ${className}`}>
        {reference.label}
      </span>
    );
  }

  return (
    <Link
      href={resolved.href}
      className={`inline-flex rounded-full border px-3 py-1 text-xs transition-colors hover:bg-white/10 ${className}`}
      title={resolved.title}
    >
      {reference.label}
    </Link>
  );
}
