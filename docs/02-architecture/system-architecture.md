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

### Dependencias contractuales entre capas

- `packages/grammar` posee la gramática efectiva y el shape base que habilita parse/AST.
- `packages/types` posee los tipos compartidos exportables y el shape público del snapshot.
- `apps/api` posee el comportamiento contractual del motor, trace, snapshot builder y export.
- `apps/web` consume contratos; no redefine parse, análisis, snapshot ni trace.

### Propiedad y compatibilidad del snapshot

- el snapshot es propiedad contractual de `apps/api` y `packages/types`;
- `apps/web`, renderers de export y tests lo consumen como contrato estable;
- un cambio backward compatible puede agregar campos opcionales o nuevas subsecciones con `status`;
- un cambio incompatible incluye renombrar/remover campos públicos, alterar precedencias o cambiar semántica observable; eso exige nueva versión de schema, docs y checks;
- `internal` puede crecer solo si no rompe consumidores declarados ni se vuelve prerequisito de UI/export.

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
