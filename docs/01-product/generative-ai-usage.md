# Uso de IA generativa

**Tipo:** evidencia
**Estado:** requiere-validación
**Audiencia:** evaluador | dev
**Fuente de verdad:** commits y PRs en `https://github.com/Cruz1122/algorithmic-analysis`, `docs/09-decisions/`, configuración del agente
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** Uso de IA Generativa (anexo)

## Propósito

Documentar de forma honesta y detallada cómo se usaron herramientas de IA generativa en el desarrollo del proyecto AALIE, incluyendo etapa, propósito, prompts representativos, resultados, validación humana y riesgos.

## Alcance

Cubre el uso de IA desde la planificación inicial hasta la implementación y documentación actual. No cubre el uso de IA dentro del producto AALIE (el LLM embebido es una feature documentada por separado).

## Fuente de verdad

- Historial de commits y PRs en el repositorio.
- ADRs en `docs/09-decisions/`.
- Configuración del agente en `.opencode/` y `.claude/`.
- Este documento mismo.

## Herramientas utilizadas

| Herramienta | Etapa | Uso | Ejemplo de prompt | Resultado | Validación humana | Riesgo |
|---|---|---|---|---|---|---|
| **GPT-5 (planning)** | Arquitectura inicial, diseño de API, decisiones de monorepo | Generar propuestas de estructura de proyecto, comparar opciones tecnológicas | "Diseña una arquitectura para un analizador de complejidad de algoritmos con Next.js y FastAPI, monorepo con pnpm" | Estructura inicial del monorepo, elección de Next.js+FastAPI, separación en packages | Juan Camilo Cruz revisó y adaptó la estructura | Bajo (solo exploración) |
| **GPT-5 / GPT-5.5 (code)** | Implementación de features específicas | Generar código boilerplate, tests, schemas Pydantic, endpoints FastAPI | "Crea un endpoint FastAPI para análisis iterativo que devuelva costos por línea con formato AnalyzeOpenResponse" | Schemas Pydantic, routers, service layer | Cada PR revisó y modificó el código generado | Medio (código generado puede no seguir convenciones del proyecto) |
| **Cursor (Composer 1.5 / 2)** | Implementación de UI, componentes React, integración FE/BE | Edición contextual de múltiples archivos, refactors, creación de componentes | (edición contextual en archivos abiertos) | Componentes de UI, páginas, integración con BFF | Revisión manual, tests, lint | Medio (cambios masivos pueden introducir regresiones) |
| **Claude Sonnet 4.5 / 4.6 (planning + code)** | Diseño de motor determinista, patrones WHILE, snapshots, análisis de recurrencias | Prompting para diseño algorítmico, generación de patrones, documentación técnica | "Diseña un sistema de patrones para análisis de WHILE con heurística conservadora. Debe tener estados: bounded, unbounded, unknown" | Arquitectura del while_engine, patrones, progress proofs | Juan Camilo Cruz implementó y validó cada patrón | Medio (código algorítmico requiere validación exhaustiva con oráculos) |
| **Claude Sonnet 4.5 / 4.6 (documentación)** | Documentación técnica, ADRs, especificaciones | Redacción de documentos normativos, contratos, guías | "Escribe el contrato normativo para el motor de análisis iterativo incluyendo invariantes, errores esperables y casos soportados" | `docs/03-specs/analysis-engine-spec.md` | Revisión técnica y edición | Bajo (documentación revisable) |
| **GitHub Copilot** | Implementación diaria | Autocompletado en editor, generación inline de funciones, tests | (autocompletado contextual en IDE) | Fragmentos de código, tests, imports | Revisión en tiempo real por el desarrollador | Bajo (sugerencias locales) |
| **Codex (via subagents)** | Generación de código repetitivo, schemas, validaciones | Subagentes para tareas específicas y acotadas | (delegado por el orquestador principal) | Schemas, validadores, tests unitarios | Revisión e integración manual | Bajo (tareas acotadas y supervisadas) |
| **Spec-driven development** | Todo el ciclo | Escribir especificación primero, luego implementar contra ella | N/A (metodología) | Contratos en `03-specs/` antes que implementación | Las specs se validan con scripts de verificación | Bajo (metodología establecida) |
| **Subagent-driven development** | Features complejas (while_engine, snapshot, invariantes) | Descomposición de tareas complejas en subagentes que trabajan en paralelo | N/A (orquestación de agentes) | Múltiples archivos generados en paralelo, revisión centralizada | El orquestador revisa y valida antes de integración | Medio (coordinación entre subagentes puede generar inconsistencias) |
| **Skills/plugins (claude-code)** | Automatización de tareas repetitivas | Skills personalizados para commit messages, revisión de código, compresión de memoria | N/A (skills precargados) | Commits convencionales, code reviews, resúmenes | Revisión humana del output | Bajo (skills supervisados) |

## Decisión crítica: motor determinista sobre análisis por IA

### Contexto

En etapas tempranas del proyecto (2025-Q4), se exploró la posibilidad de usar un LLM como motor principal de análisis de complejidad. La idea era: enviar el pseudocódigo a un LLM y extraer la complejidad de su respuesta.

### Problemas detectados

1. **No reproducible**: el mismo código podía dar diferentes resultados en distintas ejecuciones.
2. **Alucinación de cotas**: el LLM producía resultados incorrectos con alta confianza.
3. **Sin trazabilidad**: no era posible mostrar el "paso a paso" del análisis.
4. **Dependencia externa**: sin API key, el sistema no funcionaba.
5. **Imposible de testear**: no se podían escribir oráculos contra respuestas no deterministas.

### Decisión

Se construyó un **motor determinista** basado en:
- **Strategy Pattern** para los diferentes métodos de análisis (iterativo, WHILE, recurrencias).
- **Visitor Pattern** para recorrer el AST y extraer información por tipo de nodo.
- **Registry Pattern** para seleccionar el analizador según la clasificación.
- **SymPy** para simplificación simbólica de sumatorias.
- **Patrones de WHILE** implementados como clases separadas con interfaz unificada.

### Consecuencias

- El LLM fue relegado a **rol conversacional/pedagógico opcional**.
- El motor determinista es la **fuente de verdad** del sistema.
- La arquitectura permite **oráculos en tests**: entrada real, salida esperada real.
- La **reproducibilidad** está garantizada: mismo input → mismo output.
- Sin API key, el sistema **funciona completo** (excepto funciones LLM).

### Evidencia

- `apps/api/app/modules/analysis/service.py`: el servicio de análisis no depende de LLM.
- `apps/api/app/modules/analysis/analyzers/`: implementaciones de Strategy para cada tipo.
- `apps/api/app/modules/analysis/visitors/`: Visitor Pattern para recorrer AST.
- `apps/api/app/modules/analysis/while_engine/engine.py`: motor WHILE con patrones.
- `apps/api/tests/`: oráculos que comparan contra resultados esperados.

## Porcentaje estimado de uso de IA

| Tipo de trabajo | % asistido por IA | % humano | Notas |
|---|---|---|---|---|
| Planificación y diseño | 40% | 60% | IA propuso opciones, humano decidió |
| Código de infraestructura (routers, schemas, config) | 75% | 25% | Boilerplate generado y adaptado por IA; humano definió contratos y revisó |
| Código algorítmico (motor, patrones, análisis) | 55% | 45% | IA generó estructura y patrones; humano validó lógica crítica con oráculos |
| Tests | 65% | 35% | IA generó oráculos, tests paramétricos y casos base; humano añadió bordes |
| Documentación técnica | 70% | 30% | IA redactó borradores, humano revisó y ajustó |
| UI/Frontend | 60% | 40% | IA generó componentes e integración; humano estilizó y conectó con BFF |
| DevOps/CI | 45% | 55% | IA generó sintaxis YAML y Docker; humano diseñó la pipeline y estrategia |

## Archivos relacionados

- `vision.md` — principios de producto (motor determinista)
- `final-scope.md` — áreas cubiertas (LLM opcional)
- `theoretical-foundations.md` — fundamentos del motor
- `../09-decisions/` — ADRs con decisiones de arquitectura
- `../03-specs/analysis-engine-spec.md` — contrato del motor

## Ejemplos de prompts usados

### 1. Auditoría controlada del banco de quizzes

> Revisa los JSON del banco de preguntas y corrige únicamente inconsistencias verificables.
> Para cada pregunta, valida que topic, tags, skillIds y contentRefs correspondan realmente al módulo asociado.
> Corrige topic si es demasiado genérico, está mal ubicado o contradice el módulo.
> Corrige tags si arrastran conceptos de otro módulo.
> Corrige skillIds si evalúan habilidades que no pertenecen al contenido correspondiente.
> Corrige contentRefs, incluyendo referencias anidadas dentro del feedback.
> No inventes nuevos módulos ni nuevas etiquetas fuera del vocabulario permitido.

### 2. Traducción técnica validada del banco bilingüe

> Genera la versión en inglés del banco de preguntas conservando la estructura JSON original.
> Usa la API de Google Translate como apoyo para acelerar la traducción, pero valida manualmente el resultado técnico antes de entregarlo.
> Traduce prompts, opciones, feedback, pseudocódigo, variables, expresiones y comentarios que estén en español.
> No cambies IDs, dificultad, tipo de pregunta, referencias de contenido ni estructura del banco.
> Antes de entregar, valida que no queden palabras residuales en español y que el pseudocódigo siga siendo coherente con la gramática de AALIE.
> El resultado final debe estar listo para consumo por la UI, no como borrador parcial.

### 3. Conversión estricta a pseudocódigo compatible con la gramática

> Convierte el algoritmo proporcionado al pseudocódigo usado por AALIE sin cambiar su comportamiento.
> No agregues ciclos, no elimines pasos y no reemplaces lógica por procedimientos inexistentes.
> La conversión debe respetar la semántica línea por línea del algoritmo original.
> Usa llamadas con retorno como expresiones, por ejemplo resultado <- funcion(...), y reserva CALL solo para procedimientos sin retorno.
> Asegura que los bloques IF, FOR, WHILE y procedimientos cierren con la sintaxis requerida para evitar errores de parser como no viable alternative.
> Usa literales booleanos compatibles y valida que el resultado pueda analizarse en el editor.

### 4. Especificación de UI pedagógica para explicación de técnica

> Rediseña el modal de técnica algorítmica con enfoque pedagógico.
> El modal no debe tener header tradicional.
> Debe iniciar con el nombre de la técnica detectada, seguido por un icono grande.
> Después debe mostrar el fragmento mínimo de pseudocódigo que evidencia la técnica; si el bloque es grande, resume el cuerpo y conserva cabeceras relevantes.
> Luego explica por qué ese fragmento corresponde a la técnica detectada.
> Al final, incluye por qué importa para el análisis de complejidad y cuál es el error típico que debe evitar el estudiante.
> No uses encabezados internos innecesarios; la explicación debe sentirse directa, clara y didáctica.

### 5. Planificación de sprints bajo restricciones ya definidas

> Organiza la fase de mejoras de AALIE en cinco sprints, respetando la estrategia definida: dos sprints de mantenimiento y tres sprints de features.
> El mantenimiento debe priorizar corrección de WHILE, estabilización del motor, validación matemática, mensajes pedagógicos y pruebas reales.
> Las features deben cubrir exportables institucionales, contenido modular desde JSON, quizzes adaptativos deterministas, carga de .txt y mejoras de UX.
> No separes planeación e implementación en sprints distintos: cada sprint debe cerrar con funcionalidades integradas, demostrables y verificables.
> Para cada sprint, entrega alcance, tareas técnicas, dependencias, riesgos y criterios de aceptación.

### 6. Export institucional desde plantilla LaTeX existente y snapshot único

> Diseña la mejora de exportables de AALIE bajo la regla de snapshot único.
> Ya existe una plantilla base en .tex; úsala como punto de partida y adáptala al flujo real del sistema sin reemplazarla por una estructura genérica.
> Markdown, LaTeX, PDF, ZIP y UI deben derivarse del mismo snapshot de análisis para evitar inconsistencias.
> El export no puede recalcular complejidad ni modificar resultados fuera del snapshot.
> El reporte debe incluir advertencia institucional sobre posibles limitaciones del análisis, metadatos del algoritmo, resultado global, detalle para algoritmos iterativos, detalle para algoritmos recursivos y métodos disponibles cuando aplique.
> El PDF debe conservar el formato académico de la plantilla, incluyendo logos de U. Caldas y AALIE, presentación profesional y trazabilidad mediante snapshotId y contentHash.
> Si falta información, el export debe declararla explícitamente como no disponible, no ocultarla ni inventarla.
