# Analizador de Complejidades — Monorepo

Stack principal: **Next.js + TypeScript (frontend)** y **FastAPI + Python 3.11+ (backend)**.
Este repositorio usa **pnpm workspaces** para gestionar paquetes de Node del frontend y utilidades compartidas.
El backend (Python) NO forma parte de los workspaces de pnpm.

## Requisitos
- Node.js 20 LTS (≥20 <23)
- pnpm 9.x
- Python 3.11+
- Java ≥8 (para generación de parser Python con ANTLR)
- Git

## Estructura
```
algorithmic-analysis/
├── apps/
│   ├── web/           → Next.js frontend (App Router)
│   └── api/           → FastAPI backend (Python)
├── packages/
│   ├── grammar/       → Gramática ANTLR4 y codegen (TS/Py)
│   └── types/         → Tipos compartidos (TypeScript)
├── infra/             → Docker Compose
└── pnpm-workspace.yaml
```

## Workspaces pnpm
Incluyen solo `apps/web` y `packages/*` para evitar mezclar Python con Node.

## Comandos Rápidos

### Instalación Inicial
```bash
# Instalar dependencias de Node/pnpm
pnpm install

# Instalar dependencias Python (backend)
cd apps/api
pip install -r requirements.txt
```

### Desarrollo
```bash
# Frontend (Next.js) - puerto 3000
cd apps/web
pnpm dev

# Backend (FastAPI) - puerto 8000
cd apps/api
uvicorn app.main:app --reload --port 8000
```

### Generación de Código (Codegen)
```bash
# Generar parser TypeScript desde gramática ANTLR
pnpm --filter @aa/grammar build

# Generar parser Python desde gramática ANTLR
pnpm --filter @aa/grammar gen:py
```

### Build Producción
```bash
# Build completo (frontend + tipos)
pnpm -r build

# Backend (FastAPI no requiere build)
cd apps/api
pip install -r requirements.txt
```

### Docker
```bash
cd infra
docker-compose up
```

## 📚 Documentación Detallada

- **[Gramática ANTLR y Sintaxis del Lenguaje](packages/grammar/grammar/README.md)** — Referencia completa de sintaxis, ejemplos y estructura del AST
- **[Guía de Análisis de Algoritmos](apps/api/app/analysis/README.md)** — Documentación técnica del sistema de análisis, reglas, y flujo de trabajo
- **[Análisis Iterativo Unificado](apps/api/app/analysis/README_ITERATIVE.md)** — Documentación completa del analizador iterativo con soporte para best/worst/average case
- **Guía de Desarrollo** (en README de gramática):
  - [Generación de código TS/Py](packages/grammar/grammar/README.md#generación-de-código-codegen)
  - [Probar endpoint /parse](packages/grammar/grammar/README.md#probar-el-endpoint-parse)
  - [Configurar KaTeX](packages/grammar/grammar/README.md#activar-katex-para-renderizado-de-fórmulas)
  - [Contratos de tipos @aa/types](packages/grammar/grammar/README.md#contratos-de-tipos-en-aatypes)

## 🚀 Guía de Usuario

### Flujo de Análisis Completo

1. **Ingresar código**: Escribe o pega tu algoritmo en pseudocódigo en el editor.
2. **Verificar sintaxis**: El editor muestra errores en tiempo real. Usa "Verificar Parse" para validar.
3. **Analizar complejidad**: Haz clic en "Analizar Complejidad" para iniciar el análisis completo.
4. **Revisar resultados**:
   - **Tabla de costos por línea**: Visualiza el costo elemental (Cₖ), número de ejecuciones y costo total por línea. Incluye selector de casos (Best/Avg/Worst) en la esquina superior derecha.
   - **Tarjetas de resumen**: Tres tarjetas muestran la notación asintótica (Big-O) para cada caso, con el Big-O renderizado en LaTeX dentro del círculo del icono.
   - **Análisis de casos**:
     - **Best Case**: Muestra el mejor caso del algoritmo (complejidad mínima)
     - **Worst Case**: Muestra el peor caso del algoritmo (complejidad máxima)
     - **Average Case**: Muestra el caso promedio usando modelos probabilísticos (uniform o symbolic)
   - **Procedimientos detallados**: 
     - **Procedimiento general**: Haz clic en "Ver Procedimiento" en cualquier tarjeta para ver el procedimiento completo con ecuación de eficiencia, forma polinómica y notación asintótica.
     - **Procedimiento por línea**: Haz clic en cualquier línea de la tabla para ver los pasos detallados de esa línea específica, desde la expresión original hasta la forma final con notación asintótica.

### Características del Loader de Análisis

- **Progreso en tiempo real**: Muestra el porcentaje de avance durante cada etapa, sincronizado con las promesas del backend.
- **Etapas visibles**: Parseo → Clasificación → Hallazgo de sumatorias → Simplificación → Finalización.
- **Identificación de tipo**: Muestra el tipo de algoritmo detectado (iterativo, recursivo, híbrido, desconocido) con animación de "pop".
- **Manejo de errores**: Si ocurre un error, se muestra un mensaje descriptivo y puedes cerrar el loader sin recargar la página.
- **Reutilizable**: El mismo loader se usa tanto en el editor manual como en el chatbot, manteniendo consistencia visual.

### Operadores de Asignación Soportados

El lenguaje acepta múltiples formas de asignación:
- `<-` (estándar ASCII)
- `:=` (estilo Pascal)
- `🡨`, `←`, `⟵` (símbolos Unicode)

**Nota**: El archivo de gramática debe guardarse en UTF-8 para reconocer correctamente los símbolos Unicode.

## Tecnologías Principales

### Frontend
- **Next.js 14** (App Router)
- **TypeScript 5.5**
- **Monaco Editor** (editor de código)
- **KaTeX** (renderizado de fórmulas matemáticas)
- **Tailwind CSS**

### Backend
- **FastAPI**
- **Python 3.11+**
- **ANTLR4 Python Runtime** (4.13.2)

### Gramática y Parsing
- **ANTLR4** (generación de parsers TS/Py)
- **antlr4ts** (runtime TypeScript)
- **antlr4-python3-runtime** (runtime Python)

## Paquetes del Monorepo

### `@aa/grammar`
Gramática ANTLR4 para pseudocódigo y generadores de parsers TypeScript y Python.

**Scripts:**
- `npm run build` — Genera parser TypeScript
- `npm run gen:py` — Genera parser Python

### `@aa/types`
Tipos e interfaces TypeScript compartidos entre frontend y backend.

**Incluye:**
- Definiciones de nodos AST
- Contratos de API (Parse, Analyze, LLM)
- Type guards y utilidades

### `apps/web`
Aplicación Next.js con editor de código, análisis de complejidad y modo IA.

**Características:**
- Editor Monaco con syntax highlighting (incluye soporte para strings literales)
- Renderizado de fórmulas con KaTeX
- Visualización de AST
- Chatbot integrado con análisis directo desde bloques de código
- Loader de análisis a pantalla completa con etapas, porcentajes sincronizados y estado de error
- Análisis desde dos puntos de entrada: editor manual y chatbot (mismo loader reutilizable)
- Tarjetas por caso (mejor/promedio/peor) con selección persistente en `sessionStorage` y badges Big-O renderizados en LaTeX
- Modal dedicado para el procedimiento general y vista detallada por línea con pasos normalizados
- Sanitización automática de procedimientos LaTeX que maneja múltiples bloques `\text{}` intercalados con expresiones matemáticas
- Soporte completo para sentencias `print()` con strings literales y múltiples argumentos 

### `apps/api`
API REST con FastAPI que expone endpoints de parsing y análisis.

**Endpoints principales:**
- `POST /grammar/parse` — Parsea pseudocódigo y devuelve AST
- `POST /analyze/open` — Analiza complejidad temporal (método abierto S3)
  - Soporta modos: `worst`, `best`, `avg`, `all`
  - Modelos de caso promedio: `uniform`, `symbolic`
  - Genera análisis completo con T_open, A_of_n, y procedimientos detallados
- `GET /health` — Health check

**Análisis Iterativo Completo:**
- ✅ Análisis de best/worst/average case
- ✅ Modelos probabilísticos para caso promedio
- ✅ Soporte para bucles FOR, WHILE, REPEAT
- ✅ Análisis de condicionales IF con selección de rama dominante
- ✅ Cálculo de complejidad temporal con sumatorias y simplificación
- ✅ Tests exhaustivos con casos comunes, intermedios y complejos

## Testing

```bash
# Tests del backend (Python)
cd apps/api
pytest tests/ -v

# Tests de la gramática
cd packages/grammar
npm run verify
```

**Tests Exhaustivos del Analizador Iterativo:**
- Tests de casos comunes: búsqueda lineal, búsqueda binaria, factorial, suma/máximo de array
- Tests de casos intermedios: selection sort, bubble sort, insertion sort, multiplicación de matrices
- Tests de casos complejos: bucles anidados variables, WHILE complejos, IF anidados, REPEAT-UNTIL
- Tests de caso promedio: verificación de modelos uniforme y simbólico
- Todos los tests cubren best/worst/average case

**Ubicación de Tests:**
- `apps/api/tests/integration/test_iterative_analyzer.py` — Tests básicos y casos comunes
- `apps/api/tests/integration/test_intermediate_algorithms.py` — Tests de algoritmos intermedios
- `apps/api/tests/integration/test_complex_algorithms.py` — Tests de algoritmos complejos
- `apps/api/tests/integration/test_avg_case.py` — Tests específicos de caso promedio
- `apps/api/tests/integration/test_algorithms.py` — Tests de algoritmos completos

## Contribuir

1. Crear rama desde `develop`
2. Hacer cambios y commit
3. Abrir Pull Request a `develop`
4. Esperar revisión y aprobación

**Convenciones:**
- Commits en español
- Seguir convenciones de código existentes
- Añadir tests cuando corresponda

## Licencia

Proyecto académico - Universidad del Norte (2025-2)

