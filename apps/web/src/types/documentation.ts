export interface ImageData {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption: string;
}

export interface PackageInfo {
  name: string;
  purpose: string;
  description: string;
  io: {
    input: string;
    outputs: string[];
  };
  usedBy: string[];
  notes: string[];
}

export interface PackageContent {
  type: "packages";
  packages: PackageInfo[];
}

export interface UIShowcaseContent {
  type: "ui-showcase";
  implementation: {
    title: string;
    description: string;
    testRoute: string;
    features: string[];
  };
}

export interface ToolInfo {
  name: string;
  purpose: string;
  config?: string;
  features: string[];
}

export interface CommandInfo {
  command: string;
  description: string;
  result?: string;
}

export interface ToolsContent {
  type: "tools";
  frontend: {
    title: string;
    tools: ToolInfo[];
  };
  backend: {
    title: string;
    tools: ToolInfo[];
  };
  automation: {
    title: string;
    commands: CommandInfo[];
  };
}

export interface KaTeXComponent {
  name: string;
  purpose: string;
  props: string[];
  usage: string;
}

export interface KaTeXUtility {
  file: string;
  function: string;
  purpose: string;
  config: Record<string, unknown>;
  security: string;
}

export interface KaTeXExample {
  description: string;
  code: string;
  result: string;
}

export interface KaTeXContent {
  type: "katex";
  implementation: {
    title: string;
    library: {
      name: string;
      purpose: string;
      features: string[];
    };
    components: KaTeXComponent[];
    utilities: KaTeXUtility[];
  };
  examples: {
    title: string;
    inline: KaTeXExample;
    block: KaTeXExample;
    complex: KaTeXExample;
  };
  styling: {
    title: string;
    css: {
      import: string;
      customization: string;
      responsive: string;
    };
    themes: {
      dark: string;
      responsive: string;
    };
  };
}

export interface AnalyzerColumn {
  name: string;
  purpose: string;
  component: string;
  features: string[];
}

export interface AnalyzerBreakpoint {
  size: string;
  layout: string;
  description: string;
}

export interface AnalyzerComponentInfo {
  name: string;
  file: string;
  purpose: string;
  props: string[];
}

export interface AnalyzerModalType {
  name: string;
  description: string;
  content: string;
}

export interface AnalysisMode {
  name: string;
  description: string;
  features: string[];
}

export interface AnalysisModes {
  title: string;
  modes: AnalysisMode[];
}

export interface VisitorInfo {
  name: string;
  description: string;
  features: string[];
}

export interface AlgorithmCategory {
  name: string;
  examples: string[];
}

export interface AnalyzerContent {
  type: "analyzer";
  interface: {
    title: string;
    description?: string;
    features?: string[];
    layout?: {
      description: string;
      columns: AnalyzerColumn[];
    };
    responsiveness?: {
      title: string;
      breakpoints: AnalyzerBreakpoint[];
    };
  };
  analysisModes?: AnalysisModes;
  modal?: {
    title: string;
    purpose: string;
    features: string[];
    types: AnalyzerModalType[];
  };
  components?: {
    title: string;
    list: AnalyzerComponentInfo[];
  };
  implementation?: {
    title: string;
    description: string;
    features: string[];
  };
  visitors?: {
    title: string;
    list: VisitorInfo[];
  };
  algorithms?: {
    title: string;
    categories: AlgorithmCategory[];
  };
  api?: {
    title: string;
    endpoint: {
      name: string;
      description: string;
      request: Record<string, unknown>;
      response: Record<string, unknown>;
    };
  };
  // Campos específicos para analizador recursivo
  masterTheorem?: {
    title: string;
    description: string;
    cases: Array<{
      case: number;
      condition: string;
      result: string;
      description: string;
      example: string;
    }>;
  };
  recurrenceExtraction?: {
    title: string;
    description: string;
    process: string[];
    requirements: string[];
  };
  visualization?: {
    title: string;
    components: Array<{
      name: string;
      description: string;
      features: string[];
      sections?: string[];
    }>;
  };
}

export interface GrammarFeature {
  name: string;
  description: string;
  example: string;
}

export interface GrammarSyntaxSection {
  name: string;
  code: string;
  notes: string[];
}

export interface GrammarOperatorCategory {
  name: string;
  operators: string[];
  precedence: string;
}

export interface GrammarContent {
  type: "grammar";
  overview: {
    title: string;
    description: string;
    technology: string;
    location: string;
    generators: string[];
  };
  features: {
    title: string;
    items: GrammarFeature[];
  };
  syntax: {
    title: string;
    sections: GrammarSyntaxSection[];
  };
  operators: {
    title: string;
    categories: GrammarOperatorCategory[];
  };
  ast: {
    title: string;
    description: string;
    nodeTypes: string[];
    example: {
      input: string;
      astFragment: string;
    };
  };
  validation: {
    title: string;
    client: {
      technology: string;
      purpose: string;
      features: string[];
    };
    server: {
      technology: string;
      purpose: string;
      endpoint: string;
      features: string[];
    };
  };
  errorHandling: {
    title: string;
    features: string[];
    errorTypes: string[];
  };
}

export interface DocumentationSection {
  id: string;
  title: string;
  description: string;
  image?: ImageData;
  content?: PackageContent | UIShowcaseContent | ToolsContent | KaTeXContent | AnalyzerContent | GrammarContent;
}

export interface ModalImageData {
  src: string;
  alt: string;
  width: number;
  height: number;
}
