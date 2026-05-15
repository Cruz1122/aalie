# Demo: Quiz Attempt and Evaluation

**Objetivo:** Demostrar el flujo completo de un quiz: inicio, respuesta de preguntas, envío y revisión de resultados.

## Pre-requisitos

- El backend debe estar funcionando (el quiz usa endpoints `/api/quizzes/session` y `/api/quizzes/evaluate`).
- Debe haber preguntas disponibles para al menos un módulo del curso.

## Pasos en UI

1. Ir a `/{locale}/quizzes`.
2. Observar el dashboard:
   - **Cards de módulos**: una por cada módulo del curso con un botón **Start Quiz**.
   - **Resumen de progreso**: si hay intentos anteriores, se ven las estadísticas.
   - **Half-roulette wheel**: muestra visualmente la precisión general.
3. Hacer clic en **Start Quiz** en un módulo (ej. "Time and Space Complexity").
4. (Opcional) En el modal de inicio, configurar:
   - `questionCount`: elegir 3 preguntas (para una demo rápida).
   - Dejar los demás valores por defecto.
5. Hacer clic en **Start** para comenzar.
6. Responder las preguntas:
   - **Pregunta 1**: puede ser de opción única. Seleccionar una respuesta.
   - **Pregunta 2**: puede ser verdadero/falso. Usar el toggle.
   - **Pregunta 3**: puede ser de opción múltiple. Marcar las correctas.
   - Usar **Previous** / **Next** para navegar.
   - Observar la **barra de progreso** que se llena.
7. Cuando todas las preguntas estén respondidas, hacer clic en **Finish**.
8. Esperar la evaluación (1–3 segundos).
9. Revisar el **Summary**:
   - Puntaje (ej. "2 / 3").
   - Precisión (ej. "66.7%").
   - AALIE face según el resultado.
   - **Strengths** y **Areas to Improve**.
10. Hacer clic en **Next** para revisar cada pregunta.
    - Ver la respuesta propia marcada.
    - Ver la respuesta correcta.
    - Leer el feedback.

## Resultado Esperado

- El quiz carga preguntas del backend.
- Las preguntas se muestran una por una.
- Se puede navegar libremente entre preguntas.
- La barra de progreso refleja cuántas preguntas tienen respuesta.
- El botón **Finish** se habilita solo cuando todas las preguntas están completas.
- Después de enviar, el backend evalúa y devuelve: score, accuracy, strengths, areasToImprove, y resultados por pregunta.
- El resumen y la revisión son navegables.
- Al salir, el progreso se guarda en localStorage.

## Qué Explicar al Estudiante

- Los quizzes están vinculados a módulos del curso: las preguntas vienen del banco de ese módulo.
- La selección de preguntas es determinista pero no predecible (usa el backend para elegir).
- Las respuestas se evalúan en el backend, no localmente.
- El progreso (mastery por habilidad) se guarda en el navegador.
- Las áreas a mejorar son habilidades específicas donde se cometieron errores.
- Se puede repasar el contenido del curso correspondiente a esas áreas.

## Error Común

**Error:** El estudiante cierra el navegador antes de hacer clic en **Finish** y pierde las respuestas.
**Corrección:** Explicar que las respuestas solo se envían al hacer clic en Finish. Cerrar el navegador descarta las respuestas no enviadas.

## Riesgo de Demo

**Riesgo:** El módulo seleccionado no tiene preguntas en el banco (aparece "No questions available").
**Mitigación:** Verificar previamente qué módulos tienen preguntas usando `/api/quizzes/summary`. Elegir un módulo con al menos 3 preguntas disponibles.

## Fallback

Si el quiz no funciona (backend caído), mostrar capturas de pantalla del dashboard y del flujo de preguntas. Explicar que la funcionalidad depende del backend de quizzes.
