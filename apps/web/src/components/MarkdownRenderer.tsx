import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import '../styles/highlight.css';

interface MarkdownRendererProps {
  readonly content: string;
  readonly className?: string;
}

interface CopyButtonProps {
  readonly code: string;
}

// Componente de botón de copia
const CopyButton = ({ code }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded transition-colors duration-200 text-xs"
      title={copied ? '¡Copiado!' : 'Copiar código'}
    >
      {copied ? (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
};

// Componentes personalizados para evitar warnings de ESLint
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomH1 = (props: any) => (
  <h1 className="text-sm font-bold text-white mb-1.5 mt-3 first:mt-0" {...props}>
    {props.children}
  </h1>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomH2 = (props: any) => (
  <h2 className="text-xs font-semibold text-white mb-1.5 mt-2 first:mt-0" {...props}>
    {props.children}
  </h2>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomH3 = (props: any) => (
  <h3 className="text-[11px] font-semibold text-white mb-1 mt-1.5 first:mt-0" {...props}>
    {props.children}
  </h3>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomP = (props: any) => (
  <p className="text-white text-[11px] leading-relaxed mb-1.5 last:mb-0" {...props}>
    {props.children}
  </p>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomUl = (props: any) => (
  <ul className="text-white text-[11px] leading-relaxed mb-1.5 ml-3 list-disc" {...props}>
    {props.children}
  </ul>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomOl = (props: any) => (
  <ol className="text-white text-[11px] leading-relaxed mb-1.5 ml-3 list-decimal" {...props}>
    {props.children}
  </ol>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomLi = (props: any) => (
  <li className="text-white text-[11px] leading-relaxed mb-0.5" {...props}>
    {props.children}
  </li>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomCode = (props: any) => {
  const isInline = !props.className;
  if (isInline) {
    return (
      <code className="bg-slate-700 text-cyan-300 px-1 py-0.5 rounded text-[10px] font-mono" {...props}>
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomPre = (props: any) => {
  // Función más robusta para extraer el contenido del código
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extractTextContent = (node: any): string => {
    if (typeof node === 'string') {
      return node;
    }
    
    if (typeof node === 'number') {
      return String(node);
    }
    
    if (Array.isArray(node)) {
      return node.map(extractTextContent).join('');
    }
    
    if (node && typeof node === 'object') {
      // Si tiene children, extraer de ahí
      if (node.children) {
        return extractTextContent(node.children);
      }
      // Si tiene props.children
      if (node.props?.children) {
        return extractTextContent(node.props.children);
      }
    }
    
    return '';
  };

  const codeContent = extractTextContent(props.children);

  return (
    <div className="relative group w-full">
      <div className="bg-slate-800/70 border border-slate-600/40 rounded-md p-2.5 overflow-x-auto max-h-[300px] overflow-y-auto mb-1.5">
        <pre className="text-slate-200 text-[10px] font-mono whitespace-pre leading-relaxed m-0">
          {codeContent}
        </pre>
      </div>
      {codeContent?.trim() && (
        <CopyButton code={codeContent} />
      )}
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomBlockquote = (props: any) => (
  <blockquote className="border-l-2 border-blue-500 pl-2 py-1 bg-blue-500/10 rounded-r mb-1.5" {...props}>
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
    <table className="min-w-full border-collapse border border-slate-600" {...props}>
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
const CustomTbody = (props: any) => (
  <tbody {...props}>
    {props.children}
  </tbody>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTr = (props: any) => (
  <tr className="border-b border-slate-600" {...props}>
    {props.children}
  </tr>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTh = (props: any) => (
  <th className="border border-slate-600 px-2 py-1 text-left text-white font-semibold text-[10px]" {...props}>
    {props.children}
  </th>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTd = (props: any) => (
  <td className="border border-slate-600 px-2 py-1 text-white text-[10px]" {...props}>
    {props.children}
  </td>
);

export default function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
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
          pre: CustomPre,
          blockquote: CustomBlockquote,
          strong: CustomStrong,
          em: CustomEm,
          table: CustomTable,
          thead: CustomThead,
          tbody: CustomTbody,
          tr: CustomTr,
          th: CustomTh,
          td: CustomTd,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
