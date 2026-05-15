# Auditoría implementación quizzes

**Estado:** reemplazado
**Reemplazado por:** `quizzes-quality.md` (pendiente)
**Nota:** Documento histórico. Las observaciones de implementación migraron al reporte de calidad en `quizzes-quality.md`.

## Ya existe
- Banco JSON canónico cargando desde `packages/content-data/quizzes/ada-quiz-bank.json`.
- Taxonomía JSON cargando y validando `topic`, `tags`, `skillIds`.
- Módulo backend `quizzes` con `repository`, `validator`, `selector`, `grading`, `service`, `router`.
- Endpoints de health/taxonomy/summary/validate y creación/evaluación de intento.
- Evaluación determinista para `all_or_nothing`, `exact_set`, `partial_credit`, `ordered_exact`, `pairwise`.
- UI base de quizzes con render para los 5 tipos.
- Persistencia local mínima de progreso en `aalie.quiz.progress.v1`.

## Parcial
- Selector adaptativo existente pero con reglas más complejas de score y menor trazabilidad narrativa por decisión.
- UI funcional pero sin flujo guiado por pregunta (inicio -> navegación -> cierre) completamente pulido.
- Resultados mostraban explicación general, pero no feedback visible de opción elegida en todos los casos.
- Estados vacíos y microcopy de errores incompletos.

## Falta
- Estandarizar razón legible de selección (`selectionReason`) por pregunta seleccionada.
- Reglas simples explícitas de dificultad (subir/bajar/mantener) con base en últimos resultados.
- Regla explícita de refuerzo de topic fallado y cobertura sin repetición excesiva de topic/type.
- UX completa de intento: navegación, validación de respuesta incompleta, empty/error states claros.

## No tocar
- Contrato base de dataset JSON y taxonomía existente.
- Motor de grading determinista existente.
- Endpoints ya operativos.
- Componentes de render por tipo ya implementados, salvo completar huecos UX.

## Delta recomendado
- Selector: simplificar reglas a dificultad por desempeño reciente + refuerzo por topic fallado + cobertura sin repetición + fallback determinista.
- Selector: agregar `selectionReason` (`code`, `message`, `topic`, `difficulty`).
- Frontend: mantener componentes actuales y completar flujo guiado por pregunta con navegación y mensajes de estado.
- Resultados: mostrar feedback de opción elegida, explicación y links de contenido.
