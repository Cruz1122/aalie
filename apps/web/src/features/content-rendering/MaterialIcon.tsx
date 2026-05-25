"use client";

import type { PedagogyIconName } from "@aa/content-catalog";
import type { CSSProperties, HTMLAttributes } from "react";

const ICON_TEXT: Record<PedagogyIconName, string> = {
  school: "school",
  science: "science",
  analytics: "analytics",
  lightbulb: "lightbulb",
  warning: "warning",
  error_outline: "error_outline",
  arrow_forward: "arrow_forward",
};

type MaterialIconFontSize = "inherit" | "small" | "medium" | "large";

export interface MaterialIconProps extends HTMLAttributes<HTMLSpanElement> {
  name: PedagogyIconName;
  fontSize?: MaterialIconFontSize;
}

export function MaterialIcon({
  name,
  fontSize = "small",
  className,
  style,
  ...rest
}: MaterialIconProps) {
  const iconText = ICON_TEXT[name] ?? ICON_TEXT.warning;
  const resolvedFontSize: CSSProperties["fontSize"] =
    fontSize === "inherit"
      ? "inherit"
      : fontSize === "small"
        ? 20
        : fontSize === "large"
          ? 32
          : 24;

  return (
    <span
      aria-hidden="true"
      className={["material-symbols-outlined", className]
        .filter(Boolean)
        .join(" ")}
      style={{ fontSize: resolvedFontSize, lineHeight: 1, ...style }}
      {...rest}
    >
      {iconText}
    </span>
  );
}
