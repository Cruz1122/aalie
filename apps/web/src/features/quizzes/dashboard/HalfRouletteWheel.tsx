"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import AALIEIcon from "@/components/AALIEIcon";
type RouletteOption = {
  kind: string;
  title: string;
  eyebrow: string;
  ctaLabel: string;
};

type HalfRouletteWheelProps = {
  options: RouletteOption[];
  handleCardClick: (kind: RouletteOption["kind"]) => void;
  clickHint: string;
  autoplayMs?: number;
};

type Point = {
  x: number;
  y: number;
};

const neutralFill = "rgba(30, 41, 59, 0.8)";
const hoverFill = "rgba(226, 232, 240, 0.28)";

function titleColorForKind(kind: string) {
  switch (kind) {
    case "start":
      return "text-cyan-300";
    case "average":
      return "text-violet-300";
    case "weakness":
      return "text-amber-300";
    case "recent":
      return "text-sky-300";
    case "strength":
      return "text-emerald-300";
    default:
      return "text-slate-200";
  }
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const circularIndex = (index: number, total: number) => {
  if (total <= 0) return 0;
  return ((index % total) + total) % total;
};

const polarToCartesian = (
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number,
): Point => {
  const angleRad = (angleDeg * Math.PI) / 180;

  return {
    x: cx + radius * Math.sin(angleRad),
    y: cy - radius * Math.cos(angleRad),
  };
};

const createDonutSegmentPath = ({
  cx,
  cy,
  outerRadius,
  innerRadius,
  startAngle,
  endAngle,
}: {
  cx: number;
  cy: number;
  outerRadius: number;
  innerRadius: number;
  startAngle: number;
  endAngle: number;
}) => {
  const outerStart = polarToCartesian(cx, cy, outerRadius, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
};

export function HalfRouletteWheel({
  options,
  handleCardClick,
  clickHint,
  autoplayMs = 2800,
}: HalfRouletteWheelProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const wheelThrottleRef = useRef(0);

  const [activeStep, setActiveStep] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const [wrapperWidth, setWrapperWidth] = useState(720);
  const [hoveredOptionKey, setHoveredOptionKey] = useState<string | null>(null);
  const wheelCaptureActiveRef = useRef(false);
  const wheelCaptureReleaseTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const pointerInsideKeyRef = useRef<string | null>(null);
  const hoverBlockedRef = useRef(false);
  const hoverDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rotationUnblockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const skipFirstRotationBlockRef = useRef(true);

  const HOVER_DEBOUNCE_MS = 90;
  const HOVER_LEAVE_DEBOUNCE_MS = 120;
  const ROTATION_BLOCK_MS = 750;

  const rouletteOptions = useMemo(() => options.slice(0, 5), [options]);
  const total = rouletteOptions.length;

  const radius = clamp(wrapperWidth * 0.43, 176, 320);
  const size = radius * 2;
  const center = radius;
  const innerRadius = clamp(radius * 0.18, 38, 72);
  const logoSize = Math.round(clamp(innerRadius * 0.52, 22, 48));
  const labelRadius = radius * 0.63;
  const viewportHeight = radius + 34;
  const segmentAngle = total > 0 ? 360 / total : 72;
  const rotation = activeStep * segmentAngle;
  const activeIndex = circularIndex(activeStep, total);

  const pauseBriefly = useCallback(() => {
    setIsInteracting(true);
    window.setTimeout(() => setIsInteracting(false), 1100);
  }, []);

  const goNext = useCallback(() => {
    if (!total) return;
    setActiveStep((current) => current + 1);
  }, [total]);

  const goPrev = useCallback(() => {
    if (!total) return;
    setActiveStep((current) => current - 1);
  }, [total]);

  const selectOption = useCallback(
    (_index: number, kind: RouletteOption["kind"]) => {
      pauseBriefly();
      handleCardClick(kind);
    },
    [handleCardClick, pauseBriefly],
  );

  const clearHoverDebounce = useCallback(() => {
    if (hoverDebounceRef.current) {
      clearTimeout(hoverDebounceRef.current);
      hoverDebounceRef.current = null;
    }
  }, []);

  const scheduleHoveredKey = useCallback(
    (key: string | null) => {
      clearHoverDebounce();
      if (key === null) {
        hoverDebounceRef.current = setTimeout(() => {
          hoverDebounceRef.current = null;
          if (pointerInsideKeyRef.current !== null) return;
          setHoveredOptionKey(null);
        }, HOVER_LEAVE_DEBOUNCE_MS);
        return;
      }
      if (hoverBlockedRef.current) return;
      hoverDebounceRef.current = setTimeout(() => {
        hoverDebounceRef.current = null;
        if (pointerInsideKeyRef.current !== key) return;
        setHoveredOptionKey(key);
      }, HOVER_DEBOUNCE_MS);
    },
    [clearHoverDebounce],
  );

  useEffect(() => {
    if (skipFirstRotationBlockRef.current) {
      skipFirstRotationBlockRef.current = false;
      return;
    }

    clearHoverDebounce();
    setHoveredOptionKey(null);
    hoverBlockedRef.current = true;

    if (rotationUnblockTimerRef.current) {
      clearTimeout(rotationUnblockTimerRef.current);
    }
    rotationUnblockTimerRef.current = setTimeout(() => {
      hoverBlockedRef.current = false;
      rotationUnblockTimerRef.current = null;
      const inside = pointerInsideKeyRef.current;
      if (inside) {
        setHoveredOptionKey(inside);
      }
    }, ROTATION_BLOCK_MS);

    return () => {
      if (rotationUnblockTimerRef.current) {
        clearTimeout(rotationUnblockTimerRef.current);
        rotationUnblockTimerRef.current = null;
      }
    };
  }, [activeStep, clearHoverDebounce]);

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;

    const observer = new ResizeObserver(([entry]) => {
      setWrapperWidth(entry.contentRect.width);
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (total <= 1 || isInteracting) return;

    const intervalId = window.setInterval(() => {
      setActiveStep((current) => current + 1);
    }, autoplayMs);

    return () => window.clearInterval(intervalId);
  }, [autoplayMs, isInteracting, total]);

  const activateWheelCapture = useCallback(() => {
    if (wheelCaptureReleaseTimeoutRef.current) {
      clearTimeout(wheelCaptureReleaseTimeoutRef.current);
      wheelCaptureReleaseTimeoutRef.current = null;
    }
    wheelCaptureActiveRef.current = true;
    setIsInteracting(true);
  }, []);

  const scheduleWheelCaptureRelease = useCallback(() => {
    if (wheelCaptureReleaseTimeoutRef.current) {
      clearTimeout(wheelCaptureReleaseTimeoutRef.current);
    }
    wheelCaptureReleaseTimeoutRef.current = setTimeout(() => {
      wheelCaptureActiveRef.current = false;
      setIsInteracting(false);
      wheelCaptureReleaseTimeoutRef.current = null;
    }, 180);
  }, []);

  useEffect(() => {
    return () => {
      if (wheelCaptureReleaseTimeoutRef.current) {
        clearTimeout(wheelCaptureReleaseTimeoutRef.current);
      }
      clearHoverDebounce();
      if (rotationUnblockTimerRef.current) {
        clearTimeout(rotationUnblockTimerRef.current);
      }
    };
  }, [clearHoverDebounce]);

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;

    const onWheelNative = (event: WheelEvent) => {
      if (!wheelCaptureActiveRef.current) return;
      if (total <= 1) return;

      const mainDelta =
        Math.abs(event.deltaY) >= Math.abs(event.deltaX)
          ? event.deltaY
          : event.deltaX;

      if (Math.abs(mainDelta) < 12) return;

      const now = Date.now();
      if (now - wheelThrottleRef.current < 360) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      wheelThrottleRef.current = now;
      pauseBriefly();

      if (mainDelta > 0) goNext();
      else goPrev();
    };

    node.addEventListener("wheel", onWheelNative, { passive: false });
    return () => node.removeEventListener("wheel", onWheelNative);
  }, [goNext, goPrev, pauseBriefly, total]);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setIsInteracting(true);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    if (!start) return;

    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    touchStartRef.current = null;

    if (Math.abs(dx) > 38 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goNext();
      else goPrev();
    }

    window.setTimeout(() => setIsInteracting(false), 900);
  };

  if (!total) return null;

  return (
    <section
      ref={wrapperRef}
      className="relative z-0 -mt-5 w-full select-none py-0 sm:-mt-7 lg:-mt-9"
      aria-roledescription="carousel"
      aria-label="Ruleta circular de accesos rapidos"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="relative mx-auto overflow-hidden"
        style={{
          width: "100%",
          height: viewportHeight,
          maxWidth: size + 32,
        }}
      >
        <svg
          className="pointer-events-auto absolute left-1/2 top-0 z-[1] drop-shadow-[0_28px_70px_rgba(15,23,42,0.48)]"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{
            marginLeft: -radius,
            marginTop: -radius,
          }}
          role="img"
          aria-label="Ruleta de opciones"
        >
          <defs>
            <radialGradient id="roulette-center-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(226,232,240,0.28)" />
              <stop offset="52%" stopColor="rgba(30,41,59,0.24)" />
              <stop offset="100%" stopColor="rgba(15,23,42,0.08)" />
            </radialGradient>
          </defs>

          <g
            className="transition-transform duration-700 ease-out"
            style={{
              transformBox: "fill-box",
              transformOrigin: "center",
              transform: `rotate(${rotation}deg)`,
            }}
          >
            {rouletteOptions.map((option, index) => {
              const optionKey = `${option.kind}-${option.title}`;
              const baseCenterAngle = 180 + index * segmentAngle;
              const startAngle = baseCenterAngle - segmentAngle / 2 + 1.2;
              const endAngle = baseCenterAngle + segmentAngle / 2 - 1.2;
              const isHovered = hoveredOptionKey === optionKey;
              return (
                <path
                  key={`segment-${optionKey}`}
                  d={createDonutSegmentPath({
                    cx: center,
                    cy: center,
                    outerRadius: radius - 5,
                    innerRadius,
                    startAngle,
                    endAngle,
                  })}
                  fill={isHovered ? hoverFill : neutralFill}
                  stroke="rgba(226,232,240,0.18)"
                  strokeWidth={1.4}
                  className="cursor-pointer transition-colors duration-300"
                  onClick={() => selectOption(index, option.kind)}
                  onMouseEnter={() => {
                    pointerInsideKeyRef.current = optionKey;
                    activateWheelCapture();
                    scheduleHoveredKey(optionKey);
                  }}
                  onMouseLeave={() => {
                    if (pointerInsideKeyRef.current === optionKey) {
                      pointerInsideKeyRef.current = null;
                    }
                    scheduleHoveredKey(null);
                    scheduleWheelCaptureRelease();
                  }}
                />
              );
            })}

            <circle
              cx={center}
              cy={center}
              r={radius - 4}
              fill="none"
              stroke="rgba(226,232,240,0.22)"
              strokeWidth={2}
            />

            <circle
              cx={center}
              cy={center}
              r={innerRadius}
              fill="rgba(15,23,42,0.22)"
              stroke="rgba(226,232,240,0.2)"
              strokeWidth={2}
            />
          </g>
        </svg>

        <div
          className="pointer-events-none absolute left-1/2 top-2 z-[1] -translate-x-1/2 rounded-full bg-slate-200/25 blur-md sm:top-3"
          style={{ width: logoSize * 1.15, height: logoSize * 1.15 }}
        />

        <div className="pointer-events-none absolute left-1/2 top-2 z-[1] -translate-x-1/2 sm:top-3">
          <AALIEIcon
            size={logoSize}
            className="text-slate-100 drop-shadow-[0_0_12px_rgba(226,232,240,0.45)]"
          />
        </div>

        {rouletteOptions.map((option, index) => {
          const optionKey = `${option.kind}-${option.title}`;
          const displayAngle = 180 + index * segmentAngle + rotation;
          const point = polarToCartesian(0, 0, labelRadius, displayAngle);
          const isHovered = hoveredOptionKey === optionKey;
          const isActive = activeIndex === index;
          const visibility = point.y >= -18 ? 1 : 0;

          return (
            <button
              key={`label-${optionKey}`}
              type="button"
              aria-label={`${isActive ? "Abrir" : "Centrar"} ${option.title}`}
              aria-current={isActive ? "true" : undefined}
              onClick={() => selectOption(index, option.kind)}
              onMouseEnter={() => {
                pointerInsideKeyRef.current = optionKey;
                activateWheelCapture();
                scheduleHoveredKey(optionKey);
              }}
              onMouseLeave={() => {
                if (pointerInsideKeyRef.current === optionKey) {
                  pointerInsideKeyRef.current = null;
                }
                scheduleHoveredKey(null);
                scheduleWheelCaptureRelease();
              }}
              onFocus={() => {
                pointerInsideKeyRef.current = optionKey;
                scheduleHoveredKey(optionKey);
              }}
              onBlur={() => {
                pointerInsideKeyRef.current = null;
                clearHoverDebounce();
                setHoveredOptionKey(null);
              }}
              className="absolute left-1/2 top-0 z-[2] flex -translate-x-1/2 flex-col items-center gap-1 text-center outline-none transition-all duration-700 ease-out focus-visible:ring-2 focus-visible:ring-slate-200/50"
              style={{
                transform: `translate(calc(-50% + ${point.x}px), ${point.y - 22}px) scale(0.9)`,
                opacity: visibility * 0.86,
                pointerEvents: visibility ? "auto" : "none",
              }}
            >
              <span
                className={`max-w-[10rem] text-xs font-semibold leading-tight transition-colors duration-200 sm:max-w-[12rem] sm:text-sm lg:max-w-[15rem] lg:text-base xl:text-lg ${
                  isHovered ? "text-slate-100" : "text-slate-300"
                }`}
              >
                {isHovered ? option.ctaLabel : option.eyebrow}
              </span>

              <span
                className={`line-clamp-2 max-w-[10.5rem] text-xs font-semibold leading-snug transition-all duration-200 sm:max-w-[13rem] sm:text-sm sm:leading-snug lg:max-w-[16rem] lg:text-base lg:leading-snug xl:text-lg ${
                  isHovered ? "text-slate-200" : titleColorForKind(option.kind)
                }`}
              >
                {isHovered ? clickHint : option.title}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
