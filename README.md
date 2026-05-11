<p align="center">
  <img src="./apps/web/public/aalie-white.svg" alt="AALIE" width="160" />
</p>

<p align="center" style="font-size:2rem;"><strong>AALIE</strong></p>
<p align="center" style="font-size:1.25rem; margin-top:-1em;"><em>Algorithmic Analysis Live Interaction Expert</em></p>

<p align="center">
  Plataforma educativa para analizar pseudocódigo, entender complejidad algorítmica y practicar con trazas, visualizaciones, contenido guiado y quizzes.
</p>

<p align="center">
  <strong>Frontend</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14.2-555555?labelColor=000000&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.5-555555?labelColor=3178c6&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-555555?labelColor=06b6d4&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Monaco_Editor-0.54-555555?labelColor=007acc&logo=visualstudiocode&logoColor=white" alt="Monaco Editor" />
  <img src="https://img.shields.io/badge/KaTeX-0.16-555555?labelColor=008080&logo=katex&logoColor=white" alt="KaTeX" />
  <img src="https://img.shields.io/badge/React_Flow-12.10-555555?labelColor=111827&logo=react&logoColor=61dafb" alt="React Flow" />
  <img src="https://img.shields.io/badge/next--intl-i18n-555555?labelColor=111827&logo=nextdotjs&logoColor=white" alt="next-intl" />
</p>

<p align="center">
  <strong>Backend</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-0.110+-555555?labelColor=009688&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Python-3.11+-555555?labelColor=3776ab&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/ANTLR4-4.13-555555?labelColor=ff6c37" alt="ANTLR4" />
  <img src="https://img.shields.io/badge/SymPy-1.12+-555555?labelColor=3b5526&logo=sympy&logoColor=white" alt="SymPy" />
  <img src="https://img.shields.io/badge/Pydantic-2.x-555555?labelColor=e92063&logo=pydantic&logoColor=white" alt="Pydantic" />
  <img src="https://img.shields.io/badge/Uvicorn-ASGI-555555?labelColor=111827&logo=python&logoColor=white" alt="Uvicorn" />
</p>

<p align="center">
  <strong>Proyecto</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/pnpm-9.15-555555?labelColor=f69220&logo=pnpm&logoColor=white" alt="pnpm" />
  <img src="https://img.shields.io/badge/GitHub_Actions-CI-555555?labelColor=2088ff&logo=githubactions&logoColor=white" alt="GitHub Actions" />
  <img src="https://img.shields.io/badge/Docker-Compose-555555?labelColor=2496ed&logo=docker&logoColor=white" alt="Docker Compose" />
  <img src="https://img.shields.io/badge/LaTeX-PDF_Export-555555?labelColor=008080&logo=latex&logoColor=white" alt="LaTeX" />
</p>

---

## Qué es AALIE

**AALIE** es una plataforma educativa para estudiar análisis y diseño de algoritmos. Permite escribir pseudocódigo, analizar su complejidad, ver el proceso paso a paso y reforzar conceptos con ejemplos, contenido guiado y quizzes.

Está pensada para clases de análisis de algoritmos: el profesor puede usarla como apoyo visual y los estudiantes pueden usarla para experimentar con algoritmos iterativos, recursivos, ciclos, recurrencias, trazas de ejecución y reportes exportables.

El análisis principal no depende de IA. AALIE usa reglas y contratos deterministas para producir resultados reproducibles. Las funciones con modelos de lenguaje son opcionales y sirven como apoyo pedagógico, no como reemplazo del motor formal.

---

## Qué puedes hacer con AALIE

### Escribir y validar pseudocódigo

AALIE incluye un editor basado en Monaco, similar a VS Code en el navegador. Mientras escribes, la aplicación valida la sintaxis, ofrece ayudas contextuales y permite trabajar con una gramática diseñada para algoritmos académicos.

### Analizar complejidad automáticamente

La herramienta analiza algoritmos iterativos y recursivos, calcula costos por línea cuando aplica y presenta resultados en notación asintótica. También separa casos como peor caso, mejor caso y caso promedio cuando el algoritmo y el modelo lo permiten.

### Entender ciclos `WHILE`

AALIE reconoce patrones frecuentes en ciclos `WHILE`, como contadores lineales, crecimiento geométrico, búsqueda binaria, Euclides con módulo y ciclos controlados por bandera. Cuando no hay evidencia suficiente, evita inventar una respuesta y reporta el estado correspondiente.

### Resolver recurrencias con varios métodos

Para algoritmos recursivos, AALIE puede detectar recurrencias y aplicar métodos como Teorema Maestro, método de iteración, árbol de recursión y ecuación característica, según la forma del algoritmo.

### Ver trazas de ejecución

La aplicación permite observar cómo avanza un algoritmo paso a paso: cambios de variables, llamadas recursivas, retornos, condiciones y eventos relevantes. Esto ayuda a conectar el pseudocódigo con su comportamiento real.

### Usar visualizaciones

AALIE muestra fórmulas, tablas, árboles de recursión y vistas gráficas para que el análisis no quede reducido a una respuesta final. La idea es mostrar el proceso, no solo el resultado.

### Exportar reportes

Los análisis pueden exportarse como reportes institucionales en Markdown, LaTeX, PDF o ZIP, según el entorno disponible. La vista en pantalla y los reportes exportados usan la misma fuente de resultados para evitar inconsistencias.

### Aprender con contenido modular

El curso está organizado mediante contenido JSON versionado. Esto permite agregar módulos, capítulos, explicaciones, ejemplos y referencias sin reprogramar toda la interfaz.

### Practicar con quizzes

AALIE incluye quizzes por módulos, evaluación determinista y progreso local en el navegador. Las preguntas se conectan con el contenido mediante dificultad, habilidades, temas y referencias pedagógicas.

### Usar asistencia IA opcional

Si se configura una API key, AALIE puede habilitar funciones de apoyo con modelos de lenguaje: explicación adicional, comparación de resultados, reparación o ayuda contextual. Si no hay API key, el análisis formal sigue funcionando.

---

## Estado actual

### Implementado

- Editor Monaco con validación y autocompletado contextual.
- Parser ANTLR compartido entre frontend y backend.
- Análisis iterativo y recursivo.
- Detección de métodos de recurrencia.
- Soporte conservador para ciclos `WHILE`.
- Trazas de ejecución paso a paso.
- Visualizaciones matemáticas y árboles de recursión.
- Export institucional basado en snapshot.
- Curso modular JSON versionado.
- Dashboard de quizzes, sesiones y evaluación determinista.
- Internacionalización en español e inglés.
- Asistente IA opcional.

### Parcial o experimental

- Recomendación GPU vs CPU: orientativa, no benchmark científico.
- Comparación LLM: apoyo pedagógico, no fuente formal.
- Diagramas y jobs LLM: dependen de API key y del entorno configurado.
- PDF: requiere `pdflatex` disponible en runtime.
- Banco de quizzes: el flujo existe, pero la madurez del banco depende de la curaduría y activación del contenido.

### En expansión

- Más módulos de curso.
- Más ejemplos y bancos de preguntas.
- Más cobertura bilingüe.
- Mejoras de experiencia pedagógica.

---

## Características principales

### Editor de pseudocódigo

- Editor Monaco en navegador.
- Validación de gramática en tiempo real.
- Autocompletado contextual.
- Snippets y ayudas por idioma.
- Sintaxis alineada con el lenguaje de la aplicación.

### Parser y gramática

- Gramática ANTLR4.
- Parseo a AST.
- Paquete dedicado en `packages/grammar`.
- Generación de parser para frontend y backend.

### Análisis de complejidad

- Clasificación de algoritmos.
- Análisis de peor caso, mejor caso y caso promedio cuando aplica.
- Costos por línea.
- Expresiones simbólicas.
- Notación O, Ω y Θ.
- Procedimiento paso a paso para explicar el resultado.

### Análisis iterativo

- Costeo por línea.
- Sumas simbólicas.
- Cierre de expresiones cuando el motor puede hacerlo de forma defendible.
- Modelos de caso promedio cuando el contrato lo permite.

### Análisis de `WHILE`

AALIE analiza ciclos `WHILE` mediante heurísticas conservadoras. El motor reconoce patrones frecuentes y evita forzar conclusiones cuando no hay evidencia suficiente.

Patrones soportados:

- contadores lineales;
- crecimiento geométrico;
- búsqueda binaria;
- Euclides con módulo;
- ciclos controlados por bandera.

### Análisis recursivo

- Extracción de recurrencias.
- Detección automática de métodos aplicables.
- Priorización del método recomendado según la forma del algoritmo.
- Explicación paso a paso del procedimiento elegido.

### Métodos de recurrencia

- Teorema Maestro.
- Método de iteración.
- Árbol de recursión.
- Ecuación característica.

### Trazas de ejecución

- Trazas iterativas.
- Trazas recursivas.
- Estado de variables.
- Evaluación de condiciones.
- Llamadas y retornos.
- Eventos relevantes para entender el flujo del algoritmo.

### Visualizaciones

- Fórmulas con KaTeX.
- Árboles de recursión con React Flow.
- Tablas de costos.
- Vistas de apoyo para interpretar el análisis.
- Diagramas pedagógicos cuando la funcionalidad está disponible.

### Export institucional

AALIE puede generar reportes a partir de un snapshot único de análisis. El objetivo es evitar inconsistencias entre lo que se muestra en pantalla y lo que se exporta.

Formatos soportados:

- Markdown.
- LaTeX.
- PDF mediante `pdflatex`.
- ZIP con artefactos, `snapshot.json` y `manifest.json`.

### Curso modular

El contenido pedagógico vive en JSON versionado y validado. La estructura permite crecer por cursos, módulos, capítulos y bloques sin reprogramar el renderer principal.

### Quizzes

- Dashboard en `/{locale}/quizzes`.
- Quizzes por módulos.
- Selección determinista adaptativa.
- Evaluación backend.
- Progreso local en navegador.
- Bancos de preguntas en español e inglés, sujetos al estado de curaduría del contenido.

### Ejemplos

- Catálogo en `/{locale}/examples`.
- Páginas por categoría.
- Ejemplos organizados por tema y nivel de soporte.
- Apoyo directo para practicar análisis de algoritmos.

### Asistente IA opcional

Las funciones LLM son opcionales. Si no hay API key válida, AALIE conserva sus funcionalidades deterministas principales.

El asistente puede apoyar en:

- explicación del análisis;
- comparación de resultados;
- reparación o ayuda sobre pseudocódigo;
- orientación contextual dentro de la aplicación.

### Comparación LLM

La comparación con modelos de lenguaje existe como apoyo pedagógico. No reemplaza el análisis formal ni debe tratarse como fuente de verdad.

### GPU vs CPU

El sistema puede mostrar una lectura heurística de idoneidad estructural para CPU o GPU. Es útil para discusión didáctica, pero no equivale a un benchmark de rendimiento.

### Internacionalización

- Rutas localizadas con `next-intl`.
- Interfaz en español e inglés.
- Contenido modular bilingüe.
- Fallback controlado cuando una traducción no está disponible.

---

## Arquitectura general

Flujo principal:

```text
pseudocódigo
  -> parse
  -> AST
  -> classify
  -> analyze
  -> trace
  -> snapshot
  -> render UI / export
```

AALIE está organizado como monorepo:

- `apps/web`: frontend Next.js, UI y BFF.
- `apps/api`: backend FastAPI para parseo, clasificación, análisis, trazas, export y quizzes.
- `packages/grammar`: gramática ANTLR y codegen.
- `packages/types`: tipos compartidos.
- `packages/content-catalog`: catálogo modular, schemas y validación.
- `docs`: contratos técnicos, guías y ADRs.
- `infra`: Docker y soporte de despliegue local.

---

## API principal

### FastAPI

| Endpoint | Propósito |
| --- | --- |
| `GET /health` | Healthcheck |
| `POST /grammar/parse` | Parseo de pseudocódigo a AST |
| `POST /classify` | Clasificación del algoritmo |
| `POST /analyze/open` | Análisis principal |
| `POST /analyze/detect-methods` | Detección de métodos recursivos aplicables |
| `POST /analyze/trace` | Trace de ejecución |
| `POST /export/report` | Export institucional |
| `POST /llm` | Jobs LLM opcionales |
| `GET /llm/status` | Estado/configuración LLM |
| `GET /quizzes/health` | Estado del módulo de quizzes |
| `GET /quizzes/taxonomy` | Taxonomía del banco |
| `GET /quizzes/dataset/summary` | Resumen del banco |
| `POST /quizzes/attempts` | Crear sesión/intento |
| `POST /quizzes/attempts/evaluate` | Evaluar respuestas |

### Next BFF

| Endpoint | Propósito |
| --- | --- |
| `GET /api/health` | Healthcheck del backend |
| `POST /api/grammar/parse` | Proxy de parseo |
| `POST /api/analyze/open` | Proxy de análisis |
| `POST /api/analyze/detect-methods` | Proxy de métodos |
| `POST /api/analyze/trace` | Proxy de trace |
| `POST /api/llm` | Proxy de jobs LLM |
| `GET /api/llm/status` | Estado/configuración LLM |
| `POST /api/llm/classify` | Compatibilidad para clasificación |
| `POST /api/quizzes/session` | Proxy de inicio de quiz |
| `POST /api/quizzes/evaluate` | Proxy de evaluación |
| `GET /api/quizzes/summary` | Resumen del banco |
| `GET /api/quizzes/taxonomy` | Taxonomía del banco |

---

## Tecnologías

### Frontend

- Next.js 14.2
- React 18
- TypeScript 5.5
- Tailwind CSS 3.4
- Monaco Editor
- KaTeX
- React Flow
- Dagre
- `next-intl`
- Material UI y Material Symbols

### Backend

- FastAPI
- Python 3.11+
- ANTLR4
- SymPy
- Pydantic
- `uvicorn`

### Monorepo y contenido

- pnpm workspaces
- `packages/grammar`
- `packages/types`
- `packages/content-catalog`

### Export

- Markdown
- LaTeX
- PDF
- ZIP
- `pdflatex`

### Calidad

- GitHub Actions
- `pytest`
- `ruff`
- ESLint
- Prettier
- Validación del catálogo
- Validación del banco de quizzes

---

## Requisitos

- Node.js `>=20 <23`
- pnpm `9.15.0`
- Python `3.11+`
- Java `>=8` para codegen ANTLR cuando se necesite regenerar parsers
- `pdflatex` si se quiere exportar PDF en local

---

## Instalación

```bash
pnpm install
cd apps/api
pip install -r requirements.txt
```

---

## Desarrollo local

Levantar backend:

```bash
cd apps/api
python -m uvicorn app.main:app --reload --port 8000
```

Levantar frontend:

```bash
cd apps/web
pnpm dev
```

Por defecto, la aplicación web queda disponible en:

```text
http://localhost:3000
```

---

## Codegen

Generar parser TypeScript:

```bash
pnpm --filter @aa/grammar build
```

Generar parser Python:

```bash
pnpm --filter @aa/grammar gen:py
```

---

## Variables de entorno principales

| Variable | Capa | Uso |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Web | URL pública del backend para consumo cliente directo |
| `API_BASE_URL` | BFF | URL base del backend para proxies Next |
| `API_INTERNAL_BASE_URL` | BFF/Docker | URL interna del backend |
| `API_KEY` | Backend LLM | API key del proveedor |
| `GEMINI_ENDPOINT_BASE` | Backend LLM | Endpoint base del proveedor |
| `LLM_MODEL_GENERAL` | Backend LLM | Modelo general |
| `LLM_MODEL_REPAIR` | Backend LLM | Modelo de reparación |
| `LLM_MODEL_COMPARE` | Backend LLM | Modelo de comparación |
| `AALIE_EXPORTER_ASSETS_DIR` | API export | Override de assets LaTeX |
| `NEXT_PUBLIC_USE_DETERMINISTIC_DIAGRAMS` | Web | Fuerza diagramas deterministas sin LLM |

La lista ampliada vive en [docs/06-operations/environment-variables.md](./docs/06-operations/environment-variables.md).

---

## Uso

Flujo básico:

1. Entra a `/{locale}/analyzer`.
2. Escribe o carga pseudocódigo.
3. Revisa la validación de sintaxis.
4. Ejecuta el análisis.
5. Observa resultados, trazas y visualizaciones.
6. Exporta el reporte si lo necesitas.
7. Refuerza conceptos con curso, ejemplos, guía de usuario y quizzes.

Rutas principales:

| Ruta | Uso |
| --- | --- |
| `/{locale}/analyzer` | Editor y análisis de algoritmos |
| `/{locale}/examples` | Ejemplos por categoría |
| `/{locale}/course` | Contenido modular del curso |
| `/{locale}/quizzes` | Dashboard y sesiones de quiz |
| `/{locale}/user-guide` | Guía de uso |

Locales disponibles:

- `es`
- `en`

---

## Export institucional

El backend genera exportes desde un snapshot versionado y estable, no desde recálculos ad hoc. Eso mantiene consistencia entre la UI, el archivo exportado y los artefactos adjuntos.

Formatos disponibles:

- `markdown`
- `latex`
- `pdf`
- `zip`

Notas prácticas:

- `markdown` y `latex` son formatos nativos del pipeline.
- `pdf` depende de `pdflatex`.
- El bundle ZIP puede incluir `report.*`, `snapshot.json` y `manifest.json`.

Contratos relacionados:

- [docs/03-specs/report-snapshot-spec.md](./docs/03-specs/report-snapshot-spec.md)
- [docs/03-specs/export-engine-spec.md](./docs/03-specs/export-engine-spec.md)

---

## Contenido y quizzes

El catálogo modular se organiza por espacios de contenido. Hoy el repo incluye al menos:

- `course`: módulos de curso por locale.
- `user-guide`: módulos de guía de usuario por locale.

El sistema de quizzes usa bancos JSON bilingües y rutas activas en web y backend. El progreso del estudiante se persiste localmente en el navegador para intentos recientes, dominio por habilidad y contenido estudiado.

A nivel de README, los quizzes deben entenderse como un sistema implementado con banco de preguntas sujeto a curaduría continua.

---

## Testing y calidad

AALIE usa pruebas por capas:

- unitarias;
- component;
- contract;
- system;
- export;
- benchmark;
- validación del catálogo;
- validación del banco de quizzes.

Los tests críticos funcionan como oráculos: entrada real, salida esperada real. Para expresiones simbólicas se prioriza equivalencia matemática o forma contractual esperada, no snapshots textuales frágiles.

El CI mantiene un umbral mínimo de cobertura de `70%` para la API en la lane principal.

Comandos útiles:

```bash
pnpm -r build
pnpm validate:content-catalog
pnpm test:api
pnpm test:api:cov
pnpm lint:web
pnpm lint:api:local
```

---

## CI/CD

GitHub Actions ejecuta:

- build de web y smoke de API;
- pruebas de PR con cobertura;
- lanes extendidos y nightly;
- lint web y lint API;
- validación contractual de `docs/`;
- validación y tests del sistema de quizzes;
- integración Docker.

Workflow:

- [`.github/workflows/ci.yaml`](./.github/workflows/ci.yaml)

---

## Estructura del proyecto

```text
apps/
  api/                  FastAPI, análisis, trace, export, quizzes, LLM
  web/                  Next.js App Router, UI y BFF

packages/
  grammar/              gramática ANTLR y codegen
  types/                contratos y tipos compartidos
  content-catalog/      catálogo modular y validación

docs/                   specs, arquitectura, operación y ADRs
infra/                  Docker y soporte de entorno
```

---

## Documentación

- [docs/README.md](./docs/README.md): mapa principal de documentación.
- [docs/index.md](./docs/index.md): navegación rápida.
- [docs/02-architecture/system-architecture.md](./docs/02-architecture/system-architecture.md): arquitectura general.
- [docs/04-api/endpoints-overview.md](./docs/04-api/endpoints-overview.md): resumen de endpoints.
- [docs/07-user/user-guide.md](./docs/07-user/user-guide.md): guía de uso contractual.
- [docs/08-content/content-model.md](./docs/08-content/content-model.md): modelo del catálogo.



<p align="center"><em>Proyecto académico, Universidad de Caldas.</em></p>