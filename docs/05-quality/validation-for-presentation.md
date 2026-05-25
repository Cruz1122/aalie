# Validación para presentación

**Tipo:** normativa (checklist ejecutable)
**Estado:** final
**Audiencia:** evaluador | operador
**Fuente de verdad:** Verificación manual sobre instancia en ejecución
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** testing-strategy, ci-cd

## Propósito

Checklist ejecutable para validar que todos los componentes del sistema responden correctamente antes de una presentación, demo o release.

## Requisitos previos

- API backend iniciada (`python -m uvicorn app.main:app --port 8000`)
- Frontend web iniciado (`pnpm dev`)
- Dependencias instaladas (`pnpm install`, `pip install -r requirements.txt`)
- Gramática instalada (`pip install -e packages/grammar/py` si existe)

## Checklist

### 1. Backend responde
- [ ] `curl http://localhost:8000/health` → `{"status": "ok"}` (o similar)
- [ ] Swagger UI en `http://localhost:8000/docs` carga sin errores

### 2. Frontend carga
- [ ] `http://localhost:3000` carga sin errores de consola
- [ ] La página de inicio muestra el layout correcto (header, navegación)

### 3. Parser de pseudocódigo
- [ ] `POST /grammar/parse` con pseudocódigo válido retorna AST:
  ```json
  {"ok": true, "ast": {"type": "Program", "body": [...]}}
  ```
- [ ] Pseudocódigo inválido retorna error con lista de errores de parseo
- [ ] **Algoritmo de prueba:**
  ```aalie
  factorial(n) BEGIN
    IF (n <= 1) THEN BEGIN
      RETURN 1;
    END
    RETURN n * factorial(n - 1);
  END
  ```

### 4. Analizador de complejidad
- [ ] `POST /analyze/open` con pseudocódigo válido retorna análisis completo
- [ ] La respuesta incluye: `worst`/`best`/`avg` con `byLine`, `totals`, `T_open`, notación asintótica
- [ ] **Algoritmo de prueba:** `bubbleSort`, `mergeSort`, `binarySearch`
- [ ] Algoritmo WHILE produce `whileBlocks` con `patternUsed` e `iterationsClass`

### 5. Traza (trace)
- [ ] `POST /analyze/trace` con pseudocódigo válido retorna `structuredTrace`
- [ ] La traza incluye pasos con `kind`, `depth`, explicaciones
- [ ] **Algoritmo de prueba:** `factorial` (traza recursiva), `WHILE i<n DO i←i+1` (traza iterativa)

### 6. Exportación Markdown
- [ ] `POST /export/report` con `format=markdown` retorna documento Markdown
- [ ] El documento incluye: portada, análisis de complejidad, tabla de líneas

### 7. Exportación PDF
- [ ] `POST /export/report` con `format=pdf` retorna archivo PDF binario
- [ ] Si `reportlab` no está instalado, el endpoint retorna error graceful (no crash)
- [ ] El PDF incluye al menos: título, notación asintótica, tabla de byLine

### 8. Quizzes — inicio de sesión
- [ ] `POST /quizzes/attempts` con configuración de quiz retorna `sessionId` y primera pregunta
- [ ] La sesión incluye: `questions` (lista), `totalQuestions`, `timeLimit`

### 9. Quizzes — evaluación
- [ ] `POST /quizzes/attempts/evaluate` con respuestas válidas retorna resultados
- [ ] Los resultados incluyen: `score`, `correctAnswers`, `totalQuestions`, retroalimentación por pregunta

### 10. LLM assistant (si configurado)
- [ ] `POST /llm/ask` con pregunta sobre análisis retorna respuesta del asistente
- [ ] Si no hay API key configurada, el endpoint retorna error graceful

### 11. Demo sin LLM (determinista)
- [ ] Toda la funcionalidad de análisis, traza y export funciona sin conexión a LLM
- [ ] No hay dependencia de red para el análisis de algoritmos

### 12. Páginas de contenido
- [ ] `http://localhost:3000/examples` carga lista de ejemplos
- [ ] `http://localhost:3000/course/XX-slug` carga módulo del curso
- [ ] `http://localhost:3000/quizzes` carga dashboard de quizzes

## Criterios de aceptación

| Componente | Mínimo | Ideal |
|---|---|---|
| Backend health | Responde 200 | Responde en < 500ms |
| Parseo | AST válido para código canónico | Errores claros para código inválido |
| Análisis | Clasificación correcta para bubbleSort, mergeSort, factorial | WHILE bounded/unbounded correcto |
| Traza | Pasos presentes para algoritmo recursivo | Explicaciones pedagógicas por paso |
| Export Markdown | Documento con secciones obligatorias | Formato consistente con LaTeX |
| Export PDF | Archivo generado (o fallback graceful) | Mismo contenido que Markdown |
| Quizzes | Sesión iniciada y evaluada | Retroalimentación detallada |
| LLM | Graceful degradation si no configurado | Respuestas contextuales si configurado |
| Frontend | Páginas principales cargan | Navegación completa sin errores de consola |

## Notas

- Los endpoints de export PDF pueden fallar si `reportlab` no está instalado. Verificar con `pip list | grep reportlab`.
- Los endpoints de LLM requieren variable de entorno `OPENAI_API_KEY` (u otro proveedor configurado).
- La demo debe funcionar completamente en modo determinista (sin LLM). El LLM es un añadido no crítico.
