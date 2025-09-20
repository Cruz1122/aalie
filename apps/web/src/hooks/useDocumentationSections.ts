import { useMemo } from 'react';
import { DocumentationSection } from '@/types/documentation';

export const useDocumentationSections = (): DocumentationSection[] => {
  return useMemo(() => [
    {
      id: "arquitectura",
      title: "Arquitectura general",
      description:
        "Monorepo con web (Next.js+TS) y api (FastAPI+Py 3.11), más packages compartidos (grammar, types, ui). La web consume REST del backend (/parse para AST canónico, /analyze para conteos y T(n), /health) y expone un BFF /api/llm/compare para el LLM (Gemini u OpenAI, por env). Procesamiento sin estado: sin BD ni persistencia; todo en memoria por solicitud; desarrollo con Docker Compose.",
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
      description:
        "El usuario escribe en Monaco (validación inmediata con parser TS en Web Worker); tras una pausa se llama a /parse y, con AST válido, a /analyze. La vista muestra código numerado, tabla de costos (C_k, #ejec, costo) y panel de visualizaciones; el modal ‘Procedimiento’ (Best/Avg/Worst) incluye supuestos, pasos en LaTeX con scroll horizontal y T(n) final; desde allí se dispara la comparación con el LLM.",
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
      description:
        "/parse usa ANTLR (Python) para devolver un AST canónico o errores con línea/columna; /analyze recibe el AST y opciones (C_k, modo, promedio), aplica reglas de conteo por línea, arma sumatorias y las cierra con SymPy para producir T_best/T_avg/T_worst con pasos en LaTeX y formas cerradas, sin almacenar código ni resultados.",
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
      description:
        "Desde el AST canónico se generan el CFG (bloques y flujo) y, si aplica, el árbol de recursión; ambos se renderizan con Cytoscape.js y se sincronizan con las líneas del código para trazabilidad y comprensión del origen de los términos de T(n).",
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
      description:
        "API caída → UX limitada con parser cliente y banner; gramática inválida → errores con línea/columna y sugerencias del LLM; sumatoria no cerrable → se muestra sumatoria abierta con recomendaciones (rango, cambio de variable, particiones) y diagnóstico asistido por LLM; no hay BD y los logs son técnicos y temporales.",
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
      description:
        "El LLM es parte del flujo: corrige gramática, reconoce patrones y estima T(n) con explicación; la web llama al BFF /api/llm/compare que invoca Gemini u OpenAI según variables de entorno y la UI muestra la comparativa (coincidencias, diferencias y supuestos).",
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
      description:
        "Exporta Markdown/HTML con tabla por línea, pasos en LaTeX y T(n) final para Best/Avg/Worst (opcionalmente con resumen de la comparativa LLM); la exportación no persiste datos y el archivo se genera y descarga al instante.",
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
