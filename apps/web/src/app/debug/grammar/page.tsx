"use client";
import {
  CharStreams,
  CommonTokenStream,
  LanguageLexer,
  LanguageParser,
  CollectingErrorListener,
} from "@aa/grammar";
import { isGrammarParseResponse } from "@aa/types";
import { useEffect, useState } from "react";

import { GrammarApiService } from "@/services/grammar-api";

// Helper function to parse expressions
function parseExpr(input: string): boolean {
  try {
    const inputStream = CharStreams.fromString(input);
    const lexer = new LanguageLexer(inputStream);
    const errors = new CollectingErrorListener();
    lexer.removeErrorListeners();
    lexer.addErrorListener(errors);

    const tokenStream = new CommonTokenStream(lexer);
    const parser = new LanguageParser(tokenStream);
    parser.removeErrorListeners();
    parser.addErrorListener(errors);

    parser.program(); // Parse as full program
    
    return errors.errors.length === 0;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export default function GrammarDebugPage() {
  const [input, setInput] = useState("(1+2)*3");
  const [localOk, setLocalOk] = useState<boolean | null>(null);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [apiAvail, setApiAvail] = useState<boolean | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    try {
      setLocalOk(parseExpr(input));
    } catch (e: unknown) {
      setLocalOk(false);
      setErr(String(e instanceof Error ? e.message : String(e)));
    }
  }, [input]);

  async function callApi() {
    setErr(null);
    setApiOk(null);
    setApiAvail(null);
    
    try {
      const data = await GrammarApiService.parseCode(input);
      
      if (isGrammarParseResponse(data)) {
        setApiOk(data.ok);
        setApiAvail(data.available ?? null);
        if (data.error) setErr(String(data.error));
      } else {
        setErr("Respuesta del backend no coincide con el contrato.");
      }
    } catch (e: unknown) {
      setErr(String(e instanceof Error ? e.message : String(e)));
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, marginBottom: 12 }}>Grammar Debug</h1>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{
          border: "1px solid #ddd",
          borderRadius: 6,
          padding: "8px 10px",
          width: 420,
          marginBottom: 12,
          color: "black",
        }}
        placeholder="(1+2)*3"
      />
      <div style={{ marginBottom: 12 }}>
        <strong>Parse local (TS):</strong>{" "}
        {localOk === null ? "—" : localOk ? "Válido" : "Inválido"}
      </div>
      <button
        onClick={callApi}
        style={{
          background: "#2563eb",
          color: "white",
          padding: "8px 12px",
          borderRadius: 6,
          border: 0,
        }}
      >
        Probar en backend (Py)
      </button>
      <div style={{ marginTop: 12 }}>
        <strong>Parse backend (Py):</strong>{" "}
        {apiOk === null ? "—" : apiOk ? "Válido" : "Inválido"}
        {apiAvail === false && (
          <span style={{ marginLeft: 8, color: "#fbbf24" }}>(aa_grammar no disponible)</span>
        )}
      </div>
      {err && <p style={{ marginTop: 12, color: "#f87171" }}>Error: {err}</p>}
    </main>
  );
}
