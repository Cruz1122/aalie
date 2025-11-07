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
   - **Tabla de costos por línea**: Visualiza el costo elemental (Cₖ) y número de ejecuciones por línea.
   - **Selector de casos**: Cambia entre Mejor/Promedio/Peor caso (actualmente solo Peor caso disponible).
   - **Tarjetas de resumen**: Ve la notación asintótica (Big-O) para cada caso.
   - **Procedimientos detallados**: 
     - Haz clic en "Ver Procedimiento" en la tarjeta del Peor caso para ver el procedimiento general.
     - Haz clic en una línea de la tabla para ver el procedimiento específico de esa línea.

### Características del Loader de Análisis

- **Progreso en tiempo real**: Muestra el porcentaje de avance durante cada etapa.
- **Etapas visibles**: Parseo → Clasificación → Hallazgo de sumatorias → Simplificación → Finalización.
- **Identificación de tipo**: Muestra el tipo de algoritmo detectado (iterativo, recursivo, híbrido, desconocido).
- **Manejo de errores**: Si ocurre un error, se muestra un mensaje y puedes cerrar el loader.

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
- Editor Monaco con syntax highlighting
- Renderizado de fórmulas con KaTeX
- Visualización de AST
- Chatbot integrado
- Loader de análisis a pantalla completa con etapas, porcentajes sincronizados y estado de error
- Tarjetas por caso (mejor/promedio/peor) con selección persistente en `sessionStorage` y badges Big-O
- Modal dedicado para el procedimiento general y vista detallada por línea con pasos normalizados
- Sanitización automática de procedimientos LaTeX que maneja múltiples bloques `\text{}` intercalados con expresiones matemáticas 

### `apps/api`
API REST con FastAPI que expone endpoints de parsing y análisis.

**Endpoints principales:**
- `POST /grammar/parse` — Parsea pseudocódigo y devuelve AST
- `POST /analyze/open` — Analiza complejidad temporal (método abierto S3)
- `GET /health` — Health check

## Testing

```bash
# Tests del backend (Python)
cd apps/api
pytest test/ -v

# Tests de la gramática
cd packages/grammar
npm run verify
```

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

