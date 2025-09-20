export interface ImageData {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption: string;
}

export interface DocumentationSection {
  id: string;
  title: string;
  description: string;
  image: ImageData;
}

export interface ModalImageData {
  src: string;
  alt: string;
  width: number;
  height: number;
}