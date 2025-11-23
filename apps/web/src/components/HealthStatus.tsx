// path: apps/web/src/components/HealthStatus.tsx
"use client";

import type { HealthResponse } from "@aa/types";
import { useEffect, useState } from "react";

type Props = { intervalMs?: number };

export default function HealthStatus({ intervalMs = 20_000 }: Readonly<Props>) {
  const [up, setUp] = useState<boolean | null>(null);
  const [msg, setMsg] = useState<string>("Comprobando…");

  async function check() {
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      // Aunque el proxy responda 502/503, intentamos leer el JSON
      const data = (await res.json().catch(() => ({}))) as Partial<HealthResponse> & {
        status?: string;
      };

      const isUp =
        data?.ok === true ||
        (typeof data?.status === "string" &&
          ["ok", "healthy", "up"].includes(data.status.toLowerCase()));

      setUp(isUp);
      setMsg(isUp ? "Backend conectado" : "Backend desconectado");
    } catch {
      setUp(false);
      setMsg("Backend desconectado");
    }
  }

  useEffect(() => {
    check();
    const t = setInterval(check, intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);

  const pillBase = "inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs";

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

  return (
    <span className={`${pillBase} ${style}`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${dot}`} />
      {msg}
    </span>
  );
}
