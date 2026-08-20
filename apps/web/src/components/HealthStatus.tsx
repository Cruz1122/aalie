// path: apps/web/src/components/HealthStatus.tsx
"use client";

import type { HealthResponse } from "@aa/types";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

type Props = {
  intervalMs?: number;
  icon?: string;
  onClick?: () => void;
  className?: string;
};

export default function HealthStatus({
  intervalMs = 20_000,
  icon,
  onClick,
  className = "",
}: Readonly<Props>) {
  const t = useTranslations("footer.backendStatus");
  const [up, setUp] = useState<boolean | null>(null);

  const check = useCallback(async () => {
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const data = (await res
        .json()
        .catch(() => ({}))) as Partial<HealthResponse> & {
        status?: string;
      };

      const isUp =
        data?.ok === true ||
        (typeof data?.status === "string" &&
          ["ok", "healthy", "up"].includes(data.status.toLowerCase()));

      setUp(isUp);
    } catch {
      setUp(false);
    }
  }, []);

  const msg = up === null ? t("connecting") : up ? t("online") : t("offline");

  useEffect(() => {
    check();
    const id = setInterval(check, intervalMs);
    return () => clearInterval(id);
  }, [check, intervalMs]);

  const pillBase =
    "inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[12px] font-normal leading-none";

  let style: string;
  let dot: string;

  if (up === null) {
    style = "bg-blue-900/40 text-blue-300";
    dot = "bg-blue-400";
  } else if (up) {
    style = "bg-green-900/40 text-green-300";
    dot = "bg-green-400";
  } else {
    style = "bg-red-900/40 text-red-300";
    dot = "bg-red-400";
  }

  const content = (
    <>
      {icon && <span className="material-symbols-outlined footer-icon">{icon}</span>}
      {!icon && <span className={`inline-block h-1.5 w-1.5 rounded-full ${dot}`} />}
      {msg}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${pillBase} ${style} cursor-pointer ${className}`}
        aria-label={msg}
      >
        {content}
      </button>
    );
  }

  return <span className={`${pillBase} ${style} ${className}`}>{content}</span>;
}
