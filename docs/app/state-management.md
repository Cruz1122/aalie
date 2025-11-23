# Gestión de Estado

Documentación de la gestión de estado en la aplicación, incluyendo hooks personalizados y contextos.

## Estrategias de Estado

### 1. Estado Local (useState)

Para estado de componentes individuales:

```tsx
const [isOpen, setIsOpen] = useState(false);
const [selectedCase, setSelectedCase] = useState<CaseType>("worst");
```

### 2. Estado Global (Context API)

Para estado compartido entre componentes:

- `GlobalLoaderContext`: Loader global
- `NavigationContext`: Estado de navegación

### 3. Estado Persistente

- **localStorage**: API key, preferencias
- **sessionStorage**: Código y resultados del análisis actual

## Contextos

### GlobalLoaderContext

Loader global para operaciones asíncronas.

**Ubicación:** `contexts/GlobalLoaderContext.tsx`

**Uso:**

```tsx
const { showLoader, hideLoader } = useGlobalLoader();

showLoader("Analizando...");
// ... operación
hideLoader();
```

**API:**
- `showLoader(message: string)`: Muestra loader con mensaje
- `hideLoader()`: Oculta loader

### NavigationContext

Gestión de estado de navegación.

**Ubicación:** `contexts/NavigationContext.tsx`

**Uso:**

```tsx
const { startNavigation, finishNavigation } = useNavigation();

useEffect(() => {
  finishNavigation();
}, []);
```

**API:**
- `startNavigation()`: Inicia loading de navegación
- `finishNavigation()`: Finaliza loading

## Hooks Personalizados

### useAnalysisProgress

Maneja el progreso de análisis con animaciones.

**Ubicación:** `hooks/useAnalysisProgress.ts`

**Uso:**

```tsx
const { animateProgress } = useAnalysisProgress();

await animateProgress(
  0,           // Progreso inicial
  100,         // Progreso final
  2000,        // Duración (ms)
  setProgress, // Setter de progreso
  promise      // Promise a esperar
);
```

**Características:**
- Animación suave de progreso
- Sincronización con promises
- Manejo de errores

### useApiKey

Gestiona la API key del usuario.

**Ubicación:** `hooks/useApiKey.ts`

**Uso:**

```tsx
const { apiKey, setApiKey, getApiKeyStatus } = useApiKey();
```

**API:**
- `apiKey`: string | null - API key actual
- `setApiKey(key: string)`: Establece API key
- `getApiKeyStatus()`: Estado de la API key

**Almacenamiento:** localStorage

### useChatHistory

Gestiona el historial de chat.

**Ubicación:** `hooks/useChatHistory.ts`

**Uso:**

```tsx
const { messages, setMessages } = useChatHistory();
```

**API:**
- `messages`: Message[] - Mensajes del chat
- `setMessages`: (messages: Message[] | ((prev: Message[]) => Message[])) => void

**Almacenamiento:** sessionStorage

### useParseWorker

Web Worker para parseo en background.

**Ubicación:** `hooks/useParseWorker.ts`

**Uso:**

```tsx
const { parse, isParsing } = useParseWorker();

const result = await parse(sourceCode);
```

**API:**
- `parse(source: string)`: Promise<ParseResult>
- `isParsing`: boolean - Si está parseando

### useImageModal

Gestión de modales de imágenes.

**Ubicación:** `hooks/useImageModal.ts`

**Uso:**

```tsx
const { selectedImage, openModal, closeModal, isModalOpen } = useImageModal();
```

### useDocumentationSections

Obtiene secciones de documentación técnica.

**Ubicación:** `hooks/useDocumentationSections.ts`

**Uso:**

```tsx
const sections = useDocumentationSections();
```

## Persistencia

### localStorage

**Datos almacenados:**
- `apiKey`: API key del usuario

**Uso:**

```tsx
localStorage.setItem('apiKey', key);
const key = localStorage.getItem('apiKey');
```

### sessionStorage

**Datos almacenados:**
- `analyzerCode`: Código del análisis actual
- `analyzerResults`: Resultados del análisis
- `chatMessages`: Mensajes del chat

**Uso:**

```tsx
sessionStorage.setItem('analyzerCode', code);
const code = sessionStorage.getItem('analyzerCode');
```

**Nota:** Se limpia al cerrar la pestaña/navegador.

## Flujo de Estado

### Análisis de Código

```
Usuario → onClick → setState (loading)
                ↓
         API Call
                ↓
         setState (results)
                ↓
         sessionStorage.setItem
                ↓
         router.push('/analyzer')
                ↓
         Leer de sessionStorage
```

### Chat

```
Usuario → onSendMessage → setMessages
                    ↓
             API Call (LLM)
                    ↓
             setMessages (respuesta)
                    ↓
             sessionStorage (auto)
```

## Mejores Prácticas

1. **Estado Local Primero**: Usar `useState` para estado de componente
2. **Context para Global**: Usar Context solo para estado realmente global
3. **Persistencia Selectiva**: Solo persistir lo necesario
4. **Memoización**: Usar `useMemo` y `useCallback` cuando sea necesario
5. **Cleanup**: Limpiar efectos y suscripciones

## Optimizaciones

### useMemo

Para cálculos costosos:

```tsx
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

### useCallback

Para funciones pasadas como props:

```tsx
const handleClick = useCallback(() => {
  // ...
}, [dependencies]);
```

### React.memo

Para componentes que se re-renderizan frecuentemente:

```tsx
export default React.memo(ExpensiveComponent);
```

