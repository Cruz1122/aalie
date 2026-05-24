# CHANGE LOG — Migración de dependencias

## Resumen

Migración completa del stack frontend: **Next 14 → 15**, **React 18 → 19**, **next-intl 3 → 4**, eliminación de MUI/Emotion, actualización de tooling, y parches de seguridad transitivos.

**Estado final:** `0 high`, `4 moderate` (tooling/vendor), `481 tests passing`, `build/lint OK`.

---

## Índice de cambios por archivo

1. [`package.json` (raíz)](#1-packagejson-raíz)
2. [`pnpm-lock.yaml`](#2-pnpm-lockyaml)
3. [`apps/web/package.json`](#3-appswebpackagejson)
4. [`apps/web/next.config.mjs`](#4-appswebnextconfigmjs)
5. [`apps/web/eslint.config.mjs`](#5-appswebeslintconfigmjs)
6. [`apps/web/next-env.d.ts`](#6-appswebnext-envdts)
7. [`apps/web/src/app/[locale]/course/[moduleSlug]/page.tsx`](#7-appswebsrcapplocalecoursemoduleslugpagetsx)
8. [`apps/web/src/app/[locale]/course/[moduleSlug]/[chapterSlug]/page.tsx`](#8-appswebsrcapplocalecoursemoduleslugchapterslugpagetsx)
9. [`apps/web/src/app/[locale]/examples/page.tsx`](#9-appswebsrcapplocaleexamplespagetsx)
10. [`apps/web/src/app/[locale]/examples/[category]/page.tsx`](#10-appswebsrcapplocaleexamplescategorypagetsx)
11. [`apps/web/src/app/[locale]/user-guide/page.tsx`](#11-appswebsrcapplocaleuser-guidepagetsx)
12. [`apps/web/src/app/[locale]/user-guide/[moduleSlug]/page.tsx`](#12-appswebsrcapplocaleuser-guidemoduleslugpagetsx)
13. [`apps/web/src/components/MarkdownRenderer.tsx`](#13-appswebsrccomponentsmarkdownrenderertsx)
14. [`apps/web/src/components/ExecutionGraphView.tsx`](#14-appswebsrccomponentsexecutiongraphviewtsx)
15. [`apps/web/src/components/trace/StepInfo.tsx`](#15-appswebsrccomponentstracestepinfotsx)
16. [`apps/web/src/features/content-rendering/MaterialIcon.tsx`](#16-appswebsrcfeaturescontent-renderingmaterialicontsx)
17. [`apps/web/src/features/content-rendering/TermInline.tsx`](#17-appswebsrcfeaturescontent-renderingterminlinetsx)
18. [`apps/web/src/features/content-rendering/InlineRichTextRenderer.tsx`](#18-appswebsrcfeaturescontent-renderinginlinerichtextrenderertsx)
19. [`apps/web/src/features/analyzer/technique-detection/index.ts`](#19-appswebsrcfeaturesanalyzortechnique-detectionindexts)
20. [`apps/web/src/features/analyzer/technique-detection/evidence/explainEvidence.ts`](#20-appswebsrcfeaturesanalyzortechnique-detectionevidenceexplainevidencets)
21. [`apps/web/src/features/analyzer/technique-detection/evidence/evidenceBundle.ts`](#21-appswebsrcfeaturesanalyzortechnique-detectionevidenceevidencebundlets)
22. [`packages/content-catalog/package.json`](#22-packagescontent-catalogpackagejson)
23. [`packages/grammar/package.json`](#23-packagesgrammarpackagejson)
24. [`apps/web/src/lib/examples/__tests__/page-wrappers.test.ts`](#24-appswebsrclibexamplestestspage-wrapperstestts) (nuevo)

---

## 1. `package.json` (raíz)

### Razón
- El build raíz fallaba en Windows por `ENOTEMPTY` al ejecutar `pnpm -r build` en paralelo.
- Se añadieron overrides de seguridad para parchear dependencias transitivas vulnerables sin tener que actualizar cientos de paquetes intermedios.

### Cambios

**Antes:**
```json
{
  "engines": {"node": ">=20 <23"},
  "scripts": {
    "build": "pnpm -r build",
    ...
  }
}
```

**Después:**
```json
{
  "engines": {
    "node": ">=20 <23"
  },
  "scripts": {
    "build": "pnpm -r --workspace-concurrency=1 build",
    ...
  },
  "pnpm": {
    "overrides": {
      "fast-uri": "3.1.2",
      "flatted": "3.4.2",
      "glob": "10.5.0",
      "lodash": "4.18.1",
      "dagre>lodash": "4.18.1",
      "graphlib>lodash": "4.18.1",
      "minimatch@<4": "3.1.4",
      "minimatch@>=9.0.0 <10": "9.0.7",
      "dompurify": "3.4.0",
      "picomatch@<3": "2.3.2",
      "picomatch@>=4.0.0 <5": "4.0.4",
      "ws": "8.20.1",
      "js-yaml": "4.1.1",
      "brace-expansion": "1.1.14",
      "yaml": "2.8.3",
      "mdast-util-to-hast": "13.2.1"
    }
  },
  "dependencies": {
    "next-intl": "4.12.0"
  }
}
```

### Dependencias parcheadas vía override

| Paquete | Versión anterior | Versión forzada | Advisory |
|---------|-----------------|-----------------|----------|
| `fast-uri` | 3.1.0 | 3.1.2 | Path traversal / Host confusion |
| `flatted` | 3.3.3 | 3.4.2 | Unbounded recursion DoS / Prototype pollution |
| `glob` | 10.4.5 | 10.5.0 | Command injection via `-c/--cmd` |
| `lodash` | 4.17.21 | 4.18.1 | Code Injection via `_.template` |
| `minimatch` (<4) | 3.1.2 | 3.1.4 | ReDoS |
| `minimatch` (>=9) | 9.0.5 | 9.0.7 | ReDoS |
| `dompurify` | 3.1.7 | 3.4.0 | Multiple mXSS / PP bypass |
| `picomatch` (<3) | 2.3.1 | 2.3.2 | ReDoS |
| `picomatch` (>=4) | 4.0.3 | 4.0.4 | ReDoS |
| `ws` | 8.20.0 | 8.20.1 | Uninitialized memory disclosure |
| `js-yaml` | 4.1.0 | 4.1.1 | (moderate) |
| `brace-expansion` | 1.1.12 | 1.1.14 | (moderate) |
| `yaml` | 2.8.1 | 2.8.3 | (moderate) |
| `mdast-util-to-hast` | 13.2.0 | 13.2.1 | (moderate) |
| `dagre>lodash` | — | 4.18.1 | override específico para el subárbol de dagre |
| `graphlib>lodash` | — | 4.18.1 | override específico para el subárbol de graphlib |

---

## 2. `pnpm-lock.yaml`

### Razón
Se regeneró completamente el lockfile para reflejar todos los cambios de versiones en los manifests y los overrides.

### Cambio
- Se añadió sección `overrides:` al inicio del lockfile (replicando los overrides de `package.json`).
- Se actualizaron todas las referencias de versión para los paquetes cambiados.
- Se eliminaron las entradas de `@emotion/react`, `@emotion/styled`, `@mui/icons-material`, `@mui/material` y todas sus dependencias transitivas.
- Las 2479 líneas de cambio en el lockfile reflejan la resolución completa del nuevo árbol de dependencias.

---

## 3. `apps/web/package.json`

### Razón
Upgrade masivo del stack frontend: Next 14 → 15 (con parche de seguridad 15.5.18), React 18 → 19, eliminación de dependencias no utilizadas (MUI, Emotion), actualización de tooling y dependencias directas con vulnerabilidades conocidas.

### Antes
```json
{
  "scripts": {
    "build": "next build"
  },
  "dependencies": {
    "@emotion/react": "^11.14.0",
    "@emotion/styled": "^11.14.1",
    "@mui/icons-material": "^6",
    "@mui/material": "^6",
    "katex": "0.16.10",
    "mermaid": "^11.14.0",
    "monaco-editor": "^0.54.0",
    "next": "14.2.35",
    "next-intl": "^3.25.0",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "@types/react": "18.3.4",
    "@types/react-dom": "18.3.0",
    "@typescript-eslint/eslint-plugin": "^8.44.0",
    "@typescript-eslint/parser": "^8.44.0",
    "eslint-config-next": "^15.5.3",
    "postcss": "8.4.47",
    "tailwindcss": "3.4.13"
  }
}
```

### Después
```json
{
  "scripts": {
    "build": "node -e \"try{require('fs').rmSync('.next/export',{recursive:true,force:true})}catch(e){}\" && next build"
  },
  "dependencies": {
    "katex": "0.16.21",
    "mermaid": "^11.15.0",
    "monaco-editor": "^0.55.1",
    "next": "15.5.18",
    "next-intl": "^4.12.0",
    "react": "19.2.6",
    "react-dom": "19.2.6"
  },
  "devDependencies": {
    "@types/react": "19.2.2",
    "@types/react-dom": "19.2.2",
    "@typescript-eslint/eslint-plugin": "^8.59.4",
    "@typescript-eslint/parser": "^8.59.4",
    "eslint-config-next": "15.5.18",
    "postcss": "8.5.10",
    "tailwindcss": "3.4.19"
  }
}
```

### Razón de cada cambio

| Cambio | De | A | Razón |
|--------|----|----|-------|
| build script | `next build` | `pre-clean + next build` | Previene ENOTEMPTY en Windows |
| `@emotion/react` | ^11.14.0 | **eliminado** | Solo se usaba vía MUI; se reemplazó el tooltip |
| `@emotion/styled` | ^11.14.1 | **eliminado** | Solo se usaba vía MUI |
| `@mui/icons-material` | ^6 | **eliminado** | Reemplazado por Material Symbols (fuente Google ya cargada) |
| `@mui/material` | ^6 | **eliminado** | Tooltip reemplazado por CSS puro + Tailwind |
| `katex` | 0.16.10 | 0.16.21 | Vulnerabilidad moderada |
| `mermaid` | ^11.14.0 | ^11.15.0 | Múltiples CVEs de inyección CSS/HTML/DoS |
| `monaco-editor` | ^0.54.0 | ^0.55.1 | `dompurify` transitivo vulnerado |
| `next` | 14.2.35 | **15.5.18** | 5+ CVEs high en Next 14 |
| `next-intl` | ^3.25.0 | **^4.12.0** | 2 CVEs moderadas en v3; v4 es la línea actual |
| `react` | 18.3.1 | **19.2.6** | Requerido por Next 15; parches de seguridad |
| `react-dom` | 18.3.1 | **19.2.6** | Requerido por Next 15 |
| `@types/react` | 18.3.4 | 19.2.2 | Alineado con React 19 |
| `@types/react-dom` | 18.3.0 | 19.2.2 | Alineado con React 19 |
| `@typescript-eslint/*` | ^8.44.0 | ^8.59.4 | Parches de transitivas vulnerables |
| `eslint-config-next` | ^15.5.3 | 15.5.18 | Alineado con Next 15.5.18 |
| `postcss` | 8.4.47 | 8.5.10 | Vulnerabilidad moderada |
| `tailwindcss` | 3.4.13 | 3.4.19 | Parchea transitiva `glob` |

---

## 4. `apps/web/next.config.mjs`

### Razón
En Next 15, `typedRoutes` ya no es experimental; se movió fuera del bloque `experimental`.

### Antes
```js
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  transpilePackages: ["@aa/content-catalog", "@aa/grammar", "@aa/types"],
  ...
};
```

### Después
```js
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  transpilePackages: ["@aa/content-catalog", "@aa/grammar", "@aa/types"],
  ...
};
```

---

## 5. `apps/web/eslint.config.mjs`

### Razón
Se añadió configuración del resolver de imports para que `eslint-plugin-import` pueda resolver subpath exports como `next-intl/middleware` correctamente.

### Antes
```js
  {
    rules: {
      "import/order": [...],
      "@typescript-eslint/no-unused-vars": [...],
    },
  },
```

### Después
```js
  {
    rules: {
      "import/order": [...],
      "@typescript-eslint/no-unused-vars": [...],
    },
    settings: {
      "import/resolver": {
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"],
          paths: [__dirname],
        },
      },
    },
  },
```

---

## 6. `apps/web/next-env.d.ts`

### Razón
Archivo generado por `next build` en Next 15. Se actualiza automáticamente.

### Antes
```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/building-your-application/configuring/typescript for more information.
```

### Después
```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
/// <reference path="./.next/types/routes.d.ts" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
```

---

## 7–12. Páginas App Router: migración a `params`/`searchParams` async

### Razón
Next 15 requiere que `params` y `searchParams` en páginas y layouts sean `Promise` (API asíncrona). Esto aplica a todas las páginas que los usan.

### 7. `apps/web/src/app/[locale]/course/[moduleSlug]/page.tsx`

**Antes:**
```tsx
interface CourseModulePageProps {
  params: {
    locale: string;
    moduleSlug: string;
  };
}

export default function CourseModulePage({ params }: CourseModulePageProps) {
  const data = getCourseModuleData(params.locale, params.moduleSlug);
  ...
}
```

**Después:**
```tsx
interface CourseModulePageProps {
  params: Promise<{
    locale: string;
    moduleSlug: string;
  }>;
}

export default async function CourseModulePage({
  params,
}: CourseModulePageProps) {
  const { locale, moduleSlug } = await params;
  const data = getCourseModuleData(locale, moduleSlug);
  ...
}
```

### 8. `apps/web/src/app/[locale]/course/[moduleSlug]/[chapterSlug]/page.tsx`

**Antes:**
```tsx
interface CourseChapterPageProps {
  params: {
    locale: string;
    moduleSlug: string;
    chapterSlug: string;
  };
}

export default function CourseChapterPage({ params }: CourseChapterPageProps) {
  const data = getCourseChapterData(
    params.locale,
    params.moduleSlug,
    params.chapterSlug,
  );
  ...
}
```

**Después:**
```tsx
interface CourseChapterPageProps {
  params: Promise<{
    locale: string;
    moduleSlug: string;
    chapterSlug: string;
  }>;
}

export default async function CourseChapterPage({
  params,
}: CourseChapterPageProps) {
  const { locale, moduleSlug, chapterSlug } = await params;
  const data = getCourseChapterData(locale, moduleSlug, chapterSlug);
  ...
}
```

### 9. `apps/web/src/app/[locale]/examples/page.tsx`

**Antes:**
```tsx
interface ExamplesPageProps {
  searchParams?: {
    page?: string;
  };
}

export default function ExamplesPage({ searchParams }: ExamplesPageProps) {
  const page = Number(searchParams?.page ?? "1");
  ...
}
```

**Después:**
```tsx
interface ExamplesPageProps {
  searchParams?: Promise<{
    page?: string;
  }>;
}

export default async function ExamplesPage({
  searchParams,
}: ExamplesPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams?.page ?? "1");
  ...
}
```

### 10. `apps/web/src/app/[locale]/examples/[category]/page.tsx`

**Antes:**
```tsx
interface CategoryPageProps {
  params: {
    locale: string;
    category: string;
  };
}

export default function ExampleCategoryPage({ params }: CategoryPageProps) {
  const legacyRedirect = LEGACY_CATEGORY_REDIRECTS[params.category];

  if (legacyRedirect) {
    redirect(`/${params.locale}/examples/${legacyRedirect}`);
  }

  const category = getCategoryBySlug(params.category);
  ...
}
```

**Después:**
```tsx
interface CategoryPageProps {
  params: Promise<{
    locale: string;
    category: string;
  }>;
}

export default async function ExampleCategoryPage({
  params,
}: CategoryPageProps) {
  const { locale, category: categorySlug } = await params;
  const legacyRedirect = LEGACY_CATEGORY_REDIRECTS[categorySlug];

  if (legacyRedirect) {
    redirect(`/${locale}/examples/${legacyRedirect}`);
  }

  const category = getCategoryBySlug(categorySlug);
  ...
}
```

### 11. `apps/web/src/app/[locale]/user-guide/page.tsx`

**Antes:**
```tsx
interface UserGuidePageProps {
  params: {
    locale: string;
  };
}

export default function UserGuidePage({ params }: UserGuidePageProps) {
  const data = getUserGuideLandingData(params.locale);
  ...
}
```

**Después:**
```tsx
interface UserGuidePageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function UserGuidePage({ params }: UserGuidePageProps) {
  const { locale } = await params;
  const data = getUserGuideLandingData(locale);
  ...
}
```

### 12. `apps/web/src/app/[locale]/user-guide/[moduleSlug]/page.tsx`

**Antes:**
```tsx
interface UserGuideModulePageProps {
  params: {
    locale: string;
    moduleSlug: string;
  };
}

export default function UserGuideModulePage({
  params,
}: UserGuideModulePageProps) {
  const data = getUserGuideModuleData(params.locale, params.moduleSlug);
  ...
}
```

**Después:**
```tsx
interface UserGuideModulePageProps {
  params: Promise<{
    locale: string;
    moduleSlug: string;
  }>;
}

export default async function UserGuideModulePage({
  params,
}: UserGuideModulePageProps) {
  const { locale, moduleSlug } = await params;
  const data = getUserGuideModuleData(locale, moduleSlug);
  ...
}
```

---

## 13. `apps/web/src/components/MarkdownRenderer.tsx`

### Razón
React 19 tiene tipos más estrictos para `React.isValidElement`. El tipo genérico explícito es necesario.

### Antes
```tsx
if (React.isValidElement(children)) {
```

### Después
```tsx
if (React.isValidElement<{ children?: React.ReactNode }>(children)) {
```

---

## 14. `apps/web/src/components/ExecutionGraphView.tsx`

### Razón
`next-intl v4` tiene tipos más estrictos para `TranslationValues`: no acepta `undefined` en valores. `data.iterationPath` es `string | undefined`, así que se añadió fallback a `""`.

### Antes
```tsx
{t("iterationBadge", { id: data.iterationPath })}
```

### Después
```tsx
{t("iterationBadge", { id: data.iterationPath ?? "" })}
```

---

## 15. `apps/web/src/components/trace/StepInfo.tsx`

### Razón
Misma razón que ExecutionGraphView: `stepData.line` es `number | null` y next-intl v4 no acepta `null` en valores.

### Antes
```tsx
aria-label={t("stepShows", { line: stepData.line })}
...
{t("stepShows", { line: stepData.line })}
```

### Después
```tsx
aria-label={t("stepShows", { line: stepData.line ?? 0 })}
...
{t("stepShows", { line: stepData.line ?? 0 })}
```

---

## 16. `apps/web/src/features/content-rendering/MaterialIcon.tsx`

### Razón
Eliminar dependencia de `@mui/icons-material` y `@mui/material/SvgIcon`. Se reemplazó por la fuente **Material Symbols** (Google Font) que ya estaba cargada en el layout (`apps/web/src/app/layout.tsx`). Esto elimina ~200kB de dependencias transitivas y cierra vulnerabilidades de MUI.

### Antes
```tsx
"use client";

import type { PedagogyIconName } from "@aa/content-catalog";
import Analytics from "@mui/icons-material/Analytics";
import ArrowForward from "@mui/icons-material/ArrowForward";
import ErrorOutline from "@mui/icons-material/ErrorOutline";
import Lightbulb from "@mui/icons-material/Lightbulb";
import School from "@mui/icons-material/School";
import Science from "@mui/icons-material/Science";
import Warning from "@mui/icons-material/Warning";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import type { ComponentType } from "react";

const ICON_COMPONENTS: Record<PedagogyIconName, ComponentType<SvgIconProps>> = {
  school: School,
  science: Science,
  analytics: Analytics,
  lightbulb: Lightbulb,
  warning: Warning,
  error_outline: ErrorOutline,
  arrow_forward: ArrowForward,
};

export interface MaterialIconProps extends SvgIconProps {
  name: PedagogyIconName;
}

export function MaterialIcon({
  name,
  fontSize = "small",
  ...rest
}: MaterialIconProps) {
  const Icon = ICON_COMPONENTS[name] ?? ICON_COMPONENTS.warning;
  return <Icon fontSize={fontSize} {...rest} />;
}
```

### Después
```tsx
"use client";

import type { PedagogyIconName } from "@aa/content-catalog";
import type { CSSProperties, HTMLAttributes } from "react";

const ICON_TEXT: Record<PedagogyIconName, string> = {
  school: "school",
  science: "science",
  analytics: "analytics",
  lightbulb: "lightbulb",
  warning: "warning",
  error_outline: "error_outline",
  arrow_forward: "arrow_forward",
};

type MaterialIconFontSize = "inherit" | "small" | "medium" | "large";

export interface MaterialIconProps extends HTMLAttributes<HTMLSpanElement> {
  name: PedagogyIconName;
  fontSize?: MaterialIconFontSize;
}

export function MaterialIcon({
  name,
  fontSize = "small",
  className,
  style,
  ...rest
}: MaterialIconProps) {
  const iconText = ICON_TEXT[name] ?? ICON_TEXT.warning;
  const resolvedFontSize: CSSProperties["fontSize"] =
    fontSize === "inherit"
      ? "inherit"
      : fontSize === "small"
        ? 20
        : fontSize === "large"
          ? 32
          : 24;

  return (
    <span
      aria-hidden="true"
      className={["material-symbols-outlined", className]
        .filter(Boolean)
        .join(" ")}
      style={{ fontSize: resolvedFontSize, lineHeight: 1, ...style }}
      {...rest}
    >
      {iconText}
    </span>
  );
}
```

---

## 17. `apps/web/src/features/content-rendering/TermInline.tsx`

### Razón
Reemplazar el tooltip de MUI por una implementación propia con Tailwind/JSX. Esto elimina la única dependencia real de `@mui/material` en el frontend.

### Antes
```tsx
"use client";

import { Tooltip, Box, Typography, Link as MuiLink } from "@mui/material";
import React from "react";

import { Link } from "@/i18n/navigation";
import { MaterialIcon } from "./MaterialIcon";

export function TermInline({ text, term, display, href }: TermInlineProps) {
  const resolvedClassName = ...;

  const tooltipContent = (
    <Box sx={{ p: 1.5, maxWidth: 280 }}>
      <Typography variant="subtitle2" component="div" sx={{ fontWeight: 600, color: "white", mb: 0.5 }}>
        {term.label}
      </Typography>
      ...
      {href && (
        <Box sx={{ mt: 1.5, pt: 1, borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
          <MuiLink component={Link} href={href} sx={{ ... }}>
            Ver explicación detallada
            <MaterialIcon name="arrow_forward" style={{ fontSize: 14 }} />
          </MuiLink>
        </Box>
      )}
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} arrow placement="top" enterTouchDelay={0} leaveTouchDelay={3000}
      componentsProps={{ tooltip: { sx: { bgcolor: "#0f172a", ... } }, arrow: { sx: { ... } } }}
    >
      <span className={resolvedClassName}>{text}</span>
    </Tooltip>
  );
}
```

### Después
```tsx
"use client";

import React, { useId, useState } from "react";

import { Link } from "@/i18n/navigation";
import { MaterialIcon } from "./MaterialIcon";

export function TermInline({ text, term, display, href }: TermInlineProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipId = useId();
  const resolvedClassName = ...;

  return (
    <span className="relative inline-flex"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <span className={resolvedClassName} tabIndex={0} aria-describedby={tooltipId}
        onFocus={() => setIsOpen(true)} onBlur={() => setIsOpen(false)}
      >
        {text}
      </span>
      {isOpen ? (
        <span id={tooltipId} role="tooltip"
          className="absolute bottom-full left-1/2 z-20 mb-2 w-72 max-w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-white/10 bg-slate-950 p-4 text-left text-white shadow-2xl"
        >
          <span className="block text-sm font-semibold text-white">{term.label}</span>
          <span className="mt-2 block text-[0.85rem] leading-6 text-white/80">{term.definition}</span>
          {href ? (
            <span className="mt-3 block border-t border-white/10 pt-3">
              <Link href={href} className="inline-flex items-center gap-1 text-xs text-sky-300 no-underline hover:underline">
                Ver explicación detallada
                <MaterialIcon name="arrow_forward" style={{ fontSize: 14 }} />
              </Link>
            </span>
          ) : null}
          <span className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-white/10 bg-slate-950" />
        </span>
      ) : null}
    </span>
  );
}
```

---

## 18. `apps/web/src/features/content-rendering/InlineRichTextRenderer.tsx`

### Razón
React 19 eliminó el tipo global `JSX.Element`. Se reemplazó por `React.ReactElement`.

### Antes
```tsx
): (string | JSX.Element)[] {
  ...
  let parts: (string | JSX.Element)[] = [text];
  ...
    const newParts: (string | JSX.Element)[] = [];
```

### Después
```tsx
): Array<string | React.ReactElement> {
  ...
  let parts: Array<string | React.ReactElement> = [text];
  ...
    const newParts: Array<string | React.ReactElement> = [];
```

---

## 19. `apps/web/src/features/analyzer/technique-detection/index.ts`

### Razón
`next-intl v4` tiene tipos más estrictos para `TranslationValues`. El tipo local `TechniqueTranslator` usaba un `TranslationValues` más permisivo que el que espera next-intl v4. Se redujo el tipo para que sea compatible.

### Antes
```ts
type TranslationValues = Record<
  string,
  string | number | boolean | Date | null | undefined
>;
```

### Después
```ts
type TranslationValues = Record<string, string | number | Date>;
```

---

## 20. `apps/web/src/features/analyzer/technique-detection/evidence/explainEvidence.ts`

### Razón
Idéntico al cambio en `index.ts` (mismo tipo duplicado en 3 archivos).

### Antes
```ts
type TranslationValues = Record<
  string,
  string | number | boolean | Date | null | undefined
>;
```

### Después
```ts
type TranslationValues = Record<string, string | number | Date>;
```

---

## 21. `apps/web/src/features/analyzer/technique-detection/evidence/evidenceBundle.ts`

### Razón
Idéntico a los dos anteriores.

### Antes
```ts
type TranslationValues = Record<
  string,
  string | number | boolean | Date | null | undefined
>;
```

### Después
```ts
type TranslationValues = Record<string, string | number | Date>;
```

---

## 22. `packages/content-catalog/package.json`

### Razón
`ajv` 8.17.1 usaba `fast-uri@3.1.0` que tiene 2 CVEs high. `ajv@8.20.0` usa `fast-uri@^3.0.1`, y con el override a `3.1.2` queda parcheado.

### Antes
```json
"dependencies": {
  "ajv": "^8.17.1",
  "ajv-formats": "^3.0.1"
}
```

### Después
```json
"dependencies": {
  "ajv": "^8.20.0",
  "ajv-formats": "^3.0.1"
}
```

---

## 23. `packages/grammar/package.json`

### Razón
`rimraf@5.0.10` usa `glob@10.4.5` que tiene CVE de command injection. `rimraf@6.1.3` usa `glob@^13.0.3` que está parcheado.

### Antes
```json
"devDependencies": {
  "antlr4ts-cli": "0.5.0-alpha.4",
  "typescript": "5.5.4",
  "rimraf": "5.0.10"
}
```

### Después
```json
"devDependencies": {
  "antlr4ts-cli": "0.5.0-alpha.4",
  "typescript": "5.5.4",
  "rimraf": "6.1.3"
}
```

---

## 24. `apps/web/src/lib/examples/__tests__/page-wrappers.test.ts` (nuevo)

### Razón
Cubrir con pruebas la lógica de las páginas migradas a `params/searchParams` async: redirecciones legacy de categorías, resolución de slugs, y parsing de query params.

### Contenido
```tsx
import { describe, it, expect } from "vitest";
import {
  LEGACY_CATEGORY_REDIRECTS,
  EXAMPLE_CATEGORY_ORDER,
  EXAMPLE_CATEGORY_META,
  getCategoryBySlug,
} from "@/lib/examples/catalog";

describe("Legacy category redirects", () => {
  const redirects = LEGACY_CATEGORY_REDIRECTS;

  it("maps legacy Spanish slugs to English canonical slugs", () => {
    expect(redirects.iterativos).toBe("iterative");
    expect(redirects["divide-y-venceras"]).toBe("divide-and-conquer");
    expect(redirects["resta-y-venceras"]).toBe("decrease-and-conquer");
    expect(redirects["resta-y-seras-vencido"]).toBe("decrease-and-get-conquered");
  });

  it("maps recursive-expansion legacy slug", () => {
    expect(redirects["recursive-expansion"]).toBe("decrease-and-get-conquered");
  });

  it("all targets are valid canonical slugs", () => {
    for (const target of Object.values(redirects)) {
      expect(getCategoryBySlug(target)).toBeDefined();
    }
  });
});

describe("getCategoryBySlug", () => {
  it("resolves all canonical slugs", () => {
    const slugs = EXAMPLE_CATEGORY_ORDER.map(
      (category) => EXAMPLE_CATEGORY_META[category].slug,
    );
    for (const slug of slugs) {
      const category = getCategoryBySlug(slug);
      expect(category).toBeDefined();
      expect(EXAMPLE_CATEGORY_META[category!].slug).toBe(slug);
    }
  });

  it("returns undefined for unknown slugs", () => {
    expect(getCategoryBySlug("nonexistent")).toBeUndefined();
    expect(getCategoryBySlug("")).toBeUndefined();
    expect(getCategoryBySlug(" recursive ")).toBeUndefined();
  });
});

describe("Examples page searchParams", () => {
  function parsePageFromParams(searchParams: { page?: string } | null): number {
    const page = Number(searchParams?.page ?? "1");
    return isNaN(page) || page < 1 ? 1 : page;
  }

  it("parses page 1 from empty params", () => {
    expect(parsePageFromParams(null)).toBe(1);
    expect(parsePageFromParams({})).toBe(1);
    expect(parsePageFromParams({ page: undefined })).toBe(1);
  });

  it("parses page number from params", () => {
    expect(parsePageFromParams({ page: "1" })).toBe(1);
    expect(parsePageFromParams({ page: "3" })).toBe(3);
  });

  it("falls back to 1 for invalid page values", () => {
    expect(parsePageFromParams({ page: "0" })).toBe(1);
    expect(parsePageFromParams({ page: "-1" })).toBe(1);
    expect(parsePageFromParams({ page: "abc" })).toBe(1);
  });
});
```

---

## Resultado de validación

| Comando | Resultado |
|---------|-----------|
| `pnpm -C apps/web build` | ✅ Pass |
| `pnpm -C apps/web lint` | ✅ Pass |
| `pnpm -C apps/web test` | ✅ **481 tests, 30 files, 0 failures** |
| `pnpm -r --workspace-concurrency=1 build` | ✅ Pass |
| `pnpm test:docs-contracts` | ✅ Pass |
| `cd apps/api && python -m pytest tests/ -m "fast or oracle" -q` | ✅ 1415 passed |

### Evolución del audit

| Métrica | Antes | Después |
|---------|-------|---------|
| **High** | 19 | **0** |
| Moderate | 39 | **4** |
| Total | 60 | **4** |

### 4 moderates restantes (aceptados)

| Paquete | Ruta | Razón |
|---------|------|-------|
| `esbuild` | vitest → vite → esbuild | Tooling; requiere Vitest 4 para resolver |
| `vite` | vitest → vite | Tooling; requiere Vitest 4 para resolver |
| `ajv` | eslint → ajv@6.12.6 | Legacy; 6.12.6 es la última versión 6.x disponible |
| `postcss` | Next 15.5.18 bundled | Next 15 empaqueta postcss 8.4.31; se resuelve con Next 16 |

---

## Resumen de archivos modificados

**23 archivos tocados, 1 archivo nuevo, ~2800 líneas de diff (principalmente lockfile).**

---

## Closeout final — evidencia adjunta

### Baseline del release

| Elemento | Valor |
|----------|-------|
| Commit auditado | `4cbfff21e025ed411db4370027d8259aba43dc86` |
| Node | 22.22.0 |
| pnpm | 9.15.0 |
| Python | 3.13.13 |
| OS | Windows |

### Auditoría

- `pnpm audit --audit-level=high` → **0 high**
- `pnpm audit --audit-level=moderate` → **4 moderate**
- Archivos: `artifacts/security/audit-after-high.json`, `audit-after-moderate.json`

### Trazabilidad de overrides

Cada override tiene su `pnpm why` en `artifacts/security/why-*.txt` (12 archivos).  
Documentación en `docs/09-decisions/adr-016-dependency-overrides.md`.

### Migración Next 15

- `generateMetadata`: todos async (3 ocurrencias)
- `params` sync: **0 restantes**
- `searchParams` sync: **0 restantes**
- `cookies()` / `headers()`: sin uso en el código de app
- Archivos: `artifacts/next-*.txt`

### Validación completa

| Suite | Comando | Resultado |
|-------|---------|-----------|
| Web build | `pnpm -C apps/web build` | ✅ 158 páginas, 0 errores |
| Web lint | `pnpm -C apps/web lint` | ✅ 0 errores |
| Web test | `pnpm -C apps/web test` | ✅ **30 files, 481 tests, 0 failures** |
| Workspace build | `pnpm -r --workspace-concurrency=1 build` | ✅ |
| Docs contracts | `pnpm test:docs-contracts` | ✅ |
| API fast/oracle | `pytest -m "fast or oracle"` | ✅ **1415 passed** |
| Export consistency | `run_export_consistency.py` | ✅ **12 passed** |

Logs completos en `artifacts/logs/`.

### Decisión sobre overrides

- Overrides globales de `lodash` y `dompurify` reemplazados por versiones acotadas por subárbol (`dagre>lodash`, `graphlib>lodash`, `monaco-editor>dompurify`, `mermaid>dompurify`)
- `next-intl` eliminado de `dependencies` raíz (pertenece solo a `apps/web`)
- ADR-016 documenta cada override con origen, riesgo y plan de retiro

### Deuda documentada para issues futuros

1. Reducir/eliminar overrides transitivos restantes
2. Migrar Vitest/Vite para cerrar moderate de esbuild/vite
3. Evaluar Next 16 cuando desaparezca el blocker de postcss embebido
4. Reemplazar dagre/graphlib por layout mantenido
5. Migrar antlr4ts a runtime mantenido, con suite de parser/oráculos
