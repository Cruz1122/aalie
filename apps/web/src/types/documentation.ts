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

export interface DocumentationSection {
  id: string;
  title: string;
  description: string;
  image?: ImageData;
  content?: PackageContent | ToolsContent;
}

export interface ModalImageData {
  src: string;
  alt: string;
  width: number;
  height: number;
}
