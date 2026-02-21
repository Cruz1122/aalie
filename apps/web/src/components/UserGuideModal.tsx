"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import AALIEIcon from "@/components/AALIEIcon";
import NavigationLink from "@/components/NavigationLink";
import {
  UserGuideBlock,
  UserGuideSection,
  ListBlock,
  ListItem,
  TableBlock,
  TableRow2,
  TableRow3,
  NoteBlock,
  SubsectionBlock,
  LinkBlock,
} from "@/types/user-guide";

interface UserGuideModalProps {
  open: boolean;
  onClose: () => void;
  section: UserGuideSection | null;
}

const NOTE_VARIANTS = {
  tip: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/50",
    icon: "lightbulb",
    iconColor: "text-blue-400",
    titleColor: "text-blue-300",
    textColor: "text-blue-200",
  },
  warning: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/50",
    icon: "info",
    iconColor: "text-yellow-400",
    titleColor: "text-yellow-300",
    textColor: "text-yellow-200",
  },
  info: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/50",
    icon: "info",
    iconColor: "text-blue-400",
    titleColor: "text-blue-300",
    textColor: "text-blue-200",
  },
  advantage: {
    bg: "bg-green-500/10",
    border: "border-green-500/50",
    icon: "check_circle",
    iconColor: "text-green-400",
    titleColor: "text-green-300",
    textColor: "text-green-200",
  },
  error: {
    bg: "bg-red-500/10",
    border: "border-red-500/50",
    icon: "error",
    iconColor: "text-red-400",
    titleColor: "text-red-300",
    textColor: "text-red-200",
  },
} as const;

const LIST_ICON_MAP = {
  check: { icon: "check_circle", color: "text-green-400" },
  error: { icon: "error", color: "text-red-400" },
  warning: { icon: "warning", color: "text-yellow-400" },
  info: { icon: "info", color: "text-blue-400" },
  bullet: { icon: null, color: "text-slate-400" },
  aalie: { icon: "aalie", color: "text-primary" },
} as const;

/**
 * Modal para contenido de la guía de usuario.
 * Renderiza bloques estructurados: párrafos, listas, código, tablas, notas, enlaces.
 * Author: @Cruz1122
 * Version: 0.1.0
 */
export default function UserGuideModal({
  open,
  onClose,
  section,
}: UserGuideModalProps) {
  const t = useTranslations("userGuide");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  if (!open || !section) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="absolute left-1/2 top-1/2 w-[min(90vw,800px)] max-h-[80vh] overflow-y-auto scrollbar-custom -translate-x-1/2 -translate-y-1/2 rounded-xl bg-slate-900 p-6 ring-1 ring-white/10 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <h3 className="text-lg font-semibold text-white">
            {t(section.titleKey)}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            aria-label={t("modalClose")}
          >
            ✕
          </button>
        </div>

        <div className="mt-6 space-y-6">
          {section.content.blocks.map((block, idx) => (
            <BlockRenderer key={idx} block={block} t={t} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BlockRenderer({
  block,
  t,
}: {
  block: UserGuideBlock;
  t: (key: string) => string;
}) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="text-sm text-slate-300 leading-relaxed">
          {block.titleKey && (
            <strong className="text-white">{t(block.titleKey)} </strong>
          )}
          {t(block.textKey)}
        </p>
      );
    case "list":
      return <ListRenderer block={block} t={t} />;
    case "code":
      return (
        <div className="bg-slate-800/70 border border-slate-600/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
          <pre className="text-green-300 m-0 whitespace-pre-wrap">{block.code}</pre>
        </div>
      );
    case "table":
      return <TableRenderer block={block} t={t} />;
    case "note":
      return <NoteRenderer block={block} t={t} />;
    case "subsection":
      return <SubsectionRenderer block={block} t={t} />;
    case "link":
      return <LinkRenderer block={block} t={t} />;
    default:
      return null;
  }
}

function ListRenderer({
  block,
  t,
}: { block: ListBlock; t: (key: string) => string }) {
  return (
    <ul className="list-none space-y-2 ml-2">
      {block.items.map((item, i) => (
        <ListItemRenderer
          key={i}
          item={item}
          t={t}
          index={block.numbered ? i + 1 : undefined}
        />
      ))}
    </ul>
  );
}

function ListItemRenderer({
  item,
  t,
  index,
}: {
  item: ListItem;
  t: (key: string) => string;
  index?: number;
}) {
  const iconConfig = item.icon ? LIST_ICON_MAP[item.icon] : null;

  const content = () => {
    if (item.titleKey && item.descKey) {
      return (
        <>
          <strong className="text-white">{t(item.titleKey)} </strong>
          {t(item.descKey)}
        </>
      );
    }
    if (item.titleKey && item.codeSnippet) {
      return (
        <>
          <strong className="text-white">{t(item.titleKey)} </strong>
          <code className="text-green-300 bg-slate-800/50 px-1.5 py-0.5 rounded ml-1">
            {item.codeSnippet}
          </code>
        </>
      );
    }
    if (item.titleKey) {
      return <strong className="text-white">{t(item.titleKey)}</strong>;
    }
    return item.textKey ? t(item.textKey) : null;
  };

  return (
    <li className="flex items-start gap-2 text-sm sm:text-base text-dark-text">
      {index !== undefined ? (
        <span className="flex-shrink-0 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
          {index}
        </span>
      ) : iconConfig?.icon === "aalie" ? (
        <AALIEIcon className={`${iconConfig.color} shrink-0 mt-0.5`} size={14} />
      ) : iconConfig?.icon ? (
        <span
          className={`material-symbols-outlined text-sm mt-0.5 shrink-0 ${iconConfig.color}`}
        >
          {iconConfig.icon}
        </span>
      ) : iconConfig ? (
        <span className={`text-xs mt-1 ${iconConfig.color}`}>•</span>
      ) : null}
      <span>{content()}</span>
    </li>
  );
}

function TableRenderer({
  block,
  t,
}: { block: TableBlock; t: (key: string) => string }) {
  const is3Col = block.headerKeys.length === 3;
  const thirdHeader = is3Col ? block.headerKeys[2] : null;

  return (
    <div className="overflow-x-auto">
      <div className="glass-secondary rounded-lg overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="text-left py-3 px-4 text-white font-semibold">
                {t(block.headerKeys[0])}
              </th>
              <th className="text-left py-3 px-4 text-white font-semibold">
                {t(block.headerKeys[1])}
              </th>
              {thirdHeader && (
                <th className="text-left py-3 px-4 text-white font-semibold">
                  {t(thirdHeader)}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="text-dark-text">
            {is3Col
              ? (block.rows as TableRow3[]).map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold">{t(row.typeKey)}</td>
                    <td className="py-3 px-4 font-mono">
                      <code className="text-cyan-300">{row.ops}</code>
                    </td>
                    <td className="py-3 px-4">{t(row.precKey)}</td>
                  </tr>
                ))
              : (block.rows as TableRow2[]).map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono bg-slate-800/50">
                      <code className="text-cyan-300">{row.key}</code>
                    </td>
                    <td className="py-3 px-4">{t(row.labelKey)}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NoteRenderer({
  block,
  t,
}: { block: NoteBlock; t: (key: string) => string }) {
  const style = NOTE_VARIANTS[block.variant];

  return (
    <div
      className={`${style.bg} border-l-4 ${style.border} rounded-r-lg p-4`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`material-symbols-outlined text-xl shrink-0 ${style.iconColor}`}
        >
          {style.icon}
        </span>
        <div>
          <p className={`${style.titleColor} text-sm font-semibold mb-1`}>
            {t(block.titleKey)}
          </p>
          {block.contentKey ? (
            <p className={`${style.textColor} text-sm`}>{t(block.contentKey)}</p>
          ) : block.preKey && block.linkKey && block.postKey && block.href ? (
            <p className={`${style.textColor} text-sm`}>
              {t(block.preKey)}
              <NavigationLink
                href={block.href}
                className="underline hover:opacity-80 font-medium"
              >
                {t(block.linkKey)}
              </NavigationLink>
              {t(block.postKey)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const SUBSECTION_VARIANTS = {
  default: "bg-slate-800/50 border border-white/10",
  success: "bg-green-500/10 border-l-4 border-green-500/50 rounded-r-lg",
  error: "bg-red-500/10 border-l-4 border-red-500/50 rounded-r-lg",
  info: "bg-blue-500/10 border-l-4 border-blue-500/50 rounded-r-lg",
} as const;

const SUBSECTION_ICON_COLORS = {
  default: "text-primary",
  success: "text-green-400",
  error: "text-red-400",
  info: "text-blue-400",
} as const;

const SUBSECTION_TITLE_COLORS = {
  default: "text-white",
  success: "text-green-300",
  error: "text-red-300",
  info: "text-blue-300",
} as const;

function SubsectionRenderer({
  block,
  t,
}: { block: SubsectionBlock; t: (key: string) => string }) {
  const variant = block.variant ?? "default";
  const style = SUBSECTION_VARIANTS[variant];
  const iconColor = SUBSECTION_ICON_COLORS[variant];
  const titleColor = SUBSECTION_TITLE_COLORS[variant];

  return (
    <div className={`p-4 rounded-lg ${style}`}>
      <div className="flex items-center gap-2 mb-3">
        {block.icon && (
          <span className={`material-symbols-outlined text-lg ${iconColor}`}>
            {block.icon}
          </span>
        )}
        <h4 className={`font-semibold text-sm sm:text-base ${titleColor}`}>
          {t(block.titleKey)}
        </h4>
      </div>
      <div className="space-y-3 text-dark-text">
        {block.blocks.map((b, idx) => (
          <BlockRenderer key={idx} block={b} t={t} />
        ))}
      </div>
    </div>
  );
}

function LinkRenderer({
  block,
  t,
}: { block: LinkBlock; t: (key: string) => string }) {
  return (
    <div className="bg-blue-500/10 border-l-4 border-blue-500/50 rounded-r-lg p-4">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-blue-400 text-xl shrink-0">
          arrow_forward
        </span>
        <div>
          {block.titleKey && (
            <p className="text-blue-300 text-sm font-semibold mb-1">
              {t(block.titleKey)}
            </p>
          )}
          <p className="text-blue-200 text-sm">
            {block.preKey && t(block.preKey)}
            <NavigationLink
              href={block.href}
              className="underline hover:text-blue-100 font-medium"
            >
              {t(block.linkKey)}
            </NavigationLink>
            {block.postKey && t(block.postKey)}
          </p>
        </div>
      </div>
    </div>
  );
}
