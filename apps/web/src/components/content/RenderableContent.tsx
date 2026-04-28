"use client";

import type { RenderableContent as RenderableContentType } from "@aa/types";

import MarkdownRenderer from "@/components/MarkdownRenderer";

interface Props {
  content: RenderableContentType;
  className?: string;
}

export default function RenderableContent({ content, className }: Props) {
  return (
    <div className={className}>
      {content.blocks.map((block, index) => {
        const blockSpacingClass =
          index < content.blocks.length - 1 ? "mb-2" : "mb-0";
        if (block.type === "code") {
          return (
            <pre
              key={index}
              className={`${blockSpacingClass} overflow-x-auto rounded bg-slate-900 p-2 text-xs text-slate-200`}
            >
              <code>{block.content}</code>
            </pre>
          );
        }
        return (
          <MarkdownRenderer
            key={index}
            content={block.content}
            className={blockSpacingClass}
          />
        );
      })}
    </div>
  );
}
