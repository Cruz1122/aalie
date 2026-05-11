"use client";

import type {
  ContentBlock,
  ImageResource,
  ReferenceResource,
  TermIndexEntry,
} from "@aa/content-catalog/types";

import type { ContentTargetMap } from "@/lib/content/types";

import { ContentBlockRenderer } from "./ContentBlockRenderer";

type ResourceEntry = ImageResource | ReferenceResource;

interface NestedBlocksProps {
  blocks: ContentBlock[];
  targetMap: ContentTargetMap;
  termsById?: Record<string, { label: string; definition: string }>;
  termsIndex?: TermIndexEntry[];
  resourcesById?: Record<string, ResourceEntry>;
}

export function NestedBlocks({
  blocks,
  targetMap,
  termsById,
  termsIndex,
  resourcesById,
}: NestedBlocksProps) {
  return (
    <div className="space-y-4">
      {blocks.map((block) => (
        <ContentBlockRenderer
          key={block.id}
          block={block}
          targetMap={targetMap}
          termsById={termsById}
          termsIndex={termsIndex}
          resourcesById={resourcesById}
        />
      ))}
    </div>
  );
}
