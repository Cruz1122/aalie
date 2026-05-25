# Demo: Step-by-Step Trace Walkthrough

**Objetivo:** Demostrar la funcionalidad de traza de ejecución paso a paso. El estudiante debe aprender a usar la traza para verificar el comportamiento de un algoritmo.

## Pseudocódigo

```pseudocode
factorialIterativo(n) BEGIN
    resultado <- 1;
    FOR i <- 2 TO n DO BEGIN
        resultado <- resultado * i;
    END
    RETURN resultado;
END
```

## Pasos en UI

1. Ir a `/{locale}/analyzer`.
2. Escribir o cargar el pseudocódigo.
3. Hacer clic en **Analyze** y esperar los resultados.
4. Cambiar la vista de **Analysis** a **Trace** (usando el selector de vista).
5. Configurar el valor de entrada:
   - Buscar el campo de entrada para `n`.
   - Ingresar `n = 5`.
6. Usar los controles de traza:
   - **Step Forward** (`→`): avanzar un paso.
   - **Step Backward** (`←`): retroceder un paso.
   - **Auto-Play**: reproducir automáticamente.
7. Observar el panel de estado que cambia en cada paso:
   - Línea resaltada en el código.
   - Valores de variables (`resultado`, `i`) que se actualizan.
   - Evaluación de condiciones (verdadero/falso).
8. Verificar que:
   - `i` va de 2 a 5 (4 iteraciones).
   - `resultado` cambia: 1 → 2 → 6 → 24 → 120.
   - El RETURN final devuelve 120.

## Resultado Esperado

La traza debe mostrar 4 iteraciones del FOR (i=2,3,4,5) más los pasos de inicialización y retorno.

**Secuencia de pasos esperada (aproximada):**

| Paso | Línea | Variable | Valor | Acción |
|------|-------|----------|-------|--------|
| 1 | resultado <- 1 | resultado | 1 | Asignación |
| 2 | FOR i <- 2 | i | 2 | Inicio del bucle |
| 3 | i <= n? (2 <= 5) | - | true | Condición |
| 4 | resultado * i | resultado | 2 | Multiplicación |
| 5 | i++ | i | 3 | Incremento |
| 6 | i <= n? (3 <= 5) | - | true | Condición |
| ... | ... | ... | ... | ... |
| 14 | RETURN resultado | - | 120 | Retorno |

## Qué Explicar al Estudiante

- La traza conecta el análisis abstracto (T(n) = O(n)) con la ejecución concreta (4 iteraciones para n=5).
- Cada cambio de variable, evaluación de condición y retorno se registra como un evento.
- El estudiante puede verificar que el bucle se ejecuta `n-1` veces (4 para n=5).
- Para algoritmos recursivos, la traza también muestra profundidad de recursión, llamadas y retornos.
- El autoplay es útil para ver el flujo completo sin clics manuales.

## Error Común

**Error:** El estudiante no configura un valor de entrada y la traza no tiene datos para mostrar.
**Corrección:** Explicar que la traza necesita valores concretos para las variables de entrada. Sin ellos, la traza no puede ejecutar pasos.

## Riesgo de Demo

**Riesgo:** Para n muy grande (ej. n=1000), la traza tendrá demasiados pasos y será difícil de navegar.
**Mitigación:** Usar n pequeño (entre 3 y 6) para mantener la traza manejable.

## Fallback

Si la traza no está disponible (error del backend), mostrar el análisis estático y explicar que la traza es un servicio complementario que puede fallar independientemente. Usar `bubbleSort` con n=4 como alternativa, que muestra un bucle anidado en la traza.
