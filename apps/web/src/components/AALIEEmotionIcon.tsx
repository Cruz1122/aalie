import type { CSSProperties } from "react";

export type AALIEEmotionIconName =
  | "happy"
  | "satisfied"
  | "worried"
  | "thinking"
  | "focused"
  | "alert"
  | "curious"
  | "determined"
  | "neutral"
  | "confused";

interface AALIEEmotionIconProps {
  readonly name: AALIEEmotionIconName;
  readonly className?: string;
  readonly size?: number;
}

export default function AALIEEmotionIcon({
  name,
  className = "",
  size = 24,
}: Readonly<AALIEEmotionIconProps>) {
  const iconUrl = `/emotions/aalie-${name}.svg`;
  const maskStyles = {
    maskImage: `url(${iconUrl})`,
    maskRepeat: "no-repeat",
    maskPosition: "center",
    maskSize: "contain",
    WebkitMaskImage: `url(${iconUrl})`,
    WebkitMaskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    WebkitMaskSize: "contain",
  } satisfies CSSProperties;

  return (
    <span
      className={`inline-block shrink-0 bg-current align-middle ${className}`}
      style={{
        width: size,
        height: size,
        ...maskStyles,
      }}
      aria-hidden
    />
  );
}
