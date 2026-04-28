export interface ContentRef {
  courseId: string;
  moduleId: string;
  chapterId: string;
  blockId?: string;
}

export interface RenderableContent {
  blocks: RenderableBlock[];
}

export type RenderableBlock =
  | {
      type: "markdown";
      content: string;
    }
  | {
      type: "code";
      language: "aalie-pseudocode" | "text";
      content: string;
    };
