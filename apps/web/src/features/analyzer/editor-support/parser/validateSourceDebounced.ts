import { useEffect, useState } from "react";

import type { ParseResult } from "@/hooks/useParseWorker";

import {
  mapParseErrorsToSyntaxHints,
  type SyntaxHint,
} from "./syntaxHintMapper";

export function useDebouncedSyntaxHints(
  parseResult: ParseResult,
  debounceMs = 220,
): SyntaxHint[] {
  const [hints, setHints] = useState<SyntaxHint[]>([]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setHints(mapParseErrorsToSyntaxHints(parseResult.errors));
    }, debounceMs);

    return () => clearTimeout(timeout);
  }, [parseResult.errors, debounceMs]);

  return hints;
}
