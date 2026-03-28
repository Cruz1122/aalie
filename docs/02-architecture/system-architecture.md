# Arquitectura del sistema

**Tipo:** descriptiva

## Propósito

Explicar la arquitectura real de AALIE de extremo a extremo y ubicar dónde vive cada responsabilidad.

## Alcance

Cubre frontend, backend, paquetes compartidos, integración LLM y export.

## Fuente de verdad

- `apps/web/`
- `apps/api/`
- `packages/grammar/`
- `packages/types/`

## Estructura

### Vista general

AALIE es un monorepo con:

- `apps/web`: frontend Next.js 14 y BFF para proxies internos y LLM;
- `apps/api`: API FastAPI para parse, classify, analyze, trace y export;
- `packages/grammar`: gramática ANTLR, parser y AST builders TS/Python;
- `packages/types`: tipos compartidos de AST, análisis y snapshot.

### Flujo principal

`input -> parse -> classify -> analyze -> trace/export/render`

1. El usuario escribe o importa pseudocódigo en el frontend.
2. El frontend usa parseo y rutas proxy para validar y orquestar.
3. El backend parsea a AST, clasifica y ejecuta el analizador.
4. Trace y export reutilizan parse/clasificación/análisis; export concentra todo en snapshot.
5. La UI renderiza resultados, y el export usa el mismo snapshot para MD/LaTeX/PDF/ZIP.

### Responsabilidades por capa

- Frontend: interacción, almacenamiento de sesión, vistas, trace UI, consumo de APIs y BFF LLM.
- Backend: contratos deterministas del motor, trace, snapshot y render institucional.
- Paquetes compartidos: gramática, AST y tipos estables.

### Dependencias externas criticas

- ANTLR para parseo;
- SymPy para álgebra simbólica;
- Gemini para asistencia LLM opcional;
- `pdflatex` para compilación PDF.

## Ejemplos

- Un cambio de schema del snapshot impacta backend export, tipos compartidos y cualquier consumidor de UI/export.
- Un cambio en `Language.g4` impacta parser, AST, análisis, ejemplos y tests contract.

## Limites conocidos

- La arquitectura no asume que el LLM esté disponible.
- No existe una segunda fuente de verdad para export fuera del snapshot.

## Archivos relacionados

- `frontend-architecture.md`
- `backend-architecture.md`
- `analysis-engine-overview.md`
