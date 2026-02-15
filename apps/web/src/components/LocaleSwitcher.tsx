"use client";

import { CO, US } from "country-flag-icons/react/3x2";
import { useLocale } from "next-intl";
import { useTransition } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";

const locales = [
  { code: "es" as const, label: "ES", Flag: CO },
  { code: "en" as const, label: "EN", Flag: US },
];

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleChange = (newLocale: "es" | "en") => {
    if (newLocale === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Idioma">
      {locales.map(({ code, label, Flag }) => (
        <button
          key={code}
          type="button"
          onClick={() => handleChange(code)}
          disabled={isPending}
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
            locale === code
              ? "bg-white/20 text-white border border-white/30"
              : "text-slate-400 hover:text-white hover:bg-white/10 border border-transparent"
          } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
          aria-pressed={locale === code}
          aria-label={code === "es" ? "Español" : "English"}
        >
          <Flag className="w-5 shrink-0 rounded-sm overflow-hidden" title={code} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
