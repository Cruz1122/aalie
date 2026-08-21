"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

import ErrorState from "./ErrorState";

interface AppErrorBoundaryProps {
  readonly locale: string;
  readonly children: ReactNode;
}

interface AppErrorBoundaryState {
  readonly hasError: boolean;
}

export default class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      "[AppErrorBoundary] Unhandled application error",
      error,
      info,
    );
  }

  handleRetry = () => {
    globalThis.window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isEnglish = this.props.locale === "en";

      return (
        <ErrorState
          icon="error_outline"
          accentClass="text-rose-300"
          homeHref={`/${this.props.locale}`}
          onRetry={this.handleRetry}
          copy={{
            eyebrow: isEnglish ? "SOMETHING WENT WRONG" : "ALGO SALIÓ MAL",
            title: isEnglish
              ? "We're working to fix it"
              : "Estamos trabajando para solucionarlo",
            homeLabel: isEnglish ? "Back to home" : "Volver al inicio",
            retryLabel: isEnglish ? "Try again" : "Intentar de nuevo",
          }}
        />
      );
    }

    return this.props.children;
  }
}
