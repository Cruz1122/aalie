# Presentación: guía rápida

**Tipo:** guía
**Estado:** requiere-validación
**Audiencia:** docente | evaluador | operador
**Fuente de verdad:** `README.md`, `docs/01-product/vision.md`, `docs/01-product/final-scope.md`, `docs/01-product/theoretical-foundations.md`, `apps/`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** 2.1 Resumen Ejecutivo

## Propósito

Proveer narrativas listas para presentación del proyecto en distintos formatos de tiempo (90 segundos, 3 minutos, 7 minutos), rutas de demo seguras y extendidas, y respuestas a preguntas difíciles con base en los contratos del producto.

## Alcance

No cubre la presentación visual (slides). Cubre el guión y las decisiones de qué mostrar y qué evitar.

## Fuente de verdad

- Contratos en `docs/01-product/` y `docs/03-specs/`.
- README raíz.
- Comportamiento real del sistema.

## 90 segundos — El elevator pitch

"AALIE es una plataforma educativa para cursos de análisis de algoritmos. Los estudiantes escriben pseudocódigo en un editor y el sistema calcula automáticamente la complejidad temporal, paso a paso, sin usar IA como fuente de verdad.

El motor es determinista: analiza costos por línea, resuelve recurrencias con métodos como el Teorema Maestro, y reconoce patrones en ciclos WHILE sin inventar resultados.

Además genera trazas de ejecución, exporta reportes institucionales en Markdown, LaTeX o PDF, e incluye quizzes de práctica. El LLM es opcional y solo sirve como apoyo pedagógico.

Está construido como monorepo con Next.js y FastAPI, usa ANTLR4 para el parser y tiene cobertura de pruebas del 70%."

## 3 minutos — La presentación completa

(Incluir los 90 segundos más:)

"El proyecto nace de un problema real: los estudiantes de análisis de algoritmos no logran conectar la teoría de complejidad con el código que escriben. Las herramientas existentes o son cajas negras (LLM que alucinan cotas) o requieren hacer las matemáticas a mano.

AALIE ocupa ese espacio intermedio. El flujo principal es:

1. El estudiante escribe pseudocódigo en un editor Monaco con validación en tiempo real.
2. El parser ANTLR4 genera un AST.
3. El clasificador determina si es iterativo, recursivo o híbrido.
4. El motor analiza: costos por línea, sumatorias con SymPy, notación O/Ω/Θ.
5. Para recursivos, detecta la recurrencia y aplica el mejor método.
6. Para WHILE, reconoce 12 patrones como contadores lineales, búsqueda binaria o Euclides.
7. Se genera una traza paso a paso y un snapshot versionado.
8. El estudiante puede exportar a Markdown, LaTeX, PDF o ZIP.

¿Qué NO hace AALIE? No analiza backtracking, branch and bound ni voraces formalmente. No tiene RAG ni ML. El caso promedio requiere un modelo probabilístico definido. El PDF necesita pdflatex.

El proyecto está en producción en aalie.tumbergia.com, tiene 476 preguntas de quiz activas en cada idioma, 8 jobs de CI, 20 módulos de curso, y corre en Docker."

## 7 minutos — La presentación detallada

(Incluir los 3 minutos más:)

"Arquitectura: Es un monorepo con pnpm. El frontend es Next.js 14.2 con App Router, Tailwind, KaTeX para fórmulas y React Flow para árboles. El backend es FastAPI con Python 3.11, ANTLR4, SymPy y Pydantic. El paquete de gramática se comparte entre frontend y backend.

Decisiones clave de diseño:
- **Motor determinista primero**: cualquier análisis produce el mismo resultado para la misma entrada. Esto permite oráculos en tests.
- **Snapshot como unidad de export**: lo que ves en pantalla es exactamente lo que sale en el PDF. El snapshot tiene schemaVersion, snapshotId y contentHash.
- **Heurística conservadora en WHILE**: si no hay evidencia suficiente, AALIE reporta "unknown" en lugar de inventar una cota.
- **LLM opcional y acotado**: 5 jobs (general, repair, compare, explain, parser_assist), configurable entre Gemini y OpenAI-compatible, sin RAG.

Calidad: 8 jobs de CI que incluyen build, tests PR gate con coverage 70%, lint web y API, validación de docs, calidad de quizzes, y Docker. Los tests críticos son oráculos comparan contra resultados esperados conocidos.

Contenido: 20 módulos de curso en español e inglés, más guía de usuario. Los quizzes tienen 476 preguntas activas cada uno, con 5 tipos de pregunta y selección adaptativa determinista.

Autores: Juan Camilo Cruz (Fullstack+arquitectura), Jhon Hander Patiño (FullStack post-MVP), Luz Enith Guerrero (coordinación profesoral). Universidad de Caldas, 2026-1."

## Rutas de demo

### Demo segura (3-5 minutos, sin riesgo)

1. Abrir `/{locale}/analyzer`.
2. Cargar un algoritmo iterativo simple: 
   ```
   sumArray(A, n) BEGIN
     suma <- 0;
     FOR i <- 1 TO n DO BEGIN
       suma <- suma + A[i];
     END
     RETURN suma;
   END
   ```
3. Ejecutar análisis. Mostrar: tabla por línea, T_open, T_polynomial, O(n).
4. Mostrar la traza paso a paso.
5. Exportar a Markdown y ZIP.
6. _(opcional)_ Mostrar el snapshot en el ZIP.

### Demo extendida (10-15 minutos, si hay tiempo)

1. Ruta segura completa.
2. Algoritmo recursivo: 
   ```
   factorial(n) BEGIN
     IF (n <= 1) THEN BEGIN
       RETURN 1;
     END ELSE BEGIN
       RETURN n * factorial(n - 1);
     END
   END
   ```
3. Mostrar detección de método aplicable (característica o iteración).
4. Algoritmo con WHILE: 
   ```
   binarySearch(A, n, x) BEGIN
     low <- 1;
     high <- n;
     WHILE (low <= high) DO BEGIN
       mid <- (low + high) / 2;
       IF (A[mid] == x) THEN BEGIN
         RETURN mid;
       END ELSE IF (A[mid] < x) THEN BEGIN
         low <- mid + 1;
       END ELSE BEGIN
         high <- mid - 1;
       END
     END
     RETURN -1;
   END
   ```
5. Mostrar detección de patrón binary_search_interval.
6. Mostrar la traza recursiva y el árbol de llamadas.
7. Si hay API key configurada: mostrar el asistente LLM en una pregunta pedagógica.

### Qué evitar mostrar

- ❌ **Análisis de backtracking** (N-Reinas, etc.). Solo contenido pedagógico, no análisis formal.
- ❌ **RAG o ML**. No existen en el sistema.
- ❌ **GPU vs CPU como benchmark**. Es heurístico/orientativo.
- ❌ **Caso promedio sin modelo probabilístico explícito**. Puede confundir.
- ❌ **Export PDF si no hay pdflatex**. Fallará con error.
- ❌ **Comparación LLM como validación**. Es apoyo pedagógico, no fuente de verdad.

## Preguntas difíciles y respuestas defendibles

| Pregunta | Respuesta |
|---|---|
| "¿Cómo calcula la complejidad?" | "Usa un motor determinista: costeo por línea con SymPy para sumatorias. El LLM no participa en el cálculo. Todo es reproducible." |
| "¿Soporta cualquier algoritmo?" | "Soporta algoritmos iterativos con FOR/WHILE/REPEAT, recursivos con llamadas directas, e híbridos. Backtracking, branch and bound y voraces solo tienen contenido pedagógico, no análisis formal." |
| "¿Qué pasa con un WHILE complejo?" | "El motor reconoce 12 patrones. Si el WHILE no coincide con ningún patrón, reporta 'unknown' en lugar de inventar una cota." |
| "¿Por qué no usaron IA para todo?" | "Porque los LLM alucinan cotas y no son reproducibles. El motor determinista permite oráculos en tests y resultados consistentes para uso académico." |
| "¿El PDF siempre funciona?" | "Markdown y LaTeX siempre funcionan. El PDF requiere pdflatex instalado en el servidor. Si no está, el sistema lo reporta explícitamente." |
| "¿Los quizzes son evaluativos?" | "Son instrumentos de práctica con calificación determinista. El progreso se guarda en el navegador. No hay certificación ni LMS." |
| "¿Cómo se compara con ChatGPT?" | "ChatGPT puede analizar cualquier texto pero no es confiable para complejidad. AALIE es acotado pero exacto y reproducible. El LLM en AALIE es solo apoyo pedagógico." |
| "¿Por qué no analiza complejidad espacial?" | "No está en el alcance del MVP actual. El equipo lo considera para trabajo futuro." |

## Frases prohibidas y recomendadas

### Prohibidas (no usar en presentación ni documentación)

1. **"La IA calcula la complejidad"** → Falso. El motor determinista calcula. El LLM es opcional.
2. **"Soporta cualquier algoritmo"** → Falso. Solo los que entren en la gramática y patrones del motor.
3. **"El caso promedio siempre está resuelto"** → Falso. Requiere modelo probabilístico definido.
4. **"Analiza backtracking y branch and bound formalmente"** → Falso. Solo contenido pedagógico.
5. **"AALIE es un IDE de algoritmos"** → Falso. Es un analizador educativo, no un entorno de desarrollo.

### Recomendadas

1. **"El motor formal es determinista"** → Énfasis en reproducibilidad.
2. **"El asistente LLM es apoyo pedagógico"** → Clarifica el rol de la IA.
3. **"Cuando no hay evidencia suficiente, AALIE prefiere no inventar"** → Muestra honestidad del sistema.
4. **"El export usa snapshot para evitar drift entre UI y reporte"** → Explica la arquitectura de export.
5. **"El análisis es reproducible: misma entrada, mismo resultado"** → Valor académico clave.
6. **"AALIE es un aliado pedagógico, no un sustituto del profesor"** → Posicionamiento correcto.

## Archivos relacionados

- `vision.md` — visión del producto
- `final-scope.md` — alcance detallado
- `known-limitations.md` — límites a mencionar
- `theoretical-foundations.md` — base teórica
- `generative-ai-usage.md` — uso de IA en el proyecto
