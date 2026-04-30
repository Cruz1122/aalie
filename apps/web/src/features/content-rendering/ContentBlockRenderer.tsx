"use client";

import type {
  ContentBlock,
  ImageResource,
  QuizCheckpointBlock,
  ReferenceResource,
  TermIndexEntry,
} from "@aa/content-catalog/types";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { ContentTargetMap } from "@/lib/content/types";

import { FormulaBlock } from "./blocks/FormulaBlock";
import { FormulaStepBlock } from "./blocks/FormulaStepBlock";
import { GraphDiagramBlock } from "./blocks/GraphDiagramBlock";
import { MermaidDiagramBlock } from "./blocks/MermaidDiagramBlock";
import { MethodStepsBlock } from "./blocks/MethodStepsBlock";
import { RecurrenceMethodCard } from "./blocks/RecurrenceMethodCard";
import { RecursionTreeBlock } from "./blocks/RecursionTreeBlock";
import { ResponsiveContentTable } from "./blocks/ResponsiveContentTable";
import { SolvedExampleBlock } from "./blocks/SolvedExampleBlock";
import { TrapCallout } from "./blocks/TrapCallout";
import { InlineRichTextRenderer } from "./InlineRichTextRenderer";
import { MaterialIcon } from "./MaterialIcon";
import { NestedBlocks } from "./NestedBlocks";

type ResourceEntry = ImageResource | ReferenceResource;

interface ContentBlockRendererProps {
  block: ContentBlock;
  targetMap: ContentTargetMap;
  termsById?: Record<string, { label: string; definition: string }>;
  termsIndex?: TermIndexEntry[];
  resourcesById?: Record<string, ResourceEntry>;
}

const frameToneClassNames: Record<string, string> = {
  info: "border-sky-500/30 bg-sky-500/10",
  warning: "border-amber-500/30 bg-amber-500/10",
  success: "border-primary/30 bg-primary/10",
  danger: "border-rose-500/30 bg-rose-500/10",
  callout: "border-cyan-500/30 bg-cyan-500/10",
  definition: "border-violet-500/30 bg-violet-500/10",
  theorem: "border-indigo-500/30 bg-indigo-500/10",
  proof: "border-fuchsia-500/30 bg-fuchsia-500/10",
  example: "border-primary/30 bg-primary/10",
  exerciseSolution: "border-slate-500/30 bg-slate-800/60",
  exercise: "border-slate-500/30 bg-slate-800/60",
};

const evidenceVariantBorder: Record<string, string> = {
  concept: "border-l-violet-400/50",
  example: "border-l-primary/55",
  systemEvidence: "border-l-cyan-400/50",
  interpretation: "border-l-amber-400/50",
  warning: "border-l-rose-400/50",
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
    primary: "border-sky-400/40 bg-sky-500/15 text-sky-100 hover:bg-sky-500/20",
    secondary: "border-white/15 bg-white/5 text-white hover:bg-white/10",
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

function QuizFeedbackAnchor({
  block,
  targetMap,
}: {
  block: QuizCheckpointBlock;
  targetMap: ContentTargetMap;
}) {
  return (
    <div
      id={block.id}
      className="rounded-2xl border border-teal-500/25 bg-teal-500/10 p-4"
    >
      <div className="mb-1 text-xs uppercase tracking-[0.2em] text-teal-100/80">
        Quiz checkpoint
      </div>
      <div className="text-sm font-semibold text-white">
        {block.title ?? block.quizId}
      </div>
      {block.prompt ? (
        <p className="mt-2 text-sm leading-7 text-slate-200">
          <InlineRichTextRenderer
            content={block.prompt}
            targetMap={targetMap}
          />
        </p>
      ) : null}
      <p className="mt-2 text-xs text-slate-400">
        Anchor estable para feedback enlazable del quiz.
      </p>
    </div>
  );
}

function UnsupportedBlockFallback({
  block,
}: {
  block: {
    id: string;
    type: string;
  };
}) {
  return (
    <section
      id={block.id}
      className="rounded-2xl border border-dashed border-amber-400/35 bg-amber-500/10 p-4"
    >
      <div className="text-sm font-semibold text-amber-100">
        Bloque aún no interpretado visualmente: {block.type}
      </div>
      <p className="mt-2 text-sm leading-7 text-slate-200">
        El contenido sigue identificado y referenciable para quizzes, pero esta
        variante necesita una representación pedagógica más específica.
      </p>
    </section>
  );
}

export function ContentBlockRenderer({
  block,
  targetMap,
  termsById = {},
  termsIndex = [],
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
            termsIndex={termsIndex}
            allowAutoLink={false}
          />
        </Tag>
      );
    }
    case "paragraph":
      return (
        <p id={block.id} className="text-[15px] leading-7 text-slate-200">
          <InlineRichTextRenderer
            content={block.content}
            targetMap={targetMap}
            termsById={termsById}
            termsIndex={termsIndex}
            allowAutoLink={true}
          />
        </p>
      );
    case "list": {
      const ListTag = block.style === "ordered" ? "ol" : "ul";
      return (
        <ListTag
          id={block.id}
          className={
            block.style === "ordered"
              ? "list-decimal space-y-2 pl-5"
              : "list-disc space-y-2 pl-5"
          }
        >
          {block.items.map((item, index) => (
            <li
              key={`${block.id}-${index}`}
              className="text-sm leading-7 text-slate-200"
            >
              <InlineRichTextRenderer
                content={item.content}
                targetMap={targetMap}
                termsById={termsById}
                termsIndex={termsIndex}
                allowAutoLink={true}
              />
            </li>
          ))}
        </ListTag>
      );
    }
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
            termsIndex={termsIndex}
            allowAutoLink={true}
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
      const frameClassName =
        frameToneClassNames[block.type === "note" ? block.variant : block.type];
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
            termsIndex={termsIndex}
            resourcesById={resourcesById}
          />
        </section>
      );
    }
    case "evidenceBlock":
      return (
        <section
          id={block.id}
          className={`border-0 border-l-2 py-1 pl-4 ${
            evidenceVariantBorder[block.variant] ?? "border-l-slate-500/50"
          }`}
        >
          <div className="flex gap-3">
            <span className="mt-0.5 shrink-0 text-slate-400" aria-hidden>
              <MaterialIcon name={block.icon} fontSize="small" />
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              {block.title ? (
                <div className="text-xs font-medium text-slate-500">
                  {block.title}
                </div>
              ) : null}
              <NestedBlocks
                blocks={block.blocks}
                targetMap={targetMap}
                termsById={termsById}
                termsIndex={termsIndex}
                resourcesById={resourcesById}
              />
            </div>
          </div>
        </section>
      );
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
              termsIndex={termsIndex}
              allowAutoLink={true}
            />
          </p>
          {solutionHref ? (
            <div className="mt-4">
              {renderActionLink(
                t("viewSolution"),
                solutionHref,
                "ghost",
                block.id,
              )}
            </div>
          ) : null}
        </section>
      );
    }
    case "algorithm":
    case "code":
      return (
        <section
          id={block.id}
          className="overflow-hidden border border-white/10 bg-[#0d1219]"
        >
          {block.title ? (
            <header className="border-b border-white/10 px-3 py-2 text-xs font-medium text-slate-400">
              {block.title}
            </header>
          ) : null}
          <pre className="overflow-x-auto px-3 py-3 text-[13px] leading-6 text-slate-200">
            <code>{block.code}</code>
          </pre>
          {block.caption ? (
            <footer className="border-t border-white/10 px-3 py-2 text-xs text-slate-500">
              {block.caption}
            </footer>
          ) : null}
        </section>
      );
    case "table":
    case "complexityTable":
    case "formulaComparisonTable":
      return <ResponsiveContentTable block={block} targetMap={targetMap} />;
    case "image":
    case "figure": {
      const resource = resourcesById[block.resourceRef];
      if (!resource || resource.kind === "reference") {
        return <UnsupportedBlockFallback block={block} />;
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
            <Image
              src={source}
              alt={resource.alt}
              width={1600}
              height={900}
              unoptimized
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
    case "latex":
    case "equationBlock":
      return <FormulaBlock block={block} />;
    case "latexSteps":
      return <FormulaStepBlock block={block} targetMap={targetMap} />;
    case "mermaid":
      return <MermaidDiagramBlock block={block} />;
    case "recursionTree":
      return <RecursionTreeBlock block={block} />;
    case "graph":
      return <GraphDiagramBlock block={block} />;
    case "methodCard":
      return <RecurrenceMethodCard block={block} targetMap={targetMap} />;
    case "stepByStepMethod":
    case "proofSteps":
      return (
        <MethodStepsBlock
          block={block}
          targetMap={targetMap}
          termsById={termsById}
          resourcesById={resourcesById}
        />
      );
    case "warningTrap":
      return <TrapCallout block={block} targetMap={targetMap} />;
    case "exampleSolved":
      return <SolvedExampleBlock block={block} targetMap={targetMap} />;
    case "quizCheckpoint":
      return <QuizFeedbackAnchor block={block} targetMap={targetMap} />;
    case "cheatsheet":
      return (
        <section
          id={block.id}
          className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4"
        >
          {block.title ? (
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
              {block.title}
            </h3>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            {block.items.map((item) => (
              <div
                key={`${block.id}-${item.label}`}
                className="rounded-xl border border-white/10 bg-white/5 p-3"
              >
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
      return <UnsupportedBlockFallback block={block} />;
  }
}
