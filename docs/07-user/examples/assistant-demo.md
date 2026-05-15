# Demo: LLM Assistant Interaction

**Objetivo:** Demostrar las capacidades del asistente LLM: explicación de resultados y comparación de análisis.

## Pre-requisitos

- API key configurada en el backend.
- Backend corriendo con conexión a internet.
- El asistente debe estar visible (botón flotante en la esquina inferior derecha).

## Pseudocódigo para la Demo

```pseudocode
exchangeSort(A[n], n) BEGIN
    FOR i <- 1 TO n - 1 DO BEGIN
        FOR j <- i + 1 TO n DO BEGIN
            IF (A[i] > A[j]) THEN BEGIN
                temp <- A[i];
                A[i] <- A[j];
                A[j] <- temp;
            END
        END
    END
    RETURN 0;
END
```

## Pasos en UI — Explicación

1. Ir a `/{locale}/analyzer`.
2. Cargar Exchange Sort (escribir o cargar del catálogo).
3. Hacer clic en **Analyze**.
4. Una vez que los resultados se muestren, hacer clic en el **botón flotante del asistente** (esquina inferior derecha).
5. Escribir una pregunta como:
   - "Explain the by-line costs for this algorithm."
   - "Why is this O(n²)?"
   - "What does T_polynomial mean?"
6. Leer la respuesta del asistente (puede tomar 5–15 segundos).
7. Hacer preguntas de seguimiento:
   - "And what about the best case?"
   - "How does this compare to bubble sort?"

## Pasos en UI — Comparación

1. Con el análisis completo visible, buscar el botón **Compare with LLM**.
2. Hacer clic en el botón. Se abre un modal con barra de progreso.
3. Esperar (10–30 segundos mientras el LLM analiza).
4. Revisar la comparación:
   - **Own Analysis**: O(n²), Ω(n²), Θ(n²)
   - **LLM Analysis**: lo que el LLM haya calculado
   - **Note**: comentario del LLM sobre la precisión del análisis propio
5. (Opcional) Discutir: ¿el LLM acertó? ¿En qué se diferencia?

## Resultado Esperado

### Asistente de Explicación

El asistente debe responder con un texto relevante al contexto actual. Por ejemplo, para una pregunta sobre by-line costs, debe referirse a las líneas específicas y sus costos. La respuesta debe estar en el idioma de la interfaz.

### Comparación con LLM

- El modal de comparación muestra el progreso de la solicitud.
- La respuesta incluye análisis estructurado + nota textual.
- La nota comienza con un emoji y da una observación específica (no genérica).

## Qué Explicar al Estudiante

- El asistente no reemplaza al motor de análisis: es un apoyo pedagógico.
- Las respuestas del LLM pueden contener errores. Siempre verificar contra el análisis determinista.
- La comparación LLM es útil para ver diferentes perspectivas de un mismo algoritmo.
- Sin API key, el asistente no aparece y la comparación no está disponible.
- El análisis determinista funciona con o sin API key.
- Las preguntas deben ser específicas para obtener respuestas útiles.

## Error Común

**Error:** El estudiante hace una pregunta muy genérica ("help me") y recibe una respuesta vaga.
**Corrección:** Enseñar a hacer preguntas específicas y contextualizadas. El asistente funciona mejor con preguntas como "Why is the inner loop O(n)?" que con "explain everything".

## Riesgo de Demo

**Riesgo:** La API key no está configurada → el asistente no aparece. Esto es silencioso (no hay mensaje de error visible).
**Mitigación:** Verificar antes de la demo que `GET /api/llm/status` devuelva `configured: true`. Si no, la demo del asistente no es posible.

## Fallback

Si el asistente no está disponible, mostrar una discusión sin la herramienta: hacer las mismas preguntas y responderlas manualmente basándose en el análisis visible. Explicar que el asistente es un extra opcional.
