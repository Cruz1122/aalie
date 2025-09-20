import { useMemo } from 'react';
import { DocumentationSection } from '@/types/documentation';

export const useDocumentationSections = (): DocumentationSection[] => {
  return useMemo(() => [
    {
      id: "arquitectura",
      title: "Arquitectura general",
      description: "El sistema está dividido en dos apps principales: web (Next.js + TypeScript) y api (FastAPI + Python), con paquetes compartidos (grammar, types, ui) dentro del monorepo. La comunicación se realiza vía endpoints REST expuestos por FastAPI y consumidos desde la app web.",
      image: {
        src: "/docs/arquitectura.webp",
        alt: "Arquitectura y flujo general",
        width: 1600,
        height: 900,
        caption: "Arquitectura y flujo principal (borrador)"
      }
    },
    {
      id: "ui-flujo",
      title: "Flujo de análisis en la UI",
      description: "Desde el editor hasta los resultados, pasando por validaciones y vistas.",
      image: {
        src: "/docs/ui-flujo.webp",
        alt: "Flujo de UI y resultados",
        width: 1600,
        height: 1200,
        caption: "Flujo UI: editor, tabla de costos y modal de procedimiento"
      }
    },
    {
      id: "parse-analyze",
      title: "Backend: parse y analyze",
      description: "El backend ofrece dos endpoints principales: /parse que genera un AST canónico y /analyze que evalúa costes, compone sumatorias y produce T(n) para Best/Avg/Worst usando SymPy.",
      image: {
        src: "/docs/parse-analyze.webp",
        alt: "Secuencia parse/analyze",
        width: 1600,
        height: 900,
        caption: "Secuencia de mensajes entre Web y API"
      }
    },
    {
      id: "cfg-recursion",
      title: "Visualizaciones: CFG y Recursión",
      description: "A partir del AST se generan grafos con Cytoscape para CFG y árboles recursivos.",
      image: {
        src: "/docs/cfg-recursion.webp",
        alt: "Generación de CFG y árbol de recursión",
        width: 1400,
        height: 900,
        caption: "Derivación de CFG y árbol de recursión desde el AST"
      }
    },
    {
      id: "errores",
      title: "Manejo de errores",
      description: "Estrategias diferenciadas según fallo de API, gramática o sumatoria no cerrable.",
      image: {
        src: "/docs/errores.webp",
        alt: "Estrategias de manejo de errores",
        width: 1400,
        height: 900,
        caption: "Decisiones de UI frente a errores comunes"
      }
    },
    {
      id: "llm",
      title: "Integración con LLM",
      description: "Comparativa con LLM a través de un BFF en Next, con proveedores configurables.",
      image: {
        src: "/docs/llm.webp",
        alt: "Flujo de uso de LLM",
        width: 2000,
        height: 750,
        caption: "Ruta de comparación con LLM y retorno a la UI"
      }
    },
    {
      id: "export",
      title: "Exportación de reportes",
      description: "Generación de Markdown/HTML con tabla, T(n) (LaTeX) y notas del análisis.",
      image: {
        src: "/docs/export.webp",
        alt: "Flujo de exportación de reportes",
        width: 1765,
        height: 768,
        caption: "Secuencia de exportación desde la UI"
      }
    }
  ], []);
};