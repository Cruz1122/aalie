/**
 * Tipos para la guía de usuario con estructura de bloques.
 * Author: @Cruz1122
 * Version: 0.1.0
 */

export type ListItemIcon =
  | "check"
  | "error"
  | "warning"
  | "info"
  | "bullet"
  | "aalie";

export interface ParagraphBlock {
  type: "paragraph";
  textKey: string;
  /** Título opcional en negrita antes del texto (ej. "Ejemplo:") */
  titleKey?: string;
}

export interface ListItem {
  icon?: ListItemIcon;
  textKey?: string;
  /** Para ítems con título + descripción (ej. analisisEditor1 + analisisEditor1b) */
  titleKey?: string;
  descKey?: string;
  /** Código inline opcional (ej. factorial(n) en gramProcScalar) */
  codeSnippet?: string;
}

export interface ListBlock {
  type: "list";
  items: ListItem[];
  numbered?: boolean;
}

export interface CodeBlock {
  type: "code";
  code: string;
}

export interface TableRow2 {
  key: string;
  labelKey: string;
}

export interface TableRow3 {
  typeKey: string;
  ops: string;
  precKey: string;
}

export interface TableBlock {
  type: "table";
  headerKeys: [string, string] | [string, string, string];
  rows: TableRow2[] | TableRow3[];
}

export interface NoteBlock {
  type: "note";
  variant: "tip" | "warning" | "info" | "advantage" | "error";
  titleKey: string;
  contentKey?: string;
  /** Para notas con enlace: preKey + linkKey + postKey */
  preKey?: string;
  linkKey?: string;
  postKey?: string;
  href?: string;
}

export interface SubsectionBlock {
  type: "subsection";
  titleKey: string;
  icon?: string;
  /** Variante de color para subsecciones (ej. modos best/worst/avg) */
  variant?: "default" | "success" | "error" | "info";
  blocks: UserGuideBlock[];
}

export interface LinkBlock {
  type: "link";
  titleKey?: string;
  preKey?: string;
  linkKey: string;
  postKey?: string;
  href: string;
}

export type UserGuideBlock =
  | ParagraphBlock
  | ListBlock
  | CodeBlock
  | TableBlock
  | NoteBlock
  | SubsectionBlock
  | LinkBlock;

export interface UserGuideContent {
  blocks: UserGuideBlock[];
}

export interface UserGuideSection {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  content: UserGuideContent;
}
