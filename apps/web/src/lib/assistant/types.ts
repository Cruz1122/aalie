export type ChatMessageSender = "user" | "bot";

export interface ChatMessage {
  id: string;
  content: string;
  sender: ChatMessageSender;
  timestamp: Date;
  isError?: boolean;
  retryMessageId?: string;
}

export type AssistantSurface = "home" | "analyzer" | "examples" | "user-guide";

export function isAssistantSurface(
  value: string | null | undefined,
): value is AssistantSurface {
  return (
    value === "home" ||
    value === "analyzer" ||
    value === "examples" ||
    value === "user-guide"
  );
}

export interface AssistantPageContext {
  route: string;
  view?: string;
  title?: string;
  description?: string;
  query?: string;
  filters?: string[];
  notes?: string[];
}

export interface AssistantFormalCaseSummary {
  caseId: "worst" | "best" | "avg";
  bigO?: string;
  bigOmega?: string;
  bigTheta?: string;
  efficiencyEquation?: string;
  groupedCostExpression?: string;
}

export interface AssistantFormalAnalysisSummary {
  parseStatus?: "ok" | "error" | "unknown" | "idle";
  analysisStatus?: "idle" | "running" | "complete" | "error";
  algorithmType?: string;
  selectedCase?: string;
  selectedMethod?: string;
  hasCaseVariability?: boolean;
  cases?: AssistantFormalCaseSummary[];
  notes?: string[];
}

export interface AssistantExampleContext {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  category?: string;
  family?: string;
  methods?: string[];
  tags?: string[];
  source?: string;
}

export interface AssistantExampleSectionContext {
  id: string;
  slug: string;
  title: string;
  description?: string;
  exampleCount?: number;
  kind?: "iterative" | "recursive";
}

export interface AssistantGuideSectionContext {
  id: string;
  title: string;
  description?: string;
  summary?: string;
}

export interface AssistantFocusedPanelContext {
  id: string;
  title: string;
  description?: string;
  notes?: string[];
}

export interface AssistantFeatureContext {
  id: string;
  title: string;
  location?: string;
  description?: string;
  availability?: string;
}

export interface AssistantContext {
  surface: AssistantSurface;
  locale: string;
  pageContext: AssistantPageContext;
  formalAnalysisSummary?: AssistantFormalAnalysisSummary;
  sourceCode?: string;
  example?: AssistantExampleContext;
  visibleExamples?: AssistantExampleContext[];
  exampleSections?: AssistantExampleSectionContext[];
  guideSection?: AssistantGuideSectionContext;
  focusedPanel?: AssistantFocusedPanelContext;
  availableFeatures?: AssistantFeatureContext[];
}
