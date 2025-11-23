# Sistema de Rutas

Documentación del sistema de rutas y navegación en Next.js App Router.

## Estructura de Rutas

```
app/
├── page.tsx                    # / (home)
├── analyzer/
│   └── page.tsx               # /analyzer
├── user-guide/
│   └── page.tsx               # /user-guide
├── documentation/
│   ├── page.tsx               # /documentation
│   └── technical/
│       └── page.tsx           # /documentation/technical
├── examples/
│   └── page.tsx               # /examples
├── about-us/
│   └── page.tsx               # /about-us
└── privacy/
    └── page.tsx               # /privacy
```

## Rutas Principales

### `/` (Home)

Página principal con selector de modo (AI/Manual).

**Componente:** `app/page.tsx`

**Características:**
- Toggle entre modo AI y Manual
- Editor de código (modo manual)
- Chatbot (modo AI)
- Análisis de código

**Implementación:**
La función `runChatAnalysis` utiliza funciones auxiliares envueltas en `useCallback` para reducir la complejidad cognitiva:
- `handleMethodSelectionForRecursive`: Maneja la selección de método cuando hay múltiples opciones
- `detectAndSelectMethodForRecursive`: Detecta y selecciona métodos aplicables para algoritmos recursivos
- `prepareRecursiveAnalysisSteps`: Prepara los pasos de análisis para algoritmos recursivos
- `prepareIterativeAnalysisSteps`: Prepara los pasos de análisis para algoritmos iterativos

Estas funciones auxiliares mejoran la legibilidad y mantenibilidad del código.

### `/analyzer`

Página de resultados del análisis.

**Componente:** `app/analyzer/page.tsx`

**Características:**
- Visualización de resultados
- Tabla de costos por línea
- Selector de casos (worst/best/avg)
- Modales de procedimientos
- Visualización de AST

**Datos:** Se obtienen de `sessionStorage` (código y resultados del análisis)

### `/user-guide`

Guía de usuario completa.

**Componente:** `app/user-guide/page.tsx`

**Contenido:**
- Uso del editor
- Sintaxis de la gramática
- Análisis de complejidad
- Ejemplos rápidos
- Solución de problemas

### `/documentation`

Índice de documentación.

**Componente:** `app/documentation/page.tsx`

**Enlaces a:**
- Documentación técnica
- Guía de usuario
- Ejemplos

### `/documentation/technical`

Documentación técnica detallada.

**Componente:** `app/documentation/technical/page.tsx`

**Contenido:**
- Arquitectura
- Flujos de análisis
- APIs
- Diagramas

### `/examples`

Ejemplos de algoritmos.

**Componente:** `app/examples/page.tsx`

**Características:**
- Ejemplos por categoría
- Copiar código
- Analizar directamente

## Navegación

### NavigationLink

Componente personalizado para navegación con loading state.

```tsx
<NavigationLink href="/analyzer" className="...">
  Ver Resultados
</NavigationLink>
```

**Características:**
- Muestra loading durante navegación
- Prefetch automático (Next.js)
- Transiciones suaves

### Header Navigation

El header incluye navegación principal:

- Inicio (`/`)
- Analizador (`/analyzer`)
- Documentación (`/documentation`)
- Ejemplos (`/examples`)
- Acerca de (`/about-us`)

### Navegación Programática

```tsx
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/analyzer');
```

## Contexto de Navegación

### NavigationContext

Proporciona estado de navegación y loading.

```tsx
const { startNavigation, finishNavigation } = useNavigation();
```

**Uso:**
- `startNavigation()`: Inicia loading de navegación
- `finishNavigation()`: Finaliza loading

## Rutas API (Next.js API Routes)

```
app/api/
├── grammar/
│   └── parse/
│       └── route.ts          # /api/grammar/parse
├── health/
│   └── route.ts              # /api/health
└── llm/
    ├── route.ts              # /api/llm
    ├── classify/
    │   └── route.ts          # /api/llm/classify
    └── status/
        └── route.ts          # /api/llm/status
```

### `/api/grammar/parse`

Proxy al endpoint de parseo del backend.

### `/api/llm/classify`

Proxy al endpoint de clasificación con LLM.

## Prefetching

Next.js hace prefetch automático de rutas en:

- Enlaces `<Link>` visibles
- Rutas en el viewport
- Rutas relacionadas

## Loading States

### PageLoader

Componente de loading durante navegación entre páginas.

**Ubicación:** `components/PageLoader.tsx`

**Uso:** Automático con `NavigationLoadingWrapper`

### NavigationLoadingWrapper

Wrapper que muestra loading durante navegación.

**Ubicación:** `components/NavigationLoadingWrapper.tsx`

## Rutas Dinámicas

Actualmente no hay rutas dinámicas, pero se pueden agregar:

```
app/
└── examples/
    └── [id]/
        └── page.tsx          # /examples/[id]
```

## Middleware

No hay middleware personalizado actualmente, pero se puede agregar para:

- Autenticación
- Redirecciones
- Headers personalizados

## 404 y Errores

Next.js maneja automáticamente:

- `404`: Página no encontrada
- `500`: Error del servidor

Se pueden personalizar con:

```
app/
├── not-found.tsx
└── error.tsx
```

