"use client";

import React, { createContext, useContext } from "react";

interface TermAutoLinkContextValue {
  shouldAutoLink(termId: string, maxPerTerm: number): boolean;
  registerExplicitTerm(termId: string): void;
}

const TermAutoLinkContext = createContext<TermAutoLinkContextValue | null>(
  null,
);

interface TermAutoLinkProviderProps {
  children: React.ReactNode;
}

export function TermAutoLinkProvider({ children }: TermAutoLinkProviderProps) {
  const occurrences: Record<string, number> = {};
  const explicitTerms = new Set<string>();

  const value: TermAutoLinkContextValue = {
    shouldAutoLink(termId: string, maxPerTerm: number) {
      if (explicitTerms.has(termId)) {
        return false;
      }

      const count = occurrences[termId] || 0;
      if (count >= maxPerTerm) {
        return false;
      }

      occurrences[termId] = count + 1;
      return true;
    },
    registerExplicitTerm(termId: string) {
      explicitTerms.add(termId);
    },
  };

  return (
    <TermAutoLinkContext.Provider value={value}>
      {children}
    </TermAutoLinkContext.Provider>
  );
}

export function useTermAutoLink() {
  return useContext(TermAutoLinkContext);
}
