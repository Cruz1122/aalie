# Analizador de Complejidad Algorítmica

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)
![ANTLR4](https://img.shields.io/badge/ANTLR4-4.13.2-FF6C37?logo=antlr)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)

> Herramienta educativa moderna para analizar la complejidad algorítmica de pseudocódigo con visualizaciones interactivas y cálculos automáticos.

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características](#-características)
- [Estado del Proyecto](#-estado-del-proyecto)
- [Tecnologías](#-tecnologías)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Documentación](#-documentación)
- [Testing](#-testing)
- [CI/CD](#-cicd)
- [Contribuir](#-contribuir)

## 📖 Descripción

Analizador de complejidad algorítmica que permite escribir algoritmos en pseudocódigo y obtener automáticamente el análisis de su complejidad. El sistema utiliza un lenguaje de pseudocódigo estructurado con validación en tiempo real, análisis automático de casos (best/worst/average), y visualizaciones interactivas de resultados.

**Stack principal:** Next.js + TypeScript (frontend) y FastAPI + Python 3.11+ (backend).  
Este repositorio usa **pnpm workspaces** para gestionar paquetes de Node del frontend y utilidades compartidas.  
El backend (Python) NO forma parte de los workspaces de pnpm.

## ✨ Características

### 🎯 Análisis Completo
- ✅ Análisis de complejidad temporal (Big-O) automático
- ✅ Soporte para algoritmos iterativos y recursivos
- ✅ Análisis de best/worst/average case
- ✅ Modelos probabilísticos para caso promedio
- ✅ **Cuatro métodos para análisis recursivo:**
  - **Teorema Maestro** - Para recurrencias divide-and-conquer estándar T(n) = a·T(n/b) + f(n)
  - **Método de Iteración** - Despliega la recurrencia iterativamente para obtener forma cerrada
  - **Árbol de Recursión** - Visualiza el árbol de llamadas recursivas para divide-and-conquer
  - **Ecuación Característica** - Para recurrencias lineales homogéneas y no homogéneas (ej: Fibonacci)
- ✅ Detección automática de métodos aplicables para cada algoritmo
- ✅ Visualización interactiva de árboles de recursión con React Flow

### 💻 Editor Avanzado
- ✅ Editor Monaco (VS Code en el navegador)
- ✅ Syntax highlighting para pseudocódigo
- ✅ Validación en tiempo real con Web Workers
- ✅ Autocompletado y numeración de líneas
- ✅ Múltiples operadores de asignación soportados

### 🤖 Asistente IA
- ✅ Chatbot integrado con modelos de lenguaje
- ✅ Clasificación automática de algoritmos
- ✅ Análisis directo desde bloques de código
- ✅ Corrección automática de errores

### 📊 Visualizaciones
- ✅ Tablas de costos por línea
- ✅ Fórmulas matemáticas renderizadas con KaTeX
- ✅ Visualización de AST
- ✅ Procedimientos detallados paso a paso
- ✅ Gráficos de complejidad

## 🚀 Estado del Proyecto

### ✅ Completado

**Frontend:**
- [x] Editor Monaco con validación en tiempo real
- [x] Sistema de análisis con loader de progreso
- [x] Visualización de resultados (iterativos y recursivos)
- [x] Visualización interactiva de árboles de recursión (React Flow)
  - Soporta algoritmos divide-and-conquer con recurrencias uniformes
  - Soporta algoritmos con desplazamiento lineal (ej: Fibonacci)
- [x] Chatbot integrado con IA
- [x] Modo manual y modo AI
- [x] Guía de usuario completa
- [x] Documentación técnica

**Backend:**
- [x] Parser ANTLR4 completo
- [x] Análisis iterativo (best/worst/average)
- [x] Análisis recursivo con múltiples métodos:
  - [x] Teorema Maestro (tres casos)
  - [x] Método de Iteración
  - [x] Árbol de Recursión
  - [x] Ecuación Característica
- [x] Detección automática de métodos aplicables (`/analyze/detect-methods`)
- [x] Detección automática de tipo de algoritmo
- [x] Modelos probabilísticos para caso promedio
- [x] Tests exhaustivos

**Documentación:**
- [x] Documentación de API (`docs/api/`)
- [x] Documentación de aplicación web (`docs/app/`)
- [x] Guía de usuario rediseñada
- [x] README completo

### 🔄 En Desarrollo

- [ ] Exportación de resultados (PDF, LaTeX)

## 🛠 Tecnologías

### Frontend
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)
![Monaco Editor](https://img.shields.io/badge/Monaco_Editor-0.54-0078D4?logo=visual-studio-code)
![KaTeX](https://img.shields.io/badge/KaTeX-0.16-008080?logo=latex)

- **Next.js 14.2** (App Router) - Framework React
- **TypeScript 5.5.4** - Tipado estático
- **Monaco Editor 0.54** - Editor de código
- **KaTeX 0.16.10** - Renderizado de fórmulas matemáticas
- **Tailwind CSS 3.4.13** - Framework CSS utility-first
- **Material Symbols** - Iconografía

### Backend
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)
![ANTLR4](https://img.shields.io/badge/ANTLR4-4.13.2-FF6C37?logo=antlr)
![SymPy](https://img.shields.io/badge/SymPy-1.12-3B5526?logo=sympy)

- **FastAPI** (≥0.110) - Framework web moderno
- **Python 3.11+** - Lenguaje de programación
- **ANTLR4** (4.13.2) - Generación de parsers
- **SymPy** - Matemáticas simbólicas
- **Pydantic** - Validación de datos

### Herramientas
![pnpm](https://img.shields.io/badge/pnpm-9.x-F69220?logo=pnpm)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)
![Git](https://img.shields.io/badge/Git-Latest-F05032?logo=git)

- **pnpm 9.x** - Gestor de paquetes
- **Docker Compose** - Containerización
- **ANTLR4** - Generación de parsers TS/Py

## 📦 Requisitos

- **Node.js** ≥20 <23 (CI usa 22.x, compatible con 20.x)
- **pnpm** 9.x
- **Python** 3.11+
- **Java** ≥8 (para generación de parser Python con ANTLR)
- **Git**

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd algorithmic-analysis
```

### 2. Instalar dependencias

```bash
# Instalar dependencias de Node/pnpm
pnpm install

# Instalar dependencias Python (backend)
cd apps/api
pip install -r requirements.txt
```

### 3. Configurar variables de entorno (opcional)

```bash
# Backend - apps/api/.env
GEMINI_API_KEY=tu_api_key_here  # Opcional, para usar LLM

# Frontend - apps/web/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## 💻 Uso

### Desarrollo

```bash
# Terminal 1: Frontend (puerto 3000)
cd apps/web
pnpm dev

# Terminal 2: Backend (puerto 8000)
cd apps/api
python -m uvicorn app.main:app --reload --port 8000
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

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

## 📁 Estructura del Proyecto

```
algorithmic-analysis/
├── apps/
│   ├── web/              # Next.js frontend (App Router)
│   │   ├── src/
│   │   │   ├── app/      # Páginas y rutas
│   │   │   ├── components/  # Componentes React
│   │   │   ├── hooks/    # Hooks personalizados
│   │   │   └── lib/      # Utilidades
│   │   └── package.json
│   └── api/              # FastAPI backend (Python)
│       ├── app/
│       │   ├── modules/  # Módulos principales (nueva arquitectura)
│       │   │   ├── parsing/      # Router: /grammar/parse
│       │   │   ├── analysis/     # Router: /analyze/*
│       │   │   └── classification/ # Router: /classify
│       │   ├── routers/  # Routers legacy (en proceso de migración)
│       │   └── core/     # Configuración y utilidades
│       └── requirements.txt
├── packages/
│   ├── grammar/          # Gramática ANTLR4 y codegen (TS/Py)
│   │   ├── grammar/      # Archivos .g4
│   │   └── src/          # Parsers generados
│   └── types/            # Tipos compartidos (TypeScript)
│       └── src/          # Definiciones de tipos
├── docs/                 # Documentación técnica
│   ├── api/              # Documentación de API
│   └── app/              # Documentación de aplicación web
├── infra/                # Docker Compose
└── pnpm-workspace.yaml   # Configuración de workspaces
```

### Workspaces pnpm

Incluyen solo `apps/web` y `packages/*` para evitar mezclar Python con Node.

## 📚 Documentación

### Documentación Técnica

- **[Documentación de API](docs/api/README.md)** - Endpoints, modelos, arquitectura
  - [Endpoints REST](docs/api/endpoints.md)
  - [Modelos de Datos](docs/api/models.md)
  - [Arquitectura del Backend](docs/api/architecture.md)
  - [Manejo de Errores](docs/api/errors.md)

- **[Documentación de Aplicación Web](docs/app/README.md)** - Frontend, componentes, routing
  - [Arquitectura](docs/app/architecture.md)
  - [Componentes](docs/app/components.md)
  - [Sistema de Rutas](docs/app/routing.md)
  - [Gestión de Estado](docs/app/state-management.md)
  - [Sistema de Diseño](docs/app/styling.md)
  - [Integración con API](docs/app/api-integration.md)

### Documentación de Usuario

- **[Guía de Usuario](apps/web/src/app/user-guide/page.tsx)** - Tutorial completo en la aplicación
- **[Gramática y Sintaxis](packages/grammar/grammar/README.md)** - Referencia de sintaxis

### Guía de Desarrollo

- [Generación de código TS/Py](packages/grammar/grammar/README.md#generación-de-código-codegen)
- [Probar endpoint /parse](packages/grammar/grammar/README.md#probar-el-endpoint-parse)
- [Configurar KaTeX](packages/grammar/grammar/README.md#activar-katex-para-renderizado-de-fórmulas)
- [Contratos de tipos @aa/types](packages/grammar/grammar/README.md#contratos-de-tipos-en-aatypes)

## 🧪 Testing

```bash
# Tests del backend (Python)
cd apps/api
python -m pytest tests/ -v

# Tests con cobertura de código
cd apps/api
pytest tests/ --cov=app --cov-report=term --cov-report=html

# Ver reporte HTML de cobertura
# Abre apps/api/htmlcov/index.html en tu navegador

# Tests de la gramática
cd packages/grammar
npm run verify
```

### Cobertura de Código

El proyecto mantiene un umbral mínimo de **70% de cobertura de código** para módulos críticos. Los reportes de cobertura se generan automáticamente en CI y están disponibles como artefactos.

**Comandos útiles:**
- `pytest tests/ --cov=app --cov-report=term` - Ver cobertura en terminal
- `pytest tests/ --cov=app --cov-report=html` - Generar reporte HTML
- `pytest tests/ --cov=app --cov-report=term-missing` - Ver líneas no cubiertas

Para más información sobre cobertura, ver [apps/api/tests/README.md](apps/api/tests/README.md#cobertura-de-código).

### Cobertura de Tests

**Analizador Iterativo:**
- ✅ Casos comunes: búsqueda lineal, búsqueda binaria, factorial
- ✅ Casos intermedios: selection sort, bubble sort, insertion sort
- ✅ Casos complejos: bucles anidados, WHILE complejos, IF anidados
- ✅ Caso promedio: modelos uniforme y simbólico
- ✅ Todos los tests cubren best/worst/average case

**Analizador Recursivo:**
- ✅ Extracción de recurrencias: merge sort, binary search, quick sort, factorial, Fibonacci
- ✅ **Teorema Maestro**: verificación de los 3 casos (f(n) < n^log_b(a), f(n) = n^log_b(a), f(n) > n^log_b(a))
- ✅ **Método de Iteración**: despliegue iterativo de recurrencias para obtener forma cerrada
- ✅ **Árbol de Recursión**: construcción y visualización del árbol para divide-and-conquer
- ✅ **Ecuación Característica**: resolución de recurrencias lineales homogéneas y no homogéneas
- ✅ Detección automática de métodos aplicables según el tipo de recurrencia
- ✅ Priorización de métodos: characteristic_equation > iteration > recursion_tree > master
- ✅ Estructura: validación de parámetros a, b, f(n), n₀, y formas de recurrencia
- ✅ Pasos de prueba: verificación de generación de pasos en LaTeX para todos los métodos

**Ubicación de Tests:**
- `apps/api/tests/integration/test_iterative_analyzer.py`
- `apps/api/tests/integration/test_intermediate_algorithms.py`
- `apps/api/tests/integration/test_complex_algorithms.py`
- `apps/api/tests/integration/test_avg_case.py`
- `apps/api/tests/integration/test_recursive_algorithms.py`

## 🔄 CI/CD

El proyecto utiliza **GitHub Actions** para automatización continua de builds, tests y calidad de código.

### Jobs de CI

1. **Build** - Build crítico del frontend y verificación de dependencias
   - Build de packages (`@aa/types`, `@aa/grammar`)
   - Build de aplicación web Next.js
   - Verificación de FastAPI y dependencias Python

2. **Test** - Suite completa de tests del backend
   - Tests unitarios e integración con pytest
   - Cobertura de código (umbral mínimo: 70%)
   - Reportes de cobertura disponibles como artefactos

3. **Quality** - Verificación de calidad de código
   - ESLint y Prettier para frontend
   - Ruff y Black para backend
   - No bloquea el build principal

4. **Docker Integration** - Verificación de contenedores
   - Build de imágenes Docker
   - Validación de docker-compose
   - Solo corre si build y tests pasan

### Configuración

El workflow se activa automáticamente en:
- Push a ramas `main`, `develop`, `ci-test`
- Pull Requests a `main` o `develop`
- Cambios en código fuente, dependencias o configuración

**Ubicación:** `.github/workflows/ci.yaml`

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. **Fork** el repositorio
2. Crear una **rama** desde `develop`
3. Hacer **cambios** y commit
4. Abrir un **Pull Request** a `develop`
5. Esperar **revisión** y aprobación

### Convenciones

- Seguir **convenciones de código** existentes
- Añadir **tests** cuando corresponda
- Actualizar **documentación** si es necesario


Proyecto académico - Universidad de Caldas (2025-2)

---

<div align="center">

[Documentación](./docs/) • [Guía de Usuario](./apps/web/src/app/user-guide/) • [Ejemplos](./apps/web/src/app/examples/)

</div>
