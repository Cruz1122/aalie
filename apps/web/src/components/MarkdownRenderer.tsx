/**
 * Componente para renderizar contenido Markdown con soporte para:
 * - Sintaxis resaltada (rehype-highlight)
 * - Fórmulas matemáticas LaTeX (rehype-katex, remark-math)
 * - Tablas GitHub Flavored Markdown (remark-gfm)
 * - Botones para copiar y analizar código
 *
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
import { useTranslations } from "next-intl";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import {
  resolveInlineCodeMathMode,
  resolveInlineMarkdownMathMode,
  type InlineCodeMathMode,
  type InlineMarkdownMathMode,
} from "@/lib/inline-math";

import Formula from "./Formula";
import InlineCodeMath from "./InlineCodeMath";
import "../styles/highlight.css";

/**
 * Propiedades del componente MarkdownRenderer.
 */
interface MarkdownRendererProps {
  /** Contenido Markdown a renderizar */
  readonly content: string;
  /** Clases CSS adicionales para el contenedor */
  readonly className?: string;
  /** Callback opcional para analizar código cuando se detecta pseudocódigo */
  readonly onAnalyzeCode?: (code: string) => void;
  /** Si true, no renderiza líneas horizontales (---, ***) como saltos de página */
  readonly hideHorizontalRules?: boolean;
  /** Clases opcionales para código inline (`code`) */
  readonly inlineCodeClassName?: string;
  /** Política para backticks que contienen notación matemática */
  readonly inlineCodeMathMode?: InlineCodeMathMode;
  /** Política para matemática inline de Markdown (`$...$`) */
  readonly inlineMathMode?: InlineMarkdownMathMode;
}

interface CopyButtonProps {
  readonly code: string;
}

interface AnalyzeButtonProps {
  readonly code: string;
  readonly onAnalyze?: (code: string) => void;
}

/**
 * Componente de botón para copiar código al portapapeles.
 *
 * @param code - Código a copiar
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const CopyButton = ({ code }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);
  const t = useTranslations("common");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error copying:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="w-8 h-8 shrink-0 border border-transparent bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors duration-200 text-xs font-semibold inline-flex items-center justify-center active:scale-95"
      title={copied ? t("codeCopied") : t("copyCode")}
    >
      {copied ? (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      )}
    </button>
  );
};

/**
 * Componente de botón para analizar código detectado como pseudocódigo.
 * Solo se muestra si el código contiene palabras clave de pseudocódigo.
 *
 * @param code - Código a analizar
 * @param onAnalyze - Callback para ejecutar el análisis
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const AnalyzeButton = ({ code, onAnalyze }: AnalyzeButtonProps) => {
  if (!onAnalyze) return null;

  // Detectar si es código de pseudocódigo (contiene palabras clave comunes)
  const isPseudocode = /BEGIN|END|FOR|WHILE|IF|THEN|ELSE|RETURN|CALL/i.test(
    code,
  );

  if (!isPseudocode) return null;

  return (
    <button
      onClick={() => onAnalyze(code)}
      className="px-3 py-1.5 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 text-emerald-200 rounded-lg transition-all duration-200 text-xs font-semibold flex items-center gap-1 hover:from-green-500/30 hover:to-emerald-500/30 hover:text-emerald-100 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-green-400/40 active:scale-95"
      title="Analizar complejidad"
    >
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
      </svg>
      <span className="text-[10px]">Analizar</span>
    </button>
  );
};

// Componentes personalizados para evitar warnings de ESLint
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomH1 = (props: any) => (
  <h1
    className="text-sm font-bold text-white mb-1.5 mt-3 first:mt-0 break-words min-w-0 max-w-full"
    {...props}
  >
    {props.children}
  </h1>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomH2 = (props: any) => (
  <h2
    className="text-xs font-semibold text-white mb-1.5 mt-2 first:mt-0 break-words min-w-0 max-w-full"
    {...props}
  >
    {props.children}
  </h2>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomH3 = (props: any) => (
  <h3
    className="text-[11px] font-semibold text-white mb-1 mt-1.5 first:mt-0 break-words min-w-0 max-w-full"
    {...props}
  >
    {props.children}
  </h3>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomP = (props: any) => (
  <p
    className="text-white text-[11px] leading-relaxed mb-1.5 last:mb-0 break-words min-w-0 max-w-full"
    {...props}
  >
    {props.children}
  </p>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomUl = (props: any) => (
  <ul
    className="text-white text-[11px] leading-relaxed mb-1.5 ml-3 list-disc break-words min-w-0 max-w-full"
    {...props}
  >
    {props.children}
  </ul>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomOl = (props: any) => (
  <ol
    className="text-white text-[11px] leading-relaxed mb-1.5 ml-3 list-decimal break-words min-w-0 max-w-full"
    {...props}
  >
    {props.children}
  </ol>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomLi = (props: any) => (
  <li
    className="text-white text-[11px] leading-relaxed mb-0.5 break-words min-w-0 max-w-full"
    {...props}
  >
    {props.children}
  </li>
);

function extractInlineCodeText(children: React.ReactNode): string {
  if (typeof children === "string") {
    return children;
  }

  if (typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map((child) => extractInlineCodeText(child)).join("");
  }

  if (React.isValidElement(children)) {
    return extractInlineCodeText(children.props.children);
  }

  return "";
}

function hasClassToken(value: unknown, token: string): boolean {
  return (
    typeof value === "string" &&
    value.split(/\s+/).some((entry) => entry.trim() === token)
  );
}

const createCustomCode = (
  inlineCodeClassName?: string,
  inlineCodeMathMode: InlineCodeMathMode = "auto",
  inlineMathMode: InlineMarkdownMathMode = "auto",
) => {
  const inlineClass =
    inlineCodeClassName ||
    "bg-slate-700 text-cyan-300 px-1 py-0.5 rounded text-[10px] font-mono";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomCodeComponent = (props: any) => {
    const rawInlineText = extractInlineCodeText(props.children);
    if (hasClassToken(props.className, "math-inline")) {
      const mathRender = resolveInlineMarkdownMathMode(
        rawInlineText,
        inlineMathMode,
      );

      if (mathRender.renderAs === "latex") {
        return (
          <Formula latex={mathRender.normalized} className="align-middle" />
        );
      }

      return (
        <InlineCodeMath
          value={mathRender.normalized}
          asCode
          className={`${inlineClass} inline-flex max-w-full items-center overflow-x-auto align-middle leading-none not-italic`}
        />
      );
    }

    const isInline =
      typeof props.inline === "boolean" ? props.inline : !props.className;
    if (isInline) {
      const mathRender = resolveInlineCodeMathMode(
        rawInlineText,
        inlineCodeMathMode,
      );

      if (mathRender.renderAs === "hybrid" && mathRender.normalized) {
        return (
          <InlineCodeMath
            value={mathRender.normalized}
            asCode
            className={`${inlineClass} inline-flex max-w-full items-center overflow-x-auto align-middle leading-none not-italic`}
          />
        );
      }

      return (
        <code className={inlineClass} {...props}>
          {props.children}
        </code>
      );
    }
    return (
      <code className={props.className} {...props}>
        {props.children}
      </code>
    );
  };
  CustomCodeComponent.displayName = "CustomCode";
  return CustomCodeComponent;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomPre = (props: any) => {
  // Función más robusta para extraer el contenido del código
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extractTextContent = (node: any): string => {
    if (typeof node === "string") {
      return node;
    }

    if (typeof node === "number") {
      return String(node);
    }

    if (Array.isArray(node)) {
      return node.map(extractTextContent).join("");
    }

    if (node && typeof node === "object") {
      // Si tiene children, extraer de ahí
      if (node.children) {
        return extractTextContent(node.children);
      }
      // Si tiene props.children
      if (node.props?.children) {
        return extractTextContent(node.props.children);
      }
    }

    return "";
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extractCodeClassName = (node: any): string | null => {
    if (!node) {
      return null;
    }

    if (Array.isArray(node)) {
      for (const child of node) {
        const childClassName = extractCodeClassName(child);
        if (childClassName) {
          return childClassName;
        }
      }
      return null;
    }

    if (React.isValidElement(node)) {
      const element = node as React.ReactElement<{
        className?: string;
        children?: React.ReactNode;
      }>;

      if (typeof element.props.className === "string") {
        return element.props.className;
      }
      return extractCodeClassName(element.props.children);
    }

    if (typeof node === "object") {
      if (typeof node.className === "string") {
        return node.className;
      }
      if ("props" in node && node.props) {
        return extractCodeClassName(node.props);
      }
      if ("children" in node) {
        return extractCodeClassName(node.children);
      }
    }

    return null;
  };

  const codeContent = extractTextContent(props.children);
  const codeClassName = extractCodeClassName(props.children);
  // Obtener onAnalyzeCode del contexto (se pasa desde MarkdownRenderer)
  const onAnalyzeCode = (props as { onAnalyzeCode?: (code: string) => void })
    .onAnalyzeCode;

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [hasVerticalScroll, setHasVerticalScroll] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      const next = el.scrollHeight > el.clientHeight + 1;
      setHasVerticalScroll(next);
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [codeContent]);

  const isPseudocode = useMemo(() => {
    return /BEGIN|END|FOR|WHILE|IF|THEN|ELSE|RETURN|CALL/i.test(codeContent);
  }, [codeContent]);

  const renderedCode = useMemo(() => {
    if (!isPseudocode) return codeContent;

    const keywordRe =
      /\b(BEGIN|END|IF|THEN|ELSE|WHILE|FOR|TO|DO|REPEAT|UNTIL|RETURN|CALL|MOD|DIV|AND|OR|print)\b/g;
    const numberRe = /\b\d+(\.\d+)?\b/g;
    const stringRe = /"([^"\\]|\\.)*"/g;

    const renderTokens = (text: string, lineKey: string) => {
      const tokens: Array<{
        kind: "keyword" | "number" | "string" | "plain";
        value: string;
      }> = [];

      const patterns = [
        { kind: "string" as const, re: stringRe },
        { kind: "keyword" as const, re: keywordRe },
        { kind: "number" as const, re: numberRe },
      ];

      let i = 0;
      while (i < text.length) {
        let best:
          | {
              kind: (typeof patterns)[number]["kind"];
              start: number;
              end: number;
              value: string;
            }
          | undefined;

        for (const p of patterns) {
          p.re.lastIndex = i;
          const m = p.re.exec(text);
          if (!m) continue;
          const start = m.index;
          const end = start + m[0].length;
          if (start < i) continue;
          if (!best || start < best.start) {
            best = { kind: p.kind, start, end, value: m[0] };
          }
        }

        if (!best) {
          tokens.push({ kind: "plain", value: text.slice(i) });
          break;
        }

        if (best.start > i) {
          tokens.push({ kind: "plain", value: text.slice(i, best.start) });
        }
        tokens.push({ kind: best.kind, value: best.value });
        i = best.end;
      }

      return tokens.map((t, idx) => {
        const key = `${lineKey}_t${idx}`;
        switch (t.kind) {
          case "keyword":
            return (
              <span key={key} className="text-fuchsia-300 font-semibold">
                {t.value}
              </span>
            );
          case "string":
            return (
              <span key={key} className="text-emerald-300">
                {t.value}
              </span>
            );
          case "number":
            return (
              <span key={key} className="text-amber-300">
                {t.value}
              </span>
            );
          default:
            return <span key={key}>{t.value}</span>;
        }
      });
    };

    return codeContent.split("\n").map((line, lineIdx) => {
      const lineKey = `l${lineIdx}`;
      const commentStart = line.indexOf("//");
      const before = commentStart >= 0 ? line.slice(0, commentStart) : line;
      const comment = commentStart >= 0 ? line.slice(commentStart) : "";

      return (
        <div key={lineKey} className="whitespace-pre">
          {renderTokens(before, lineKey)}
          {comment ? (
            <span className="text-slate-400/70">{comment}</span>
          ) : null}
        </div>
      );
    });
  }, [codeContent, isPseudocode]);

  if (hasClassToken(codeClassName, "math-display")) {
    return (
      <div className="my-1 max-w-full overflow-x-auto">
        <Formula latex={codeContent} display className="min-w-max" />
      </div>
    );
  }

  return (
    <div className="relative group w-full max-w-full min-w-0">
      <div
        ref={scrollRef}
        className="bg-slate-900/80 border border-cyan-500/20 rounded-md p-3 max-h-[320px] overflow-y-auto overflow-x-auto mb-1.5 max-w-[min(100%,420px)] min-w-0"
      >
        <pre className="text-slate-100 text-[11px] font-mono whitespace-pre leading-relaxed m-0 [tab-size:4]">
          {renderedCode}
        </pre>
      </div>
      {codeContent?.trim() && (
        <div
          className={`absolute top-2 ${hasVerticalScroll ? "right-5" : "right-2"} flex items-center gap-1.5 opacity-30 hover:opacity-100 transition-opacity`}
        >
          <AnalyzeButton code={codeContent} onAnalyze={onAnalyzeCode} />
          <CopyButton code={codeContent} />
        </div>
      )}
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomBlockquote = (props: any) => (
  <blockquote
    className="border-l-2 border-blue-500 pl-2 py-1 bg-blue-500/10 rounded-r mb-1.5 break-words min-w-0 max-w-full"
    {...props}
  >
    {props.children}
  </blockquote>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomStrong = (props: any) => (
  <strong className="font-semibold text-white" {...props}>
    {props.children}
  </strong>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomEm = (props: any) => (
  <em className="italic text-slate-300" {...props}>
    {props.children}
  </em>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTable = (props: any) => (
  <div className="overflow-x-auto mb-1.5">
    <table
      className="min-w-full border-collapse border border-slate-600"
      {...props}
    >
      {props.children}
    </table>
  </div>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomThead = (props: any) => (
  <thead className="bg-slate-700" {...props}>
    {props.children}
  </thead>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTbody = (props: any) => <tbody {...props}>{props.children}</tbody>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTr = (props: any) => (
  <tr className="border-b border-slate-600" {...props}>
    {props.children}
  </tr>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTh = (props: any) => (
  <th
    className="border border-slate-600 px-2 py-1 text-left text-white font-semibold text-[10px]"
    {...props}
  >
    {props.children}
  </th>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTd = (props: any) => (
  <td
    className="border border-slate-600 px-2 py-1 text-white text-[10px]"
    {...props}
  >
    {props.children}
  </td>
);

const createPreWithAnalyze = (onAnalyzeCode?: (code: string) => void) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const PreWithAnalyzeComponent = (props: any) => (
    <CustomPre {...props} onAnalyzeCode={onAnalyzeCode} />
  );
  PreWithAnalyzeComponent.displayName = "PreWithAnalyze";
  return PreWithAnalyzeComponent;
};

/**
 * Componente principal para renderizar Markdown con características avanzadas.
 *
 * @param props - Propiedades del componente
 * @returns Elemento JSX con el contenido Markdown renderizado
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 *
 * @example
 * ```tsx
 * <MarkdownRenderer
 *   content="# Título\n```python\nprint('Hello')\n```"
 *   onAnalyzeCode={(code) => handleAnalyze(code)}
 * />
 * ```
 */
export default function MarkdownRenderer({
  content,
  className,
  onAnalyzeCode,
  hideHorizontalRules = false,
  inlineCodeClassName,
  inlineCodeMathMode = "auto",
  inlineMathMode = "auto",
}: MarkdownRendererProps) {
  const PreWithAnalyze = createPreWithAnalyze(onAnalyzeCode);
  const CustomCode = createCustomCode(
    inlineCodeClassName,
    inlineCodeMathMode,
    inlineMathMode,
  );

  return (
    <div
      className={`min-w-0 max-w-full overflow-hidden ${className ?? ""}`.trim()}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: CustomH1,
          h2: CustomH2,
          h3: CustomH3,
          p: CustomP,
          ul: CustomUl,
          ol: CustomOl,
          li: CustomLi,
          code: CustomCode,
          pre: PreWithAnalyze,
          blockquote: CustomBlockquote,
          strong: CustomStrong,
          em: CustomEm,
          table: CustomTable,
          thead: CustomThead,
          tbody: CustomTbody,
          tr: CustomTr,
          th: CustomTh,
          td: CustomTd,
          ...(hideHorizontalRules && { hr: () => null }),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
