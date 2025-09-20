export type LoaderVariant = "spinner" | "dots" | "progress" | "pulse";

export type LoaderSize = "sm" | "md" | "lg" | "xl";

export interface LoaderConfig {
  variant?: LoaderVariant;
  size?: LoaderSize;
  message?: string;
  progress?: number; // 0-100 para variant 'progress'
  overlay?: boolean;
  persistent?: boolean; // No se puede cerrar con escape
}

export interface GlobalLoaderContextType {
  isLoading: boolean;
  config: LoaderConfig;
  show: (config?: LoaderConfig) => void;
  hide: () => void;
  updateProgress: (progress: number) => void;
  updateMessage: (message: string) => void;
}
