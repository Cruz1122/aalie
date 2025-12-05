# Configuración de API Key en Frontend

## Descripción General

El sistema de configuración de API key permite a los usuarios proporcionar su propia clave de API de Google Gemini para utilizar las funcionalidades basadas en LLM. La API key se almacena de forma segura en el navegador y se utiliza para autenticar las solicitudes a los servicios de Gemini.

## Hook useApiKey

**Ubicación**: `apps/web/src/hooks/useApiKey.ts`

Hook principal para gestionar la API key del usuario.

### Interfaz

```typescript
interface UseApiKeyReturn {
  apiKey: string | null;
  isValid: boolean;
  isLoading: boolean;
  error: string | null;
  setApiKey: (key: string) => Promise<void>;
  removeApiKey: () => void;
  validateApiKey: (key: string) => Promise<boolean>;
}

function useApiKey(): UseApiKeyReturn;
```

### Implementación

```typescript
export function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar API key al montar
  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = () => {
    setIsLoading(true);
    try {
      const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
      if (stored) {
        setApiKeyState(stored);
        setIsValid(validateFormat(stored));
      }
    } catch (err) {
      setError('Error al cargar API key');
    } finally {
      setIsLoading(false);
    }
  };

  const setApiKey = async (key: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validar formato
      if (!validateFormat(key)) {
        throw new Error('Formato de API key inválido');
      }

      // Validar con API de Gemini
      const isValidKey = await validateApiKey(key);
      if (!isValidKey) {
        throw new Error('API key inválida');
      }

      // Guardar en localStorage
      localStorage.setItem(API_KEY_STORAGE_KEY, key);
      setApiKeyState(key);
      setIsValid(true);
    } catch (err) {
      setError(err.message);
      setIsValid(false);
    } finally {
      setIsLoading(false);
    }
  };

  const removeApiKey = () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKeyState(null);
    setIsValid(false);
  };

  return {
    apiKey,
    isValid,
    isLoading,
    error,
    setApiKey,
    removeApiKey,
    validateApiKey
  };
}
```

## Almacenamiento en localStorage

### Clave de Almacenamiento

```typescript
const API_KEY_STORAGE_KEY = 'gemini_api_key';
```

### Estructura de Datos

```typescript
// Simple string storage
localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);

// Retrieval
const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
```

### Seguridad

**Nota importante**: La API key se almacena en localStorage, que es accesible por JavaScript. Esto es aceptable para este caso de uso porque:

1. La API key es del usuario, no del sistema
2. Solo se usa en el cliente (no se envía al backend del proyecto)
3. El usuario puede revocar/regenerar la key en cualquier momento desde Google Cloud Console

**Mejores prácticas implementadas**:
- No se registra la key en logs
- No se envía la key al backend del proyecto
- Se valida antes de usar
- Se puede eliminar fácilmente

## Prioridad de API Keys

El sistema sigue esta prioridad para determinar qué API key usar:

1. **localStorage** (API key del usuario)
   - Prioridad más alta
   - Configurada por el usuario en la aplicación

2. **Variables de entorno del servidor** (fallback)
   - Solo si no hay key en localStorage
   - Configurada en `.env.local` del servidor Next.js
   - Variable: `NEXT_PUBLIC_GEMINI_API_KEY`

### Implementación de Prioridad

```typescript
function getEffectiveApiKey(): string | null {
  // 1. Intentar obtener de localStorage
  const userKey = localStorage.getItem(API_KEY_STORAGE_KEY);
  if (userKey) {
    return userKey;
  }

  // 2. Fallback a variable de entorno
  const envKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (envKey) {
    return envKey;
  }

  // 3. No hay API key disponible
  return null;
}
```

## Validación de Formato

### Formato de API Key de Gemini

Las API keys de Gemini tienen el formato:
```
AIza[A-Za-z0-9_-]{35}
```

### Función de Validación

```typescript
function validateFormat(apiKey: string): boolean {
  // Verificar que no esté vacía
  if (!apiKey || apiKey.trim().length === 0) {
    return false;
  }

  // Verificar formato de Gemini
  const geminiPattern = /^AIza[A-Za-z0-9_-]{35}$/;
  if (!geminiPattern.test(apiKey)) {
    return false;
  }

  return true;
}
```

## Validación con API de Gemini

### Endpoint de Validación

```typescript
async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('/api/llm/validate-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ apiKey })
    });

    const data = await response.json();
    return data.valid;
  } catch (error) {
    console.error('Error validating API key:', error);
    return false;
  }
}
```

### Backend de Validación

```typescript
// apps/web/src/app/api/llm/validate-key/route.ts

export async function POST(request: Request) {
  const { apiKey } = await request.json();

  try {
    // Intentar una llamada simple a la API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    );

    return Response.json({
      valid: response.ok
    });
  } catch (error) {
    return Response.json({
      valid: false,
      error: 'Invalid API key'
    });
  }
}
```

## Componentes que Usan la API Key

### 1. ChatBot

```typescript
// apps/web/src/components/ChatBot.tsx

function ChatBot() {
  const { apiKey, isValid } = useApiKey();

  if (!isValid) {
    return <ApiKeyRequired />;
  }

  const sendMessage = async (message: string) => {
    const response = await fetch('/api/llm/chat', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey!
      },
      body: JSON.stringify({ message })
    });
    // ...
  };

  return <ChatInterface onSend={sendMessage} />;
}
```

### 2. Análisis de Complejidad

```typescript
// apps/web/src/components/ComplexityAnalyzer.tsx

function ComplexityAnalyzer() {
  const { apiKey } = useApiKey();

  const analyzeWithLLM = async (code: string) => {
    const response = await fetch('/api/llm/analyze', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey || ''
      },
      body: JSON.stringify({ code })
    });
    // ...
  };

  return <AnalyzerInterface onAnalyze={analyzeWithLLM} />;
}
```

### 3. Comparación de Análisis

```typescript
// apps/web/src/components/ComparisonModal.tsx

function ComparisonModal({ systemAnalysis, code }: Props) {
  const { apiKey, isValid } = useApiKey();

  if (!isValid) {
    return (
      <div className="api-key-warning">
        Se requiere una API key para comparar con LLM
        <button onClick={openSettings}>Configurar</button>
      </div>
    );
  }

  // ... resto del componente
}
```

### 4. Generación de Diagramas Recursivos

```typescript
// apps/web/src/components/RecursiveTraceContent.tsx

function RecursiveTraceContent({ code, inputs }: Props) {
  const { apiKey } = useApiKey();

  const generateDiagram = async () => {
    const response = await fetch('/api/analyze/trace', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey || ''
      },
      body: JSON.stringify({
        code,
        inputs,
        algorithmType: 'recursive'
      })
    });
    // ...
  };

  return <DiagramView onGenerate={generateDiagram} />;
}
```

## Componente de Configuración

### ApiKeySettings

**Ubicación**: `apps/web/src/components/ApiKeySettings.tsx`

Componente para que el usuario configure su API key.

```typescript
function ApiKeySettings() {
  const { apiKey, isValid, error, setApiKey, removeApiKey } = useApiKey();
  const [inputValue, setInputValue] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleSave = async () => {
    await setApiKey(inputValue);
  };

  return (
    <div className="api-key-settings">
      <h3>Configuración de API Key</h3>
      
      {/* Estado actual */}
      <div className="current-status">
        {isValid ? (
          <div className="status-valid">
            ✅ API Key configurada y válida
            <button onClick={removeApiKey}>Eliminar</button>
          </div>
        ) : (
          <div className="status-invalid">
            ⚠️ No hay API Key configurada
          </div>
        )}
      </div>

      {/* Input de API Key */}
      <div className="api-key-input">
        <label>API Key de Google Gemini:</label>
        <div className="input-wrapper">
          <input
            type={showKey ? 'text' : 'password'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="AIza..."
          />
          <button onClick={() => setShowKey(!showKey)}>
            {showKey ? '🙈' : '👁️'}
          </button>
        </div>
        <button onClick={handleSave}>Guardar</button>
      </div>

      {/* Error */}
      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* Instrucciones */}
      <div className="instructions">
        <h4>¿Cómo obtener una API Key?</h4>
        <ol>
          <li>Ve a <a href="https://makersuite.google.com/app/apikey" target="_blank">Google AI Studio</a></li>
          <li>Inicia sesión con tu cuenta de Google</li>
          <li>Haz clic en "Create API Key"</li>
          <li>Copia la key y pégala aquí</li>
        </ol>
      </div>
    </div>
  );
}
```

## Componente ApiKeyRequired

```typescript
function ApiKeyRequired({ onConfigure }: Props) {
  return (
    <div className="api-key-required">
      <div className="icon">🔑</div>
      <h3>API Key Requerida</h3>
      <p>
        Esta funcionalidad requiere una API key de Google Gemini.
        Configura tu API key para continuar.
      </p>
      <button onClick={onConfigure}>
        Configurar API Key
      </button>
      <a 
        href="https://makersuite.google.com/app/apikey" 
        target="_blank"
        className="get-key-link"
      >
        Obtener una API Key
      </a>
    </div>
  );
}
```

## Manejo de Errores

### Errores de Validación

```typescript
try {
  await setApiKey(inputValue);
} catch (error) {
  if (error.message.includes('formato')) {
    showError('El formato de la API key no es válido');
  } else if (error.message.includes('inválida')) {
    showError('La API key no es válida. Verifica que sea correcta.');
  } else {
    showError('Error al configurar la API key');
  }
}
```

### Errores de Red

```typescript
try {
  const isValid = await validateApiKey(key);
} catch (error) {
  if (error.name === 'NetworkError') {
    showError('Error de conexión. Verifica tu internet.');
  } else {
    showError('No se pudo validar la API key');
  }
}
```

## Integración con Backend

### Header de Autenticación

Cuando se hace una petición a un endpoint que usa LLM:

```typescript
const headers: HeadersInit = {
  'Content-Type': 'application/json'
};

// Agregar API key si está disponible
if (apiKey) {
  headers['X-API-Key'] = apiKey;
}

const response = await fetch('/api/llm/endpoint', {
  method: 'POST',
  headers,
  body: JSON.stringify(data)
});
```

### Procesamiento en el Backend

```typescript
// apps/web/src/app/api/llm/[endpoint]/route.ts

export async function POST(request: Request) {
  // Obtener API key del header
  const apiKey = request.headers.get('X-API-Key');

  // Fallback a variable de entorno del servidor
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY;

  if (!effectiveKey) {
    return Response.json(
      { error: 'API key required' },
      { status: 401 }
    );
  }

  // Usar la key para llamar a Gemini
  const result = await callGemini(effectiveKey, data);
  
  return Response.json(result);
}
```

## Variables de Entorno

### Frontend (Next.js)

```env
# .env.local

# API key pública (fallback)
NEXT_PUBLIC_GEMINI_API_KEY=AIza...

# URL del backend
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Consideraciones de Seguridad

- `NEXT_PUBLIC_*` variables son expuestas al cliente
- Solo usar para fallback, preferir API key del usuario
- No commitear `.env.local` al repositorio
- Usar `.env.example` para documentar variables necesarias

## Testing

### Mock del Hook

```typescript
// __mocks__/useApiKey.ts

export const useApiKey = jest.fn(() => ({
  apiKey: 'mock-api-key',
  isValid: true,
  isLoading: false,
  error: null,
  setApiKey: jest.fn(),
  removeApiKey: jest.fn(),
  validateApiKey: jest.fn()
}));
```

### Tests de Validación

```typescript
describe('validateFormat', () => {
  it('should accept valid Gemini API key', () => {
    const validKey = 'AIzaSyDK1234567890abcdefghijklmnopqrs';
    expect(validateFormat(validKey)).toBe(true);
  });

  it('should reject invalid format', () => {
    const invalidKey = 'invalid-key';
    expect(validateFormat(invalidKey)).toBe(false);
  });
});
```

## Referencias

- [LLM Usage and Models](../llm/usage-and-models.md)
- [LLM Comparison](./llm-comparison.md)
- [Pseudocode Tracking](./pseudocode-tracking.md)
- [Google AI Studio](https://makersuite.google.com/app/apikey)
