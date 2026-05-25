# Demo: Export Report Generation

**Objetivo:** Demostrar la exportación de resultados de análisis en los cuatro formatos disponibles. El estudiante debe entender qué contiene cada formato y cuándo usar cada uno.

## Pseudocódigo

```pseudocode
selectionSort(A[n], n) BEGIN
    FOR i <- 1 TO n - 1 DO BEGIN
        minIndice <- i;
        FOR j <- i + 1 TO n DO BEGIN
            IF (A[j] < A[minIndice]) THEN BEGIN
                minIndice <- j;
            END
        END
        temp <- A[i];
        A[i] <- A[minIndice];
        A[minIndice] <- temp;
    END
    RETURN 0;
END
```

## Pasos en UI

1. Ir a `/{locale}/analyzer`.
2. Escribir el código de Selection Sort (o cargarlo del catálogo de ejemplos).
3. Hacer clic en **Analyze** y esperar los resultados.
4. Hacer clic en **Export**.
5. En el selector de formato:
   - Ver los 4 formatos disponibles.
   - Leer las descripciones de cada uno.
6. Seleccionar **Markdown** y hacer clic en **Generate**.
   - El archivo `.md` se descarga automáticamente.
   - Abrirlo para verificar el contenido.
7. Repetir con **ZIP**:
   - Descargar y extraer el ZIP.
   - Verificar que contiene `report.md`, `snapshot.json` y `manifest.json`.
8. (Opcional) Si el backend tiene pdflatex, probar **PDF**.
9. (Opcional) Probar **LaTeX** y compilarlo localmente.

## Resultado Esperado

### Markdown (descargado: `selection-sort.md`)

Debe contener:
- Encabezado con nombre del algoritmo y fecha de análisis.
- Pseudocódigo original.
- Tabla de costos por línea con formato Markdown.
- Ecuación T(n) y T_polynomial.
- Notación asintótica O/Ω/Θ (worst, best, avg si aplica).
- Procedimiento paso a paso.
- Advertencias (si las hay).

### ZIP (descargado: `selection-sort.zip`)

Contenido:

```
selection-sort/
  report.md            # Mismo contenido que Markdown
  snapshot.json        # Datos completos del análisis en JSON
  manifest.json        # Metadatos del export
```

`snapshot.json` debe incluir: `source`, `classification`, `totals`, `byLine`, `procedure`, `warnings`.

`manifest.json` debe incluir: `exportVersion`, `timestamp`, `algorithmName`, `locale`.

## Qué Explicar al Estudiante

- Todos los formatos vienen del mismo snapshot, por lo que son consistentes entre sí.
- El Markdown es el formato más práctico para uso diario.
- El ZIP es el más completo porque incluye los datos crudos (JSON) además del reporte.
- El PDF requiere pdflatex en el servidor; si falla, no es culpa del análisis sino del entorno.
- El export no recalcula nada: es una foto del análisis en el momento en que se exportó.
- Si se modifica el código después de exportar, el export no refleja los cambios.

## Error Común

**Error:** El estudiante espera que el PDF contenga gráficos o visualizaciones.
**Corrección:** El PDF incluye el mismo contenido que Markdown: texto, tablas y fórmulas matemáticas, pero no las visualizaciones interactivas (árbol de recursión, diagramas).

## Riesgo de Demo

**Riesgo:** PDF falla silenciosamente (descarga un archivo corrupto o no descarga nada).
**Mitigación:** Tener Markdown y ZIP como respaldo. No prometer PDF funcionando si no se ha verificado pdflatex.

## Fallback

Si el export no funciona (error del backend), mostrar capturas de pantalla de los formatos exportados previamente. Explicar que el error es del pipeline de export, no del análisis.
