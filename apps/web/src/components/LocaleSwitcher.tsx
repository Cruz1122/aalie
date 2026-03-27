"use client";

/**
 * Selector de idioma tipo dropdown. Muestra un badge con el idioma actual;
 * al hacer clic se despliegan los demás idiomas.
 * Usa Portal para evitar que quede detrás de cards u otros elementos.
 *
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
import { CO, US } from "country-flag-icons/react/3x2";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";

import { usePathname, useRouter } from "@/i18n/navigation";

const locales = [
  { code: "es" as const, label: "ES", Flag: CO },
  { code: "en" as const, label: "EN", Flag: US },
];

const pillBase =
  "inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs";
const badgeStyle = "bg-slate-900/40 text-slate-300";
const badgeDot = "bg-slate-400";

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);
  const t = useTranslations("footer");

  const updatePosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setPosition({
        top: rect.top,
        left: rect.left,
      });
    }
  };

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inTrigger = triggerRef.current?.contains(target);
      const inPanel = panelRef.current?.contains(target);
      if (!inTrigger && !inPanel) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleChange = (newLocale: "es" | "en") => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
      setIsOpen(false);
    });
  };

  const current = locales.find((l) => l.code === locale) ?? locales[0];

  const dropdownPanel = isOpen && (
    <ul
      ref={panelRef}
      className="fixed py-1 rounded-lg bg-slate-900/98 border border-white/10 shadow-xl backdrop-blur-sm z-[99999] min-w-[72px]"
      style={{
        bottom: `calc(100vh - ${position.top}px + 4px)`,
        left: position.left,
      }}
      role="listbox"
    >
      {locales.map(({ code, label, Flag }) => (
        <li key={code} role="option" aria-selected={locale === code}>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleChange(code);
            }}
            disabled={isPending}
            className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-xs transition-colors rounded-md ${
              locale === code
                ? "bg-slate-900/40 text-slate-200"
                : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
            } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${locale === code ? "bg-slate-400" : "bg-slate-500"}`}
            />
            <Flag className="h-3 w-4 shrink-0 rounded-sm overflow-hidden" />
            {label}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="relative" role="group" aria-label={t("languageLabel")}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (!isOpen) updatePosition();
          setIsOpen(!isOpen);
        }}
        disabled={isPending}
        className={`${pillBase} ${badgeStyle} cursor-pointer hover:opacity-80 transition-opacity ${
          isPending ? "opacity-50 cursor-not-allowed" : ""
        }`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t("languageLabel")}
      >
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${badgeDot}`} />
        <current.Flag className="h-3 w-4 shrink-0 rounded-sm overflow-hidden" />
        <span>{current.label}</span>
      </button>

      {typeof document !== "undefined" &&
        isOpen &&
        createPortal(dropdownPanel, document.body)}
    </div>
  );
}
