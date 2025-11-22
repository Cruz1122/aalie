# Componentes

Documentación de los componentes principales de la aplicación.

## Componentes de Navegación

### Header

Barra de navegación superior con menú responsive.

**Props:** Ninguna (usa `usePathname` internamente)

**Ubicación:** `components/Header.tsx`

### Footer

Footer de la página con información del proyecto.

**Props:** Ninguna

**Ubicación:** `components/Footer.tsx`

### NavigationLink

Enlace de navegación con soporte para loading state.

**Props:**
- `href`: string - URL de destino
- `className?`: string - Clases CSS adicionales
- `children`: ReactNode - Contenido del enlace

## Componentes de Editor

### AnalyzerEditor

Editor Monaco con validación en tiempo real.

**Props:**
- `initialValue`: string - Código inicial
- `onChange`: (value: string) => void - Callback de cambio
- `onAstChange?`: (ast: Program | null) => void - Callback de cambio de AST
- `onParseStatusChange?`: (status: ParseStatus) => void - Callback de estado de parseo
- `height?`: string - Altura del editor

**Características:**
- Syntax highlighting para pseudocódigo
- Validación en tiempo real con Web Worker
- Autocompletado
- Numeración de líneas

### CodePane

Panel de código con numeración de líneas.

**Props:**
- `code`: string - Código a mostrar
- `lineNumbers?`: boolean - Mostrar números de línea

## Componentes de Análisis

### AnalysisLoader

Loader de progreso durante el análisis.

**Props:**
- `progress`: number - Progreso (0-100)
- `message`: string - Mensaje actual
- `algorithmType?`: "iterative" | "recursive" | "hybrid" | "unknown"
- `isComplete?`: boolean - Si el análisis está completo
- `error?`: string | null - Mensaje de error
- `onClose?`: () => void - Callback de cierre

### IterativeAnalysisView

Vista de resultados para algoritmos iterativos.

**Props:**
- `data`: Análisis de worst/best/avg
- `selectedCase`: "worst" | "best" | "average"
- `onCaseChange`: (case: CaseType) => void
- `onViewLineProcedure`: (line: number, case: CaseType) => void
- `onViewGeneralProcedure`: (case: CaseType) => void

### RecursiveAnalysisView

Vista de resultados para algoritmos recursivos.

**Props:**
- `data`: Análisis de worst/best/avg con información recursiva

### LineTable

Tabla de costos por línea.

**Props:**
- `lines`: LineCost[]
- `onLineClick?`: (line: number) => void

## Componentes de Modales

### ProcedureModal

Modal de procedimiento general.

**Props:**
- `open`: boolean
- `onClose`: () => void
- `data`: AnalyzeOpenResponse
- `caseType`: "worst" | "best" | "average"

### GeneralProcedureModal

Modal de procedimiento detallado con pasos.

**Props:**
- `open`: boolean
- `onClose`: () => void
- `procedure`: Array de pasos del procedimiento

### RecursionTreeModal

Modal de visualización de árbol de recursión.

**Props:**
- `open`: boolean
- `onClose`: () => void
- `recurrence`: Datos de recurrencia
- `recursionTreeData`: Datos del árbol

### CharacteristicEquationModal

Modal de ecuación característica.

**Props:**
- `open`: boolean
- `onClose`: () => void
- `recurrence`: Datos de recurrencia
- `characteristicEquation`: Datos de la ecuación

## Componentes de Chatbot

### AIModeView

Vista del modo AI con chatbot integrado.

**Props:**
- `chatOpen`: boolean
- `isAnimating`: boolean
- `inputMessage`: string
- `messages`: Message[]
- `onInputChange`: (e: ChangeEvent) => void
- `onKeyPress`: (e: KeyboardEvent) => void
- `onSendMessage`: () => void
- `onSuggestionClick`: (suggestion: string) => void
- `onClose`: () => void
- `onAnalyzeCode?`: (code: string) => void

### ChatBot

Componente del chatbot.

**Props:**
- `messages`: Message[]
- `onSendMessage`: (message: string) => void
- `onAnalyzeCode?`: (code: string) => void

### MarkdownRenderer

Renderizador de markdown para respuestas del chatbot.

**Props:**
- `content`: string - Contenido markdown
- `className?`: string
- `onAnalyzeCode?`: (code: string) => void

## Componentes de Utilidad

### Formula

Renderizador de fórmulas LaTeX con KaTeX.

**Props:**
- `formula`: string - Fórmula en LaTeX
- `className?`: string

### ModeToggle

Toggle entre modo AI y Manual.

**Props:**
- `mode`: "ai" | "manual"
- `isSwitching`: boolean
- `onModeSwitch`: (mode: "ai" | "manual") => void

### MethodSelector

Selector de método de análisis para algoritmos recursivos.

**Props:**
- `applicableMethods`: MethodType[]
- `defaultMethod`: MethodType
- `onSelect`: (method: MethodType) => void
- `onCancel`: () => void

## Componentes de Documentación

### DocumentationCard

Tarjeta de documentación técnica.

**Props:**
- `section`: DocumentationSection
- `onImageClick`: (image: ImageData) => void
- `onOpenSection`: (section: DocumentationSection) => void

### DocumentationModal

Modal de documentación técnica detallada.

**Props:**
- `open`: boolean
- `onClose`: () => void
- `section`: DocumentationSection | null

## Patrones de Diseño

### Composición

Los componentes se componen para crear interfaces complejas:

```tsx
<AnalysisLoader>
  <IterativeAnalysisView>
    <LineTable />
    <ProcedureModal />
  </IterativeAnalysisView>
</AnalysisLoader>
```

### Props Drilling

Se evita cuando es posible usando Context API para estado global.

### Conditional Rendering

Muchos componentes renderizan condicionalmente según el tipo de algoritmo o estado.

