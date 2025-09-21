# Analizador de Complejidades — Monorepo

Stack principal: **Next.js + TypeScript (frontend)** y **FastAPI + Python 3.11+ (backend)**.
Este repositorio usa **pnpm workspaces** para gestionar paquetes de Node del frontend y utilidades compartidas.
El backend (Python) NO forma parte de los workspaces de pnpm.

## Requisitos
- Node.js 20 LTS
- pnpm 9.x
- Python 3.11+ (para backend en issues siguientes)
- Git

## Estructura
- apps/
  - web/     → Next.js (se agrega en la siguiente issue)
  - api/     → FastAPI (Python; se agregará posteriormente)
- packages/
  - grammar/ → Gramática ANTLR4 y codegen (TS/Py)
  - ui/      → Componentes UI compartidos
  - types/   → Tipos/Esquemas compartidos (TS/Zod)
- infra/     → Docker Compose y configs (issues siguientes)

## Workspaces pnpm
Incluyen solo `apps/web` y `packages/*` para evitar mezclar Python con Node.

## Comandos útiles
- `pnpm install`        → instala dependencias en el monorepo (hoy no hay paquetes)
- `pnpm -r build`       → construye recursivamente (aplicará cuando haya proyectos)
- `pnpm -r dev`         → desarrolla recursivamente (aplicará cuando haya proyectos)

