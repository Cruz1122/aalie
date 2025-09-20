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

export interface DocumentationSection {
  id: string;
  title: string;
  description: string;
  image?: ImageData;
  content?: PackageContent;
}

export interface ModalImageData {
  src: string;
  alt: string;
  width: number;
  height: number;
}