"use client";

import mermaid from "mermaid";
import { useEffect, useRef } from "react";

interface MermaidDiagramProps {
  readonly diagram: string;
}

export default function MermaidDiagram({ diagram }: MermaidDiagramProps) {
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!diagram || !diagramRef.current) return;

    // Función para sanear etiquetas de nodos y evitar caracteres problemáticos
    const sanitizeDiagram = (raw: string): string => {
      // Normalizar etiquetas de flechas: evitar acentos problemáticos
      let result = raw.replaceAll("Sí", "Si");

      // Sanear textos dentro de [], (), {} para evitar caracteres realmente conflictivos
      result = result.replace(/(\[[^\]]*\]|\([^)]*\)|\{[^}]*\})/g, (match) => {
        const first = match[0];
        const last = match[match.length - 1];
        const inner = match.slice(1, -1);
        // Reemplazar solo los caracteres más problemáticos (no quitar índices ni '=')
        const cleaned = inner.replaceAll(/[?(),;]/g, " ");
        return `${first}${cleaned}${last}`;
      });

      return result;
    };

    const safeDiagram = sanitizeDiagram(diagram);

    // Inicializar Mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "loose",
      fontFamily: "inherit",
    });

    // Limpiar contenido anterior
    diagramRef.current.innerHTML = "";

    // Crear un ID único para este diagrama
    const id = `mermaid-${Date.now()}`;

    // Renderizar el diagrama
    mermaid
      .render(id, safeDiagram)
      .then((result) => {
        if (diagramRef.current) {
          diagramRef.current.innerHTML = result.svg;
        }
      })
      .catch((error) => {
        console.error("Error rendering Mermaid diagram:", error);
        if (diagramRef.current) {
          diagramRef.current.innerHTML = `<div class="text-red-400 text-sm p-4">Error al renderizar el diagrama: ${error.message}</div>`;
        }
      });
  }, [diagram]);

  if (!diagram) {
    return (
      <div className="text-slate-400 text-sm p-4 text-center">
        No hay diagrama disponible
      </div>
    );
  }

  return (
    <div
      ref={diagramRef}
      className="mermaid-diagram flex items-center justify-center p-4 overflow-auto"
    />
  );
}

