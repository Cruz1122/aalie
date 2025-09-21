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
  features?: string[];
  components?: string[];
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
  config: Record<string, any>;
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

export interface AnalyzerContent {
  type: "analyzer";
  interface: {
    title: string;
    layout: {
      description: string;
      columns: AnalyzerColumn[];
    };
    responsiveness: {
      title: string;
      breakpoints: AnalyzerBreakpoint[];
    };
  };
  modal: {
    title: string;
    purpose: string;
    features: string[];
    types: AnalyzerModalType[];
  };
  components: {
    title: string;
    list: AnalyzerComponentInfo[];
  };
}

export interface DocumentationSection {
  id: string;
  title: string;
  description: string;
  image?: ImageData;
  content?: PackageContent | UIShowcaseContent | ToolsContent | KaTeXContent | AnalyzerContent;
}

export interface ModalImageData {
  src: string;
  alt: string;
  width: number;
  height: number;
}
