# Arquitectura del Frontend

Documentación de la arquitectura, estructura y organización del frontend.

## Estructura del Proyecto

```
apps/web/src/
├── app/                    # Páginas (Next.js App Router)
│   ├── page.tsx           # Página principal (home)
│   ├── analyzer/          # Página de análisis de resultados
│   ├── user-guide/        # Guía de usuario
│   ├── documentation/     # Documentación
│   ├── examples/          # Ejemplos de algoritmos
│   ├── about-us/          # Acerca del proyecto
│   ├── layout.tsx         # Layout raíz
│   └── globals.css        # Estilos globales
├── components/            # Componentes React reutilizables
│   ├── Header.tsx         # Header de navegación
│   ├── Footer.tsx         # Footer
│   ├── AIModeView.tsx     # Vista del modo AI
│   ├── ManualModeView.tsx # Vista del modo manual
│   ├── AnalyzerEditor.tsx # Editor Monaco
│   ├── AnalysisLoader.tsx # Loader de análisis
│   └── ...                # Más componentes
├── hooks/                 # Hooks personalizados
│   ├── useAnalysisProgress.ts
│   ├── useApiKey.ts
│   ├── useChatHistory.ts
│   └── ...
├── contexts/              # Contextos React
│   ├── GlobalLoaderContext.tsx
│   └── NavigationContext.tsx
├── lib/                   # Utilidades y helpers
│   ├── algorithm-classifier.ts
│   ├── polynomial.ts
│   └── ...
├── services/              # Servicios (API clients)
├── types/                 # Tipos TypeScript
├── styles/                # Estilos adicionales
└── workers/               # Web Workers
```

## Arquitectura General

### Next.js App Router

La aplicación usa el **App Router** de Next.js 14, que proporciona:

- **Server Components**: Por defecto, componentes se renderizan en el servidor
- **Client Components**: Marcados con `"use client"` para interactividad
- **Layouts**: Layouts anidados para estructura compartida
- **Routing**: Sistema de rutas basado en carpetas

### Flujo de Datos

```
Usuario → Componente → Hook/Context → Service → API Backend
                ↓
         Estado Local/Global
                ↓
         Actualización UI
```

## Componentes Principales

### Páginas (`app/`)

- **`page.tsx`**: Página principal con selector de modo (AI/Manual)
- **`analyzer/page.tsx`**: Página de resultados del análisis
- **`user-guide/page.tsx`**: Guía de usuario completa
- **`documentation/page.tsx`**: Índice de documentación
- **`examples/page.tsx`**: Ejemplos de algoritmos

### Componentes de UI (`components/`)

**Navegación:**
- `Header.tsx`: Barra de navegación superior
- `Footer.tsx`: Footer de la página
- `NavigationLink.tsx`: Enlace de navegación con loading

**Editor:**
- `AnalyzerEditor.tsx`: Editor Monaco con validación
- `CodePane.tsx`: Panel de código con numeración

**Análisis:**
- `AnalysisLoader.tsx`: Loader de progreso del análisis
- `IterativeAnalysisView.tsx`: Vista para algoritmos iterativos
- `RecursiveAnalysisView.tsx`: Vista para algoritmos recursivos
- `LineTable.tsx`: Tabla de costos por línea
- `CostsTable.tsx`: Tabla de costos

**Modales:**
- `ProcedureModal.tsx`: Modal de procedimiento general
- `GeneralProcedureModal.tsx`: Modal de procedimiento detallado
- `RecursionTreeModal.tsx`: Modal de árbol de recursión
- `CharacteristicEquationModal.tsx`: Modal de ecuación característica

**Chatbot:**
- `AIModeView.tsx`: Vista del modo AI con chatbot
- `ChatBot.tsx`: Componente del chatbot
- `MarkdownRenderer.tsx`: Renderizador de markdown para respuestas

**Otros:**
- `ModeToggle.tsx`: Toggle entre modo AI y Manual
- `MethodSelector.tsx`: Selector de método de análisis
- `Formula.tsx`: Renderizador de fórmulas LaTeX

## Hooks Personalizados

### `useAnalysisProgress`

Maneja el progreso de análisis con animaciones.

```typescript
const { animateProgress } = useAnalysisProgress();
await animateProgress(0, 100, 2000, setProgress, promise);
```

### `useApiKey`

Gestiona la API key del usuario (localStorage).

```typescript
const { apiKey, setApiKey, getApiKeyStatus } = useApiKey();
```

### `useChatHistory`

Gestiona el historial de chat.

```typescript
const { messages, setMessages } = useChatHistory();
```

### `useParseWorker`

Web Worker para parseo en background.

```typescript
const { parse, isParsing } = useParseWorker();
```

## Contextos

### `GlobalLoaderContext`

Loader global para operaciones asíncronas.

```typescript
const { showLoader, hideLoader } = useGlobalLoader();
```

### `NavigationContext`

Gestión de estado de navegación y loading.

```typescript
const { startNavigation, finishNavigation } = useNavigation();
```

## Servicios

Los servicios encapsulan la lógica de comunicación con la API:

- Requests HTTP con `fetch`
- Manejo de errores
- Transformación de datos
- Caché cuando es necesario

## Web Workers

### Parse Worker

Parsea código en background sin bloquear la UI:

```typescript
// workers/parse.worker.ts
self.onmessage = (e) => {
  const { source } = e.data;
  // Parsear código
  self.postMessage({ ast, errors });
};
```

## Estado de la Aplicación

### Estado Local (useState)

- Estado de componentes individuales
- UI state (modales abiertos, selecciones, etc.)

### Estado Global (Context)

- Loader global
- Estado de navegación
- API key

### Estado Persistente

- **localStorage**: API key, preferencias
- **sessionStorage**: Código y resultados del análisis actual

## Flujo de Análisis

1. **Usuario escribe código** → `AnalyzerEditor`
2. **Validación en tiempo real** → Web Worker
3. **Usuario inicia análisis** → `AnalysisLoader`
4. **Progreso animado** → `useAnalysisProgress`
5. **Llamada a API** → Service
6. **Resultados** → `IterativeAnalysisView` o `RecursiveAnalysisView`
7. **Navegación** → `/analyzer`

## Optimizaciones

### Code Splitting

Next.js divide automáticamente el código por rutas.

### Lazy Loading

Componentes pesados se cargan bajo demanda:

```typescript
const HeavyComponent = dynamic(() => import('./HeavyComponent'));
```

### Memoización

Uso de `useMemo` y `useCallback` para evitar re-renders innecesarios.

### Web Workers

Parseo en background para no bloquear la UI.

## Estilos

Ver [styling.md](./styling.md) para detalles del sistema de diseño.

## TypeScript

Todos los componentes y funciones están tipados:

- Props de componentes
- Respuestas de API
- Estados y hooks
- Utilidades

Los tipos se comparten con el backend a través de `@aa/types`.

## Testing

La aplicación está preparada para testing, aunque los tests no están incluidos en esta documentación.

## Build y Deploy

### Desarrollo

```bash
pnpm dev
```

### Producción

```bash
pnpm build
pnpm start
```

### Docker

La aplicación se puede containerizar con Docker (ver `Dockerfile`).

