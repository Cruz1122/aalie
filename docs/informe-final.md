# Informe Final del Proyecto

## 1. Portada

**Nombre del Proyecto:** Analizador de Complejidad Algorítmica

**Integrantes del Grupo:** Juan Camilo Cruz Parra, Jhon Hander Patiño Londoño, Juan Felipe Henao Tovar

**Fecha de Entrega:** 05/12/2025

---

## 2. Introducción

### 2.1 Descripción General del Propósito del Proyecto

El proyecto consiste en el desarrollo de un sistema automatizado para el análisis de complejidad algorítmica de algoritmos expresados en pseudocódigo. El sistema permite determinar automáticamente la función de eficiencia $T(n)$, su complejidad polinómica simplificada y las notaciones asintóticas ($O$, $\Omega$, $\Theta$) para algoritmos tanto iterativos como recursivos.

### 2.2 Motivación y Objetivos Principales

**Motivación:**

El análisis de complejidad algorítmica es fundamental en ciencias de la computación, pero su realización manual es propensa a errores y consume tiempo considerable. Este proyecto busca proporcionar una herramienta educativa moderna que:

- Automatice el proceso de análisis de complejidad temporal
- Proporcione visualizaciones interactivas de los resultados
- Integre asistencia con modelos de lenguaje para explicaciones y correcciones
- Facilite el aprendizaje mediante análisis paso a paso

**Objetivos Principales:**

1. **Análisis Automático Completo:**
   - Soporte para algoritmos iterativos y recursivos
   - Análisis de best case, worst case y average case
   - Detección automática del tipo de algoritmo y métodos aplicables

2. **Métodos de Análisis Avanzados:**
   - Teorema Maestro para recurrencias divide-and-conquer
   - Método de Iteración para despliegue iterativo
   - Árbol de Recursión para visualización
   - Ecuación Característica para recurrencias lineales

3. **Integración con Inteligencia Artificial:**
   - Chatbot interactivo para asistencia
   - Reparación automática de código con errores
   - Comparación y validación de análisis con LLMs

4. **Visualizaciones Interactivas:**
   - Tablas de costos por línea
   - Árboles de recursión interactivos
   - Diagramas de flujo generados con IA
   - Trazas de ejecución paso a paso

---

## 3. Análisis del Problema

### 3.1 Naturaleza del Problema Abordado

El problema consiste en realizar análisis estático de complejidad algorítmica a partir de código fuente en pseudocódigo. El sistema debe:

- **Parsear** código fuente en pseudocódigo estructurado
- **Clasificar** el tipo de algoritmo (iterativo, recursivo, híbrido)
- **Extraer** estructuras de control y dependencias
- **Calcular** funciones de eficiencia $T(n)$ para diferentes casos
- **Simplificar** expresiones matemáticas simbólicas
- **Determinar** notaciones asintóticas ($O$, $\Omega$, $\Theta$)

**Características del Problema:**

- **Análisis Estático:** No requiere ejecución del código
- **Simbólico:** Maneja expresiones matemáticas con variables
- **Multi-caso:** Debe considerar best, worst y average case
- **Multi-método:** Diferentes técnicas según el tipo de algoritmo

### 3.2 Tipos de Algoritmos y Estructuras Esperadas como Entrada

El sistema está diseñado para analizar:

**Algoritmos Iterativos:**
- Bucles `FOR` con rangos conocidos
- Bucles `WHILE` y `REPEAT` con condiciones
- Estructuras condicionales `IF/ELSE`
- Anidamiento de bucles y condicionales
- Arrays y operaciones sobre ellos

**Algoritmos Recursivos:**
- Recursión simple (una rama)
- Recursión múltiple (múltiples ramas)
- Divide-and-conquer (división en subproblemas)
- Recursión con desplazamiento lineal ($T(n-1)$, $T(n-2)$, etc.)
- Recursión exponencial

**Algoritmos Híbridos:**
- Combinación de estructuras iterativas y recursivas
- Algoritmos que usan ambos paradigmas

### 3.3 Alcances y Limitaciones del Sistema

**Alcances:**

- Análisis completo de complejidad temporal para algoritmos iterativos y recursivos
- Detección automática de métodos aplicables (Teorema Maestro, Iteración, Árbol, Ecuación Característica)
- Cálculo de funciones de eficiencia $T_{open}(n)$ y $T_{poly}(n)$
- Determinación de notaciones asintóticas ($O$, $\Omega$, $\Theta$)
- Visualización interactiva de resultados
- Asistencia con modelos de lenguaje para explicaciones y correcciones

**Limitaciones:**

1. **Parser y Caracteres Especiales:**
   - El parser no reconoce correctamente caracteres especiales Unicode como flechas (🡨, ←, ⟵) aunque la gramática los define. Se recomienda usar operadores ASCII estándar (`<-` o `:=`).

2. **Expresiones Simbólicas Complejas:**
   - Limitaciones en la simplificación de expresiones simbólicas muy complejas con SymPy, que pueden causar explosión de términos y ser el cuello de botella real del sistema.

3. **Detección de Casos Base:**
   - Ambigüedades en la detección automática de casos base en algoritmos recursivos complejos.

4. **Bucles WHILE:**
   - Dificultades en el manejo de bucles `WHILE` con condiciones complejas, especialmente para el caso promedio.

5. **Sumatorias Anidadas:**
   - Limitaciones en el cierre de sumatorias anidadas muy profundas.

6. **Recurrencias No Estándar:**
   - Algoritmos con recurrencias que no encajan en los métodos implementados pueden requerir análisis manual.

---

## 4. Entrada de Datos al Sistema

### 4.1 Formato y Sintaxis del Seudocódigo

El sistema utiliza una gramática ANTLR4 definida en `packages/grammar/grammar/Language.g4` que soporta:

**Definición de Procedimientos:**
```
nombreProcedimiento(parametros) BEGIN
    sentencias...
END
```

**Tipos de Parámetros:**
- Parámetros escalares: `procedimiento(a, b, c)`
- Parámetros de array: `A[n]`, `A[1]..[n]`, `A[i]..[j]`

**Estructuras de Control:**
- Condicionales: `IF (condición) THEN BEGIN ... END ELSE BEGIN ... END`
- Bucles FOR: `FOR variable <- inicio TO fin DO BEGIN ... END`
- Bucles WHILE: `WHILE (condición) DO BEGIN ... END`
- Bucles REPEAT: `REPEAT ... UNTIL (condición);`

**Operadores:**
- Asignación: `<-`, `:=`, `🡨`, `←`, `⟵` (aunque Unicode puede tener problemas)
- Comparación: `=`, `!=`, `<>`, `≠`, `<`, `>`, `<=`, `≤`, `>=`, `≥`
- Aritméticos: `+`, `-`, `*`, `/`, `DIV` (división entera), `MOD` (módulo)
- Lógicos: `AND`, `OR`, `NOT`

**Llamadas a Procedimientos:**
- Como sentencia: `CALL nombre(params);` (para procedimientos que no devuelven valor en expresión)
- Como expresión: `nombre(params)` (sin CALL, para usar en RETURN, asignaciones, etc.)

**Arrays:**
- Notación base 1: `A[1]..A[n]`
- Acceso: `A[i]`

**Comentarios:**
- Una línea: `// comentario`

### 4.2 Descripción de Cómo se Ingresan los Datos

**Mediante Interfaz Web:**

1. **Editor Monaco:**
   - Editor de código en el navegador (VS Code en el navegador)
   - Syntax highlighting para pseudocódigo
   - Validación en tiempo real mediante Web Workers
   - Autocompletado y numeración de líneas
   - Múltiples operadores de asignación soportados

2. **Modo Manual:**
   - Usuario escribe código directamente en el editor
   - Validación instantánea mientras escribe
   - Botón "Analizar" para iniciar el proceso

3. **Modo AI (Chatbot):**
   - Usuario puede describir algoritmos en lenguaje natural
   - El chatbot (Jhon Jairo) asiste con la generación de código
   - Integración con LLM para sugerencias y correcciones

**Cargando Archivos de Texto:**

- El sistema puede recibir código fuente mediante API REST
- Endpoint `POST /grammar/parse` para parseo
- Endpoint `POST /analyze/open` para análisis completo
- Formato JSON con campo `input` conteniendo el código

**Desde Ejemplos Precargados:**

- Página de ejemplos con algoritmos comunes
- Selección de ejemplo carga código en el editor
- Análisis automático al seleccionar

### 4.3 Consideraciones Especiales sobre Sentencias en Lenguaje Natural

El sistema soporta parcialmente sentencias en lenguaje natural mediante integración con LLMs:

**Asistencia con IA:**
- El chatbot puede interpretar descripciones en lenguaje natural
- Genera código en la gramática correcta del proyecto
- Corrige errores de sintaxis automáticamente
- Explica algoritmos paso a paso

**Limitaciones:**
- Las descripciones muy ambiguas pueden requerir múltiples iteraciones
- El LLM debe seguir estrictamente la gramática del proyecto
- No todos los conceptos en lenguaje natural se traducen directamente

**Ejemplo de Uso:**
- Usuario: "Quiero un algoritmo que busque un elemento en un array"
- Chatbot: Genera código de búsqueda lineal en la gramática correcta
- Sistema: Analiza el código generado automáticamente

---

## 5. Estrategia Algorítmica y Técnica

### 5.1 Técnicas Algorítmicas Aplicadas en el Analizador

#### 5.1.1 Patrón Strategy

El sistema implementa el **Patrón Strategy** mediante `AnalyzerRegistry` para seleccionar dinámicamente el analizador apropiado según el tipo de algoritmo detectado.

**Implementación:**
```python
# apps/api/app/modules/analysis/analyzers/registry.py
AnalyzerRegistry = {
    "iterative": IterativeAnalyzer,
    "recursive": RecursiveAnalyzer,
    "hybrid": RecursiveAnalyzer,
    "dummy": DummyAnalyzer
}
```

**Uso:**
```python
algorithm_kind = detect_algorithm_kind(ast)
analyzer_class = AnalyzerRegistry.get(algorithm_kind)
analyzer = analyzer_class()
result = analyzer.analyze(ast, mode, ...)
```

**Ventajas:**
- Desacoplamiento entre detección y análisis
- Extensibilidad: fácil agregar nuevos tipos de analizadores
- Polimorfismo: misma interfaz para diferentes estrategias

#### 5.1.2 Programación Dinámica (Memoización)

El sistema implementa **memoización** para optimizar el análisis de algoritmos con estructuras repetitivas.

**Mecanismo:**
- **Clave de cache**: `"{node_id}|{mode}|{context_hash}"`
  - `node_id`: Identificador estable del nodo (posición o hash)
  - `mode`: Modo de análisis (`worst`, `best`, `avg`)
  - `context_hash`: Hash del `loop_stack` (bucles anidados activos)
- **Almacenamiento**: Diccionario hash en memoria (`Dict[str, List[LineCost]]`)

**Activación automática:**
- Bloques de código (`Block`): Se cachean resultados completos
- Bucles (`For`, `While`, `Repeat`): Se cachean análisis de cuerpos
- Condicionales (`If`): Se cachean ramas THEN y ELSE por separado

**Impacto en la Eficiencia:**
- **Sin Memoización**: $O(N \cdot D)$ - cada nodo se re-evalúa
- **Con Memoización**: $O(N + M)$ - complejidad amortizada donde $M$ son los estados únicos

**Overhead:**
- **Espacial**: $O(M)$ para almacenar resultados parciales
- **Temporal**: $O(1)$ para generar claves de hash y búsquedas

#### 5.1.3 Visitor Pattern

El sistema utiliza el **Visitor Pattern** para recorrer el AST mediante visitantes especializados:

**Visitantes implementados:**
- `ForVisitor`: Análisis de bucles FOR
- `WhileRepeatVisitor`: Análisis de bucles WHILE/REPEAT
- `IfVisitor`: Análisis de condicionales IF/ELSE
- `SimpleVisitor`: Análisis de sentencias simples (asignaciones, returns, etc.)

**Ventajas:**
- Separación de responsabilidades: cada visitante maneja un tipo de nodo
- Extensibilidad: fácil agregar nuevos tipos de análisis
- Mantenibilidad: código organizado por tipo de constructo

#### 5.1.4 Computación Simbólica (SymPy)

El sistema integra **SymPy** para operaciones matemáticas simbólicas:

**Aplicaciones:**
- **Cierre de sumatorias**: Resolución de formas cerradas de sumatorias anidadas
- **Simplificación de expresiones**: Reducción de expresiones polinómicas complejas
- **Resolución de recurrencias**: Cálculo de soluciones de ecuaciones de recurrencia
- **Cálculo de límites**: Para determinar notaciones asintóticas

**Ejemplo de uso:**
```python
from sympy import Symbol, Sum, simplify

n = Symbol('n')
# Cerrar sumatoria: Σ(i=1 to n) i = n(n+1)/2
sum_expr = Sum(i, (i, 1, n))
closed_form = simplify(sum_expr.doit())  # n*(n + 1)/2
```

#### 5.1.5 Parser Generado (ANTLR4)

El sistema utiliza **ANTLR4** para generar parsers a partir de una gramática:

**Gramática:**
- Definida en `packages/grammar/grammar/Language.g4`
- Tipo: LL(*) / ALL(*)
- Genera parsers para TypeScript y Python

**Ventajas:**
- Mantenibilidad: gramática centralizada
- Consistencia: mismo parser para frontend y backend
- Extensibilidad: fácil agregar nuevas construcciones

#### 5.1.6 Modelos Probabilísticos

El sistema implementa modelos probabilísticos para el análisis de **caso promedio**:

**Modelos implementados:**
- **Modelo Uniforme**: Distribución uniforme de probabilidades
- **Modelo Simbólico**: Expresiones simbólicas para probabilidades

**Aplicación:**
- Cálculo de esperanza matemática $E[N_\ell]$ para cada línea $\ell$
- Consideración de early returns y condiciones probabilísticas
- Generación de procedimientos paso a paso en LaTeX

#### 5.1.7 Métodos de Resolución de Recurrencias

El sistema implementa **cuatro métodos** para resolver recurrencias recursivas:

**5.1.7.1 Teorema Maestro**

Para recurrencias divide-and-conquer estándar:
$$ T(n) = a \cdot T(n/b) + f(n) $$

**Casos:**
1. $f(n) < n^{\log_b a}$: $T(n) = \Theta(n^{\log_b a})$
2. $f(n) = n^{\log_b a}$: $T(n) = \Theta(n^{\log_b a} \log n)$
3. $f(n) > n^{\log_b a}$: $T(n) = \Theta(f(n))$

**5.1.7.2 Método de Iteración**

Despliega la recurrencia iterativamente para obtener forma cerrada:
$$ T(n) = T(n-1) + g(n) \Rightarrow T(n) = T(0) + \sum_{i=1}^{n} g(i) $$

**5.1.7.3 Árbol de Recursión**

Visualiza el árbol de llamadas recursivas para divide-and-conquer:
- Construcción del árbol nivel por nivel
- Cálculo de costos por nivel
- Suma de costos totales

**5.1.7.4 Ecuación Característica**

Para recurrencias lineales homogéneas y no homogéneas:
- Resolución de ecuación característica $r^k - a_1 r^{k-1} - \ldots - a_k = 0$
- Solución homogénea y particular
- Aplicación de condiciones iniciales

**Detección automática:**
El sistema detecta automáticamente qué métodos son aplicables según el tipo de recurrencia detectada.

### 5.2 Razonamiento detrás de las Elecciones Realizadas

**Patrón Strategy:**
- Permite desacoplamiento entre la detección del tipo de algoritmo y su análisis
- Facilita la extensión del sistema con nuevos tipos de analizadores
- Mantiene el código organizado y mantenible

**Memoización:**
- Optimiza significativamente el análisis de algoritmos con estructuras repetitivas
- Transforma el problema de visitar un árbol (potencialmente exponencial) en visitar un DAG
- El overhead es mínimo comparado con el beneficio

**Visitor Pattern:**
- Separa el recorrido del AST de la lógica de análisis
- Facilita el mantenimiento y la extensión
- Permite agregar nuevos tipos de análisis sin modificar el código existente

**SymPy:**
- Proporciona capacidades matemáticas avanzadas para simplificación y resolución
- Es la biblioteca estándar de facto para computación simbólica en Python
- Permite manejar expresiones complejas que serían difíciles de implementar manualmente

**ANTLR4:**
- Permite definir la gramática de forma declarativa
- Genera parsers eficientes y mantenibles
- Facilita la sincronización entre frontend y backend

**Modelos Probabilísticos:**
- Permiten análisis riguroso del caso promedio
- Consideran distribuciones de probabilidad realistas
- Generan explicaciones matemáticas detalladas

### 5.3 Dificultades Encontradas en la Deducción de las Complejidades Algorítmicas

**1. Manejo de Bucles WHILE:**

Los bucles `WHILE` presentan desafíos particulares:

- **Caso Base:** Determinar cuándo un bucle `WHILE` termina puede requerir análisis de invariantes
- **Caso Promedio:** Calcular el número esperado de iteraciones requiere modelos probabilísticos
- **Condiciones Complejas:** Las condiciones que dependen de múltiples variables dificultan el análisis

**Ejemplo de dificultad:**
```pseudocode
WHILE (i < n AND A[i] != x) DO BEGIN
    i <- i + 1;
END
```
El número de iteraciones depende tanto de `n` como de la posición de `x` en el array.

**2. Simplificación de Expresiones Simbólicas Complejas:**

SymPy puede enfrentar dificultades con:

- **Sumatorias anidadas muy profundas:** Pueden generar expresiones exponencialmente grandes antes de simplificarse
- **Expresiones con múltiples variables:** La simplificación puede ser computacionalmente costosa
- **Límites complejos:** Algunos límites pueden no tener forma cerrada conocida

Este es el **cuello de botella real** del sistema en la práctica.

**3. Detección de Casos Base en Recursión:**

- **Casos base múltiples:** Algoritmos con varios casos base pueden ser difíciles de detectar automáticamente
- **Casos base condicionales:** Cuando el caso base depende de condiciones complejas
- **Casos base implícitos:** Algunos algoritmos tienen casos base que no son explícitos en el código

**4. Cierre de Sumatorias Anidadas Complejas:**

- **Sumatorias con límites dependientes:** $\sum_{i=1}^{n} \sum_{j=1}^{i} \ldots$ requiere simplificación cuidadosa
- **Sumatorias con expresiones complejas:** Cuando el término de la sumatoria es una expresión compleja
- **Sumatorias infinitas:** Algunas sumatorias pueden no tener forma cerrada

---

## 6. Arquitectura e Implementación del Sistema

### 6.1 Patrón Arquitectónico Adoptado

El sistema adopta una **arquitectura por capas** con separación clara entre frontend y backend, organizada en un **monorepo** con paquetes compartidos.

**Modelo Arquitectónico:**
- **Arquitectura por Capas:** Separación de responsabilidades en capas lógicas
- **Monorepo:** Un solo repositorio con múltiples paquetes (`apps/`, `packages/`)
- **Cliente-Servidor:** Frontend (Next.js) se comunica con Backend (FastAPI) mediante API REST
- **Microservicios (parcial):** Separación de módulos funcionales en el backend

**Distribución de Responsabilidades:**

- **Frontend (Next.js):** Interfaz de usuario, validación en tiempo real, visualizaciones
- **Backend (FastAPI):** Lógica de negocio, análisis de complejidad, integración con LLMs
- **Paquetes Compartidos:** Gramática ANTLR4 y tipos TypeScript compartidos

**Metodología de Desarrollo:**
- **Scrum** con planificación mediante **GitHub Projects**
- **6 sprints** de 2 semanas cada uno
- Desarrollo modular e incremental
- Testing incremental (unitarios → integración → sistema)
- Documentación continua
- CI/CD automatizado con GitHub Actions

### 6.2 Justificación del Diseño

**Separación de Responsabilidades:**
- Cada módulo tiene una responsabilidad única y bien definida
- Facilita el mantenimiento y la comprensión del código
- Permite trabajar en paralelo en diferentes módulos

**Escalabilidad:**
- Fácil agregar nuevos analizadores mediante el patrón Strategy
- Nuevos métodos de análisis se pueden agregar sin modificar código existente
- La arquitectura modular permite escalar componentes independientemente

**Extensibilidad Futura:**
- Patrón Strategy permite agregar nuevos tipos de analizadores
- Visitor Pattern facilita agregar nuevos tipos de análisis
- La gramática ANTLR4 se puede extender con nuevas construcciones

**Interoperabilidad con Otros Componentes:**
- API REST permite integración con cualquier cliente
- Integración con LLMs mediante endpoints estándar
- Los paquetes compartidos garantizan consistencia entre frontend y backend

**Mantenibilidad:**
- Código organizado y bien estructurado
- Tests incrementales aseguran calidad
- Documentación continua facilita el mantenimiento

### 6.3 Diagrama de Arquitectura
arquitectura.png

### 6.4 Componentes del Sistema

#### 6.4.1 Módulo de Entrada (Frontend)

**Editor Monaco:**
- `components/AnalyzerEditor.tsx`: Editor de código con validación en tiempo real
- `workers/parser.worker.ts`: Web Worker para parseo sin bloquear UI
- `lib/monaco-diagnostics.ts`: Validación y diagnóstico de errores

**Modos de Entrada:**
- Modo Manual: Editor directo
- Modo AI: Chatbot integrado
- Ejemplos: Selección de algoritmos precargados

#### 6.4.2 Analizador Léxico y Sintáctico

**Backend - Módulo de Parseo:**
- `modules/parsing/router.py`: Endpoint `POST /grammar/parse`
- `modules/parsing/service.py`: Lógica de negocio de parseo
- `modules/parsing/adapter.py`: Adaptador para parser ANTLR4
- `modules/parsing/schemas.py`: Modelos Pydantic para validación

**Paquete Compartido:**
- `packages/grammar/`: Gramática ANTLR4 y parsers generados
  - `grammar/Language.g4`: Definición de la gramática
  - `src/ts/`: Parser TypeScript generado
  - `py/src/`: Parser Python generado

#### 6.4.3 Evaluador Semántico

**Visitors del AST:**
- `modules/analysis/visitors/for_visitor.py`: Análisis de bucles FOR
- `modules/analysis/visitors/while_repeat_visitor.py`: Análisis de bucles WHILE/REPEAT
- `modules/analysis/visitors/if_visitor.py`: Análisis de condicionales IF/ELSE
- `modules/analysis/visitors/simple_visitor.py`: Análisis de sentencias simples

#### 6.4.4 Módulo de Deducción de Complejidad

**Analyzers:**
- `modules/analysis/analyzers/base.py`: Clase base con utilidades comunes
- `modules/analysis/analyzers/iterative.py`: Analizador para algoritmos iterativos
- `modules/analysis/analyzers/recursive.py`: Analizador para algoritmos recursivos
- `modules/analysis/analyzers/registry.py`: Registry (Patrón Strategy)

**Utilidades:**
- `modules/analysis/utils/summation_closer.py`: Cierre de sumatorias con SymPy
- `modules/analysis/utils/expr_converter.py`: Conversión de expresiones
- `modules/analysis/utils/complexity_classes.py`: Clasificación de complejidad

**Modelos:**
- `modules/analysis/models/avg_model.py`: Modelo probabilístico para caso promedio

#### 6.4.5 Motor de Interacción con el Modelo de Lenguaje (LLM)

**Frontend:**
- `app/api/llm/route.ts`: Endpoint principal para LLM
- `app/api/llm/llm-config.ts`: Configuración de jobs y prompts
- `components/ChatBot.tsx`: Componente del chatbot
- `components/RepairModal.tsx`: Modal de reparación de código
- `components/ComparisonModal.tsx`: Modal de comparación de análisis

**Jobs del LLM:**
- `parser_assist`: Asistencia con código y gramática
- `general`: Consultas generales
- `repair`: Reparación de código con errores
- `compare`: Comparación de análisis
- `validate`: Validación de análisis
- `generate-diagram`: Generación de diagramas de flujo
- `recursion-diagram`: Generación de árboles de recursión

#### 6.4.6 Interfaz de Usuario

**Páginas:**
- `app/page.tsx`: Página principal (home) con selector de modo
- `app/analyzer/page.tsx`: Página de resultados del análisis
- `app/user-guide/page.tsx`: Guía de usuario
- `app/documentation/page.tsx`: Documentación técnica
- `app/examples/page.tsx`: Ejemplos de algoritmos

**Componentes Principales:**
- `components/IterativeAnalysisView.tsx`: Vista para algoritmos iterativos
- `components/RecursiveAnalysisView.tsx`: Vista para algoritmos recursivos
- `components/LineTable.tsx`: Tabla de costos por línea
- `components/CostsTable.tsx`: Tabla de costos agregados
- `components/RecursionTreeModal.tsx`: Modal de árbol de recursión
- `components/CharacteristicEquationModal.tsx`: Modal de ecuación característica
- `components/AnalysisLoader.tsx`: Loader de progreso animado

### 6.5 Flujo de Datos y Lógica Interna

#### 6.5.1 Flujo desde el Chatbot

1. **Usuario envía mensaje** → `ChatBot.tsx`
2. **Clasificación de intención** → `classifyIntent()` (local o LLM)
3. **Determinación del job** → `parser_assist` o `general`
4. **Llamada a API** → `POST /api/llm` con job y mensaje
5. **Procesamiento LLM** → Gemini procesa con contexto e historial
6. **Respuesta** → Chatbot muestra respuesta
7. **Si el usuario solicita análisis** → Código se envía a análisis automático
8. **Navegación** → `/analyzer` con resultados

#### 6.5.2 Flujo desde el Editor Manual

1. **Usuario escribe código** → `AnalyzerEditor.tsx`
2. **Validación en tiempo real** → Web Worker (`parser.worker.ts`) parsea en background
3. **Errores mostrados** → Monaco muestra errores de sintaxis
4. **Usuario inicia análisis** → Click en "Analizar"
5. **Loader de progreso** → `AnalysisLoader.tsx` muestra animación
6. **Parseo** → `POST /grammar/parse` (si no está parseado)
7. **Clasificación** → `POST /classify` identifica tipo de algoritmo
8. **Análisis** → `POST /analyze/open` con modo(s) solicitado(s)
9. **Progreso animado** → `useAnalysisProgress` actualiza progreso
10. **Resultados** → Almacenados en `sessionStorage`
11. **Navegación** → `/analyzer` con resultados cargados

#### 6.5.3 Flujo desde /analyzer

1. **Carga de resultados** → `sessionStorage.getItem('analyzerCode')` y resultados
2. **Detección de tipo** → Algoritmo iterativo o recursivo
3. **Renderizado** → `IterativeAnalysisView` o `RecursiveAnalysisView`
4. **Visualizaciones** → Tablas, AST, árboles de recursión, procedimientos
5. **Interacción** → Usuario puede cambiar entre worst/best/avg case
6. **Modales** → Árbol de recursión, ecuación característica, comparación con LLM

#### 6.5.4 Flujo desde Ejemplos

1. **Selección de ejemplo** → Usuario selecciona algoritmo de la lista
2. **Carga en editor** → Código se carga en `AnalyzerEditor`
3. **Análisis automático** → Si está configurado, se inicia análisis automáticamente
4. **Mismo flujo que editor manual** → Sigue el flujo 6.5.2 desde el paso 4

### 6.6 Manejo de Errores y Validación de Entrada

#### 6.6.1 Detección de Entradas Mal Estructuradas

**Parser:**
- Errores de sintaxis detectados por ANTLR4
- Posiciones exactas de errores (línea y columna)
- Mensajes descriptivos de errores
- Endpoint `/grammar/parse` retorna errores estructurados

**Monaco Editor:**
- Validación en tiempo real mediante Web Worker
- Errores mostrados con subrayado rojo
- Tooltips con descripción del error
- No bloquea la UI durante validación

#### 6.6.2 Información al Usuario sobre Errores

**Errores de Formato:**
- Mensajes claros y descriptivos
- Indicación de línea y columna
- Sugerencias de corrección cuando es posible

**Errores de Semántica:**
- Validación de tipos cuando es aplicable
- Detección de variables no definidas
- Verificación de llamadas a procedimientos

#### 6.6.3 Mecanismos de Recuperación o Sugerencia

**Parser:**
- El parser intenta recuperarse de errores menores
- Continúa parseando después de errores cuando es posible

**Botón de Ayuda con IA:**
- Integrado en el editor
- Usuario puede solicitar ayuda con código con errores
- LLM sugiere correcciones basadas en el contexto

**Reparación con IA:**
- Modal `RepairModal.tsx` para reparación automática
- LLM analiza errores y genera código corregido
- Usuario puede aceptar o rechazar sugerencias
- Comparación entre código original y corregido

**Validación de API Key:**
- Validación de formato de API key de Gemini
- Verificación de autenticidad mediante llamada a API
- Mensajes claros sobre errores de autenticación

### 6.7 Estructura del Código y Organización de Archivos

#### 6.7.1 Organización del Proyecto

```
algorithmic-analysis/
├── apps/
│   ├── web/                    # Frontend Next.js
│   │   ├── src/
│   │   │   ├── app/            # Páginas (App Router)
│   │   │   ├── components/    # Componentes React
│   │   │   ├── hooks/          # Hooks personalizados
│   │   │   ├── services/      # Servicios API
│   │   │   ├── workers/        # Web Workers
│   │   │   ├── lib/            # Utilidades
│   │   │   └── types/          # Tipos TypeScript
│   │   └── package.json
│   │
│   └── api/                     # Backend FastAPI
│       ├── app/
│       │   ├── main.py         # Punto de entrada
│       │   ├── core/           # Configuración
│       │   └── modules/        # Módulos funcionales
│       │       ├── parsing/
│       │       ├── analysis/
│       │       ├── classification/
│       │       └── shared/
│       ├── tests/              # Suite de pruebas
│       │   ├── unit/
│       │   ├── integration/
│       │   └── system/
│       └── requirements.txt
│
├── packages/
│   ├── grammar/                # Gramática ANTLR4
│   │   ├── grammar/
│   │   │   └── Language.g4
│   │   ├── src/ts/            # Parser TypeScript
│   │   └── py/src/            # Parser Python
│   │
│   └── types/                  # Tipos compartidos
│       └── src/
│           └── index.ts
│
├── docs/                       # Documentación
│   ├── informe-final.md
│   ├── informe-tecnico.md
│   ├── analisis-complejidad-analizador.md
│   └── pruebas-algoritmos.md
│
├── docker-compose.yml          # Configuración Docker
├── README.md                   # Documentación principal
└── .github/
    └── workflows/
        └── ci.yaml            # CI/CD
```

#### 6.7.2 Convenciones de Nomenclatura

**Frontend (TypeScript):**
- Componentes: PascalCase (`AnalyzerEditor.tsx`)
- Hooks: camelCase con prefijo `use` (`useAnalysisProgress.ts`)
- Servicios: camelCase (`grammar-api.ts`)
- Tipos: PascalCase (`AnalyzeOpenResponse`)

**Backend (Python):**
- Módulos: snake_case (`analysis_service.py`)
- Clases: PascalCase (`IterativeAnalyzer`)
- Funciones: snake_case (`analyze_algorithm`)
- Constantes: UPPER_SNAKE_CASE (`API_KEY`)

#### 6.7.3 Archivos de Configuración

**Frontend:**
- `package.json`: Dependencias y scripts
- `tsconfig.json`: Configuración TypeScript
- `next.config.js`: Configuración Next.js
- `.env.local`: Variables de entorno (API keys)

**Backend:**
- `requirements.txt`: Dependencias Python
- `requirements-dev.txt`: Dependencias de desarrollo
- `pyproject.toml`: Configuración de herramientas (Ruff, Black, Coverage, Pytest)
- `.env`: Variables de entorno

**Docker:**
- `docker-compose.yml`: Configuración de contenedores
- `Dockerfile` (si aplica): Imágenes personalizadas

#### 6.7.4 Dependencias Externas o Bibliotecas Requeridas

**Frontend:**
- Next.js 14: Framework React
- TypeScript: Tipado estático
- Monaco Editor: Editor de código
- React Flow: Visualización de grafos (árboles de recursión)
- KaTeX: Renderizado de fórmulas matemáticas
- Tailwind CSS: Estilos

**Backend:**
- FastAPI: Framework web
- ANTLR4: Generación de parsers
- SymPy: Computación simbólica
- Pydantic: Validación de datos
- pytest: Framework de testing
- coverage: Cobertura de código

**LLMs:**
- Google Gemini API: Modelos de lenguaje

### 6.8 Metodología y Plan de Sprints

#### 6.8.1 Enfoque de Desarrollo

El proyecto se desarrolló siguiendo una metodología **Scrum** con planificación mediante **GitHub Projects**, organizando el trabajo en sprints de 2 semanas cada uno. Esta metodología permitió:

- Desarrollo modular basado en arquitectura por capas
- Separación clara entre frontend y backend (monorepo)
- Testing incremental (unitarios → integración → sistema)
- Documentación continua
- CI/CD automatizado con GitHub Actions

#### 6.8.2 Plan de Sprints

El desarrollo se estructuró en **6 sprints** de 2 semanas cada uno:

**Sprint 1 - Fundamentos del Analizador**

**Objetivo:** Construir la base del proyecto.

**Entregables:**
- Configuración del monorepo (Next.js + FastAPI + Docker)
- Parser con ANTLR4 y AST unificado
- Normalización de sintaxis y reglas
- Infraestructura inicial con Docker Compose

**Sprint 2 - Análisis Iterativo (Worst-Case) + Integración en Frontend**

**Objetivo:** Resolver completamente análisis iterativo caso peor y mostrarlo visualmente.

**Entregables Backend:**
- Cálculo de complejidad por línea
- Identificación y conteo de bucles anidados
- Propagación de costos hasta Big-O (worst-case)
- Detección de branches (IF/ELSE) en peor caso
- Serialización de análisis en JSON

**Entregables Frontend:**
- Panel de resultados con Big-O final
- Visualización de costo por línea
- Árbol de bloques iterativos
- Visualización clara en la UI del análisis worst-case

**Sprint 3 - Best & Average Case + SymPy + Chatbot (LLM)**

**Objetivo:** Completar análisis iterativo en los 3 casos y añadir capacidades simbólicas + LLM.

**Entregables Backend:**
- Motor de selección de caminos (mejor caso y caso promedio)
- Integración con SymPy para:
  - Simplificación de expresiones
  - Cálculo simbólico de polinomios, logs, sumatorias y recurrencias simples
- Chatbot LLM:
  - Explicación del análisis
  - Preguntas sobre el código
  - Interpretación del algoritmo paso a paso

**Entregables Frontend:**
- Panel Best / Average / Worst side-by-side
- Chat panel acoplado al algoritmo

**Sprint 4 - Extracción de Recurrencias**

**Objetivo:** Generar $T(n)$ automáticamente desde pseudocódigo recursivo.

**Entregables:**
- Identificación de llamadas recursivas (1 rama, multi-rama, divide-and-conquer)
- Extracción de parámetros: $n$, $n-1$, $n-k$, $n/b$
- Construcción del modelo $\langle a, b, f(n) \rangle$
- Detección de:
  - Subproblemas independientes
  - Costos por nivel
  - Parámetros ambiguos
- Representación en JSON para UI
- Preprocesamiento con memoization para evitar múltiples extracciones

**Sprint 5 - Clasificador de Recurrencias + Métodos de Análisis + IA (Repair & Compare Analysis)**

**Objetivo:** Resolver $T(n)$ automáticamente y validar errores con IA.

**Entregables:**
- **Clasificador de Recurrencias:**
  - Identificación automática de tipo Master Theorem $(a, b, f(n))$
  - Recurrencias con desplazamiento lineal $T(n) = T(n-1) + \ldots$
  - Recurrencias exponenciales
  - Recurrencias polilogarítmicas

- **Solver matemático:**
  - Teorema Maestro (3 casos + subcasos)
  - Método de Iteración
  - Árbol de Recursión
  - Ecuación Característica (lineal homogénea y no homogénea)

- **SymPy para:**
  - Polinomios
  - Sumatorias
  - Logs
  - Límites

- **IA Repair & Compare Analysis:**
  - Detección automática de errores en pseudocódigo recursivo
  - Reparación sugerida del algoritmo
  - Comparación entre algoritmo original y corregido
  - Resumen de diferencias y cambios de complejidad

**Sprint 6 - Calidad, Tests, Cobertura, Documentación y CI/CD**

**Objetivo:** Cerrar versión 1.0 con calidad de ingeniería.

**Entregables:**
- **Calidad:**
  - Linter completo (Ruff)
  - Integración Black / Prettier
  - Pruebas unitarias + integración
  - Cobertura (pytest + coverage.py) - **71.48% alcanzado**

- **Documentación:**
  - Docs técnicas del analizador
  - Manual del usuario (con ejemplos)
  - Guía de estructura del pseudocódigo soportado

- **CI/CD:**
  - Pipeline de despliegue con GitHub Actions
  - Build containers
  - Tests automatizados
  - Deploy automático (API y frontend)

---

## 7. Integración de LLMs

### 7.1 Modelos Utilizados

El sistema utiliza **Google Gemini** como modelo de lenguaje principal:

- **Gemini 2.5 Pro**: Modelo de mayor capacidad usado exclusivamente para el job `compare`, que realiza comparación y validación de análisis matemáticos complejos. Proporciona análisis detallado de funciones de eficiencia, notaciones asintóticas y recurrencias, comparando los resultados del sistema con su propio análisis para detectar discrepancias y calcular nivel de confianza.

- **Gemini 2.5 Flash**: Modelo principal de alta velocidad usado para la mayoría de tareas interactivas. Se utiliza en los jobs `parser_assist` (generación y corrección de código), `general` (chatbot para consultas sobre algoritmos), `simplifier` (simplificación de expresiones matemáticas) y `repair` (reparación automática de código con errores). Ofrece un balance óptimo entre velocidad y precisión para tareas frecuentes.

- **Gemini 2.0 Flash**: Modelo usado en endpoints especializados para generación de diagramas visuales. Se utiliza en `/api/llm/recursion-diagram` (generación de árboles de recursión en formato React Flow) y `/api/llm/generate-diagram` (generación de diagramas de flujo para algoritmos iterativos). Es ideal para tareas de visualización que requieren respuestas estructuradas en JSON.

- **Gemini 2.0 Flash Lite**: Modelo configurado pero **DEPRECADO** (no se usa en producción). Estaba asignado al job `classify`, sin embargo, la clasificación de algoritmos se realiza completamente por heurística en el endpoint `/classify` del backend Python, sin necesidad de LLM. Se implementó un job `classify` que se encarga de identificar la intención del usuario al usar el chatbot.

**Configuración:**
- API Key gestionada en frontend (localStorage) o backend (variables de entorno)
- Prioridad: localStorage > variables de entorno del servidor
- Validación de formato y autenticidad de API keys

### 7.2 Integración Técnica

**Comunicación:**
- **API REST** mediante Next.js API Routes
- Endpoint principal: `POST /api/llm`
- Endpoints especializados:
  - `POST /api/llm/classify`: Clasificación de intención
  - `POST /api/llm/recursion-diagram`: Generación de árboles de recursión
  - `POST /api/llm/generate-diagram`: Generación de diagramas de flujo
  - `POST /api/llm/status`: Validación de API key

**Arquitectura:**
- Frontend envía requests a Next.js API routes
- API routes procesan y llaman a Gemini API
- Respuestas se formatean y retornan al frontend
- Historial de chat se mantiene (últimos 10 mensajes)

**Módulo Intermedio:**
- `apps/web/src/app/api/llm/llm-config.ts`: Configuración de jobs y prompts
- Cada job tiene su propio `systemPrompt` y configuración
- Schemas JSON para respuestas estructuradas cuando aplica

### 7.3 Tareas Específicas Resueltas o Asistidas por LLMs

#### 7.3.1 Chatbot Interactivo

**Jobs:**
- `parser_assist`: Asistencia específica con código y gramática del proyecto
- `general`: Consultas generales sobre algoritmos y complejidad

**Funcionalidades:**
- Explicación de algoritmos paso a paso
- Respuestas a preguntas sobre complejidad
- Generación de código en la gramática correcta
- Corrección de errores de sintaxis

#### 7.3.2 Reparación de Código

**Job:** `repair`

**Funcionalidades:**
- Detección automática de errores en pseudocódigo
- Generación de código corregido
- Explicación de los cambios realizados
- Comparación entre código original y corregido

#### 7.3.3 Comparación de Análisis

**Job:** `compare`

**Funcionalidades:**
- Compara análisis del sistema con análisis de Gemini
- Detecta diferencias en notaciones asintóticas
- Calcula nivel de confianza
- Explica discrepancias

#### 7.3.4 Generación de Diagramas

**Jobs:**
- `generate-diagram`: Diagramas de flujo para algoritmos iterativos
- `recursion-diagram`: Árboles de recursión para algoritmos recursivos

**Funcionalidades:**
- Genera grafos en formato React Flow
- Incluye estimaciones de costos (microsegundos, tokens)
- Proporciona explicaciones del comportamiento

### 7.4 Validación de la Confiabilidad de las Respuestas

#### 7.4.1 Comparación con Análisis del Sistema

- El sistema compara sus propios análisis con los del LLM
- Detecta discrepancias en notaciones asintóticas
- Calcula nivel de confianza basado en coincidencias

#### 7.4.2 Nivel de Confianza Calculado

**Cálculo:**
```typescript
function calculateConfidence(comparison: Comparison): number {
  let confidence = 100;
  
  // Penalizar por diferencias
  comparison.differences.forEach(diff => {
    switch (diff.severity) {
      case 'high': confidence -= 30; break;
      case 'medium': confidence -= 15; break;
      case 'low': confidence -= 5; break;
    }
  });
  
  // Ajustar por coincidencias
  if (comparison.timeComplexityMatch) confidence += 10;
  if (comparison.spaceComplexityMatch) confidence += 5;
  
  return Math.max(0, Math.min(100, confidence));
}
```

#### 7.4.3 Validación de Formato de Respuestas

- Validación de JSON cuando se requiere respuesta estructurada
- Verificación de campos obligatorios
- Manejo de errores de parsing
- Reintentos automáticos en caso de errores de API

#### 7.4.4 Clasificación de Intención

- Clasificación local (sin LLM) para intenciones simples
- Clasificación con LLM para casos complejos
- Normalización de respuestas para consistencia

### 7.5 Reflexión sobre la Utilidad, Precisión y Límites Observados

**Utilidad:**

- **Alta utilidad** para asistencia y explicaciones
- **Muy útil** para generación de código en la gramática correcta
- **Útil** para corrección de errores comunes
- **Moderada utilidad** para validación de análisis complejos

**Precisión:**

- **Alta precisión** en tareas de asistencia y explicación
- **Buena precisión** en generación de código cuando se siguen los prompts correctamente
- **Precisión variable** en análisis de complejidad, especialmente para casos complejos
- **Baja precisión** en algunos casos límite (recurrencias no estándar, expresiones muy complejas)

**Límites Observados:**

1. **Dependencia de Prompts:**
   - La calidad de las respuestas depende críticamente de la calidad de los prompts
   - Prompts muy largos pueden causar respuestas inconsistentes

2. **Precisión en Análisis Matemáticos:**
   - Los LLMs pueden cometer errores en análisis matemáticos complejos
   - Se recomienda siempre validar con el análisis del sistema

3. **Consistencia:**
   - Las respuestas pueden variar entre llamadas
   - Se requiere validación cruzada para casos críticos

4. **Costo:**
   - Las llamadas a la API tienen costo asociado
   - Se debe gestionar el uso para evitar costos excesivos

5. **Latencia:**
   - Las llamadas a la API pueden tener latencia significativa
   - Se debe proporcionar feedback al usuario durante el procesamiento

**Recomendaciones:**

- Usar LLMs como **asistente**, no como fuente única de verdad
- Siempre validar análisis matemáticos con el sistema
- Combinar análisis del sistema con análisis del LLM para mayor confianza
- Mejorar prompts continuamente basándose en resultados observados

---

## 8. Análisis de Eficiencia del Sistema

### 8.1 Complejidad Algorítmica del Analizador

#### 8.1.1 Parámetros del Análisis

El análisis de complejidad del analizador considera los siguientes parámetros:

- **$L$**: Longitud del código fuente (caracteres/tokens)
- **$N$**: Número de nodos en el Árbol de Sintaxis Abstracta (AST)
- **$D$**: Profundidad máxima de anidamiento de bucles/recursión
- **$S$**: Número de sumatorias a cerrar
- **$E$**: Costo de simplificación de expresiones simbólicas (SymPy)
- **$M$**: Número de nodos únicos cacheables (para memoización)

#### 8.1.2 Flujo Principal y Complejidad por Etapa

```text
función AnalyzeAlgorithm(source: string) -> AnalysisResult
  // 1. Parseo
  tokens <- Lexer(source)                      // O(L)
  ast <- Parser(tokens)                        // O(L)
  
  // 2. Clasificación
  tipo <- DetectAlgorithmKind(ast)             // O(N)
  
  // 3. Selección de Estrategia
  si tipo = "recursive" entonces
      analyzer <- RecursiveAnalyzer()          // O(1)
  sino
      analyzer <- IterativeAnalyzer()          // O(1)
  fin-si
  
  // 4. Análisis (Visita del AST con Memoización)
  resultado_raw <- analyzer.visit(ast)         // T_visit(N, D, M)
  
  // 5. Post-procesamiento
  T_open <- analyzer.buildEquation()           // O(N)
  T_poly <- Simplify(T_open)                   // O(S · E)
  notaciones <- CalculateAsymptotics(T_poly)   // O(E)
  
  retornar { T_open, T_poly, notaciones }
end-func
```

#### 8.1.3 Análisis del Mejor Caso

**Condiciones:**
- Estructura plana sin bucles anidados profundos ($D = 1$)
- Pocas o ninguna sumatoria compleja ($S \approx 0$)
- Memoización ideal ($M \approx N$ o repetición nula)
- Expresiones triviales ($E \approx O(1)$)

**Ecuación de Eficiencia:**
$$ T_{best}(N, L) = C_{parse} \cdot L + C_{visit} \cdot N + C_{overhead} $$

**Notaciones Asintóticas:**
- $O(N + L)$: Cota superior
- $\Omega(N + L)$: Cota inferior
- $\Theta(N + L)$: Cota ajustada

$$ T_{best}(N) \in \Theta(N + L) \approx \Theta(N) $$

#### 8.1.4 Análisis del Peor Caso

**Condiciones:**
- Anidamiento profundo ($D \approx N$ en casos extremos)
- Complejidad simbólica alta ($S$ grande, $E$ alto)
- Fallo de memoización ($M \approx 0$)
- Explosión de términos en simplificación simbólica

**Ecuación de Eficiencia:**
$$ T_{worst}(N, D, S, E) = C_{parse} \cdot L + C_{visit} \cdot (N \cdot D) + C_{sym} \cdot (S \cdot E) $$

**Notaciones Asintóticas:**
- $O(N \cdot D + S \cdot E + L)$: Cota superior
- $\Omega(N \cdot D + L)$: Cota inferior
- $\Theta(N \cdot D + S \cdot E + L)$: Cota ajustada

En el caso teórico más adverso donde $D \approx N$:
$$ T_{worst} \in O(N^2 + \text{costo\_algebraico}) $$

#### 8.1.5 Análisis del Caso Promedio

**Modelo Probabilístico:**
- Estructura típica: anidamiento logarítmico ($D \approx \log N$ o $D \le 3$)
- Sumatorias moderadas ($S \approx \alpha \cdot N$)
- Memoización parcial ($M \approx 0.5 N$)
- Simplificaciones estándar

**Ecuación de Eficiencia:**
$$ T_{avg}(N) = C_{parse} \cdot L + E[T_{visit}] + E[T_{sym}] $$

$$ T_{avg}(N) \approx C_1 \cdot L + C_2 \cdot (N \cdot \log D) + C_3 \cdot (S \cdot \log E) $$

**Notaciones Asintóticas:**
- $O(N \cdot \log D + S \cdot \log E + L)$: Cota superior
- $\Omega(N \cdot \log D + L)$: Cota inferior
- $\Theta(N \cdot \log D + S \cdot \log E + L)$: Cota ajustada

$$ T_{avg}(N) \in \Theta(N \cdot \log D + S \cdot \log E + L) \approx \Theta(N \cdot \log N) $$

#### 8.1.6 Memoización (Programación Dinámica)

**Mecanismo:**
- **Clave**: `Hash(Node) + Context(Multipliers) + Mode(Worst/Best/Avg)`
- **Almacenamiento**: Diccionario hash en memoria (`Dict[str, List[LineCost]]`)

**Impacto en la Eficiencia:**
- **Sin Memoización**: $O(N \cdot D)$ - cada nodo se re-evalúa
- **Con Memoización**: $O(N + M)$ - complejidad amortizada donde $M$ son los estados únicos

**Overhead:**
- **Espacial**: $O(M)$ para almacenar resultados parciales
- **Temporal**: $O(1)$ para generar claves de hash y búsquedas

#### 8.1.7 Resumen de Complejidades

| Caso | $O$ (Cota Superior) | $\Omega$ (Cota Inferior) | $\Theta$ (Cota Ajustada) |
| :--- | :--- | :--- | :--- |
| **Mejor** | $O(N + L)$ | $\Omega(N + L)$ | $\Theta(N + L)$ |
| **Promedio** | $O(N \cdot \log D + S \cdot \log E + L)$ | $\Omega(N \cdot \log D + L)$ | $\Theta(N \cdot \log D + S \cdot \log E + L)$ |
| **Peor** | $O(N \cdot D + S \cdot E + L)$ | $\Omega(N \cdot D + L)$ | $\Theta(N \cdot D + S \cdot E + L)$ |

**Donde:**
- $N$: Número de nodos en el AST
- $L$: Longitud del código fuente
- $D$: Profundidad máxima de anidamiento
- $S$: Número de sumatorias a cerrar
- $E$: Factor de complejidad de simplificación simbólica

#### 8.1.8 Observaciones Importantes

1. **Desacoplamiento**: La complejidad del *analizador* no depende de la complejidad temporal del *algoritmo analizado*. Analizar un algoritmo de $O(n!)$ (como permutaciones) no toma tiempo factorial, sino tiempo proporcional a la longitud de su código ($O(N)$).

2. **Cuello de Botella Real**: En la práctica, el parseo ($O(L)$) y la visita ($O(N)$) son muy rápidos. El verdadero cuello de botella suele ser el motor de álgebra simbólica (`SymPy`) cuando se enfrenta a expresiones matemáticas complejas ($S \cdot E$).

3. **Memoización Efectiva**: La memoización transforma el problema de visitar un árbol (potencialmente exponencial en caminos) en visitar un grafo de estados únicos (DAG), garantizando eficiencia incluso para códigos con estructuras repetitivas complejas.

### 8.2 Evaluación Empírica

#### 8.2.1 Tiempos de Ejecución por Categoría

| Categoría | Ejemplos | Tiempo Promedio |
|-----------|----------|----------------|
| Algoritmos Iterativos | 3 | 0.42s |
| Recursivos - Método Iterativo | 3 | 0.09s |
| Recursivos - Teorema Maestro | 3 | 0.11s |
| Recursivos - Árbol de Recursión | 3 | 0.15s |
| Recursivos - Ecuación Característica | 3 | 0.22s |
| **Total** | **15** | **0.20s** |

#### 8.2.2 Ejemplos de Tiempos Detallados

**Búsqueda Lineal (Iterativo):**
- Parse: 0.025s
- Clasificación: 0.015s
- Análisis: 0.495s
- **Total: 0.535s**

**Factorial Iterativo:**
- Parse: 0.012s
- Clasificación: 0.014s
- Análisis: 0.234s
- **Total: 0.260s**

**Factorial Recursivo (Método Iterativo):**
- Parse: 0.010s
- Clasificación: 0.012s
- Detección de métodos: 0.014s
- Análisis: 0.052s
- **Total: 0.087s**

**Fibonacci Recursivo (Ecuación Característica):**
- Parse: 0.012s
- Clasificación: 0.013s
- Detección de métodos: 0.012s
- Análisis: 0.250s
- **Total: 0.287s**

**MergeSort (Árbol de Recursión):**
- Parse: 0.018s
- Clasificación: 0.019s
- Detección de métodos: 0.015s
- Análisis: 0.145s
- **Total: 0.197s**

### 8.3 Comparación entre Soluciones Manuales vs Automáticas

Para evaluar la efectividad del sistema automatizado, se realizaron análisis manuales de tres algoritmos representativos y se compararon con los resultados generados automáticamente. Esta comparación permite identificar las ventajas del análisis automático y áreas donde ambos métodos son equivalentes.

#### 8.3.1 Metodología de Comparación

**Análisis Manual:**
- Realizado por un analista humano con experiencia en análisis de complejidad
- Proceso tradicional: papel y lápiz, cálculos paso a paso
- Sin asistencia de herramientas automatizadas
- Tiempo medido desde inicio hasta obtención de notaciones asintóticas

**Análisis Automático:**
- Ejecutado por el sistema desarrollado
- Tiempo medido incluyendo parseo, clasificación y análisis completo
- Resultados obtenidos directamente del sistema

**Métricas de Comparación:**
- Tiempo requerido
- Precisión matemática
- Completitud del análisis
- Facilidad de uso

#### 8.3.2 Caso de Estudio 1: Búsqueda Lineal

**Algoritmo:**
busquedaLineal(A[n], x, n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        IF (A[i] = x) THEN BEGIN
            RETURN i;
        END
    END
    RETURN -1;
END##### Análisis Manual

**Tiempo estimado:** ~15-20 minutos

**Proceso realizado:**

1. **Identificación de estructuras:**
   - Un bucle `FOR` externo que itera de 1 a n
   - Un `IF` condicional dentro del bucle con early return

2. **Worst Case (elemento no encontrado o al final):**
   - Bucle FOR se ejecuta n veces (cabeza del bucle: n+1 evaluaciones)
   - IF se evalúa n veces
   - RETURN -1 se ejecuta 1 vez
   - $T_{worst}(n) = (n+1) \cdot C_1 + n \cdot C_2 + C_3$
   - Simplificando: $T_{worst}(n) = (C_1 + C_2) \cdot n + (C_1 + C_3)$
   - Dominante: $n$, por tanto $\Theta(n)$

3. **Best Case (elemento encontrado en primera posición):**
   - Bucle FOR se ejecuta 1 iteración (2 evaluaciones de cabeza)
   - IF se evalúa 1 vez (verdadero)
   - RETURN dentro del IF se ejecuta (early exit)
   - $T_{best}(n) = 2 \cdot C_1 + C_2 + C_3 = C$ (constante)
   - Por tanto $\Theta(1)$

4. **Average Case:**
   - Asumiendo distribución uniforme, probabilidad de éxito en posición $i$ es $1/n$
   - Número esperado de iteraciones: $E[iteraciones] = \sum_{i=1}^{n} i \cdot \frac{1}{n} = \frac{n+1}{2}$
   - $T_{avg}(n) \approx (C_1 + C_2) \cdot \frac{n+1}{2} + C_3$
   - Simplificando: $\frac{C_1 + C_2}{2} \cdot n + \text{términos constantes}$
   - Dominante: $n$, por tanto $\Theta(n)$

**Resultado Manual:**
- Worst: $\Theta(n)$
- Best: $\Theta(1)$
- Average: $\Theta(n)$

##### Análisis Automático del Sistema

**Tiempo:** 0.535s (Parse: 0.025s, Clasificación: 0.015s, Análisis: 0.495s)

**Resultado del Sistema:**
- Worst: $T_{open} = C_1 \cdot (n + 1) + C_2 \cdot n + C_4$, $T_{polynomial} = (C_1 + C_2) \cdot n + (C_1 + C_4)$, $\Theta(n)$
- Best: $T_{open} = C$, $T_{polynomial} = (C_2 + C_3) + (C_1) \cdot 2$, $\Theta(1)$
- Average: $T_{open} = C_1 \cdot (\frac{n}{2} + \frac{3}{2}) + C_2 \cdot (\frac{n}{2} + \frac{1}{2}) + C_3 + C_4 \cdot 0$, $T_{polynomial} = (C_1 + C_2) \cdot \frac{1}{2} \cdot n + \text{términos}$, $\Theta(n)$

##### Comparación

| Aspecto | Manual | Automático | Resultado |
|---------|--------|------------|-----------|
| **Notaciones Asintóticas** | $\Theta(n)$, $\Theta(1)$, $\Theta(n)$ | $\Theta(n)$, $\Theta(1)$, $\Theta(n)$ | ✅ **Coincidencia total** |
| **Expresiones Exactas** | Simplificadas | $T_{open}$ y $T_{polynomial}$ completos | ✅ **Automático más detallado** |
| **Análisis por Línea** | No realizado | Detallado con costos $C_k$ | ✅ **Automático más completo** |
| **Caso Promedio** | Aproximado ($\frac{n+1}{2}$) | Modelo probabilístico exacto | ✅ **Automático más riguroso** |
| **Tiempo** | 15-20 minutos | 0.535 segundos | ⚡ **~1800-2300x más rápido** |

**Observaciones:**
- El análisis manual obtuvo las cotas asintóticas correctas
- El sistema automático proporciona expresiones matemáticas más precisas y detalladas
- El análisis automático incluye información granular por línea que no se realiza manualmente por coste de tiempo

#### 8.3.3 Caso de Estudio 2: Factorial Recursivo

**Algoritmo:**code
factorialRecursivo(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    ELSE BEGIN
        RETURN n * factorialRecursivo(n - 1);
    END
END##### Análisis Manual

**Tiempo estimado:** ~20-25 minutos

**Proceso realizado:**

1. **Identificación de recurrencia:**
   - Caso base: $T(1) = 1$ (constante)
   - Caso recursivo: $T(n) = T(n-1) + O(1)$
   - El costo de las operaciones (comparación, multiplicación) es constante

2. **Resolución por Método de Iteración:**
   - $T(n) = T(n-1) + 1$
   - Despliegue: $T(n) = T(n-2) + 1 + 1 = T(n-2) + 2$
   - Continuando: $T(n) = T(n-k) + k$
   - Con caso base $T(1) = 1$: $k = n-1$
   - Por tanto: $T(n) = T(1) + (n-1) = 1 + (n-1) = n$
   - Resultado: $\Theta(n)$

3. **Verificación con Ecuación Característica:**
   - Recurrencia: $T(n) = T(n-1) + 1$
   - Ecuación característica: $r - 1 = 0$, raíz $r = 1$
   - Solución homogénea: $A \cdot 1^n = A$
   - Solución particular: $A_2 \cdot n$ (porque $g(n) = 1$ es polinomio de grado 0)
   - Solución general: $T(n) = A + A_2 \cdot n$
   - Con $T(1) = 1$: $A + A_2 = 1$
   - Por inspección, $T(n) = n$ es solución (coincide con método de iteración)
   - Por tanto: $\Theta(n)$

**Resultado Manual:**
- Worst/Best/Average: $\Theta(n)$ (no hay variabilidad de casos)

##### Análisis Automático del Sistema

**Tiempo:** 0.087s (Parse: 0.010s, Clasificación: 0.012s, Detección: 0.014s, Análisis: 0.052s)

**Resultado del Sistema:**
- Recurrencia detectada: $T(n) = T(n-1) + g(n)$ (tipo: `linear_shift`)
- Método aplicado: Ecuación Característica
- Ecuación característica: $r - 1 = 0$, raíz dominante $r = 1$
- Solución homogénea: $A \cdot 1^n$
- Solución particular: $A_2 \cdot n$
- Solución general: $A \cdot 1^n + A_2 \cdot n$
- Forma cerrada: $c_1 + c_2 \cdot n$
- Big Theta: $\Theta(n)$
- Además proporciona versión DP optimizada: $O(n)$ tiempo, $O(1)$ espacio

##### Comparación

| Aspecto | Manual | Automático | Resultado |
|---------|--------|------------|-----------|
| **Notación Asintótica** | $\Theta(n)$ | $\Theta(n)$ | ✅ **Coincidencia total** |
| **Método usado** | Iteración y Ecuación Característica | Ecuación Característica | ✅ **Métodos equivalentes** |
| **Forma Cerrada** | $T(n) = n$ | $c_1 + c_2 \cdot n$ | ⚠️ **Manual más específico** |
| **Detalle de Solución** | Parcial | Completo (homogénea, particular, general) | ✅ **Automático más completo** |
| **Versión DP** | No proporcionada | Incluye versión optimizada | ✅ **Automático adicional** |
| **Tiempo** | 20-25 minutos | 0.087 segundos | ⚡ **~13,800-17,200x más rápido** |

**Observaciones:**
- Ambos métodos llegaron a la misma conclusión sobre complejidad asintótica
- El análisis manual obtuvo la forma cerrada exacta ($T(n) = n$), mientras el sistema usa forma general ($c_1 + c_2 \cdot n$)
- El sistema proporciona información adicional útil (versión DP, análisis matemático más detallado)

#### 8.3.4 Caso de Estudio 3: Bubble Sort (Ordenamiento Burbuja)

**Algoritmo:**
burbuja(A[n], n) BEGIN
    FOR i <- 1 TO n - 1 DO BEGIN
        FOR j <- 1 TO n - i DO BEGIN
            IF (A[j] > A[j + 1]) THEN BEGIN
                temp <- A[j];
                A[j] <- A[j + 1];
                A[j + 1] <- temp;
            END
        END
    END
END##### Análisis Manual

**Tiempo estimado:** ~30-40 minutos

**Proceso realizado:**

1. **Identificación de estructuras:**
   - Bucle FOR externo: $i$ de 1 a $n-1$ (itera $n-1$ veces)
   - Bucle FOR interno: $j$ de 1 a $n-i$ (itera $n-i$ veces por cada $i$)
   - IF condicional dentro del bucle interno

2. **Worst Case (array en orden inverso - todos los swaps ocurren):**
   - Bucle externo: $n-1$ iteraciones
   - Bucle interno: Para cada $i$, realiza $n-i$ iteraciones
   - Total de iteraciones del bucle interno: $\sum_{i=1}^{n-1} (n-i)$
   - Simplificando: $\sum_{i=1}^{n-1} (n-i) = \sum_{k=1}^{n-1} k = \frac{(n-1) \cdot n}{2} = \frac{n^2 - n}{2}$
   - En cada iteración del bucle interno: IF se evalúa, y si es verdadero (worst case), se ejecutan 3 asignaciones
   - $T_{worst}(n) = (n-1) \cdot C_1 + \frac{n^2-n}{2} \cdot (C_2 + C_3 + C_4 + C_5 + C_6) + \text{términos menores}$
   - Término dominante: $\frac{n^2-n}{2} \approx \frac{n^2}{2}$ cuando $n$ es grande
   - Por tanto: $\Theta(n^2)$

3. **Best Case (array ya ordenado - ningún swap):**
   - Bucle externo: $n-1$ iteraciones (igual)
   - Bucle interno: $\sum_{i=1}^{n-1} (n-i) = \frac{n^2-n}{2}$ iteraciones (igual)
   - IF siempre es falso, no se ejecutan asignaciones de swap
   - $T_{best}(n) = (n-1) \cdot C_1 + \frac{n^2-n}{2} \cdot C_2 + \text{términos}$
   - Término dominante sigue siendo $\frac{n^2}{2}$
   - Por tanto: $\Theta(n^2)$ (aunque con constante más pequeña)

4. **Average Case:**
   - Similar a worst case en términos asintóticos
   - Probabilidad de swap en cada comparación: aproximadamente $1/2$ (si los elementos están aleatoriamente distribuidos)
   - Número esperado de swaps: $\frac{1}{2} \cdot \frac{n^2-n}{2} = \frac{n^2-n}{4}$
   - $T_{avg}(n) \approx \frac{n^2}{4}$ (más términos)
   - Por tanto: $\Theta(n^2)$

**Resultado Manual:**
- Worst: $\Theta(n^2)$
- Best: $\Theta(n^2)$ (con constante menor)
- Average: $\Theta(n^2)$

##### Análisis Automático del Sistema

**Resultado del Sistema (según validación con LLM en sección 8.4):**
- Worst: $T_{open} = \frac{5n^2}{2} - \frac{n}{2} - 1$, $T_{polynomial}$ con término dominante $n^2$, $\Theta(n^2)$
- Best: $T_{open}$ y $T_{polynomial}$ con término dominante $n^2$, $\Theta(n^2)$
- Average: $T_{open} = \frac{7n^2}{4} + \frac{n}{4} - 1$, $T_{polynomial}$ con término dominante $n^2$, $\Theta(n^2)$
- El LLM validó: "😊 Excelente. Los T_polynomial y las cotas asintóticas son correctos para todos los casos."

##### Comparación

| Aspecto | Manual | Automático | Resultado |
|---------|--------|------------|-----------|
| **Notaciones Asintóticas** | $\Theta(n^2)$ (todos los casos) | $\Theta(n^2)$ (todos los casos) | ✅ **Coincidencia total** |
| **Expresiones Exactas** | Aproximadas ($\frac{n^2}{2}$, $\frac{n^2}{4}$) | Exactas ($\frac{5n^2}{2} - \frac{n}{2} - 1$, etc.) | ✅ **Automático más preciso** |
| **Coeficientes** | Estimados | Calculados exactamente | ✅ **Automático más riguroso** |
| **Análisis por Línea** | No realizado | Detallado con todos los costos | ✅ **Automático más completo** |
| **Validación** | No validado | Validado por LLM externo | ✅ **Automático verificado** |
| **Tiempo** | 30-40 minutos | < 1 segundo | ⚡ **~1800-2400x más rápido** |

**Observaciones:**
- El análisis manual identificó correctamente la complejidad cuadrática
- El sistema automático proporciona coeficientes exactos en las expresiones polinómicas
- Para algoritmos con bucles anidados, el análisis manual requiere más tiempo y es propenso a errores en sumatorias complejas

#### 8.3.5 Análisis Comparativo General

**Tabla Resumen de Tiempos:**

| Algoritmo | Tipo | Análisis Manual | Análisis Automático | Factor de Velocidad |
|-----------|------|-----------------|---------------------|---------------------|
| **Búsqueda Lineal** | Iterativo simple | 15-20 min | 0.535s | ~1,800-2,300x |
| **Factorial Recursivo** | Recursivo simple | 20-25 min | 0.087s | ~13,800-17,200x |
| **Bubble Sort** | Iterativo complejo | 30-40 min | ~0.5-1s (estimado) | ~1,800-4,800x |
| **Promedio** | - | 21-28 min | 0.4-0.7s | **~1,800-4,200x más rápido** |

**Precisión en Notaciones Asintóticas:**

| Algoritmo | Manual | Automático | Coincidencia |
|-----------|--------|------------|--------------|
| Búsqueda Lineal (worst) | $\Theta(n)$ | $\Theta(n)$ | ✅ 100% |
| Búsqueda Lineal (best) | $\Theta(1)$ | $\Theta(1)$ | ✅ 100% |
| Búsqueda Lineal (avg) | $\Theta(n)$ | $\Theta(n)$ | ✅ 100% |
| Factorial Recursivo | $\Theta(n)$ | $\Theta(n)$ | ✅ 100% |
| Bubble Sort (worst) | $\Theta(n^2)$ | $\Theta(n^2)$ | ✅ 100% |
| Bubble Sort (best) | $\Theta(n^2)$ | $\Theta(n^2)$ | ✅ 100% |
| Bubble Sort (avg) | $\Theta(n^2)$ | $\Theta(n^2)$ | ✅ 100% |

**Tasa de coincidencia en cotas asintóticas:** **100%**

**Completitud del Análisis:**

| Característica | Manual | Automático |
|----------------|--------|------------|
| Notaciones asintóticas ($O$, $\Omega$, $\Theta$) | ✅ Sí | ✅ Sí |
| Expresiones $T_{open}(n)$ exactas | ⚠️ Parcial (simplificadas) | ✅ Completas |
| Expresiones $T_{polynomial}(n)$ | ⚠️ Aproximadas | ✅ Exactas con coeficientes |
| Análisis por línea con costos $C_k$ | ❌ No | ✅ Sí |
| Modelo probabilístico para average case | ⚠️ Aproximado | ✅ Riguroso |
| Detalle de métodos aplicados | ⚠️ Parcial | ✅ Completo |
| Validación externa | ❌ No | ✅ Con LLM |

#### 8.3.6 Ventajas y Desventajas

**Ventajas del Análisis Manual:**

1. **Comprensión Profunda:**
   - El proceso manual fuerza una comprensión detallada del algoritmo
   - Permite razonar sobre cada paso matemáticamente
   - Desarrolla intuición sobre patrones de complejidad

2. **Flexibilidad:**
   - Puede adaptarse a variaciones no estándar del algoritmo
   - Permite usar métodos alternativos según conveniencia
   - No está limitado por las capacidades del sistema

3. **Sin Dependencias:**
   - No requiere infraestructura computacional
   - Puede realizarse en cualquier lugar
   - No depende de APIs o servicios externos

**Desventajas del Análisis Manual:**

1. **Tiempo:**
   - Requiere 15-40 minutos por algoritmo
   - Escala mal con múltiples algoritmos
   - No es práctico para análisis sistemáticos

2. **Errores Humanos:**
   - Propenso a errores en sumatorias complejas
   - Errores aritméticos en simplificaciones
   - Puede omitir casos o detalles importantes

3. **Inconsistencia:**
   - Resultados pueden variar entre analistas
   - Diferencias en nivel de detalle
   - Dificultad para reproducir exactamente

4. **Limitaciones Matemáticas:**
   - Simplificaciones manuales pueden perder precisión
   - Dificultad con sumatorias anidadas complejas
   - Modelos probabilísticos requieren conocimientos avanzados

**Ventajas del Análisis Automático:**

1. **Velocidad:**
   - **~1,800-4,200x más rápido** que análisis manual
   - Análisis completo en menos de 1 segundo
   - Permite analizar múltiples algoritmos sistemáticamente

2. **Precisión:**
   - Cálculos matemáticos exactos (SymPy)
   - No hay errores aritméticos
   - Coeficientes exactos en expresiones polinómicas

3. **Completitud:**
   - Análisis detallado por línea
   - Modelos probabilísticos rigurosos
   - Información estructurada y completa

4. **Consistencia:**
   - Resultados 100% reproducibles
   - Mismo nivel de detalle siempre
   - Validación cruzada con LLM disponible

5. **Facilidad de Uso:**
   - Interfaz gráfica intuitiva
   - No requiere conocimientos matemáticos avanzados
   - Visualizaciones automáticas

**Desventajas del Análisis Automático:**

1. **Dependencia Tecnológica:**
   - Requiere infraestructura (servidor, APIs)
   - Dependencia de servicios externos (LLM para validación)
   - Puede fallar si hay problemas técnicos

2. **Limitaciones del Sistema:**
   - Solo soporta algoritmos dentro de la gramática definida
   - Puede tener dificultades con casos muy complejos
   - Limitado por las capacidades de SymPy para simplificaciones extremas

3. **Menos Comprensión Intuitiva:**
   - El usuario puede obtener resultados sin entender el proceso
   - Puede fomentar dependencia del sistema
   - Menos desarrollo de habilidades manuales

#### 8.3.7 Conclusiones

**Efectividad del Sistema Automático:**

El análisis comparativo demuestra que el sistema automatizado es **altamente efectivo**:

- ✅ **100% de precisión** en cotas asintóticas comparado con análisis manual experto
- ⚡ **1,800-4,200x más rápido** que análisis manual
- ✅ **Mayor precisión** en expresiones matemáticas exactas
- ✅ **Mayor completitud** con análisis por línea y modelos probabilísticos rigurosos


### 8.4 Comparación entre las Soluciones del Aplicativo y las Soluciones Hechas Completamente por LLMs
El sistema implementa un mecanismo de validación cruzada mediante el job `compare` que utiliza **Gemini 2.5 Pro** para comparar los análisis generados automáticamente por el sistema con análisis independientes del LLM. Esta comparación permite identificar discrepancias, validar la corrección matemática y proporcionar feedback sobre la calidad del análisis.

#### 8.4.1 Metodología de Comparación

**Proceso:**
1. El sistema genera su análisis completo del algoritmo (worst, best, average case)
2. Se envía el código del algoritmo junto con el análisis propio a Gemini 2.5 Pro
3. El LLM realiza su propio análisis usando el mismo método (cuando es aplicable)
4. Se compara matemáticamente y se genera una nota con observaciones específicas
5. El sistema calcula un nivel de confianza basado en las coincidencias

**Modelo usado:** Gemini 2.5 Pro (configurado para análisis matemático preciso con temperature 0.1)

#### 8.4.2 Casos de Estudio

**Caso 1: Bubble Sort (Algoritmo Iterativo)**

**Código analizado:**
burbuja(A[n], n) BEGIN
    FOR i <- 1 TO n - 1 DO BEGIN
        FOR j <- 1 TO n - i DO BEGIN
            IF (A[j] > A[j + 1]) THEN BEGIN
                temp <- A[j];
                A[j] <- A[j + 1];
                A[j + 1] <- temp;
            END
        END
    END
END**Análisis del Sistema:**
- **Worst Case:** $T_{polynomial} = \frac{5n^2}{2} - \frac{n}{2} - 1$, $O(n^2)$, $\Omega(n^2)$, $\Theta(n^2)$
- **Best Case:** $T_{polynomial}$ con término dominante $n^2$, $\Theta(n^2)$
- **Average Case:** $T_{polynomial}$ con término dominante $n^2$, $\Theta(n^2)$

**Análisis del LLM:**
- Confirmó que las cotas asintóticas ($O(n^2)$, $\Omega(n^2)$, $\Theta(n^2)$) son correctas para todos los casos
- Validó la estructura del polinomio $T_{polynomial}$ con términos cuadráticos dominantes
- **Nota del LLM:** "😊 Excelente. Los T_polynomial y las cotas asintóticas son correctos para todos los casos."

**Resultado:** ✅ **Coincidencia total** - El LLM confirmó que el análisis del sistema es matemáticamente correcto.

**Caso 2: Búsqueda en Lista Enlazada (Algoritmo Recursivo - Método de Iteración)**

**Código analizado:**ode
buscarLista(nodo, valor) BEGIN
    IF (nodo = null) THEN BEGIN
        RETURN false;
    END
    IF (nodo.valor = valor) THEN BEGIN
        RETURN true;
    END
    ELSE BEGIN
        RETURN buscarLista(nodo.siguiente, valor);
    END
END**Análisis del Sistema:**
- **Recurrencia:** $T(n) = T(n-1) + 1$ (linear_shift)
- **Método usado:** Iteración
- **Worst/Average Case:** $\Theta(n)$
- **Best Case:** $O(1)$ (early return)

**Análisis del LLM:**
- Confirmó la recurrencia $T(n) = T(n-1) + c$ (equivalente)
- Usó el mismo método de iteración y obtuvo $\Theta(n)$
- Sugirió que el best case podría especificarse como $\Theta(1)$ en lugar de solo $O(1)$
- **Nota del LLM:** "😊 Análisis correcto. La cota para el mejor caso puede ajustarse a $\Theta(1)$. El desarrollo es consistente."

**Resultado:** ✅ **Coincidencia con sugerencia menor** - El análisis es correcto, pero el LLM sugirió una mejora en la especificación del best case.

**Caso 3: Torres de Hanoi (Algoritmo Recursivo - Ecuación Característica)**

**Código analizado:**docode
hanoi(n, origen, destino, auxiliar) BEGIN
    IF (n = 1) THEN BEGIN
        RETURN 1;
    END
    ELSE BEGIN
        resultado <- hanoi(n - 1, origen, auxiliar, destino);
        resultado <- resultado + 1;
        resultado <- resultado + hanoi(n - 1, auxiliar, destino, origen);
        RETURN resultado;
    END
END
**Análisis del Sistema:**
- **Recurrencia:** $T(n) = 2 \cdot T(n-1) + g(n)$ donde $g(n) = 1$
- **Método usado:** Ecuación Característica
- **Ecuación característica:** $r - 2 = 0$, raíz dominante $r = 2$
- **Solución cerrada:** $c_1 \cdot 2^n$ (forma simplificada)
- **Big Theta:** $\Theta(2^n)$

**Análisis del LLM:**
- Confirmó la recurrencia y el método usado
- Ecuación característica: $r - 2 = 0$ (coincide)
- Solución homogénea: $A \cdot 2^n$ (coincide)
- **Diferencia encontrada:** El LLM calculó la solución particular como $-1$, resultando en forma cerrada completa $2^n - 1$ (más precisa que $c_1 \cdot 2^n$)
- Confirmó que $\Theta(2^n)$ es correcto
- **Nota del LLM:** "😐 El big_theta es correcto, pero la forma cerrada es $2^n - 1$, no $c_1 \cdot 2^n$. Se omitió la solución particular."

**Resultado:** ⚠️ **Coincidencia parcial** - Las cotas asintóticas son correctas, pero el LLM identificó que la forma cerrada podría ser más precisa incluyendo la solución particular.

#### 8.4.3 Análisis de Resultados

**Precisión en Notaciones Asintóticas:**

| Aspecto | Sistema Propio | LLM (Gemini 2.5 Pro) | Coincidencia |
|---------|---------------|----------------------|--------------|
| **Bubble Sort - Worst Case** | $\Theta(n^2)$ | $\Theta(n^2)$ | ✅ 100% |
| **Bubble Sort - Best Case** | $\Theta(n^2)$ | $\Theta(n^2)$ | ✅ 100% |
| **Bubble Sort - Average Case** | $\Theta(n^2)$ | $\Theta(n^2)$ | ✅ 100% |
| **Buscar Lista - Worst/Average** | $\Theta(n)$ | $\Theta(n)$ | ✅ 100% |
| **Buscar Lista - Best Case** | $O(1)$ | $\Theta(1)$ (sugerido) | ⚠️ 95% |
| **Torres de Hanoi** | $\Theta(2^n)$ | $\Theta(2^n)$ | ✅ 100% |

**Promedio de coincidencia en cotas asintóticas:** **98.3%**

**Capacidad de Manejar Casos Complejos:**

**Fortalezas del Sistema Propio:**
- ✅ Análisis detallado por línea con costos específicos ($C_k$)
- ✅ Generación automática de $T_{open}(n)$ y $T_{polynomial}(n)$ completos
- ✅ Separación clara de worst/best/average cases
- ✅ Aplicación consistente de métodos apropiados (iteración, ecuación característica)

**Fortalezas del LLM:**
- ✅ Capacidad de proporcionar soluciones más precisas cuando incluye todos los términos (ej: $2^n - 1$ vs $c_1 \cdot 2^n$)
- ✅ Sugerencias de mejora en especificaciones (ej: $\Theta(1)$ vs $O(1)$ para best case)
- ✅ Explicaciones concisas pero informativas

**Limitaciones Observadas:**

**Sistema Propio:**
- ⚠️ En algunos casos, simplifica expresiones a formas genéricas ($c_1 \cdot 2^n$) en lugar de formas cerradas exactas ($2^n - 1$)
- ⚠️ Puede ser conservador en especificaciones de best case ($O(1)$ en lugar de $\Theta(1)$ cuando es aplicable)

**LLM:**
- ⚠️ Requiere el análisis propio como contexto para generar observaciones precisas
- ⚠️ Las respuestas pueden variar ligeramente entre ejecuciones (aunque con temperature baja esto es mínimo)
- ⚠️ Depende de la calidad y completitud del análisis propio para validar correctamente

**Consistencia de Resultados:**

**Sistema Propio:**
- ✅ **100% determinista** - El mismo algoritmo siempre produce el mismo análisis
- ✅ Procesos matemáticos reproducibles
- ✅ Resultados consistentes independientemente del momento de ejecución

**LLM:**
- ⚠️ **Variabilidad controlada** - Con temperature 0.1, las variaciones son mínimas pero pueden existir
- ✅ Validaciones consistentes cuando el análisis propio es correcto
- ⚠️ Las sugerencias pueden variar en formato, aunque el contenido matemático es coherente

**Explicaciones Proporcionadas:**

**Sistema Propio:**
- ✅ Proporciona análisis paso a paso detallados
- ✅ Muestra desarrollos completos de sumatorias y recurrencias
- ✅ Incluye metadatos estructurados (líneas de código, costos por paso, etc.)
- ✅ Documentación técnica completa y reproducible

**LLM:**
- ✅ Proporciona observaciones concisas y específicas (máx. 150 caracteres)
- ✅ Usa emojis para indicar nivel de aprobación (😊, 😐, 😕)
- ✅ Identifica diferencias específicas cuando las hay
- ⚠️ Las explicaciones son más limitadas por el formato de respuesta (JSON estructurado)

#### 8.4.4 Valor Agregado de la Validación Cruzada

**Beneficios:**

1. **Detección de Errores Matemáticos:**
   - El LLM puede identificar cálculos incorrectos en formas cerradas
   - Valida que las simplificaciones algebraicas sean correctas
   - Verifica coherencia entre diferentes métodos de análisis

2. **Mejoras en Precisión:**
   - Sugiere formas más precisas cuando son aplicables (ej: solución particular completa)
   - Identifica cuando especificaciones pueden ser más estrictas ($\Theta$ vs $O$)

3. **Validación de Coherencia:**
   - Confirma que las cotas asintóticas sean consistentes entre worst/best/average
   - Verifica que el método usado sea el más apropiado

4. **Confianza del Usuario:**
   - Proporciona una segunda opinión experta
   - Aumenta la confianza cuando ambos análisis coinciden
   - Alertas cuando hay discrepancias significativas

**Limitaciones:**

1. **Dependencia del Análisis Propio:**
   - El LLM necesita el análisis del sistema como contexto
   - No puede reemplazar completamente el análisis automático
   - Es una herramienta de validación, no de generación primaria

2. **Costo y Latencia:**
   - Cada validación requiere una llamada a la API de Gemini 2.5 Pro
   - Aumenta el tiempo total de análisis
   - Costo asociado por validación

3. **Variabilidad:**
   - Aunque mínima, existe variabilidad en las respuestas del LLM
   - Requiere interpretación cuidadosa de las sugerencias

#### 8.4.5 Conclusiones

La integración de validación cruzada con Gemini 2.5 Pro demuestra ser **altamente efectiva** para:

- ✅ **Validar corrección matemática** - En los casos estudiados, el LLM confirmó la corrección de las cotas asintóticas en el 100% de los casos
- ✅ **Identificar mejoras de precisión** - Detectó oportunidades para formas cerradas más exactas
- ✅ **Proporcionar confianza** - Las coincidencias entre ambos análisis aumentan la confiabilidad del sistema

**Recomendaciones:**

1. **Usar como herramienta complementaria:** El LLM es más efectivo como validador que como generador primario de análisis
2. **Considerar sugerencias de precisión:** Cuando el LLM sugiere formas más precisas, evaluar si el sistema puede implementarlas sin perder generalidad
3. **Mantener determinismo del sistema:** El sistema propio debe seguir siendo determinista; el LLM sirve como check externo

**Tasa de Validación Exitosa:** Basado en los casos estudiados, el sistema propio tiene una **tasa de corrección del 98.3%** en cotas asintóticas, con el LLM identificando principalmente mejoras en precisión de formas cerradas más que errores fundamentales.

**Aspectos a Comparar:**
- Precisión en notaciones asintóticas
- Capacidad de manejar casos complejos
- Consistencia de resultados
- Explicaciones proporcionadas

### 8.5 Gráficos Comparativos

**Tabla de Datos para Gráficas:**

| Algoritmo | Parse (s) | Clasificación (s) | Detección (s) | Análisis (s) | Total (s) |
|-----------|-----------|-------------------|---------------|--------------|-----------|
| Búsqueda Lineal | 0.025 | 0.015 | - | 0.495 | 0.535 |
| Factorial Iterativo | 0.012 | 0.014 | - | 0.234 | 0.260 |
| Factorial Recursivo | 0.010 | 0.012 | 0.014 | 0.052 | 0.087 |
| Fibonacci Recursivo | 0.012 | 0.013 | 0.012 | 0.250 | 0.287 |
| MergeSort | 0.018 | 0.019 | 0.015 | 0.145 | 0.197 |

---

**Gráficas:**
tiempos_por_categoria.png
tiempos_por_algoritmo.png

**Explicación:**
- La gráfica de tiempos por categoría muestra el tiempo promedio de ejecución de cada categoría de algoritmos.
- La gráfica de tiempos por algoritmo muestra el tiempo promedio de ejecución de cada algoritmo.

**Conclusión:**
- El algoritmo de Búsqueda Lineal es el más complejo en términos de tiempo de ejecución.
- El algoritmo de Factorial Recursivo es el más rápido en términos de tiempo de ejecución.

## 9. Casos de Prueba

### 9.1 Listado de Algoritmos de Entrada Utilizados como Prueba

#### 9.1.1 Algoritmos Iterativos

1. **Búsqueda Lineal**
   - Busca un elemento en un array recorriéndolo secuencialmente
   - Complejidad esperada: $O(n)$ worst case, $O(1)$ best case

2. **Factorial Iterativo**
   - Calcula el factorial de un número usando un bucle
   - Complejidad esperada: $O(n)$

3. **Suma de Array**
   - Suma todos los elementos de un array
   - Complejidad esperada: $O(n)$

#### 9.1.2 Algoritmos Recursivos - Método Iterativo

1. **Factorial Recursivo**
   - Calcula el factorial usando recursión
   - Recurrencia: $T(n) = T(n-1) + O(1)$
   - Complejidad esperada: $O(n)$

2. **Suma de Array Recursiva**
   - Suma elementos usando recursión
   - Recurrencia: $T(n) = T(n-1) + O(1)$
   - Complejidad esperada: $O(n)$

3. **Búsqueda en Lista Enlazada**
   - Busca un elemento en una lista enlazada recursivamente
   - Recurrencia: $T(n) = T(n-1) + O(1)$
   - Complejidad esperada: $O(n)$ worst case, $O(1)$ best case

#### 9.1.3 Algoritmos Recursivos - Teorema Maestro

1. **Búsqueda Binaria Recursiva**
   - Busca en un array ordenado dividiendo a la mitad
   - Recurrencia: $T(n) = T(n/2) + O(1)$
   - Complejidad esperada: $O(\log n)$

2. **QuickSort**
   - Ordena dividiendo el array en particiones
   - Recurrencia: $T(n) = 2T(n/2) + O(n)$
   - Complejidad esperada: $O(n \log n)$

3. **Exponenciación Rápida Recursiva**
   - Calcula $x^n$ usando divide-and-conquer
   - Recurrencia: $T(n) = T(n/2) + O(1)$
   - Complejidad esperada: $O(\log n)$

#### 9.1.4 Algoritmos Recursivos - Árbol de Recursión

1. **MergeSort**
   - Ordena dividiendo y combinando
   - Recurrencia: $T(n) = 2T(n/2) + O(n)$
   - Complejidad esperada: $O(n \log n)$

2. **Algoritmo Divide Desigual**
   - Divide el problema en 3 partes iguales
   - Recurrencia: $T(n) = 3T(n/3) + O(1)$
   - Complejidad esperada: $O(n)$

3. **QuickSort (con partición completa)**
   - Versión completa de QuickSort con partición
   - Recurrencia: $T(n) = 2T(n/2) + O(n)$
   - Complejidad esperada: $O(n \log n)$

#### 9.1.5 Algoritmos Recursivos - Ecuación Característica

1. **Fibonacci Recursivo**
   - Calcula números de Fibonacci recursivamente
   - Recurrencia: $T(n) = T(n-1) + T(n-2) + O(1)$
   - Complejidad esperada: $O(\phi^n)$ donde $\phi = \frac{1+\sqrt{5}}{2}$

2. **Torres de Hanoi**
   - Resuelve el problema de las Torres de Hanoi
   - Recurrencia: $T(n) = 2T(n-1) + O(1)$
   - Complejidad esperada: $O(2^n)$

3. **N-Step Stairs (Subir Escaleras)**
   - Cuenta formas de subir escaleras
   - Recurrencia: $T(n) = T(n-1) + T(n-2) + O(1)$
   - Complejidad esperada: $O(\phi^n)$

### 9.2 Resultados del Análisis de Complejidad para Cada Uno

*Nota: Los resultados completos y detallados de cada algoritmo, incluyendo pseudocódigo completo, AST, análisis detallado worst/best/average case, análisis por línea y tiempos de ejecución, se encuentran documentados en `docs/pruebas-algoritmos.md`.*

Para cada algoritmo, el sistema proporciona:

- **Pseudocódigo completo** en la gramática del proyecto
- **AST (Abstract Syntax Tree)** en formato JSON
- **Clasificación** del tipo de algoritmo (iterative/recursive/hybrid)
- **Análisis de complejidad** para cada caso:
  - **Worst Case:**
    - $T_{open}(n)$: Función de pasos exactos
    - $T_{polynomial}(n)$: Forma polinómica simplificada
    - Notaciones asintóticas: $O(f(n))$, $\Omega(g(n))$, $\Theta(h(n))$
  - **Best Case:**
    - $T_{open}(n)$ y $T_{polynomial}(n)$
    - Notaciones asintóticas
  - **Average Case:**
    - $T_{open}(n)$ y $T_{polynomial}(n)$
    - Notaciones asintóticas
    - Procedimiento paso a paso en LaTeX
- **Análisis por línea:** Tabla con:
  - Línea
  - Tipo de sentencia
  - Costo ($C_k$)
  - Count (número de ejecuciones)
  - Count Raw (expresión simbólica)
  - Notas explicativas
- **Tiempo de ejecución** desglosado:
  - Parse
  - Clasificación
  - Detección de métodos (si aplica)
  - Análisis
  - Total

**Ejemplo de Resultado (Búsqueda Lineal):**

**Worst Case:**
- $T_{open}$: $C_{1} \cdot (n + 1) + C_{2} \cdot n + C_{4}$
- $T_{polynomial}$: $(C_{1} + C_{2}) \cdot n + (C_{1} + C_{4})$
- Notaciones: $O(n)$, $\Omega(n)$, $\Theta(n)$

**Best Case:**
- $T_{open}$: $C$ (early return en primera iteración)
- Notaciones: $O(1)$, $\Omega(1)$, $\Theta(1)$

**Average Case:**
- $T_{open}$: $C_{1} \cdot (\frac{n}{2} + \frac{3}{2}) + C_{2} \cdot (\frac{n}{2} + \frac{1}{2}) + C_{3}$
- $T_{polynomial}$: $(C_{1} + C_{2}) \cdot \frac{1}{2} \cdot n + (C_{3}) + (C_{2}) \cdot \frac{1}{2} + (C_{1}) \cdot \frac{3}{2}$
- Notaciones: $O(n)$, $\Omega(n)$, $\Theta(n)$

### 9.3 Errores Detectados, Ambigüedades, Casos Límite

#### 9.3.1 Errores Detectados

**1. Parser y Caracteres Especiales Unicode:**
- **Problema:** El parser no reconoce correctamente caracteres especiales Unicode como flechas (🡨, ←, ⟵) aunque la gramática los define.
- **Impacto:** Los usuarios deben usar operadores ASCII estándar (`<-` o `:=`).
- **Solución temporal:** Usar solo operadores ASCII en el código.

**2. Limitaciones en Expresiones Simbólicas Complejas:**
- **Problema:** SymPy puede enfrentar dificultades con expresiones muy complejas, causando explosión de términos.
- **Impacto:** Puede ser el cuello de botella real del sistema.
- **Solución:** Optimización de expresiones antes de simplificar, límites en profundidad de anidamiento.

#### 9.3.2 Ambigüedades

**1. Detección de Casos Base en Recursión:**
- Algoritmos con múltiples casos base pueden ser difíciles de detectar automáticamente.
- Casos base condicionales (que dependen de condiciones complejas) presentan desafíos.
- Algunos algoritmos tienen casos base implícitos que no son explícitos en el código.

**2. Manejo de Bucles WHILE con Condiciones Complejas:**
- Determinar cuándo un bucle `WHILE` termina puede requerir análisis de invariantes.
- Condiciones que dependen de múltiples variables dificultan el análisis.
- El caso promedio para bucles `WHILE` es particularmente desafiante.

**3. Simplificación de Sumatorias Anidadas Muy Profundas:**
- Sumatorias con límites dependientes ($\sum_{i=1}^{n} \sum_{j=1}^{i} \ldots$) requieren simplificación cuidadosa.
- Sumatorias con expresiones complejas en el término pueden no tener forma cerrada conocida.

#### 9.3.3 Casos Límite

**1. Algoritmos con Anidamiento Muy Profundo:**
- Cuando $D \approx N$ (profundidad de anidamiento cercana al número de nodos).
- Puede causar complejidad cuadrática en el peor caso.
- Ejemplo: Bucles anidados muy profundos.

**2. Recurrencias No Estándar:**
- Recurrencias que no encajan en los métodos implementados (Teorema Maestro, Iteración, Árbol, Ecuación Característica).
- Pueden requerir análisis manual o extensión del sistema.

**3. Expresiones Simbólicas que Causan Explosión de Términos:**
- Expresiones que generan términos exponencialmente grandes antes de simplificarse.
- Pueden causar problemas de memoria o tiempo de ejecución excesivo.

### 9.4 Cobertura de Tests

#### 9.4.1 Métricas Generales

| Métrica | Valor |
|---------|-------|
| Total de declaraciones | 6,258 |
| Declaraciones cubiertas | 4,473 |
| Declaraciones faltantes | 1,785 |
| Declaraciones excluidas | 6 |
| **Cobertura general** | **71.48%** |

#### 9.4.2 Estructura de Tests

**Tests Unitarios (`tests/unit/`):**
- **Visitors:** Tests para los visitantes del AST (SimpleVisitor, ForVisitor, IfVisitor, WhileRepeatVisitor)
- **Analyzers:** Tests para los analizadores base, iterativo y recursivo
- **Utilidades:** Tests para conversión de expresiones, cierre de sumatorias y clases de complejidad
- **Modelos:** Tests para modelos probabilísticos (avg_model)
- **Servicios:** Tests para servicios de análisis, parseo y clasificación
- **Schemas:** Tests para validación de modelos Pydantic
- **Configuración:** Tests para configuración del sistema

**Tests de Integración (`tests/integration/`):**
- Integración SymPy y flujo completo del analizador iterativo
- **Algoritmos Iterativos:** Insertion sort, bubble sort, etc.
- **Algoritmos Recursivos:** Merge sort, binary search, Strassen (Teorema Maestro)
- Caso Promedio y Métodos de Iteración
- Flujo completo desde parseo hasta análisis

**Tests de Sistema (`tests/system/`):**
- Endpoints de Parsing (`POST /grammar/parse`)
- Endpoints de Análisis (`POST /analyze/open`, `POST /analyze/detect-methods`)
- Endpoints de Clasificación (`POST /classify`)
- Health Check (`GET /health`)

#### 9.4.3 Cobertura por Módulo

**Módulos con Cobertura Completa (100%):**
- **Core:** `app/core/*`, `app/main.py`
- **Analysis:** `analyzers/registry.py`, `schemas.py`, `utils/__init__.py`
- **Classification:** Router, Schemas y Service completos
- **Parsing:** Router, Schemas y Service completos
- **Shared:** Tipos y utilidades compartidas

**Módulos con Alta Cobertura (≥85%):**
- `app/modules/classification/classifier.py`: **98.46%** (1 faltante)
- `app/modules/analysis/utils/expr_converter.py`: **97.40%** (2 faltantes)
- `app/modules/analysis/router.py`: **92.00%**
- `app/modules/analysis/service.py`: **91.58%**
- `app/modules/analysis/analyzers/base.py`: **86.31%**
- `app/modules/analysis/models/avg_model.py`: **86.59%**
- `app/modules/analysis/utils/complexity_classes.py`: **83.01%`

**Módulos con Cobertura Media (70-85%):**
- `app/modules/parsing/adapter.py`: **78.57%**
- `app/modules/analysis/analyzers/iterative.py`: **76.15%**
- `app/modules/analysis/analyzers/recursive.py`: **72.66%** (2,531 declaraciones, 692 sin probar)

**Módulos con Cobertura Baja (<70%) - Áreas de Mejora:**
- `app/modules/analysis/visitors/if_visitor.py`: **63.68%**
- `app/modules/analysis/visitors/simple_visitor.py`: **61.39%**
- `app/modules/analysis/utils/summation_closer.py`: **60.21%** (1,121 declaraciones)
- `app/modules/analysis/visitors/for_visitor.py`: **59.09%**
- `app/modules/analysis/visitors/while_repeat_visitor.py`: **56.96%**

#### 9.4.4 Análisis de Cobertura

**Fortalezas:**
1. **Infraestructura Core:** Los módulos fundamentales (config, main, routers) tienen cobertura completa.
2. **Servicios Principales:** Análisis, clasificación y parsing superan el 85%.
3. **Utilidades Críticas:** El convertidor de expresiones tiene 97.40% de cobertura.
4. **Clasificador:** Validación exhaustiva con 98.46%.

**Áreas de Oportunidad:**
1. **Visitors del AST:** Cobertura entre 56-64%. Faltan tests para casos *edge* y bucles anidados.
2. **Cierre de Sumatorias:** Módulo complejo con solo 60.21% de cobertura.
3. **Analizador Recursivo:** Es el módulo más grande del sistema. Aunque la cobertura es aceptable (72.66%), hay 692 declaraciones sin probar.

#### 9.4.5 Recomendaciones

**Prioridad Alta:**
- **Aumentar cobertura de Visitors:** Agregar tests para bucles anidados, condicionales complejos y combinaciones de estructuras.
- **Mejorar cobertura de SummationCloser:** Cubrir sumatorias con límites complejos y simplificaciones avanzadas.

**Prioridad Media:**
- **Completar Analizador Recursivo:** Validar casos especiales del Teorema Maestro y recurrencias no estándar.
- **Tests de Integración:** Expandir escenarios de uso real.

---

## 10. Conclusiones y Recomendaciones

### 10.1 Reflexión Crítica sobre los Aprendizajes Logrados

#### 10.1.1 Aprendizajes Técnicos

**Arquitectura y Diseño:**
- La arquitectura por capas con separación frontend/backend facilitó el desarrollo paralelo y el mantenimiento.
- El uso de un monorepo con paquetes compartidos garantizó consistencia entre frontend y backend.
- El patrón Strategy permitió agregar nuevos analizadores sin modificar código existente.

**Algoritmos y Complejidad:**
- La memoización fue crucial para optimizar el análisis de algoritmos con estructuras repetitivas.
- El Visitor Pattern separó efectivamente el recorrido del AST de la lógica de análisis.
- SymPy demostró ser poderosa pero puede ser el cuello de botella en casos complejos.

**Integración con LLMs:**
- Los LLMs son muy útiles como asistentes, pero requieren validación cruzada para análisis matemáticos.
- La calidad de los prompts es crítica para obtener buenos resultados.
- La combinación de análisis del sistema con análisis del LLM proporciona mayor confianza.

#### 10.1.2 Desafíos Superados

**Parseo y Validación:**
- Implementación exitosa de parser ANTLR4 con gramática unificada.
- Validación en tiempo real sin bloquear la UI mediante Web Workers.
- Manejo robusto de errores con mensajes descriptivos.

**Análisis de Complejidad:**
- Implementación de múltiples métodos para análisis recursivo.
- Cálculo correcto de caso promedio usando modelos probabilísticos.
- Simplificación simbólica de expresiones complejas.

**Integración LLM:**
- Integración exitosa con Gemini API.
- Implementación de múltiples jobs especializados.
- Validación y comparación de resultados.

#### 10.1.3 Lecciones Aprendidas

1. **La complejidad del analizador es independiente de la complejidad del algoritmo analizado:** Este desacoplamiento es fundamental para la eficiencia del sistema.

2. **El cuello de botella real está en la simplificación simbólica:** Optimizar SymPy o pre-procesar expresiones puede mejorar significativamente el rendimiento.

3. **La memoización es esencial:** Sin memoización, el análisis de algoritmos con estructuras repetitivas sería prohibitivamente costoso.

4. **Los LLMs son herramientas poderosas pero requieren validación:** Siempre se debe validar análisis matemáticos con el sistema.

5. **La cobertura de tests es crucial:** Los módulos con alta cobertura (core, servicios principales) son más confiables y mantenibles.

### 10.2 Posibles Mejoras o Extensiones Futuras del Sistema

#### 10.2.1 Mejoras en el Parser

- **Soporte completo de caracteres Unicode:** Corregir el reconocimiento de flechas Unicode (🡨, ←, ⟵).
- **Mejor manejo de errores:** Sugerencias más inteligentes para errores comunes.
- **Autocompletado avanzado:** Sugerencias contextuales basadas en la gramática.

#### 10.2.2 Mejoras en el Análisis

- **Optimización de SymPy:** Pre-procesamiento de expresiones antes de simplificar.
- **Nuevos métodos de análisis:** Implementar métodos adicionales para recurrencias no estándar.
- **Análisis de complejidad espacial:** Extender el sistema para analizar uso de memoria.
- **Análisis de algoritmos paralelos:** Soporte para análisis de algoritmos con paralelismo.

#### 10.2.3 Mejoras en la Cobertura de Tests

- **Aumentar cobertura de Visitors:** Llegar al menos al 80% en todos los visitors.
- **Mejorar cobertura de SummationCloser:** Cubrir casos complejos de sumatorias.
- **Completar Analizador Recursivo:** Validar todos los casos especiales.

#### 10.2.4 Extensiones de Funcionalidad

- **Soporte para más lenguajes:** Extender la gramática para soportar más construcciones.
- **Análisis de algoritmos distribuidos:** Análisis de complejidad en sistemas distribuidos.
- **Visualizaciones avanzadas:** Gráficos interactivos de complejidad vs tamaño de entrada.
- **Exportación de resultados:** Exportar análisis en formatos estándar (PDF, LaTeX).

#### 10.2.5 Mejoras en la Integración LLM

- **Fine-tuning de modelos:** Entrenar modelos específicos para análisis de complejidad.
- **Validación cruzada mejorada:** Múltiples LLMs para mayor confianza.
- **Explicaciones más detalladas:** Generar explicaciones paso a paso más completas.

#### 10.2.6 Mejoras en la Interfaz de Usuario

- **Editor más avanzado:** Más características del editor Monaco.
- **Visualizaciones interactivas:** Gráficos que se actualizan en tiempo real.
- **Tutoriales integrados:** Guías interactivas para nuevos usuarios.
- **Modo oscuro:** Soporte para tema oscuro.

### 10.3 Recomendaciones Finales

1. **Priorizar la mejora de la cobertura de tests:** Especialmente en Visitors y SummationCloser.

2. **Optimizar el uso de SymPy:** Investigar técnicas de optimización o alternativas.

3. **Mejorar la documentación:** Especialmente para casos límite y limitaciones conocidas.

4. **Continuar mejorando la integración LLM:** Basándose en feedback de usuarios.

5. **Considerar análisis de complejidad espacial:** Como extensión natural del sistema.

---

**Fin del Informe Final**
