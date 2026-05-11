# Cierre de implementación quizzes

## Lo existente que se conservó
- Contrato base de dataset JSON y taxonomía ADA.
- Estructura del módulo backend `quizzes` (repository, validator, grading, router).
- Endpoints existentes de quizzes y compatibilidad con rutas legacy.
- Componentes de pregunta por tipo y persistencia local básica.

## Cambios realizados
- Selector:
  - Se simplificó a reglas deterministas explícitas por dificultad, refuerzo por tema y cobertura sin repetición excesiva.
  - Se agregó `selectionReason` legible por pregunta seleccionada.
  - Se mantuvo determinismo por orden estable de `questionId`.
- Frontend:
  - Flujo completo de intento: inicio -> pregunta actual -> navegación -> envío -> resultados.
  - Se agregó progreso visual de pregunta actual.
  - Se agregó validación de pregunta incompleta antes de avanzar.
  - Se agregó estado vacío de banco y microcopy de error backend.
  - Resultados muestran feedback de opción elegida, explicación y links de contenido.
- Validaciones:
  - Validador bloquea bancos con más de 50 preguntas y menos de 5.
  - Reporte de cobertura agrega `byStatus` y `coverageWarnings`.

## Reglas deterministas implementadas
- Dificultad siguiente basada en últimos 3 resultados:
  - accuracy >= 0.8: subir dificultad.
  - accuracy < 0.5: bajar dificultad.
  - en otro caso: mantener.
- Refuerzo de tema:
  - si hubo fallo reciente, prioriza el mismo `topic`.
  - si se recibe `weakTopics`, usa ese tópico primero.
- Cobertura y anti-repetición:
  - evita repetir `questionId` visto si hay alternativa.
  - evita más de 2 seguidas del mismo `topic` o `type` cuando hay alternativas.
- Fallback:
  - si no hay suficientes candidatas, usa fallback determinista y reporta warning.

## Flujo UI implementado
1. Pantalla inicial para crear intento.
2. Carga de bloque de preguntas desde API.
3. Render de pregunta actual con tema/dificultad/tipo.
4. Respuesta por tipo (`single_choice`, `multiple_choice`, `true_false`, `ordering`, `match_pairs`).
5. Navegación anterior/siguiente.
6. Finalización de intento y envío al backend.
7. Vista de resultado con score y accuracy.
8. Feedback por respuesta seleccionada + explicación general.
9. Áreas a reforzar + links a contenido.

## Casos probados manualmente
- Validación de banco: `python apps/api/scripts/validate_quiz_bank.py`.
- Cobertura de banco con gate crítico: `python apps/api/scripts/report_quiz_bank_coverage.py --fail-on-critical`.
- Pruebas backend de quizzes: `pytest apps/api/tests/unit/quizzes`.
- Flujo de selector determinista con fallback y razones de selección vía tests unitarios.

## Limitaciones conscientes
- La UI no incluye pruebas web automáticas en este alcance.
- La persistencia de intento en backend sigue stateless (sin DB), por decisión de alcance.
- La trazabilidad de selección se devuelve en backend (`selectionTrace`) y no se muestra completa en UI para no saturar.
