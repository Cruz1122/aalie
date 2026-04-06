"use client";

import type {
  ContentBlock,
  ImageResource,
  ReferenceResource,
} from "@aa/content-catalog";
import { useTranslations } from "next-intl";

import Formula from "@/components/Formula";
import { Link } from "@/i18n/navigation";
import type { ContentTargetMap } from "@/lib/content/types";

import { InlineRichTextRenderer } from "./InlineRichTextRenderer";

type ResourceEntry = ImageResource | ReferenceResource;

interface ContentBlockRendererProps {
  block: ContentBlock;
  targetMap: ContentTargetMap;
  termsById?: Record<string, { label: string; definition: string }>;
  resourcesById?: Record<string, ResourceEntry>;
}

const frameToneClassNames: Record<string, string> = {
  info: "border-sky-500/30 bg-sky-500/10",
  warning: "border-amber-500/30 bg-amber-500/10",
  success: "border-emerald-500/30 bg-emerald-500/10",
  danger: "border-rose-500/30 bg-rose-500/10",
  callout: "border-cyan-500/30 bg-cyan-500/10",
  definition: "border-violet-500/30 bg-violet-500/10",
  theorem: "border-indigo-500/30 bg-indigo-500/10",
  proof: "border-fuchsia-500/30 bg-fuchsia-500/10",
  example: "border-emerald-500/30 bg-emerald-500/10",
  exerciseSolution: "border-slate-500/30 bg-slate-800/60",
  exercise: "border-slate-500/30 bg-slate-800/60",
};

function resolveLink(
  kind: string,
  ref: string,
  targetMap: ContentTargetMap,
): { href: string; title?: string } | null {
  if (kind === "external") {
    return { href: ref };
  }

  return targetMap[`${kind}:${ref}`] ?? null;
}

function renderActionLink(
  label: string,
  href: string,
  variant: "primary" | "secondary" | "ghost" = "secondary",
  key: string,
) {
  const className = {
    primary:
      "border-sky-400/40 bg-sky-500/15 text-sky-100 hover:bg-sky-500/20",
    secondary:
      "border-white/15 bg-white/5 text-white hover:bg-white/10",
    ghost: "border-transparent bg-transparent text-slate-200 hover:bg-white/5",
  }[variant];

  const content = (
    <span
      className={`inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${className}`}
    >
      {label}
    </span>
  );

  if (href.startsWith("http://") || href.startsWith("https://")) {
    return (
      <a key={key} href={href} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  return (
    <Link key={key} href={href}>
      {content}
    </Link>
  );
}

function NestedBlocks({
  blocks,
  targetMap,
  termsById,
  resourcesById,
}: {
  blocks: ContentBlock[];
  targetMap: ContentTargetMap;
  termsById?: Record<string, { label: string; definition: string }>;
  resourcesById?: Record<string, ResourceEntry>;
}) {
  return (
    <div className="space-y-4">
      {blocks.map((block) => (
        <ContentBlockRenderer
          key={block.id}
          block={block}
          targetMap={targetMap}
          termsById={termsById}
          resourcesById={resourcesById}
        />
      ))}
    </div>
  );
}

function ListItems({
  items,
  ordered,
  targetMap,
  termsById,
}: {
  items: Extract<ContentBlock, { type: "list" }>["items"];
  ordered: boolean;
  targetMap: ContentTargetMap;
  termsById?: Record<string, { label: string; definition: string }>;
}) {
  const ListTag = ordered ? "ol" : "ul";

  return (
    <ListTag className={ordered ? "list-decimal space-y-2 pl-5" : "list-disc space-y-2 pl-5"}>
      {items.map((item, index) => (
        <li key={`${index}-${item.content.length}`} className="text-sm leading-7 text-slate-200">
          <InlineRichTextRenderer
            content={item.content}
            targetMap={targetMap}
            termsById={termsById}
          />
          {item.children?.length ? (
            <div className="mt-2">
              <ListItems
                items={item.children}
                ordered={false}
                targetMap={targetMap}
                termsById={termsById}
              />
            </div>
          ) : null}
        </li>
      ))}
    </ListTag>
  );
}

export function ContentBlockRenderer({
  block,
  targetMap,
  termsById = {},
  resourcesById = {},
}: ContentBlockRendererProps) {
  const t = useTranslations("contentUi");

  switch (block.type) {
    case "heading": {
      const Tag = block.level === 2 ? "h2" : block.level === 3 ? "h3" : "h4";
      const className =
        block.level === 2
          ? "text-2xl font-bold text-white"
          : block.level === 3
            ? "text-xl font-semibold text-white"
            : "text-lg font-semibold text-slate-100";
      return (
        <Tag id={block.id} className={className}>
          <InlineRichTextRenderer
            content={block.content}
            targetMap={targetMap}
            termsById={termsById}
          />
        </Tag>
      );
    }
    case "paragraph":
      return (
        <p id={block.id} className="text-sm leading-7 text-slate-200">
          <InlineRichTextRenderer
            content={block.content}
            targetMap={targetMap}
            termsById={termsById}
          />
        </p>
      );
    case "list":
      return (
        <div id={block.id}>
          <ListItems
            items={block.items}
            ordered={block.style === "ordered"}
            targetMap={targetMap}
            termsById={termsById}
          />
        </div>
      );
    case "quote":
      return (
        <blockquote
          id={block.id}
          className="rounded-2xl border-l-4 border-sky-400/50 bg-slate-900/70 px-5 py-4 text-sm text-slate-200"
        >
          <InlineRichTextRenderer
            content={block.content}
            targetMap={targetMap}
            termsById={termsById}
          />
          {block.attribution ? (
            <footer className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
              {block.attribution}
            </footer>
          ) : null}
        </blockquote>
      );
    case "note":
    case "callout":
    case "definition":
    case "theorem":
    case "proof":
    case "example":
    case "exerciseSolution": {
      const frameClassName = frameToneClassNames[block.type === "note" ? block.variant : block.type];
      return (
        <section
          id={block.id}
          className={`rounded-2xl border px-5 py-4 ${frameClassName ?? frameToneClassNames.callout}`}
        >
          <header className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/90">
            {block.title}
          </header>
          <NestedBlocks
            blocks={block.blocks}
            targetMap={targetMap}
            termsById={termsById}
            resourcesById={resourcesById}
          />
        </section>
      );
    }
    case "exercise": {
      const solutionHref = block.solutionRef
        ? resolveLink("block", block.solutionRef, targetMap)?.href
        : null;
      return (
        <section
          id={block.id}
          className={`rounded-2xl border px-5 py-4 ${frameToneClassNames.exercise}`}
        >
          {block.title ? (
            <header className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/90">
              {block.title}
            </header>
          ) : null}
          <p className="text-sm leading-7 text-slate-200">
            <InlineRichTextRenderer
              content={block.prompt}
              targetMap={targetMap}
              termsById={termsById}
            />
          </p>
          {solutionHref ? (
            <div className="mt-4">
              {renderActionLink(t("viewSolution"), solutionHref, "ghost", block.id)}
            </div>
          ) : null}
        </section>
      );
    }
    case "algorithm":
    case "code":
      return (
        <section id={block.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#101923]">
          {block.title ? (
            <header className="border-b border-white/10 px-4 py-3 text-sm font-semibold text-white">
              {block.title}
            </header>
          ) : null}
          <pre className="overflow-x-auto px-4 py-4 text-sm leading-6 text-slate-200">
            <code>{block.code}</code>
          </pre>
          {block.caption ? (
            <footer className="border-t border-white/10 px-4 py-3 text-xs text-slate-400">
              {block.caption}
            </footer>
          ) : null}
        </section>
      );
    case "table":
      return (
        <section id={block.id} className="space-y-3">
          {block.title ? (
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
              {block.title}
            </h3>
          ) : null}
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-white/5">
                <tr>
                  {block.columns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-4 py-3 text-left font-semibold text-slate-200 ${
                        column.align === "center"
                          ? "text-center"
                          : column.align === "right"
                            ? "text-right"
                            : ""
                      }`}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {block.rows.map((row, rowIndex) => (
                  <tr key={`${block.id}-${rowIndex}`}>
                    {row.cells.map((cell, cellIndex) => (
                      <td key={`${block.id}-${rowIndex}-${cellIndex}`} className="px-4 py-3 align-top text-slate-200">
                        <InlineRichTextRenderer
                          content={cell}
                          targetMap={targetMap}
                          termsById={termsById}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    case "image":
    case "figure": {
      const resource = resourcesById[block.resourceRef];
      if (!resource || resource.kind === "reference") {
        return null;
      }

      const source =
        resource.source.kind === "publicPath"
          ? resource.source.path
          : resource.source.kind === "externalUrl"
            ? resource.source.url
            : null;

      return (
        <figure id={block.id} className="space-y-3">
          {source ? (
            <img
              src={source}
              alt={resource.alt}
              className="w-full rounded-2xl border border-white/10 object-cover"
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/80 px-4 py-10 text-center text-sm text-slate-400">
              {resource.caption ?? resource.alt}
            </div>
          )}
          {resource.caption ? (
            <figcaption className="text-xs text-slate-400">
              {resource.caption}
            </figcaption>
          ) : null}
        </figure>
      );
    }
    case "equationBlock":
      return (
        <div id={block.id} className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-5 text-center">
          <Formula latex={block.latex} display />
        </div>
      );
    case "cheatsheet":
      return (
        <section id={block.id} className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          {block.title ? (
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
              {block.title}
            </h3>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            {block.items.map((item) => (
              <div key={`${block.id}-${item.label}`} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="mb-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                  {item.label}
                </div>
                <div className="text-sm text-slate-200">
                  <InlineRichTextRenderer
                    content={item.value}
                    targetMap={targetMap}
                    termsById={termsById}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    case "referenceList":
      return (
        <section id={block.id} className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
            {t("references")}
          </h3>
          <ul className="space-y-2 text-sm text-slate-200">
            {block.references.map((referenceId) => {
              const resource = resourcesById[referenceId];
              if (!resource || resource.kind !== "reference") {
                return <li key={referenceId}>{referenceId}</li>;
              }

              if (resource.url) {
                return (
                  <li key={referenceId}>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-300 underline decoration-sky-500/60 underline-offset-2"
                    >
                      {resource.label}
                    </a>
                  </li>
                );
              }

              return <li key={referenceId}>{resource.label}</li>;
            })}
          </ul>
        </section>
      );
    case "divider":
      return <hr id={block.id} className="border-white/10" />;
    case "buttonRow":
      return (
        <div id={block.id} className="flex flex-wrap gap-3">
          {block.buttons.map((button, index) => {
            const resolved = resolveLink(
              button.target.kind,
              button.target.ref,
              targetMap,
            );
            if (!resolved) {
              return null;
            }

            return renderActionLink(
              button.label,
              resolved.href,
              button.variant,
              `${block.id}-${index}`,
            );
          })}
        </div>
      );
    default:
      return null;
  }
}
