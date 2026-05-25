# ADR-016: Dependency overrides para cierre de seguridad

**Tipo:** decisión  
**Estado:** aceptada  
**Fecha:** 2026-05-23  
**Contexto:** Cierre de migración de dependencias (Next 14→15, React 18→19, next-intl 3→4)  

---

## Tabla de overrides

| Override | Tipo | Quién lo trae | Por qué no se actualiza el padre | Riesgo | Plan de retiro |
|----------|------|---------------|----------------------------------|--------|----------------|
| `dagre>lodash` | runtime | `dagre` (a través de `graphlib`) | dagre está congelado sin releases; reemplazo requiere validar layouts de trace | Medio | Migrar a elkjs o layout propio |
| `graphlib>lodash` | runtime | `graphlib` (dependencia de dagre) | mismo caso que dagre | Medio | Retirar al eliminar dagre |
| `monaco-editor>dompurify` | runtime | `monaco-editor` | monaco-editor v0.55.1 usa dompurify 3.2.7 (no hay versión superior de monaco) | Medio | Preferir update de monaco-editor |
| `mermaid>dompurify` | runtime | `mermaid` | mermaid v11.15.0 usa dompurify ^3.3.1 (se resuelve a parcheada) | Bajo | Retirar cuando mermaid suba |
| `fast-uri` | content schema | `ajv` (via @aa/content-catalog) | ajv v8.20.0 acepta fast-uri ^3.0.1; la línea 3.1.2 es la última parcheada | Bajo | Retirar cuando ajv suba mínimo a 8.21+ |
| `glob` | tooling | `tailwindcss > sucrase > glob`, legacy `rimraf` | tailwindcss 3.4.x usa sucrase que usa glob 10.x | Bajo | Retirar con Tailwind v4 |
| `minimatch@<4` | tooling | `@eslint/eslintrc`, `eslint > @eslint/config-array` | ESLint 9.x usa estas versiones; se forzó a 3.1.4 | Bajo | Retirar con ESLint 10 |
| `minimatch@>=9 <10` | tooling | `@typescript-eslint/typescript-estree` | TS-ESLint 8.59.4 usa minimatch 9.x; se forzó a 9.0.7 | Bajo | Retirar con TS-ESLint 9 |
| `picomatch@<3` | tooling | `micromatch` (vía tailwindcss, next) | micromatch 4.0.8 usa picomatch 2.3.1 | Bajo | Retirar con Vite/Vitest upgrade |
| `picomatch@>=4 <5` | tooling | `tinyglobby` (vía TS-ESLint) | TS-ESLint 8.59.4 usa tinyglobby con picomatch 4.0.3 | Bajo | Retirar con TS-ESLint 9 |
| `ws` | dev/tooling | `jsdom` (vía vitest) | jsdom 26.1.0 usa ws 8.x; se forzó a 8.20.1 | Bajo | Retirar con jsdom 27+ |
| `js-yaml` | tooling | `@eslint/eslintrc` | ESLint 9.x usa js-yaml 4.1.0; se forzó a 4.1.1 | Bajo | Retirar con ESLint 10 |
| `brace-expansion` | tooling | `minimatch` | minimatch 1.x usa brace-expansion 1.1.12; se forzó a 1.1.14 | Bajo | Retirar cuando minimatch suba |
| `yaml` | tooling | `postcss-load-config` (vía tailwindcss) | tailwindcss 3.4.x usa postcss-load-config con yaml 2.8.1; se forzó a 2.8.3 | Bajo | Retirar con Tailwind v4 |
| `mdast-util-to-hast` | runtime | `react-markdown` | react-markdown 10.1.0 usa mdast-util-to-hast 13.2.0; se forzó a 13.2.1 | Bajo | Retirar con react-markdown 11+ |

## Criterio de aceptación de overrides

1. Ningún override runtime sin plan de retiro documentado
2. Overrides de tooling se retiran cuando el paquete padre se actualiza
3. Overrides acotados por subárbol (`paquete>dep`) preferidos sobre globales
4. Cada override respaldado por `pnpm why` en `artifacts/security/why-*.txt`

## Moderates restantes (aceptados)

| Riesgo | Ruta | Runtime | Decisión |
|--------|------|---------|----------|
| `esbuild` | vitest → vite → esbuild | No | Aceptar hasta migrar Vitest 4 |
| `vite` | vitest → vite | No | Aceptar; tooling |
| `ajv@6.12.6` | eslint → ajv | No | Aceptar (último 6.x disponible) |
| `postcss` | Next 15.5.18 bundled | Indirecto | Aceptar temporalmente; revisar Next 16 |
